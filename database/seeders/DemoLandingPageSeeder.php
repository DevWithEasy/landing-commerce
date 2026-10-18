<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Catalog\Models\Product;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use Illuminate\Database\Seeder;

class DemoLandingPageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create or retrieve demo product
        $product = Product::firstOrCreate(
            ['slug' => 'titanium-smartwatch-pro'],
            [
                'title' => 'Titanium Smartwatch Pro',
                'regular_price' => 5500.00,
                'sale_price' => 4500.00,
                'description' => 'Military grade titanium smartwatch with AMOLED display, Bluetooth calling, and 7-day battery life.',
                'has_variants' => false,
                'status' => 'active',
            ]
        );

        // 2. Create or retrieve demo landing page
        $landingPage = LandingPage::firstOrCreate(
            ['slug' => 'smartwatch-deal'],
            [
                'product_id' => $product->id,
                'title' => 'Titanium Smartwatch Pro Campaign',
                'is_default' => true,
                'status' => 'published',
                'meta_seo' => [
                    'title' => 'Special Launch - Titanium Smartwatch Pro ৳4,500',
                    'description' => 'Fast cash on delivery across 64 districts of Bangladesh with 1-year official warranty.',
                    'keywords' => 'smartwatch, bangladesh, cod, eid offer',
                ],
            ]
        );

        // 3. Create initial revision if not present
        $revision = LandingPageRevision::firstOrCreate(
            [
                'landing_page_id' => $landingPage->id,
                'revision_number' => 1,
            ],
            [
                'created_by' => null,
                'ast_content' => [
                    'version' => 1,
                    'settings' => [
                        'primaryColor' => '#059669',
                        'fontFamily' => 'Outfit, sans-serif',
                        'backgroundColor' => '#f8fafc',
                    ],
                    'blocks' => [
                        [
                            'id' => 'hero_blk_1',
                            'type' => 'HeroBlock',
                            'props' => [
                                'headline' => 'Next-Gen Titanium Smartwatch Pro',
                                'subheadline' => 'Super AMOLED display, 7-day battery, and Bluetooth calling.',
                                'ctaText' => 'অর্ডার করতে ক্লিক করুন',
                                'ctaTarget' => '#cod-checkout',
                                'badgeText' => 'লিমিটেড স্টক অফার',
                            ],
                            'styles' => [
                                'backgroundColor' => '#0f172a',
                                'paddingTop' => '60px',
                                'paddingBottom' => '60px',
                            ],
                        ],
                        [
                            'id' => 'benefits_blk_1',
                            'type' => 'BenefitsGridBlock',
                            'props' => [
                                'title' => 'কেন আমাদের এই ঘড়িটি বেছে নেবেন?',
                                'columns' => 3,
                                'items' => [
                                    ['icon' => 'ShieldCheck', 'title' => '১ বছরের ওয়ারেন্টি', 'description' => 'অফিসিয়াল রিপ্লেসমেন্ট সুবিধা।'],
                                    ['icon' => 'Truck', 'title' => 'সারা দেশে ক্যাশ অন ডেলিভারি', 'description' => 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।'],
                                    ['icon' => 'BatteryCharging', 'title' => '৭ দিনের ব্যাটারি ব্যাকআপ', 'description' => 'দ্রুত চার্জ ও দীর্ঘস্থায়ী স্থায়িত্ব।'],
                                ],
                            ],
                            'styles' => [
                                'paddingTop' => '40px',
                                'paddingBottom' => '40px',
                            ],
                        ],
                        [
                            'id' => 'checkout_blk_1',
                            'type' => 'CodCheckoutBlock',
                            'props' => [
                                'productId' => $product->id,
                                'title' => 'ক্যাশ অন ডেলিভারিতে অর্ডার করুন',
                                'subtitle' => 'সঠিক নাম, মোবাইল নম্বর ও ঠিকানা দিয়ে অর্ডার নিশ্চিত করুন',
                                'buttonText' => 'অর্ডার সম্পূর্ণ করুন',
                            ],
                            'styles' => [
                                'backgroundColor' => '#ffffff',
                                'paddingTop' => '40px',
                                'paddingBottom' => '40px',
                            ],
                        ],
                    ],
                ],
            ]
        );

        if ($landingPage->published_revision_id === null) {
            $landingPage->update(['published_revision_id' => $revision->id]);
        }
    }
}
