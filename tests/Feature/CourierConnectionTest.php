<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

function createCourierSettingsUser(string $role): User
{
    return User::factory()->create([
        'name' => ucfirst(str_replace('_', ' ', $role)),
        'email' => "{$role}_".uniqid().'@example.com',
        'role' => $role,
        'password' => bcrypt('secret123'),
    ]);
}

test('super admin can test unsaved steadfast credentials before saving', function () {
    Http::fake([
        'https://portal.steadfast.com.bd/api/v1/get_balance' => Http::response([
            'status' => 200,
            'current_balance' => 0,
        ], 200),
    ]);

    $admin = createCourierSettingsUser('super_admin');

    $response = $this->actingAs($admin)->postJson(route('admin.couriers.test-connection'), [
        'driver' => 'steadfast',
        'steadfast_api_key' => 'entered_api_key',
        'steadfast_secret_key' => 'entered_secret_key',
        'steadfast_base_url' => 'https://portal.steadfast.com.bd/api/v1',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('http_status', 200);

    Http::assertSent(fn ($request) => $request->url() === 'https://portal.steadfast.com.bd/api/v1/get_balance'
        && $request->hasHeader('Api-Key', 'entered_api_key')
        && $request->hasHeader('Secret-Key', 'entered_secret_key'));
});

test('courier test falls back to saved encrypted secrets when the form sends masks', function () {
    Http::fake([
        'https://portal.steadfast.com.bd/api/v1/get_balance' => Http::response([
            'status' => 200,
        ], 200),
    ]);

    $settings = app(SettingsService::class);
    $settings->set('courier.steadfast.api_key', 'saved_api_key', 'courier', true);
    $settings->set('courier.steadfast.secret_key', 'saved_secret_key', 'courier', true);

    $admin = createCourierSettingsUser('super_admin');

    $response = $this->actingAs($admin)->postJson(route('admin.couriers.test-connection'), [
        'driver' => 'steadfast',
        'steadfast_api_key' => SettingsService::SECRET_MASK,
        'steadfast_secret_key' => SettingsService::SECRET_MASK,
        'steadfast_base_url' => 'https://portal.steadfast.com.bd/api/v1',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);

    Http::assertSent(fn ($request) => $request->hasHeader('Api-Key', 'saved_api_key')
        && $request->hasHeader('Secret-Key', 'saved_secret_key'));
});

test('courier test returns a provider rejection without a server error', function () {
    Http::fake([
        'https://portal.steadfast.com.bd/api/v1/get_balance' => Http::response([
            'status' => 401,
            'message' => 'Invalid API credentials.',
        ], 401),
    ]);

    $admin = createCourierSettingsUser('super_admin');

    $response = $this->actingAs($admin)->postJson(route('admin.couriers.test-connection'), [
        'driver' => 'steadfast',
        'steadfast_api_key' => 'invalid_api_key',
        'steadfast_secret_key' => 'invalid_secret_key',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', false)
        ->assertJsonPath('http_status', 401);

    expect($response->json('message'))->toContain('Invalid API credentials');
});

test('courier test returns a validation error when required credentials are missing', function () {
    config()->set('courier.drivers.steadfast.api_key', null);
    config()->set('courier.drivers.steadfast.secret_key', null);

    $admin = createCourierSettingsUser('super_admin');

    $response = $this->actingAs($admin)->postJson(route('admin.couriers.test-connection'), [
        'driver' => 'steadfast',
        'steadfast_api_key' => '',
        'steadfast_secret_key' => '',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('success', false);

    expect($response->json('message'))->toContain('missing required configuration credentials');
});

test('courier test rejects unsupported drivers', function () {
    $admin = createCourierSettingsUser('super_admin');

    $this->actingAs($admin)->postJson(route('admin.couriers.test-connection'), [
        'driver' => 'unsupported',
    ])->assertStatus(422)
        ->assertJsonValidationErrors('driver');
});

test('non super admin users cannot test courier credentials', function () {
    $manager = createCourierSettingsUser('store_manager');

    $this->actingAs($manager)->postJson(route('admin.couriers.test-connection'), [
        'driver' => 'steadfast',
    ])->assertForbidden();

    Http::assertNothingSent();
});
