<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use Database\Seeders\BangladeshGeographicSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);

    $this->superAdmin = User::factory()->create([
        'name' => 'Super Administrator',
        'email' => 'superadmin@landingcommerce.test',
        'role' => 'super_admin',
    ]);

    $this->storeManager = User::factory()->create([
        'name' => 'Store Manager',
        'email' => 'manager@landingcommerce.test',
        'role' => 'store_manager',
    ]);

    $this->fulfillmentAgent = User::factory()->create([
        'name' => 'Fulfillment Agent',
        'email' => 'agent@landingcommerce.test',
        'role' => 'fulfillment_agent',
    ]);

    $this->product = Product::create([
        'title' => 'Ergonomic Standing Desk',
        'slug' => 'ergonomic-standing-desk',
        'regular_price' => 18500.00,
        'sale_price' => 16500.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->landingPage = LandingPage::create([
        'product_id' => $this->product->id,
        'title' => 'Standing Desk Campaign',
        'slug' => 'standing-desk-deal',
        'status' => 'draft',
    ]);
});

test('unauthenticated users cannot access visual page builder', function () {
    $response = $this->get("/admin/landing-pages/{$this->landingPage->id}/builder");
    $response->assertRedirect('/login');
});

test('fulfillment agents without landing page authorization receive HTTP 403', function () {
    $response = $this->actingAs($this->fulfillmentAgent)
        ->get("/admin/landing-pages/{$this->landingPage->id}/builder");

    $response->assertStatus(403);
});

test('super admin and store manager can access visual page builder with correct inertia props', function () {
    $response = $this->actingAs($this->storeManager)
        ->get("/admin/landing-pages/{$this->landingPage->id}/builder");

    $response->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Builder/Editor')
            ->has('landingPage', fn (Assert $lp) => $lp
                ->where('id', $this->landingPage->id)
                ->where('title', 'Standing Desk Campaign')
                ->where('slug', 'standing-desk-deal')
                ->etc()
            )
            ->has('initialAst', fn (Assert $ast) => $ast
                ->has('version')
                ->has('blocks')
                ->etc()
            )
            ->has('blockDefinitions')
            ->has('products')
        );
});

test('builder preloads latest revision ast if available', function () {
    $customAst = [
        'version' => 1,
        'settings' => ['primaryColor' => '#2563eb'],
        'blocks' => [
            [
                'id' => 'custom_hero_1',
                'type' => 'HeroBlock',
                'props' => [
                    'headline' => 'Custom Preloaded Headline',
                    'ctaText' => 'Order Today',
                    'ctaTarget' => '#cod-checkout',
                ],
                'styles' => ['backgroundColor' => '#f1f5f9'],
            ],
        ],
    ];

    LandingPageRevision::create([
        'landing_page_id' => $this->landingPage->id,
        'revision_number' => 1,
        'ast_content' => $customAst,
        'created_by' => 'Store Manager',
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->get("/admin/landing-pages/{$this->landingPage->id}/builder");

    $response->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Builder/Editor')
            ->where('initialAst.blocks.0.props.headline', 'Custom Preloaded Headline')
        );
});

test('builder saves valid revision and increments revision number', function () {
    $astPayload = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'hero_new',
                'type' => 'HeroBlock',
                'props' => [
                    'headline' => 'Next Generation Standing Desk',
                    'subheadline' => 'Dual motor silent height adjustment with nationwide COD.',
                    'ctaText' => 'Shop Now',
                    'ctaTarget' => '#cod-checkout',
                ],
                'styles' => [
                    'backgroundColor' => '#0f172a',
                    'paddingTop' => '50px',
                ],
            ],
            [
                'id' => 'cod_new',
                'type' => 'CodCheckoutBlock',
                'props' => [
                    'productId' => $this->product->id,
                    'buttonText' => 'Order Desk Cash On Delivery',
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->superAdmin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $astPayload]
    );

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Revision #1 saved successfully.',
        ]);

    $this->assertDatabaseHas('landing_page_revisions', [
        'landing_page_id' => $this->landingPage->id,
        'revision_number' => 1,
        'created_by' => 'Super Administrator',
    ]);
});

test('builder rejects revision with invalid block type or malicious html', function () {
    $maliciousAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'evil_1',
                'type' => 'HeroBlock',
                'props' => [
                    'headline' => 'Hacked <script>alert("xss")</script>',
                    'ctaText' => 'Click',
                    'ctaTarget' => 'javascript:steal()',
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->storeManager)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $maliciousAst]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.props.headline']);
});
