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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class PathaoCourierDriver implements CourierDriverInterface
{
    /**
     * @param array{
     *     client_id?: ?string,
     *     client_secret?: ?string,
     *     username?: ?string,
     *     password?: ?string,
     *     store_id?: ?string|int,
     *     base_url?: ?string
     * } $config
     */
    public function __construct(
        protected array $config = []
    ) {}

    public function getName(): string
    {
        return 'pathao';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->config['client_id'])
            && ! empty($this->config['client_secret'])
            && ! empty($this->config['username'])
            && ! empty($this->config['password'])
            && ! empty($this->config['store_id']);
    }

    /**
     * Validate and retrieve mandatory configuration.
     *
     * @throws CourierConfigurationException
     */
    protected function ensureConfigured(): void
    {
        $missing = [];
        foreach (['client_id', 'client_secret', 'username', 'password', 'store_id'] as $key) {
            if (empty($this->config[$key])) {
                $missing[] = $key;
            }
        }

        if (! empty($missing)) {
            throw CourierConfigurationException::missingCredentials('pathao', $missing);
        }
    }

    protected function getBaseUrl(): string
    {
        return rtrim((string) ($this->config['base_url'] ?? 'https://api-hermes.pathao.com'), '/');
    }

    /**
     * Obtain and cache an OAuth2 bearer token from Pathao.
     *
     * @throws CourierException
     */
    public function getAccessToken(): string
    {
        $this->ensureConfigured();

        $cacheKey = 'courier_pathao_token_'.md5((string) $this->config['client_id'].(string) $this->config['username']);

        $token = Cache::get($cacheKey);
        if (is_string($token) && ! empty($token)) {
            return $token;
        }

        try {
            $response = Http::asJson()
                ->timeout(15)
                ->post("{$this->getBaseUrl()}/aladdin/api/v1/issue-token", [
                    'client_id' => $this->config['client_id'],
                    'client_secret' => $this->config['client_secret'],
                    'username' => $this->config['username'],
                    'password' => $this->config['password'],
                    'grant_type' => 'password',
                ]);

            $body = $response->json() ?? [];

            if (! $response->successful() || empty($body['access_token'])) {
                $errorMsg = $body['message'] ?? $body['error_description'] ?? 'Failed to authenticate with Pathao API.';
                throw new CourierException("Pathao authentication failed: {$errorMsg}", is_array($body) ? $body : []);
            }

            $token = (string) $body['access_token'];
            $expiresIn = (int) ($body['expires_in'] ?? 3600);
            $cacheSeconds = max(60, $expiresIn - 120);

            Cache::put($cacheKey, $token, $cacheSeconds);

            return $token;
        } catch (\Throwable $e) {
            if ($e instanceof CourierConfigurationException || $e instanceof CourierException) {
                throw $e;
            }

            throw new CourierException(
                "Pathao token request error: {$e->getMessage()}",
                [],
                0,
                $e
            );
        }
    }

    /**
     * @return array<string, string>
     */
    protected function getAuthHeaders(): array
    {
        $token = $this->getAccessToken();

        return [
            'Authorization' => "Bearer {$token}",
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

        $itemQuantity = 1;
        if ($order->relationLoaded('items')) {
            $qty = $order->items->sum('quantity');
            if ($qty > 0) {
                $itemQuantity = (int) $qty;
            }
        } elseif ($order->exists && method_exists($order, 'items')) {
            $qty = $order->items()->sum('quantity');
            if ($qty > 0) {
                $itemQuantity = (int) $qty;
            }
        }

        $payload = [
            'store_id' => (int) $this->config['store_id'],
            'merchant_order_id' => $order->order_number,
            'recipient_name' => $order->customer_name,
            'recipient_phone' => $order->customer_phone,
            'recipient_address' => $destinationAddress,
            'recipient_city' => (int) ($options['city_id'] ?? 1),
            'recipient_zone' => (int) ($options['zone_id'] ?? 1),
            'recipient_area' => isset($options['area_id']) ? (int) $options['area_id'] : null,
            'delivery_type' => 48,
            'item_type' => 1,
            'special_instruction' => (string) ($order->notes ?? ''),
            'item_quantity' => $itemQuantity,
            'item_weight' => (float) ($options['weight'] ?? 0.5),
            'amount_to_collect' => (float) $order->total,
            'item_description' => "Order #{$order->order_number}",
        ];

        try {
            $headers = $this->getAuthHeaders();

            $response = Http::withHeaders($headers)
                ->timeout(15)
                ->post("{$this->getBaseUrl()}/aladdin/api/v1/orders", $payload);

            $body = $response->json() ?? [];

            if (! $response->successful() || (isset($body['type']) && $body['type'] === 'error')) {
                $errorMsg = $body['message'] ?? $response->body() ?? 'Pathao order creation failed.';

                return CourierBookingResult::failure($errorMsg, is_array($body) ? $body : ['raw' => $response->body()]);
            }

            $data = $body['data'] ?? [];
            $consignmentId = (string) ($data['consignment_id'] ?? '');
            if (empty($consignmentId)) {
                return CourierBookingResult::failure('Pathao API did not return a valid consignment ID.', is_array($body) ? $body : []);
            }

            $trackingCode = $consignmentId;
            $trackingUrl = "https://pathao.com/track?consignment_id={$consignmentId}";

            return CourierBookingResult::success(
                consignmentId: $consignmentId,
                trackingCode: $trackingCode,
                trackingUrl: $trackingUrl,
                status: OrderStatus::HANDED_TO_COURIER,
                message: $body['message'] ?? 'Consignment booked successfully with Pathao.',
                rawResponse: $body
            );
        } catch (\Throwable $e) {
            if ($e instanceof CourierConfigurationException) {
                throw $e;
            }

            throw new CourierException(
                "Pathao Courier API communication error: {$e->getMessage()}",
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
            $headers = $this->getAuthHeaders();

            $response = Http::withHeaders($headers)
                ->timeout(10)
                ->get("{$this->getBaseUrl()}/aladdin/api/v1/orders/{$consignmentId}/info");

            $body = $response->json() ?? [];

            if (! $response->successful() || empty($body['data'])) {
                $errorMsg = $body['message'] ?? 'Unable to retrieve Pathao tracking info.';

                return CourierTrackingResult::failure($consignmentId, $errorMsg, is_array($body) ? $body : []);
            }

            $data = $body['data'];
            $rawStatus = (string) ($data['order_status'] ?? $data['order_status_slug'] ?? 'unknown');
            $normalizedStatus = $this->mapDeliveryStatus($rawStatus);

            return CourierTrackingResult::create(
                consignmentId: $consignmentId,
                status: $normalizedStatus,
                rawStatus: $rawStatus,
                message: "Pathao delivery status: {$rawStatus}.",
                updatedAt: (string) ($data['updated_at'] ?? now()->toIso8601String()),
                rawResponse: $body
            );
        } catch (\Throwable $e) {
            if ($e instanceof CourierConfigurationException) {
                throw $e;
            }

            throw new CourierException(
                "Pathao Courier tracking error: {$e->getMessage()}",
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
            $headers = $this->getAuthHeaders();

            $response = Http::withHeaders($headers)
                ->timeout(10)
                ->post("{$this->getBaseUrl()}/aladdin/api/v1/orders/{$consignmentId}/cancel");

            $body = $response->json() ?? [];

            return $response->successful() && (($body['type'] ?? '') !== 'error');
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Map Pathao status to system OrderStatus.
     */
    public function mapDeliveryStatus(string $rawStatus): string
    {
        $normalized = strtolower(trim(str_replace(['-', ' '], '_', $rawStatus)));

        return match ($normalized) {
            'pending', 'accepted' => OrderStatus::HANDED_TO_COURIER,
            'in_transit', 'picked_up', 'dispatched' => OrderStatus::IN_TRANSIT,
            'delivered', 'payment_collected' => OrderStatus::DELIVERED,
            'cancelled', 'closed' => OrderStatus::CANCELLED,
            'return', 'returned', 'failed' => OrderStatus::RETURNED,
            'hold', 'on_hold' => OrderStatus::PROCESSING,
            default => OrderStatus::IN_TRANSIT,
        };
    }
}
