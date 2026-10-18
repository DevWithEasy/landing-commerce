<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Marketing Pixels & Analytics Defaults
    |--------------------------------------------------------------------------
    |
    | Supported providers:
    | - meta_pixel: Meta (Facebook) Pixel
    | - ga4: Google Analytics 4
    | - google_ads: Google Ads Conversion Tracking
    | - tiktok_pixel: TikTok Pixel
    | - gtm: Google Tag Manager
    |
    */

    'meta_pixel' => [
        'enabled' => env('TRACKING_META_PIXEL_ENABLED', false),
        'pixel_id' => env('TRACKING_META_PIXEL_ID', ''),
    ],

    'ga4' => [
        'enabled' => env('TRACKING_GA4_ENABLED', false),
        'measurement_id' => env('TRACKING_GA4_MEASUREMENT_ID', ''),
    ],

    'google_ads' => [
        'enabled' => env('TRACKING_GOOGLE_ADS_ENABLED', false),
        'conversion_id' => env('TRACKING_GOOGLE_ADS_CONVERSION_ID', ''),
        'conversion_label' => env('TRACKING_GOOGLE_ADS_CONVERSION_LABEL', ''),
    ],

    'tiktok_pixel' => [
        'enabled' => env('TRACKING_TIKTOK_PIXEL_ENABLED', false),
        'pixel_id' => env('TRACKING_TIKTOK_PIXEL_ID', ''),
    ],

    'gtm' => [
        'enabled' => env('TRACKING_GTM_ENABLED', false),
        'container_id' => env('TRACKING_GTM_CONTAINER_ID', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Target Landing Pages Mode
    |--------------------------------------------------------------------------
    |
    | 'all' - Active on all published landing pages
    | 'custom' - Only active on specifically selected landing pages
    |
    */
    'target_mode' => env('TRACKING_TARGET_MODE', 'all'),

    'target_page_ids' => [],
];
