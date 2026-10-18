<?php

declare(strict_types=1);

namespace App\Modules\Backup\Commands;

use App\Modules\Backup\Services\BackupService;
use Illuminate\Console\Command;
use Throwable;

class CommerceBackupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'commerce:backup
                            {--no-media : Exclude uploaded media files from the backup}
                            {--filename= : Custom filename for the backup archive}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a pure-PHP MySQL database and media backup zip archive';

    /**
     * Execute the console command.
     */
    public function handle(BackupService $backupService): int
    {
        $this->info('Starting Landing Commerce pure-PHP backup...');

        $includeMedia = ! $this->option('no-media');
        $filename = $this->option('filename');

        $options = [
            'include_media' => $includeMedia,
        ];

        if (is_string($filename) && trim($filename) !== '') {
            $options['filename'] = trim($filename);
        }

        try {
            $this->output->write('Streaming database dump and packaging archive... ');

            $result = $backupService->createBackup($options);

            $this->output->writeln('<info>DONE</info>');
            $this->newLine();

            $manifest = $result['manifest'];
            $db = $manifest['database'] ?? [];
            $media = $manifest['media'] ?? [];

            $this->table(
                ['Property', 'Value'],
                [
                    ['Archive File', $result['filename']],
                    ['Archive Path', $result['path']],
                    ['Archive Size', number_format($result['size_bytes'] / 1024, 2).' KB'],
                    ['Database Driver', $db['driver'] ?? 'N/A'],
                    ['Database Name', $db['database'] ?? 'N/A'],
                    ['Tables Dumped', (string) ($db['tables_count'] ?? 0)],
                    ['Rows Dumped', (string) ($db['rows_count'] ?? 0)],
                    ['SQL SHA-256', $db['sha256'] ?? 'N/A'],
                    ['Media Included', ($media['included'] ?? false) ? 'Yes' : 'No'],
                    ['Media Files', (string) ($media['files_count'] ?? 0)],
                    ['Media Size', number_format(($media['total_size_bytes'] ?? 0) / 1024, 2).' KB'],
                ]
            );

            $this->info("Backup successfully completed: {$result['path']}");

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->newLine();
            $this->error("Backup failed: {$e->getMessage()}");

            return self::FAILURE;
        }
    }
}
