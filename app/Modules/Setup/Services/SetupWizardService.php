<?php

declare(strict_types=1);

namespace App\Modules\Setup\Services;

use App\Models\User;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\Shipping\Models\District;
use App\Modules\Shipping\Models\ShippingZone;
use Database\Seeders\BangladeshGeographicSeeder;
use Database\Seeders\DemoLandingPageSeeder;
use Database\Seeders\ShippingZoneSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class SetupWizardService
{
    public function __construct(
        protected PreflightCheckService $preflightService
    ) {}

    /**
     * Run preflight checks before installation.
     *
     * @return array{
     *     passed: bool,
     *     has_failures: bool,
     *     has_warnings: bool,
     *     checks: list<array<string, mixed>>
     * }
     */
    public function runPreflight(): array
    {
        return $this->preflightService->runAllChecks();
    }

    /**
     * Run pending database migrations safely without dropping any tables.
     *
     * @return array{
     *     success: bool,
     *     exit_code: int,
     *     output: string
     * }
     */
    public function runMigrations(): array
    {
        try {
            $exitCode = Artisan::call('migrate', ['--force' => true]);
            $output = Artisan::output();

            return [
                'success' => $exitCode === 0,
                'exit_code' => $exitCode,
                'output' => trim($output),
            ];
        } catch (Throwable $e) {
            throw new RuntimeException("Migration failed: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Create the initial Super Admin account idempotently.
     *
     * @return array{
     *     created: bool,
     *     reason?: string,
     *     email: string,
     *     user_id?: int
     * }
     */
    public function createSuperAdmin(string $name, string $email, string $password): array
    {
        $name = trim($name);
        $email = strtolower(trim($email));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("Invalid email address format: [{$email}].");
        }

        if (strlen($password) < 8) {
            throw new InvalidArgumentException('Password must be at least 8 characters long.');
        }

        // Check if user with this email already exists
        $existingByEmail = User::where('email', $email)->first();
        if ($existingByEmail !== null) {
            return [
                'created' => false,
                'reason' => 'email_already_exists',
                'email' => $email,
                'user_id' => $existingByEmail->id,
            ];
        }

        // Check if any Super Admin already exists in the system
        $existingSuperAdmin = User::where('role', 'super_admin')->first();
        if ($existingSuperAdmin !== null) {
            return [
                'created' => false,
                'reason' => 'super_admin_already_exists',
                'email' => $existingSuperAdmin->email,
                'user_id' => $existingSuperAdmin->id,
            ];
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'super_admin',
        ]);

        return [
            'created' => true,
            'email' => $user->email,
            'user_id' => $user->id,
        ];
    }

    /**
     * Seed initial Bangladesh geographic data, shipping rates, and optional demo store.
     *
     * @return array{
     *     districts_seeded: int,
     *     shipping_zones_seeded: int,
     *     demo_seeded: bool
     * }
     */
    public function seedInitialData(bool $includeDemo = true): array
    {
        // 1. Bangladesh Geographic Data
        app(BangladeshGeographicSeeder::class)->run();

        // 2. Shipping Matrix
        app(ShippingZoneSeeder::class)->run();

        // 3. Optional Demo Landing Page
        $demoSeeded = false;
        if ($includeDemo) {
            app(DemoLandingPageSeeder::class)->run();
            $demoSeeded = LandingPage::where('slug', 'smartwatch-deal')->exists();
        }

        return [
            'districts_seeded' => District::count(),
            'shipping_zones_seeded' => ShippingZone::count(),
            'demo_seeded' => $demoSeeded,
        ];
    }
}
