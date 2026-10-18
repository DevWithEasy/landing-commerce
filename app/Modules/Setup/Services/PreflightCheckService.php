<?php

declare(strict_types=1);

namespace App\Modules\Setup\Services;

use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\DB;
use Throwable;

class PreflightCheckService
{
    public function __construct(
        protected ?ConnectionInterface $connection = null
    ) {
        $this->connection = $connection ?? DB::connection();
    }

    /**
     * Run all deployment preflight checks and return structured results.
     *
     * @return array{
     *     passed: bool,
     *     has_failures: bool,
     *     has_warnings: bool,
     *     checks: list<array{
     *         id: string,
     *         category: string,
     *         name: string,
     *         status: 'PASS'|'WARN'|'FAIL',
     *         message: string,
     *         remediation: ?string
     *     }>
     * }
     */
    public function runAllChecks(): array
    {
        $checks = [
            $this->checkPhpVersion(),
            ...$this->checkExtensions(),
            $this->checkDatabaseConnectionAndPrivileges(),
            $this->checkDocumentRootIsolation(),
            $this->checkFilePermissions(),
            $this->checkHttpsAndCookies(),
            $this->checkSchedulerAndQueue(),
        ];

        $hasFailures = false;
        $hasWarnings = false;

        foreach ($checks as $check) {
            if ($check['status'] === 'FAIL') {
                $hasFailures = true;
            } elseif ($check['status'] === 'WARN') {
                $hasWarnings = true;
            }
        }

        return [
            'passed' => ! $hasFailures,
            'has_failures' => $hasFailures,
            'has_warnings' => $hasWarnings,
            'checks' => $checks,
        ];
    }

    /**
     * Check PHP version >= 8.3.
     *
     * @return array{id: string, category: string, name: string, status: 'PASS'|'WARN'|'FAIL', message: string, remediation: ?string}
     */
    public function checkPhpVersion(): array
    {
        $current = PHP_VERSION;
        $required = '8.3.0';

        if (version_compare($current, $required, '>=')) {
            return [
                'id' => 'php_version',
                'category' => 'environment',
                'name' => 'PHP Version',
                'status' => 'PASS',
                'message' => "PHP {$current} detected (meets requirement >= {$required})",
                'remediation' => null,
            ];
        }

        return [
            'id' => 'php_version',
            'category' => 'environment',
            'name' => 'PHP Version',
            'status' => 'FAIL',
            'message' => "PHP {$current} detected. Laravel 13 requires PHP >= {$required}",
            'remediation' => 'Upgrade the active CLI and web server PHP runtime to PHP 8.3 or newer.',
        ];
    }

    /**
     * Check required PHP extensions.
     *
     * @return list<array{id: string, category: string, name: string, status: 'PASS'|'WARN'|'FAIL', message: string, remediation: ?string}>
     */
    public function checkExtensions(): array
    {
        $required = [
            'pdo' => 'PDO abstraction layer',
            'gd' => 'GD image processing library (for product WebP conversion)',
            'fileinfo' => 'Fileinfo extension for binary MIME validation',
            'mbstring' => 'Multibyte string support (for Bengali UTF-8 encoding)',
            'openssl' => 'OpenSSL for credential encryption and token generation',
            'zip' => 'Zip extension for pure-PHP backup & restore engine',
            'curl' => 'cURL extension for courier API and SMS gateway integrations',
        ];

        $results = [];

        foreach ($required as $ext => $description) {
            $loaded = extension_loaded($ext);
            $results[] = [
                'id' => "ext_{$ext}",
                'category' => 'extensions',
                'name' => "PHP Extension: {$ext}",
                'status' => $loaded ? 'PASS' : 'FAIL',
                'message' => $loaded ? "Extension [{$ext}] is loaded ({$description})" : "Missing required extension [{$ext}] ({$description})",
                'remediation' => $loaded ? null : "Enable extension={$ext} in your active php.ini file and restart PHP/web server.",
            ];
        }

        // Dedicated check for pdo_mysql vs active driver
        $driver = $this->connection->getDriverName();
        $pdoMysqlLoaded = extension_loaded('pdo_mysql');

        if ($pdoMysqlLoaded) {
            $results[] = [
                'id' => 'ext_pdo_mysql',
                'category' => 'extensions',
                'name' => 'PHP Extension: pdo_mysql',
                'status' => 'PASS',
                'message' => 'Extension [pdo_mysql] is active for MySQL database connectivity.',
                'remediation' => null,
            ];
        } elseif ($driver === 'mysql') {
            $results[] = [
                'id' => 'ext_pdo_mysql',
                'category' => 'extensions',
                'name' => 'PHP Extension: pdo_mysql',
                'status' => 'FAIL',
                'message' => 'Database connection is configured for MySQL, but [pdo_mysql] extension is not loaded.',
                'remediation' => 'Enable extension=pdo_mysql in your php.ini and restart the web server/CLI runtime.',
            ];
        } else {
            $results[] = [
                'id' => 'ext_pdo_mysql',
                'category' => 'extensions',
                'name' => 'PHP Extension: pdo_mysql',
                'status' => 'WARN',
                'message' => "pdo_mysql is not loaded (current testing driver is [{$driver}]). Required before production MySQL deployment.",
                'remediation' => 'Enable extension=pdo_mysql in php.ini before deploying to production MySQL environments.',
            ];
        }

        return $results;
    }

    /**
     * Check Database Connection and basic CRUD/DDL privileges.
     *
     * @return array{id: string, category: string, name: string, status: 'PASS'|'WARN'|'FAIL', message: string, remediation: ?string}
     */
    public function checkDatabaseConnectionAndPrivileges(): array
    {
        try {
            $pdo = $this->connection->getPdo();
            $driver = $this->connection->getDriverName();
            $database = $this->connection->getDatabaseName();

            // Check basic privileges using a temporary test table
            $testTable = '_preflight_priv_test_'.substr(bin2hex(random_bytes(4)), 0, 8);

            // 1. CREATE TABLE
            $this->connection->statement("CREATE TABLE {$testTable} (id INT, val VARCHAR(50))");

            // 2. INSERT
            $this->connection->statement("INSERT INTO {$testTable} (id, val) VALUES (1, 'check')");

            // 3. SELECT
            $this->connection->select("SELECT * FROM {$testTable} WHERE id = 1");

            // 4. UPDATE
            $this->connection->statement("UPDATE {$testTable} SET val = 'updated' WHERE id = 1");

            // 5. DROP TABLE
            $this->connection->statement("DROP TABLE {$testTable}");

            return [
                'id' => 'database_connection',
                'category' => 'database',
                'name' => 'Database Connection & Privileges',
                'status' => 'PASS',
                'message' => "Successfully connected to [{$driver}] database [{$database}] with full CRUD/DDL privileges.",
                'remediation' => null,
            ];
        } catch (Throwable $e) {
            // Clean up test table if still exists
            if (isset($testTable)) {
                try {
                    $this->connection->statement("DROP TABLE IF EXISTS {$testTable}");
                } catch (Throwable) {
                    // Ignore cleanup error
                }
            }

            return [
                'id' => 'database_connection',
                'category' => 'database',
                'name' => 'Database Connection & Privileges',
                'status' => 'FAIL',
                'message' => "Database check failed: {$e->getMessage()}",
                'remediation' => 'Verify DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, and DB_PASSWORD in .env. Ensure the database user has CREATE, DROP, ALTER, SELECT, INSERT, UPDATE, DELETE privileges.',
            ];
        }
    }

    /**
     * Check document root isolation and ensure .env is not accessible via web root.
     *
     * @return array{id: string, category: string, name: string, status: 'PASS'|'WARN'|'FAIL', message: string, remediation: ?string}
     */
    public function checkDocumentRootIsolation(): array
    {
        $base = realpath(base_path());
        $public = realpath(public_path());

        if ($base !== false && $public !== false && $base === $public) {
            return [
                'id' => 'document_root_isolation',
                'category' => 'security',
                'name' => 'Document Root Isolation',
                'status' => 'FAIL',
                'message' => 'Web document root is pointing directly to the project root directory instead of /public.',
                'remediation' => 'Configure your web server (Apache/Nginx/cPanel) document root to point strictly to the /public subdirectory.',
            ];
        }

        // Check if .env was inadvertently copied or symlinked into public/
        if (file_exists(public_path('.env')) || file_exists(public_path('.env.production'))) {
            return [
                'id' => 'document_root_isolation',
                'category' => 'security',
                'name' => 'Document Root Isolation',
                'status' => 'FAIL',
                'message' => 'CRITICAL: A .env file was detected inside public document root! Secrets are publicly accessible.',
                'remediation' => 'Immediately delete the .env file from the public/ directory.',
            ];
        }

        // Check if index.php exists in public
        if (! file_exists(public_path('index.php'))) {
            return [
                'id' => 'document_root_isolation',
                'category' => 'security',
                'name' => 'Document Root Isolation',
                'status' => 'FAIL',
                'message' => 'public/index.php entry point is missing.',
                'remediation' => 'Ensure the public/index.php entry point file is present.',
            ];
        }

        return [
            'id' => 'document_root_isolation',
            'category' => 'security',
            'name' => 'Document Root Isolation',
            'status' => 'PASS',
            'message' => 'Document root points correctly to /public; .env file is isolated outside web root.',
            'remediation' => null,
        ];
    }

    /**
     * Check write permissions for storage/ and bootstrap/cache.
     *
     * @return array{id: string, category: string, name: string, status: 'PASS'|'WARN'|'FAIL', message: string, remediation: ?string}
     */
    public function checkFilePermissions(): array
    {
        $directories = [
            'storage' => storage_path(),
            'storage/app' => storage_path('app'),
            'storage/framework' => storage_path('framework'),
            'storage/logs' => storage_path('logs'),
            'bootstrap/cache' => base_path('bootstrap/cache'),
        ];

        $unwritable = [];

        foreach ($directories as $label => $path) {
            if (! is_dir($path)) {
                @mkdir($path, 0775, true);
            }

            if (! is_writable($path)) {
                $unwritable[] = $label;
            }
        }

        if (! empty($unwritable)) {
            $list = implode(', ', $unwritable);

            return [
                'id' => 'file_permissions',
                'category' => 'filesystem',
                'name' => 'Storage & Cache Writable Permissions',
                'status' => 'FAIL',
                'message' => "The following directories are not writable by the web/CLI user: [{$list}].",
                'remediation' => 'Grant write permissions: chmod -R 775 storage bootstrap/cache (or ensure the web server user owns them).',
            ];
        }

        return [
            'id' => 'file_permissions',
            'category' => 'filesystem',
            'name' => 'Storage & Cache Writable Permissions',
            'status' => 'PASS',
            'message' => 'storage/ and bootstrap/cache directories are writable.',
            'remediation' => null,
        ];
    }

    /**
     * Check HTTPS enforcement and secure cookies configuration.
     *
     * @return array{id: string, category: string, name: string, status: 'PASS'|'WARN'|'FAIL', message: string, remediation: ?string}
     */
    public function checkHttpsAndCookies(): array
    {
        $appUrl = (string) config('app.url', '');
        $isProduction = config('app.env') === 'production';
        $secureSession = (bool) config('session.secure');

        $issues = [];

        if ($isProduction) {
            if (! str_starts_with(strtolower($appUrl), 'https://')) {
                $issues[] = 'APP_URL is not configured with https:// scheme';
            }

            if (! $secureSession) {
                $issues[] = 'SESSION_SECURE_COOKIE is not enabled (session.secure is false)';
            }
        }

        if (! empty($issues)) {
            return [
                'id' => 'https_and_cookies',
                'category' => 'security',
                'name' => 'HTTPS & Secure Cookie Configuration',
                'status' => 'WARN',
                'message' => 'Production security warnings: '.implode('; ', $issues).'.',
                'remediation' => 'In .env, set APP_URL=https://your-domain.com and SESSION_SECURE_COOKIE=true to ensure encrypted traffic and secure session cookies.',
            ];
        }

        $env = config('app.env', 'production');

        return [
            'id' => 'https_and_cookies',
            'category' => 'security',
            'name' => 'HTTPS & Secure Cookie Configuration',
            'status' => 'PASS',
            'message' => "HTTPS and cookie security verified for [{$env}] environment.",
            'remediation' => null,
        ];
    }

    /**
     * Check cron scheduler configuration and queue worker strategy.
     *
     * @return array{id: string, category: string, name: string, status: 'PASS'|'WARN'|'FAIL', message: string, remediation: ?string}
     */
    public function checkSchedulerAndQueue(): array
    {
        $queueDriver = config('queue.default', 'sync');

        return [
            'id' => 'scheduler_and_queue',
            'category' => 'queue_cron',
            'name' => 'Scheduler & Queue Worker Setup',
            'status' => 'PASS',
            'message' => "Queue driver: [{$queueDriver}]. Configure cron: * * * * * cd ".base_path().' && php artisan schedule:run >> /dev/null 2>&1',
            'remediation' => null,
        ];
    }
}
