<?php

declare(strict_types=1);

namespace App\Modules\Couriers\Drivers;

use App\Modules\Couriers\Contracts\CourierDriverInterface;
use App\Modules\Couriers\DTOs\CourierBookingResult;
use App\Modules\Couriers\DTOs\CourierConnectionResult;
use App\Modules\Couriers\DTOs\CourierTrackingResult;
use App\Modules\Couriers\Exceptions\CourierConfigurationException;
use App\Modules\Couriers\Exceptions\CourierException;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use Illuminate\Support\Facades\Http;

class RedXCourierDriver implements CourierDriverInterface
{
    /**
     * @param array{
     *     api_token?: ?string,
     *     base_url?: ?string
     * } $config
     */
    public function __construct(
        protected array $config = []
    ) {}

    public function getName(): string
    {
        return 'redx';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->config['api_token']);
    }

    public function testConnection(): CourierConnectionResult
    {
        $this->ensureConfigured();

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(10)
                ->get("{$this->getBaseUrl()}/areas");

            if ($response->successful()) {
                return CourierConnectionResult::success(
                    'RedX connection verified successfully.',
                    $response->status()
                );
            }

            $body = $response->json();
            $body = is_array($body) ? $body : [];
            $message = (string) ($body['message'] ?? $body['error'] ?? 'RedX rejected the API token.');

            return CourierConnectionResult::failure(
                "RedX connection failed: {$message}",
                $response->status()
            );
        } catch (CourierConfigurationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            return CourierConnectionResult::failure(
                "RedX connection failed: {$exception->getMessage()}"
            );
        }
    }

    /**
     * Validate and retrieve mandatory configuration.
     *
     * @throws CourierConfigurationException
     */
    protected function ensureConfigured(): void
    {
        if (empty($this->config['api_token'])) {
            throw CourierConfigurationException::missingCredentials('redx', ['api_token']);
        }
    }

    protected function getBaseUrl(): string
    {
        return rtrim((string) ($this->config['base_url'] ?? 'https://openapi.redx.com.bd/v1.0.0-sandbox'), '/');
    }

    /**
     * @return array<string, string>
     */
    protected function getHeaders(): array
    {
        $token = (string) ($this->config['api_token'] ?? '');
        $bearerToken = str_starts_with($token, 'Bearer ') ? $token : "Bearer {$token}";

        return [
            'API-ACCESS-TOKEN' => $bearerToken,
            'Authorization' => $bearerToken,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];
    }

    public function createOrder(Order $order, array $options = []): CourierBookingResult
    {
        $this->ensureConfigured();

        $destinationAddress = $order->delivery_address;
        $deliveryArea = $order->district ?: 'Dhaka';

        $payload = [
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'delivery_area' => $deliveryArea,
            'customer_address' => $destinationAddress,
            'merchant_invoice_id' => $order->order_number,
            'cash_collection_amount' => (float) $order->total,
            'parcel_weight' => (int) ($options['parcel_weight'] ?? 500),
            'instruction' => (string) ($order->notes ?? ''),
            'value' => (float) $order->total,
        ];

        if (! empty($options['delivery_area_id'])) {
            $payload['delivery_area_id'] = (int) $options['delivery_area_id'];
        }

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(15)
                ->post("{$this->getBaseUrl()}/parcel", $payload);

            $body = $response->json() ?? [];

            if (! $response->successful() || empty($body['tracking_id'])) {
                $errorMsg = $body['message'] ?? $response->body() ?? 'RedX parcel booking failed.';

                return CourierBookingResult::failure($errorMsg, is_array($body) ? $body : ['raw' => $response->body()]);
            }

            $trackingId = (string) $body['tracking_id'];
            $trackingUrl = "https://redx.com.bd/track-parcel?trackingId={$trackingId}";

            return CourierBookingResult::success(
                consignmentId: $trackingId,
                trackingCode: $trackingId,
                trackingUrl: $trackingUrl,
                status: OrderStatus::HANDED_TO_COURIER,
                message: $body['message'] ?? 'Parcel booked successfully with RedX.',
                rawResponse: $body
            );
        } catch (\Throwable $e) {
            if ($e instanceof CourierConfigurationException) {
                throw $e;
            }

            throw new CourierException(
                "RedX Courier API communication error: {$e->getMessage()}",
                ['payload' => $payload],
                0,
                $e
            );
        }
    }

    public function trackOrder(string $consignmentId): CourierTrackingResult
    {
        $this->ensureConfigured();

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(10)
                ->get("{$this->getBaseUrl()}/parcel/info/{$consignmentId}");

            $body = $response->json() ?? [];

            if (! $response->successful()) {
                $errorMsg = $body['message'] ?? 'Unable to retrieve RedX tracking info.';

                return CourierTrackingResult::failure($consignmentId, $errorMsg, is_array($body) ? $body : []);
            }

            $parcel = $body['parcel'] ?? $body;
            $rawStatus = (string) ($parcel['status'] ?? $parcel['parcel_status'] ?? 'unknown');
            $normalizedStatus = $this->mapDeliveryStatus($rawStatus);

            return CourierTrackingResult::create(
                consignmentId: $consignmentId,
                status: $normalizedStatus,
                rawStatus: $rawStatus,
                message: "RedX delivery status: {$rawStatus}.",
                updatedAt: (string) ($parcel['status_updated_at'] ?? now()->toIso8601String()),
                rawResponse: $body
            );
        } catch (\Throwable $e) {
            if ($e instanceof CourierConfigurationException) {
                throw $e;
            }

            throw new CourierException(
                "RedX Courier tracking error: {$e->getMessage()}",
                ['consignment_id' => $consignmentId],
                0,
                $e
            );
        }
    }

    public function cancelOrder(string $consignmentId): bool
    {
        $this->ensureConfigured();

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(10)
                ->post("{$this->getBaseUrl()}/parcel/cancel", [
                    'tracking_id' => $consignmentId,
                ]);

            $body = $response->json() ?? [];

            return $response->successful() && ! isset($body['errors']);
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Map RedX status to system OrderStatus.
     */
    public function mapDeliveryStatus(string $rawStatus): string
    {
        $normalized = strtolower(trim(str_replace([' ', '_'], '-', $rawStatus)));

        return match ($normalized) {
            'pickup-pending', 'ready-for-pickup', 'created', 'pending' => OrderStatus::HANDED_TO_COURIER,
            'in-transit', 'out-for-delivery', 'transit' => OrderStatus::IN_TRANSIT,
            'delivered', 'payment-collected' => OrderStatus::DELIVERED,
            'cancelled', 'canceled' => OrderStatus::CANCELLED,
            'returned', 'returning', 'rejected' => OrderStatus::RETURNED,
            'hold', 'rescheduled' => OrderStatus::PROCESSING,
            default => OrderStatus::IN_TRANSIT,
        };
    }
}
