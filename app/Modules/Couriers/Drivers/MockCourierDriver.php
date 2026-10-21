<?php

declare(strict_types=1);

namespace App\Modules\Couriers\Drivers;

use App\Modules\Couriers\Contracts\CourierDriverInterface;
use App\Modules\Couriers\DTOs\CourierBookingResult;
use App\Modules\Couriers\DTOs\CourierConnectionResult;
use App\Modules\Couriers\DTOs\CourierTrackingResult;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;

class MockCourierDriver implements CourierDriverInterface
{
    /**
     * @param  array<string, mixed>  $config
     */
    public function __construct(
        protected array $config = []
    ) {}

    public function getName(): string
    {
        return 'mock';
    }

    public function isConfigured(): bool
    {
        return true;
    }

    public function testConnection(): CourierConnectionResult
    {
        return CourierConnectionResult::success(
            'Mock Courier is always available for offline testing. No external endpoint is required.'
        );
    }

    public function createOrder(Order $order, array $options = []): CourierBookingResult
    {
        $prefix = $this->config['prefix'] ?? 'MCK';
        $uniqueSuffix = strtoupper(substr(md5($order->order_number.microtime()), 0, 8));
        $consignmentId = "{$prefix}-{$uniqueSuffix}";
        $trackingUrl = "https://mock-courier.test/track/{$consignmentId}";

        return CourierBookingResult::success(
            consignmentId: $consignmentId,
            trackingCode: $consignmentId,
            trackingUrl: $trackingUrl,
            status: OrderStatus::HANDED_TO_COURIER,
            message: 'Order consignment created successfully with Mock Courier.',
            rawResponse: [
                'provider' => 'mock',
                'order_number' => $order->order_number,
                'cod_amount' => (float) $order->total,
                'customer_name' => $order->customer_name,
                'customer_phone' => $order->customer_phone,
                'district' => $order->district,
                'created_at' => now()->toIso8601String(),
            ]
        );
    }

    public function trackOrder(string $consignmentId): CourierTrackingResult
    {
        // Deterministic status simulation for testing
        $normalizedId = strtoupper(trim($consignmentId));

        if (str_contains($normalizedId, 'DEL')) {
            $status = OrderStatus::DELIVERED;
            $rawStatus = 'Delivered';
        } elseif (str_contains($normalizedId, 'RET')) {
            $status = OrderStatus::RETURNED;
            $rawStatus = 'Returned';
        } elseif (str_contains($normalizedId, 'CAN')) {
            $status = OrderStatus::CANCELLED;
            $rawStatus = 'Cancelled';
        } elseif (str_contains($normalizedId, 'PND')) {
            $status = OrderStatus::HANDED_TO_COURIER;
            $rawStatus = 'Pending Pickup';
        } else {
            $status = OrderStatus::IN_TRANSIT;
            $rawStatus = 'In Transit';
        }

        return CourierTrackingResult::create(
            consignmentId: $consignmentId,
            status: $status,
            rawStatus: $rawStatus,
            message: "Simulated courier tracking status: {$rawStatus}.",
            updatedAt: now()->toIso8601String(),
            rawResponse: [
                'provider' => 'mock',
                'consignment_id' => $consignmentId,
                'simulated_status' => $status,
            ]
        );
    }

    public function cancelOrder(string $consignmentId): bool
    {
        return true;
    }
}
