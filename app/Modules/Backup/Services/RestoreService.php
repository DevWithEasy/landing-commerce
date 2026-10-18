<?php

declare(strict_types=1);

namespace App\Modules\Backup\Services;

use App\Modules\Backup\Exceptions\RestoreFailedException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use RuntimeException;
use Throwable;
use ZipArchive;

class RestoreService
{
    public function __construct(
        protected BackupService $backupService,
        protected DatabaseDumpService $dumpService,
        protected ?ConnectionInterface $connection = null
    ) {
        $this->connection = $connection ?? DB::connection();
    }

    /**
     * Resolve and validate a backup file path, preventing directory traversal.
     */
    public function resolveBackupPath(string $file): string
    {
        // Reject path traversal tokens
        if (str_contains($file, '..') || str_contains($file, "\0")) {
            throw new InvalidArgumentException("Directory traversal attack detected in backup filename [{$file}].");
        }

        $baseDir = $this->backupService->getBackupDirectory();

        // If absolute path provided, ensure it stays within app storage or matches existing file
        if (file_exists($file)) {
            $real = realpath($file);
            if ($real === false) {
                throw new InvalidArgumentException("Backup file does not exist: [{$file}].");
            }

            return $real;
        }

        // Check relative to storage/app/backups
        $candidate = $baseDir.DIRECTORY_SEPARATOR.ltrim($file, '/\\');
        if (file_exists($candidate)) {
            $real = realpath($candidate);
            if ($real !== false) {
                return $real;
            }
        }

        // If extension omitted, try adding .zip
        if (! str_ends_with(strtolower($file), '.zip') && ! str_ends_with(strtolower($file), '.sql')) {
            $candidateZip = $candidate.'.zip';
            if (file_exists($candidateZip)) {
                $real = realpath($candidateZip);
                if ($real !== false) {
                    return $real;
                }
            }
        }

        throw new InvalidArgumentException("Backup file not found: [{$file}] in [{$baseDir}].");
    }

    /**
     * Restore database and media from a backup archive or SQL file.
     *
     * @param  array{
     *     pre_restore_snapshot?: bool,
     *     include_media?: bool,
     *     force?: bool
     * }  $options
     * @return array{
     *     snapshot_path: ?string,
     *     statements_executed: int,
     *     media_restored_count: int,
     *     manifest: ?array<string, mixed>
     * }
     */
    public function restore(string $file, array $options = []): array
    {
        $backupPath = $this->resolveBackupPath($file);
        $preRestoreSnapshot = $options['pre_restore_snapshot'] ?? true;
        $includeMedia = $options['include_media'] ?? true;

        $tempSqlFile = null;
        $manifest = null;
        $mediaRestoredCount = 0;

        try {
            $isZip = str_ends_with(strtolower($backupPath), '.zip');

            if ($isZip) {
                $extracted = $this->inspectAndExtractArchive($backupPath);
                $tempSqlFile = $extracted['sql_path'];
                $manifest = $extracted['manifest'];
                $sqlToRun = file_get_contents($tempSqlFile);
            } else {
                $sqlToRun = file_get_contents($backupPath);
            }

            if ($sqlToRun === false || trim($sqlToRun) === '') {
                throw new RuntimeException('The backup SQL dump is empty or unreadable.');
            }

            // 1. Pre-restore syntax and structural validation
            $statements = $this->validateSqlSyntax($sqlToRun);

            // 2. Automated Pre-Restore Safety Snapshot
            $snapshotPath = null;
            if ($preRestoreSnapshot) {
                $snapshotPath = $this->takePreRestoreSnapshot();
            }

            // 3. Execute SQL Restore (Handling non-transactional DDL implicit commits)
            $statementsExecuted = $this->executeSqlStatements($statements, $snapshotPath);

            // 4. Restore media files if applicable
            if ($isZip && $includeMedia) {
                $mediaRestoredCount = $this->restoreMediaFiles($backupPath);
            }

            return [
                'snapshot_path' => $snapshotPath,
                'statements_executed' => $statementsExecuted,
                'media_restored_count' => $mediaRestoredCount,
                'manifest' => $manifest,
            ];
        } finally {
            if ($tempSqlFile !== null && file_exists($tempSqlFile)) {
                @unlink($tempSqlFile);
            }
        }
    }

    /**
     * Validate ZIP archive structure, prevent Zip-Slip, verify checksum, and extract database.sql.
     *
     * @return array{
     *     sql_path: string,
     *     manifest: array<string, mixed>
     * }
     */
    protected function inspectAndExtractArchive(string $zipPath): array
    {
        $zip = new ZipArchive;
        $res = $zip->open($zipPath);

        if ($res !== true) {
            throw new RuntimeException("Corrupt or invalid backup ZIP archive [{$zipPath}]. Error code: {$res}.");
        }

        try {
            // Guard against Zip Slip and inspect contents
            $numFiles = $zip->numFiles;
            $hasManifest = false;
            $hasDatabase = false;

            for ($i = 0; $i < $numFiles; $i++) {
                $stat = $zip->statIndex($i);
                if (! $stat) {
                    continue;
                }

                $name = $stat['name'];

                // Reject zip slip or absolute path attacks
                if (
                    str_contains($name, '..') ||
                    str_starts_with($name, '/') ||
                    str_starts_with($name, '\\') ||
                    preg_match('/^[a-zA-Z]:/', $name)
                ) {
                    throw new RuntimeException("Unsafe entry detected in backup archive: [{$name}]. Aborting restore for security.");
                }

                if ($name === 'manifest.json') {
                    $hasManifest = true;
                } elseif ($name === 'database.sql') {
                    $hasDatabase = true;
                }
            }

            if (! $hasManifest || ! $hasDatabase) {
                throw new RuntimeException("Invalid backup archive: missing required 'manifest.json' or 'database.sql'.");
            }

            // Read and decode manifest.json
            $manifestContent = $zip->getFromName('manifest.json');
            if ($manifestContent === false) {
                throw new RuntimeException('Failed to read manifest.json from archive.');
            }

            /** @var array<string, mixed>|null $manifest */
            $manifest = json_decode($manifestContent, true);
            if (! is_array($manifest) || ! isset($manifest['database']['sha256'])) {
                throw new RuntimeException('Backup manifest is corrupted or missing database SHA-256 signature.');
            }

            // Extract database.sql to temporary location
            $tempSqlPath = $this->backupService->getBackupDirectory().DIRECTORY_SEPARATOR.'restore_'.bin2hex(random_bytes(6)).'.sql';
            $sqlContent = $zip->getFromName('database.sql');
            if ($sqlContent === false) {
                throw new RuntimeException('Failed to extract database.sql from archive.');
            }

            if (file_put_contents($tempSqlPath, $sqlContent) === false) {
                throw new RuntimeException('Failed to write temporary SQL file for verification.');
            }

            // Verify checksum against manifest
            $actualSha256 = hash_file('sha256', $tempSqlPath);
            $expectedSha256 = $manifest['database']['sha256'];

            if (! hash_equals($expectedSha256, (string) $actualSha256)) {
                throw new RuntimeException(
                    "Integrity verification failed! database.sql checksum does not match manifest.\n".
                    "Expected SHA-256: {$expectedSha256}\n".
                    "Actual SHA-256:   {$actualSha256}"
                );
            }

            return [
                'sql_path' => $tempSqlPath,
                'manifest' => $manifest,
            ];
        } finally {
            $zip->close();
        }
    }

    /**
     * Pre-restore SQL syntax and safety validation.
     *
     * @return list<string>
     */
    public function validateSqlSyntax(string $sql): array
    {
        $statements = self::splitSqlStatements($sql);

        if (empty($statements)) {
            throw new RuntimeException('Pre-restore validation failed: no valid SQL statements found in dump.');
        }

        $allowedPrefixes = [
            'SET',
            'PRAGMA',
            'DROP',
            'CREATE',
            'INSERT',
            'ALTER',
            'START',
            'BEGIN',
            'COMMIT',
            'LOCK',
            'UNLOCK',
            'USE',
        ];

        foreach ($statements as $index => $stmt) {
            $trimmed = ltrim($stmt);
            $firstWord = strtoupper(strtok($trimmed, " \t\n\r"));

            if (! in_array($firstWord, $allowedPrefixes, true)) {
                $snippet = substr($trimmed, 0, 80);
                throw new RuntimeException(
                    "Pre-restore syntax check failed at statement #{$index}: Disallowed or unrecognized SQL command [{$firstWord}]. ".
                    "Snippet: [{$snippet}...]"
                );
            }
        }

        return $statements;
    }

    /**
     * Create an automated pre-restore database snapshot before touching the live database.
     */
    protected function takePreRestoreSnapshot(): string
    {
        $snapshotsDir = $this->backupService->getBackupDirectory().DIRECTORY_SEPARATOR.'snapshots';
        if (! is_dir($snapshotsDir) && ! mkdir($snapshotsDir, 0755, true) && ! is_dir($snapshotsDir)) {
            throw new RuntimeException("Failed to create snapshot directory [{$snapshotsDir}].");
        }

        $timestamp = date('Ymd_His');
        $snapshotFile = $snapshotsDir.DIRECTORY_SEPARATOR."pre_restore_snapshot_{$timestamp}.sql";

        $this->dumpService->dumpToFile($snapshotFile);

        return $snapshotFile;
    }

    /**
     * Execute SQL statements with foreign keys disabled.
     *
     * @param  list<string>  $statements
     */
    protected function executeSqlStatements(array $statements, ?string $snapshotPath): int
    {
        $driver = $this->connection->getDriverName();

        // 1. Disable Foreign Key Checks
        if ($driver === 'sqlite') {
            $this->connection->statement('PRAGMA foreign_keys = OFF;');
        } else {
            $this->connection->statement('SET FOREIGN_KEY_CHECKS = 0;');
            $this->connection->statement("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';");
        }

        $executed = 0;
        $currentStmt = '';

        try {
            foreach ($statements as $stmt) {
                $currentStmt = $stmt;
                $this->connection->unprepared($stmt);
                $executed++;
            }
        } catch (Throwable $e) {
            $snippet = substr($currentStmt, 0, 120);
            throw new RestoreFailedException(
                "Database restore execution aborted due to SQL error: {$e->getMessage()}\n".
                "Failing statement snippet: [{$snippet}...]",
                $snapshotPath,
                $currentStmt,
                $e
            );
        } finally {
            // Re-enable Foreign Key Checks
            if ($driver === 'sqlite') {
                $this->connection->statement('PRAGMA foreign_keys = ON;');
            } else {
                $this->connection->statement('SET FOREIGN_KEY_CHECKS = 1;');
            }
        }

        return $executed;
    }

    /**
     * Safely restore media files from the ZIP archive to public storage with Zip-Slip protection.
     */
    protected function restoreMediaFiles(string $zipPath): int
    {
        $zip = new ZipArchive;
        if ($zip->open($zipPath) !== true) {
            return 0;
        }

        $restoredCount = 0;
        $disk = Storage::disk('public');

        try {
            $numFiles = $zip->numFiles;

            for ($i = 0; $i < $numFiles; $i++) {
                $stat = $zip->statIndex($i);
                if (! $stat) {
                    continue;
                }

                $name = $stat['name'];

                // Only extract entries under media/
                if (! str_starts_with($name, 'media/')) {
                    continue;
                }

                $relativePath = substr($name, strlen('media/'));
                if ($relativePath === '' || str_ends_with($relativePath, '/')) {
                    continue;
                }

                // Strict zip slip check
                if (str_contains($relativePath, '..') || str_starts_with($relativePath, '/') || str_starts_with($relativePath, '\\')) {
                    throw new RuntimeException("Unsafe media file path detected in archive: [{$relativePath}].");
                }

                $content = $zip->getFromIndex($i);
                if ($content !== false) {
                    $disk->put($relativePath, $content);
                    $restoredCount++;
                }
            }
        } finally {
            $zip->close();
        }

        return $restoredCount;
    }

    /**
     * Robust stateful SQL splitter that correctly respects quotes, comments, and escaped characters.
     *
     * @return list<string>
     */
    public static function splitSqlStatements(string $sql): array
    {
        $statements = [];
        $length = strlen($sql);
        $current = '';
        $inString = false;
        $stringChar = '';
        $inLineComment = false;
        $inBlockComment = false;

        for ($i = 0; $i < $length; $i++) {
            $char = $sql[$i];
            $nextChar = $i + 1 < $length ? $sql[$i + 1] : '';

            // Handle line comments (-- )
            if ($inLineComment) {
                if ($char === "\n") {
                    $inLineComment = false;
                }

                continue;
            }

            // Handle block comments (/* */)
            if ($inBlockComment) {
                if ($char === '*' && $nextChar === '/') {
                    $inBlockComment = false;
                    $i++;
                }

                continue;
            }

            // Inside quoted string
            if ($inString) {
                $current .= $char;
                if ($char === '\\') {
                    // Escaped character, skip next
                    if ($i + 1 < $length) {
                        $i++;
                        $current .= $sql[$i];
                    }
                } elseif ($char === $stringChar) {
                    // Check for double quote escape ('' or "")
                    if ($nextChar === $stringChar) {
                        $i++;
                        $current .= $sql[$i];
                    } else {
                        $inString = false;
                    }
                }

                continue;
            }

            // Start line comment
            if ($char === '-' && $nextChar === '-') {
                $inLineComment = true;
                $i++;

                continue;
            }

            // Start block comment
            if ($char === '/' && $nextChar === '*') {
                $inBlockComment = true;
                $i++;

                continue;
            }

            // Start string
            if ($char === "'" || $char === '"') {
                $inString = true;
                $stringChar = $char;
                $current .= $char;

                continue;
            }

            // Statement separator
            if ($char === ';') {
                $trimmed = trim($current);
                if ($trimmed !== '') {
                    $statements[] = $trimmed;
                }
                $current = '';

                continue;
            }

            $current .= $char;
        }

        if ($inString) {
            throw new RuntimeException('Pre-restore SQL syntax validation error: Unclosed quoted string detected in dump.');
        }

        $trimmed = trim($current);
        if ($trimmed !== '') {
            $statements[] = $trimmed;
        }

        return $statements;
    }
}
