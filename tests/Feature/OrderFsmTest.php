<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Orders\Exceptions\InvalidOrderStateTransitionException;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Orders\Services\OrderStateMachine;
use Database\Seeders\BangladeshGeographicSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);
    $this->fsm = app(OrderStateMachine::class);

    $this->product = Product::create([
        'title' => 'Ergonomic Standing Desk',
        'slug' => 'ergonomic-standing-desk',
        'regular_price' => 15000.00,
        'has_variants' => true,
        'status' => 'active',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'DESK-ERGO-OAK',
        'name' => 'Natural Oak',
        'regular_price' => 15000.00,
        'stock_quantity' => 10,
        'manage_stock' => true,
    ]);

    $this->digitalVariant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'DESK-GUIDE-PDF',
        'name' => 'Assembly eBook Guide',
        'regular_price' => 500.00,
        'stock_quantity' => 0,
        'manage_stock' => false,
    ]);
});

function createTestOrder(string $status = OrderStatus::PENDING, array $variantOverrides = []): Order
{
    $order = Order::create([
        'order_number' => 'ORD-'.date('Ymd').'-'.strtoupper(Str::random(6)),
        'customer_name' => 'Tanvir Hasan',
        'customer_phone' => '01712345678',
        'delivery_address' => 'Mirpur-10, Dhaka',
        'district' => 'Dhaka',
        'status' => $status,
        'payment_method' => 'cod',
        'subtotal' => 15000.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 15070.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $variantOverrides['product_id'] ?? 1,
        'variant_id' => $variantOverrides['variant_id'] ?? 1,
        'product_title' => 'Ergonomic Standing Desk',
        'variant_name' => 'Natural Oak',
        'unit_price' => 15000.00,
        'quantity' => $variantOverrides['quantity'] ?? 1,
        'total_price' => 15000.00,
        'is_restocked' => false,
    ]);

    return $order;
}

test('allows full sequential order delivery pipeline from pending to delivered', function () {
    $order = createTestOrder(OrderStatus::PENDING);
    expect($order->status)->toBe(OrderStatus::PENDING);

    // 1. Pending -> Confirmed
    $order = $this->fsm->transition($order, OrderStatus::CONFIRMED, 'Phone verification successful');
    expect($order->status)->toBe(OrderStatus::CONFIRMED);

    // 2. Confirmed -> Processing
    $order = $this->fsm->transition($order, OrderStatus::PROCESSING, 'Picking and packing order');
    expect($order->status)->toBe(OrderStatus::PROCESSING);

    // 3. Processing -> Handed to Courier
    $order = $this->fsm->transition($order, OrderStatus::HANDED_TO_COURIER, 'Handed over to Steadfast Courier');
    expect($order->status)->toBe(OrderStatus::HANDED_TO_COURIER);

    // 4. Handed to Courier -> In Transit
    $order = $this->fsm->transition($order, OrderStatus::IN_TRANSIT, 'Courier hub scanned parcel');
    expect($order->status)->toBe(OrderStatus::IN_TRANSIT);

    // 5. In Transit -> Delivered
    $order = $this->fsm->transition($order, OrderStatus::DELIVERED, 'Customer received parcel and paid COD');
    expect($order->status)->toBe(OrderStatus::DELIVERED);

    // Verify 5 history records
    expect($order->histories)->toHaveCount(5);
});

test('allows documented branch transitions including direct rider delivery and processing rollback', function () {
    // Branch 1: Processing -> Confirmed rollback
    $order1 = createTestOrder(OrderStatus::PROCESSING);
    $order1 = $this->fsm->transition($order1, OrderStatus::CONFIRMED, 'Rollback to confirmed: item out of stock');
    expect($order1->status)->toBe(OrderStatus::CONFIRMED);

    // Branch 2: Handed to Courier -> Delivered directly
    $order2 = createTestOrder(OrderStatus::HANDED_TO_COURIER);
    $order2 = $this->fsm->transition($order2, OrderStatus::DELIVERED, 'Local same-day rider delivered package');
    expect($order2->status)->toBe(OrderStatus::DELIVERED);

    // Branch 3: Handed to Courier -> Returned
    $order3 = createTestOrder(OrderStatus::HANDED_TO_COURIER);
    $order3 = $this->fsm->transition($order3, OrderStatus::RETURNED, 'Courier returned damaged box');
    expect($order3->status)->toBe(OrderStatus::RETURNED);

    // Branch 4: Delivered -> Returned (post-delivery customer return)
    $order4 = createTestOrder(OrderStatus::DELIVERED);
    $order4 = $this->fsm->transition($order4, OrderStatus::RETURNED, 'Customer returned defective part');
    expect($order4->status)->toBe(OrderStatus::RETURNED);

    // Branch 5: Pending -> Spam & Confirmed -> Spam
    $order5 = createTestOrder(OrderStatus::PENDING);
    $order5 = $this->fsm->transition($order5, OrderStatus::SPAM, 'Automated spambot number');
    expect($order5->status)->toBe(OrderStatus::SPAM);

    $order6 = createTestOrder(OrderStatus::CONFIRMED);
    $order6 = $this->fsm->transition($order6, OrderStatus::SPAM, 'Customer admitted fake order');
    expect($order6->status)->toBe(OrderStatus::SPAM);
});

test('rejects illegal, backward, and terminal state transitions with InvalidOrderStateTransitionException', function () {
    // 1. Delivered -> Pending (illegal backward jump)
    $deliveredOrder = createTestOrder(OrderStatus::DELIVERED);
    try {
        $this->fsm->transition($deliveredOrder, OrderStatus::PENDING);
        $this->fail('Expected InvalidOrderStateTransitionException was not thrown.');
    } catch (InvalidOrderStateTransitionException $e) {
        expect($e->fromStatus)->toBe(OrderStatus::DELIVERED)
            ->and($e->toStatus)->toBe(OrderStatus::PENDING)
            ->and($e->orderNumber)->toBe($deliveredOrder->order_number);
    }

    // 2. Cancelled -> Confirmed (terminal state mutation)
    $cancelledOrder = createTestOrder(OrderStatus::CANCELLED);
    expect(fn () => $this->fsm->transition($cancelledOrder, OrderStatus::CONFIRMED))
        ->toThrow(InvalidOrderStateTransitionException::class);

    // 3. Returned -> In Transit (terminal state mutation)
    $returnedOrder = createTestOrder(OrderStatus::RETURNED);
    expect(fn () => $this->fsm->transition($returnedOrder, OrderStatus::IN_TRANSIT))
        ->toThrow(InvalidOrderStateTransitionException::class);

    // 4. Spam -> Delivered (terminal state mutation)
    $spamOrder = createTestOrder(OrderStatus::SPAM);
    expect(fn () => $this->fsm->transition($spamOrder, OrderStatus::DELIVERED))
        ->toThrow(InvalidOrderStateTransitionException::class);

    // 5. Pending -> In Transit (skipping mandatory confirmation and courier handoff)
    $pendingOrder = createTestOrder(OrderStatus::PENDING);
    expect(fn () => $this->fsm->transition($pendingOrder, OrderStatus::IN_TRANSIT))
        ->toThrow(InvalidOrderStateTransitionException::class);
});

test('restores inventory when order transitions to Cancelled, Returned, or Spam and marks items restocked', function () {
    $initialStock = $this->variant->stock_quantity; // 10

    // Order with 2 physical items and 1 unmanaged digital item
    $order = Order::create([
        'order_number' => 'ORD-TEST-RESTOCK-1',
        'customer_name' => 'Customer Restock',
        'customer_phone' => '01711223344',
        'delivery_address' => 'Banani, Dhaka',
        'district' => 'Dhaka',
        'status' => OrderStatus::CONFIRMED,
        'payment_method' => 'cod',
        'subtotal' => 30500.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 30570.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $item1 = OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $this->product->id,
        'variant_id' => $this->variant->id,
        'product_title' => 'Desk',
        'variant_name' => 'Oak',
        'unit_price' => 15000.00,
        'quantity' => 2,
        'total_price' => 30000.00,
        'is_restocked' => false,
    ]);

    $item2 = OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $this->product->id,
        'variant_id' => $this->digitalVariant->id,
        'product_title' => 'eBook',
        'variant_name' => 'PDF',
        'unit_price' => 500.00,
        'quantity' => 1,
        'total_price' => 500.00,
        'is_restocked' => false,
    ]);

    // Transition to Cancelled
    $this->fsm->transition($order, OrderStatus::CANCELLED, 'Customer changed mind');

    // Physical stock must increase by 2
    expect($this->variant->fresh()->stock_quantity)->toBe($initialStock + 2);
    // Unmanaged digital variant remains 0
    expect($this->digitalVariant->fresh()->stock_quantity)->toBe(0);

    // Both items must have is_restocked = true
    expect($item1->fresh()->is_restocked)->toBeTrue()
        ->and($item2->fresh()->is_restocked)->toBeTrue();
});

test('enforces strict idempotency: repeated cancellation or duplicate courier webhooks never restock twice', function () {
    $initialStock = $this->variant->stock_quantity; // 10

    $order = Order::create([
        'order_number' => 'ORD-TEST-IDEMPOTENT-CANCEL',
        'customer_name' => 'Duplicate Webhook Buyer',
        'customer_phone' => '01811223344',
        'delivery_address' => 'Gulshan, Dhaka',
        'district' => 'Dhaka',
        'status' => OrderStatus::IN_TRANSIT,
        'payment_method' => 'cod',
        'subtotal' => 15000.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 15070.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $item = OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $this->product->id,
        'variant_id' => $this->variant->id,
        'product_title' => 'Desk',
        'variant_name' => 'Oak',
        'unit_price' => 15000.00,
        'quantity' => 3,
        'total_price' => 45000.00,
        'is_restocked' => false,
    ]);

    // 1st webhook call: transitions to Returned
    $order = $this->fsm->transition($order, OrderStatus::RETURNED, 'Courier return: customer unavailable');

    expect($order->status)->toBe(OrderStatus::RETURNED)
        ->and($this->variant->fresh()->stock_quantity)->toBe($initialStock + 3)
        ->and($item->fresh()->is_restocked)->toBeTrue();

    // 2nd duplicate webhook call: identical status call
    $orderAgain = $this->fsm->transition($order, OrderStatus::RETURNED, 'Courier duplicate webhook redelivery');

    expect($orderAgain->status)->toBe(OrderStatus::RETURNED);
    // Stock MUST NOT increase again!
    expect($this->variant->fresh()->stock_quantity)->toBe($initialStock + 3);

    // 3rd attempt: simulate manual repeat cancellation
    $orderThird = $this->fsm->transition($orderAgain, OrderStatus::RETURNED, 'Third duplicate call');
    expect($this->variant->fresh()->stock_quantity)->toBe($initialStock + 3);
});

test('records audit history accurately with responsible user_id and system null', function () {
    $admin = User::factory()->create([
        'name' => 'Fulfillment Agent Kabir',
        'email' => 'kabir@store.com',
    ]);

    $order = createTestOrder(OrderStatus::PENDING);

    // 1. Transition with responsible admin user
    $order = $this->fsm->transition(
        $order,
        OrderStatus::CONFIRMED,
        'Confirmed after customer call',
        $admin
    );

    $history1 = $order->histories->last();
    expect($history1->from_status)->toBe(OrderStatus::PENDING)
        ->and($history1->to_status)->toBe(OrderStatus::CONFIRMED)
        ->and($history1->comment)->toBe('Confirmed after customer call')
        ->and($history1->user_id)->toBe($admin->id);

    // 2. Transition by automated system / courier webhook (user_id = null)
    $order = $this->fsm->transition(
        $order,
        OrderStatus::PROCESSING,
        'Automated pick-list generated',
        null
    );

    $history2 = $order->histories->last();
    expect($history2->from_status)->toBe(OrderStatus::CONFIRMED)
        ->and($history2->to_status)->toBe(OrderStatus::PROCESSING)
        ->and($history2->comment)->toBe('Automated pick-list generated')
        ->and($history2->user_id)->toBeNull();
});

test('convenience transitionTo method on Order model delegates to OrderStateMachine', function () {
    $order = createTestOrder(OrderStatus::PENDING);

    $updatedOrder = $order->transitionTo(OrderStatus::CONFIRMED, 'Direct model method invocation');

    expect($updatedOrder->status)->toBe(OrderStatus::CONFIRMED)
        ->and($updatedOrder->histories->last()->comment)->toBe('Direct model method invocation');
});

test('restocks inventory on live MySQL with transactional row locks', function () {
    // Check if MySQL connection is available
    try {
        if (config('database.connections.mysql.database') === ':memory:' || empty(config('database.connections.mysql.database'))) {
            config(['database.connections.mysql.database' => 'laravel']);
        }
        DB::connection('mysql')->getPdo();
    } catch (Throwable $e) {
        $this->markTestSkipped('MySQL connection not available: '.$e->getMessage());
    }

    $product = Product::on('mysql')->firstOrCreate(
        ['slug' => 'mysql-fsm-test-product'],
        [
            'title' => 'MySQL FSM Test Product',
            'regular_price' => 5000.00,
            'has_variants' => false,
            'status' => 'active',
        ]
    );

    $variant = ProductVariant::on('mysql')->where('product_id', $product->id)->first();
    if (! $variant) {
        $variant = ProductVariant::on('mysql')->create([
            'product_id' => $product->id,
            'sku' => 'FSM-MYSQL-VAR-1',
            'name' => 'Default',
            'regular_price' => 5000.00,
            'stock_quantity' => 5,
            'manage_stock' => true,
        ]);
    } else {
        $variant->update(['stock_quantity' => 5, 'manage_stock' => true]);
    }

    $order = Order::on('mysql')->create([
        'order_number' => 'ORD-MYSQL-FSM-'.strtoupper(Str::random(6)),
        'customer_name' => 'MySQL Buyer',
        'customer_phone' => '01719999999',
        'delivery_address' => 'Chittagong',
        'district' => 'Chattogram',
        'status' => OrderStatus::CONFIRMED,
        'payment_method' => 'cod',
        'subtotal' => 5000.00,
        'shipping_fee' => 130.00,
        'discount' => 0.00,
        'total' => 5130.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    OrderItem::on('mysql')->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'product_title' => 'MySQL FSM Test Product',
        'variant_name' => 'Default',
        'unit_price' => 5000.00,
        'quantity' => 2,
        'total_price' => 10000.00,
        'is_restocked' => false,
    ]);

    // Transition on MySQL
    $this->fsm->transition($order, OrderStatus::CANCELLED, 'Cancelled on MySQL');

    // Fresh query from MySQL
    $variant->refresh();
    expect($variant->stock_quantity)->toBe(7);

    // Duplicate call on MySQL
    $this->fsm->transition($order, OrderStatus::CANCELLED, 'Duplicate cancel on MySQL');
    $variant->refresh();
    expect($variant->stock_quantity)->toBe(7);
})->group('mysql');
