<?php

declare(strict_types=1);

namespace App\Modules\Tracking\Services;

use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\Settings\Services\SettingsService;
use InvalidArgumentException;

class TrackingService
{
    public const META_PIXEL_REGEX = '/^[0-9]{8,20}$/';

    public const META_TEST_EVENT_CODE_REGEX = '/^[A-Za-z0-9_-]{3,50}$/';

    public const GA4_REGEX = '/^G-[A-Z0-9]{4,15}$/i';

    public const GOOGLE_ADS_ID_REGEX = '/^(AW-)?[0-9]{6,15}$/i';

    public const GOOGLE_ADS_LABEL_REGEX = '/^[A-Za-z0-9_-]{6,35}$/';

    public const TIKTOK_PIXEL_REGEX = '/^[A-Z0-9]{10,25}$/i';

    public const GTM_REGEX = '/^GTM-[A-Z0-9]{4,15}$/i';

    public function __construct(
        protected SettingsService $settingsService
    ) {}

    /**
     * Get the active global tracking settings.
     *
     * @return array<string, mixed>
     */
    public function getGlobalSettings(): array
    {
        $rawTargetPages = $this->settingsService->get('tracking.target_page_ids');
        if (is_string($rawTargetPages)) {
            $targetPages = json_decode($rawTargetPages, true) ?: [];
        } elseif (is_array($rawTargetPages)) {
            $targetPages = $rawTargetPages;
        } else {
            $targetPages = config('tracking.target_page_ids', []);
        }

        return [
            'meta_pixel' => [
                'enabled' => filter_var($this->settingsService->get('tracking.meta_pixel.enabled', config('tracking.meta_pixel.enabled', false)), FILTER_VALIDATE_BOOLEAN),
                'pixel_id' => (string) $this->settingsService->get('tracking.meta_pixel.pixel_id', config('tracking.meta_pixel.pixel_id', '')),
                'access_token' => (string) $this->settingsService->get('tracking.meta_pixel.access_token', config('tracking.meta_pixel.access_token', '')),
                'test_event_code' => (string) $this->settingsService->get('tracking.meta_pixel.test_event_code', config('tracking.meta_pixel.test_event_code', '')),
            ],
            'ga4' => [
                'enabled' => filter_var($this->settingsService->get('tracking.ga4.enabled', config('tracking.ga4.enabled', false)), FILTER_VALIDATE_BOOLEAN),
                'measurement_id' => (string) $this->settingsService->get('tracking.ga4.measurement_id', config('tracking.ga4.measurement_id', '')),
            ],
            'google_ads' => [
                'enabled' => filter_var($this->settingsService->get('tracking.google_ads.enabled', config('tracking.google_ads.enabled', false)), FILTER_VALIDATE_BOOLEAN),
                'conversion_id' => (string) $this->settingsService->get('tracking.google_ads.conversion_id', config('tracking.google_ads.conversion_id', '')),
                'conversion_label' => (string) $this->settingsService->get('tracking.google_ads.conversion_label', config('tracking.google_ads.conversion_label', '')),
            ],
            'tiktok_pixel' => [
                'enabled' => filter_var($this->settingsService->get('tracking.tiktok_pixel.enabled', config('tracking.tiktok_pixel.enabled', false)), FILTER_VALIDATE_BOOLEAN),
                'pixel_id' => (string) $this->settingsService->get('tracking.tiktok_pixel.pixel_id', config('tracking.tiktok_pixel.pixel_id', '')),
            ],
            'gtm' => [
                'enabled' => filter_var($this->settingsService->get('tracking.gtm.enabled', config('tracking.gtm.enabled', false)), FILTER_VALIDATE_BOOLEAN),
                'container_id' => (string) $this->settingsService->get('tracking.gtm.container_id', config('tracking.gtm.container_id', '')),
            ],
            'target_mode' => (string) $this->settingsService->get('tracking.target_mode', config('tracking.target_mode', 'all')),
            'target_page_ids' => array_values(array_map('intval', (array) $targetPages)),
        ];
    }

    /**
     * Update global tracking settings in the database.
     *
     * @param  array<string, mixed>  $input
     */
    public function updateGlobalSettings(array $input): void
    {
        $errors = $this->validateConfiguration($input);
        if (! empty($errors)) {
            $firstField = array_key_first($errors);
            throw new InvalidArgumentException($errors[$firstField]);
        }

        $this->settingsService->set('tracking.meta_pixel.enabled', ! empty($input['meta_pixel']['enabled']) ? '1' : '0', 'tracking');
        $this->settingsService->set('tracking.meta_pixel.pixel_id', trim((string) ($input['meta_pixel']['pixel_id'] ?? '')), 'tracking');

        $metaToken = trim((string) ($input['meta_pixel']['access_token'] ?? ''));
        if ($metaToken !== '' && $metaToken !== SettingsService::SECRET_MASK && ! str_starts_with($metaToken, '••••')) {
            $this->settingsService->set('tracking.meta_pixel.access_token', $metaToken, 'tracking', true);
        }

        $this->settingsService->set('tracking.meta_pixel.test_event_code', trim((string) ($input['meta_pixel']['test_event_code'] ?? '')), 'tracking');

        $this->settingsService->set('tracking.ga4.enabled', ! empty($input['ga4']['enabled']) ? '1' : '0', 'tracking');
        $this->settingsService->set('tracking.ga4.measurement_id', strtoupper(trim((string) ($input['ga4']['measurement_id'] ?? ''))), 'tracking');

        $this->settingsService->set('tracking.google_ads.enabled', ! empty($input['google_ads']['enabled']) ? '1' : '0', 'tracking');
        $this->settingsService->set('tracking.google_ads.conversion_id', trim((string) ($input['google_ads']['conversion_id'] ?? '')), 'tracking');
        $this->settingsService->set('tracking.google_ads.conversion_label', trim((string) ($input['google_ads']['conversion_label'] ?? '')), 'tracking');

        $this->settingsService->set('tracking.tiktok_pixel.enabled', ! empty($input['tiktok_pixel']['enabled']) ? '1' : '0', 'tracking');
        $this->settingsService->set('tracking.tiktok_pixel.pixel_id', trim((string) ($input['tiktok_pixel']['pixel_id'] ?? '')), 'tracking');

        $this->settingsService->set('tracking.gtm.enabled', ! empty($input['gtm']['enabled']) ? '1' : '0', 'tracking');
        $this->settingsService->set('tracking.gtm.container_id', strtoupper(trim((string) ($input['gtm']['container_id'] ?? ''))), 'tracking');

        $this->settingsService->set('tracking.target_mode', (string) ($input['target_mode'] ?? 'all'), 'tracking');
        $targetPageIds = array_values(array_map('intval', (array) ($input['target_page_ids'] ?? [])));
        $this->settingsService->set('tracking.target_page_ids', json_encode($targetPageIds), 'tracking');
    }

    /**
     * Validate tracking configuration fields and format.
     *
     * @param  array<string, mixed>  $settings
     * @return array<string, string> Validation error messages keyed by field
     */
    public function validateConfiguration(array $settings): array
    {
        $errors = [];

        // Meta Pixel Validation
        if (! empty($settings['meta_pixel']['enabled'])) {
            $pixelId = trim((string) ($settings['meta_pixel']['pixel_id'] ?? ''));
            if ($pixelId === '') {
                $errors['meta_pixel.pixel_id'] = 'Meta (Facebook) Pixel চালু রাখতে Pixel ID প্রদান করা আবশ্যক।';
            } elseif (! preg_match(self::META_PIXEL_REGEX, $pixelId)) {
                $errors['meta_pixel.pixel_id'] = 'Meta Pixel ID শুধুমাত্র ৮ থেকে ২০ ডিজিটের সংখ্যা হতে হবে (যেমন: 123456789012345)।';
            }

            $testCode = trim((string) ($settings['meta_pixel']['test_event_code'] ?? ''));
            if ($testCode !== '' && ! preg_match(self::META_TEST_EVENT_CODE_REGEX, $testCode)) {
                $errors['meta_pixel.test_event_code'] = 'Meta Test Event Code ফরম্যাট সঠিক নয় (যেমন: TEST12345)।';
            }
        }

        // GA4 Validation
        if (! empty($settings['ga4']['enabled'])) {
            $mId = trim((string) ($settings['ga4']['measurement_id'] ?? ''));
            if ($mId === '') {
                $errors['ga4.measurement_id'] = 'Google Analytics 4 চালু রাখতে Measurement ID প্রদান করা আবশ্যক।';
            } elseif (! preg_match(self::GA4_REGEX, $mId)) {
                $errors['ga4.measurement_id'] = 'GA4 Measurement ID অবশ্যই "G-" দিয়ে শুরু হতে হবে (যেমন: G-XXXXXXXXXX)।';
            }
        }

        // Google Ads Validation
        if (! empty($settings['google_ads']['enabled'])) {
            $cId = trim((string) ($settings['google_ads']['conversion_id'] ?? ''));
            $cLabel = trim((string) ($settings['google_ads']['conversion_label'] ?? ''));

            if ($cId === '') {
                $errors['google_ads.conversion_id'] = 'Google Ads Conversion Tracking-এর জন্য Conversion ID প্রদান করা আবশ্যক।';
            } elseif (! preg_match(self::GOOGLE_ADS_ID_REGEX, $cId)) {
                $errors['google_ads.conversion_id'] = 'Google Ads Conversion ID সঠিক নয় (যেমন: AW-123456789 বা 123456789)।';
            }

            if ($cLabel !== '' && ! preg_match(self::GOOGLE_ADS_LABEL_REGEX, $cLabel)) {
                $errors['google_ads.conversion_label'] = 'Google Ads Conversion Label ফরম্যাট সঠিক নয় (অক্ষর ও সংখ্যার সমন্বয়ে হতে হবে)।';
            }
        }

        // TikTok Pixel Validation
        if (! empty($settings['tiktok_pixel']['enabled'])) {
            $ttId = trim((string) ($settings['tiktok_pixel']['pixel_id'] ?? ''));
            if ($ttId === '') {
                $errors['tiktok_pixel.pixel_id'] = 'TikTok Pixel চালু রাখতে Pixel ID প্রদান করা আবশ্যক।';
            } elseif (! preg_match(self::TIKTOK_PIXEL_REGEX, $ttId)) {
                $errors['tiktok_pixel.pixel_id'] = 'TikTok Pixel ID সঠিক নয় (১০ থেকে ২৫ অক্ষরের আলফানিউমেরিক আইডি হতে হবে)।';
            }
        }

        // GTM Validation
        if (! empty($settings['gtm']['enabled'])) {
            $gtmId = trim((string) ($settings['gtm']['container_id'] ?? ''));
            if ($gtmId === '') {
                $errors['gtm.container_id'] = 'Google Tag Manager চালু রাখতে Container ID প্রদান করা আবশ্যক।';
            } elseif (! preg_match(self::GTM_REGEX, $gtmId)) {
                $errors['gtm.container_id'] = 'GTM Container ID অবশ্যই "GTM-" দিয়ে শুরু হতে হবে (যেমন: GTM-XXXXXXX)।';
            }
        }

        return $errors;
    }

    /**
     * Resolve active tracking settings for a specific landing page or global checkout.
     * Enforces that draft pages NEVER render tracking scripts.
     *
     * @return array<string, mixed>
     */
    public function getResolvedSettings(?LandingPage $landingPage = null): array
    {
        $global = $this->getGlobalSettings();

        // 1. If landing page is in draft or archived, public tracking is STRICTLY disabled.
        if ($landingPage !== null && $landingPage->status !== 'published') {
            return $this->buildDisabledSettings();
        }

        // 2. Check for page-specific override
        if ($landingPage !== null && ! empty($landingPage->tracking_settings)) {
            $pageSettings = $landingPage->tracking_settings;
            if (! empty($pageSettings['override_global'])) {
                // Return page-specific override
                return [
                    'meta_pixel' => [
                        'enabled' => ! empty($pageSettings['meta_pixel']['enabled']) && preg_match(self::META_PIXEL_REGEX, (string) ($pageSettings['meta_pixel']['pixel_id'] ?? '')),
                        'pixel_id' => (string) ($pageSettings['meta_pixel']['pixel_id'] ?? ''),
                        'test_event_code' => (string) ($pageSettings['meta_pixel']['test_event_code'] ?? ''),
                    ],
                    'ga4' => [
                        'enabled' => ! empty($pageSettings['ga4']['enabled']) && preg_match(self::GA4_REGEX, (string) ($pageSettings['ga4']['measurement_id'] ?? '')),
                        'measurement_id' => strtoupper((string) ($pageSettings['ga4']['measurement_id'] ?? '')),
                    ],
                    'google_ads' => [
                        'enabled' => ! empty($pageSettings['google_ads']['enabled']) && preg_match(self::GOOGLE_ADS_ID_REGEX, (string) ($pageSettings['google_ads']['conversion_id'] ?? '')),
                        'conversion_id' => (string) ($pageSettings['google_ads']['conversion_id'] ?? ''),
                        'conversion_label' => (string) ($pageSettings['google_ads']['conversion_label'] ?? ''),
                    ],
                    'tiktok_pixel' => [
                        'enabled' => ! empty($pageSettings['tiktok_pixel']['enabled']) && preg_match(self::TIKTOK_PIXEL_REGEX, (string) ($pageSettings['tiktok_pixel']['pixel_id'] ?? '')),
                        'pixel_id' => (string) ($pageSettings['tiktok_pixel']['pixel_id'] ?? ''),
                    ],
                    'gtm' => [
                        'enabled' => ! empty($pageSettings['gtm']['enabled']) && preg_match(self::GTM_REGEX, (string) ($pageSettings['gtm']['container_id'] ?? '')),
                        'container_id' => strtoupper((string) ($pageSettings['gtm']['container_id'] ?? '')),
                    ],
                ];
            }
        }

        // 3. Target mode filtering (when landing page is provided)
        if ($landingPage !== null && ($global['target_mode'] ?? 'all') === 'custom') {
            $allowedIds = array_map('intval', (array) ($global['target_page_ids'] ?? []));
            if (! in_array((int) $landingPage->id, $allowedIds, true)) {
                return $this->buildDisabledSettings();
            }
        }

        // 4. Return validated global settings
        return [
            'meta_pixel' => [
                'enabled' => $global['meta_pixel']['enabled'] && preg_match(self::META_PIXEL_REGEX, (string) $global['meta_pixel']['pixel_id']),
                'pixel_id' => (string) $global['meta_pixel']['pixel_id'],
                'test_event_code' => (string) ($global['meta_pixel']['test_event_code'] ?? ''),
            ],
            'ga4' => [
                'enabled' => $global['ga4']['enabled'] && preg_match(self::GA4_REGEX, (string) $global['ga4']['measurement_id']),
                'measurement_id' => strtoupper((string) $global['ga4']['measurement_id']),
            ],
            'google_ads' => [
                'enabled' => $global['google_ads']['enabled'] && preg_match(self::GOOGLE_ADS_ID_REGEX, (string) $global['google_ads']['conversion_id']),
                'conversion_id' => (string) $global['google_ads']['conversion_id'],
                'conversion_label' => (string) $global['google_ads']['conversion_label'],
            ],
            'tiktok_pixel' => [
                'enabled' => $global['tiktok_pixel']['enabled'] && preg_match(self::TIKTOK_PIXEL_REGEX, (string) $global['tiktok_pixel']['pixel_id']),
                'pixel_id' => (string) $global['tiktok_pixel']['pixel_id'],
            ],
            'gtm' => [
                'enabled' => $global['gtm']['enabled'] && preg_match(self::GTM_REGEX, (string) $global['gtm']['container_id']),
                'container_id' => strtoupper((string) $global['gtm']['container_id']),
            ],
        ];
    }

    /**
     * Render secure, XSS-sanitized head scripts for all enabled tracking providers.
     *
     * @param  array<string, mixed>  $resolved
     * @param  array<string, mixed>  $context
     */
    public function renderHeadScripts(array $resolved, array $context = []): string
    {
        $html = '';

        // Google Tag Manager (GTM)
        if (! empty($resolved['gtm']['enabled']) && ! empty($resolved['gtm']['container_id'])) {
            $gtmId = htmlspecialchars($resolved['gtm']['container_id'], ENT_QUOTES, 'UTF-8');
            $html .= "<!-- Google Tag Manager -->\n";
            $html .= "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n";
            $html .= "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n";
            $html .= "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n";
            $html .= "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n";
            $html .= "})(window,document,'script','dataLayer','{$gtmId}');</script>\n";
            $html .= "<!-- End Google Tag Manager -->\n";
        }

        // Google Analytics 4 (GA4) & Google Ads (Shared gtag.js)
        $hasGa4 = ! empty($resolved['ga4']['enabled']) && ! empty($resolved['ga4']['measurement_id']);
        $hasGads = ! empty($resolved['google_ads']['enabled']) && ! empty($resolved['google_ads']['conversion_id']);

        if ($hasGa4 || $hasGads) {
            $primaryId = $hasGa4
                ? htmlspecialchars($resolved['ga4']['measurement_id'], ENT_QUOTES, 'UTF-8')
                : htmlspecialchars($resolved['google_ads']['conversion_id'], ENT_QUOTES, 'UTF-8');

            $html .= "<!-- Google tag (gtag.js) -->\n";
            $html .= "<script async src=\"https://www.googletagmanager.com/gtag/js?id={$primaryId}\"></script>\n";
            $html .= "<script>\n";
            $html .= "  window.dataLayer = window.dataLayer || [];\n";
            $html .= "  function gtag(){dataLayer.push(arguments);}\n";
            $html .= "  gtag('js', new Date());\n";

            if ($hasGa4) {
                $ga4Id = htmlspecialchars($resolved['ga4']['measurement_id'], ENT_QUOTES, 'UTF-8');
                $html .= "  gtag('config', '{$ga4Id}', { send_page_view: true });\n";
            }

            if ($hasGads) {
                $rawGadsId = $resolved['google_ads']['conversion_id'];
                $formattedGadsId = str_starts_with($rawGadsId, 'AW-') ? $rawGadsId : 'AW-'.$rawGadsId;
                $gadsId = htmlspecialchars($formattedGadsId, ENT_QUOTES, 'UTF-8');
                $html .= "  gtag('config', '{$gadsId}');\n";
            }

            $html .= "</script>\n";
        }

        // Meta (Facebook) Pixel
        if (! empty($resolved['meta_pixel']['enabled']) && ! empty($resolved['meta_pixel']['pixel_id'])) {
            $fbId = htmlspecialchars($resolved['meta_pixel']['pixel_id'], ENT_QUOTES, 'UTF-8');
            $testEventCode = ! empty($resolved['meta_pixel']['test_event_code'])
                ? htmlspecialchars($resolved['meta_pixel']['test_event_code'], ENT_QUOTES, 'UTF-8')
                : '';

            $html .= "<!-- Meta Pixel Code -->\n";
            $html .= "<script>\n";
            $html .= "!function(f,b,e,v,n,t,s)\n";
            $html .= "{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n";
            $html .= "n.callMethod.apply(n,arguments):n.queue.push(arguments)};\n";
            $html .= "if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\n";
            $html .= "n.queue=[];t=b.createElement(e);t.async=!0;\n";
            $html .= "t.src=v;s=b.getElementsByTagName(e)[0];\n";
            $html .= "s.parentNode.insertBefore(t,s)}(window, document,'script',\n";
            $html .= "'https://connect.facebook.net/en_US/fbevents.js');\n";
            $html .= "fbq('init', '{$fbId}');\n";
            if ($testEventCode !== '') {
                $html .= "window._lcMetaTestEventCode = '{$testEventCode}';\n";
                $html .= "fbq('track', 'PageView', {}, { test_event_code: '{$testEventCode}' });\n";
            } else {
                $html .= "fbq('track', 'PageView');\n";
            }
            $html .= "</script>\n";
            $html .= "<!-- End Meta Pixel Code -->\n";
        }

        // TikTok Pixel
        if (! empty($resolved['tiktok_pixel']['enabled']) && ! empty($resolved['tiktok_pixel']['pixel_id'])) {
            $ttId = htmlspecialchars($resolved['tiktok_pixel']['pixel_id'], ENT_QUOTES, 'UTF-8');
            $html .= "<!-- TikTok Pixel Code -->\n";
            $html .= "<script>\n";
            $html .= "!function (w, d, t) {\n";
            $html .= "  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=[\"page\",\"track\",\"identify\",\"instances\",\"debug\",\"on\",\"off\",\"once\",\"ready\",\"alias\",\"group\",\"enableCookie\",\"disableCookie\"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};\n";
            $html .= "  ttq.load=function(e,n){var i=\"https://analytics.tiktok.com/i18n/pixel/events.js\";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement(\"script\");o.type=\"text/javascript\",o.async=!0,o.src=i+\"?sdkid=\"+e+\"&lib=\"+t;var a=document.getElementsByTagName(\"script\")[0];a.parentNode.insertBefore(o,a)};\n";
            $html .= "  ttq.load('{$ttId}');\n";
            $html .= "  ttq.page();\n";
            $html .= "}(window, document, 'ttq');\n";
            $html .= "</script>\n";
            $html .= "<!-- End TikTok Pixel Code -->\n";
        }

        // Contextual Events (ViewContent on Product / Landing Page)
        if (($context['event'] ?? '') === 'ViewContent' && ! empty($context['product'])) {
            $p = $context['product'];
            $price = (float) ($p['sale_price'] ?? $p['regular_price'] ?? 0);
            $pId = (string) ($p['id'] ?? '');
            $pTitle = addslashes((string) ($p['title'] ?? 'Product'));

            $html .= "<!-- ViewContent Standard Event -->\n";
            $html .= "<script>\n";
            if (! empty($resolved['meta_pixel']['enabled'])) {
                $metaEventOpts = ! empty($resolved['meta_pixel']['test_event_code'])
                    ? ", { test_event_code: '".htmlspecialchars($resolved['meta_pixel']['test_event_code'], ENT_QUOTES, 'UTF-8')."' }"
                    : '';
                $html .= "  if (typeof fbq === 'function') {\n";
                $html .= "    fbq('track', 'ViewContent', {\n";
                $html .= "      content_name: '{$pTitle}',\n";
                $html .= "      content_ids: ['{$pId}'],\n";
                $html .= "      content_type: 'product',\n";
                $html .= "      value: {$price},\n";
                $html .= "      currency: 'BDT'\n";
                $html .= "    }{$metaEventOpts});\n";
                $html .= "  }\n";
            }
            if ($hasGa4) {
                $html .= "  if (typeof gtag === 'function') {\n";
                $html .= "    gtag('event', 'view_item', {\n";
                $html .= "      currency: 'BDT',\n";
                $html .= "      value: {$price},\n";
                $html .= "      items: [{ item_id: '{$pId}', item_name: '{$pTitle}', price: {$price} }]\n";
                $html .= "    });\n";
                $html .= "  }\n";
            }
            if (! empty($resolved['tiktok_pixel']['enabled'])) {
                $html .= "  if (typeof ttq === 'object' && typeof ttq.track === 'function') {\n";
                $html .= "    ttq.track('ViewContent', {\n";
                $html .= "      content_id: '{$pId}',\n";
                $html .= "      content_name: '{$pTitle}',\n";
                $html .= "      content_type: 'product',\n";
                $html .= "      value: {$price},\n";
                $html .= "      currency: 'BDT'\n";
                $html .= "    });\n";
                $html .= "  }\n";
            }
            $html .= "</script>\n";
        }

        return $html;
    }

    /**
     * Render noscript fallbacks for the body tag.
     *
     * @param  array<string, mixed>  $resolved
     */
    public function renderBodyScripts(array $resolved): string
    {
        $html = '';

        // Google Tag Manager Noscript
        if (! empty($resolved['gtm']['enabled']) && ! empty($resolved['gtm']['container_id'])) {
            $gtmId = htmlspecialchars($resolved['gtm']['container_id'], ENT_QUOTES, 'UTF-8');
            $html .= "<!-- Google Tag Manager (noscript) -->\n";
            $html .= "<noscript><iframe src=\"https://www.googletagmanager.com/ns.html?id={$gtmId}\"\n";
            $html .= "height=\"0\" width=\"0\" style=\"display:none;visibility:hidden\"></iframe></noscript>\n";
            $html .= "<!-- End Google Tag Manager (noscript) -->\n";
        }

        // Meta Pixel Noscript
        if (! empty($resolved['meta_pixel']['enabled']) && ! empty($resolved['meta_pixel']['pixel_id'])) {
            $fbId = htmlspecialchars($resolved['meta_pixel']['pixel_id'], ENT_QUOTES, 'UTF-8');
            $html .= "<!-- Meta Pixel (noscript) -->\n";
            $html .= "<noscript><img height=\"1\" width=\"1\" style=\"display:none\"\n";
            $html .= "src=\"https://www.facebook.com/tr?id={$fbId}&ev=PageView&noscript=1\"/></noscript>\n";
            $html .= "<!-- End Meta Pixel (noscript) -->\n";
        }

        return $html;
    }

    /**
     * Helper to return an all-disabled settings structure.
     *
     * @return array<string, mixed>
     */
    protected function buildDisabledSettings(): array
    {
        return [
            'meta_pixel' => ['enabled' => false, 'pixel_id' => ''],
            'ga4' => ['enabled' => false, 'measurement_id' => ''],
            'google_ads' => ['enabled' => false, 'conversion_id' => '', 'conversion_label' => ''],
            'tiktok_pixel' => ['enabled' => false, 'pixel_id' => ''],
            'gtm' => ['enabled' => false, 'container_id' => ''],
        ];
    }
}
