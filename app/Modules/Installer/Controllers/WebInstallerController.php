<?php

declare(strict_types=1);

namespace App\Modules\Installer\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Backup\Services\RestoreService;
use App\Modules\Installer\Services\InstallationService;
use App\Modules\Installer\Services\SqlImportValidator;
use App\Modules\Setup\Services\PreflightCheckService;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use PDO;
use Throwable;

class WebInstallerController extends Controller
{
    public function __construct(
        protected InstallationService $installationService,
        protected PreflightCheckService $preflightService,
        protected SqlImportValidator $sqlValidator
    ) {}

    /**
     * Step 1: Preflight system check & MySQL database credentials form.
     */
    public function index(Request $request): View
    {
        $preflight = $this->preflightService->runAllChecks();
        $savedDb = $request->session()->get('installer.db', []);

        return view('installer.step1_database', [
            'preflight' => $preflight,
            'savedDb' => $savedDb,
        ]);
    }

    /**
     * Handle Step 1 POST: Test database connection and store in installer session.
     */
    public function postDatabase(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'db_host' => ['required', 'string', 'max:255'],
            'db_port' => ['required', 'integer', 'between:1,65535'],
            'db_database' => ['required', 'string', 'max:255'],
            'db_username' => ['required', 'string', 'max:255'],
            'db_password' => ['nullable', 'string'],
        ]);

        $host = (string) $validated['db_host'];
        $port = (int) $validated['db_port'];
        $database = (string) $validated['db_database'];
        $username = (string) $validated['db_username'];
        $password = (string) ($validated['db_password'] ?? '');

        // Test PDO MySQL connection without logging the password
        $connTest = $this->installationService->testDatabaseConnection(
            $host,
            $port,
            $database,
            $username,
            $password
        );

        if (! $connTest['success']) {
            return back()
                ->withInput($request->except('db_password'))
                ->with('error', 'Database connection failed: '.$connTest['error']);
        }

        // Store database configuration securely in session
        $request->session()->put('installer.db', [
            'host' => $host,
            'port' => $port,
            'database' => $database,
            'username' => $username,
            'password' => $password,
        ]);

        return redirect()->route('installer.schema')
            ->with('success', 'Database connection established successfully!');
    }

    /**
     * Step 2: Schema setup & SQL dump upload view.
     */
    public function showSchema(Request $request): View|RedirectResponse
    {
        if (! $request->session()->has('installer.db')) {
            return redirect()->route('installer.index')
                ->with('error', 'Please configure your database connection first.');
        }

        return view('installer.step2_schema');
    }

    /**
     * Handle Step 2 POST: Validate and import MySQL SQL dump or bundled starter schema.
     */
    public function postSchema(Request $request): RedirectResponse
    {
        $dbConfig = $request->session()->get('installer.db');
        if (! $dbConfig) {
            return redirect()->route('installer.index')
                ->with('error', 'Database connection details are missing. Please reconfigure.');
        }

        $source = $request->input('schema_source', 'bundled');
        $statements = [];

        if ($source === 'upload') {
            $request->validate([
                'sql_file' => ['required', 'file', 'max:51200'], // max 50 MB
            ]);

            $file = $request->file('sql_file');
            if (! $file || ! $file->isValid()) {
                return back()->with('error', 'Uploaded SQL file is invalid or missing.');
            }

            $originalName = $file->getClientOriginalName();
            $tempDir = storage_path('app/installer_temp');
            if (! is_dir($tempDir)) {
                @mkdir($tempDir, 0755, true);
            }

            $tempPath = $file->storeAs('installer_temp', 'import_'.bin2hex(random_bytes(6)).'.'.$file->getClientOriginalExtension());
            $fullTempPath = storage_path('app/'.$tempPath);

            try {
                $validation = $this->sqlValidator->validateAndExtract($fullTempPath, $originalName);

                if (! $validation['valid']) {
                    return back()->with('error', 'SQL validation failed: '.implode(' ', $validation['errors']));
                }

                $statements = $validation['statements'];
            } finally {
                if (file_exists($fullTempPath)) {
                    @unlink($fullTempPath);
                }
            }
        } else {
            // Bundled starter schema
            $bundledPath = database_path('schema/mysql-starter.sql');
            if (! file_exists($bundledPath)) {
                return back()->with('error', 'Pre-bundled schema file not found at database/schema/mysql-starter.sql.');
            }

            $sqlContent = (string) file_get_contents($bundledPath);
            $statements = RestoreService::splitSqlStatements($sqlContent);
        }

        // Connect to MySQL using session credentials
        $conn = $this->installationService->testDatabaseConnection(
            $dbConfig['host'],
            $dbConfig['port'],
            $dbConfig['database'],
            $dbConfig['username'],
            $dbConfig['password']
        );

        if (! $conn['success'] || ! $conn['pdo']) {
            return back()->with('error', 'Could not reconnect to database: '.$conn['error']);
        }

        // Execute bounded SQL import
        $importResult = $this->installationService->executeSqlImport($conn['pdo'], $statements);

        if (! $importResult['success']) {
            $recoveryAdvice = 'In MySQL, table DDL changes cannot be rolled back atomically. If partial tables were created, please log into cPanel phpMyAdmin, drop all tables from the database, and retry.';

            return back()->with('error', "Import error: {$importResult['error']}. Failing statement: [{$importResult['failing_statement']}]. {$recoveryAdvice}");
        }

        $request->session()->put('installer.schema_imported', true);

        return redirect()->route('installer.admin')
            ->with('success', "Schema imported successfully ({$importResult['executed_count']} statements executed).");
    }

    /**
     * Step 3: Initial Super Admin account creation view.
     */
    public function showAdmin(Request $request): View|RedirectResponse
    {
        if (! $request->session()->has('installer.db') || ! $request->session()->has('installer.schema_imported')) {
            return redirect()->route('installer.index')
                ->with('error', 'Please complete database and schema setup first.');
        }

        return view('installer.step3_admin');
    }

    /**
     * Handle Step 3 POST: Create Super Admin, update .env, and finalize installation.
     */
    public function postAdmin(Request $request): View|RedirectResponse
    {
        $dbConfig = $request->session()->get('installer.db');
        if (! $dbConfig || ! $request->session()->has('installer.schema_imported')) {
            return redirect()->route('installer.index')
                ->with('error', 'Session expired. Please restart the installation.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Prevent concurrent setup submissions
        if (! $this->installationService->acquireLock()) {
            return back()->with('error', 'Another installation process is currently in progress. Please wait a moment.');
        }

        try {
            // Connect to database
            $conn = $this->installationService->testDatabaseConnection(
                $dbConfig['host'],
                $dbConfig['port'],
                $dbConfig['database'],
                $dbConfig['username'],
                $dbConfig['password']
            );

            if (! $conn['success'] || ! $conn['pdo']) {
                return back()->with('error', 'Database connection lost: '.$conn['error']);
            }

            $pdo = $conn['pdo'];

            // Guard against duplicate or existing Super Admin
            $checkStmt = $pdo->prepare("SELECT id, email FROM users WHERE role = 'super_admin' LIMIT 1");
            $checkStmt->execute();
            $existingAdmin = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingAdmin) {
                return back()->with('error', "A Super Admin account already exists ({$existingAdmin['email']}). Duplicate creation prevented.");
            }

            // Insert Super Admin account safely
            $hashedPassword = password_hash($validated['password'], PASSWORD_BCRYPT, ['cost' => 12]);
            $now = date('Y-m-d H:i:s');

            $insertStmt = $pdo->prepare("
                INSERT INTO users (name, email, password, role, created_at, updated_at)
                VALUES (:name, :email, :password, 'super_admin', :created_at, :updated_at)
            ");

            $insertStmt->execute([
                ':name' => $validated['name'],
                ':email' => strtolower($validated['email']),
                ':password' => $hashedPassword,
                ':created_at' => $now,
                ':updated_at' => $now,
            ]);

            // Write .env configuration file
            $appUrl = $request->root();
            $envWrite = $this->installationService->writeEnvironmentConfiguration($dbConfig, [
                'APP_ENV' => 'production',
                'APP_DEBUG' => 'false',
                'APP_URL' => $appUrl,
            ]);

            // Mark application as permanently installed
            $this->installationService->markAsInstalled([
                'admin_email' => strtolower($validated['email']),
                'db_database' => $dbConfig['database'],
                'installer_type' => 'web_cpanel',
            ]);

            // Invalidate installer session secrets
            $request->session()->forget('installer');
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            // If .env could not be written due to hosting filesystem permissions, show manual configuration view
            if ($envWrite['manual_needed']) {
                return view('installer.manual_env', [
                    'dbHost' => $dbConfig['host'],
                    'dbPort' => $dbConfig['port'],
                    'dbDatabase' => $dbConfig['database'],
                    'dbUsername' => $dbConfig['username'],
                ]);
            }

            return redirect()->route('login')
                ->with('success', 'Installation completed successfully! Please log in with your Super Admin credentials.');
        } catch (Throwable $e) {
            return back()->with('error', 'Installation finalization failed: '.$e->getMessage());
        } finally {
            $this->installationService->releaseLock();
        }
    }
}
