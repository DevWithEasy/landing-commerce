<?php

declare(strict_types=1);

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Customer\Models\Customer;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Shipping\Models\District;
use App\Modules\Shipping\Models\ShippingMethod;
use App\Modules\Shipping\Models\ShippingZone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    RateLimiter::clear('order-track|127.0.0.1');

    $zone = ShippingZone::create([
        'name' => 'Inside Dhaka',
        'code' => 'inside_dhaka',
        'rate' => 60.00,
        'delivery_time' => '24-48 hours',
        'is_active' => true,
    ]);

    District::create([
        'name' => 'Dhaka',
        'bn_name' => 'ঢাকা',
        'shipping_zone_id' => $zone->id,
    ]);

    $this->shippingMethod = ShippingMethod::create([
        'code' => 'std_dhaka',
        'name' => 'Standard Delivery',
        'shipping_zone_id' => $zone->id,
        'rate' => 60.00,
        'is_active' => true,
        'is_default' => true,
        'sort_order' => 1,
    ]);

    $this->rawToken = bin2hex(random_bytes(32));
    $this->tokenHash = hash('sha256', $this->rawToken);

    $this->order = Order::create([
        'order_number' => 'ORD-20261019-TRACK01',
        'tracking_token_hash' => $this->tokenHash,
        'customer_name' => 'Shakib Al Hasan',
        'customer_phone' => '01712345678',
        'delivery_address' => 'Banani, Dhaka',
        'district' => 'Dhaka',
        'status' => OrderStatus::IN_TRANSIT,
        'payment_method' => 'cod',
        'payment_status' => 'pending',
        'subtotal' => 1200.00,
        'shipping_fee' => 60.00,
        'discount' => 0.00,
        'total' => 1260.00,
        'courier_name' => 'steadfast',
        'courier_tracking_id' => 'ST12345678',
        'courier_tracking_url' => 'https://steadfast.com.bd/t/ST12345678',
        'notes' => 'Internal merchant note - must not be leaked',
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $product = Product::create([
        'title' => 'Test Product',
        'slug' => 'test-product',
        'regular_price' => 1200.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'TP-01',
        'name' => 'Default',
        'regular_price' => 1200.00,
        'sale_price' => null,
        'stock_quantity' => 10,
        'manage_stock' => true,
    ]);

    OrderItem::create([
        'order_id' => $this->order->id,
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'product_title' => $product->title,
        'variant_name' => $variant->name,
        'unit_price' => 1200.00,
        'quantity' => 1,
        'total_price' => 1200.00,
        'is_restocked' => false,
    ]);
});

test('guest can track order using cryptographic token without exposing internal secrets', function () {
    $response = $this->postJson(route('order.track.post'), [
        'token' => $this->rawToken,
    ]);

    $response->assertOk();
    $response->assertJson([
        'order' => [
            'order_number' => 'ORD-20261019-TRACK01',
            'status' => OrderStatus::IN_TRANSIT,
            'district' => 'Dhaka',
            'total' => 1260.00,
            'courier_name' => 'steadfast',
            'courier_tracking_id' => 'ST12345678',
        ],
    ]);

    // Ensure internal notes and hash are not exposed
    $responseData = $response->json('order');
    expect($responseData)->not->toHaveKey('notes')
        ->and($responseData)->not->toHaveKey('tracking_token_hash')
        ->and($responseData)->not->toHaveKey('idempotency_key');
});

test('guest can track order using order number and matching phone number', function () {
    // Test with Bangladesh local format phone (01712345678)
    $response = $this->postJson(route('order.track.post'), [
        'order_number' => 'ORD-20261019-TRACK01',
        'phone' => '01712345678',
    ]);

    $response->assertOk();
    $response->assertJson([
        'order' => [
            'order_number' => 'ORD-20261019-TRACK01',
        ],
    ]);

    // Test with international +880 format phone
    $responseInternational = $this->postJson(route('order.track.post'), [
        'order_number' => 'ORD-20261019-TRACK01',
        'phone' => '+8801712345678',
    ]);

    $responseInternational->assertOk();
});

test('guest tracking fails safely when phone number does not match order number', function () {
    $response = $this->postJson(route('order.track.post'), [
        'order_number' => 'ORD-20261019-TRACK01',
        'phone' => '01899999999', // Mismatched phone
    ]);

    $response->assertNotFound();
    $response->assertJson([
        'error' => 'not_found',
        'message' => 'No matching order found for the provided information.',
    ]);
});

test('anti-enumeration: non-existent order number returns the exact same generic error', function () {
    $response = $this->postJson(route('order.track.post'), [
        'order_number' => 'ORD-99999999-NONEXISTENT',
        'phone' => '01712345678',
    ]);

    $response->assertNotFound();
    $response->assertJson([
        'error' => 'not_found',
        'message' => 'No matching order found for the provided information.',
    ]);
});

test('authenticated customer can track their own order by order number alone', function () {
    $customer = Customer::create([
        'name' => 'Shakib Al Hasan',
        'email' => 'shakib@example.com',
        'phone' => '01712345678',
        'password' => Hash::make('password123'),
    ]);

    $this->order->update(['customer_id' => $customer->id]);

    $this->actingAs($customer, 'customer');

    // Does not need to supply phone if authenticated as the order's owner
    $response = $this->postJson(route('order.track.post'), [
        'order_number' => 'ORD-20261019-TRACK01',
    ]);

    $response->assertOk();
    $response->assertJson([
        'order' => [
            'order_number' => 'ORD-20261019-TRACK01',
        ],
    ]);
});

test('tracking rate limiter blocks requests after 10 failed attempts', function () {
    $throttleKey = 'order-track|127.0.0.1';
    RateLimiter::clear($throttleKey);

    for ($i = 0; $i < 10; $i++) {
        $this->postJson(route('order.track.post'), [
            'order_number' => 'ORD-INVALID',
            'phone' => '01700000000',
        ]);
    }

    // 11th attempt must be rate-limited (429)
    $response = $this->postJson(route('order.track.post'), [
        'order_number' => 'ORD-INVALID',
        'phone' => '01700000000',
    ]);

    $response->assertStatus(429);
});

test('track order GET page preloads tracking data when valid token query param is provided', function () {
    $response = $this->get(route('order.track.show', ['token' => $this->rawToken]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Customer/TrackOrder')
        ->where('initialTracking.order_number', 'ORD-20261019-TRACK01')
    );
});
