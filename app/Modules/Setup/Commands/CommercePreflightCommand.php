<?php

declare(strict_types=1);

namespace App\Modules\Setup\Commands;

use App\Modules\Setup\Services\PreflightCheckService;
use Illuminate\Console\Command;

class CommercePreflightCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'commerce:preflight
                            {--json : Output results as JSON}
                            {--strict : Treat warnings as failures}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform automated deployment preflight checks for production readiness';

    /**
     * Execute the console command.
     */
    public function handle(PreflightCheckService $preflightService): int
    {
        $isJson = (bool) $this->option('json');
        $isStrict = (bool) $this->option('strict');

        if (! $isJson) {
            $this->info('================================================================');
            $this->info(' Landing Commerce: Deployment Preflight Verification');
            $this->info('================================================================');
            $this->newLine();
        }

        $results = $preflightService->runAllChecks();

        if ($isJson) {
            $this->output->writeln(json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            if ($results['has_failures'] || ($isStrict && $results['has_warnings'])) {
                return self::FAILURE;
            }

            return self::SUCCESS;
        }

        $tableRows = [];
        $remediations = [];

        foreach ($results['checks'] as $check) {
            $statusFormatted = match ($check['status']) {
                'PASS' => '<info>PASS</info>',
                'WARN' => '<comment>WARN</comment>',
                'FAIL' => '<error>FAIL</error>',
            };

            $tableRows[] = [
                $statusFormatted,
                ucfirst($check['category']),
                $check['name'],
                $check['message'],
            ];

            if ($check['remediation'] !== null) {
                $remediations[] = [
                    'check' => $check['name'],
                    'status' => $check['status'],
                    'remediation' => $check['remediation'],
                ];
            }
        }

        $this->table(['Status', 'Category', 'Check', 'Details'], $tableRows);
        $this->newLine();

        if (! empty($remediations)) {
            $this->warn('Remediation Instructions:');
            foreach ($remediations as $index => $item) {
                $num = $index + 1;
                $tag = $item['status'] === 'FAIL' ? '<error>[FAIL]</error>' : '<comment>[WARN]</comment>';
                $this->line(" {$num}. {$tag} <options=bold>{$item['check']}:</> {$item['remediation']}");
            }
            $this->newLine();
        }

        if ($results['has_failures']) {
            $this->error('Preflight verification FAILED: One or more critical requirements are unmet.');

            return self::FAILURE;
        }

        if ($isStrict && $results['has_warnings']) {
            $this->error('Preflight verification FAILED: Strict mode enabled and warnings were detected.');

            return self::FAILURE;
        }

        if ($results['has_warnings']) {
            $this->warn('Preflight verification PASSED with warnings. Review the recommendations above before going live.');

            return self::SUCCESS;
        }

        $this->info('Preflight verification PASSED: All system requirements and security guardrails met.');

        return self::SUCCESS;
    }
}
