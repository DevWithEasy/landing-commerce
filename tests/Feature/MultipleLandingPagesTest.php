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
    $this->get('/p/smartwatch-deal')
        ->assertOk()
        ->assertSee('Exclusive Smartwatch');

    // Public visit to draft page -> 404 Not Found
    $this->get('/p/winter-sale')
        ->assertNotFound();

    // Public visit to non-existent page -> 404 Not Found
    $this->get('/p/non-existent-deal')
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
    $this->get('/p/test-promo')->assertOk();

    // Unpublish action
    $unpublishResponse = $this->actingAs($this->superAdmin)
        ->post("/admin/landing-pages/{$page->id}/unpublish");

    $unpublishResponse->assertRedirect('/admin/landing-pages');
    $page->refresh();
    expect($page->status)->toBe('draft');

    // Now returns 404
    $this->get('/p/test-promo')->assertNotFound();
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

test('saving builder revision immediately updates published_revision_id and syncs live page content', function (): void {
    $page = LandingPage::create([
        'title' => 'Live Sync Campaign',
        'slug' => 'live-sync-test',
        'status' => 'published',
        'product_id' => $this->productA->id,
    ]);

    // Initial revision #1
    $rev1 = LandingPageRevision::create([
        'landing_page_id' => $page->id,
        'revision_number' => 1,
        'ast_content' => [
            'version' => 1,
            'blocks' => [
                [
                    'id' => 'hero_1',
                    'type' => 'HeroBlock',
                    'props' => ['headline' => 'Initial Version Headline', 'ctaText' => 'Order Now', 'ctaTarget' => '#cod-checkout'],
                ],
            ],
        ],
    ]);
    $page->update(['published_revision_id' => $rev1->id]);

    // Verify initial live view has Initial Version Headline
    $this->get('/p/live-sync-test')
        ->assertOk()
        ->assertSee('Initial Version Headline');

    // Merchant edits and saves new revision in builder changing headline and selecting productB
    $updatedAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'hero_1',
                'type' => 'HeroBlock',
                'props' => ['headline' => 'Updated Live Headline After Edit', 'ctaText' => 'Order Now', 'ctaTarget' => '#cod-checkout'],
            ],
            [
                'id' => 'prod_1',
                'type' => 'ProductSelectorBlock',
                'props' => [
                    'productIds' => [$this->productB->id],
                    'productId' => $this->productB->id,
                    'selectionMode' => 'single',
                ],
            ],
        ],
    ];

    $saveResponse = $this->actingAs($this->storeManager)
        ->postJson("/admin/landing-pages/{$page->id}/revisions", [
            'ast' => $updatedAst,
        ]);

    $saveResponse->assertCreated()
        ->assertJson([
            'success' => true,
        ]);

    $page->refresh();
    expect($page->published_revision_id)->not->toBe($rev1->id)
        ->and($page->product_id)->toBe($this->productB->id);

    // Live page must immediately reflect the updated revision headline and product
    $this->get('/p/live-sync-test')
        ->assertOk()
        ->assertSee('Updated Live Headline After Edit')
        ->assertSee($this->productB->title);
});

test('public landing page renders multi-product in single (radio) and multiple (checkbox) modes', function (): void {
    $page = LandingPage::create([
        'title' => 'Multi Product Deal',
        'slug' => 'multi-prod-deal',
        'status' => 'published',
    ]);

    // 1. Radio mode (single selection)
    $radioAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'prod_blk',
                'type' => 'ProductSelectorBlock',
                'props' => [
                    'productIds' => [$this->productA->id, $this->productB->id],
                    'selectionMode' => 'single',
                ],
            ],
            [
                'id' => 'cod_blk',
                'type' => 'CodCheckoutBlock',
                'props' => [
                    'productIds' => [$this->productA->id, $this->productB->id],
                    'selectionMode' => 'single',
                ],
            ],
        ],
    ];

    $this->actingAs($this->superAdmin)
        ->postJson("/admin/landing-pages/{$page->id}/revisions", ['ast' => $radioAst])
        ->assertCreated();

    $radioResponse = $this->get('/p/multi-prod-deal');
    $radioResponse->assertOk()
        ->assertSee('type="radio"', false)
        ->assertSee($this->productA->title)
        ->assertSee($this->productB->title)
        ->assertSee('Radio Selection');

    // 2. Checkbox mode (multiple selection)
    $checkboxAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'prod_blk',
                'type' => 'ProductSelectorBlock',
                'props' => [
                    'productIds' => [$this->productA->id, $this->productB->id],
                    'selectionMode' => 'multiple',
                ],
            ],
            [
                'id' => 'cod_blk',
                'type' => 'CodCheckoutBlock',
                'props' => [
                    'productIds' => [$this->productA->id, $this->productB->id],
                    'selectionMode' => 'multiple',
                ],
            ],
        ],
    ];

    $this->actingAs($this->superAdmin)
        ->postJson("/admin/landing-pages/{$page->id}/revisions", ['ast' => $checkboxAst])
        ->assertCreated();

    $checkboxResponse = $this->get('/p/multi-prod-deal');
    $checkboxResponse->assertOk()
        ->assertSee('type="checkbox"', false)
        ->assertSee('Checkbox Selection')
        ->assertSee('Order Items (Check Multiple):');
});

test('admin can restore a historical revision and make it active live', function (): void {
    $page = LandingPage::create([
        'title' => 'Restore History Test',
        'slug' => 'restore-test-page',
        'status' => 'published',
    ]);

    // Revision 1
    $rev1 = LandingPageRevision::create([
        'landing_page_id' => $page->id,
        'revision_number' => 1,
        'ast_content' => [
            'version' => 1,
            'blocks' => [
                [
                    'id' => 'h1',
                    'type' => 'HeroBlock',
                    'props' => ['headline' => 'Original First Headline', 'ctaText' => 'Order', 'ctaTarget' => '#cod-checkout'],
                ],
            ],
        ],
        'created_by' => 'Admin',
    ]);
    $page->update(['published_revision_id' => $rev1->id]);

    // Revision 2 (Newer change)
    $rev2 = LandingPageRevision::create([
        'landing_page_id' => $page->id,
        'revision_number' => 2,
        'ast_content' => [
            'version' => 1,
            'blocks' => [
                [
                    'id' => 'h1',
                    'type' => 'HeroBlock',
                    'props' => ['headline' => 'Second Modified Headline', 'ctaText' => 'Order', 'ctaTarget' => '#cod-checkout'],
                ],
            ],
        ],
        'created_by' => 'Admin',
    ]);
    $page->update(['published_revision_id' => $rev2->id]);

    $this->get('/p/restore-test-page')->assertSee('Second Modified Headline');

    // Admin restores Revision 1
    $restoreResponse = $this->actingAs($this->superAdmin)
        ->postJson("/admin/landing-pages/{$page->id}/revisions/{$rev1->id}/restore");

    $restoreResponse->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $page->refresh();
    // Revision #3 should be created with Revision #1 content
    expect($page->revisions()->count())->toBe(3)
        ->and($page->published_revision_id)->not->toBe($rev2->id);

    // Live page must now render the restored original content
    $this->get('/p/restore-test-page')
        ->assertOk()
        ->assertSee('Original First Headline')
        ->assertDontSee('Second Modified Headline');
});
