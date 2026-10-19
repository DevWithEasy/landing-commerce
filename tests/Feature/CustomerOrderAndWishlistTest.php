<?php

declare(strict_types=1);

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Customer\Models\Customer;
use App\Modules\Customer\Models\Wishlist;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Shipping\Models\District;
use App\Modules\Shipping\Models\ShippingMethod;
use App\Modules\Shipping\Models\ShippingZone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $zone = ShippingZone::create([
        'name' => 'Dhaka City',
        'code' => 'dhaka_city',
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
        'code' => 'dhaka_std',
        'name' => 'Dhaka Delivery',
        'shipping_zone_id' => $zone->id,
        'rate' => 60.00,
        'is_active' => true,
        'is_default' => true,
        'sort_order' => 1,
    ]);

    $this->customerA = Customer::create([
        'name' => 'Customer Alpha',
        'email' => 'alpha@example.com',
        'phone' => '01711111111',
        'password' => Hash::make('password123'),
    ]);

    $this->customerB = Customer::create([
        'name' => 'Customer Beta',
        'email' => 'beta@example.com',
        'phone' => '01822222222',
        'password' => Hash::make('password123'),
    ]);

    $this->product = Product::create([
        'title' => 'Wireless Headphones',
        'slug' => 'wireless-headphones',
        'regular_price' => 3000.00,
        'sale_price' => 2500.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'WH-01',
        'name' => 'Black',
        'regular_price' => 3000.00,
        'sale_price' => 2500.00,
        'stock_quantity' => 20,
        'manage_stock' => true,
    ]);
});

test('customer can view their own order history and does not see other customer orders', function () {
    // Create order for Customer A
    $orderA = Order::create([
        'order_number' => 'ORD-20261019-AAAA',
        'customer_id' => $this->customerA->id,
        'customer_name' => $this->customerA->name,
        'customer_phone' => $this->customerA->phone,
        'delivery_address' => 'House 1, Road 2, Dhanmondi',
        'district' => 'Dhaka',
        'status' => OrderStatus::PENDING,
        'payment_method' => 'cod',
        'subtotal' => 2500.00,
        'shipping_fee' => 60.00,
        'discount' => 0.00,
        'total' => 2560.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    // Create order for Customer B
    $orderB = Order::create([
        'order_number' => 'ORD-20261019-BBBB',
        'customer_id' => $this->customerB->id,
        'customer_name' => $this->customerB->name,
        'customer_phone' => $this->customerB->phone,
        'delivery_address' => 'House 3, Road 4, Gulshan',
        'district' => 'Dhaka',
        'status' => OrderStatus::CONFIRMED,
        'payment_method' => 'cod',
        'subtotal' => 5000.00,
        'shipping_fee' => 60.00,
        'discount' => 0.00,
        'total' => 5060.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $this->actingAs($this->customerA, 'customer');

    $response = $this->get(route('customer.orders'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Customer/Orders')
        ->has('orders.data', 1)
        ->where('orders.data.0.order_number', 'ORD-20261019-AAAA')
    );
});

test('IDOR protection: customer cannot view another customer order details', function () {
    $orderB = Order::create([
        'order_number' => 'ORD-20261019-SECRET',
        'customer_id' => $this->customerB->id,
        'customer_name' => $this->customerB->name,
        'customer_phone' => $this->customerB->phone,
        'delivery_address' => 'Secret Address',
        'district' => 'Dhaka',
        'status' => OrderStatus::PENDING,
        'payment_method' => 'cod',
        'subtotal' => 1000.00,
        'shipping_fee' => 60.00,
        'discount' => 0.00,
        'total' => 1060.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $this->actingAs($this->customerA, 'customer');

    // Customer A attempts to view Customer B's order
    $response = $this->get(route('customer.orders.show', ['order' => $orderB->order_number]));
    $response->assertNotFound();
});

test('customer can view details of their own order', function () {
    $orderA = Order::create([
        'order_number' => 'ORD-20261019-MYORDER',
        'customer_id' => $this->customerA->id,
        'customer_name' => $this->customerA->name,
        'customer_phone' => $this->customerA->phone,
        'delivery_address' => 'My Home Address',
        'district' => 'Dhaka',
        'status' => OrderStatus::PENDING,
        'payment_method' => 'cod',
        'subtotal' => 2500.00,
        'shipping_fee' => 60.00,
        'discount' => 0.00,
        'total' => 2560.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    OrderItem::create([
        'order_id' => $orderA->id,
        'product_id' => $this->product->id,
        'variant_id' => $this->variant->id,
        'product_title' => $this->product->title,
        'variant_name' => $this->variant->name,
        'unit_price' => 2500.00,
        'quantity' => 1,
        'total_price' => 2500.00,
        'is_restocked' => false,
    ]);

    $this->actingAs($this->customerA, 'customer');

    $response = $this->get(route('customer.orders.show', ['order' => $orderA->order_number]));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Customer/OrderDetail')
        ->where('order.order_number', 'ORD-20261019-MYORDER')
        ->has('order.items', 1)
    );
});

test('customer can add an active product to wishlist and prevent duplicates', function () {
    $this->actingAs($this->customerA, 'customer');

    $response = $this->post(route('customer.wishlist.store'), [
        'product_id' => $this->product->id,
    ]);

    $response->assertSessionHas('success');
    $this->assertDatabaseHas('wishlists', [
        'customer_id' => $this->customerA->id,
        'product_id' => $this->product->id,
        'variant_id' => null,
    ]);

    // Adding same product again is idempotent (firstOrCreate)
    $this->post(route('customer.wishlist.store'), [
        'product_id' => $this->product->id,
    ]);

    expect(Wishlist::where('customer_id', $this->customerA->id)->count())->toBe(1);
});

test('customer can add product with specific variant to wishlist', function () {
    $this->actingAs($this->customerA, 'customer');

    $response = $this->postJson(route('customer.wishlist.store'), [
        'product_id' => $this->product->id,
        'variant_id' => $this->variant->id,
    ]);

    $response->assertOk();
    $response->assertJson([
        'message' => 'Item added to your wishlist.',
        'is_in_wishlist' => true,
        'total_items' => 1,
    ]);

    $this->assertDatabaseHas('wishlists', [
        'customer_id' => $this->customerA->id,
        'product_id' => $this->product->id,
        'variant_id' => $this->variant->id,
    ]);
});

test('wishlist rejects non-existent or inactive products', function () {
    $this->actingAs($this->customerA, 'customer');

    $inactiveProduct = Product::create([
        'title' => 'Draft Phone',
        'slug' => 'draft-phone',
        'regular_price' => 1000.00,
        'has_variants' => false,
        'status' => 'draft',
    ]);

    // Inactive product
    $response = $this->post(route('customer.wishlist.store'), [
        'product_id' => $inactiveProduct->id,
    ]);
    $response->assertNotFound();

    // Non-existent product
    $response2 = $this->post(route('customer.wishlist.store'), [
        'product_id' => 999999,
    ]);
    $response2->assertSessionHasErrors(['product_id']);
});

test('customer can remove an item from their wishlist', function () {
    $this->actingAs($this->customerA, 'customer');

    $item = Wishlist::create([
        'customer_id' => $this->customerA->id,
        'product_id' => $this->product->id,
    ]);

    $response = $this->deleteJson(route('customer.wishlist.destroy', ['id' => $item->id]));
    $response->assertOk();
    $response->assertJson([
        'message' => 'Item removed from your wishlist.',
        'is_in_wishlist' => false,
        'total_items' => 0,
    ]);

    $this->assertDatabaseMissing('wishlists', ['id' => $item->id]);
});

test('IDOR protection: customer cannot delete another customer wishlist item', function () {
    $itemB = Wishlist::create([
        'customer_id' => $this->customerB->id,
        'product_id' => $this->product->id,
    ]);

    $this->actingAs($this->customerA, 'customer');

    $response = $this->delete(route('customer.wishlist.destroy', ['id' => $itemB->id]));
    $response->assertNotFound();

    $this->assertDatabaseHas('wishlists', ['id' => $itemB->id]);
});

test('customer can view their wishlist page with products', function () {
    Wishlist::create([
        'customer_id' => $this->customerA->id,
        'product_id' => $this->product->id,
    ]);

    $this->actingAs($this->customerA, 'customer');

    $response = $this->get(route('customer.wishlist'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Customer/Wishlist')
        ->has('wishlist.data', 1)
        ->where('wishlist.data.0.product_id', $this->product->id)
    );
});
