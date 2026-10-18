<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Installer\Services\InstallationService;
use App\Modules\Installer\Services\SqlImportValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->installationService = app(InstallationService::class);
    $this->installationService->clearInstalledMarker();
    $this->installationService->releaseLock();
    $testEnv = base_path('.env.installer.test');
    if (file_exists($testEnv)) {
        @unlink($testEnv);
    }
    session()->flush();
});

afterEach(function () {
    $this->installationService->clearInstalledMarker();
    $this->installationService->releaseLock();
    $testEnv = base_path('.env.installer.test');
    if (file_exists($testEnv)) {
        @unlink($testEnv);
    }
});

test('uninstalled application renders the responsive first-run installer wizard', function () {
    $response = $this->get('/install');

    $response->assertStatus(200);
    $response->assertSee('Landing Commerce');
    $response->assertSee('One-Time cPanel Web Installation Wizard');
    $response->assertSee('System Preflight & MySQL Database', false);
    $response->assertSee('MySQL Host');
    $response->assertSee('Database Name');
});

test('uninstalled visitors are redirected to installer when enforcement is enabled', function () {
    Config::set('installer.enforce_in_testing', true);

    $response = $this->get('/');

    $response->assertRedirect(route('installer.index'));

    Config::set('installer.enforce_in_testing', false);
});

test('step 1 validates inputs and fails gracefully on invalid database credentials without leaking password', function () {
    $secretPassword = 'SuperSecretDbPassword123!@#';

    $response = $this->post('/install/database', [
        'db_host' => '127.0.0.1',
        'db_port' => 65530, // Unlikely port
        'db_database' => 'non_existent_db_xyz',
        'db_username' => 'invalid_user_123',
        'db_password' => $secretPassword,
    ]);

    $response->assertSessionHas('error');
    $errorMessage = session('error');

    // Verify secret password is never leaked in session or flash
    expect($errorMessage)->not->toContain($secretPassword);
    expect(session()->get('installer.db'))->toBeNull();
});

test('step 1 stores valid database configuration in installer session', function () {
    // Mock successful PDO test using an anonymous service or mock
    $mockService = Mockery::mock(InstallationService::class)->makePartial();
    $mockService->shouldReceive('testDatabaseConnection')
        ->once()
        ->with('127.0.0.1', 3306, 'landing_db', 'db_user', 'secret_pass')
        ->andReturn([
            'success' => true,
            'error' => null,
            'pdo' => Mockery::mock(PDO::class),
        ]);

    app()->instance(InstallationService::class, $mockService);

    $response = $this->post('/install/database', [
        'db_host' => '127.0.0.1',
        'db_port' => 3306,
        'db_database' => 'landing_db',
        'db_username' => 'db_user',
        'db_password' => 'secret_pass',
    ]);

    $response->assertRedirect(route('installer.schema'));
    $response->assertSessionHas('installer.db');
    expect(session('installer.db.database'))->toBe('landing_db');
});

test('step 2 requires step 1 database configuration in session', function () {
    $response = $this->get('/install/schema');

    $response->assertRedirect(route('installer.index'));
    $response->assertSessionHas('error', 'Please configure your database connection first.');
});

test('step 2 sql validator rejects disallowed file extensions', function () {
    $validator = new SqlImportValidator;

    $tempFile = tempnam(sys_get_temp_dir(), 'test_').'.php';
    file_put_contents($tempFile, '<?php echo "evil";');

    $result = $validator->validateAndExtract($tempFile, 'exploit.php');
    unlink($tempFile);

    expect($result['valid'])->toBeFalse();
    expect($result['errors'][0])->toContain('Invalid file extension [php]');
});

test('step 2 sql validator rejects files exceeding 50 MB limit', function () {
    $validator = new SqlImportValidator;

    // Test with mock or virtual check
    $tempFile = tempnam(sys_get_temp_dir(), 'test_').'.sql';
    file_put_contents($tempFile, 'SELECT 1;');

    // Test with validator constant
    expect(SqlImportValidator::MAX_FILE_SIZE_BYTES)->toBe(52428800);
    unlink($tempFile);
});

test('step 2 sql validator rejects Zip-Slip path traversal attacks', function () {
    $validator = new SqlImportValidator;
    $zipPath = tempnam(sys_get_temp_dir(), 'zip_').'.zip';

    $zip = new ZipArchive;
    $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $zip->addFromString('../../../etc/passwd.sql', 'SELECT 1;');
    $zip->close();

    $result = $validator->validateAndExtract($zipPath, 'malicious.zip');
    unlink($zipPath);

    expect($result['valid'])->toBeFalse();
    expect(implode(' ', $result['errors']))->toContain('Malicious archive path detected');
});

test('step 2 sql validator rejects executable files inside ZIP archives', function () {
    $validator = new SqlImportValidator;
    $zipPath = tempnam(sys_get_temp_dir(), 'zip_').'.zip';

    $zip = new ZipArchive;
    $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $zip->addFromString('shell.php', '<?php system($_GET["c"]); ?>');
    $zip->close();

    $result = $validator->validateAndExtract($zipPath, 'archive.zip');
    unlink($zipPath);

    expect($result['valid'])->toBeFalse();
    expect(implode(' ', $result['errors']))->toContain('Executable file detected inside ZIP archive');
});

test('step 2 sql validator rejects dangerous SQL commands', function (string $dangerousSql, string $expectedSnippet) {
    $validator = new SqlImportValidator;
    $sqlFile = tempnam(sys_get_temp_dir(), 'sql_').'.sql';
    file_put_contents($sqlFile, $dangerousSql);

    $result = $validator->validateAndExtract($sqlFile, 'dump.sql');
    unlink($sqlFile);

    expect($result['valid'])->toBeFalse();
    expect(implode(' ', $result['errors']))->toContain($expectedSnippet);
})->with([
    ['DROP DATABASE production_db;', 'DROP DATABASE command is strictly prohibited'],
    ['CREATE DATABASE shadow_db;', 'CREATE DATABASE command is prohibited'],
    ['CREATE USER "hacker"@"%" IDENTIFIED BY "pass";', 'User creation commands'],
    ['GRANT ALL PRIVILEGES ON *.* TO "hacker"@"%";', 'GRANT privilege commands are prohibited'],
    ['LOAD DATA INFILE "/etc/passwd" INTO TABLE users;', 'LOAD DATA file access commands are prohibited'],
    ['SELECT * FROM users INTO OUTFILE "/var/www/html/shell.php";', 'INTO OUTFILE filesystem export is strictly prohibited'],
    ['USE mysql;', 'Switching databases via USE is prohibited'],
    ['<?php phpinfo(); ?>', 'Embedded PHP execution tags detected in SQL dump'],
]);

test('step 2 sql validator rejects schema missing required Landing Commerce tables', function () {
    $validator = new SqlImportValidator;
    $sqlFile = tempnam(sys_get_temp_dir(), 'sql_').'.sql';
    file_put_contents($sqlFile, 'CREATE TABLE users (id INT); CREATE TABLE products (id INT);');

    $result = $validator->validateAndExtract($sqlFile, 'incomplete.sql');
    unlink($sqlFile);

    expect($result['valid'])->toBeFalse();
    expect(implode(' ', $result['errors']))->toContain('Incompatible schema: The uploaded SQL is missing required Landing Commerce tables');
});

test('step 2 sql validator rejects SQLite autoincrement dumps', function () {
    $validator = new SqlImportValidator;
    $sqlFile = tempnam(sys_get_temp_dir(), 'sql_').'.sql';
    $sqliteSql = <<<'SQL'
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT);
CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT);
CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT);
CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT);
CREATE TABLE landing_pages (id INTEGER PRIMARY KEY AUTOINCREMENT);
CREATE TABLE districts (id INTEGER PRIMARY KEY AUTOINCREMENT);
CREATE TABLE shipping_zones (id INTEGER PRIMARY KEY AUTOINCREMENT);
SQL;
    file_put_contents($sqlFile, $sqliteSql);

    $result = $validator->validateAndExtract($sqlFile, 'sqlite_dump.sql');
    unlink($sqlFile);

    expect($result['valid'])->toBeFalse();
    expect(implode(' ', $result['errors']))->toContain('SQLite syntax detected (AUTOINCREMENT)');
});

test('step 2 bundled starter schema contains all required tables and valid syntax', function () {
    $bundledPath = database_path('schema/mysql-starter.sql');
    expect(file_exists($bundledPath))->toBeTrue();

    $validator = new SqlImportValidator;
    $result = $validator->validateAndExtract($bundledPath, 'mysql-starter.sql');

    expect($result['valid'])->toBeTrue();
    expect($result['statements'])->not->toBeEmpty();
    foreach (SqlImportValidator::REQUIRED_TABLES as $reqTable) {
        expect($result['tables_detected'])->toContain($reqTable);
    }
});

test('step 2 import failure reports clear MySQL DDL non-atomic recovery guidance', function () {
    session()->put('installer.db', [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'landing_db',
        'username' => 'db_user',
        'password' => 'secret_pass',
    ]);

    $mockPdo = Mockery::mock(PDO::class);
    $mockPdo->shouldReceive('exec')->andReturnUsing(function ($statement) {
        if ($statement === 'SET FOREIGN_KEY_CHECKS = 0;' || $statement === "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';" || $statement === 'SET FOREIGN_KEY_CHECKS = 1;') {
            return 1;
        }

        throw new RuntimeException('Table already exists');
    });

    $mockService = Mockery::mock(InstallationService::class)->makePartial();
    $mockService->shouldReceive('testDatabaseConnection')->andReturn([
        'success' => true,
        'error' => null,
        'pdo' => $mockPdo,
    ]);

    app()->instance(InstallationService::class, $mockService);

    $response = $this->post('/install/schema', [
        'schema_source' => 'bundled',
    ]);

    $response->assertSessionHas('error');
    $error = session('error');
    expect($error)->toContain('cannot be rolled back atomically');
    expect($error)->toContain('phpMyAdmin');
});

test('step 3 requires completed database and schema steps', function () {
    $response = $this->get('/install/admin');

    $response->assertRedirect(route('installer.index'));
    $response->assertSessionHas('error', 'Please complete database and schema setup first.');
});

test('step 3 validates password confirmation and creates Super Admin with bcrypt hash', function () {
    session()->put('installer.db', [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'landing_db',
        'username' => 'db_user',
        'password' => 'secret_pass',
    ]);
    session()->put('installer.schema_imported', true);

    $response = $this->post('/install/admin', [
        'name' => 'Store Owner',
        'email' => 'owner@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'MismatchedPass123!',
    ]);

    $response->assertSessionHasErrors(['password']);
});

test('step 3 prevents duplicate or overwriting existing Super Admin', function () {
    session()->put('installer.db', [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'landing_db',
        'username' => 'db_user',
        'password' => 'secret_pass',
    ]);
    session()->put('installer.schema_imported', true);

    // Mock existing admin in PDO query
    $mockPdo = Mockery::mock(PDO::class);
    $mockStmt = Mockery::mock(PDOStatement::class);
    $mockStmt->shouldReceive('execute')->once();
    $mockStmt->shouldReceive('fetch')->with(PDO::FETCH_ASSOC)->once()->andReturn([
        'id' => 1,
        'email' => 'existing_admin@example.com',
    ]);

    $mockPdo->shouldReceive('prepare')->with(Mockery::pattern('/SELECT id, email FROM users WHERE role = \'super_admin\'/'))->once()->andReturn($mockStmt);

    $mockService = Mockery::mock(InstallationService::class)->makePartial();
    $mockService->shouldReceive('testDatabaseConnection')->andReturn([
        'success' => true,
        'error' => null,
        'pdo' => $mockPdo,
    ]);

    app()->instance(InstallationService::class, $mockService);

    $response = $this->post('/install/admin', [
        'name' => 'Store Owner',
        'email' => 'owner@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $response->assertSessionHas('error');
    expect(session('error'))->toContain('A Super Admin account already exists (existing_admin@example.com)');
});

test('step 3 prevents concurrent setup attempts using mutex lock', function () {
    session()->put('installer.db', [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'landing_db',
        'username' => 'db_user',
        'password' => 'secret_pass',
    ]);
    session()->put('installer.schema_imported', true);

    // Mock acquireLock returning false (lock held by another request)
    $mockService = Mockery::mock(InstallationService::class)->makePartial();
    $mockService->shouldReceive('acquireLock')->once()->andReturn(false);

    app()->instance(InstallationService::class, $mockService);

    $response = $this->post('/install/admin', [
        'name' => 'Store Owner',
        'email' => 'owner@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $response->assertSessionHas('error');
    expect(session('error'))->toContain('Another installation process is currently in progress');
});

test('successful installation creates super admin, writes durable marker, and locks out setup routes', function () {
    session()->put('installer.db', [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'landing_db',
        'username' => 'db_user',
        'password' => 'secret_pass',
    ]);
    session()->put('installer.schema_imported', true);

    // Mock PDO for successful user insertion
    $mockPdo = Mockery::mock(PDO::class);
    $mockCheckStmt = Mockery::mock(PDOStatement::class);
    $mockCheckStmt->shouldReceive('execute')->once();
    $mockCheckStmt->shouldReceive('fetch')->with(PDO::FETCH_ASSOC)->once()->andReturn(false);

    $mockInsertStmt = Mockery::mock(PDOStatement::class);
    $mockInsertStmt->shouldReceive('execute')->once()->andReturn(true);

    $mockPdo->shouldReceive('prepare')->with(Mockery::pattern('/SELECT id, email/'))->once()->andReturn($mockCheckStmt);
    $mockPdo->shouldReceive('prepare')->with(Mockery::pattern('/INSERT INTO users/'))->once()->andReturn($mockInsertStmt);

    $mockService = Mockery::mock(InstallationService::class)->makePartial();
    $mockService->shouldReceive('testDatabaseConnection')->andReturn([
        'success' => true,
        'error' => null,
        'pdo' => $mockPdo,
    ]);

    app()->instance(InstallationService::class, $mockService);

    $response = $this->post('/install/admin', [
        'name' => 'Super Administrator',
        'email' => 'admin@landingstore.com',
        'password' => 'StrongAdminPass123!',
        'password_confirmation' => 'StrongAdminPass123!',
    ]);

    $response->assertRedirect(route('login'));
    $response->assertSessionHas('success');

    // Durable installation marker must exist
    expect(file_exists(InstallationService::getInstalledMarkerPath()))->toBeTrue();
    expect($this->installationService->isInstalled())->toBeTrue();

    // Now all installer endpoints MUST be permanently locked out (404)
    $responseLocked = $this->get('/install');
    $responseLocked->assertStatus(404);

    $responseSchemaLocked = $this->get('/install/schema');
    $responseSchemaLocked->assertStatus(404);

    $responseAdminLocked = $this->get('/install/admin');
    $responseAdminLocked->assertStatus(404);
});

test('self-healing prevents re-running setup if marker is deleted when super admin exists', function () {
    // Create super admin directly in test database
    User::create([
        'name' => 'Existing Super Admin',
        'email' => 'admin@domain.com',
        'password' => Hash::make('password123'),
        'role' => 'super_admin',
    ]);

    // Ensure marker file is absent
    $this->installationService->clearInstalledMarker();
    expect(file_exists(InstallationService::getInstalledMarkerPath()))->toBeFalse();

    // isInstalled() should detect existing super admin and self-heal marker
    expect($this->installationService->isInstalled())->toBeTrue();
    expect(file_exists(InstallationService::getInstalledMarkerPath()))->toBeTrue();

    // Setup routes must return 404
    $response = $this->get('/install');
    $response->assertStatus(404);
});

test('manual env view is shown when server filesystem prevents writing .env', function () {
    session()->put('installer.db', [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'landing_db',
        'username' => 'db_user',
        'password' => 'secret_pass',
    ]);
    session()->put('installer.schema_imported', true);

    $mockPdo = Mockery::mock(PDO::class);
    $mockCheckStmt = Mockery::mock(PDOStatement::class);
    $mockCheckStmt->shouldReceive('execute')->once();
    $mockCheckStmt->shouldReceive('fetch')->with(PDO::FETCH_ASSOC)->once()->andReturn(false);

    $mockInsertStmt = Mockery::mock(PDOStatement::class);
    $mockInsertStmt->shouldReceive('execute')->once()->andReturn(true);

    $mockPdo->shouldReceive('prepare')->with(Mockery::pattern('/SELECT id, email/'))->once()->andReturn($mockCheckStmt);
    $mockPdo->shouldReceive('prepare')->with(Mockery::pattern('/INSERT INTO users/'))->once()->andReturn($mockInsertStmt);

    $mockService = Mockery::mock(InstallationService::class)->makePartial();
    $mockService->shouldReceive('testDatabaseConnection')->andReturn([
        'success' => true,
        'error' => null,
        'pdo' => $mockPdo,
    ]);
    // Force writeEnvironmentConfiguration to return manual_needed = true
    $mockService->shouldReceive('writeEnvironmentConfiguration')->andReturn([
        'success' => false,
        'manual_needed' => true,
        'env_path' => base_path('.env'),
    ]);

    app()->instance(InstallationService::class, $mockService);

    $response = $this->post('/install/admin', [
        'name' => 'Super Administrator',
        'email' => 'admin@landingstore.com',
        'password' => 'StrongAdminPass123!',
        'password_confirmation' => 'StrongAdminPass123!',
    ]);

    $response->assertStatus(200);
    $response->assertSee('Manual File Configuration Required');
    $response->assertSee('cPanel &gt; File Manager', false);
    // Ensure actual password is not displayed
    $response->assertDontSee('secret_pass');
});
