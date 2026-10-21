<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PolicyPage extends Model
{
    use HasFactory;

    /**
     * Slugs that are linked from the storefront header and footer.
     *
     * @var list<string>
     */
    public const PROTECTED_SLUGS = [
        'about',
        'contact',
        'privacy-policy',
        'terms',
        'refund-policy',
    ];

    protected $fillable = [
        'title',
        'slug',
        'content',
        'meta_seo',
        'is_published',
        'is_protected',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'is_protected' => 'boolean',
            'meta_seo' => 'array',
        ];
    }

    /**
     * Determine whether the page is required by storefront navigation.
     */
    public function isProtected(): bool
    {
        return $this->is_protected || in_array($this->slug, self::PROTECTED_SLUGS, true);
    }

    /**
     * Scope only published policy pages.
     *
     * @param  Builder<PolicyPage>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('is_published', true);
    }

    /**
     * Canonical default pages required by the storefront header and footer.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function defaultPages(): array
    {
        return [
            [
                'title' => 'আমাদের সম্পর্কে',
                'slug' => 'about',
                'content' => '<p>আমরা গ্রাহকদের জন্য মানসম্পন্ন পণ্য, নিরাপদ ক্যাশ অন ডেলিভারি এবং আন্তরিক গ্রাহকসেবা নিশ্চিত করতে প্রতিশ্রুতিবদ্ধ। আমাদের লক্ষ্য হলো সারা দেশে দ্রুত ও নির্ভরযোগ্য ডেলিভারির মাধ্যমে সেরা কেনাকাটার অভিজ্ঞতা প্রদান করা।</p><p>কোনো প্রশ্ন, পরামর্শ বা সহায়তা প্রয়োজন হলে আমাদের সাথে যোগাযোগ করুন।</p>',
                'is_published' => true,
                'is_protected' => true,
            ],
            [
                'title' => 'যোগাযোগ',
                'slug' => 'contact',
                'content' => '<p>আমাদের সাথে যোগাযোগ করতে আপনি নিচের মাধ্যমগুলো ব্যবহার করতে পারেন। আমাদের গ্রাহকসেবা দল আপনার প্রশ্নের উত্তর দিতে সর্বদা প্রস্তুত।</p><ul><li>হটলাইন: ওয়েবসাইটে উল্লেখিত নম্বরে কল করুন</li><li>ইমেইল: ওয়েবসাইটে উল্লেখিত ইমেইল ঠিকানায় মেসেজ পাঠান</li><li>অফিস সময়: প্রতিদিন সকাল ৯টা থেকে রাত ১১টা</li></ul>',
                'is_published' => true,
                'is_protected' => true,
            ],
            [
                'title' => 'গোপনীয়তা নীতি',
                'slug' => 'privacy-policy',
                'content' => '<p>আপনার ব্যক্তিগত তথ্যের গোপনীয়তা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ। অর্ডার প্রক্রিয়াকরণ, ডেলিভারি এবং গ্রাহকসেবা প্রদানের জন্য আমরা প্রয়োজনীয় তথ্য সংগ্রহ করি।</p><p>আমরা আপনার তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি করি না। আইনগত বাধ্যবাধকতা বা ডেলিভারি সম্পন্ন করার প্রয়োজনে শুধুমাত্র সংশ্লিষ্ট সেবা প্রদানকারীর সাথে তথ্য শেয়ার করা হতে পারে।</p>',
                'is_published' => true,
                'is_protected' => true,
            ],
            [
                'title' => 'ব্যবহারের শর্তাবলী',
                'slug' => 'terms',
                'content' => '<p>আমাদের ওয়েবসাইট ব্যবহার করে অর্ডার করার মাধ্যমে আপনি আমাদের ব্যবহারের শর্তাবলী মেনে নিচ্ছেন। পণ্যের মূল্য, স্টক, ডেলিভারি সময় এবং অন্যান্য তথ্য সময়ে সময়ে পরিবর্তিত হতে পারে।</p><p>ভুল মূল্য, অসঙ্গত তথ্য বা স্টক না থাকার কারণে আমরা যেকোনো অর্ডার বাতিল বা সংশোধনের অধিকার সংরক্ষণ করি।</p>',
                'is_published' => true,
                'is_protected' => true,
            ],
            [
                'title' => 'রিটার্ন ও রিফান্ড নীতি',
                'slug' => 'refund-policy',
                'content' => '<p>পণ্য গ্রহণের সময় প্যাকেজ খুলে যাচাই করার অনুমতি রয়েছে। পণ্যে উল্লেখযোগ্য ত্রুটি বা ভুল পণ্য পাওয়া গেলে নির্ধারিত সময়ের মধ্যে আমাদের গ্রাহকসেবা দলে যোগাযোগ করুন।</p><p>রিটার্ন অনুমোদনের জন্য পণ্য অব্যবহৃত, অক্ষত এবং মূল প্যাকেজসহ থাকতে হবে। রিফান্ড সাধারণত পণ্য ফেরত পাওয়ার ও যাচাইয়ের পর প্রক্রিয়া করা হয়।</p>',
                'is_published' => true,
                'is_protected' => true,
            ],
        ];
    }
}
