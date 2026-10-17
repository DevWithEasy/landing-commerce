<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Orders\Models\OrderStatus;
use Database\Seeders\BangladeshGeographicSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);

    $this->superAdmin = User::factory()->create([
        'name' => 'Super Admin User',
        'email' => 'superadmin@landingcommerce.test',
        'role' => 'super_admin',
    ]);

    $this->storeManager = User::factory()->create([
        'name' => 'Store Manager User',
        'email' => 'manager@landingcommerce.test',
        'role' => 'store_manager',
    ]);

    $this->fulfillmentAgent = User::factory()->create([
        'name' => 'Fulfillment Agent User',
        'email' => 'agent@landingcommerce.test',
        'role' => 'fulfillment_agent',
    ]);

    $this->customer = User::factory()->create([
        'name' => 'Regular Customer',
        'email' => 'customer@landingcommerce.test',
        'role' => 'customer',
    ]);

    $this->product = Product::create([
        'title' => 'Wireless Noise Cancelling Headphones',
        'slug' => 'wireless-noise-cancelling-headphones',
        'regular_price' => 8500.00,
        'has_variants' => true,
        'status' => 'active',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'HP-BT-BLK',
        'name' => 'Matte Black',
        'regular_price' => 8500.00,
        'stock_quantity' => 25,
        'manage_stock' => true,
    ]);
});

function createSampleOrder(
    string $status = OrderStatus::PENDING,
    array $attributes = []
): Order {
    $order = Order::create(array_merge([
        'order_number' => 'ORD-'.date('Ymd').'-'.strtoupper(Str::random(6)),
        'customer_name' => 'Sabbir Ahmed',
        'customer_phone' => '01711223344',
        'delivery_address' => 'House 4, Road 12, Dhanmondi',
        'district' => 'Dhaka',
        'upazila' => 'Dhanmondi',
        'subtotal' => 8500.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 8570.00,
        'payment_method' => 'cod',
        'status' => $status,
        'notes' => 'Call before delivery',
        'idempotency_key' => (string) Str::uuid(),
    ], $attributes));

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => 1,
        'variant_id' => 1,
        'product_title' => 'Wireless Noise Cancelling Headphones',
        'variant_name' => 'Matte Black',
        'unit_price' => 8500.00,
        'quantity' => 1,
        'total_price' => 8500.00,
        'is_restocked' => false,
    ]);

    return $order;
}

test('guest cannot access admin orders endpoints and is rejected', function () {
    $order = createSampleOrder();

    $this->get('/admin/orders')->assertRedirect('/login');
    $this->get('/admin/orders/export')->assertRedirect('/login');
    $this->post('/admin/orders/bulk-transition', [
        'order_ids' => [$order->id],
        'status' => OrderStatus::CONFIRMED,
    ])->assertRedirect('/login');
    $this->get("/admin/orders/{$order->id}/invoice")->assertRedirect('/login');
    $this->post("/admin/orders/{$order->id}/transition", [
        'status' => OrderStatus::CONFIRMED,
    ])->assertRedirect('/login');
});

test('unauthorized customer role receives forbidden HTTP 403 on order endpoints', function () {
    $order = createSampleOrder();

    $this->actingAs($this->customer)->get('/admin/orders')->assertForbidden();
    $this->actingAs($this->customer)->get('/admin/orders/export')->assertForbidden();
    $this->actingAs($this->customer)->post('/admin/orders/bulk-transition', [
        'order_ids' => [$order->id],
        'status' => OrderStatus::CONFIRMED,
    ])->assertForbidden();
    $this->actingAs($this->customer)->get("/admin/orders/{$order->id}/invoice")->assertForbidden();
    $this->actingAs($this->customer)->post("/admin/orders/{$order->id}/transition", [
        'status' => OrderStatus::CONFIRMED,
    ])->assertForbidden();
});

test('super_admin, store_manager, and fulfillment_agent can all access orders index', function () {
    createSampleOrder();

    $this->actingAs($this->superAdmin)->get('/admin/orders')->assertOk();
    $this->actingAs($this->storeManager)->get('/admin/orders')->assertOk();
    $this->actingAs($this->fulfillmentAgent)->get('/admin/orders')->assertOk();
});

test('orders table supports search by order number, customer name, and customer phone', function () {
    $order1 = createSampleOrder(OrderStatus::PENDING, [
        'order_number' => 'ORD-20261017-TARGET1',
        'customer_name' => 'Jamilur Reza',
        'customer_phone' => '01811223344',
    ]);

    $order2 = createSampleOrder(OrderStatus::PENDING, [
        'order_number' => 'ORD-20261017-TARGET2',
        'customer_name' => 'Farhana Sultana',
        'customer_phone' => '01999887766',
    ]);

    // Search by order number
    $response = $this->actingAs($this->superAdmin)->get('/admin/orders?search=TARGET1');
    $response->assertOk();
    $orders = $response->viewData('page')['props']['orders']['data'];
    expect(count($orders))->toBe(1)
        ->and($orders[0]['order_number'])->toBe('ORD-20261017-TARGET1');

    // Search by customer name
    $response = $this->actingAs($this->superAdmin)->get('/admin/orders?search=Farhana');
    $response->assertOk();
    $orders = $response->viewData('page')['props']['orders']['data'];
    expect(count($orders))->toBe(1)
        ->and($orders[0]['customer_name'])->toBe('Farhana Sultana');

    // Search by customer phone
    $response = $this->actingAs($this->superAdmin)->get('/admin/orders?search=01811223344');
    $response->assertOk();
    $orders = $response->viewData('page')['props']['orders']['data'];
    expect(count($orders))->toBe(1)
        ->and($orders[0]['customer_phone'])->toBe('01811223344');
});

test('orders table filters by pipeline status tab and counts are accurate', function () {
    createSampleOrder(OrderStatus::PENDING);
    createSampleOrder(OrderStatus::PENDING);
    createSampleOrder(OrderStatus::CONFIRMED);
    createSampleOrder(OrderStatus::DELIVERED);

    $response = $this->actingAs($this->superAdmin)->get('/admin/orders?status=pending');
    $response->assertOk();

    $page = $response->viewData('page')['props'];
    expect(count($page['orders']['data']))->toBe(2)
        ->and($page['statusCounts']['all'])->toBe(4)
        ->and($page['statusCounts']['pending'])->toBe(2)
        ->and($page['statusCounts']['confirmed'])->toBe(1)
        ->and($page['statusCounts']['delivered'])->toBe(1)
        ->and($page['statusCounts']['cancelled'])->toBe(0);
});

test('orders table filters by date range', function () {
    $pastOrder = createSampleOrder(OrderStatus::PENDING);
    $pastOrder->created_at = now()->subDays(10);
    $pastOrder->saveQuietly();

    $recentOrder = createSampleOrder(OrderStatus::PENDING);

    $dateFrom = now()->subDays(2)->format('Y-m-d');
    $dateTo = now()->addDay()->format('Y-m-d');

    $response = $this->actingAs($this->superAdmin)->get("/admin/orders?date_from={$dateFrom}&date_to={$dateTo}");
    $response->assertOk();

    $orders = $response->viewData('page')['props']['orders']['data'];
    expect(count($orders))->toBe(1)
        ->and($orders[0]['id'])->toBe($recentOrder->id);
});

test('order show endpoint returns order details and audit timeline via json', function () {
    $order = createSampleOrder(OrderStatus::PENDING);

    // Transition order to confirmed with comment
    $order->transitionTo(OrderStatus::CONFIRMED, 'Verification call answered', $this->storeManager);

    $response = $this->actingAs($this->superAdmin)->getJson("/admin/orders/{$order->id}");
    $response->assertOk()
        ->assertJsonStructure([
            'order' => ['id', 'order_number', 'status', 'items'],
            'timeline',
        ]);

    $timeline = $response->json('timeline');
    expect($timeline)->toHaveCount(1)
        ->and($timeline[0]['to_status'])->toBe(OrderStatus::CONFIRMED)
        ->and($timeline[0]['user_name'])->toBe('Store Manager User')
        ->and($timeline[0]['comment'])->toBe('Verification call answered');
});

test('single order status transition succeeds with admin attribution and logs audit trail', function () {
    $order = createSampleOrder(OrderStatus::PENDING);

    $response = $this->actingAs($this->fulfillmentAgent)->post("/admin/orders/{$order->id}/transition", [
        'status' => OrderStatus::CONFIRMED,
        'comment' => 'Confirmed by fulfillment agent',
    ]);

    $response->assertSessionHasNoErrors();
    $freshOrder = $order->fresh();

    expect($freshOrder->status)->toBe(OrderStatus::CONFIRMED)
        ->and($freshOrder->histories)->toHaveCount(1);

    $history = $freshOrder->histories->first();
    expect($history->to_status)->toBe(OrderStatus::CONFIRMED)
        ->and($history->user_id)->toBe($this->fulfillmentAgent->id)
        ->and($history->comment)->toBe('Confirmed by fulfillment agent');
});

test('single order status transition rejects invalid transition without mutating status', function () {
    $order = createSampleOrder(OrderStatus::PENDING);

    // Pending -> Delivered is invalid
    $response = $this->actingAs($this->superAdmin)->post("/admin/orders/{$order->id}/transition", [
        'status' => OrderStatus::DELIVERED,
    ]);

    $response->assertSessionHasErrors(['status']);
    expect($order->fresh()->status)->toBe(OrderStatus::PENDING)
        ->and($order->fresh()->histories)->toHaveCount(0);
});

test('bulk transition updates multiple orders and restocks inventory when transitioning to cancelled', function () {
    $order1 = createSampleOrder(OrderStatus::PENDING);
    $order2 = createSampleOrder(OrderStatus::CONFIRMED);

    // Current stock is 25
    expect($this->variant->fresh()->stock_quantity)->toBe(25);

    $response = $this->actingAs($this->superAdmin)->post('/admin/orders/bulk-transition', [
        'order_ids' => [$order1->id, $order2->id],
        'status' => OrderStatus::CANCELLED,
        'comment' => 'Bulk cancellation by merchant',
    ]);

    $response->assertSessionHasNoErrors();
    expect($order1->fresh()->status)->toBe(OrderStatus::CANCELLED)
        ->and($order2->fresh()->status)->toBe(OrderStatus::CANCELLED)
        ->and($order1->fresh()->items->first()->is_restocked)->toBeTrue()
        ->and($order2->fresh()->items->first()->is_restocked)->toBeTrue()
        // Stock should be incremented by 1 + 1 = 2
        ->and($this->variant->fresh()->stock_quantity)->toBe(27);
});

test('bulk transition reports per-order failures when some transitions are invalid', function () {
    $orderValid = createSampleOrder(OrderStatus::PENDING);
    $orderDelivered = createSampleOrder(OrderStatus::DELIVERED);

    // Target: Confirmed. (pending -> confirmed is valid, delivered -> confirmed is invalid)
    $response = $this->actingAs($this->superAdmin)->post('/admin/orders/bulk-transition', [
        'order_ids' => [$orderValid->id, $orderDelivered->id],
        'status' => OrderStatus::CONFIRMED,
        'comment' => 'Bulk confirmation attempt',
    ]);

    // Valid order should be transitioned
    expect($orderValid->fresh()->status)->toBe(OrderStatus::CONFIRMED);
    // Invalid order remains delivered
    expect($orderDelivered->fresh()->status)->toBe(OrderStatus::DELIVERED);

    // Session contains failure notice
    $response->assertSessionHas('warning');
});

test('csv export streams correct utf8 bom formatted orders', function () {
    $order = createSampleOrder(OrderStatus::CONFIRMED, [
        'customer_name' => 'আব্দুর রহিম', // Bengali characters
        'customer_phone' => '01700112233',
    ]);

    $response = $this->actingAs($this->superAdmin)->get('/admin/orders/export');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

    $content = $response->streamedContent();

    // Verify UTF-8 BOM is present
    expect(str_starts_with($content, "\xEF\xBB\xBF"))->toBeTrue()
        ->and($content)->toContain('Order Number')
        ->and($content)->toContain('Customer Name')
        ->and($content)->toContain($order->order_number)
        ->and($content)->toContain('আব্দুর রহিম')
        ->and($content)->toContain('01700112233')
        ->and($content)->toContain('Wireless Noise Cancelling Headphones');
});

test('standalone invoice renders both 80mm thermal receipt and A4 packing slip with barcode svg', function () {
    $order = createSampleOrder(OrderStatus::PROCESSING);

    // 80mm thermal receipt
    $thermalResponse = $this->actingAs($this->superAdmin)->get("/admin/orders/{$order->id}/invoice?type=thermal");
    $thermalResponse->assertOk()
        ->assertSee($order->order_number)
        ->assertSee($order->customer_name)
        ->assertSee('80mm auto') // thermal CSS page size
        ->assertSee('barcode-svg')
        ->assertSee('<svg', false);

    // A4 packing slip
    $a4Response = $this->actingAs($this->superAdmin)->get("/admin/orders/{$order->id}/invoice?type=a4");
    $a4Response->assertOk()
        ->assertSee($order->order_number)
        ->assertSee($order->customer_name)
        ->assertSee('A4 portrait') // A4 CSS page size
        ->assertSee('Packing Slip')
        ->assertSee('<svg', false);
});
