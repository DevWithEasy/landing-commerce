<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Shipping\Models\ShippingZone;
use Illuminate\Database\Seeder;

class ShippingZoneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $zones = [
            [
                'code' => 'inside_dhaka',
                'name' => 'Inside Dhaka',
                'rate' => 70.00,
                'delivery_time' => '24-48 hours',
                'is_active' => true,
                'is_default' => false,
            ],
            [
                'code' => 'sub_dhaka',
                'name' => 'Dhaka Suburbs (Sub-Dhaka)',
                'rate' => 100.00,
                'delivery_time' => '24-48 hours',
                'is_active' => true,
                'is_default' => false,
            ],
            [
                'code' => 'outside_dhaka',
                'name' => 'Outside Dhaka',
                'rate' => 130.00,
                'delivery_time' => '48-72 hours',
                'is_active' => true,
                'is_default' => true,
            ],
        ];

        foreach ($zones as $zoneData) {
            ShippingZone::updateOrCreate(
                ['code' => $zoneData['code']],
                $zoneData
            );
        }
    }
}
