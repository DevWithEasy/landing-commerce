<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Shipping\Models\District;
use App\Modules\Shipping\Models\ShippingZone;
use App\Modules\Shipping\Models\Upazila;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class BangladeshGeographicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(ShippingZoneSeeder::class);

        $insideDhakaZone = ShippingZone::where('code', 'inside_dhaka')->first();
        $subDhakaZone = ShippingZone::where('code', 'sub_dhaka')->first();
        $outsideDhakaZone = ShippingZone::where('code', 'outside_dhaka')->first();

        $districtsPath = database_path('data/districts.json');
        $upazilasPath = database_path('data/upazilas.json');

        if (! file_exists($districtsPath) || ! file_exists($upazilasPath)) {
            throw new RuntimeException('Bangladesh geographic data files are missing in database/data.');
        }

        /** @var array<int, array{id: string|int, name: string, bn_name?: string, lat?: string, lon?: string}> $districtsData */
        $districtsData = json_decode((string) file_get_contents($districtsPath), true);

        /** @var array<int, array{id: string|int, district_id: string|int, name: string, bn_name?: string}> $upazilasData */
        $upazilasData = json_decode((string) file_get_contents($upazilasPath), true);

        // Map original json IDs to District models
        DB::transaction(function () use ($districtsData, $upazilasData, $insideDhakaZone, $subDhakaZone, $outsideDhakaZone) {
            $districtMap = [];

            foreach ($districtsData as $d) {
                $name = trim($d['name']);

                // Zone mapping rule for districts:
                // Dhaka -> Inside Dhaka
                // Gazipur, Narayanganj -> Sub-Dhaka
                // All other districts -> Outside Dhaka
                $zoneId = match (strtolower($name)) {
                    'dhaka' => $insideDhakaZone?->id,
                    'gazipur', 'narayanganj' => $subDhakaZone?->id,
                    default => $outsideDhakaZone?->id,
                };

                $district = District::updateOrCreate(
                    ['name' => $name],
                    [
                        'bn_name' => $d['bn_name'] ?? null,
                        'lat' => $d['lat'] ?? null,
                        'lon' => $d['lon'] ?? null,
                        'shipping_zone_id' => $zoneId,
                    ]
                );

                $districtMap[(string) $d['id']] = $district;
            }

            foreach ($upazilasData as $u) {
                $origDistrictId = (string) $u['district_id'];
                if (! isset($districtMap[$origDistrictId])) {
                    continue;
                }

                $district = $districtMap[$origDistrictId];
                $uName = trim($u['name']);

                // Zone override for specific upazilas:
                // Savar and Keraniganj in Dhaka district belong to Sub-Dhaka zone
                $upazilaZoneId = null;
                if (strtolower($district->name) === 'dhaka' && in_array(strtolower($uName), ['savar', 'keraniganj'], true)) {
                    $upazilaZoneId = $subDhakaZone?->id;
                }

                Upazila::updateOrCreate(
                    [
                        'district_id' => $district->id,
                        'name' => $uName,
                    ],
                    [
                        'bn_name' => $u['bn_name'] ?? null,
                        'shipping_zone_id' => $upazilaZoneId,
                    ]
                );
            }
        });
    }
}
