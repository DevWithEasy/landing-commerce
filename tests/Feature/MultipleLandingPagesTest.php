<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->superAdmin = User::factory()->create(['role' => 'super_admin']);
    $this->storeManager = User::factory()->create(['role' => 'store_manager']);
    $this->fulfillmentAgent = User::factory()->create(['role' => 'fulfillment_agent']);

    $this->productA = Product::create([
        'title' => 'Smartwatch Titanium Pro',
        'slug' => 'smartwatch-titanium-pro',
        'regular_price' => 5000.00,
        'status' => 'active',
        'has_variants' => false,
    ]);

    $this->productB = Product::create([
        'title' => 'Winter Jacket Waterproof',
        'slug' => 'winter-jacket-waterproof',
        'regular_price' => 3200.00,
        'status' => 'active',
        'has_variants' => false,
    ]);
});

test('admin can view landing pages dashboard with search and status filtering', function (): void {
    LandingPage::create([
        'title' => 'Gadget Campaign',
        'slug' => 'gadget-deal',
        'status' => 'published',
    ]);

    LandingPage::create([
        'title' => 'Clothing Winter Sale',
        'slug' => 'winter-sale',
        'status' => 'draft',
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->get('/admin/landing-pages');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/LandingPages/Index')
            ->has('landingPages.data', 2)
            ->has('products')
        );

    // Search filter
    $searchResponse = $this->actingAs($this->superAdmin)
        ->get('/admin/landing-pages?search=winter');

    $searchResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('landingPages.data', 1)
            ->where('landingPages.data.0.slug', 'winter-sale')
        );

    // Status filter
    $statusResponse = $this->actingAs($this->superAdmin)
        ->get('/admin/landing-pages?status=published');

    $statusResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('landingPages.data', 1)
            ->where('landingPages.data.0.slug', 'gadget-deal')
        );
});

test('admin can create multiple independent landing pages with auto-generated initial AST', function (): void {
    // 1. Create page 1
    $responseA = $this->actingAs($this->storeManager)
        ->post('/admin/landing-pages', [
            'title' => 'Smartwatch Launch Offer',
            'slug' => 'smartwatch-deal',
            'product_id' => $this->productA->id,
            'status' => 'draft',
            'settings' => [
                'primaryColor' => '#059669',
                'fontFamily' => 'Outfit',
            ],
            'meta_seo' => [
                'title' => 'Smartwatch Flash Sale',
                'description' => 'Fast delivery nationwide.',
            ],
        ]);

    $responseA->assertRedirect('/admin/landing-pages');

    $pageA = LandingPage::where('slug', 'smartwatch-deal')->first();
    expect($pageA)->not->toBeNull()
        ->and($pageA->title)->toBe('Smartwatch Launch Offer')
        ->and($pageA->product_id)->toBe($this->productA->id)
        ->and($pageA->status)->toBe('draft')
        ->and($pageA->revisions()->count())->toBe(1);

    // Check that revision #1 has valid compatible AST
    $revA = $pageA->revisions()->first();
    expect($revA->revision_number)->toBe(1)
        ->and($revA->ast_content['settings']['primaryColor'])->toBe('#059669')
        ->and($revA->ast_content['blocks'])->toHaveCount(3);

    // 2. Create page 2 with different product and slug
    $responseB = $this->actingAs($this->storeManager)
        ->post('/admin/landing-pages', [
            'title' => 'Winter Jacket Campaign',
            'slug' => 'winter-jacket',
            'product_id' => $this->productB->id,
            'status' => 'published',
            'settings' => [
                'primaryColor' => '#2563eb',
            ],
        ]);

    $responseB->assertRedirect('/admin/landing-pages');

    $pageB = LandingPage::where('slug', 'winter-jacket')->first();
    expect($pageB)->not->toBeNull()
        ->and($pageB->title)->toBe('Winter Jacket Campaign')
        ->and($pageB->product_id)->toBe($this->productB->id)
        ->and($pageB->status)->toBe('published')
        ->and($pageB->published_revision_id)->not->toBeNull()
        ->and($pageB->revisions()->count())->toBe(1);

    // Independent check: Page A has not been altered by creating Page B
    $pageA->refresh();
    expect($pageA->status)->toBe('draft')
        ->and($pageA->revisions()->count())->toBe(1);
});

test('validates unique slugs and rejects duplicate or reserved slugs', function (): void {
    LandingPage::create([
        'title' => 'Existing Page',
        'slug' => 'active-offer',
        'status' => 'draft',
    ]);

    // 1. Duplicate slug rejection on create
    $dupResponse = $this->actingAs($this->superAdmin)
        ->post('/admin/landing-pages', [
            'title' => 'Another Page with same slug',
            'slug' => 'active-offer',
        ]);

    $dupResponse->assertSessionHasErrors('slug');

    // 2. Reserved system slugs rejection (admin, checkout, api, etc.)
    $reservedResponse = $this->actingAs($this->superAdmin)
        ->post('/admin/landing-pages', [
            'title' => 'System Collision Page',
            'slug' => 'checkout',
        ]);

    $reservedResponse->assertSessionHasErrors('slug');

    $apiResponse = $this->actingAs($this->superAdmin)
        ->post('/admin/landing-pages', [
            'title' => 'API Slug',
            'slug' => 'api',
        ]);

    $apiResponse->assertSessionHasErrors('slug');

    // 3. Duplicate slug rejection on update
    $page2 = LandingPage::create([
        'title' => 'Page Two',
        'slug' => 'page-two',
        'status' => 'draft',
    ]);

    $updateDup = $this->actingAs($this->superAdmin)
        ->put("/admin/landing-pages/{$page2->id}", [
            'title' => 'Page Two Updated',
            'slug' => 'active-offer', // already taken
        ]);

    $updateDup->assertSessionHasErrors('slug');
});

test('public visitors can only view published landing pages at their unique slugs', function (): void {
    // 1. Published page
    $publishedPage = LandingPage::create([
        'title' => 'Smartwatch Sale',
        'slug' => 'smartwatch-deal',
        'product_id' => $this->productA->id,
        'status' => 'published',
    ]);

    $rev1 = LandingPageRevision::create([
        'landing_page_id' => $publishedPage->id,
        'revision_number' => 1,
        'ast_content' => [
            'version' => 1,
            'settings' => ['primaryColor' => '#16a34a'],
            'blocks' => [
                [
                    'id' => 'hero_1',
                    'type' => 'HeroBlock',
                    'props' => ['headline' => 'Exclusive Smartwatch'],
                    'styles' => [],
                ],
            ],
        ],
    ]);

    $publishedPage->update(['published_revision_id' => $rev1->id]);

    // 2. Draft page
    $draftPage = LandingPage::create([
        'title' => 'Draft Jacket Sale',
        'slug' => 'winter-sale',
        'product_id' => $this->productB->id,
        'status' => 'draft',
    ]);

    LandingPageRevision::create([
        'landing_page_id' => $draftPage->id,
        'revision_number' => 1,
        'ast_content' => [
            'version' => 1,
            'settings' => ['primaryColor' => '#16a34a'],
            'blocks' => [
                [
                    'id' => 'hero_2',
                    'type' => 'HeroBlock',
                    'props' => ['headline' => 'Winter Clearance'],
                    'styles' => [],
                ],
            ],
        ],
    ]);

    // Public visit to published page -> 200 OK
    $this->get('/smartwatch-deal')
        ->assertOk()
        ->assertSee('Exclusive Smartwatch');

    // Public visit to draft page -> 404 Not Found
    $this->get('/winter-sale')
        ->assertNotFound();

    // Public visit to non-existent page -> 404 Not Found
    $this->get('/non-existent-deal')
        ->assertNotFound();
});

test('admin can publish and unpublish landing pages with revision verification', function (): void {
    $page = LandingPage::create([
        'title' => 'Test Promo Page',
        'slug' => 'test-promo',
        'status' => 'draft',
    ]);

    // Publish action
    $publishResponse = $this->actingAs($this->superAdmin)
        ->post("/admin/landing-pages/{$page->id}/publish");

    $publishResponse->assertRedirect('/admin/landing-pages');
    $page->refresh();
    expect($page->status)->toBe('published')
        ->and($page->published_revision_id)->not->toBeNull();

    // Now publicly visible
    $this->get('/test-promo')->assertOk();

    // Unpublish action
    $unpublishResponse = $this->actingAs($this->superAdmin)
        ->post("/admin/landing-pages/{$page->id}/unpublish");

    $unpublishResponse->assertRedirect('/admin/landing-pages');
    $page->refresh();
    expect($page->status)->toBe('draft');

    // Now returns 404
    $this->get('/test-promo')->assertNotFound();
});

test('revisions on one landing page remain completely independent from other pages', function (): void {
    $pageA = LandingPage::create(['title' => 'Page A', 'slug' => 'page-a', 'status' => 'draft']);
    $pageB = LandingPage::create(['title' => 'Page B', 'slug' => 'page-b', 'status' => 'draft']);

    LandingPageRevision::create([
        'landing_page_id' => $pageA->id,
        'revision_number' => 1,
        'ast_content' => ['version' => 1, 'blocks' => []],
    ]);

    LandingPageRevision::create([
        'landing_page_id' => $pageB->id,
        'revision_number' => 1,
        'ast_content' => ['version' => 1, 'blocks' => []],
    ]);

    // Save a new revision on Page A
    $response = $this->actingAs($this->storeManager)
        ->postJson("/admin/landing-pages/{$pageA->id}/revisions", [
            'ast' => [
                'version' => 1,
                'settings' => ['primaryColor' => '#10b981'],
                'blocks' => [
                    [
                        'id' => 'hero_custom',
                        'type' => 'HeroBlock',
                        'props' => ['headline' => 'Updated Headline on Page A'],
                        'styles' => [],
                    ],
                ],
            ],
        ]);

    $response->assertCreated();

    // Page A has 2 revisions; Page B still has exactly 1 revision
    expect($pageA->revisions()->count())->toBe(2)
        ->and($pageB->revisions()->count())->toBe(1);

    // Latest revision on Page A has new headline; Page B is unaltered
    $latestRevA = $pageA->revisions()->orderByDesc('revision_number')->first();
    expect($latestRevA->ast_content['blocks'][0]['props']['headline'])->toBe('Updated Headline on Page A');
});

test('deleting a landing page cascades only its own revisions and protects other pages', function (): void {
    $pageA = LandingPage::create(['title' => 'Page A', 'slug' => 'page-a', 'status' => 'draft']);
    $pageB = LandingPage::create(['title' => 'Page B', 'slug' => 'page-b', 'status' => 'draft']);

    $revA1 = LandingPageRevision::create(['landing_page_id' => $pageA->id, 'revision_number' => 1, 'ast_content' => ['version' => 1, 'blocks' => []]]);
    $revA2 = LandingPageRevision::create(['landing_page_id' => $pageA->id, 'revision_number' => 2, 'ast_content' => ['version' => 1, 'blocks' => []]]);
    $revB1 = LandingPageRevision::create(['landing_page_id' => $pageB->id, 'revision_number' => 1, 'ast_content' => ['version' => 1, 'blocks' => []]]);

    $deleteResponse = $this->actingAs($this->superAdmin)
        ->delete("/admin/landing-pages/{$pageA->id}");

    $deleteResponse->assertRedirect('/admin/landing-pages');

    // Page A and its revisions are gone
    expect(LandingPage::find($pageA->id))->toBeNull()
        ->and(LandingPageRevision::find($revA1->id))->toBeNull()
        ->and(LandingPageRevision::find($revA2->id))->toBeNull();

    // Page B and its revision are completely intact
    expect(LandingPage::find($pageB->id))->not->toBeNull()
        ->and(LandingPageRevision::find($revB1->id))->not->toBeNull();
});

test('enforces RBAC permissions: fulfillment_agent and guests cannot manage landing pages', function (): void {
    $page = LandingPage::create(['title' => 'Protected Page', 'slug' => 'protected-page', 'status' => 'draft']);

    // 1. Guest -> redirect to login (302)
    $this->get('/admin/landing-pages')->assertRedirect('/login');
    $this->post('/admin/landing-pages', ['title' => 'New', 'slug' => 'new'])->assertRedirect('/login');
    $this->delete("/admin/landing-pages/{$page->id}")->assertRedirect('/login');

    // 2. Fulfillment Agent -> 403 Forbidden
    $this->actingAs($this->fulfillmentAgent)
        ->get('/admin/landing-pages')
        ->assertForbidden();

    $this->actingAs($this->fulfillmentAgent)
        ->post('/admin/landing-pages', ['title' => 'Agent Page', 'slug' => 'agent-page'])
        ->assertForbidden();

    $this->actingAs($this->fulfillmentAgent)
        ->put("/admin/landing-pages/{$page->id}", ['title' => 'Tampered Title', 'slug' => 'protected-page'])
        ->assertForbidden();

    $this->actingAs($this->fulfillmentAgent)
        ->post("/admin/landing-pages/{$page->id}/publish")
        ->assertForbidden();

    $this->actingAs($this->fulfillmentAgent)
        ->delete("/admin/landing-pages/{$page->id}")
        ->assertForbidden();

    $this->actingAs($this->fulfillmentAgent)
        ->get("/admin/landing-pages/{$page->id}/builder")
        ->assertForbidden();

    // 3. Super Admin & Store Manager -> Authorized
    $this->actingAs($this->storeManager)
        ->get('/admin/landing-pages')
        ->assertOk();

    $this->actingAs($this->superAdmin)
        ->get('/admin/landing-pages')
        ->assertOk();
});
