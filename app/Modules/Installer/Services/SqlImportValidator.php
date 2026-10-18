<?php

declare(strict_types=1);

namespace App\Modules\Installer\Services;

use App\Modules\Backup\Services\RestoreService;
use InvalidArgumentException;
use ZipArchive;

class SqlImportValidator
{
    /**
     * Max permitted SQL upload size (50 MB).
     */
    public const MAX_FILE_SIZE_BYTES = 52428800;

    /**
     * Required tables that must be present in a valid Landing Commerce schema.
     *
     * @var list<string>
     */
    public const REQUIRED_TABLES = [
        'users',
        'products',
        'orders',
        'settings',
        'landing_pages',
        'districts',
        'shipping_zones',
    ];

    /**
     * Disallowed SQL statements that pose security risks or attempt privilege/database escape.
     *
     * @var list<string>
     */
    protected const DISALLOWED_PATTERNS = [
        '/DROP\s+DATABASE/i' => 'DROP DATABASE command is strictly prohibited.',
        '/CREATE\s+DATABASE/i' => 'CREATE DATABASE command is prohibited; use the pre-configured cPanel database.',
        '/ALTER\s+DATABASE/i' => 'ALTER DATABASE command is prohibited.',
        '/CREATE\s+USER/i' => 'User creation commands (CREATE USER) are prohibited.',
        '/DROP\s+USER/i' => 'DROP USER commands are prohibited.',
        '/GRANT\s+/i' => 'GRANT privilege commands are prohibited.',
        '/REVOKE\s+/i' => 'REVOKE privilege commands are prohibited.',
        '/SHUTDOWN/i' => 'Server control commands (SHUTDOWN) are prohibited.',
        '/LOAD\s+DATA/i' => 'LOAD DATA file access commands are prohibited.',
        '/LOAD_FILE\s*\(/i' => 'LOAD_FILE() function is prohibited for security.',
        '/INTO\s+OUTFILE/i' => 'INTO OUTFILE filesystem export is strictly prohibited.',
        '/INTO\s+DUMPFILE/i' => 'INTO DUMPFILE filesystem export is strictly prohibited.',
        '/\bUSE\s+`?[a-zA-Z0-9_]+`?/i' => 'Switching databases via USE is prohibited; all statements must execute in the configured database.',
        '/INSTALL\s+PLUGIN/i' => 'Plugin installation commands are prohibited.',
        '/<\?php/i' => 'Embedded PHP execution tags detected in SQL dump.',
        '/<\?=/i' => 'Embedded PHP echo tags detected in SQL dump.',
        '/<script/i' => 'Embedded HTML script tags detected in SQL dump.',
    ];

    /**
     * Validate an uploaded SQL or ZIP archive and extract raw SQL string safely.
     *
     * @return array{
     *     valid: bool,
     *     sql: string,
     *     statements: list<string>,
     *     errors: list<string>,
     *     tables_detected: list<string>
     * }
     */
    public function validateAndExtract(string $filePath, string $originalFilename): array
    {
        $errors = [];

        // 1. Verify file exists
        if (! file_exists($filePath)) {
            throw new InvalidArgumentException("Uploaded file does not exist at [{$filePath}].");
        }

        // 2. Verify file size
        $fileSize = filesize($filePath);
        if ($fileSize === false || $fileSize === 0) {
            return $this->buildFailure(['Uploaded file is empty.']);
        }
        if ($fileSize > self::MAX_FILE_SIZE_BYTES) {
            return $this->buildFailure(['File exceeds maximum allowed size of 50 MB.']);
        }

        // 3. Extension check
        $extension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
        if (! in_array($extension, ['sql', 'zip'], true)) {
            return $this->buildFailure(["Invalid file extension [{$extension}]. Only .sql and .zip files are allowed."]);
        }

        // 4. Extract SQL content safely
        $sqlContent = '';
        if ($extension === 'zip') {
            $extracted = $this->extractSqlFromZip($filePath);
            if (! $extracted['success']) {
                return $this->buildFailure($extracted['errors']);
            }
            $sqlContent = $extracted['sql'];
        } else {
            $content = file_get_contents($filePath);
            if ($content === false) {
                return $this->buildFailure(['Unable to read uploaded SQL file.']);
            }
            $sqlContent = $content;
        }

        // 5. Scan SQL content for dangerous or disallowed commands
        foreach (self::DISALLOWED_PATTERNS as $pattern => $message) {
            if (preg_match($pattern, $sqlContent)) {
                $errors[] = $message;
            }
        }

        if (! empty($errors)) {
            return $this->buildFailure($errors);
        }

        // 6. Tokenize SQL into individual statements
        try {
            $statements = RestoreService::splitSqlStatements($sqlContent);
        } catch (\Throwable $e) {
            return $this->buildFailure(["SQL syntax validation error: {$e->getMessage()}"]);
        }

        if (empty($statements)) {
            return $this->buildFailure(['No executable SQL statements found in uploaded file.']);
        }

        // 7. Check for MySQL compatibility & schema requirements
        $tablesDetected = [];
        foreach ($statements as $stmt) {
            if (preg_match('/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`[a-zA-Z0-9_]+`\.)?`?([a-zA-Z0-9_]+)`?/i', $stmt, $matches)) {
                $tablesDetected[] = strtolower($matches[1]);
            }
        }

        $missingTables = array_diff(self::REQUIRED_TABLES, $tablesDetected);
        if (! empty($missingTables)) {
            $missingList = implode(', ', $missingTables);
            $errors[] = "Incompatible schema: The uploaded SQL is missing required Landing Commerce tables: [{$missingList}].";
        }

        // Check if SQLite syntax was accidentally uploaded (AUTOINCREMENT instead of AUTO_INCREMENT)
        if (preg_match('/\bAUTOINCREMENT\b/i', $sqlContent) && ! preg_match('/\bAUTO_INCREMENT\b/i', $sqlContent)) {
            $errors[] = 'SQLite syntax detected (AUTOINCREMENT). The dump must be formatted for MySQL (AUTO_INCREMENT).';
        }

        if (! empty($errors)) {
            return $this->buildFailure($errors);
        }

        return [
            'valid' => true,
            'sql' => $sqlContent,
            'statements' => $statements,
            'errors' => [],
            'tables_detected' => array_values(array_unique($tablesDetected)),
        ];
    }

    /**
     * Safely extract SQL from a ZIP archive with strict Zip-Slip protection.
     *
     * @return array{
     *     success: bool,
     *     sql: string,
     *     errors: list<string>
     * }
     */
    protected function extractSqlFromZip(string $zipPath): array
    {
        $zip = new ZipArchive;
        $res = $zip->open($zipPath);

        if ($res !== true) {
            return [
                'success' => false,
                'sql' => '',
                'errors' => ["Failed to open ZIP archive. Error code: {$res}"],
            ];
        }

        try {
            $sqlContent = null;
            $numFiles = $zip->numFiles;

            for ($i = 0; $i < $numFiles; $i++) {
                $stat = $zip->statIndex($i);
                if (! $stat) {
                    continue;
                }

                $name = $stat['name'];

                // Zip-Slip protection
                if (
                    str_contains($name, '..') ||
                    str_starts_with($name, '/') ||
                    str_starts_with($name, '\\') ||
                    preg_match('/^[a-zA-Z]:/', $name)
                ) {
                    return [
                        'success' => false,
                        'sql' => '',
                        'errors' => ["Malicious archive path detected: [{$name}]."],
                    ];
                }

                // Check extension - disallow any dangerous executable formats
                $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                if (in_array($ext, ['php', 'phtml', 'sh', 'exe', 'bat', 'cmd', 'py', 'pl'], true)) {
                    return [
                        'success' => false,
                        'sql' => '',
                        'errors' => ["Executable file detected inside ZIP archive: [{$name}]. Upload rejected."],
                    ];
                }

                // Locate candidate SQL dump (database.sql or any root .sql)
                if ($ext === 'sql' && $sqlContent === null) {
                    $content = $zip->getFromIndex($i);
                    if ($content !== false) {
                        $sqlContent = $content;
                    }
                }
            }

            if ($sqlContent === null) {
                return [
                    'success' => false,
                    'sql' => '',
                    'errors' => ['No compatible .sql dump file found inside the ZIP archive.'],
                ];
            }

            return [
                'success' => true,
                'sql' => $sqlContent,
                'errors' => [],
            ];
        } finally {
            $zip->close();
        }
    }

    /**
     * @param  list<string>  $errors
     * @return array{valid: false, sql: '', statements: list<string>, errors: list<string>, tables_detected: list<string>}
     */
    protected function buildFailure(array $errors): array
    {
        return [
            'valid' => false,
            'sql' => '',
            'statements' => [],
            'errors' => $errors,
            'tables_detected' => [],
        ];
    }
}
