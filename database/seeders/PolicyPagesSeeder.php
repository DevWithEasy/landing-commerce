<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\PageBuilder\Models\PolicyPage;
use Illuminate\Database\Seeder;

class PolicyPagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultPages = [
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy-policy',
                'content' => '<p>আপনার ব্যক্তিগত তথ্যের নিরাপত্তা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ। আমরা আপনার নাম, ঠিকানা ও ফোন নম্বর শুধুমাত্র অর্ডার ডেলিভারির কাজে ব্যবহার করি।</p>',
                'is_published' => true,
            ],
            [
                'title' => 'Terms & Conditions',
                'slug' => 'terms',
                'content' => '<p>আমাদের ওয়েবসাইট ব্যবহারের মাধ্যমে আপনি আমাদের সকল নিয়ম ও শর্তাবলীর সাথে সম্মতি প্রকাশ করছেন। আমরা পণ্যের বিবরণ ও মূল্য যেকোনো সময় পরিবর্তন করার অধিকার সংরক্ষণ করি।</p>',
                'is_published' => true,
            ],
            [
                'title' => 'Return & Refund Policy',
                'slug' => 'refund-policy',
                'content' => '<p>পণ্য গ্রহণের সময় কোনো ত্রুটি দেখা দিলে ডেলিভারি ম্যানের উপস্থিতিতে চেক করে ফেরত দিতে পারবেন অথবা ৭২ ঘণ্টার মধ্যে আমাদের হটলাইনে যোগাযোগ করতে পারবেন।</p>',
                'is_published' => true,
            ],
            [
                'title' => 'About Us',
                'slug' => 'about',
                'content' => '<p>আমরা শতভাগ গুণগত মানসম্পন্ন আসল পণ্য ও দ্রুততম সময়ে সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সেবা প্রদানে অঙ্গীকারবদ্ধ।</p>',
                'is_published' => true,
            ],
            [
                'title' => 'Contact Us',
                'slug' => 'contact',
                'content' => '<p>আমাদের সাথে যোগাযোগ করতে কল করুন আমাদের হটলাইন নম্বরে অথবা হোয়াটসঅ্যাপে বার্তা পাঠান। আমাদের গ্রাহকসেবা দল আপনাকে সহায়তা করতে সদা প্রস্তুত।</p>',
                'is_published' => true,
            ],
        ];

        foreach ($defaultPages as $pageData) {
            PolicyPage::firstOrCreate(
                ['slug' => $pageData['slug']],
                $pageData
            );
        }
    }
}
