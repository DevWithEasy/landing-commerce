<?php

declare(strict_types=1);

namespace App\Modules\Shipping\Services;

use App\Modules\Shipping\Models\District;
use App\Modules\Shipping\Models\ShippingZone;
use App\Modules\Shipping\Models\Upazila;

class ShippingCalculationResult
{
    public function __construct(
        public readonly ShippingZone $zone,
        public readonly string $zoneCode,
        public readonly string $zoneName,
        public readonly float $shippingFee,
        public readonly string $deliveryTime,
        public readonly ?District $district = null,
        public readonly ?Upazila $upazila = null
    ) {}

    public function formattedFee(): string
    {
        return '৳'.number_format($this->shippingFee, 2);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'zone_id' => $this->zone->id,
            'zone_code' => $this->zoneCode,
            'zone_name' => $this->zoneName,
            'shipping_fee' => $this->shippingFee,
            'formatted_fee' => $this->formattedFee(),
            'delivery_time' => $this->deliveryTime,
            'district_name' => $this->district?->name,
            'upazila_name' => $this->upazila?->name,
        ];
    }
}
