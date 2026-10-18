<?php

declare(strict_types=1);

namespace App\Modules\Setup\Commands;

use App\Models\User;
use App\Modules\Setup\Services\SetupWizardService;
use Illuminate\Console\Command;
use Throwable;

class CommerceInstallCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'commerce:install
                            {--no-preflight : Skip preflight checks}
                            {--no-demo : Skip demo landing page and product seeding}
                            {--force : Run non-interactively without prompt confirmations}
                            {--admin-name= : Initial Super Admin name}
                            {--admin-email= : Initial Super Admin email}
                            {--admin-password= : Initial Super Admin password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run the safe, idempotent CLI setup wizard for Landing Commerce';

    /**
     * Execute the console command.
     */
    public function handle(SetupWizardService $setupWizard): int
    {
        $this->info('================================================================');
        $this->info(' Landing Commerce: Self-Hosted CLI Setup Wizard');
        $this->info('================================================================');
        $this->newLine();

        $force = (bool) $this->option('force');
        $skipPreflight = (bool) $this->option('no-preflight');
        $skipDemo = (bool) $this->option('no-demo');

        // Step 1: Preflight Verification
        if (! $skipPreflight) {
            $this->line('<options=bold>Step 1: Running deployment preflight checks...</>');
            $preflight = $setupWizard->runPreflight();

            if ($preflight['has_failures']) {
                $this->error('Preflight checks failed! Please resolve the critical issues before running installation.');
                $this->line('Run <info>php artisan commerce:preflight</info> for detailed diagnostics.');

                return self::FAILURE;
            }

            if ($preflight['has_warnings']) {
                $this->warn('Preflight completed with warnings.');
            } else {
                $this->info('Preflight checks passed successfully.');
            }
            $this->newLine();
        }

        // Confirmation prompt unless --force or non-interactive
        if (! $force && ! $this->confirm('Proceed with database setup and initial configuration?', true)) {
            $this->info('Setup cancelled by user.');

            return self::SUCCESS;
        }

        try {
            // Step 2: Database Migrations
            $this->line('<options=bold>Step 2: Running database migrations...</>');
            $migrationResult = $setupWizard->runMigrations();

            if (! $migrationResult['success']) {
                $this->error("Migration failed with exit code [{$migrationResult['exit_code']}].");

                return self::FAILURE;
            }
            $this->info('Database tables migrated successfully.');
            $this->newLine();

            // Step 3: Initial Super Admin Setup
            $this->line('<options=bold>Step 3: Configuring Super Admin Account...</>');
            $existingAdmin = User::where('role', 'super_admin')->first();

            if ($existingAdmin !== null) {
                $this->warn("A Super Admin account already exists in the system ([{$existingAdmin->email}]).");
                $this->info('Skipping Super Admin creation to prevent duplicate or overwritten credentials.');
            } else {
                $adminName = $this->option('admin-name');
                $adminEmail = $this->option('admin-email');
                $adminPassword = $this->option('admin-password');

                if (empty($adminName)) {
                    $adminName = $force ? 'Super Admin' : $this->ask('Enter Super Admin Name', 'Super Admin');
                }

                if (empty($adminEmail)) {
                    $adminEmail = $force ? 'admin@example.com' : $this->ask('Enter Super Admin Email', 'admin@example.com');
                }

                if (empty($adminPassword)) {
                    if ($force) {
                        $adminPassword = bin2hex(random_bytes(6)).'A1!';
                        $this->warn("Temporary Super Admin password generated: [{$adminPassword}]. Please change this immediately.");
                    } else {
                        do {
                            $adminPassword = (string) $this->secret('Enter Super Admin Password (min 8 characters)');
                            if (strlen($adminPassword) < 8) {
                                $this->error('Password must be at least 8 characters long.');
                            }
                        } while (strlen($adminPassword) < 8);
                    }
                }

                $adminResult = $setupWizard->createSuperAdmin((string) $adminName, (string) $adminEmail, (string) $adminPassword);

                if ($adminResult['created']) {
                    $this->info("Super Admin account successfully created for [{$adminResult['email']}].");
                } else {
                    $this->warn("Super Admin setup note: {$adminResult['reason']}.");
                }
            }
            $this->newLine();

            // Step 4: Geographic Data & Seeders
            $this->line('<options=bold>Step 4: Seeding Bangladesh geographic dataset & shipping matrix...</>');
            $seedResult = $setupWizard->seedInitialData(! $skipDemo);

            $this->info("Seeded {$seedResult['districts_seeded']} Bangladesh districts and {$seedResult['shipping_zones_seeded']} shipping zones.");

            if ($seedResult['demo_seeded']) {
                $this->info('Demo product and landing page campaign seeded successfully (slug: /smartwatch-deal).');
            }
            $this->newLine();

            // Summary
            $this->info('================================================================');
            $this->info(' Installation Completed Successfully! ');
            $this->info('================================================================');
            $this->line('Next steps:');
            $this->line(' 1. Log in to the Admin Dashboard at: <comment>'.url('/admin/login').'</comment>');
            $this->line(' 2. Configure courier and SMS gateway credentials in Admin Settings.');
            $this->line(' 3. Run <comment>php artisan commerce:backup</comment> to verify backup integrity.');
            $this->newLine();

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->newLine();
            $this->error('================================================================');
            $this->error('SETUP FAILED!');
            $this->error($e->getMessage());
            $this->error('================================================================');
            $this->warn('Recovery Instructions:');
            $this->line(' 1. Inspect the error message above.');
            $this->line(' 2. Check your .env database configuration (DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD).');
            $this->line(' 3. After fixing the issue, re-run: php artisan commerce:install');

            return self::FAILURE;
        }
    }
}
