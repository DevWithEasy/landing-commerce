<?php

declare(strict_types=1);

namespace App\Modules\Settings\Services;

use App\Modules\Settings\Models\Setting;
use Illuminate\Support\Facades\Schema;
use Throwable;

class SettingsService
{
    public const SECRET_MASK = '••••••••';

    /**
     * Customer-facing storefront color tokens and their Velure defaults.
     * Keys must stay in sync with the `--color-*` tokens in resources/css/app.css.
     *
     * @var array<string, string>
     */
    public const STOREFRONT_COLOR_DEFAULTS = [
        'page' => '#faf7f2',
        'surface' => '#ffffff',
        'soft' => '#f3ede4',
        'line' => '#e7e5e4',
        'brand' => '#0b3b2e',
        'brand-hover' => '#082b21',
        'heading' => '#0b3b2e',
        'ink' => '#1c1917',
        'body' => '#57534e',
        'muted' => '#78716c',
        'cta' => '#f96d16',
        'cta-hover' => '#ea580c',
        'cta-text' => '#ffffff',
        'highlight' => '#f96d16',
        'price' => '#ea580c',
        'sale' => '#f96d16',
        'header' => '#ffffff',
        'footer' => '#0b3b2e',
        'footer-text' => '#d1fae5',
    ];

    protected const HEX_COLOR_PATTERN = '/^#[0-9a-fA-F]{6}$/';

    /**
     * Known sensitive keys that must always be encrypted in the database
     * and masked in UI / API representations.
     *
     * @var list<string>
     */
    protected static array $secretKeys = [
        'courier.steadfast.api_key',
        'courier.steadfast.secret_key',
        'courier.pathao.client_id',
        'courier.pathao.client_secret',
        'courier.pathao.username',
        'courier.pathao.password',
        'courier.redx.api_token',
        'sms.greenweb.token',
        'sms.ssl_wireless.api_token',
        'sms.ssl_wireless.sid',
        'sms.smspoh.token',
        'ai.gemini.api_key',
    ];

    /**
     * Mapping from database setting keys to runtime config paths.
     *
     * @var array<string, string>
     */
    protected static array $configKeyMap = [
        'courier.default' => 'courier.default',
        'courier.steadfast.api_key' => 'courier.drivers.steadfast.api_key',
        'courier.steadfast.secret_key' => 'courier.drivers.steadfast.secret_key',
        'courier.steadfast.base_url' => 'courier.drivers.steadfast.base_url',
        'courier.pathao.client_id' => 'courier.drivers.pathao.client_id',
        'courier.pathao.client_secret' => 'courier.drivers.pathao.client_secret',
        'courier.pathao.username' => 'courier.drivers.pathao.username',
        'courier.pathao.password' => 'courier.drivers.pathao.password',
        'courier.pathao.store_id' => 'courier.drivers.pathao.store_id',
        'courier.pathao.base_url' => 'courier.drivers.pathao.base_url',
        'courier.redx.api_token' => 'courier.drivers.redx.api_token',
        'courier.redx.base_url' => 'courier.drivers.redx.base_url',
        'sms.default' => 'sms.default',
        'sms.greenweb.token' => 'sms.drivers.greenweb.token',
        'sms.greenweb.base_url' => 'sms.drivers.greenweb.base_url',
        'sms.ssl_wireless.api_token' => 'sms.drivers.ssl_wireless.api_token',
        'sms.ssl_wireless.sid' => 'sms.drivers.ssl_wireless.sid',
        'sms.ssl_wireless.base_url' => 'sms.drivers.ssl_wireless.base_url',
        'sms.smspoh.token' => 'sms.drivers.smspoh.token',
        'sms.smspoh.sender_id' => 'sms.drivers.smspoh.sender_id',
        'sms.smspoh.base_url' => 'sms.drivers.smspoh.base_url',
        'store.name' => 'app.name',
        'store.whatsapp' => 'services.whatsapp.merchant_phone',
    ];

    /**
     * Determine if a setting key contains sensitive secrets.
     */
    public function isSecretKey(string $key): bool
    {
        return in_array($key, static::$secretKeys, true);
    }

    /**
     * Retrieve a setting value by key, with optional fallback to default or config.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        try {
            if (! Schema::hasTable('settings')) {
                return $default;
            }

            $setting = Setting::query()->where('key', $key)->first();

            if ($setting !== null) {
                $val = $setting->getDecryptedValue();
                if ($val !== null && $val !== '') {
                    return $val;
                }
            }
        } catch (Throwable) {
            // In case of database or table readiness issues
        }

        // Fall back to config if mapped
        if (isset(static::$configKeyMap[$key])) {
            $configVal = config(static::$configKeyMap[$key]);
            if ($configVal !== null && $configVal !== '') {
                return $configVal;
            }
        }

        return $default;
    }

    /**
     * Store or update a setting.
     */
    public function set(
        string $key,
        ?string $value,
        string $group = 'general',
        ?bool $isEncrypted = null,
        ?string $description = null
    ): Setting {
        $shouldEncrypt = $isEncrypted ?? $this->isSecretKey($key);

        $setting = Setting::query()->firstOrNew(['key' => $key]);
        $setting->group = $group;
        if ($description !== null) {
            $setting->description = $description;
        }
        $setting->setEncryptedValue($value, $shouldEncrypt);
        $setting->save();

        return $setting;
    }

    /**
     * Determine whether a setting has a non-empty configured value.
     */
    public function has(string $key): bool
    {
        $val = $this->get($key);

        return $val !== null && $val !== '';
    }

    /**
     * Remove a setting from storage.
     */
    public function forget(string $key): bool
    {
        if (! Schema::hasTable('settings')) {
            return false;
        }

        return (bool) Setting::query()->where('key', $key)->delete();
    }

    /**
     * Get masked dictionary of settings tailored for the Admin UI props.
     * Guarantees zero secret leakage into JSON/props.
     *
     * @return array<string, mixed>
     */
    public function getMaskedSettingsForUi(): array
    {
        $settings = [
            // Couriers
            'courier_default' => (string) $this->get('courier.default', config('courier.default', 'mock')),
            'steadfast_api_key' => $this->has('courier.steadfast.api_key') ? static::SECRET_MASK : '',
            'steadfast_api_key_configured' => $this->has('courier.steadfast.api_key'),
            'steadfast_secret_key' => $this->has('courier.steadfast.secret_key') ? static::SECRET_MASK : '',
            'steadfast_secret_key_configured' => $this->has('courier.steadfast.secret_key'),
            'steadfast_base_url' => (string) $this->get('courier.steadfast.base_url', config('courier.drivers.steadfast.base_url', 'https://portal.steadfast.com.bd/api/v1')),

            'pathao_client_id' => $this->has('courier.pathao.client_id') ? static::SECRET_MASK : '',
            'pathao_client_id_configured' => $this->has('courier.pathao.client_id'),
            'pathao_client_secret' => $this->has('courier.pathao.client_secret') ? static::SECRET_MASK : '',
            'pathao_client_secret_configured' => $this->has('courier.pathao.client_secret'),
            'pathao_username' => $this->has('courier.pathao.username') ? static::SECRET_MASK : '',
            'pathao_username_configured' => $this->has('courier.pathao.username'),
            'pathao_password' => $this->has('courier.pathao.password') ? static::SECRET_MASK : '',
            'pathao_password_configured' => $this->has('courier.pathao.password'),
            'pathao_store_id' => (string) $this->get('courier.pathao.store_id', config('courier.drivers.pathao.store_id', '')),
            'pathao_base_url' => (string) $this->get('courier.pathao.base_url', config('courier.drivers.pathao.base_url', 'https://api-hermes.pathao.com')),

            'redx_api_token' => $this->has('courier.redx.api_token') ? static::SECRET_MASK : '',
            'redx_api_token_configured' => $this->has('courier.redx.api_token'),
            'redx_base_url' => (string) $this->get('courier.redx.base_url', config('courier.drivers.redx.base_url', 'https://openapi.redx.com.bd/v1.0.0-sandbox')),

            // SMS Gateways
            'sms_default' => (string) $this->get('sms.default', config('sms.default', 'mock')),
            'greenweb_token' => $this->has('sms.greenweb.token') ? static::SECRET_MASK : '',
            'greenweb_token_configured' => $this->has('sms.greenweb.token'),
            'greenweb_base_url' => (string) $this->get('sms.greenweb.base_url', config('sms.drivers.greenweb.base_url', 'https://api.greenweb.com.bd/api.php')),

            'ssl_wireless_api_token' => $this->has('sms.ssl_wireless.api_token') ? static::SECRET_MASK : '',
            'ssl_wireless_api_token_configured' => $this->has('sms.ssl_wireless.api_token'),
            'ssl_wireless_sid' => $this->has('sms.ssl_wireless.sid') ? static::SECRET_MASK : '',
            'ssl_wireless_sid_configured' => $this->has('sms.ssl_wireless.sid'),
            'ssl_wireless_base_url' => (string) $this->get('sms.ssl_wireless.base_url', config('sms.drivers.ssl_wireless.base_url', 'https://smsplus.sslwireless.com/api/v3/send-sms')),

            'smspoh_token' => $this->has('sms.smspoh.token') ? static::SECRET_MASK : '',
            'smspoh_token_configured' => $this->has('sms.smspoh.token'),
            'smspoh_sender_id' => (string) $this->get('sms.smspoh.sender_id', config('sms.drivers.smspoh.sender_id', 'LandingCommerce')),
            'smspoh_base_url' => (string) $this->get('sms.smspoh.base_url', config('sms.drivers.smspoh.base_url', 'https://v3.smspoh.com/api/rest/send')),

            // Store Info
            'store_name' => (string) $this->get('store.name', config('app.name', 'Landing Commerce')),
            'store_phone' => (string) $this->get('store.phone', ''),
            'store_whatsapp' => (string) $this->get('store.whatsapp', config('services.whatsapp.merchant_phone', '')),

            // Customer-owned AI Design Generator
            'ai_gemini_api_key' => $this->has('ai.gemini.api_key') ? static::SECRET_MASK : '',
            'ai_gemini_api_key_configured' => $this->has('ai.gemini.api_key'),
            'ai_model' => (string) $this->get('ai.gemini.model', config('ai.gemini.default_model', 'gemini-3.6-flash')),
            'ai_enabled' => filter_var($this->get('ai.gemini.enabled', true), FILTER_VALIDATE_BOOLEAN) ? '1' : '0',
        ];

        return $settings;
    }

    /**
     * Batch update settings from validated request inputs.
     * Ignores masked placeholder values so existing secrets are preserved.
     *
     * @param  array<string, mixed>  $inputs
     */
    public function updateSettings(array $inputs): void
    {
        $fieldMap = [
            'courier_default' => ['key' => 'courier.default', 'group' => 'courier', 'secret' => false],
            'steadfast_api_key' => ['key' => 'courier.steadfast.api_key', 'group' => 'courier', 'secret' => true],
            'steadfast_secret_key' => ['key' => 'courier.steadfast.secret_key', 'group' => 'courier', 'secret' => true],
            'steadfast_base_url' => ['key' => 'courier.steadfast.base_url', 'group' => 'courier', 'secret' => false],

            'pathao_client_id' => ['key' => 'courier.pathao.client_id', 'group' => 'courier', 'secret' => true],
            'pathao_client_secret' => ['key' => 'courier.pathao.client_secret', 'group' => 'courier', 'secret' => true],
            'pathao_username' => ['key' => 'courier.pathao.username', 'group' => 'courier', 'secret' => true],
            'pathao_password' => ['key' => 'courier.pathao.password', 'group' => 'courier', 'secret' => true],
            'pathao_store_id' => ['key' => 'courier.pathao.store_id', 'group' => 'courier', 'secret' => false],
            'pathao_base_url' => ['key' => 'courier.pathao.base_url', 'group' => 'courier', 'secret' => false],

            'redx_api_token' => ['key' => 'courier.redx.api_token', 'group' => 'courier', 'secret' => true],
            'redx_base_url' => ['key' => 'courier.redx.base_url', 'group' => 'courier', 'secret' => false],

            'sms_default' => ['key' => 'sms.default', 'group' => 'sms', 'secret' => false],
            'greenweb_token' => ['key' => 'sms.greenweb.token', 'group' => 'sms', 'secret' => true],
            'greenweb_base_url' => ['key' => 'sms.greenweb.base_url', 'group' => 'sms', 'secret' => false],

            'ssl_wireless_api_token' => ['key' => 'sms.ssl_wireless.api_token', 'group' => 'sms', 'secret' => true],
            'ssl_wireless_sid' => ['key' => 'sms.ssl_wireless.sid', 'group' => 'sms', 'secret' => true],
            'ssl_wireless_base_url' => ['key' => 'sms.ssl_wireless.base_url', 'group' => 'sms', 'secret' => false],

            'smspoh_token' => ['key' => 'sms.smspoh.token', 'group' => 'sms', 'secret' => true],
            'smspoh_sender_id' => ['key' => 'sms.smspoh.sender_id', 'group' => 'sms', 'secret' => false],
            'smspoh_base_url' => ['key' => 'sms.smspoh.base_url', 'group' => 'sms', 'secret' => false],

            'store_name' => ['key' => 'store.name', 'group' => 'general', 'secret' => false],
            'store_phone' => ['key' => 'store.phone', 'group' => 'general', 'secret' => false],
            'store_whatsapp' => ['key' => 'store.whatsapp', 'group' => 'general', 'secret' => false],

            'ai_gemini_api_key' => ['key' => 'ai.gemini.api_key', 'group' => 'ai', 'secret' => true],
            'ai_model' => ['key' => 'ai.gemini.model', 'group' => 'ai', 'secret' => false],
            'ai_enabled' => ['key' => 'ai.gemini.enabled', 'group' => 'ai', 'secret' => false],
        ];

        foreach ($fieldMap as $inputKey => $meta) {
            if (! array_key_exists($inputKey, $inputs)) {
                continue;
            }

            $rawValue = $inputs[$inputKey];
            $value = is_string($rawValue) ? trim($rawValue) : (string) $rawValue;
            $isSecret = (bool) $meta['secret'];

            if ($inputKey === 'ai_enabled') {
                $value = filter_var($rawValue, FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
            }

            // If it is a secret and the input is empty or contains the mask, skip updating it
            if ($isSecret) {
                if ($value === '' || $value === static::SECRET_MASK || str_starts_with($value, '••••')) {
                    continue;
                }
            }

            $this->set(
                key: (string) $meta['key'],
                value: $value !== '' ? $value : null,
                group: (string) $meta['group'],
                isEncrypted: $isSecret
            );
        }

        $this->applyRuntimeOverrides();
    }

    /**
     * Push active database settings into Laravel's runtime config array.
     */
    public function applyRuntimeOverrides(): void
    {
        try {
            if (! Schema::hasTable('settings')) {
                return;
            }
        } catch (Throwable) {
            return;
        }

        foreach (static::$configKeyMap as $settingKey => $configPath) {
            try {
                $setting = Setting::query()->where('key', $settingKey)->first();
                if ($setting !== null) {
                    $val = $setting->getDecryptedValue();
                    if ($val !== null && $val !== '') {
                        config([$configPath => $val]);
                    }
                }
            } catch (Throwable) {
                // Ignore transient query or decryption issues
            }
        }
    }

    /**
     * Get storefront theme configuration.
     *
     * @return array<string, string>
     */
    public function getStorefrontTheme(): array
    {
        return [
            'store_name' => (string) $this->get('store.name', config('app.name', 'Landing Commerce')),
            'store_phone' => (string) $this->get('store.phone', ''),
            'store_whatsapp' => (string) $this->get('store.whatsapp', ''),
            'logo_url' => (string) $this->get('store.logo_url', ''),
            'favicon_url' => (string) $this->get('store.favicon_url', ''),
            'primary_color' => (string) $this->get('theme.primary_color', '#4f46e5'),
            'secondary_color' => (string) $this->get('theme.secondary_color', '#06b6d4'),
            'accent_color' => (string) $this->get('theme.accent_color', '#f59e0b'),
            'background_color' => (string) $this->get('theme.background_color', '#f8fafc'),
            'text_color' => (string) $this->get('theme.text_color', '#0f172a'),
            'font_family' => (string) $this->get('theme.font_family', 'Hind Siliguri, Inter, sans-serif'),
            'custom_css' => (string) $this->get('theme.custom_css', ''),
        ];
    }

    /**
     * Resolve storefront color tokens: defaults merged with valid saved overrides.
     *
     * @return array<string, string>
     */
    public function getStorefrontColors(): array
    {
        $colors = self::STOREFRONT_COLOR_DEFAULTS;
        $raw = $this->get('storefront.colors');

        if (! is_string($raw) || $raw === '') {
            return $colors;
        }

        $saved = json_decode($raw, true);
        if (! is_array($saved)) {
            return $colors;
        }

        foreach ($saved as $key => $value) {
            if (is_string($key) && isset($colors[$key]) && is_string($value) && preg_match(self::HEX_COLOR_PATTERN, $value) === 1) {
                $colors[$key] = strtolower($value);
            }
        }

        return $colors;
    }

    /**
     * Persist storefront color overrides. Only allowlisted keys with strict
     * #RRGGBB values are stored; values equal to the default are dropped.
     *
     * @param  array<array-key, mixed>  $input
     */
    public function saveStorefrontColors(array $input): void
    {
        $overrides = [];

        foreach (self::STOREFRONT_COLOR_DEFAULTS as $key => $default) {
            $value = $input[$key] ?? null;
            if (! is_string($value) || preg_match(self::HEX_COLOR_PATTERN, $value) !== 1) {
                continue;
            }
            $value = strtolower($value);
            if ($value !== $default) {
                $overrides[$key] = $value;
            }
        }

        $this->set(
            'storefront.colors',
            $overrides === [] ? null : (string) json_encode($overrides),
            'theme'
        );
    }

    /**
     * Render a safe `:root { --color-*: #hex }` CSS block containing only the
     * customized storefront tokens. Returns an empty string when nothing is customized.
     */
    public function renderStorefrontColorCss(): string
    {
        $declarations = [];

        foreach ($this->getStorefrontColors() as $key => $value) {
            if ($value === self::STOREFRONT_COLOR_DEFAULTS[$key]) {
                continue;
            }
            // Re-validate at render time: key is from the allowlist, value is strict hex.
            if (preg_match(self::HEX_COLOR_PATTERN, $value) === 1) {
                $declarations[] = "--color-{$key}:{$value}";
            }
        }

        return $declarations === [] ? '' : ':root{'.implode(';', $declarations).'}';
    }

    /**
     * Get the default fallback hero configuration (shown when no active sliders exist).
     *
     * @return array<string, string>
     */
    public function getDefaultHeroConfig(): array
    {
        $storeName = (string) $this->get('store.name', config('app.name', 'Landing Commerce'));

        return [
            'badge_text' => (string) $this->get('homepage.default_hero.badge_text', 'NEW COLLECTION'),
            'title' => (string) $this->get('homepage.default_hero.title', 'Modern Fashion for Everyday Life'),
            'description' => (string) $this->get(
                'homepage.default_hero.description',
                "Discover premium clothing, shoes, watches and accessories curated by {$storeName} for a stylish lifestyle."
            ),
            'primary_button_text' => (string) $this->get('homepage.default_hero.primary_button_text', 'Shop Now'),
            'primary_button_url' => (string) $this->get('homepage.default_hero.primary_button_url', '/shop'),
            'secondary_button_text' => (string) $this->get('homepage.default_hero.secondary_button_text', 'Explore Collection'),
            'secondary_button_url' => (string) $this->get('homepage.default_hero.secondary_button_url', '/shop?sort=latest'),
            'card_title' => (string) $this->get('homepage.default_hero.card_title', 'Curated Essentials'),
            'card_subtitle' => (string) $this->get('homepage.default_hero.card_subtitle', '100% Authentic · Fast Cash on Delivery'),
            'image_path' => (string) $this->get('homepage.default_hero.image_path', ''),
            'image_url' => (string) $this->get('homepage.default_hero.image_url', ''),
        ];
    }

    /**
     * Get the dual promo banners configuration (Seasonal Sale & Combo Deals).
     *
     * @return array<string, mixed>
     */
    public function getPromoBannersConfig(): array
    {
        return [
            'enabled' => filter_var((string) $this->get('homepage.promo_banners.enabled', '1'), FILTER_VALIDATE_BOOLEAN),
            'seasonal' => [
                'badge' => (string) $this->get('homepage.promo_banners.seasonal.badge', 'SEASONAL SALE'),
                'title' => (string) $this->get('homepage.promo_banners.seasonal.title', 'Up to 50% OFF'),
                'subtitle' => (string) $this->get('homepage.promo_banners.seasonal.subtitle', 'On Selected Items'),
                'button_text' => (string) $this->get('homepage.promo_banners.seasonal.button_text', 'Shop the Sale'),
                'button_url' => (string) $this->get('homepage.promo_banners.seasonal.button_url', '/shop'),
                'image_path' => (string) $this->get('homepage.promo_banners.seasonal.image_path', ''),
                'image_url' => (string) $this->get('homepage.promo_banners.seasonal.image_url', ''),
            ],
            'combo' => [
                'title' => (string) $this->get('homepage.promo_banners.combo.title', 'Combo Deals'),
                'subtitle' => (string) $this->get('homepage.promo_banners.combo.subtitle', 'Buy More, Save More'),
                'button_text' => (string) $this->get('homepage.promo_banners.combo.button_text', 'Shop Combo'),
                'button_url' => (string) $this->get('homepage.promo_banners.combo.button_url', '/shop'),
                'badge_label' => (string) $this->get('homepage.promo_banners.combo.badge_label', 'SAVE'),
                'badge_value' => (string) $this->get('homepage.promo_banners.combo.badge_value', '30%'),
                'image_path' => (string) $this->get('homepage.promo_banners.combo.image_path', ''),
                'image_url' => (string) $this->get('homepage.promo_banners.combo.image_url', ''),
            ],
        ];
    }
}
