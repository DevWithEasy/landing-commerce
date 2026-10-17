<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Checkout\Actions\ProcessCodOrderAction;
use App\Modules\Orders\Exceptions\InvalidOrderStateTransitionException;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderHistory;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Orders\Services\OrderStateMachine;
use Database\Seeders\BangladeshGeographicSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);
    $this->fsm = app(OrderStateMachine::class);

    $this->product = Product::create([
        'title' => 'Ergonomic Desk Chair',
        'slug' => 'ergonomic-desk-chair',
        'regular_price' => 12500.00,
        'has_variants' => true,
        'status' => 'active',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'CHAIR-BLK-01',
        'name' => 'Midnight Black',
        'regular_price' => 12500.00,
        'stock_quantity' => 20,
        'manage_stock' => true,
    ]);

    $this->admin = User::factory()->create([
        'name' => 'Rahim Admin',
        'email' => 'rahim@landingcommerce.test',
        'role' => 'super_admin',
    ]);
});

test('initial order placement via COD action logs history with null from_status and pending to_status', function () {
    $action = app(ProcessCodOrderAction::class);

    $order = $action->execute([
        'customer_name' => 'Karim Chowdhury',
        'customer_phone' => '01819876543',
        'delivery_address' => 'House 12, Road 5, Dhanmondi',
        'district' => 'Dhaka',
        'customer_notes' => 'Ring doorbell twice',
        'idempotency_key' => (string) Str::uuid(),
        'items' => [
            [
                'product_id' => $this->product->id,
                'variant_id' => $this->variant->id,
                'quantity' => 2,
            ],
        ],
    ]);

    expect($order->status)->toBe(OrderStatus::PENDING)
        ->and($order->histories)->toHaveCount(1);

    $initialHistory = $order->histories->first();
    expect($initialHistory)->toBeInstanceOf(OrderHistory::class)
        ->and($initialHistory->order_id)->toBe($order->id)
        ->and($initialHistory->from_status)->toBeNull()
        ->and($initialHistory->to_status)->toBe(OrderStatus::PENDING)
        ->and($initialHistory->comment)->toBe('Order placed via Cash on Delivery.')
        ->and($initialHistory->user_id)->toBeNull();
});

test('eloquent relationships order histories, history order, history user, and user orderHistories work properly', function () {
    $order = Order::create([
        'order_number' => 'ORD-TEST-'.Str::random(6),
        'customer_name' => 'Fahim Rahman',
        'customer_phone' => '01711223344',
        'delivery_address' => 'Gulshan 2, Dhaka',
        'district' => 'Dhaka',
        'status' => OrderStatus::PENDING,
        'payment_method' => 'cod',
        'subtotal' => 12500.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 12570.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $history = OrderHistory::create([
        'order_id' => $order->id,
        'from_status' => null,
        'to_status' => OrderStatus::PENDING,
        'comment' => 'Initial order record',
        'user_id' => $this->admin->id,
    ]);

    // Order -> Histories
    expect($order->histories)->toHaveCount(1)
        ->and($order->histories->first()->id)->toBe($history->id);

    // Order -> LatestHistory
    expect($order->latestHistory)->not->toBeNull()
        ->and($order->latestHistory->id)->toBe($history->id);

    // History -> Order
    expect($history->order)->not->toBeNull()
        ->and($history->order->id)->toBe($order->id);

    // History -> User
    expect($history->user)->not->toBeNull()
        ->and($history->user->id)->toBe($this->admin->id)
        ->and($history->user->name)->toBe('Rahim Admin');

    // User -> OrderHistories
    expect($this->admin->orderHistories)->toHaveCount(1)
        ->and($this->admin->orderHistories->first()->id)->toBe($history->id);
});

test('histories are retrieved in strict chronological order', function () {
    $order = Order::create([
        'order_number' => 'ORD-TIME-'.Str::random(6),
        'customer_name' => 'Chronology Tester',
        'customer_phone' => '01700112233',
        'delivery_address' => 'Uttara Sector 3, Dhaka',
        'district' => 'Dhaka',
        'status' => OrderStatus::PENDING,
        'payment_method' => 'cod',
        'subtotal' => 1000.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 1070.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    // Create 3 histories with distinct timestamps
    $h1 = OrderHistory::create([
        'order_id' => $order->id,
        'from_status' => null,
        'to_status' => OrderStatus::PENDING,
        'comment' => 'Step 1',
        'user_id' => null,
        'created_at' => now()->subMinutes(10),
        'updated_at' => now()->subMinutes(10),
    ]);

    $h2 = OrderHistory::create([
        'order_id' => $order->id,
        'from_status' => OrderStatus::PENDING,
        'to_status' => OrderStatus::CONFIRMED,
        'comment' => 'Step 2',
        'user_id' => $this->admin->id,
        'created_at' => now()->subMinutes(5),
        'updated_at' => now()->subMinutes(5),
    ]);

    $h3 = OrderHistory::create([
        'order_id' => $order->id,
        'from_status' => OrderStatus::CONFIRMED,
        'to_status' => OrderStatus::PROCESSING,
        'comment' => 'Step 3',
        'user_id' => $this->admin->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $histories = $order->fresh()->histories;

    expect($histories)->toHaveCount(3)
        ->and($histories->pluck('id')->all())->toBe([$h1->id, $h2->id, $h3->id])
        ->and($order->fresh()->latestHistory->id)->toBe($h3->id);

    // Also verify scopeChronological directly
    $scoped = OrderHistory::where('order_id', $order->id)->chronological()->pluck('id')->all();
    expect($scoped)->toBe([$h1->id, $h2->id, $h3->id]);
});

test('provides structured serialized timeline with system and user attribution', function () {
    $order = Order::create([
        'order_number' => 'ORD-TL-'.Str::random(6),
        'customer_name' => 'Timeline Customer',
        'customer_phone' => '01799887766',
        'delivery_address' => 'Banani, Dhaka',
        'district' => 'Dhaka',
        'status' => OrderStatus::PENDING,
        'payment_method' => 'cod',
        'subtotal' => 5000.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 5070.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    // Initial system placement
    OrderHistory::create([
        'order_id' => $order->id,
        'from_status' => null,
        'to_status' => OrderStatus::PENDING,
        'comment' => 'Order created by customer via COD',
        'user_id' => null,
        'created_at' => now()->subMinutes(2),
        'updated_at' => now()->subMinutes(2),
    ]);

    // Admin confirmation
    $order->transitionTo(OrderStatus::CONFIRMED, 'Confirmed by call center', $this->admin);

    $timeline = $order->fresh()->getTimeline();

    expect($timeline)->toBeArray()
        ->toHaveCount(2);

    // Step 1: System action
    expect($timeline[0]['from_status'])->toBeNull()
        ->and($timeline[0]['to_status'])->toBe(OrderStatus::PENDING)
        ->and($timeline[0]['is_system'])->toBeTrue()
        ->and($timeline[0]['user_id'])->toBeNull()
        ->and($timeline[0]['user_name'])->toBeNull()
        ->and($timeline[0]['comment'])->toBe('Order created by customer via COD')
        ->and($timeline[0]['created_at'])->toBeString()
        ->and($timeline[0]['created_at_human'])->toBeString();

    // Step 2: Admin action
    expect($timeline[1]['from_status'])->toBe(OrderStatus::PENDING)
        ->and($timeline[1]['to_status'])->toBe(OrderStatus::CONFIRMED)
        ->and($timeline[1]['is_system'])->toBeFalse()
        ->and($timeline[1]['user_id'])->toBe($this->admin->id)
        ->and($timeline[1]['user_name'])->toBe('Rahim Admin')
        ->and($timeline[1]['comment'])->toBe('Confirmed by call center');
});

test('state transitions append exactly one history entry with accurate attributes', function () {
    $order = Order::create([
        'order_number' => 'ORD-TRANS-'.Str::random(6),
        'customer_name' => 'Transition Test',
        'customer_phone' => '01511223344',
        'delivery_address' => 'Motijheel, Dhaka',
        'district' => 'Dhaka',
        'status' => OrderStatus::PENDING,
        'payment_method' => 'cod',
        'subtotal' => 2000.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 2070.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    expect($order->histories)->toHaveCount(0);

    // Transition 1: System transition (null user)
    $this->fsm->transition($order, OrderStatus::CONFIRMED, 'Auto-confirmed by courier webhook', null);

    $histories = $order->fresh()->histories;
    expect($histories)->toHaveCount(1)
        ->and($histories->first()->from_status)->toBe(OrderStatus::PENDING)
        ->and($histories->first()->to_status)->toBe(OrderStatus::CONFIRMED)
        ->and($histories->first()->user_id)->toBeNull()
        ->and($histories->first()->comment)->toBe('Auto-confirmed by courier webhook');

    // Transition 2: Admin transition using User instance
    $this->fsm->transition($order, OrderStatus::PROCESSING, 'Manager dispatched order', $this->admin);

    $histories = $order->fresh()->histories;
    expect($histories)->toHaveCount(2)
        ->and($histories->last()->from_status)->toBe(OrderStatus::CONFIRMED)
        ->and($histories->last()->to_status)->toBe(OrderStatus::PROCESSING)
        ->and($histories->last()->user_id)->toBe($this->admin->id)
        ->and($histories->last()->comment)->toBe('Manager dispatched order');

    // Transition 3: Admin transition using integer ID
    $this->fsm->transition($order, OrderStatus::HANDED_TO_COURIER, 'Handed to Pathao Hub', $this->admin->id);

    $histories = $order->fresh()->histories;
    expect($histories)->toHaveCount(3)
        ->and($histories->last()->from_status)->toBe(OrderStatus::PROCESSING)
        ->and($histories->last()->to_status)->toBe(OrderStatus::HANDED_TO_COURIER)
        ->and($histories->last()->user_id)->toBe($this->admin->id)
        ->and($histories->last()->comment)->toBe('Handed to Pathao Hub');
});

test('idempotent same-state transition does not append duplicate history entry', function () {
    $order = Order::create([
        'order_number' => 'ORD-IDEMP-'.Str::random(6),
        'customer_name' => 'Idempotent Tester',
        'customer_phone' => '01611223344',
        'delivery_address' => 'Gazipur Sadar',
        'district' => 'Gazipur',
        'status' => OrderStatus::CONFIRMED,
        'payment_method' => 'cod',
        'subtotal' => 3000.00,
        'shipping_fee' => 100.00,
        'discount' => 0.00,
        'total' => 3100.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    OrderHistory::create([
        'order_id' => $order->id,
        'from_status' => OrderStatus::PENDING,
        'to_status' => OrderStatus::CONFIRMED,
        'comment' => 'Initial confirmation',
        'user_id' => $this->admin->id,
    ]);

    expect($order->fresh()->histories)->toHaveCount(1);

    // Call transition to same state
    $this->fsm->transition($order, OrderStatus::CONFIRMED, 'Duplicate webhook receipt', null);

    expect($order->fresh()->histories)->toHaveCount(1)
        ->and($order->fresh()->status)->toBe(OrderStatus::CONFIRMED);
});

test('failed transition does not append history entry', function () {
    $order = Order::create([
        'order_number' => 'ORD-FAIL-'.Str::random(6),
        'customer_name' => 'Failure Tester',
        'customer_phone' => '01711998877',
        'delivery_address' => 'Mohakhali DOHS, Dhaka',
        'district' => 'Dhaka',
        'status' => OrderStatus::PENDING,
        'payment_method' => 'cod',
        'subtotal' => 4000.00,
        'shipping_fee' => 70.00,
        'discount' => 0.00,
        'total' => 4070.00,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    OrderHistory::create([
        'order_id' => $order->id,
        'from_status' => null,
        'to_status' => OrderStatus::PENDING,
        'comment' => 'Initial',
        'user_id' => null,
    ]);

    expect($order->fresh()->histories)->toHaveCount(1);

    // Pending -> Delivered is illegal
    try {
        $this->fsm->transition($order, OrderStatus::DELIVERED, 'Direct jump to delivered', $this->admin);
    } catch (InvalidOrderStateTransitionException) {
        // expected
    }

    expect($order->fresh()->histories)->toHaveCount(1)
        ->and($order->fresh()->status)->toBe(OrderStatus::PENDING);
});
