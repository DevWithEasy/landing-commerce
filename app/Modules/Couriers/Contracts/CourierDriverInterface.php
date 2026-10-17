<?php

declare(strict_types=1);

namespace App\Modules\Couriers\Contracts;

use App\Modules\Couriers\DTOs\CourierBookingResult;
use App\Modules\Couriers\DTOs\CourierTrackingResult;
use App\Modules\Orders\Models\Order;

interface CourierDriverInterface
{
    /**
     * Get the unique courier driver identifier name (e.g., 'mock', 'steadfast', 'pathao', 'redx').
     */
    public function getName(): string;

    /**
     * Determine whether the courier driver has all required credentials configured.
     */
    public function isConfigured(): bool;

    /**
     * Book/create a delivery consignment for the given order.
     *
     * @param  array<string, mixed>  $options
     */
    public function createOrder(Order $order, array $options = []): CourierBookingResult;

    /**
     * Track an existing consignment by its courier tracking code or ID.
     */
    public function trackOrder(string $consignmentId): CourierTrackingResult;

    /**
     * Cancel an existing shipment with the courier provider.
     */
    public function cancelOrder(string $consignmentId): bool;
}
