<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\Setup\Services\PreflightCheckService;
use App\Modules\Setup\Services\SetupWizardService;
use App\Modules\Shipping\Models\District;
use App\Modules\Shipping\Models\ShippingZone;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;

uses(RefreshDatabase::class);

test('commerce:preflight command executes and outputs structured preflight checks', function () {
    $exitCode = Artisan::call('commerce:preflight');
    $output = Artisan::output();

    expect($exitCode)->toBe(0)
        ->and($output)->toContain('Landing Commerce: Deployment Preflight Verification')
        ->and($output)->toContain('PHP Version')
        ->and($output)->toContain('Document Root Isolation')
        ->and($output)->toContain('Preflight verification PASSED');
});

test('commerce:preflight --json returns valid JSON schema', function () {
    $exitCode = Artisan::call('commerce:preflight', ['--json' => true]);
    $output = Artisan::output();

    expect($exitCode)->toBe(0);

    $json = json_decode($output, true);
    expect($json)->toBeArray()
        ->and($json)->toHaveKeys(['passed', 'has_failures', 'has_warnings', 'checks'])
        ->and($json['passed'])->toBeTrue()
        ->and($json['checks'])->toBeArray()->not->toBeEmpty();

    $firstCheck = $json['checks'][0];
    expect($firstCheck)->toHaveKeys(['id', 'category', 'name', 'status', 'message', 'remediation']);
});

test('PreflightCheckService flags insecure production HTTPS and cookie configuration as WARN', function () {
    Config::set('app.env', 'production');
    Config::set('app.url', 'http://insecure-domain.com');
    Config::set('session.secure', false);

    $service = app(PreflightCheckService::class);
    $result = $service->checkHttpsAndCookies();

    expect($result['status'])->toBe('WARN')
        ->and($result['message'])->toContain('APP_URL is not configured with https://')
        ->and($result['message'])->toContain('SESSION_SECURE_COOKIE is not enabled');
});

test('PreflightCheckService approves HTTPS and secure cookies when configured for production', function () {
    Config::set('app.env', 'production');
    Config::set('app.url', 'https://secure-store.com');
    Config::set('session.secure', true);

    $service = app(PreflightCheckService::class);
    $result = $service->checkHttpsAndCookies();

    expect($result['status'])->toBe('PASS');
});

test('PreflightCheckService detects critical security failure if .env exists in public directory', function () {
    $fakePublicEnv = public_path('.env');
    file_put_contents($fakePublicEnv, 'APP_KEY=secret_leak');

    try {
        $service = app(PreflightCheckService::class);
        $result = $service->checkDocumentRootIsolation();

        expect($result['status'])->toBe('FAIL')
            ->and($result['message'])->toContain('.env file was detected inside public document root');
    } finally {
        if (file_exists($fakePublicEnv)) {
            @unlink($fakePublicEnv);
        }
    }
});

test('PreflightCheckService handles database connection failures gracefully with FAIL status', function () {
    $mockConnection = Mockery::mock(ConnectionInterface::class);
    $mockConnection->shouldReceive('getPdo')
        ->andThrow(new RuntimeException('Connection refused to database host'));

    $service = new PreflightCheckService($mockConnection);
    $result = $service->checkDatabaseConnectionAndPrivileges();

    expect($result['status'])->toBe('FAIL')
        ->and($result['message'])->toContain('Connection refused to database host')
        ->and($result['remediation'])->toContain('Verify DB_CONNECTION');
});

test('commerce:install runs migrations, creates initial Super Admin, and seeds demo store', function () {
    expect(User::where('role', 'super_admin')->count())->toBe(0);

    $this->artisan('commerce:install', [
        '--force' => true,
        '--admin-name' => 'Initial Admin',
        '--admin-email' => 'admin@landingcommerce.com',
        '--admin-password' => 'SecurePass123!',
    ])
        ->expectsOutputToContain('Installation Completed Successfully')
        ->expectsOutputToContain('Super Admin account successfully created')
        ->assertExitCode(0);

    // Verify Super Admin was created
    $admin = User::where('email', 'admin@landingcommerce.com')->first();
    expect($admin)->not->toBeNull()
        ->and($admin->role)->toBe('super_admin')
        ->and($admin->name)->toBe('Initial Admin');

    // Verify password is encrypted and never plaintext
    expect($admin->password)->not->toBe('SecurePass123!')
        ->and(password_verify('SecurePass123!', $admin->password))->toBeTrue();

    // Verify seeds ran
    expect(District::count())->toBeGreaterThan(0)
        ->and(ShippingZone::count())->toBeGreaterThan(0)
        ->and(LandingPage::where('slug', 'smartwatch-deal')->exists())->toBeTrue();
});

test('commerce:install is idempotent and protects existing Super Admin from being overwritten or duplicated', function () {
    // 1. First run creates the Super Admin
    User::create([
        'name' => 'Existing Admin',
        'email' => 'first.admin@example.com',
        'password' => bcrypt('OriginalPassword123!'),
        'role' => 'super_admin',
    ]);

    expect(User::where('role', 'super_admin')->count())->toBe(1);

    // 2. Second run attempts to create another admin
    $this->artisan('commerce:install', [
        '--force' => true,
        '--admin-name' => 'Attacker Admin',
        '--admin-email' => 'attacker@example.com',
        '--admin-password' => 'HackedPassword123!',
    ])
        ->expectsOutputToContain('A Super Admin account already exists')
        ->expectsOutputToContain('Skipping Super Admin creation')
        ->assertExitCode(0);

    // Verify count did not increase
    expect(User::where('role', 'super_admin')->count())->toBe(1);
    expect(User::where('email', 'attacker@example.com')->exists())->toBeFalse();

    // Original admin password unchanged
    $original = User::where('email', 'first.admin@example.com')->first();
    expect(password_verify('OriginalPassword123!', $original->password))->toBeTrue();
});

test('SetupWizardService validates email format and password length strictly', function () {
    $wizard = app(SetupWizardService::class);

    expect(fn () => $wizard->createSuperAdmin('Admin', 'invalid-email', 'ValidPass123!'))
        ->toThrow(InvalidArgumentException::class, 'Invalid email address format');

    expect(fn () => $wizard->createSuperAdmin('Admin', 'admin@example.com', 'short'))
        ->toThrow(InvalidArgumentException::class, 'at least 8 characters long');
});

test('commerce:install with --no-demo skips demo landing page seeding', function () {
    Artisan::call('commerce:install', [
        '--force' => true,
        '--no-demo' => true,
        '--admin-email' => 'nodemo@example.com',
        '--admin-password' => 'SecurePass123!',
    ]);

    expect(LandingPage::where('slug', 'smartwatch-deal')->exists())->toBeFalse()
        ->and(District::count())->toBeGreaterThan(0);
});

test('commerce:install aborts when preflight checks fail', function () {
    // Simulate preflight failure by mocking PreflightCheckService
    $mockPreflight = Mockery::mock(PreflightCheckService::class);
    $mockPreflight->shouldReceive('runAllChecks')->andReturn([
        'passed' => false,
        'has_failures' => true,
        'has_warnings' => false,
        'checks' => [
            [
                'id' => 'php_version',
                'category' => 'environment',
                'name' => 'PHP Version',
                'status' => 'FAIL',
                'message' => 'PHP version requirement unmet',
                'remediation' => 'Upgrade PHP',
            ],
        ],
    ]);

    $this->app->instance(PreflightCheckService::class, $mockPreflight);

    $exitCode = Artisan::call('commerce:install', [
        '--force' => true,
        '--admin-email' => 'fail@example.com',
        '--admin-password' => 'SecurePass123!',
    ]);

    $output = Artisan::output();

    expect($exitCode)->toBe(1)
        ->and($output)->toContain('Preflight checks failed')
        ->and(User::where('email', 'fail@example.com')->exists())->toBeFalse();
});
