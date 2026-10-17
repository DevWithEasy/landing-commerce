<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

test('prevents overselling under high concurrency on MySQL with pessimistic row locking', function () {
    // Ensure MySQL database name is not ':memory:' from phpunit.xml
    if (config('database.connections.mysql.database') === ':memory:' || empty(config('database.connections.mysql.database'))) {
        config(['database.connections.mysql.database' => 'laravel']);
    }

    // Check if MySQL connection is available
    try {
        DB::connection('mysql')->getPdo();
    } catch (Throwable $e) {
        $this->markTestSkipped('MySQL connection not available: '.$e->getMessage());
    }

    // Set up product and variant with strictly 1 item in stock
    $product = Product::on('mysql')->firstOrCreate(
        ['slug' => 'pessimistic-lock-concurrency-test'],
        [
            'title' => 'High Concurrency Test Item',
            'regular_price' => 999.00,
            'has_variants' => false,
            'status' => 'active',
        ]
    );

    $variant = ProductVariant::on('mysql')->where('product_id', $product->id)->first();
    if (! $variant) {
        $variant = ProductVariant::on('mysql')->create([
            'product_id' => $product->id,
            'sku' => 'PESSIMISTIC-TEST-1',
            'name' => 'Default',
            'regular_price' => 999.00,
            'stock_quantity' => 1,
            'manage_stock' => true,
        ]);
    } else {
        $variant->update(['stock_quantity' => 1, 'manage_stock' => true]);
    }

    expect($variant->fresh()->stock_quantity)->toBe(1);

    $phpBinary = PHP_BINARY;
    $workerScript = base_path('tests/Fixtures/concurrency_worker.php');

    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];

    $processes = [];
    $pipes = [];
    $workerCount = 5;

    // Launch worker processes concurrently
    for ($i = 1; $i <= $workerCount; $i++) {
        $cmd = "\"{$phpBinary}\" \"{$workerScript}\" {$variant->id} \"Customer_{$i}\"";
        $proc = proc_open($cmd, $descriptors, $p);
        if (is_resource($proc)) {
            $processes[$i] = $proc;
            $pipes[$i] = $p;
        }
    }

    $results = [];

    // Collect responses from all parallel workers
    foreach ($processes as $i => $proc) {
        $stdout = stream_get_contents($pipes[$i][1]);
        $stderr = stream_get_contents($pipes[$i][2]);
        fclose($pipes[$i][0]);
        fclose($pipes[$i][1]);
        fclose($pipes[$i][2]);
        $exitCode = proc_close($proc);
        $results[$i] = [
            'stdout' => trim($stdout),
            'stderr' => trim($stderr),
            'exitCode' => $exitCode,
        ];
    }

    $successCount = 0;
    $exhaustedCount = 0;
    $errorCount = 0;

    foreach ($results as $res) {
        if (str_starts_with($res['stdout'], 'SUCCESS:201')) {
            $successCount++;
        } elseif (str_starts_with($res['stdout'], 'EXHAUSTED:422')) {
            $exhaustedCount++;
        } else {
            $errorCount++;
        }
    }

    expect($errorCount)->toBe(0)
        ->and($successCount)->toBe(1)
        ->and($exhaustedCount)->toBe(4);

    // Verify in MySQL that stock is exactly 0 and never went negative
    $variant->refresh();
    expect($variant->stock_quantity)->toBe(0);
})->group('concurrency', 'mysql');
