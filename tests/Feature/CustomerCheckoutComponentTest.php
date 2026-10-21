<?php

declare(strict_types=1);

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Shipping\Models\ShippingMethod;
use Database\Seeders\BangladeshGeographicSeeder;
use Database\Seeders\ShippingAndPaymentMethodSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);
    $this->seed(ShippingAndPaymentMethodSeeder::class);

    $this->product = Product::create([
        'title' => 'Premium Ergonomic Backpack',
        'slug' => 'premium-ergonomic-backpack',
        'regular_price' => 3500.00,
        'sale_price' => 2990.00,
        'has_variants' => true,
        'status' => 'active',
    ]);

    $this->variant1 = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'BAG-ERGO-BLK',
        'name' => 'Midnight Black',
        'regular_price' => 3500.00,
        'sale_price' => 2990.00,
        'stock_quantity' => 15,
        'manage_stock' => true,
    ]);

    $this->variant2 = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'BAG-ERGO-GRY',
        'name' => 'Slate Grey',
        'regular_price' => 3500.00,
        'sale_price' => 2990.00,
        'stock_quantity' => 5,
        'manage_stock' => true,
    ]);
});

test('renders checkout page with database-driven delivery and payment methods', function () {
    $response = $this->get(route('checkout.show', $this->product->slug));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Checkout/Show')
            ->has('product')
            ->where('product.slug', 'premium-ergonomic-backpack')
            ->has('product.variants', 2)
            ->has('shippingMethods', 4)
            ->where('shippingMethods.0.code', 'inside_dhaka_standard')
            ->where('shippingMethods.0.is_default', true)
            ->has('paymentMethods', 1)
            ->where('paymentMethods.0.code', 'cod')
            ->has('theme')
            ->has('categories')
            ->where('defaultShippingFee', 70)
            ->where('defaultZoneName', 'Inside Dhaka')
        );
});

test('renders customer checkout page without slug by falling back to first active product', function () {
    $response = $this->get(route('checkout.show'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Checkout/Show')
            ->has('product')
            ->where('product.id', $this->product->id)
        );
});

test('places a COD order without district or upazila using the selected delivery method', function () {
    $shippingMethod = ShippingMethod::where('code', 'outside_dhaka_standard')->firstOrFail();

    $response = $this->postJson('/checkout/cod', [
        'checkout_source' => 'direct',
        'customer_name' => 'Test Customer',
        'customer_phone' => '01712345678',
        'delivery_address' => 'House 1, Road 2, Zindabazar, Sylhet',
        'shipping_method_id' => $shippingMethod->id,
        'payment_method' => 'cod',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [
            ['variant_id' => $this->variant1->id, 'quantity' => 1],
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('order.shipping_fee', '130.00')
        ->assertJsonPath('order.shipping_method_id', $shippingMethod->id)
        ->assertJsonPath('order.district', 'Outside Dhaka')
        ->assertJsonPath('order.payment_method', 'cod');

    expect(Order::count())->toBe(1)
        ->and($this->variant1->fresh()->stock_quantity)->toBe(14);
});

test('calculates accurate dynamic shipping fees for all zones via shipping-fee endpoint', function () {
    // 1. Inside Dhaka: ৳70
    $resDhaka = $this->postJson(route('checkout.shipping-fee'), [
        'district' => 'Dhaka',
    ]);
    $resDhaka->assertOk()
        ->assertJson([
            'shipping_fee' => 70,
            'zone_code' => 'inside_dhaka',
            'zone_name' => 'Inside Dhaka',
        ]);

    // 2. Sub-Dhaka override (Savar in Dhaka): ৳100
    $resSavar = $this->postJson(route('checkout.shipping-fee'), [
        'district' => 'Dhaka',
        'upazila' => 'Savar',
    ]);
    $resSavar->assertOk()
        ->assertJson([
            'shipping_fee' => 100,
            'zone_code' => 'sub_dhaka',
        ]);

    // 3. Sub-Dhaka district (Gazipur): ৳100
    $resGazipur = $this->postJson(route('checkout.shipping-fee'), [
        'district' => 'Gazipur',
    ]);
    $resGazipur->assertOk()
        ->assertJson([
            'shipping_fee' => 100,
            'zone_code' => 'sub_dhaka',
        ]);

    // 4. Outside Dhaka (Sylhet & Chattogram): ৳130
    $resSylhet = $this->postJson(route('checkout.shipping-fee'), [
        'district' => 'Sylhet',
    ]);
    $resSylhet->assertOk()
        ->assertJson([
            'shipping_fee' => 130,
            'zone_code' => 'outside_dhaka',
        ]);

    $resChattogram = $this->postJson(route('checkout.shipping-fee'), [
        'district' => 'Chattogram',
    ]);
    $resChattogram->assertOk()
        ->assertJson([
            'shipping_fee' => 130,
            'zone_code' => 'outside_dhaka',
        ]);
});

test('renders Thank You page with order details snapshot and configured merchant WhatsApp', function () {
    config(['services.whatsapp.merchant_phone' => '01712345678']);

    $order = Order::create([
        'order_number' => 'ORD-20261017-ABCDEF',
        'customer_name' => 'Mahmudul Hasan',
        'customer_phone' => '01712345678',
        'delivery_address' => 'House 45, Road 2, Dhanmondi',
        'district' => 'Dhaka',
        'upazila' => 'Dhanmondi',
        'status' => OrderStatus::PENDING,
        'payment_method' => 'cod',
        'subtotal' => 2990.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 3060.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $this->product->id,
        'variant_id' => $this->variant1->id,
        'product_title' => 'Premium Ergonomic Backpack',
        'variant_name' => 'Midnight Black',
        'unit_price' => 2990.00,
        'quantity' => 1,
        'total_price' => 2990.00,
        'is_restocked' => false,
    ]);

    $response = $this->get(route('checkout.thank-you', $order->order_number));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Checkout/ThankYou')
            ->has('order')
            ->where('order.order_number', 'ORD-20261017-ABCDEF')
            ->where('order.customer_name', 'Mahmudul Hasan')
            ->where('order.status', OrderStatus::PENDING)
            ->where('order.total', '3060.00')
            ->where('merchantWhatsapp', '01712345678')
            ->has('order.items', 1)
        );

    // Repeated GETs on Thank You page are safe and do not mutate stock
    $initialStock = $this->variant1->fresh()->stock_quantity;
    $repeatResponse = $this->get(route('checkout.thank-you', $order->order_number));
    $repeatResponse->assertOk();
    expect($this->variant1->fresh()->stock_quantity)->toBe($initialStock);
});

test('returns 404 on Thank You page when order number does not exist', function () {
    $response = $this->get(route('checkout.thank-you', 'ORD-NON-EXISTENT'));
    $response->assertNotFound();
});
