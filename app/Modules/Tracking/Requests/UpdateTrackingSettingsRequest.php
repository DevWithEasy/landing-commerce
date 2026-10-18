<?php

declare(strict_types=1);

namespace App\Modules\Tracking\Requests;

use App\Modules\Tracking\Services\TrackingService;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTrackingSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage-settings') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'meta_pixel' => ['nullable', 'array'],
            'meta_pixel.enabled' => ['boolean'],
            'meta_pixel.pixel_id' => [
                'nullable',
                'string',
                'regex:'.TrackingService::META_PIXEL_REGEX,
            ],

            'ga4' => ['nullable', 'array'],
            'ga4.enabled' => ['boolean'],
            'ga4.measurement_id' => [
                'nullable',
                'string',
                'regex:'.TrackingService::GA4_REGEX,
            ],

            'google_ads' => ['nullable', 'array'],
            'google_ads.enabled' => ['boolean'],
            'google_ads.conversion_id' => [
                'nullable',
                'string',
                'regex:'.TrackingService::GOOGLE_ADS_ID_REGEX,
            ],
            'google_ads.conversion_label' => [
                'nullable',
                'string',
                'regex:'.TrackingService::GOOGLE_ADS_LABEL_REGEX,
            ],

            'tiktok_pixel' => ['nullable', 'array'],
            'tiktok_pixel.enabled' => ['boolean'],
            'tiktok_pixel.pixel_id' => [
                'nullable',
                'string',
                'regex:'.TrackingService::TIKTOK_PIXEL_REGEX,
            ],

            'gtm' => ['nullable', 'array'],
            'gtm.enabled' => ['boolean'],
            'gtm.container_id' => [
                'nullable',
                'string',
                'regex:'.TrackingService::GTM_REGEX,
            ],

            'target_mode' => ['nullable', 'string', 'in:all,custom'],
            'target_page_ids' => ['nullable', 'array'],
            'target_page_ids.*' => ['integer'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'meta_pixel.pixel_id.regex' => 'Meta Pixel ID শুধুমাত্র ৮ থেকে ২০ ডিজিটের সংখ্যা হতে হবে (যেমন: 123456789012345)।',
            'ga4.measurement_id.regex' => 'GA4 Measurement ID অবশ্যই "G-" দিয়ে শুরু হতে হবে (যেমন: G-XXXXXXXXXX)।',
            'google_ads.conversion_id.regex' => 'Google Ads Conversion ID ফরম্যাট সঠিক নয় (যেমন: AW-123456789 বা 123456789)।',
            'google_ads.conversion_label.regex' => 'Google Ads Conversion Label ফরম্যাট সঠিক নয়।',
            'tiktok_pixel.pixel_id.regex' => 'TikTok Pixel ID সঠিক নয় (১০ থেকে ২৫ অক্ষরের হতে হবে)।',
            'gtm.container_id.regex' => 'GTM Container ID অবশ্যই "GTM-" দিয়ে শুরু হতে হবে (যেমন: GTM-XXXXXXX)।',
        ];
    }
}
