<?php

declare(strict_types=1);

namespace App\Modules\Couriers\Drivers;

use App\Modules\Couriers\Contracts\CourierDriverInterface;
use App\Modules\Couriers\DTOs\CourierBookingResult;
use App\Modules\Couriers\DTOs\CourierTrackingResult;
use App\Modules\Couriers\Exceptions\CourierConfigurationException;
use App\Modules\Couriers\Exceptions\CourierException;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use Illuminate\Support\Facades\Http;

class SteadfastCourierDriver implements CourierDriverInterface
{
    /**
     * @param  array{api_key?: ?string, secret_key?: ?string, base_url?: ?string}  $config
     */
    public function __construct(
        protected array $config = []
    ) {}

    public function getName(): string
    {
        return 'steadfast';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->config['api_key']) && ! empty($this->config['secret_key']);
    }

    /**
     * Validate and retrieve mandatory configuration.
     *
     * @throws CourierConfigurationException
     */
    protected function ensureConfigured(): void
    {
        $missing = [];
        if (empty($this->config['api_key'])) {
            $missing[] = 'api_key';
        }
        if (empty($this->config['secret_key'])) {
            $missing[] = 'secret_key';
        }

        if (! empty($missing)) {
            throw CourierConfigurationException::missingCredentials('steadfast', $missing);
        }
    }

    protected function getBaseUrl(): string
    {
        return rtrim($this->config['base_url'] ?? 'https://portal.steadfast.com.bd/api/v1', '/');
    }

    /**
     * @return array<string, string>
     */
    protected function getHeaders(): array
    {
        return [
            'Api-Key' => (string) ($this->config['api_key'] ?? ''),
            'Secret-Key' => (string) ($this->config['secret_key'] ?? ''),
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];
    }

    public function createOrder(Order $order, array $options = []): CourierBookingResult
    {
        $this->ensureConfigured();

        $destinationAddress = $order->delivery_address;
        if (! empty($order->district) && ! str_contains(strtolower($destinationAddress), strtolower($order->district))) {
            $destinationAddress .= ', '.$order->district;
        }

        $payload = [
            'invoice' => $order->order_number,
            'recipient_name' => $order->customer_name,
            'recipient_phone' => $order->customer_phone,
            'recipient_address' => $destinationAddress,
            'cod_amount' => (float) $order->total,
            'note' => $order->notes ?? '',
        ];

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(15)
                ->post("{$this->getBaseUrl()}/create_order", $payload);

            $body = $response->json() ?? [];

            if (! $response->successful() || ($body['status'] ?? 0) !== 200) {
                $errorMsg = $body['message'] ?? $response->body() ?? 'Steadfast booking request failed.';

                return CourierBookingResult::failure($errorMsg, is_array($body) ? $body : ['raw' => $response->body()]);
            }

            $consignment = $body['consignment'] ?? [];
            $consignmentId = (string) ($consignment['consignment_id'] ?? '');
            $trackingCode = (string) ($consignment['tracking_code'] ?? $consignmentId);
            $trackingUrl = "https://steadfast.com.bd/t/{$trackingCode}";

            return CourierBookingResult::success(
                consignmentId: $consignmentId,
                trackingCode: $trackingCode,
                trackingUrl: $trackingUrl,
                status: OrderStatus::HANDED_TO_COURIER,
                message: $body['message'] ?? 'Consignment booked successfully with Steadfast.',
                rawResponse: $body
            );
        } catch (\Throwable $e) {
            if ($e instanceof CourierConfigurationException) {
                throw $e;
            }

            throw new CourierException(
                "Steadfast Courier API communication error: {$e->getMessage()}",
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
                ->get("{$this->getBaseUrl()}/status_by_cid/{$consignmentId}");

            $body = $response->json() ?? [];

            if (! $response->successful() || ($body['status'] ?? 0) !== 200) {
                $errorMsg = $body['message'] ?? 'Unable to retrieve Steadfast tracking info.';

                return CourierTrackingResult::failure($consignmentId, $errorMsg, is_array($body) ? $body : []);
            }

            $rawStatus = (string) ($body['delivery_status'] ?? 'unknown');
            $normalizedStatus = $this->mapDeliveryStatus($rawStatus);

            return CourierTrackingResult::create(
                consignmentId: $consignmentId,
                status: $normalizedStatus,
                rawStatus: $rawStatus,
                message: "Steadfast delivery status: {$rawStatus}.",
                updatedAt: now()->toIso8601String(),
                rawResponse: $body
            );
        } catch (\Throwable $e) {
            if ($e instanceof CourierConfigurationException) {
                throw $e;
            }

            throw new CourierException(
                "Steadfast Courier tracking error: {$e->getMessage()}",
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
                ->post("{$this->getBaseUrl()}/order_cancel", [
                    'consignment_id' => $consignmentId,
                ]);

            $body = $response->json() ?? [];

            return $response->successful() && (($body['status'] ?? 0) === 200);
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Map Steadfast status to system OrderStatus.
     */
    public function mapDeliveryStatus(string $rawStatus): string
    {
        $normalized = strtolower(trim($rawStatus));

        return match ($normalized) {
            'pending', 'in_review' => OrderStatus::HANDED_TO_COURIER,
            'picked', 'in_transit', 'delivering' => OrderStatus::IN_TRANSIT,
            'delivered', 'partial_delivered' => OrderStatus::DELIVERED,
            'cancelled', 'cancelled_by_user' => OrderStatus::CANCELLED,
            'hold' => OrderStatus::PROCESSING,
            'returned', 'return' => OrderStatus::RETURNED,
            default => OrderStatus::IN_TRANSIT,
        };
    }
}
