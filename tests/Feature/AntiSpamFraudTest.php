<?php

declare(strict_types=1);

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Checkout\Actions\ProcessCodOrderAction;
use App\Modules\Checkout\Services\BlacklistService;
use App\Modules\Checkout\Services\OrderRateLimiter;
use App\Modules\Orders\Models\Order;
use Database\Seeders\BangladeshGeographicSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);
    $this->blacklistService = app(BlacklistService::class);
    $this->rateLimiter = app(OrderRateLimiter::class);

    RateLimiter::clear($this->rateLimiter->ipKey('127.0.0.1'));
    RateLimiter::clear($this->rateLimiter->ipKey('192.168.1.50'));

    $this->product = Product::create([
        'title' => 'Anti-Fraud Test Product',
        'slug' => 'anti-fraud-test-product',
        'regular_price' => 1500.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'FRAUD-TEST-1',
        'name' => 'Default',
        'regular_price' => 1500.00,
        'stock_quantity' => 20,
        'manage_stock' => true,
    ]);
});

test('rejects honeypot trap field submissions without decrementing stock or creating orders', function () {
    $initialStock = $this->variant->stock_quantity;

    // 1. Submit with _hp_trap populated
    $payload1 = [
        'name' => 'Spambot User',
        'phone' => '01711112222',
        'address' => 'Bot Address',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
        '_hp_trap' => 'http://spam-link.com',
    ];

    $response1 = $this->postJson(route('checkout.cod.store'), $payload1);
    $response1->assertStatus(422)
        ->assertJsonValidationErrors(['_hp_trap']);

    // 2. Submit with fax_number populated
    $payload2 = [
        'name' => 'Spambot User 2',
        'phone' => '01711112223',
        'address' => 'Bot Address 2',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
        'fax_number' => '+1234567890',
    ];

    $response2 = $this->postJson(route('checkout.cod.store'), $payload2);
    $response2->assertStatus(422)
        ->assertJsonValidationErrors(['fax_number']);

    // Verify stock and orders remained untouched
    expect($this->variant->fresh()->stock_quantity)->toBe($initialStock)
        ->and(Order::count())->toBe(0);
});

test('rejects blacklisted phone numbers before order processing or stock changes', function () {
    $initialStock = $this->variant->stock_quantity;
    $blacklistedPhone = '01799887766';

    $this->blacklistService->blacklist($blacklistedPhone, 'Fraudulent repeat cancelations');
    expect($this->blacklistService->isBlacklisted($blacklistedPhone))->toBeTrue()
        ->and($this->blacklistService->isBlacklisted('+88'.$blacklistedPhone))->toBeTrue();

    // Attempt checkout via API
    $response = $this->postJson(route('checkout.cod.store'), [
        'name' => 'Fraudster',
        'phone' => '+88'.$blacklistedPhone,
        'address' => 'Suspicious Location',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 2]],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['phone']);

    // Verify zero orders and untouched inventory
    expect($this->variant->fresh()->stock_quantity)->toBe($initialStock)
        ->and(Order::count())->toBe(0);

    // Verify domain action also rejects directly
    $action = app(ProcessCodOrderAction::class);
    expect(fn () => $action->execute([
        'customer_name' => 'Fraudster Direct',
        'customer_phone' => $blacklistedPhone,
        'delivery_address' => 'Direct',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]))->toThrow(InvalidArgumentException::class, 'This phone number is blocked from placing orders.');

    // Unblacklist and verify order succeeds
    $this->blacklistService->remove($blacklistedPhone);
    expect($this->blacklistService->isBlacklisted($blacklistedPhone))->toBeFalse();

    $validResponse = $this->postJson(route('checkout.cod.store'), [
        'name' => 'Rehabilitated User',
        'phone' => $blacklistedPhone,
        'address' => 'Legitimate Location',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]);
    $validResponse->assertStatus(201);
    expect($this->variant->fresh()->stock_quantity)->toBe($initialStock - 1);
});

test('enforces phone rate limit of maximum 1 checkout request per normalized phone per 5 minutes', function () {
    $phone = '01855667788';
    $this->rateLimiter->clear('127.0.0.1', $phone);

    $initialStock = $this->variant->stock_quantity;

    // First request: succeeds
    $res1 = $this->postJson(route('checkout.cod.store'), [
        'name' => 'Customer A',
        'phone' => $phone,
        'address' => 'Mirpur, Dhaka',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]);
    $res1->assertStatus(201);
    expect($this->variant->fresh()->stock_quantity)->toBe($initialStock - 1);

    // Second request with same phone (+88 prefix) within 5 minutes: rejected with 429
    $res2 = $this->postJson(route('checkout.cod.store'), [
        'name' => 'Customer A Rapid Attempt',
        'phone' => '+88'.$phone,
        'address' => 'Mirpur, Dhaka',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]);

    $res2->assertStatus(429)
        ->assertHeader('Retry-After')
        ->assertJsonPath('error', 'rate_limit_exceeded');

    $retryAfter = (int) $res2->headers->get('Retry-After');
    expect($retryAfter)->toBeGreaterThan(0)
        ->and($retryAfter)->toBeLessThanOrEqual(OrderRateLimiter::PHONE_DECAY_SECONDS);

    // Stock must not decrement on the rejected attempt
    expect($this->variant->fresh()->stock_quantity)->toBe($initialStock - 1);
});

test('enforces IP rate limit of maximum 3 checkout requests per IP per 15 minutes', function () {
    $testIp = '192.168.1.50';
    $this->rateLimiter->clear($testIp);

    $initialStock = $this->variant->stock_quantity;

    // Send 3 successful orders from the same IP with different phone numbers
    for ($i = 1; $i <= 3; $i++) {
        $phone = '0171100000'.$i;
        RateLimiter::clear($this->rateLimiter->phoneKey($phone));

        $res = $this->withServerVariables(['REMOTE_ADDR' => $testIp])
            ->postJson(route('checkout.cod.store'), [
                'name' => "Family Member {$i}",
                'phone' => $phone,
                'address' => 'Dhanmondi, Dhaka',
                'district' => 'Dhaka',
                'idempotency_key' => (string) Str::uuid(),
                'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
            ]);

        $res->assertStatus(201);
    }

    expect($this->variant->fresh()->stock_quantity)->toBe($initialStock - 3);

    // 4th request from same IP: rejected with 429 Too Many Requests
    $res4 = $this->withServerVariables(['REMOTE_ADDR' => $testIp])
        ->postJson(route('checkout.cod.store'), [
            'name' => 'Family Member 4',
            'phone' => '01711000004',
            'address' => 'Dhanmondi, Dhaka',
            'district' => 'Dhaka',
            'idempotency_key' => (string) Str::uuid(),
            'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
        ]);

    $res4->assertStatus(429)
        ->assertHeader('Retry-After')
        ->assertJsonPath('error', 'rate_limit_exceeded');

    $retryAfter = (int) $res4->headers->get('Retry-After');
    expect($retryAfter)->toBeGreaterThan(0)
        ->and($retryAfter)->toBeLessThanOrEqual(OrderRateLimiter::IP_DECAY_SECONDS);

    // Stock must remain unchanged after throttled attempt
    expect($this->variant->fresh()->stock_quantity)->toBe($initialStock - 3);
});

test('idempotent replay with identical idempotency key bypasses rate limiting and returns 200', function () {
    $phone = '01677889900';
    $idempotencyKey = (string) Str::uuid();
    $this->rateLimiter->clear('127.0.0.1', $phone);

    $payload = [
        'name' => 'Idempotent Buyer',
        'phone' => $phone,
        'address' => 'Uttara, Dhaka',
        'district' => 'Dhaka',
        'idempotency_key' => $idempotencyKey,
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ];

    // First request creates the order (201) and locks phone rate limit
    $res1 = $this->postJson(route('checkout.cod.store'), $payload);
    $res1->assertStatus(201);

    // Immediate replay with identical idempotency key (simulating network timeout or duplicate click)
    // Must return 200 with existing order instead of being blocked with 429
    $res2 = $this->postJson(route('checkout.cod.store'), $payload);
    $res2->assertStatus(200)
        ->assertJsonPath('order.idempotency_key', $idempotencyKey);
});
