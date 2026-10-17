<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Orders\Models\OrderStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

function createAdminUser(string $role = 'fulfillment_agent'): User
{
    return User::factory()->create([
        'name' => 'Fulfillment Agent',
        'email' => 'agent@example.com',
        'role' => $role,
    ]);
}

function createPersistedOrder(string $status = OrderStatus::PROCESSING, array $attributes = []): Order
{
    $product = Product::query()->create([
        'title' => 'Test Premium Jacket',
        'slug' => 'test-premium-jacket',
        'regular_price' => 1500.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $variant = ProductVariant::query()->create([
        'product_id' => $product->id,
        'sku' => 'JKT-001-TEST',
        'name' => 'Default',
        'regular_price' => 1500.00,
        'stock_quantity' => 10,
        'manage_stock' => true,
    ]);

    $order = Order::query()->create(array_merge([
        'order_number' => 'ORD-20261018-001',
        'idempotency_key' => 'idemp_key_test_001',
        'customer_name' => 'Rahim Uddin',
        'customer_phone' => '01711223344',
        'delivery_address' => 'House 45, Road 7, Dhanmondi',
        'district' => 'Dhaka',
        'upazila' => 'Dhanmondi',
        'subtotal' => 1500.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 1570.00,
        'payment_method' => 'cod',
        'status' => $status,
        'notes' => 'Call before delivery',
    ], $attributes));

    OrderItem::query()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'product_title' => $product->title,
        'variant_name' => $variant->name,
        'unit_price' => 1500.00,
        'quantity' => 1,
        'total_price' => 1500.00,
        'is_restocked' => false,
    ]);

    return $order;
}

test('guest cannot dispatch order to courier', function () {
    $order = createPersistedOrder();

    $response = $this->postJson("/admin/orders/{$order->id}/courier/dispatch", [
        'driver' => 'mock',
    ]);

    $response->assertStatus(401);
});

test('unauthorized user cannot dispatch order to courier', function () {
    $user = User::factory()->create([
        'role' => 'customer',
    ]);
    $order = createPersistedOrder();

    $response = $this->actingAs($user)->postJson("/admin/orders/{$order->id}/courier/dispatch", [
        'driver' => 'mock',
    ]);

    $response->assertStatus(403);
});

test('admin can dispatch processing order to mock courier successfully', function () {
    $admin = createAdminUser();
    $order = createPersistedOrder(OrderStatus::PROCESSING);

    $response = $this->actingAs($admin)->postJson("/admin/orders/{$order->id}/courier/dispatch", [
        'driver' => 'mock',
        'note' => 'Deliver by 5 PM',
        'weight' => 1.2,
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
    ]);

    $order->refresh();
    expect($order->courier_name)->toBe('mock');
    expect($order->courier_tracking_id)->toStartWith('MCK-');
    expect($order->courier_tracking_url)->toContain('mock-courier.test/track/');
    expect($order->status)->toBe(OrderStatus::HANDED_TO_COURIER);

    // Verify audit trail record
    $latestHistory = $order->latestHistory;
    expect($latestHistory->to_status)->toBe(OrderStatus::HANDED_TO_COURIER);
    expect($latestHistory->comment)->toContain('Dispatched via mock courier');
    expect($latestHistory->user_id)->toBe($admin->id);
});

test('dispatching confirmed order advances through processing to handed_to_courier', function () {
    $admin = createAdminUser();
    $order = createPersistedOrder(OrderStatus::CONFIRMED);

    $response = $this->actingAs($admin)->postJson("/admin/orders/{$order->id}/courier/dispatch", [
        'driver' => 'mock',
    ]);

    $response->assertStatus(200);

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::HANDED_TO_COURIER);
    expect($order->courier_tracking_id)->not->toBeNull();
});

test('cannot dispatch order in terminal state to courier', function () {
    $admin = createAdminUser();
    $cancelledOrder = createPersistedOrder(OrderStatus::CANCELLED);

    $response = $this->actingAs($admin)->postJson("/admin/orders/{$cancelledOrder->id}/courier/dispatch", [
        'driver' => 'mock',
    ]);

    $response->assertStatus(422);
    $response->assertJson([
        'success' => false,
    ]);

    $cancelledOrder->refresh();
    expect($cancelledOrder->status)->toBe(OrderStatus::CANCELLED);
    expect($cancelledOrder->courier_tracking_id)->toBeNull();
});

test('dispatching to unconfigured courier driver fails safely', function () {
    $admin = createAdminUser();
    $order = createPersistedOrder(OrderStatus::PROCESSING);

    config()->set('courier.drivers.steadfast.api_key', null);
    config()->set('courier.drivers.steadfast.secret_key', null);

    $response = $this->actingAs($admin)->postJson("/admin/orders/{$order->id}/courier/dispatch", [
        'driver' => 'steadfast',
    ]);

    $response->assertStatus(422);
    $response->assertJsonFragment([
        'success' => false,
    ]);

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::PROCESSING);
    expect($order->courier_tracking_id)->toBeNull();
});

test('provider API failure during dispatch preserves order status and inventory', function () {
    $admin = createAdminUser();
    $order = createPersistedOrder(OrderStatus::PROCESSING);

    config()->set('courier.drivers.steadfast.api_key', 'test_key');
    config()->set('courier.drivers.steadfast.secret_key', 'test_secret');

    Http::fake([
        'https://portal.steadfast.com.bd/api/v1/create_order' => Http::response([
            'status' => 400,
            'message' => 'Invalid delivery address provided.',
        ], 400),
    ]);

    $response = $this->actingAs($admin)->postJson("/admin/orders/{$order->id}/courier/dispatch", [
        'driver' => 'steadfast',
    ]);

    $response->assertStatus(422);
    $response->assertJsonFragment([
        'success' => false,
        'message' => 'Invalid delivery address provided.',
    ]);

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::PROCESSING);
    expect($order->courier_tracking_id)->toBeNull();

    // Verify inventory variant remains unchanged at 10
    $variant = ProductVariant::first();
    expect($variant->stock_quantity)->toBe(10);
});

test('admin can sync live courier tracking status', function () {
    $admin = createAdminUser();
    $order = createPersistedOrder(OrderStatus::HANDED_TO_COURIER, [
        'courier_name' => 'mock',
        'courier_tracking_id' => 'MCK-DEL-998811',
        'courier_tracking_url' => 'https://mock-courier.test/track/MCK-DEL-998811',
    ]);

    $response = $this->actingAs($admin)->postJson("/admin/orders/{$order->id}/courier/track");

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
    ]);

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::DELIVERED);

    $latestHistory = $order->latestHistory;
    expect($latestHistory->to_status)->toBe(OrderStatus::DELIVERED);
    expect($latestHistory->comment)->toContain('Status synced from mock courier');
});

test('syncing return tracking status triggers automatic stock restoration', function () {
    $admin = createAdminUser();
    $order = createPersistedOrder(OrderStatus::HANDED_TO_COURIER, [
        'courier_name' => 'mock',
        'courier_tracking_id' => 'MCK-RET-554433',
        'courier_tracking_url' => 'https://mock-courier.test/track/MCK-RET-554433',
    ]);

    $variant = ProductVariant::first();
    expect($variant->stock_quantity)->toBe(10);

    $response = $this->actingAs($admin)->postJson("/admin/orders/{$order->id}/courier/track");

    $response->assertStatus(200);

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::RETURNED);

    // Verify order item is restocked
    $orderItem = $order->items()->first();
    expect($orderItem->is_restocked)->toBeTrue();

    // Stock was 10, restored +1 => 11
    $variant->refresh();
    expect($variant->stock_quantity)->toBe(11);
});

test('cannot track undispatched order', function () {
    $admin = createAdminUser();
    $order = createPersistedOrder(OrderStatus::PROCESSING, [
        'courier_tracking_id' => null,
    ]);

    $response = $this->actingAs($admin)->postJson("/admin/orders/{$order->id}/courier/track");

    $response->assertStatus(422);
    $response->assertJson([
        'success' => false,
    ]);
});

test('orders index inertia view provides courier config payload', function () {
    $admin = createAdminUser();

    $response = $this->actingAs($admin)->get('/admin/orders');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Orders/Index')
        ->has('courierConfig.drivers')
        ->has('courierConfig.configured')
        ->has('courierConfig.default')
    );
});
