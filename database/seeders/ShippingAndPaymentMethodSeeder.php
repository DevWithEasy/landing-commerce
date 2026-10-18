<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Payments\Models\PaymentMethod;
use App\Modules\Shipping\Models\ShippingMethod;
use App\Modules\Shipping\Models\ShippingZone;
use Illuminate\Database\Seeder;

class ShippingAndPaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Link to zones if present
        $insideZone = ShippingZone::where('code', 'inside_dhaka')->first();
        $subZone = ShippingZone::where('code', 'sub_dhaka')->first();
        $outsideZone = ShippingZone::where('code', 'outside_dhaka')->first();

        // 2. Default Shipping Methods
        $shippingMethods = [
            [
                'name' => 'Inside Dhaka Standard Delivery',
                'code' => 'inside_dhaka_standard',
                'zone_code' => 'inside_dhaka',
                'shipping_zone_id' => $insideZone?->id,
                'rate' => 70.00,
                'delivery_time' => '24-48 hours',
                'description' => 'Regular home delivery within Dhaka City corporation areas.',
                'is_active' => true,
                'is_default' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Inside Dhaka Express (Same Day / 12 Hours)',
                'code' => 'inside_dhaka_express',
                'zone_code' => 'inside_dhaka',
                'shipping_zone_id' => $insideZone?->id,
                'rate' => 120.00,
                'delivery_time' => '12-24 hours',
                'description' => 'Priority same day rush delivery inside Dhaka.',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 2,
            ],
            [
                'name' => 'Dhaka Suburbs (Sub-Dhaka) Delivery',
                'code' => 'sub_dhaka_standard',
                'zone_code' => 'sub_dhaka',
                'shipping_zone_id' => $subZone?->id,
                'rate' => 100.00,
                'delivery_time' => '24-48 hours',
                'description' => 'Home delivery in Gazipur, Narayanganj, Savar, and Keraniganj.',
                'is_active' => true,
                'is_default' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Outside Dhaka Delivery',
                'code' => 'outside_dhaka_standard',
                'zone_code' => 'outside_dhaka',
                'shipping_zone_id' => $outsideZone?->id,
                'rate' => 130.00,
                'delivery_time' => '48-72 hours',
                'description' => 'Courier home delivery across all other 61 districts in Bangladesh.',
                'is_active' => true,
                'is_default' => true,
                'sort_order' => 1,
            ],
        ];

        foreach ($shippingMethods as $method) {
            ShippingMethod::firstOrCreate(
                ['code' => $method['code']],
                $method
            );
        }

        // 3. Default Payment Methods
        $paymentMethods = [
            [
                'name' => 'Cash on Delivery (ক্যাশ অন ডেলিভারি)',
                'code' => 'cod',
                'description' => 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন (Pay with cash upon delivery)',
                'instructions' => 'ডেলিভারি ম্যানের কাছ থেকে পার্সেল বুঝে নিয়ে সম্পূর্ণ মূল্য নগদে পরিশোধ করুন।',
                'account_number' => null,
                'is_active' => true,
                'is_online' => false,
                'requires_transaction_id' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'bKash (বিকাশ ম্যানুয়াল)',
                'code' => 'bkash',
                'description' => 'বিকাশ পার্সোনাল নাম্বারে সেন্ড মানি করুন',
                'instructions' => 'আমাদের বিকাশ পার্সোনাল নাম্বারে মোট টাকা সেন্ড মানি করে নিচের বক্সে আপনার TrxID লিখুন।',
                'account_number' => '01700000000',
                'is_active' => false,
                'is_online' => false,
                'requires_transaction_id' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Nagad (নগদ ম্যানুয়াল)',
                'code' => 'nagad',
                'description' => 'নগদ নাম্বারে টাকা পাঠিয়ে ট্রানজেকশন আইডি দিন',
                'instructions' => 'আমাদের নগদ একাউন্টে টাকা পাঠিয়ে প্রাপ্ত TrxID নিচে লিখুন।',
                'account_number' => '01700000000',
                'is_active' => false,
                'is_online' => false,
                'requires_transaction_id' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Rocket (রকেট ম্যানুয়াল)',
                'code' => 'rocket',
                'description' => 'রকেট একাউন্টে টাকা পাঠান',
                'instructions' => 'রকেট নাম্বারে টাকা পাঠিয়ে TrxID লিখুন।',
                'account_number' => '01700000000',
                'is_active' => false,
                'is_online' => false,
                'requires_transaction_id' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($paymentMethods as $payment) {
            PaymentMethod::firstOrCreate(
                ['code' => $payment['code']],
                $payment
            );
        }
    }
}
