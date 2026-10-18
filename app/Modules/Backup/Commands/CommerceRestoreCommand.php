<?php

declare(strict_types=1);

namespace App\Modules\Backup\Commands;

use App\Modules\Backup\Exceptions\RestoreFailedException;
use App\Modules\Backup\Services\RestoreService;
use Illuminate\Console\Command;
use Throwable;

class CommerceRestoreCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'commerce:restore
                            {file : The backup filename or path to restore}
                            {--force : Force the operation without confirmation prompt}
                            {--no-media : Skip restoring uploaded media files}
                            {--no-snapshot : Skip automated pre-restore database snapshot}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Restore database tables and media from a backup archive with syntax and checksum verification';

    /**
     * Execute the console command.
     */
    public function handle(RestoreService $restoreService): int
    {
        /** @var string $file */
        $file = $this->argument('file');
        $force = (bool) $this->option('force');
        $includeMedia = ! $this->option('no-media');
        $preRestoreSnapshot = ! $this->option('no-snapshot');

        $this->warn('CAUTION: Restoring a database backup will overwrite existing tables and data.');
        $this->line("Target backup: <comment>{$file}</comment>");

        if (! $force && ! $this->confirm('Are you sure you want to proceed with this restore operation?', false)) {
            $this->info('Restore operation cancelled.');

            return self::SUCCESS;
        }

        $this->info('Starting restore process...');

        try {
            $result = $restoreService->restore($file, [
                'pre_restore_snapshot' => $preRestoreSnapshot,
                'include_media' => $includeMedia,
                'force' => $force,
            ]);

            $this->newLine();
            $this->table(
                ['Property', 'Value'],
                [
                    ['Pre-Restore Snapshot', $result['snapshot_path'] ?? 'Skipped (--no-snapshot)'],
                    ['SQL Statements Executed', (string) $result['statements_executed']],
                    ['Media Files Restored', (string) $result['media_restored_count']],
                ]
            );

            $this->info('Database and media restore completed successfully.');

            return self::SUCCESS;
        } catch (RestoreFailedException $e) {
            $this->newLine();
            $this->error('================================================================');
            $this->error('RESTORE FAILED!');
            $this->error($e->getMessage());
            $this->error('================================================================');

            if ($e->getSnapshotPath()) {
                $this->warn("\nRECOVERY INSTRUCTIONS:");
                $this->line('Because MySQL DDL commands trigger implicit commits, partial changes may have occurred.');
                $this->line('To recover your database to the state immediately before this restore attempt:');
                $this->line("  <info>php artisan commerce:restore {$e->getSnapshotPath()} --force</info>");
            }

            return self::FAILURE;
        } catch (Throwable $e) {
            $this->newLine();
            $this->error("Restore failed: {$e->getMessage()}");

            return self::FAILURE;
        }
    }
}
