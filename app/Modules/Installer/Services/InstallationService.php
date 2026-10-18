<?php

declare(strict_types=1);

namespace App\Modules\Installer\Services;

use App\Models\User;
use Illuminate\Support\Facades\File;
use PDO;
use Throwable;

class InstallationService
{
    /**
     * Path to the installation lock file.
     */
    protected const LOCK_FILE = 'framework/installer.lock';

    /**
     * Internal file handle for mutex locking.
     *
     * @var resource|null
     */
    protected static $lockHandle = null;

    /**
     * Get the absolute path to the durable installation marker.
     */
    public static function getInstalledMarkerPath(): string
    {
        return storage_path('installed');
    }

    /**
     * Determine whether the application has already been installed.
     */
    public function isInstalled(): bool
    {
        // 1. Primary check: durable marker outside public document root
        if (file_exists(self::getInstalledMarkerPath())) {
            return true;
        }

        // 2. Secondary defense: if database has users and a super_admin exists, self-heal marker
        try {
            if (User::where('role', 'super_admin')->exists()) {
                $this->markAsInstalled(['auto_healed' => true]);

                return true;
            }
        } catch (Throwable) {
            // Database not configured or table missing - not installed
        }

        return false;
    }

    /**
     * Mark the application as permanently installed.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function markAsInstalled(array $metadata = []): void
    {
        $path = self::getInstalledMarkerPath();
        $dir = dirname($path);

        if (! is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        $payload = array_merge([
            'installed_at' => date('Y-m-d H:i:s'),
            'php_version' => PHP_VERSION,
            'app_env' => config('app.env', 'production'),
        ], $metadata);

        file_put_contents($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        @chmod($path, 0644);
    }

    /**
     * Clear the installed marker (used strictly in testing).
     */
    public function clearInstalledMarker(): void
    {
        $path = self::getInstalledMarkerPath();
        if (file_exists($path)) {
            @unlink($path);
        }
    }

    /**
     * Acquire a non-blocking mutex lock to prevent concurrent installer executions.
     */
    public function acquireLock(): bool
    {
        $lockPath = storage_path(self::LOCK_FILE);
        $dir = dirname($lockPath);

        if (! is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        $handle = @fopen($lockPath, 'c+');
        if (! $handle) {
            return false;
        }

        if (! flock($handle, LOCK_EX | LOCK_NB)) {
            fclose($handle);

            return false;
        }

        self::$lockHandle = $handle;

        return true;
    }

    /**
     * Release the installer mutex lock.
     */
    public function releaseLock(): void
    {
        if (self::$lockHandle !== null) {
            @flock(self::$lockHandle, LOCK_UN);
            @fclose(self::$lockHandle);
            self::$lockHandle = null;
        }

        $lockPath = storage_path(self::LOCK_FILE);
        if (file_exists($lockPath)) {
            @unlink($lockPath);
        }
    }

    /**
     * Safely attempt a PDO MySQL database connection without exposing credentials.
     *
     * @return array{
     *     success: bool,
     *     error: ?string,
     *     pdo: ?PDO
     * }
     */
    public function testDatabaseConnection(
        string $host,
        int $port,
        string $database,
        string $username,
        string $password
    ): array {
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
            $pdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 5,
            ]);

            return [
                'success' => true,
                'error' => null,
                'pdo' => $pdo,
            ];
        } catch (Throwable $e) {
            // Sanitize error message to prevent password leakage in DSN or trace
            $msg = $e->getMessage();
            $sanitized = preg_replace('/password=[^;\s]*/i', 'password=***', $msg);

            return [
                'success' => false,
                'error' => $sanitized ?? 'Database connection failed. Please check host, username, and database name.',
                'pdo' => null,
            ];
        }
    }

    /**
     * Import validated SQL statements using a bounded execution strategy on MySQL.
     *
     * @param  list<string>  $statements
     * @return array{
     *     success: bool,
     *     executed_count: int,
     *     error: ?string,
     *     failing_statement: ?string
     * }
     */
    public function executeSqlImport(PDO $pdo, array $statements): array
    {
        $executed = 0;
        $currentStmt = '';

        try {
            // Disable foreign keys checks for clean DDL import
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 0;');
            $pdo->exec("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';");

            foreach ($statements as $stmt) {
                $currentStmt = trim($stmt);
                if ($currentStmt === '') {
                    continue;
                }

                $pdo->exec($currentStmt);
                $executed++;
            }

            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1;');

            return [
                'success' => true,
                'executed_count' => $executed,
                'error' => null,
                'failing_statement' => null,
            ];
        } catch (Throwable $e) {
            try {
                $pdo->exec('SET FOREIGN_KEY_CHECKS = 1;');
            } catch (Throwable) {
                // Ignore
            }

            $snippet = substr($currentStmt, 0, 100);

            return [
                'success' => false,
                'executed_count' => $executed,
                'error' => $e->getMessage(),
                'failing_statement' => $snippet,
            ];
        }
    }

    /**
     * Update .env file with new database credentials and production settings safely.
     *
     * @param  array{
     *     host: string,
     *     port: int,
     *     database: string,
     *     username: string,
     *     password: string
     * }  $dbConfig
     * @param  array<string, string>  $appConfig
     * @return array{
     *     success: bool,
     *     manual_needed: bool,
     *     env_path: string
     * }
     */
    public function writeEnvironmentConfiguration(array $dbConfig, array $appConfig = [], ?string $targetEnvPath = null): array
    {
        $envPath = $targetEnvPath ?? (app()->environment('testing') ? base_path('.env.installer.test') : base_path('.env'));
        $examplePath = base_path('.env.example');

        $content = '';
        if (file_exists($envPath)) {
            $content = (string) file_get_contents($envPath);
        } elseif (file_exists($examplePath)) {
            $content = (string) file_get_contents($examplePath);
        }

        $replacements = [
            'DB_CONNECTION' => 'mysql',
            'DB_HOST' => $dbConfig['host'],
            'DB_PORT' => (string) $dbConfig['port'],
            'DB_DATABASE' => $dbConfig['database'],
            'DB_USERNAME' => $dbConfig['username'],
            'DB_PASSWORD' => $dbConfig['password'],
            'APP_ENV' => $appConfig['APP_ENV'] ?? 'production',
            'APP_DEBUG' => $appConfig['APP_DEBUG'] ?? 'false',
        ];

        if (! empty($appConfig['APP_URL'])) {
            $replacements['APP_URL'] = $appConfig['APP_URL'];
        }

        // If APP_KEY is empty, generate an AES-256-CBC 32-byte key
        if (! preg_match('/^APP_KEY=base64:.+$/m', $content)) {
            $key = 'base64:'.base64_encode(random_bytes(32));
            $replacements['APP_KEY'] = $key;
        }

        foreach ($replacements as $key => $val) {
            // Quote password if it contains special characters
            $formattedVal = $val;
            if (preg_match('/[\s#\'"=]/', $val)) {
                $formattedVal = '"'.str_replace('"', '\"', $val).'"';
            }

            if (preg_match("/^{$key}=.*/m", $content)) {
                $content = preg_replace("/^{$key}=.*/m", "{$key}={$formattedVal}", $content);
            } else {
                $content .= "\n{$key}={$formattedVal}";
            }
        }

        // Attempt safe atomic write
        $tempPath = $envPath.'.'.bin2hex(random_bytes(4)).'.tmp';
        try {
            $written = @file_put_contents($tempPath, $content);
            if ($written !== false) {
                if (@rename($tempPath, $envPath)) {
                    @chmod($envPath, 0644);

                    return [
                        'success' => true,
                        'manual_needed' => false,
                        'env_path' => $envPath,
                    ];
                }
            }
        } catch (Throwable) {
            // Fall through to manual handling
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }

        return [
            'success' => false,
            'manual_needed' => true,
            'env_path' => $envPath,
        ];
    }
}
