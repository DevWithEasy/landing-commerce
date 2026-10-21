<?php

declare(strict_types=1);

use App\Modules\Couriers\Drivers\MockCourierDriver;
use App\Modules\Couriers\Drivers\PathaoCourierDriver;
use App\Modules\Couriers\Drivers\RedXCourierDriver;
use App\Modules\Couriers\Drivers\SteadfastCourierDriver;
use App\Modules\Couriers\Exceptions\CourierConfigurationException;
use App\Modules\Couriers\Services\CourierManager;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

function createDummyOrder(array $attributes = []): Order
{
    $order = new Order;
    $order->forceFill(array_merge([
        'order_number' => 'ORD-TEST-001',
        'customer_name' => 'John Doe',
        'customer_phone' => '01712345678',
        'delivery_address' => 'House 12, Road 4, Sector 3, Uttara',
        'district' => 'Dhaka',
        'subtotal' => 1200.00,
        'shipping_cost' => 60.00,
        'discount_amount' => 0.00,
        'total' => 1260.00,
        'status' => OrderStatus::PENDING,
        'notes' => 'Please call before delivery',
    ], $attributes));

    return $order;
}

test('mock courier driver completes bookings and tracking offline without network calls', function () {
    $driver = new MockCourierDriver(['prefix' => 'TESTMOCK']);

    expect($driver->getName())->toBe('mock');
    expect($driver->isConfigured())->toBeTrue();

    $order = createDummyOrder();
    $booking = $driver->createOrder($order);

    expect($booking->success)->toBeTrue();
    expect($booking->consignmentId)->toStartWith('TESTMOCK-');
    expect($booking->trackingCode)->toBe($booking->consignmentId);
    expect($booking->status)->toBe(OrderStatus::HANDED_TO_COURIER);
    expect($booking->trackingUrl)->toContain($booking->consignmentId);

    // Test simulated tracking status patterns
    $trackDelivered = $driver->trackOrder('TESTMOCK-DEL-12345');
    expect($trackDelivered->status)->toBe(OrderStatus::DELIVERED);

    $trackReturned = $driver->trackOrder('TESTMOCK-RET-12345');
    expect($trackReturned->status)->toBe(OrderStatus::RETURNED);

    $trackCancelled = $driver->trackOrder('TESTMOCK-CAN-12345');
    expect($trackCancelled->status)->toBe(OrderStatus::CANCELLED);

    $trackPending = $driver->trackOrder('TESTMOCK-PND-12345');
    expect($trackPending->status)->toBe(OrderStatus::HANDED_TO_COURIER);

    $trackInTransit = $driver->trackOrder('TESTMOCK-GEN-12345');
    expect($trackInTransit->status)->toBe(OrderStatus::IN_TRANSIT);

    expect($driver->cancelOrder('TESTMOCK-GEN-12345'))->toBeTrue();
});

test('unconfigured drivers throw CourierConfigurationException', function () {
    $steadfast = new SteadfastCourierDriver([]);
    expect($steadfast->isConfigured())->toBeFalse();

    $order = createDummyOrder();

    expect(fn () => $steadfast->createOrder($order))
        ->toThrow(CourierConfigurationException::class);

    $pathao = new PathaoCourierDriver([]);
    expect($pathao->isConfigured())->toBeFalse();

    expect(fn () => $pathao->createOrder($order))
        ->toThrow(CourierConfigurationException::class);

    $redx = new RedXCourierDriver([]);
    expect($redx->isConfigured())->toBeFalse();

    expect(fn () => $redx->createOrder($order))
        ->toThrow(CourierConfigurationException::class);
});

test('mock courier connection test succeeds without an external endpoint', function () {
    $result = (new MockCourierDriver)->testConnection();

    expect($result->success)->toBeTrue();
    expect($result->message)->toContain('Mock Courier');
    expect($result->httpStatus)->toBeNull();
});

test('steadfast connection test verifies credentials against the balance endpoint', function () {
    Http::fake([
        'https://portal.steadfast.com.bd/api/v1/get_balance' => Http::response([
            'status' => 200,
            'current_balance' => 0,
        ], 200),
    ]);

    $driver = new SteadfastCourierDriver([
        'api_key' => 'entered_api_key',
        'secret_key' => 'entered_secret_key',
        'base_url' => 'https://portal.steadfast.com.bd/api/v1',
    ]);

    $result = $driver->testConnection();

    expect($result->success)->toBeTrue();
    expect($result->httpStatus)->toBe(200);
    expect($result->message)->toContain('Steadfast connection verified');

    Http::assertSent(fn ($request) => $request->url() === 'https://portal.steadfast.com.bd/api/v1/get_balance'
        && $request->hasHeader('Api-Key', 'entered_api_key')
        && $request->hasHeader('Secret-Key', 'entered_secret_key'));
});

test('steadfast connection test reports rejected credentials', function () {
    Http::fake([
        'https://portal.steadfast.com.bd/api/v1/get_balance' => Http::response([
            'status' => 401,
            'message' => 'Invalid API credentials.',
        ], 401),
    ]);

    $driver = new SteadfastCourierDriver([
        'api_key' => 'invalid_api_key',
        'secret_key' => 'invalid_secret_key',
    ]);

    $result = $driver->testConnection();

    expect($result->success)->toBeFalse();
    expect($result->httpStatus)->toBe(401);
    expect($result->message)->toContain('Invalid API credentials');
});

test('pathao connection test forces a fresh token and verifies store access', function () {
    Cache::flush();

    Http::fake([
        'https://api-hermes.pathao.com/aladdin/api/v1/issue-token' => Http::response([
            'access_token' => 'fresh_pathao_token',
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ], 200),
        'https://api-hermes.pathao.com/aladdin/api/v1/stores*' => Http::response([
            'data' => [
                'data' => [
                    ['store_id' => 101, 'store_name' => 'Main Store'],
                ],
            ],
        ], 200),
    ]);

    $cacheKey = 'courier_pathao_token_'.md5('client_123merchant@example.com');
    Cache::put($cacheKey, 'stale_cached_token', 3600);

    $driver = new PathaoCourierDriver([
        'client_id' => 'client_123',
        'client_secret' => 'secret_123',
        'username' => 'merchant@example.com',
        'password' => 'secret_pass',
        'store_id' => '101',
    ]);

    $result = $driver->testConnection();

    expect($result->success)->toBeTrue();
    expect($result->httpStatus)->toBe(200);
    expect($result->message)->toContain('store access verified');

    Http::assertSent(fn ($request) => $request->url() === 'https://api-hermes.pathao.com/aladdin/api/v1/issue-token'
        && $request->method() === 'POST');
    Http::assertSent(fn ($request) => str_starts_with($request->url(), 'https://api-hermes.pathao.com/aladdin/api/v1/stores')
        && $request->hasHeader('Authorization', 'Bearer fresh_pathao_token'));
});

test('pathao connection test reports a store id mismatch after authentication', function () {
    Cache::flush();

    Http::fake([
        'https://api-hermes.pathao.com/aladdin/api/v1/issue-token' => Http::response([
            'access_token' => 'fresh_pathao_token',
            'expires_in' => 3600,
        ], 200),
        'https://api-hermes.pathao.com/aladdin/api/v1/stores*' => Http::response([
            'data' => [
                'data' => [
                    ['store_id' => 999, 'store_name' => 'Other Store'],
                ],
            ],
        ], 200),
    ]);

    $driver = new PathaoCourierDriver([
        'client_id' => 'client_123',
        'client_secret' => 'secret_123',
        'username' => 'merchant@example.com',
        'password' => 'secret_pass',
        'store_id' => '101',
    ]);

    $result = $driver->testConnection();

    expect($result->success)->toBeFalse();
    expect($result->message)->toContain('store ID 101');
});

test('redx connection test verifies the api token against the areas endpoint', function () {
    Http::fake([
        'https://openapi.redx.com.bd/v1.0.0-sandbox/areas' => Http::response([
            'areas' => [
                ['id' => 1, 'name' => 'Dhaka'],
            ],
        ], 200),
    ]);

    $driver = new RedXCourierDriver([
        'api_token' => 'redx_test_token',
    ]);

    $result = $driver->testConnection();

    expect($result->success)->toBeTrue();
    expect($result->httpStatus)->toBe(200);
    expect($result->message)->toContain('RedX connection verified');

    Http::assertSent(fn ($request) => $request->url() === 'https://openapi.redx.com.bd/v1.0.0-sandbox/areas'
        && $request->hasHeader('API-ACCESS-TOKEN', 'Bearer redx_test_token'));
});

test('redx connection test reports rejected api tokens', function () {
    Http::fake([
        'https://openapi.redx.com.bd/v1.0.0-sandbox/areas' => Http::response([
            'message' => 'Unauthenticated.',
        ], 401),
    ]);

    $driver = new RedXCourierDriver([
        'api_token' => 'invalid_redx_token',
    ]);

    $result = $driver->testConnection();

    expect($result->success)->toBeFalse();
    expect($result->httpStatus)->toBe(401);
    expect($result->message)->toContain('Unauthenticated');
});

test('steadfast driver books and tracks consignments correctly via API', function () {
    Http::fake([
        'https://portal.steadfast.com.bd/api/v1/create_order' => Http::response([
            'status' => 200,
            'message' => 'Order created successfully.',
            'consignment' => [
                'consignment_id' => 'ST-998877',
                'tracking_code' => 'TRK-ST-998877',
            ],
        ], 200),
        'https://portal.steadfast.com.bd/api/v1/status_by_cid/ST-998877' => Http::response([
            'status' => 200,
            'delivery_status' => 'delivered',
        ], 200),
        'https://portal.steadfast.com.bd/api/v1/order_cancel' => Http::response([
            'status' => 200,
            'message' => 'Order cancelled',
        ], 200),
    ]);

    $driver = new SteadfastCourierDriver([
        'api_key' => 'fake_api_key',
        'secret_key' => 'fake_secret_key',
        'base_url' => 'https://portal.steadfast.com.bd/api/v1',
    ]);

    expect($driver->getName())->toBe('steadfast');
    expect($driver->isConfigured())->toBeTrue();

    $order = createDummyOrder();
    $booking = $driver->createOrder($order);

    expect($booking->success)->toBeTrue();
    expect($booking->consignmentId)->toBe('ST-998877');
    expect($booking->trackingCode)->toBe('TRK-ST-998877');
    expect($booking->status)->toBe(OrderStatus::HANDED_TO_COURIER);
    expect($booking->trackingUrl)->toBe('https://steadfast.com.bd/t/TRK-ST-998877');

    $tracking = $driver->trackOrder('ST-998877');
    expect($tracking->success)->toBeTrue();
    expect($tracking->status)->toBe(OrderStatus::DELIVERED);
    expect($tracking->rawStatus)->toBe('delivered');

    $cancelled = $driver->cancelOrder('ST-998877');
    expect($cancelled)->toBeTrue();
});

test('steadfast driver handles provider errors and status mapping gracefully', function () {
    Http::fake([
        'https://portal.steadfast.com.bd/api/v1/create_order' => Http::response([
            'status' => 400,
            'message' => 'Duplicate invoice id.',
        ], 400),
    ]);

    $driver = new SteadfastCourierDriver([
        'api_key' => 'valid_key',
        'secret_key' => 'valid_secret',
    ]);

    $booking = $driver->createOrder(createDummyOrder());
    expect($booking->success)->toBeFalse();
    expect($booking->message)->toContain('Duplicate invoice id');

    // Status mappings
    expect($driver->mapDeliveryStatus('pending'))->toBe(OrderStatus::HANDED_TO_COURIER);
    expect($driver->mapDeliveryStatus('picked'))->toBe(OrderStatus::IN_TRANSIT);
    expect($driver->mapDeliveryStatus('delivered'))->toBe(OrderStatus::DELIVERED);
    expect($driver->mapDeliveryStatus('returned'))->toBe(OrderStatus::RETURNED);
    expect($driver->mapDeliveryStatus('cancelled'))->toBe(OrderStatus::CANCELLED);
    expect($driver->mapDeliveryStatus('hold'))->toBe(OrderStatus::PROCESSING);
});

test('pathao driver manages oauth tokens, bookings, tracking, and error handling', function () {
    Cache::flush();

    Http::fake([
        'https://api-hermes.pathao.com/aladdin/api/v1/issue-token' => Http::response([
            'access_token' => 'mock_pathao_bearer_token',
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ], 200),
        'https://api-hermes.pathao.com/aladdin/api/v1/orders' => Http::response([
            'type' => 'success',
            'message' => 'Order created successfully',
            'data' => [
                'consignment_id' => 'PTH-CON-1001',
                'order_status' => 'Pending',
            ],
        ], 200),
        'https://api-hermes.pathao.com/aladdin/api/v1/orders/PTH-CON-1001/info' => Http::response([
            'type' => 'success',
            'data' => [
                'consignment_id' => 'PTH-CON-1001',
                'order_status' => 'Delivered',
                'updated_at' => '2026-10-17T12:00:00Z',
            ],
        ], 200),
        'https://api-hermes.pathao.com/aladdin/api/v1/orders/PTH-CON-1001/cancel' => Http::response([
            'type' => 'success',
            'message' => 'Order cancelled',
        ], 200),
    ]);

    $driver = new PathaoCourierDriver([
        'client_id' => 'client_123',
        'client_secret' => 'secret_123',
        'username' => 'merchant@example.com',
        'password' => 'secret_pass',
        'store_id' => '101',
    ]);

    expect($driver->getName())->toBe('pathao');
    expect($driver->isConfigured())->toBeTrue();

    // Verify token retrieval and caching
    $token = $driver->getAccessToken();
    expect($token)->toBe('mock_pathao_bearer_token');

    $order = createDummyOrder();
    $booking = $driver->createOrder($order);

    expect($booking->success)->toBeTrue();
    expect($booking->consignmentId)->toBe('PTH-CON-1001');
    expect($booking->trackingCode)->toBe('PTH-CON-1001');
    expect($booking->status)->toBe(OrderStatus::HANDED_TO_COURIER);

    $tracking = $driver->trackOrder('PTH-CON-1001');
    expect($tracking->success)->toBeTrue();
    expect($tracking->status)->toBe(OrderStatus::DELIVERED);
    expect($tracking->rawStatus)->toBe('Delivered');

    $cancelled = $driver->cancelOrder('PTH-CON-1001');
    expect($cancelled)->toBeTrue();

    // Pathao status mapping
    expect($driver->mapDeliveryStatus('pending'))->toBe(OrderStatus::HANDED_TO_COURIER);
    expect($driver->mapDeliveryStatus('accepted'))->toBe(OrderStatus::HANDED_TO_COURIER);
    expect($driver->mapDeliveryStatus('in_transit'))->toBe(OrderStatus::IN_TRANSIT);
    expect($driver->mapDeliveryStatus('delivered'))->toBe(OrderStatus::DELIVERED);
    expect($driver->mapDeliveryStatus('returned'))->toBe(OrderStatus::RETURNED);
    expect($driver->mapDeliveryStatus('cancelled'))->toBe(OrderStatus::CANCELLED);
});

test('redx driver books, tracks, and maps parcel statuses correctly', function () {
    Http::fake([
        'https://openapi.redx.com.bd/v1.0.0-sandbox/parcel' => Http::response([
            'tracking_id' => 'REDX-TRK-7788',
            'message' => 'Parcel created successfully',
        ], 200),
        'https://openapi.redx.com.bd/v1.0.0-sandbox/parcel/info/REDX-TRK-7788' => Http::response([
            'parcel' => [
                'tracking_id' => 'REDX-TRK-7788',
                'status' => 'ready-for-pickup',
                'status_updated_at' => '2026-10-17T14:30:00Z',
            ],
        ], 200),
        'https://openapi.redx.com.bd/v1.0.0-sandbox/parcel/cancel' => Http::response([
            'message' => 'Parcel cancelled',
        ], 200),
    ]);

    $driver = new RedXCourierDriver([
        'api_token' => 'redx_sample_token',
    ]);

    expect($driver->getName())->toBe('redx');
    expect($driver->isConfigured())->toBeTrue();

    $order = createDummyOrder();
    $booking = $driver->createOrder($order);

    expect($booking->success)->toBeTrue();
    expect($booking->consignmentId)->toBe('REDX-TRK-7788');
    expect($booking->trackingCode)->toBe('REDX-TRK-7788');
    expect($booking->status)->toBe(OrderStatus::HANDED_TO_COURIER);

    $tracking = $driver->trackOrder('REDX-TRK-7788');
    expect($tracking->success)->toBeTrue();
    expect($tracking->status)->toBe(OrderStatus::HANDED_TO_COURIER);
    expect($tracking->rawStatus)->toBe('ready-for-pickup');

    $cancelled = $driver->cancelOrder('REDX-TRK-7788');
    expect($cancelled)->toBeTrue();

    // RedX status mapping
    expect($driver->mapDeliveryStatus('pickup-pending'))->toBe(OrderStatus::HANDED_TO_COURIER);
    expect($driver->mapDeliveryStatus('in-transit'))->toBe(OrderStatus::IN_TRANSIT);
    expect($driver->mapDeliveryStatus('delivered'))->toBe(OrderStatus::DELIVERED);
    expect($driver->mapDeliveryStatus('returned'))->toBe(OrderStatus::RETURNED);
    expect($driver->mapDeliveryStatus('cancelled'))->toBe(OrderStatus::CANCELLED);
    expect($driver->mapDeliveryStatus('hold'))->toBe(OrderStatus::PROCESSING);
});

test('courier manager resolves default and named drivers and delegates operations', function () {
    config()->set('courier.default', 'mock');
    config()->set('courier.drivers.mock.prefix', 'MGR');

    $manager = app(CourierManager::class);

    $defaultDriver = $manager->driver();
    expect($defaultDriver)->toBeInstanceOf(MockCourierDriver::class);
    expect($defaultDriver->getName())->toBe('mock');

    $steadfastDriver = $manager->driver('steadfast');
    expect($steadfastDriver)->toBeInstanceOf(SteadfastCourierDriver::class);

    $pathaoDriver = $manager->driver('pathao');
    expect($pathaoDriver)->toBeInstanceOf(PathaoCourierDriver::class);

    $redxDriver = $manager->driver('redx');
    expect($redxDriver)->toBeInstanceOf(RedXCourierDriver::class);

    expect(fn () => $manager->driver('unsupported_driver'))
        ->toThrow(InvalidArgumentException::class);

    $supported = $manager->getSupportedDrivers();
    expect($supported)->toHaveKeys(['mock', 'steadfast', 'pathao', 'redx']);

    // Delegation to default (mock)
    $order = createDummyOrder();
    $booking = $manager->createOrder($order);
    expect($booking->success)->toBeTrue();
    expect($booking->consignmentId)->toStartWith('MGR-');

    $tracking = $manager->trackOrder('MGR-DEL-999');
    expect($tracking->status)->toBe(OrderStatus::DELIVERED);

    expect($manager->cancelOrder('MGR-DEL-999'))->toBeTrue();
    expect($manager->isConfigured('mock'))->toBeTrue();
});
