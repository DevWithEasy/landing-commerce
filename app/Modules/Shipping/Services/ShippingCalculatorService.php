<?php

declare(strict_types=1);

namespace App\Modules\Shipping\Services;

use App\Modules\Shipping\Models\District;
use App\Modules\Shipping\Models\ShippingMethod;
use App\Modules\Shipping\Models\ShippingZone;
use App\Modules\Shipping\Models\Upazila;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;

class ShippingCalculatorService
{
    /**
     * Standard fallback rates if database records are unavailable.
     */
    public const DEFAULT_RATES = [
        'inside_dhaka' => 70.00,
        'sub_dhaka' => 100.00,
        'outside_dhaka' => 130.00,
    ];

    /**
     * Calculate shipping fee and zone based on district, optional upazila, and optional shipping method.
     */
    public function calculate(
        District|string|int $district,
        Upazila|string|int|null $upazila = null,
        ?int $shippingMethodId = null
    ): ShippingCalculationResult {
        $districtModel = $this->resolveDistrict($district);
        $upazilaModel = $this->resolveUpazila($upazila, $districtModel);

        $zone = $this->resolveZone($districtModel, $upazilaModel);

        $availableMethods = ShippingMethod::active()
            ->forZone($zone->code)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $selectedMethod = null;

        if ($shippingMethodId !== null) {
            $selectedMethod = $availableMethods->firstWhere('id', (int) $shippingMethodId);
            if (! $selectedMethod) {
                // If not in the preliminary zone, check if this is a valid active method in the store
                $directMethod = ShippingMethod::active()->find((int) $shippingMethodId);
                if ($directMethod) {
                    $selectedMethod = $directMethod;
                    $methodZone = $directMethod->shippingZone ?? ShippingZone::where('code', $directMethod->zone_code)->first();
                    if ($methodZone) {
                        $zone = $methodZone;
                    }
                } else {
                    throw new InvalidArgumentException('The selected shipping method is invalid or unavailable for this location.');
                }
            }
        } elseif ($availableMethods->isNotEmpty()) {
            $selectedMethod = $availableMethods->firstWhere('is_default', true) ?? $availableMethods->first();
        }

        if ($selectedMethod) {
            $rate = (float) $selectedMethod->rate;
            $deliveryTime = $selectedMethod->delivery_time ?? ($zone->code === 'outside_dhaka' ? '48-72 hours' : '24-48 hours');
            $methodName = $selectedMethod->name;
            $methodId = $selectedMethod->id;
        } else {
            $rate = (float) $zone->rate;
            $deliveryTime = $zone->delivery_time ?? ($zone->code === 'outside_dhaka' ? '48-72 hours' : '24-48 hours');
            $methodName = $zone->name;
            $methodId = null;
        }

        $methodsArray = $availableMethods->map(fn (ShippingMethod $m) => [
            'id' => $m->id,
            'name' => $m->name,
            'code' => $m->code,
            'rate' => (float) $m->rate,
            'delivery_time' => $m->delivery_time,
            'description' => $m->description,
            'is_default' => (bool) $m->is_default,
        ])->all();

        return new ShippingCalculationResult(
            zone: $zone,
            zoneCode: $zone->code,
            zoneName: $zone->name,
            shippingFee: $rate,
            deliveryTime: $deliveryTime,
            district: $districtModel,
            upazila: $upazilaModel,
            shippingMethod: $selectedMethod,
            shippingMethodId: $methodId,
            shippingMethodName: $methodName,
            availableMethods: $methodsArray
        );
    }

    /**
     * Resolve the active ShippingZone according to documented business rules:
     * 1. Check if upazila has a specific zone override (e.g. Savar & Keraniganj in Dhaka -> sub_dhaka)
     * 2. Check if district has a zone assigned (Dhaka -> inside_dhaka; Gazipur, Narayanganj -> sub_dhaka; others -> outside_dhaka)
     * 3. Fallback to default zone (outside_dhaka).
     */
    public function resolveZone(?District $district, ?Upazila $upazila): ShippingZone
    {
        // 1. Upazila override check
        if ($upazila) {
            if ($upazila->shipping_zone_id && $upazila->shippingZone && $upazila->shippingZone->is_active) {
                return $upazila->shippingZone;
            }

            // Fallback rule: Savar or Keraniganj in Dhaka
            $uName = strtolower(trim($upazila->name));
            if (in_array($uName, ['savar', 'keraniganj'], true)) {
                $subZone = ShippingZone::where('code', 'sub_dhaka')->where('is_active', true)->first();
                if ($subZone) {
                    return $subZone;
                }
            }
        }

        // 2. District zone check
        if ($district) {
            if ($district->shipping_zone_id && $district->shippingZone && $district->shippingZone->is_active) {
                return $district->shippingZone;
            }

            $dName = strtolower(trim($district->name));

            if ($dName === 'dhaka') {
                $insideZone = ShippingZone::where('code', 'inside_dhaka')->where('is_active', true)->first();
                if ($insideZone) {
                    return $insideZone;
                }
            }

            if (in_array($dName, ['gazipur', 'narayanganj'], true)) {
                $subZone = ShippingZone::where('code', 'sub_dhaka')->where('is_active', true)->first();
                if ($subZone) {
                    return $subZone;
                }
            }
        }

        // 3. Default fallback zone (Outside Dhaka)
        $defaultZone = ShippingZone::where('is_default', true)->where('is_active', true)->first();
        if ($defaultZone) {
            return $defaultZone;
        }

        $outsideZone = ShippingZone::where('code', 'outside_dhaka')->first();
        if ($outsideZone) {
            return $outsideZone;
        }

        // 4. In-memory fallback if zones table is empty
        return new ShippingZone([
            'name' => 'Outside Dhaka',
            'code' => 'outside_dhaka',
            'rate' => self::DEFAULT_RATES['outside_dhaka'],
            'delivery_time' => '48-72 hours',
            'is_active' => true,
            'is_default' => true,
        ]);
    }

    /**
     * Resolve a District model from an instance, ID, or name string.
     */
    protected function resolveDistrict(District|string|int $district): ?District
    {
        if ($district instanceof District) {
            return $district;
        }

        if (is_int($district)) {
            return District::find($district);
        }

        $term = trim($district);
        if (empty($term)) {
            return null;
        }

        // Match exact or case-insensitive name or Bengali name
        $dist = District::where('name', $term)
            ->orWhere('bn_name', $term)
            ->orWhereRaw('LOWER(name) = ?', [strtolower($term)])
            ->first();

        if ($dist) {
            return $dist;
        }

        // Zone keyword fallbacks to representative districts:
        $lower = strtolower($term);
        if (str_contains($lower, 'inside') || $lower === 'dhaka') {
            return District::whereRaw('LOWER(name) = ?', ['dhaka'])->first();
        }
        if (str_contains($lower, 'sub') || str_contains($lower, 'suburb') || $lower === 'gazipur') {
            return District::whereRaw('LOWER(name) = ?', ['gazipur'])->first();
        }
        if (str_contains($lower, 'outside') || $lower === 'outside dhaka' || $lower === 'chattogram' || $lower === 'chittagong') {
            return District::whereRaw('LOWER(name) = ?', ['chattogram'])->first()
                ?? District::whereRaw('LOWER(name) = ?', ['chittagong'])->first();
        }

        return null;
    }

    /**
     * Resolve an Upazila model from an instance, ID, or name string.
     */
    protected function resolveUpazila(Upazila|string|int|null $upazila, ?District $district): ?Upazila
    {
        if (! $upazila) {
            return null;
        }

        if ($upazila instanceof Upazila) {
            return $upazila;
        }

        if (is_int($upazila)) {
            return Upazila::find($upazila);
        }

        $term = trim($upazila);
        if (empty($term)) {
            return null;
        }

        $query = Upazila::query();

        if ($district) {
            $query->where('district_id', $district->id);
        }

        return $query->where(function ($q) use ($term) {
            $q->where('name', $term)
                ->orWhere('bn_name', $term)
                ->orWhereRaw('LOWER(name) = ?', [strtolower($term)]);
        })->first();
    }

    /**
     * Retrieve all active shipping zones.
     *
     * @return Collection<int, ShippingZone>
     */
    public function getActiveZones(): Collection
    {
        return ShippingZone::where('is_active', true)->orderBy('id')->get();
    }

    /**
     * Update the customizable rate for a given zone code.
     */
    public function updateZoneRate(string $code, float|string $newRate): ShippingZone
    {
        $zone = ShippingZone::where('code', $code)->firstOrFail();
        $zone->update(['rate' => (float) $newRate]);

        return $zone;
    }
}
