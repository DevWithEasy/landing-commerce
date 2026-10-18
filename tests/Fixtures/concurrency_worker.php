<?php

declare(strict_types=1);

use App\Modules\Checkout\Actions\ProcessCodOrderAction;
use App\Modules\Checkout\Exceptions\InsufficientStockException;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Str;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

// Ensure MySQL connection for true pessimistic row locking
config(['database.default' => 'mysql']);
$currentDb = (string) config('database.connections.mysql.database');
if ($currentDb === ':memory:' || empty($currentDb) || str_contains($currentDb, 'sqlite')) {
    config(['database.connections.mysql.database' => 'laravel']);
}

$variantId = (int) ($argv[1] ?? 0);
$customerName = (string) ($argv[2] ?? 'Test Customer');

$action = app(ProcessCodOrderAction::class);
$idempotencyKey = (string) Str::uuid();

try {
    $order = $action->execute([
        'customer_name' => $customerName,
        'customer_phone' => '01712345678',
        'delivery_address' => 'Mirpur-10, Dhaka',
        'district' => 'Dhaka',
        'idempotency_key' => $idempotencyKey,
        'items' => [
            ['variant_id' => $variantId, 'quantity' => 1],
        ],
    ]);

    echo "SUCCESS:201:{$order->id}\n";
    exit(0);
} catch (InsufficientStockException $e) {
    echo "EXHAUSTED:422:{$e->getMessage()}\n";
    exit(0);
} catch (Throwable $t) {
    echo 'ERROR:'.$t->getMessage()."\n";
    exit(1);
}
