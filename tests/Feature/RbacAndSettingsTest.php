<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

function createRbacUser(string $role): User
{
    return User::factory()->create([
        'name' => ucfirst(str_replace('_', ' ', $role)),
        'email' => "{$role}_".uniqid().'@example.com',
        'role' => $role,
        'password' => bcrypt('secret123'),
    ]);
}

function createRbacOrder(string $status = OrderStatus::PENDING): Order
{
    return Order::query()->create([
        'order_number' => 'ORD-RBAC-'.uniqid(),
        'idempotency_key' => 'idemp_'.uniqid(),
        'customer_name' => 'Fahim Ahmed',
        'customer_phone' => '01711223344',
        'delivery_address' => 'House 1, Road 2, Dhanmondi',
        'district' => 'Dhaka',
        'subtotal' => 1200.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 1270.00,
        'payment_method' => 'cod',
        'status' => $status,
    ]);
}

test('sensitive settings are encrypted in database and decrypted accurately', function () {
    $service = app(SettingsService::class);

    $plainSecret = 'sf_secret_key_998877665544';
    $service->set(
        key: 'courier.steadfast.secret_key',
        value: $plainSecret,
        group: 'courier',
        isEncrypted: true
    );

    // 1. Raw database value must be encrypted ciphertext, NOT plaintext
    $rawRecord = DB::table('settings')->where('key', 'courier.steadfast.secret_key')->first();
    expect($rawRecord)->not->toBeNull();
    expect($rawRecord->value)->not->toBe($plainSecret);
    expect($rawRecord->is_encrypted)->toBe(1);

    // Direct Crypt decrypt should match
    expect(Crypt::decryptString($rawRecord->value))->toBe($plainSecret);

    // 2. Service get() should decrypt and return the plaintext
    expect($service->get('courier.steadfast.secret_key'))->toBe($plainSecret);

    // 3. Non-secret settings are saved unencrypted
    $service->set('courier.steadfast.base_url', 'https://custom.endpoint.com', 'courier', false);
    $rawUrl = DB::table('settings')->where('key', 'courier.steadfast.base_url')->value('value');
    expect($rawUrl)->toBe('https://custom.endpoint.com');
});

test('secret masking protects credentials from leaking in ui props or api responses', function () {
    $service = app(SettingsService::class);

    $service->set('courier.steadfast.api_key', 'live_api_token_12345', 'courier', true);
    $service->set('sms.greenweb.token', 'gw_auth_token_9999', 'sms', true);

    $maskedUi = $service->getMaskedSettingsForUi();

    // Masked values must equal SECRET_MASK and never leak raw plaintext
    expect($maskedUi['steadfast_api_key'])->toBe(SettingsService::SECRET_MASK);
    expect($maskedUi['steadfast_api_key_configured'])->toBeTrue();
    expect($maskedUi['greenweb_token'])->toBe(SettingsService::SECRET_MASK);
    expect($maskedUi['greenweb_token_configured'])->toBeTrue();

    // Verify unconfigured credentials show empty string and configured false
    expect($maskedUi['redx_api_token'])->toBe('');
    expect($maskedUi['redx_api_token_configured'])->toBeFalse();
});

test('submitting masked credentials does not overwrite existing encrypted secrets', function () {
    $service = app(SettingsService::class);

    $originalSecret = 'original_super_secret_token';
    $service->set('courier.steadfast.api_key', $originalSecret, 'courier', true);

    // Simulate form submission where client sends back the masked placeholder
    $service->updateSettings([
        'courier_default' => 'steadfast',
        'steadfast_api_key' => SettingsService::SECRET_MASK,
        'steadfast_base_url' => 'https://api.steadfast.com',
    ]);

    // Secret must NOT be overwritten with asterisks
    expect($service->get('courier.steadfast.api_key'))->toBe($originalSecret);
    expect($service->get('courier.default'))->toBe('steadfast');

    // Updating with an actual new value must re-encrypt and update
    $service->updateSettings([
        'steadfast_api_key' => 'new_rotated_secret_9988',
    ]);
    expect($service->get('courier.steadfast.api_key'))->toBe('new_rotated_secret_9988');
});

test('super admin has full access to settings, catalog, orders, and backups', function () {
    $superAdmin = createRbacUser('super_admin');

    expect($superAdmin->canManageSettings())->toBeTrue();
    expect($superAdmin->canManageBackups())->toBeTrue();
    expect($superAdmin->canManageCatalog())->toBeTrue();
    expect($superAdmin->canManageOrders())->toBeTrue();
    expect($superAdmin->canManageLandingPages())->toBeTrue();

    // Can access Settings dashboard
    $this->actingAs($superAdmin)
        ->get(route('admin.settings.index'))
        ->assertOk();

    // Can update Settings
    $this->actingAs($superAdmin)
        ->post(route('admin.settings.update'), [
            'store_name' => 'Dhaka Heritage Commerce',
            'courier_default' => 'mock',
            'sms_default' => 'mock',
        ])
        ->assertRedirect(route('admin.settings.index'))
        ->assertSessionHas('success');

    // Can access catalog
    $this->actingAs($superAdmin)
        ->get(route('admin.products.index'))
        ->assertOk();
});

test('store manager can manage products and orders but is forbidden from settings and backups', function () {
    $manager = createRbacUser('store_manager');

    expect($manager->canManageCatalog())->toBeTrue();
    expect($manager->canManageOrders())->toBeTrue();
    expect($manager->canManageLandingPages())->toBeTrue();
    expect($manager->canManageSettings())->toBeFalse();
    expect($manager->canManageBackups())->toBeFalse();

    // Access to settings must be 403 Forbidden
    $this->actingAs($manager)
        ->get(route('admin.settings.index'))
        ->assertForbidden();

    $this->actingAs($manager)
        ->post(route('admin.settings.update'), [
            'store_name' => 'Hacked Store Name',
        ])
        ->assertForbidden();

    // Allowed to manage products
    $this->actingAs($manager)
        ->get(route('admin.products.index'))
        ->assertOk();

    // Allowed to manage orders
    $this->actingAs($manager)
        ->get(route('admin.orders.index'))
        ->assertOk();
});

test('fulfillment agent cannot edit product prices or settings, but has full legitimate order fulfillment access', function () {
    $agent = createRbacUser('fulfillment_agent');

    expect($agent->canManageOrders())->toBeTrue();
    expect($agent->canManageCatalog())->toBeFalse();
    expect($agent->canEditProductPrices())->toBeFalse();
    expect($agent->canManageSettings())->toBeFalse();
    expect($agent->canManageBackups())->toBeFalse();
    expect($agent->canManageLandingPages())->toBeFalse();

    // Denied Settings
    $this->actingAs($agent)
        ->get(route('admin.settings.index'))
        ->assertForbidden();

    $this->actingAs($agent)
        ->post(route('admin.settings.update'), ['store_name' => 'Agent Store'])
        ->assertForbidden();

    // Denied Catalog & Product editing/prices
    $this->actingAs($agent)
        ->get(route('admin.products.index'))
        ->assertForbidden();

    $product = Product::query()->create([
        'title' => 'Test Product',
        'slug' => 'test-product-'.uniqid(),
        'regular_price' => 1000.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->actingAs($agent)
        ->put(route('admin.products.update', $product), [
            'title' => 'Price Hijack',
            'regular_price' => 1.00,
        ])
        ->assertForbidden();

    // Denied Landing Page editing
    $landingPage = LandingPage::query()->create([
        'title' => 'Campaign Page',
        'slug' => 'campaign-'.uniqid(),
        'status' => 'draft',
    ]);

    $this->actingAs($agent)
        ->postJson(route('admin.landing-pages.revisions.store', $landingPage), [
            'blocks' => [],
        ])
        ->assertForbidden();

    // ALLOWED: Full Order Fulfillment Workflow
    $order = createRbacOrder(OrderStatus::PENDING);

    // 1. View orders list
    $this->actingAs($agent)
        ->get(route('admin.orders.index'))
        ->assertOk();

    // 2. View order details
    $this->actingAs($agent)
        ->getJson(route('admin.orders.show', $order))
        ->assertOk();

    // 3. Update order state transition
    $this->actingAs($agent)
        ->post(route('admin.orders.transition', $order), [
            'status' => OrderStatus::CONFIRMED,
            'comment' => 'Confirmed by fulfillment agent',
        ])
        ->assertRedirect();

    // 4. Dispatch to courier
    $this->actingAs($agent)
        ->postJson(route('admin.orders.courier.dispatch', $order), [
            'driver' => 'mock',
            'recipient_name' => $order->customer_name,
            'recipient_phone' => $order->customer_phone,
            'recipient_address' => $order->delivery_address,
            'cod_amount' => $order->total,
        ])
        ->assertOk();

    // 5. Track courier
    $this->actingAs($agent)
        ->postJson(route('admin.orders.courier.track', $order))
        ->assertOk();

    // 6. Send order SMS notification
    $this->actingAs($agent)
        ->post(route('admin.orders.sms.send', $order), [
            'driver' => 'mock',
            'template' => 'order_confirmed',
        ])
        ->assertRedirect();

    // 7. Thermal & A4 Invoice print
    $this->actingAs($agent)
        ->get(route('admin.orders.invoice', ['order' => $order, 'type' => 'thermal']))
        ->assertOk();

    // 8. CSV export
    $this->actingAs($agent)
        ->get(route('admin.orders.export'))
        ->assertOk();
});

test('guest is rejected from accessing administrative endpoints', function () {
    $this->get(route('admin.settings.index'))
        ->assertRedirect(route('login'));

    $this->get(route('admin.orders.index'))
        ->assertRedirect(route('login'));

    $this->get(route('admin.products.index'))
        ->assertRedirect(route('login'));
});

test('login authentication succeeds with valid credentials and clears rate limiter', function () {
    $user = User::factory()->create([
        'email' => 'admin.login.test@example.com',
        'password' => bcrypt('password123'),
        'role' => 'super_admin',
    ]);

    $response = $this->post(route('login.attempt'), [
        'email' => 'admin.login.test@example.com',
        'password' => 'password123',
    ]);

    $response->assertRedirect(route('admin.dashboard'));
    $this->assertAuthenticatedAs($user);
});

test('authentication endpoint enforces rate limiting against brute force attacks', function () {
    RateLimiter::clear('attacker@example.com|127.0.0.1');

    $targetEmail = 'attacker@example.com';

    // 5 failed attempts allowed (returning 422)
    for ($i = 1; $i <= 5; $i++) {
        $response = $this->post(route('login.attempt'), [
            'email' => $targetEmail,
            'password' => "wrong-password-{$i}",
        ]);

        $response->assertSessionHasErrors(['email']);
    }

    // 6th attempt must be throttled with HTTP 429
    $throttledResponse = $this->post(route('login.attempt'), [
        'email' => $targetEmail,
        'password' => 'wrong-password-6',
    ]);

    $throttledResponse->assertStatus(429);
});

test('logout revokes authenticated session and redirects to login', function () {
    $user = createRbacUser('super_admin');

    $response = $this->actingAs($user)
        ->post(route('logout'));

    $response->assertRedirect(route('login'));
    $this->assertGuest();
});
