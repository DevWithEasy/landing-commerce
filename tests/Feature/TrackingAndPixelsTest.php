<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\Tracking\Services\TrackingService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createTrackingUser(string $role): User
{
    return User::factory()->create([
        'name' => ucfirst(str_replace('_', ' ', $role)),
        'email' => "{$role}_".uniqid().'@example.com',
        'role' => $role,
        'password' => bcrypt('secret123'),
    ]);
}

test('super admin can access tracking settings page', function () {
    $superAdmin = createTrackingUser('super_admin');

    $response = $this->actingAs($superAdmin)->get(route('admin.tracking.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Tracking/Index')
        ->has('settings')
        ->has('landingPages')
    );
});

test('fulfillment agent is forbidden from accessing tracking settings', function () {
    $agent = createTrackingUser('fulfillment_agent');

    $response = $this->actingAs($agent)->get(route('admin.tracking.index'));

    $response->assertForbidden();
});

test('unauthenticated guest is redirected to login', function () {
    $response = $this->get(route('admin.tracking.index'));

    $response->assertRedirect(route('login'));
});

test('global tracking settings validation rejects invalid formats', function () {
    $superAdmin = createTrackingUser('super_admin');

    // Invalid Meta Pixel (letters instead of numeric digits)
    $response = $this->actingAs($superAdmin)->post(route('admin.tracking.update'), [
        'meta_pixel' => [
            'enabled' => true,
            'pixel_id' => 'INVALID_ALPHA_PIXEL',
        ],
    ]);
    $response->assertSessionHasErrors('meta_pixel.pixel_id');

    // Invalid GA4 Measurement ID (missing G- prefix)
    $response = $this->actingAs($superAdmin)->post(route('admin.tracking.update'), [
        'ga4' => [
            'enabled' => true,
            'measurement_id' => 'UA-12345678-1',
        ],
    ]);
    $response->assertSessionHasErrors('ga4.measurement_id');

    // Invalid Google Ads Conversion ID
    $response = $this->actingAs($superAdmin)->post(route('admin.tracking.update'), [
        'google_ads' => [
            'enabled' => true,
            'conversion_id' => 'BAD_ID!',
        ],
    ]);
    $response->assertSessionHasErrors('google_ads.conversion_id');

    // Invalid TikTok Pixel ID
    $response = $this->actingAs($superAdmin)->post(route('admin.tracking.update'), [
        'tiktok_pixel' => [
            'enabled' => true,
            'pixel_id' => '123', // too short
        ],
    ]);
    $response->assertSessionHasErrors('tiktok_pixel.pixel_id');

    // Invalid GTM Container ID (missing GTM- prefix)
    $response = $this->actingAs($superAdmin)->post(route('admin.tracking.update'), [
        'gtm' => [
            'enabled' => true,
            'container_id' => 'CONTAINER_123',
        ],
    ]);
    $response->assertSessionHasErrors('gtm.container_id');
});

test('super admin can successfully update global tracking configuration', function () {
    $superAdmin = createTrackingUser('super_admin');

    $validPayload = [
        'meta_pixel' => [
            'enabled' => true,
            'pixel_id' => '123456789012345',
        ],
        'ga4' => [
            'enabled' => true,
            'measurement_id' => 'G-ABC123XYZ',
        ],
        'google_ads' => [
            'enabled' => true,
            'conversion_id' => 'AW-987654321',
            'conversion_label' => 'AbCdEfGhIjK_123',
        ],
        'tiktok_pixel' => [
            'enabled' => true,
            'pixel_id' => 'C1234567890ABCDEF',
        ],
        'gtm' => [
            'enabled' => true,
            'container_id' => 'GTM-ABCD123',
        ],
        'target_mode' => 'all',
        'target_page_ids' => [],
    ];

    $response = $this->actingAs($superAdmin)->post(route('admin.tracking.update'), $validPayload);

    $response->assertRedirect(route('admin.tracking.index'));
    $response->assertSessionHas('success');

    $trackingService = app(TrackingService::class);
    $saved = $trackingService->getGlobalSettings();

    expect($saved['meta_pixel']['enabled'])->toBeTrue();
    expect($saved['meta_pixel']['pixel_id'])->toBe('123456789012345');
    expect($saved['ga4']['enabled'])->toBeTrue();
    expect($saved['ga4']['measurement_id'])->toBe('G-ABC123XYZ');
    expect($saved['google_ads']['enabled'])->toBeTrue();
    expect($saved['google_ads']['conversion_id'])->toBe('AW-987654321');
    expect($saved['tiktok_pixel']['enabled'])->toBeTrue();
    expect($saved['tiktok_pixel']['pixel_id'])->toBe('C1234567890ABCDEF');
    expect($saved['gtm']['enabled'])->toBeTrue();
    expect($saved['gtm']['container_id'])->toBe('GTM-ABCD123');
});

test('when tracking is disabled no tracking scripts are rendered', function () {
    $trackingService = app(TrackingService::class);

    $resolved = [
        'meta_pixel' => ['enabled' => false, 'pixel_id' => '123456789012345'],
        'ga4' => ['enabled' => false, 'measurement_id' => 'G-ABC123XYZ'],
        'google_ads' => ['enabled' => false, 'conversion_id' => 'AW-987654321', 'conversion_label' => ''],
        'tiktok_pixel' => ['enabled' => false, 'pixel_id' => 'C1234567890ABCDEF'],
        'gtm' => ['enabled' => false, 'container_id' => 'GTM-ABCD123'],
    ];

    $headScripts = $trackingService->renderHeadScripts($resolved);
    $bodyScripts = $trackingService->renderBodyScripts($resolved);

    expect($headScripts)->toBe('');
    expect($bodyScripts)->toBe('');
});

test('when tracking is enabled sanitized scripts are rendered for all active providers', function () {
    $trackingService = app(TrackingService::class);

    $resolved = [
        'meta_pixel' => ['enabled' => true, 'pixel_id' => '987654321012345'],
        'ga4' => ['enabled' => true, 'measurement_id' => 'G-TESTMEASURE'],
        'google_ads' => ['enabled' => true, 'conversion_id' => 'AW-1122334455', 'conversion_label' => 'Label123'],
        'tiktok_pixel' => ['enabled' => true, 'pixel_id' => 'CTIKTOKTEST123'],
        'gtm' => ['enabled' => true, 'container_id' => 'GTM-TEST999'],
    ];

    $headScripts = $trackingService->renderHeadScripts($resolved);
    $bodyScripts = $trackingService->renderBodyScripts($resolved);

    // Meta Pixel checks
    expect($headScripts)->toContain('fbq(\'init\', \'987654321012345\');');
    expect($headScripts)->toContain('fbq(\'track\', \'PageView\');');

    // GA4 & Google Ads checks
    expect($headScripts)->toContain('https://www.googletagmanager.com/gtag/js?id=G-TESTMEASURE');
    expect($headScripts)->toContain("gtag('config', 'G-TESTMEASURE'");
    expect($headScripts)->toContain("gtag('config', 'AW-1122334455')");

    // TikTok checks
    expect($headScripts)->toContain('ttq.load(\'CTIKTOKTEST123\');');
    expect($headScripts)->toContain('ttq.page();');

    // GTM checks
    expect($headScripts)->toContain('GTM-TEST999');
    expect($bodyScripts)->toContain('https://www.googletagmanager.com/ns.html?id=GTM-TEST999');
});

test('draft landing pages return all tracking disabled to protect merchant metrics', function () {
    $trackingService = app(TrackingService::class);

    // Setup active global tracking
    $trackingService->updateGlobalSettings([
        'meta_pixel' => ['enabled' => true, 'pixel_id' => '123456789012345'],
        'ga4' => ['enabled' => true, 'measurement_id' => 'G-ABC123XYZ'],
        'target_mode' => 'all',
    ]);

    $draftPage = LandingPage::query()->create([
        'title' => 'Draft Campaign',
        'slug' => 'draft-campaign-'.uniqid(),
        'status' => 'draft',
        'blocks' => [],
        'theme' => [],
    ]);

    $resolved = $trackingService->getResolvedSettings($draftPage);

    expect($resolved['meta_pixel']['enabled'])->toBeFalse();
    expect($resolved['ga4']['enabled'])->toBeFalse();
    expect($resolved['google_ads']['enabled'])->toBeFalse();
    expect($resolved['tiktok_pixel']['enabled'])->toBeFalse();
    expect($resolved['gtm']['enabled'])->toBeFalse();

    $head = $trackingService->renderHeadScripts($resolved);
    expect($head)->toBe('');
});

test('landing page tracking overrides override global settings', function () {
    $trackingService = app(TrackingService::class);

    // Global settings: Meta Pixel A
    $trackingService->updateGlobalSettings([
        'meta_pixel' => ['enabled' => true, 'pixel_id' => '111111111111111'],
        'ga4' => ['enabled' => true, 'measurement_id' => 'G-GLOBAL123'],
        'target_mode' => 'all',
    ]);

    // Page 1: Overridden with Meta Pixel B
    $pageWithOverride = LandingPage::query()->create([
        'title' => 'Custom Ad Campaign',
        'slug' => 'custom-ad-'.uniqid(),
        'status' => 'published',
        'blocks' => [],
        'theme' => [],
        'tracking_settings' => [
            'override_global' => true,
            'meta_pixel' => ['enabled' => true, 'pixel_id' => '222222222222222'],
            'ga4' => ['enabled' => true, 'measurement_id' => 'G-CUSTOM999'],
        ],
    ]);

    // Page 2: No override, inherits global Meta Pixel A
    $pageInheriting = LandingPage::query()->create([
        'title' => 'Standard Campaign',
        'slug' => 'standard-campaign-'.uniqid(),
        'status' => 'published',
        'blocks' => [],
        'theme' => [],
        'tracking_settings' => null,
    ]);

    $resolvedPage1 = $trackingService->getResolvedSettings($pageWithOverride);
    $resolvedPage2 = $trackingService->getResolvedSettings($pageInheriting);

    expect($resolvedPage1['meta_pixel']['pixel_id'])->toBe('222222222222222');
    expect($resolvedPage1['ga4']['measurement_id'])->toBe('G-CUSTOM999');

    expect($resolvedPage2['meta_pixel']['pixel_id'])->toBe('111111111111111');
    expect($resolvedPage2['ga4']['measurement_id'])->toBe('G-GLOBAL123');
});

test('target mode custom restricts tracking strictly to selected pages', function () {
    $trackingService = app(TrackingService::class);

    $pageAllowed = LandingPage::query()->create([
        'title' => 'Allowed Page',
        'slug' => 'allowed-'.uniqid(),
        'status' => 'published',
        'blocks' => [],
        'theme' => [],
    ]);

    $pageBlocked = LandingPage::query()->create([
        'title' => 'Blocked Page',
        'slug' => 'blocked-'.uniqid(),
        'status' => 'published',
        'blocks' => [],
        'theme' => [],
    ]);

    $trackingService->updateGlobalSettings([
        'meta_pixel' => ['enabled' => true, 'pixel_id' => '123456789012345'],
        'target_mode' => 'custom',
        'target_page_ids' => [$pageAllowed->id],
    ]);

    $resolvedAllowed = $trackingService->getResolvedSettings($pageAllowed);
    $resolvedBlocked = $trackingService->getResolvedSettings($pageBlocked);

    expect($resolvedAllowed['meta_pixel']['enabled'])->toBeTrue();
    expect($resolvedBlocked['meta_pixel']['enabled'])->toBeFalse();
});

test('super admin can update page-specific tracking settings via controller', function () {
    $superAdmin = createTrackingUser('super_admin');

    $page = LandingPage::query()->create([
        'title' => 'Page to Override',
        'slug' => 'page-override-'.uniqid(),
        'status' => 'published',
        'blocks' => [],
        'theme' => [],
    ]);

    $response = $this->actingAs($superAdmin)->post(route('admin.tracking.page.update', $page->id), [
        'override_global' => true,
        'meta_pixel' => [
            'enabled' => true,
            'pixel_id' => '999988887777666',
        ],
    ]);

    $response->assertRedirect(route('admin.tracking.index'));
    $response->assertSessionHas('success');

    $page->refresh();
    expect($page->tracking_settings['override_global'])->toBeTrue();
    expect($page->tracking_settings['meta_pixel']['pixel_id'])->toBe('999988887777666');
});

test('contextual ViewContent event is rendered on landing page with price and ID but no customer PII', function () {
    $trackingService = app(TrackingService::class);

    $resolved = [
        'meta_pixel' => ['enabled' => true, 'pixel_id' => '123456789012345'],
        'ga4' => ['enabled' => true, 'measurement_id' => 'G-ABC123XYZ'],
        'google_ads' => ['enabled' => false, 'conversion_id' => ''],
        'tiktok_pixel' => ['enabled' => true, 'pixel_id' => 'C1234567890ABCDEF'],
        'gtm' => ['enabled' => false, 'container_id' => ''],
    ];

    $productContext = [
        'event' => 'ViewContent',
        'product' => [
            'id' => 42,
            'title' => 'Premium Leather Wallet',
            'regular_price' => 1500.00,
            'sale_price' => 1250.00,
        ],
    ];

    $rendered = $trackingService->renderHeadScripts($resolved, $productContext);

    // Meta ViewContent
    expect($rendered)->toContain('ViewContent');
    expect($rendered)->toContain("content_name: 'Premium Leather Wallet'");
    expect($rendered)->toContain("content_ids: ['42']");
    expect($rendered)->toContain('value: 1250');
    expect($rendered)->toContain("currency: 'BDT'");

    // GA4 view_item
    expect($rendered)->toContain('view_item');
    expect($rendered)->toContain("item_id: '42'");

    // TikTok ViewContent
    expect($rendered)->toContain("ttq.track('ViewContent'");

    // Privacy assertion: No PII (customer names, phone numbers, email addresses) should exist
    expect($rendered)->not->toContain('customer_name');
    expect($rendered)->not->toContain('customer_phone');
    expect($rendered)->not->toContain('delivery_address');
});
