<?php

declare(strict_types=1);

use App\Modules\Cart\Models\Cart;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Orders\Models\Order;
use App\Modules\Shipping\Models\District;
use App\Modules\Shipping\Models\ShippingMethod;
use App\Modules\Shipping\Models\ShippingZone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Setup shipping zone and method
    $zone = ShippingZone::create([
        'name' => 'Inside Dhaka',
        'code' => 'inside_dhaka',
        'rate' => 70.00,
        'delivery_time' => '24-48 hours',
        'is_active' => true,
    ]);

    District::create([
        'name' => 'Dhaka',
        'bn_name' => 'ঢাকা',
        'shipping_zone_id' => $zone->id,
    ]);

    $this->shippingMethod = ShippingMethod::create([
        'code' => 'std_delivery',
        'name' => 'Standard Home Delivery',
        'shipping_zone_id' => $zone->id,
        'rate' => 70.00,
        'is_active' => true,
        'is_default' => true,
        'sort_order' => 1,
    ]);

    // Setup Products
    $this->product1 = Product::create([
        'title' => 'Smart Watch Pro',
        'slug' => 'smart-watch-pro',
        'regular_price' => 2500.00,
        'sale_price' => 2200.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->variant1 = ProductVariant::create([
        'product_id' => $this->product1->id,
        'sku' => 'WATCH-PRO-1',
        'name' => 'Default',
        'regular_price' => 2500.00,
        'sale_price' => 2200.00,
        'stock_quantity' => 10,
        'manage_stock' => true,
    ]);

    $this->product2 = Product::create([
        'title' => 'Silicone Strap',
        'slug' => 'silicone-strap',
        'regular_price' => 300.00,
        'sale_price' => null,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->variant2 = ProductVariant::create([
        'product_id' => $this->product2->id,
        'sku' => 'STRAP-BLK-1',
        'name' => 'Black',
        'regular_price' => 300.00,
        'sale_price' => null,
        'stock_quantity' => 15,
        'manage_stock' => true,
    ]);
});

test('cart checkout purchases only authorized cart items and clears the cart on success', function () {
    // 1. Add items to cart
    $this->postJson('/cart/items', [
        'product_id' => $this->product1->id,
        'quantity' => 1,
    ])->assertStatus(200);

    $this->postJson('/cart/items', [
        'product_id' => $this->product2->id,
        'quantity' => 2,
    ])->assertStatus(200);

    // 2. Perform cart checkout
    $idempotencyKey = (string) Str::uuid();

    $response = $this->postJson('/checkout/cod', [
        'checkout_source' => 'cart',
        'customer_name' => 'Rahim Ahmed',
        'customer_phone' => '01712345678',
        'delivery_address' => 'House 12, Road 4, Dhanmondi',
        'district' => 'Dhaka',
        'shipping_method_id' => $this->shippingMethod->id,
        'idempotency_key' => $idempotencyKey,
    ]);

    $response->assertStatus(201);
    $orderId = $response->json('order.id');
    $order = Order::with('items')->findOrFail($orderId);

    // Subtotal: (2200 * 1) + (300 * 2) = 2800.00
    expect((float) $order->subtotal)->toBe(2800.00)
        ->and((float) $order->shipping_fee)->toBe(70.00)
        ->and((float) $order->total)->toBe(2870.00)
        ->and($order->items)->toHaveCount(2);

    // Stock decremented
    expect($this->variant1->fresh()->stock_quantity)->toBe(9)
        ->and($this->variant2->fresh()->stock_quantity)->toBe(13);

    // Cart is safely cleared
    $cartSummary = $this->getJson('/cart/summary')->json('cart');
    expect($cartSummary['total_items'])->toBe(0)
        ->and($cartSummary['items'])->toBeEmpty();
});

test('direct quick order purchases only the direct product and preserves unrelated cart items', function () {
    // 1. Guest has product1 in cart
    $this->postJson('/cart/items', [
        'product_id' => $this->product1->id,
        'quantity' => 2,
    ])->assertStatus(200);

    // 2. Customer performs direct Quick Order for product2 (Buy Now)
    $idempotencyKey = (string) Str::uuid();

    $response = $this->postJson('/checkout/cod', [
        'checkout_source' => 'direct',
        'customer_name' => 'Karim Hasan',
        'customer_phone' => '01812345678',
        'delivery_address' => 'Banani, Dhaka',
        'district' => 'Dhaka',
        'shipping_method_id' => $this->shippingMethod->id,
        'idempotency_key' => $idempotencyKey,
        'items' => [
            [
                'variant_id' => $this->variant2->id,
                'quantity' => 1,
            ],
        ],
    ]);

    $response->assertStatus(201);
    $order = Order::with('items')->find($response->json('order.id'));

    // Only product2 was ordered
    expect($order->items)->toHaveCount(1)
        ->and($order->items[0]->variant_id)->toBe($this->variant2->id)
        ->and((float) $order->subtotal)->toBe(300.00);

    // product1 stock unchanged; product2 stock decremented by 1
    expect($this->variant1->fresh()->stock_quantity)->toBe(10)
        ->and($this->variant2->fresh()->stock_quantity)->toBe(14);

    // Cart items were NOT cleared or touched by direct quick order!
    $cartSummary = $this->getJson('/cart/summary')->json('cart');
    expect($cartSummary['total_items'])->toBe(2)
        ->and($cartSummary['items'])->toHaveCount(1)
        ->and($cartSummary['items'][0]['product_id'])->toBe($this->product1->id);
});

test('failed checkout does not clear the cart', function () {
    $this->postJson('/cart/items', [
        'product_id' => $this->product1->id,
        'quantity' => 1,
    ])->assertStatus(200);

    // Submit checkout with invalid phone
    $response = $this->postJson('/checkout/cod', [
        'checkout_source' => 'cart',
        'customer_name' => 'Rahim Ahmed',
        'customer_phone' => '12345', // invalid
        'delivery_address' => 'Dhanmondi',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $response->assertStatus(422);

    // Cart items must remain completely intact
    $cartSummary = $this->getJson('/cart/summary')->json('cart');
    expect($cartSummary['total_items'])->toBe(1);
});

test('cart checkout ignores client-supplied tampered items or prices', function () {
    // True cart item: product1 (৳2200)
    $this->postJson('/cart/items', [
        'product_id' => $this->product1->id,
        'quantity' => 1,
    ])->assertStatus(200);

    // Attacker tries to inject product2 (৳300) instead in request body during cart checkout
    $response = $this->postJson('/checkout/cod', [
        'checkout_source' => 'cart',
        'customer_name' => 'Tester',
        'customer_phone' => '01912345678',
        'delivery_address' => 'Gulshan',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [
            [
                'variant_id' => $this->variant2->id,
                'quantity' => 10,
            ],
        ],
    ]);

    $response->assertStatus(201);
    $order = Order::with('items')->find($response->json('order.id'));

    // Server-authoritative: true product1 was purchased, not attacker's tampered product2!
    expect($order->items[0]->variant_id)->toBe($this->variant1->id)
        ->and((float) $order->subtotal)->toBe(2200.00);
});

test('empty cart checkout is rejected with validation error', function () {
    $response = $this->postJson('/checkout/cod', [
        'checkout_source' => 'cart',
        'customer_name' => 'Empty User',
        'customer_phone' => '01712345678',
        'delivery_address' => 'Uttara',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['cart']);
});

test('idempotent replay returns existing order without clearing cart twice or double deducting stock', function () {
    $this->postJson('/cart/items', [
        'product_id' => $this->product1->id,
        'quantity' => 1,
    ])->assertStatus(200);

    $idempotencyKey = (string) Str::uuid();

    $res1 = $this->postJson('/checkout/cod', [
        'checkout_source' => 'cart',
        'customer_name' => 'Replay User',
        'customer_phone' => '01712345678',
        'delivery_address' => 'Mirpur',
        'district' => 'Dhaka',
        'idempotency_key' => $idempotencyKey,
    ]);
    $res1->assertStatus(201);

    // Replay same request
    $res2 = $this->postJson('/checkout/cod', [
        'checkout_source' => 'cart',
        'customer_name' => 'Replay User',
        'customer_phone' => '01712345678',
        'delivery_address' => 'Mirpur',
        'district' => 'Dhaka',
        'idempotency_key' => $idempotencyKey,
    ]);

    $res2->assertStatus(200);
    expect($res2->json('order.id'))->toBe($res1->json('order.id'));

    // Stock was decremented only ONCE
    expect($this->variant1->fresh()->stock_quantity)->toBe(9);
});

test('checkout page renders in cart mode when cart has items', function () {
    $this->postJson('/cart/items', [
        'product_id' => $this->product1->id,
        'quantity' => 2,
    ])->assertStatus(200);

    $response = $this->get('/checkout');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Checkout/Show')
        ->where('mode', 'cart')
        ->has('cart')
        ->where('cart.total_items', 2)
        ->where('cart.subtotal', 4400)
    );
});

test('checkout page renders in direct mode when product slug is provided', function () {
    $response = $this->get("/checkout/{$this->product1->slug}");
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Checkout/Show')
        ->where('mode', 'direct')
        ->has('product')
        ->where('product.id', $this->product1->id)
    );
});
