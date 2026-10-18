<?php

declare(strict_types=1);

namespace App\Modules\Backup\Services;

use Illuminate\Support\Facades\Storage;
use RuntimeException;
use ZipArchive;

class BackupService
{
    public function __construct(
        protected DatabaseDumpService $dumpService
    ) {}

    /**
     * Get the base directory for storing backups.
     */
    public function getBackupDirectory(): string
    {
        $dir = storage_path('app/backups');
        if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
            throw new RuntimeException("Failed to create backups directory [{$dir}].");
        }

        return $dir;
    }

    /**
     * Create a complete backup of the database and uploaded media.
     *
     * @param  array{
     *     filename?: string,
     *     include_media?: bool
     * }  $options
     * @return array{
     *     path: string,
     *     filename: string,
     *     size_bytes: int,
     *     manifest: array<string, mixed>
     * }
     */
    public function createBackup(array $options = []): array
    {
        $backupDir = $this->getBackupDirectory();
        $timestamp = date('Ymd_His');
        $filename = $options['filename'] ?? "backup_{$timestamp}.zip";

        // Sanitize filename to prevent directory traversal
        $filename = basename($filename);
        if (! str_ends_with(strtolower($filename), '.zip')) {
            $filename .= '.zip';
        }

        $zipPath = $backupDir.DIRECTORY_SEPARATOR.$filename;
        $tempSqlFile = $backupDir.DIRECTORY_SEPARATOR."temp_dump_{$timestamp}_".bin2hex(random_bytes(4)).'.sql';

        $includeMedia = $options['include_media'] ?? true;

        try {
            // 1. Stream database dump to temporary SQL file
            $dbMetadata = $this->dumpService->dumpToFile($tempSqlFile);

            // 2. Initialize ZIP archive
            $zip = new ZipArchive;
            $res = $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
            if ($res !== true) {
                throw new RuntimeException("Could not create ZIP archive at [{$zipPath}], ZipArchive error code: {$res}");
            }

            // 3. Add database.sql to archive root
            $zip->addFile($tempSqlFile, 'database.sql');

            // 4. Collect and add media files if requested
            $mediaStats = [
                'included' => $includeMedia,
                'files_count' => 0,
                'total_size_bytes' => 0,
            ];

            if ($includeMedia) {
                $mediaStats = $this->addMediaFilesToZip($zip);
            }

            // 5. Build and add manifest.json
            $connection = config('database.default');
            $driver = config("database.connections.{$connection}.driver", 'mysql');
            $databaseName = (string) config("database.connections.{$connection}.database", '');

            $manifest = [
                'version' => '1.0.0',
                'app' => config('app.name', 'Landing Commerce'),
                'created_at' => now()->toIso8601String(),
                'environment' => app()->environment(),
                'database' => [
                    'connection' => $connection,
                    'driver' => $driver,
                    'database' => $databaseName,
                    'sha256' => $dbMetadata['sha256'],
                    'size_bytes' => $dbMetadata['size_bytes'],
                    'tables_count' => $dbMetadata['tables_count'],
                    'rows_count' => $dbMetadata['rows_count'],
                ],
                'media' => $mediaStats,
            ];

            $zip->addFromString('manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            // Close the zip archive
            $zip->close();

            $zipSize = filesize($zipPath);

            return [
                'path' => $zipPath,
                'filename' => $filename,
                'size_bytes' => $zipSize !== false ? $zipSize : 0,
                'manifest' => $manifest,
            ];
        } finally {
            // Clean up temporary dump file
            if (file_exists($tempSqlFile)) {
                @unlink($tempSqlFile);
            }
        }
    }

    /**
     * Add uploaded media from public storage to the ZIP archive.
     *
     * @return array{
     *     included: bool,
     *     files_count: int,
     *     total_size_bytes: int
     * }
     */
    protected function addMediaFilesToZip(ZipArchive $zip): array
    {
        $disk = Storage::disk('public');
        $filesCount = 0;
        $totalBytes = 0;

        try {
            $allFiles = $disk->allFiles();
        } catch (\Throwable) {
            $allFiles = [];
        }

        foreach ($allFiles as $relativeFile) {
            $fileName = basename($relativeFile);

            // Exclude hidden files (.env, .gitignore, .DS_Store, etc.)
            if (str_starts_with($fileName, '.')) {
                continue;
            }

            // Explicit safety checks: reject .env, keys, credentials, or hidden dirs
            if ($this->isForbiddenFile($relativeFile, $fileName)) {
                continue;
            }

            $fullPath = $disk->path($relativeFile);
            if (! is_file($fullPath)) {
                continue;
            }

            $size = filesize($fullPath);
            $normalizedRelative = str_replace('\\', '/', $relativeFile);

            $zip->addFile($fullPath, 'media/'.$normalizedRelative);
            $filesCount++;
            $totalBytes += ($size !== false ? $size : 0);
        }

        return [
            'included' => true,
            'files_count' => $filesCount,
            'total_size_bytes' => $totalBytes,
        ];
    }

    /**
     * Check if a file should be strictly excluded from backup packaging.
     */
    protected function isForbiddenFile(string $relativePath, string $fileName): bool
    {
        $lowerName = strtolower($fileName);
        $lowerPath = strtolower($relativePath);

        // Security exclusions
        if (str_contains($lowerPath, '.env') || str_contains($lowerName, '.env')) {
            return true;
        }

        if (str_ends_with($lowerName, '.key') || str_ends_with($lowerName, '.pem') || str_ends_with($lowerName, '.crt')) {
            return true;
        }

        if (str_contains($lowerPath, 'vendor/') || str_contains($lowerPath, 'node_modules/')) {
            return true;
        }

        return false;
    }
}
