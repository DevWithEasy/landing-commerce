<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Payments\Models\PaymentMethod;
use App\Modules\Shipping\Models\ShippingMethod;
use App\Modules\Shipping\Services\ShippingCalculatorService;
use Database\Seeders\BangladeshGeographicSeeder;
use Database\Seeders\ShippingAndPaymentMethodSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);
    $this->seed(ShippingAndPaymentMethodSeeder::class);

    $this->superAdmin = User::factory()->create([
        'email' => 'super@example.com',
        'role' => 'super_admin',
    ]);

    $this->storeManager = User::factory()->create([
        'email' => 'manager@example.com',
        'role' => 'store_manager',
    ]);

    $this->fulfillmentAgent = User::factory()->create([
        'email' => 'agent@example.com',
        'role' => 'fulfillment_agent',
    ]);

    $this->product = Product::create([
        'title' => 'Smart Watch Pro',
        'slug' => 'smart-watch-pro',
        'regular_price' => 2500.00,
        'sale_price' => 2200.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'WATCH-PRO-BLK',
        'name' => 'Black',
        'regular_price' => 2500.00,
        'sale_price' => 2200.00,
        'stock_quantity' => 20,
        'manage_stock' => true,
    ]);
});

test('shipping calculator resolves available methods and rates for zones', function () {
    /** @var ShippingCalculatorService $calculator */
    $calculator = app(ShippingCalculatorService::class);

    // 1. Inside Dhaka
    $dhakaResult = $calculator->calculate('Dhaka');
    expect($dhakaResult->zoneCode)->toBe('inside_dhaka')
        ->and($dhakaResult->shippingFee)->toBe(70.0)
        ->and($dhakaResult->availableMethods)->not->toBeEmpty();

    // Specific method: Express
    $expressMethod = ShippingMethod::where('code', 'inside_dhaka_express')->first();
    $expressResult = $calculator->calculate('Dhaka', null, $expressMethod->id);
    expect($expressResult->shippingFee)->toBe(120.0)
        ->and($expressResult->shippingMethodName)->toBe($expressMethod->name);

    // 2. Sub-Dhaka (Savar)
    $savarResult = $calculator->calculate('Dhaka', 'Savar');
    expect($savarResult->zoneCode)->toBe('sub_dhaka')
        ->and($savarResult->shippingFee)->toBe(100.0);

    // 3. Outside Dhaka (Chittagong)
    $ctgResult = $calculator->calculate('Chittagong');
    expect($ctgResult->zoneCode)->toBe('outside_dhaka')
        ->and($ctgResult->shippingFee)->toBe(130.0);
});

test('checkout endpoint returns available methods and dynamic rate', function () {
    $response = $this->postJson(route('checkout.shipping-fee'), [
        'district' => 'Dhaka',
    ]);

    $response->assertOk()
        ->assertJsonPath('zone_code', 'inside_dhaka')
        ->assertJsonPath('shipping_fee', 70)
        ->assertJsonStructure([
            'shipping_fee',
            'zone_code',
            'zone_name',
            'delivery_time',
            'shipping_method_id',
            'shipping_method_name',
            'available_methods',
        ]);
});

test('customer can place order with selected shipping method and preserves snapshots', function () {
    $expressMethod = ShippingMethod::where('code', 'inside_dhaka_express')->firstOrFail();

    $payload = [
        'name' => 'Rashidul Islam',
        'phone' => '01812345678',
        'address' => 'Banani Road 11',
        'district' => 'Dhaka',
        'shipping_method_id' => $expressMethod->id,
        'idempotency_key' => (string) Str::uuid(),
        'items' => [
            ['variant_id' => $this->variant->id, 'quantity' => 1],
        ],
    ];

    $response = $this->postJson(route('checkout.cod.store'), $payload);

    $response->assertStatus(201)
        ->assertJsonPath('order.shipping_fee', '120.00')
        ->assertJsonPath('order.shipping_method_id', $expressMethod->id)
        ->assertJsonPath('order.shipping_method_name', $expressMethod->name)
        ->assertJsonPath('order.payment_method', 'cod')
        ->assertJsonPath('order.payment_status', 'unpaid');

    $order = Order::where('idempotency_key', $payload['idempotency_key'])->firstOrFail();
    expect($order->shipping_method_name)->toBe($expressMethod->name)
        ->and($order->payment_status)->toBe('unpaid')
        ->and($order->shippingMethod)->not->toBeNull();
});

test('disabled or out-of-zone shipping method is rejected by checkout', function () {
    $disabledMethod = ShippingMethod::create([
        'name' => 'Secret VIP Drone Delivery',
        'code' => 'drone-vip',
        'zone_code' => 'inside_dhaka',
        'rate' => 500.00,
        'is_active' => false,
        'is_default' => false,
    ]);

    $payload = [
        'name' => 'Customer Test',
        'phone' => '01711122233',
        'address' => 'Gulshan 2',
        'district' => 'Dhaka',
        'shipping_method_id' => $disabledMethod->id,
        'idempotency_key' => (string) Str::uuid(),
        'items' => [
            ['variant_id' => $this->variant->id, 'quantity' => 1],
        ],
    ];

    $response = $this->postJson(route('checkout.cod.store'), $payload);
    $response->assertStatus(422)
        ->assertJsonValidationErrors(['shipping_method_id']);
});

test('soft-deleting a shipping method preserves order history and referential integrity', function () {
    $method = ShippingMethod::where('code', 'inside_dhaka_express')->firstOrFail();

    $order = Order::create([
        'order_number' => 'ORD-TEST-HIST01',
        'idempotency_key' => (string) Str::uuid(),
        'customer_name' => 'Historical Customer',
        'customer_phone' => '01712345678',
        'delivery_address' => 'Dhanmondi 32',
        'district' => 'Dhaka',
        'subtotal' => 2200.00,
        'shipping_fee' => 120.00,
        'total' => 2320.00,
        'shipping_method_id' => $method->id,
        'shipping_method_name' => $method->name,
        'payment_method' => 'cod',
        'payment_status' => 'unpaid',
        'status' => OrderStatus::PENDING,
    ]);

    // Admin soft-deletes the method
    $method->delete();

    // Verify order still has method snapshot and can retrieve soft-deleted relation
    $refreshedOrder = Order::find($order->id);
    expect($refreshedOrder->shipping_method_name)->toBe($method->name)
        ->and($refreshedOrder->shippingMethod)->not->toBeNull()
        ->and($refreshedOrder->shippingMethod->trashed())->toBeTrue();
});

test('manual MFS payment method requires TrxID and marks order pending_verification', function () {
    // Enable bKash manual payment method
    $bkash = PaymentMethod::where('code', 'bkash')->firstOrFail();
    $bkash->update([
        'is_active' => true,
        'account_number' => '01712345678',
        'instructions' => 'Send Money to 01712345678 and enter TrxID below.',
        'requires_transaction_id' => true,
    ]);

    // 1. Missing TrxID fails validation
    $badPayload = [
        'name' => 'Tareq Aziz',
        'phone' => '01912345678',
        'address' => 'Mirpur 10',
        'district' => 'Dhaka',
        'payment_method' => 'bkash',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [
            ['variant_id' => $this->variant->id, 'quantity' => 1],
        ],
    ];

    $response = $this->postJson(route('checkout.cod.store'), $badPayload);
    $response->assertStatus(422)
        ->assertJsonValidationErrors(['payment_transaction_id']);

    // 2. With valid TrxID succeeds and status is pending_verification (NEVER paid)
    $goodPayload = array_merge($badPayload, [
        'idempotency_key' => (string) Str::uuid(),
        'payment_transaction_id' => '9B7X2K4L1A',
    ]);

    $response2 = $this->postJson(route('checkout.cod.store'), $goodPayload);
    $response2->assertStatus(201)
        ->assertJsonPath('order.payment_method', 'bkash')
        ->assertJsonPath('order.payment_status', 'pending_verification')
        ->assertJsonPath('order.payment_transaction_id', '9B7X2K4L1A');

    $order = Order::where('idempotency_key', $goodPayload['idempotency_key'])->firstOrFail();
    expect($order->payment_status)->toBe('pending_verification')
        ->and($order->payment_status)->not->toBe('paid')
        ->and($order->payment_transaction_id)->toBe('9B7X2K4L1A')
        ->and($order->payment_details['account_number'])->toBe('01712345678');
});

test('disabled payment method is rejected by checkout', function () {
    $nagad = PaymentMethod::where('code', 'nagad')->firstOrFail();
    expect($nagad->is_active)->toBeFalse();

    $payload = [
        'name' => 'Fahim Ahmed',
        'phone' => '01712345678',
        'address' => 'Uttara Sector 7',
        'district' => 'Dhaka',
        'payment_method' => 'nagad',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [
            ['variant_id' => $this->variant->id, 'quantity' => 1],
        ],
    ];

    $response = $this->postJson(route('checkout.cod.store'), $payload);
    $response->assertStatus(422)
        ->assertJsonValidationErrors(['payment_method']);
});

test('RBAC: super_admin and store_manager can manage shipping and payment methods', function () {
    // 1. Super Admin can access and create
    $this->actingAs($this->superAdmin)
        ->get(route('admin.shipping-methods.index'))
        ->assertOk();

    $this->actingAs($this->superAdmin)
        ->get(route('admin.payment-methods.index'))
        ->assertOk();

    $this->actingAs($this->superAdmin)
        ->post(route('admin.shipping-methods.store'), [
            'name' => 'Overnight Cargo',
            'code' => 'overnight-cargo',
            'zone_code' => 'outside_dhaka',
            'rate' => 200.00,
            'is_active' => true,
        ])
        ->assertRedirect();

    expect(ShippingMethod::where('code', 'overnight-cargo')->exists())->toBeTrue();

    // 2. Store Manager can manage
    $this->actingAs($this->storeManager)
        ->get(route('admin.shipping-methods.index'))
        ->assertOk();

    $this->actingAs($this->storeManager)
        ->post(route('admin.payment-methods.store'), [
            'name' => 'Upay MFS',
            'code' => 'upay',
            'is_active' => false,
            'requires_transaction_id' => true,
        ])
        ->assertRedirect();

    expect(PaymentMethod::where('code', 'upay')->exists())->toBeTrue();

    // 3. Fulfillment Agent is strictly forbidden (403)
    $this->actingAs($this->fulfillmentAgent)
        ->get(route('admin.shipping-methods.index'))
        ->assertForbidden();

    $this->actingAs($this->fulfillmentAgent)
        ->post(route('admin.shipping-methods.store'), [
            'name' => 'Hacked Free Shipping',
            'rate' => 0,
        ])
        ->assertForbidden();

    $this->actingAs($this->fulfillmentAgent)
        ->get(route('admin.payment-methods.index'))
        ->assertForbidden();
});

test('COD order payment status cannot be marked as paid at checkout', function () {
    $payload = [
        'name' => 'Salim Merchant',
        'phone' => '01712345678',
        'address' => 'Gulshan 1',
        'district' => 'Dhaka',
        'payment_method' => 'cod',
        'payment_status' => 'paid', // attempt injection
        'idempotency_key' => (string) Str::uuid(),
        'items' => [
            ['variant_id' => $this->variant->id, 'quantity' => 1],
        ],
    ];

    $response = $this->postJson(route('checkout.cod.store'), $payload);
    $response->assertStatus(201);

    $order = Order::where('idempotency_key', $payload['idempotency_key'])->firstOrFail();
    expect($order->payment_status)->toBe('unpaid')
        ->and($order->payment_status)->not->toBe('paid');
});
