<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Catalog\Models\Category;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('root route renders full storefront home when mode is full_storefront', function () {
    $settings = app(SettingsService::class);
    $settings->set('storefront.mode', 'full_storefront');
    $settings->set('store.name', 'My Grand Shop');

    Category::create(['name' => 'Fashion', 'slug' => 'fashion', 'is_active' => true]);

    $response = $this->get('/');
    $response->assertStatus(200);
    $response->assertSee('My Grand Shop');
    $response->assertSee('Fashion');
    $response->assertSee('ক্যাটাগরি');
});

test('root route renders published landing page when mode is landing_page_home', function () {
    $page = LandingPage::create([
        'title' => 'Exclusive Watch Campaign',
        'slug' => 'exclusive-watch',
        'status' => 'published',
    ]);

    $revision = LandingPageRevision::create([
        'landing_page_id' => $page->id,
        'revision_number' => 1,
        'ast_content' => [
            'version' => 1,
            'settings' => ['primaryColor' => '#16a34a'],
            'blocks' => [
                [
                    'id' => 'hero-1',
                    'type' => 'HeroBlock',
                    'props' => ['headline' => 'Exclusive Luxury Watch'],
                    'styles' => [],
                ],
            ],
        ],
    ]);

    $page->update(['published_revision_id' => $revision->id]);

    $settings = app(SettingsService::class);
    $settings->set('storefront.mode', 'landing_page_home');
    $settings->set('storefront.home_landing_page_id', (string) $page->id);

    $response = $this->get('/');
    $response->assertStatus(200);
    $response->assertSee('Exclusive Luxury Watch');
});

test('root route does not render draft or unpublished landing page', function () {
    $draftPage = LandingPage::create([
        'title' => 'Draft Stealth Campaign',
        'slug' => 'stealth-draft',
        'status' => 'draft',
    ]);

    $revision = LandingPageRevision::create([
        'landing_page_id' => $draftPage->id,
        'revision_number' => 1,
        'ast_content' => [
            'version' => 1,
            'settings' => ['primaryColor' => '#16a34a'],
            'blocks' => [
                [
                    'id' => 'hero-draft',
                    'type' => 'HeroBlock',
                    'props' => ['headline' => 'Top Secret Launch'],
                    'styles' => [],
                ],
            ],
        ],
    ]);

    $draftPage->update(['published_revision_id' => $revision->id]);

    $settings = app(SettingsService::class);
    $settings->set('storefront.mode', 'landing_page_home');
    $settings->set('storefront.home_landing_page_id', (string) $draftPage->id);

    $response = $this->get('/');
    $response->assertStatus(200);
    $response->assertDontSee('Top Secret Launch');
});

test('root route returns json status when json is requested', function () {
    $response = $this->getJson('/');
    $response->assertStatus(200);
    $response->assertJson(['status' => 'ok', 'app' => 'Landing Commerce']);
});

test('existing /p/{slug} and legacy /{slug} redirects continue to function', function () {
    $page = LandingPage::create([
        'title' => 'Gadget Campaign',
        'slug' => 'gadget-deal',
        'status' => 'published',
    ]);

    $revision = LandingPageRevision::create([
        'landing_page_id' => $page->id,
        'revision_number' => 1,
        'ast_content' => [
            'version' => 1,
            'settings' => ['primaryColor' => '#16a34a'],
            'blocks' => [
                [
                    'id' => 'hero-gadget',
                    'type' => 'HeroBlock',
                    'props' => ['headline' => 'Super Gadgets'],
                    'styles' => [],
                ],
            ],
        ],
    ]);

    $page->update(['published_revision_id' => $revision->id]);

    // Direct /p/{slug}
    $pResponse = $this->get('/p/gadget-deal');
    $pResponse->assertStatus(200);
    $pResponse->assertSee('Super Gadgets');

    // Direct legacy /{slug}
    $legacyResponse = $this->get('/gadget-deal');
    $legacyResponse->assertStatus(200);
    $legacyResponse->assertSee('Super Gadgets');
});
