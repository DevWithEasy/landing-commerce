<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Backup\Exceptions\RestoreFailedException;
use App\Modules\Backup\Services\RestoreService;
use App\Modules\Catalog\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Setup clean storage disks
    Storage::fake('public');

    // Clean up test backups directory
    $backupDir = storage_path('app/backups');
    if (File::isDirectory($backupDir)) {
        File::deleteDirectory($backupDir);
    }
    File::makeDirectory($backupDir, 0755, true);
    File::makeDirectory($backupDir.'/snapshots', 0755, true);
});

afterEach(function () {
    $backupDir = storage_path('app/backups');
    if (File::isDirectory($backupDir)) {
        File::deleteDirectory($backupDir);
    }
});

test('commerce:backup generates a valid zip archive with database.sql and manifest.json', function () {
    Product::create([
        'title' => 'Backup Test Product',
        'slug' => 'backup-test-product',
        'regular_price' => 1500.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    Artisan::call('commerce:backup', [
        '--filename' => 'test_backup.zip',
    ]);

    $backupPath = storage_path('app/backups/test_backup.zip');
    expect(file_exists($backupPath))->toBeTrue();

    $zip = new ZipArchive;
    expect($zip->open($backupPath))->toBeTrue();

    // Verify root files
    expect($zip->locateName('database.sql'))->not->toBeFalse()
        ->and($zip->locateName('manifest.json'))->not->toBeFalse();

    // Verify manifest contents
    $manifestContent = $zip->getFromName('manifest.json');
    $manifest = json_decode((string) $manifestContent, true);

    expect($manifest)->toHaveKeys(['version', 'app', 'created_at', 'database', 'media'])
        ->and($manifest['database']['sha256'])->toBeString()->toHaveLength(64)
        ->and($manifest['database']['tables_count'])->toBeGreaterThan(0);

    // Verify SQL contents
    $sqlContent = (string) $zip->getFromName('database.sql');
    expect($sqlContent)->toContain('Backup Test Product')
        ->and($sqlContent)->toContain('backup-test-product');

    $zip->close();
});

test('commerce:backup includes uploaded public media and excludes forbidden files', function () {
    // Store legitimate media
    Storage::disk('public')->put('products/sample1.webp', 'image-binary-data-1');
    Storage::disk('public')->put('banners/hero.webp', 'image-binary-data-2');

    // Store forbidden / sensitive files
    Storage::disk('public')->put('.env', 'APP_KEY=secret-forbidden');
    Storage::disk('public')->put('products/.env.production', 'SECRET=leak');
    Storage::disk('public')->put('ssl/server.key', 'RSA-PRIVATE-KEY');
    Storage::disk('public')->put('.hidden_file', 'hidden-content');

    Artisan::call('commerce:backup', [
        '--filename' => 'media_test_backup.zip',
    ]);

    $backupPath = storage_path('app/backups/media_test_backup.zip');
    $zip = new ZipArchive;
    $zip->open($backupPath);

    // Legitimate files should be packaged under media/
    expect($zip->locateName('media/products/sample1.webp'))->not->toBeFalse()
        ->and($zip->locateName('media/banners/hero.webp'))->not->toBeFalse();

    // Sensitive files must NOT be in the archive
    expect($zip->locateName('media/.env'))->toBeFalse()
        ->and($zip->locateName('.env'))->toBeFalse()
        ->and($zip->locateName('media/products/.env.production'))->toBeFalse()
        ->and($zip->locateName('media/ssl/server.key'))->toBeFalse()
        ->and($zip->locateName('media/.hidden_file'))->toBeFalse();

    $manifest = json_decode((string) $zip->getFromName('manifest.json'), true);
    expect($manifest['media']['included'])->toBeTrue()
        ->and($manifest['media']['files_count'])->toBe(2);

    $zip->close();
});

test('commerce:backup with --no-media flag excludes media', function () {
    Storage::disk('public')->put('products/sample.webp', 'some-data');

    Artisan::call('commerce:backup', [
        '--no-media' => true,
        '--filename' => 'no_media_backup.zip',
    ]);

    $backupPath = storage_path('app/backups/no_media_backup.zip');
    $zip = new ZipArchive;
    $zip->open($backupPath);

    expect($zip->locateName('media/products/sample.webp'))->toBeFalse();

    $manifest = json_decode((string) $zip->getFromName('manifest.json'), true);
    expect($manifest['media']['included'])->toBeFalse();

    $zip->close();
});

test('commerce:restore rejects path traversal and malicious filenames', function () {
    $restoreService = app(RestoreService::class);

    expect(fn () => $restoreService->resolveBackupPath('../../secret.zip'))
        ->toThrow(InvalidArgumentException::class, 'Directory traversal');

    expect(fn () => $restoreService->resolveBackupPath("test\0bad.zip"))
        ->toThrow(InvalidArgumentException::class, 'Directory traversal');
});

test('commerce:restore rejects non-existent or corrupt backup archives', function () {
    $restoreService = app(RestoreService::class);

    // Non-existent file
    expect(fn () => $restoreService->restore('does_not_exist.zip'))
        ->toThrow(InvalidArgumentException::class);

    // Corrupt archive
    $corruptPath = storage_path('app/backups/corrupt.zip');
    file_put_contents($corruptPath, 'NOT A REAL ZIP FILE CONTENT');

    expect(fn () => $restoreService->restore('corrupt.zip'))
        ->toThrow(RuntimeException::class, 'Corrupt or invalid backup ZIP archive');
});

test('commerce:restore rejects archive missing required manifest or database.sql', function () {
    $invalidZipPath = storage_path('app/backups/missing_files.zip');
    $zip = new ZipArchive;
    $zip->open($invalidZipPath, ZipArchive::CREATE);
    $zip->addFromString('dummy.txt', 'hello world');
    $zip->close();

    $restoreService = app(RestoreService::class);

    expect(fn () => $restoreService->restore('missing_files.zip'))
        ->toThrow(RuntimeException::class, "missing required 'manifest.json' or 'database.sql'");
});

test('commerce:restore rejects archive when database.sql SHA-256 checksum mismatches', function () {
    $tamperedZipPath = storage_path('app/backups/tampered.zip');
    $zip = new ZipArchive;
    $zip->open($tamperedZipPath, ZipArchive::CREATE);

    $sql = "SET FOREIGN_KEY_CHECKS = 0;\n";
    $tamperedSql = "SET FOREIGN_KEY_CHECKS = 0;\n-- Tampered content\n";
    $fakeSha = hash('sha256', 'original sql content');

    $manifest = [
        'version' => '1.0.0',
        'database' => [
            'sha256' => $fakeSha,
        ],
    ];

    $zip->addFromString('manifest.json', json_encode($manifest));
    $zip->addFromString('database.sql', $tamperedSql);
    $zip->close();

    $restoreService = app(RestoreService::class);

    expect(fn () => $restoreService->restore('tampered.zip'))
        ->toThrow(RuntimeException::class, 'Integrity verification failed');
});

test('commerce:restore rejects archives containing zip-slip attacks', function () {
    $slipZipPath = storage_path('app/backups/zip_slip.zip');
    $zip = new ZipArchive;
    $zip->open($slipZipPath, ZipArchive::CREATE);

    $sql = "SET FOREIGN_KEY_CHECKS = 0;\n";
    $manifest = [
        'version' => '1.0.0',
        'database' => ['sha256' => hash('sha256', $sql)],
    ];

    $zip->addFromString('manifest.json', json_encode($manifest));
    $zip->addFromString('database.sql', $sql);
    // Add malicious path traversal entry
    $zip->addFromString('../../../etc/malicious.txt', 'pwned');
    $zip->close();

    $restoreService = app(RestoreService::class);

    expect(fn () => $restoreService->restore('zip_slip.zip'))
        ->toThrow(RuntimeException::class, 'Unsafe entry detected');
});

test('commerce:restore rejects invalid or unsafe SQL syntax before execution', function () {
    $invalidSql = 'UNRECOGNIZED_COMMAND table_foo DROP;';
    $restoreService = app(RestoreService::class);

    expect(fn () => $restoreService->validateSqlSyntax($invalidSql))
        ->toThrow(RuntimeException::class, 'Disallowed or unrecognized SQL command');

    $unclosedQuoteSql = "INSERT INTO users VALUES ('unclosed string);";
    expect(fn () => $restoreService->validateSqlSyntax($unclosedQuoteSql))
        ->toThrow(RuntimeException::class, 'Unclosed quoted string');
});

test('commerce:restore successfully restores database records, media, and creates pre-restore snapshot', function () {
    // 1. Create a product in database and media file
    $originalProduct = Product::create([
        'title' => 'Original Restored Product',
        'slug' => 'original-restored-product',
        'regular_price' => 2200.00,
        'has_variants' => false,
        'status' => 'active',
    ]);
    Storage::disk('public')->put('products/original.webp', 'original-image-content');

    // 2. Take backup
    Artisan::call('commerce:backup', [
        '--filename' => 'success_restore.zip',
    ]);

    // 3. Mutate the state: delete product, change media
    $originalProduct->delete();
    Storage::disk('public')->delete('products/original.webp');
    Storage::disk('public')->put('products/mutated.webp', 'mutated-content');

    expect(Product::where('slug', 'original-restored-product')->exists())->toBeFalse();
    expect(Storage::disk('public')->exists('products/original.webp'))->toBeFalse();

    // 4. Restore the backup with pre-restore snapshot
    $restoreService = app(RestoreService::class);
    $result = $restoreService->restore('success_restore.zip', [
        'pre_restore_snapshot' => true,
        'include_media' => true,
    ]);

    // 5. Verify product is back
    expect(Product::where('slug', 'original-restored-product')->exists())->toBeTrue();
    $restored = Product::where('slug', 'original-restored-product')->first();
    expect((float) $restored->regular_price)->toEqual(2200.00);

    // 6. Verify media is restored
    expect(Storage::disk('public')->exists('products/original.webp'))->toBeTrue()
        ->and(Storage::disk('public')->get('products/original.webp'))->toBe('original-image-content');

    // 7. Verify pre-restore snapshot was generated in snapshots directory
    expect($result['snapshot_path'])->not->toBeNull()
        ->and(file_exists($result['snapshot_path']))->toBeTrue();
});

test('commerce:restore command runs interactively with confirmation and supports --force', function () {
    // Backup
    Artisan::call('commerce:backup', [
        '--filename' => 'cli_test.zip',
    ]);

    // Running with --force should succeed without prompt
    $exitCode = Artisan::call('commerce:restore', [
        'file' => 'cli_test.zip',
        '--force' => true,
    ]);

    expect($exitCode)->toBe(0);
});

test('commerce:restore on SQL failure retains pre-restore snapshot and provides recovery instructions', function () {
    // Create broken backup archive with bad SQL inside
    $brokenZipPath = storage_path('app/backups/broken_exec.zip');
    $zip = new ZipArchive;
    $zip->open($brokenZipPath, ZipArchive::CREATE);

    // Valid keyword syntax, but executing will fail (syntax error after valid prefix)
    $badSql = "CREATE TABLE non_existent_table (id INT, PRIMARY KEY (id));\n".
              "INSERT INTO table_that_does_not_exist_xyz VALUES (1, 2, 3);\n";

    $manifest = [
        'version' => '1.0.0',
        'database' => [
            'sha256' => hash('sha256', $badSql),
        ],
    ];

    $zip->addFromString('manifest.json', json_encode($manifest));
    $zip->addFromString('database.sql', $badSql);
    $zip->close();

    $restoreService = app(RestoreService::class);

    try {
        $restoreService->restore('broken_exec.zip', ['pre_restore_snapshot' => true]);
        test()->fail('Expected RestoreFailedException was not thrown.');
    } catch (RestoreFailedException $e) {
        expect($e->getSnapshotPath())->not->toBeNull()
            ->and(file_exists((string) $e->getSnapshotPath()))->toBeTrue()
            ->and($e->getMessage())->toContain('[RECOVERY SNAPSHOT AVAILABLE]')
            ->and($e->getMessage())->toContain('php artisan commerce:restore');
    }
});

test('manage-backups gate authorizes super_admin and rejects store_manager and fulfillment_agent', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $storeManager = User::factory()->create(['role' => 'store_manager']);
    $fulfillmentAgent = User::factory()->create(['role' => 'fulfillment_agent']);

    expect(Gate::forUser($superAdmin)->allows('manage-backups'))->toBeTrue()
        ->and(Gate::forUser($storeManager)->allows('manage-backups'))->toBeFalse()
        ->and(Gate::forUser($fulfillmentAgent)->allows('manage-backups'))->toBeFalse();
});
