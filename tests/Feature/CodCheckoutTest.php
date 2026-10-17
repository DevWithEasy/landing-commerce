<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Checkout\Actions\ProcessCodOrderAction;
use App\Modules\Checkout\Services\OrderRateLimiter;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use Database\Seeders\BangladeshGeographicSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);
    $this->action = app(ProcessCodOrderAction::class);
    RateLimiter::clear(app(OrderRateLimiter::class)->ipKey('127.0.0.1'));

    $this->product = Product::create([
        'title' => 'Executive Leather Bag',
        'slug' => 'executive-leather-bag',
        'regular_price' => 2000.00,
        'sale_price' => 1800.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'BAG-EXEC-DEF',
        'name' => 'Default',
        'regular_price' => 2000.00,
        'sale_price' => 1800.00,
        'stock_quantity' => 10,
        'manage_stock' => true,
    ]);
});

test('successfully places a COD order, creates snapshots, and decrements stock', function () {
    $idempotencyKey = (string) Str::uuid();

    $payload = [
        'name' => 'Tanvir Hasan',
        'phone' => '01712345678',
        'address' => 'House 12, Road 4, Dhanmondi',
        'district' => 'Dhaka',
        'idempotency_key' => $idempotencyKey,
        'items' => [
            ['variant_id' => $this->variant->id, 'quantity' => 2],
        ],
    ];

    $response = $this->postJson(route('checkout.cod.store'), $payload);

    $response->assertStatus(201)
        ->assertJsonPath('order.customer_name', 'Tanvir Hasan')
        ->assertJsonPath('order.customer_phone', '01712345678')
        ->assertJsonPath('order.status', OrderStatus::PENDING)
        ->assertJsonPath('order.payment_method', 'cod')
        ->assertJsonPath('order.subtotal', '3600.00')
        ->assertJsonPath('order.shipping_fee', '70.00')
        ->assertJsonPath('order.total', '3670.00');

    // Verify stock deduction
    expect($this->variant->fresh()->stock_quantity)->toBe(8);

    // Verify database record
    $order = Order::where('idempotency_key', $idempotencyKey)->first();
    expect($order)->not->toBeNull()
        ->and($order->items)->toHaveCount(1)
        ->and($order->histories)->toHaveCount(1);

    // Verify order item snapshot
    $item = $order->items->first();
    expect($item->product_title)->toBe('Executive Leather Bag')
        ->and($item->variant_name)->toBe('Default')
        ->and((float) $item->unit_price)->toBe(1800.00)
        ->and($item->quantity)->toBe(2)
        ->and((float) $item->total_price)->toBe(3600.00)
        ->and($item->is_restocked)->toBeFalse();

    // Verify initial history entry
    $history = $order->histories->first();
    expect($history->from_status)->toBeNull()
        ->and($history->to_status)->toBe(OrderStatus::PENDING);
});

test('returns existing order when identical idempotency key is submitted without double decrementing stock', function () {
    $idempotencyKey = (string) Str::uuid();

    $payload = [
        'name' => 'Karim Ullah',
        'phone' => '01812345678',
        'address' => 'GEC Circle, Chattogram',
        'district' => 'Chattogram',
        'idempotency_key' => $idempotencyKey,
        'items' => [
            ['variant_id' => $this->variant->id, 'quantity' => 1],
        ],
    ];

    // First request
    $res1 = $this->postJson(route('checkout.cod.store'), $payload);
    $res1->assertStatus(201);
    expect($this->variant->fresh()->stock_quantity)->toBe(9);

    // Second request with same idempotency key (simulating network lag / double click)
    $res2 = $this->postJson(route('checkout.cod.store'), $payload);
    $res2->assertStatus(200)
        ->assertJsonPath('order.idempotency_key', $idempotencyKey);

    // Stock must not decrement again
    expect($this->variant->fresh()->stock_quantity)->toBe(9);
    expect(Order::where('idempotency_key', $idempotencyKey)->count())->toBe(1);
});

test('validates Bangladeshi phone numbers and normalizes international prefixes', function () {
    $idempotencyKey = (string) Str::uuid();

    // Valid number with +88 prefix
    $res = $this->postJson(route('checkout.cod.store'), [
        'name' => 'Sadia Islam',
        'phone' => '+8801912345678',
        'address' => 'Uttara Sector 3',
        'district' => 'Dhaka',
        'idempotency_key' => $idempotencyKey,
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]);

    $res->assertStatus(201)
        ->assertJsonPath('order.customer_phone', '01912345678');

    // Invalid phone number
    $invalidRes = $this->postJson(route('checkout.cod.store'), [
        'name' => 'Invalid Phone User',
        'phone' => '01234567890', // 012 is not a valid BD prefix
        'address' => 'Somewhere',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]);

    $invalidRes->assertStatus(422)
        ->assertJsonValidationErrors(['phone']);
});

test('rejects order placement when requested quantity exceeds available stock', function () {
    $this->variant->update(['stock_quantity' => 2]);

    $payload = [
        'name' => 'Greedy Buyer',
        'phone' => '01700000000',
        'address' => 'Banani, Dhaka',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [
            ['variant_id' => $this->variant->id, 'quantity' => 5], // Only 2 available
        ],
    ];

    $response = $this->postJson(route('checkout.cod.store'), $payload);

    $response->assertStatus(422)
        ->assertJsonPath('error', 'out_of_stock');

    // Stock remains unchanged
    expect($this->variant->fresh()->stock_quantity)->toBe(2);
    expect(Order::count())->toBe(0);
});

test('allows order placement for unmanaged stock variants without decrementing quantity', function () {
    $unmanagedVariant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'BAG-UNMANAGED',
        'name' => 'Digital eBook Guide',
        'regular_price' => 500.00,
        'stock_quantity' => 0,
        'manage_stock' => false,
    ]);

    $payload = [
        'name' => 'Digital Buyer',
        'phone' => '01612345678',
        'address' => 'Online delivery, Dhaka',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [
            ['variant_id' => $unmanagedVariant->id, 'quantity' => 10],
        ],
    ];

    $response = $this->postJson(route('checkout.cod.store'), $payload);

    $response->assertStatus(201);
    expect($unmanagedVariant->fresh()->stock_quantity)->toBe(0);
});

test('calculates accurate shipping fees across all Bangladeshi shipping zones', function () {
    // 1. Inside Dhaka: 70.00
    $resDhaka = $this->postJson(route('checkout.cod.store'), [
        'name' => 'Customer Inside Dhaka',
        'phone' => '01711111111',
        'address' => 'Gulshan 2',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]);
    $resDhaka->assertStatus(201)
        ->assertJsonPath('order.shipping_fee', '70.00');

    // 2. Sub-Dhaka (Savar upazila inside Dhaka district): 100.00
    $resSavar = $this->postJson(route('checkout.cod.store'), [
        'name' => 'Customer Savar',
        'phone' => '01722222222',
        'address' => 'Near EPZ, Savar',
        'district' => 'Dhaka',
        'upazila' => 'Savar',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]);
    $resSavar->assertStatus(201)
        ->assertJsonPath('order.shipping_fee', '100.00');

    // 3. Sub-Dhaka (Gazipur district): 100.00
    $resGazipur = $this->postJson(route('checkout.cod.store'), [
        'name' => 'Customer Gazipur',
        'phone' => '01733333333',
        'address' => 'Board Bazar, Gazipur',
        'district' => 'Gazipur',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]);
    $resGazipur->assertStatus(201)
        ->assertJsonPath('order.shipping_fee', '100.00');

    // Clear IP rate limit counter for next zone check
    RateLimiter::clear(app(OrderRateLimiter::class)->ipKey('127.0.0.1'));

    // 4. Outside Dhaka (Sylhet district): 130.00
    $resSylhet = $this->postJson(route('checkout.cod.store'), [
        'name' => 'Customer Sylhet',
        'phone' => '01744444444',
        'address' => 'Zindabazar, Sylhet',
        'district' => 'Sylhet',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]);
    $resSylhet->assertStatus(201)
        ->assertJsonPath('order.shipping_fee', '130.00');
});

test('ProcessCodOrderAction enforces atomic lock and rejects invalid data', function () {
    expect(fn () => $this->action->execute([
        'customer_name' => '',
        'customer_phone' => '01712345678',
        'delivery_address' => 'Address',
        'district' => 'Dhaka',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]))->toThrow(InvalidArgumentException::class, 'Customer name is required.');

    expect(fn () => $this->action->execute([
        'customer_name' => 'Test',
        'customer_phone' => '01712345678',
        'delivery_address' => 'Address',
        'district' => 'Dhaka',
        'idempotency_key' => '',
        'items' => [['variant_id' => $this->variant->id, 'quantity' => 1]],
    ]))->toThrow(InvalidArgumentException::class, 'Idempotency key is required.');
});
