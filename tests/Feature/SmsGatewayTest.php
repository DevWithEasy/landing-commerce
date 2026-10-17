<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Sms\Contracts\SmsDriverInterface;
use App\Modules\Sms\Drivers\GreenwebSmsDriver;
use App\Modules\Sms\Drivers\MockSmsDriver;
use App\Modules\Sms\Drivers\SmspohSmsDriver;
use App\Modules\Sms\Drivers\SslWirelessSmsDriver;
use App\Modules\Sms\Exceptions\SmsConfigurationException;
use App\Modules\Sms\Services\SmsManager;
use App\Modules\Sms\Services\SmsTemplateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

function createDummySmsOrder(array $attributes = []): Order
{
    $order = new Order;
    $order->forceFill(array_merge([
        'order_number' => 'ORD-SMS-1001',
        'customer_name' => 'Rahim Uddin',
        'customer_phone' => '01711223344',
        'delivery_address' => 'Road 1, Block A, Banani',
        'district' => 'Dhaka',
        'upazila' => 'Banani',
        'subtotal' => 1500.00,
        'shipping_fee' => 80.00,
        'discount' => 0.00,
        'total' => 1580.00,
        'status' => OrderStatus::CONFIRMED,
        'courier_name' => 'steadfast',
        'courier_tracking_id' => 'ST-998877',
        'courier_tracking_url' => 'https://steadfast.com.bd/t/ST-998877',
        'notes' => 'Urgent delivery requested',
    ], $attributes));

    return $order;
}

function createPersistedSmsOrder(string $status = OrderStatus::CONFIRMED, array $attributes = []): Order
{
    return Order::query()->create(array_merge([
        'order_number' => 'ORD-SMS-'.uniqid(),
        'idempotency_key' => 'idemp_'.uniqid(),
        'customer_name' => 'Rahim Uddin',
        'customer_phone' => '01711223344',
        'delivery_address' => 'Road 1, Block A, Banani',
        'district' => 'Dhaka',
        'upazila' => 'Banani',
        'subtotal' => 1500.00,
        'shipping_fee' => 80.00,
        'discount' => 0.00,
        'total' => 1580.00,
        'payment_method' => 'cod',
        'status' => $status,
        'courier_name' => 'steadfast',
        'courier_tracking_id' => 'ST-998877',
        'courier_tracking_url' => 'https://steadfast.com.bd/t/ST-998877',
        'notes' => 'Urgent delivery requested',
    ], $attributes));
}

beforeEach(function () {
    MockSmsDriver::clearSentMessages();
});

test('mock sms driver dispatches messages offline and logs history', function () {
    $driver = new MockSmsDriver;

    expect($driver->getName())->toBe('mock');
    expect($driver->isConfigured())->toBeTrue();

    $result = $driver->send('01711223344', 'Your order is confirmed!');

    expect($result->success)->toBeTrue();
    expect($result->provider)->toBe('mock');
    expect($result->recipient)->toBe('01711223344');
    expect($result->content)->toBe('Your order is confirmed!');
    expect($result->messageId)->toStartWith('MOCK-SMS-');

    expect(MockSmsDriver::hasSentTo('01711223344'))->toBeTrue();
    expect(MockSmsDriver::getSentMessages())->toHaveCount(1);

    // Test sendOrderNotification with order
    $order = createDummySmsOrder();
    $templateResult = $driver->sendOrderNotification($order, 'order_confirmed');

    expect($templateResult->success)->toBeTrue();
    expect($templateResult->content)->toContain($order->order_number);
    expect($templateResult->content)->toContain($order->customer_name);
    expect(MockSmsDriver::getSentMessages())->toHaveCount(2);
});

test('sms template service correctly interpolates placeholders', function () {
    $templates = [
        'order_placed' => 'Hello {customer_name}, order {order_number} received! Total: {total} BDT.',
        'out_for_delivery' => 'Dear {customer_name}, parcel with tracking {tracking_id} via {courier_name} is out for delivery. View: {tracking_url}',
    ];

    $service = new SmsTemplateService($templates);
    $order = createDummySmsOrder();

    $renderedPlaced = $service->renderOrder($order, 'order_placed');
    expect($renderedPlaced)->toBe('Hello Rahim Uddin, order ORD-SMS-1001 received! Total: 1580.00 BDT.');

    $renderedOut = $service->renderOrder($order, 'out_for_delivery');
    expect($renderedOut)->toBe('Dear Rahim Uddin, parcel with tracking ST-998877 via steadfast is out for delivery. View: https://steadfast.com.bd/t/ST-998877');

    // Test custom string interpolation
    $custom = $service->renderOrder($order, 'Order {order_number} to {customer_phone}');
    expect($custom)->toBe('Order ORD-SMS-1001 to 01711223344');
});

test('live sms drivers throw configuration exception when credentials are not configured', function () {
    $greenweb = new GreenwebSmsDriver(['token' => '']);
    expect($greenweb->isConfigured())->toBeFalse();
    expect(fn () => $greenweb->send('01711223344', 'test'))
        ->toThrow(SmsConfigurationException::class);

    $ssl = new SslWirelessSmsDriver(['api_token' => '', 'sid' => '']);
    expect($ssl->isConfigured())->toBeFalse();
    expect(fn () => $ssl->send('01711223344', 'test'))
        ->toThrow(SmsConfigurationException::class);

    $smspoh = new SmspohSmsDriver(['token' => '']);
    expect($smspoh->isConfigured())->toBeFalse();
    expect(fn () => $smspoh->send('01711223344', 'test'))
        ->toThrow(SmsConfigurationException::class);
});

test('greenweb sms driver handles successful json and plain text responses via http fake', function () {
    Http::fake([
        'api.greenweb.com.bd/api.php*' => Http::response([
            [
                'status' => 'SUCCESS',
                'statusmsg' => 'SUCCESS',
                'messageid' => 'GW-123456',
            ],
        ], 200),
    ]);

    $driver = new GreenwebSmsDriver([
        'token' => 'test-greenweb-token',
        'base_url' => 'https://api.greenweb.com.bd/api.php',
    ]);

    expect($driver->isConfigured())->toBeTrue();
    $result = $driver->send('01711223344', 'Hello from Greenweb!');

    expect($result->success)->toBeTrue();
    expect($result->provider)->toBe('greenweb');
    expect($result->messageId)->toBe('GW-123456');

    // Test plain text code Ok: response format
    Http::fake([
        'api.greenweb.com.bd/api.php*' => Http::response('Ok: 1 SMS Sent Successfully', 200),
    ]);

    $textResult = $driver->send('01711223344', 'Plain text test');
    expect($textResult->success)->toBeTrue();
    expect($textResult->status)->toBe('sent');
});

test('ssl wireless sms driver sends payload and parses response via http fake', function () {
    Http::fake([
        'smsplus.sslwireless.com/api/v3/send-sms*' => Http::response([
            'status' => 'SUCCESS',
            'status_code' => 200,
            'error_message' => '',
            'smsinfo' => [
                [
                    'sms_status' => 'SUCCESS',
                    'msisdn' => '8801711223344',
                    'reference_id' => 'SSL-REF-7788',
                ],
            ],
        ], 200),
    ]);

    $driver = new SslWirelessSmsDriver([
        'api_token' => 'test-ssl-token',
        'sid' => 'TESTSID',
        'base_url' => 'https://smsplus.sslwireless.com/api/v3/send-sms',
    ]);

    expect($driver->isConfigured())->toBeTrue();
    $result = $driver->send('01711223344', 'Your order is confirmed!');

    expect($result->success)->toBeTrue();
    expect($result->provider)->toBe('ssl_wireless');
    expect($result->messageId)->toBe('SSL-REF-7788');
});

test('smspoh driver sends authorization bearer and parses response via http fake', function () {
    Http::fake([
        'v3.smspoh.com/api/rest/send*' => Http::response([
            'status' => true,
            'data' => [
                'message_id' => 'POH-MSG-5566',
            ],
        ], 200),
    ]);

    $driver = new SmspohSmsDriver([
        'token' => 'smspoh-bearer-token',
        'sender_id' => 'LandingCommerce',
        'base_url' => 'https://v3.smspoh.com/api/rest/send',
    ]);

    expect($driver->isConfigured())->toBeTrue();
    $result = $driver->send('01711223344', 'Notification test');

    expect($result->success)->toBeTrue();
    expect($result->provider)->toBe('smspoh');
    expect($result->messageId)->toBe('POH-MSG-5566');
});

test('sms manager resolves drivers and checks configuration status', function () {
    $manager = app(SmsManager::class);

    $driver = $manager->driver('mock');
    expect($driver)->toBeInstanceOf(SmsDriverInterface::class);
    expect($driver->getName())->toBe('mock');
    expect($manager->isConfigured('mock'))->toBeTrue();

    // Default driver fallback
    $defaultDriver = $manager->driver();
    expect($defaultDriver->getName())->toBe(config('sms.default', 'mock'));
});

test('order sms dispatch endpoint requires authentication', function () {
    $order = createPersistedSmsOrder();

    $response = $this->post(route('admin.orders.sms.send', $order), [
        'driver' => 'mock',
        'template' => 'order_confirmed',
    ]);

    $response->assertRedirect(route('login'));
});

test('authenticated admin dispatches templated sms and logs audit history', function () {
    $admin = User::factory()->create(['role' => 'super_admin']);

    $order = createPersistedSmsOrder(OrderStatus::CONFIRMED, [
        'order_number' => 'ORD-DISPATCH-99',
        'customer_name' => 'Karim Hasan',
        'customer_phone' => '01811223344',
        'total' => 1250.00,
    ]);

    $response = $this->actingAs($admin)
        ->from(route('admin.orders.index'))
        ->post(route('admin.orders.sms.send', $order), [
            'driver' => 'mock',
            'template' => 'order_confirmed',
        ]);

    $response->assertRedirect(route('admin.orders.index'));
    $response->assertSessionHas('success');

    expect(MockSmsDriver::hasSentTo('01811223344'))->toBeTrue();

    // Verify order_histories audit entry
    $order->refresh();
    $latestHistory = $order->histories()->latest('id')->first();

    expect($latestHistory)->not->toBeNull();
    expect($latestHistory->from_status)->toBe(OrderStatus::CONFIRMED);
    expect($latestHistory->to_status)->toBe(OrderStatus::CONFIRMED);
    expect($latestHistory->user_id)->toBe($admin->id);
    expect($latestHistory->comment)->toContain('SMS dispatched via mock');
    expect($latestHistory->comment)->toContain('ORD-DISPATCH-99');
});

test('authenticated admin dispatches custom message sms and logs audit history', function () {
    $admin = User::factory()->create(['role' => 'super_admin']);

    $order = createPersistedSmsOrder(OrderStatus::PROCESSING, [
        'order_number' => 'ORD-CUSTOM-77',
        'customer_name' => 'Salma Begum',
        'customer_phone' => '01911223344',
        'total' => 2400.00,
    ]);

    $customText = 'Hello Salma, your custom gift pack has been verified!';

    $response = $this->actingAs($admin)
        ->from(route('admin.orders.index'))
        ->post(route('admin.orders.sms.send', $order), [
            'driver' => 'mock',
            'template' => 'custom',
            'message' => $customText,
        ]);

    $response->assertRedirect(route('admin.orders.index'));
    $response->assertSessionHas('success');

    $latestHistory = $order->histories()->latest('id')->first();
    expect($latestHistory->comment)->toBe("SMS dispatched via mock: {$customText}");
    expect($latestHistory->user_id)->toBe($admin->id);
});

test('validates custom message presence when template is custom', function () {
    $admin = User::factory()->create(['role' => 'super_admin']);

    $order = createPersistedSmsOrder(OrderStatus::CONFIRMED, [
        'customer_phone' => '01911223344',
    ]);

    $response = $this->actingAs($admin)
        ->from(route('admin.orders.index'))
        ->post(route('admin.orders.sms.send', $order), [
            'driver' => 'mock',
            'template' => 'custom',
            'message' => '',
        ]);

    $response->assertSessionHasErrors(['message']);
});

test('handles greenweb provider failure response gracefully', function () {
    Http::fake([
        'api.greenweb.com.bd/api.php*' => Http::response([
            [
                'status' => 'FAILED',
                'statusmsg' => 'Invalid Access Token',
            ],
        ], 200),
    ]);

    $driver = new GreenwebSmsDriver([
        'token' => 'invalid-token',
        'base_url' => 'https://api.greenweb.com.bd/api.php',
    ]);

    $result = $driver->send('01711223344', 'Test failure');

    expect($result->success)->toBeFalse();
    expect($result->provider)->toBe('greenweb');
    expect($result->message)->toContain('Invalid Access Token');
});

test('handles ssl wireless provider error response gracefully', function () {
    Http::fake([
        'smsplus.sslwireless.com/api/v3/send-sms*' => Http::response([
            'status' => 'FAILED',
            'status_code' => 401,
            'error_message' => 'Authentication Failed',
        ], 200),
    ]);

    $driver = new SslWirelessSmsDriver([
        'api_token' => 'invalid-token',
        'sid' => 'INVALIDSID',
        'base_url' => 'https://smsplus.sslwireless.com/api/v3/send-sms',
    ]);

    $result = $driver->send('01711223344', 'Test failure');

    expect($result->success)->toBeFalse();
    expect($result->provider)->toBe('ssl_wireless');
    expect($result->message)->toContain('Authentication Failed');
});

test('handles smspoh provider error response gracefully', function () {
    Http::fake([
        'v3.smspoh.com/api/rest/send*' => Http::response([
            'status' => false,
            'message' => 'Insufficient credit balance',
        ], 402),
    ]);

    $driver = new SmspohSmsDriver([
        'token' => 'empty-balance-token',
        'base_url' => 'https://v3.smspoh.com/api/rest/send',
    ]);

    $result = $driver->send('01711223344', 'Test failure');

    expect($result->success)->toBeFalse();
    expect($result->provider)->toBe('smspoh');
    expect($result->message)->toContain('Insufficient credit balance');
});

test('returns error when attempting to dispatch via unconfigured driver in controller', function () {
    $admin = User::factory()->create(['role' => 'super_admin']);
    $order = createPersistedSmsOrder();

    config(['sms.drivers.greenweb.token' => null]);

    $response = $this->actingAs($admin)
        ->from(route('admin.orders.index'))
        ->post(route('admin.orders.sms.send', $order), [
            'driver' => 'greenweb',
            'template' => 'order_confirmed',
        ]);

    $response->assertRedirect(route('admin.orders.index'));
    $response->assertSessionHas('error');
});

test('non-admin user is rejected from dispatching order sms', function () {
    $user = User::factory()->create(['role' => 'customer']);
    $order = createPersistedSmsOrder();

    $response = $this->actingAs($user)
        ->post(route('admin.orders.sms.send', $order), [
            'driver' => 'mock',
            'template' => 'order_confirmed',
        ]);

    $response->assertForbidden();
});
