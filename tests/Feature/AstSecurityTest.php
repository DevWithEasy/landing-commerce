<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Services\PageAstValidator;
use Database\Seeders\BangladeshGeographicSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);

    $this->admin = User::factory()->create([
        'name' => 'Store Admin',
        'email' => 'admin@landingcommerce.test',
        'role' => 'super_admin',
    ]);

    $this->product = Product::create([
        'title' => 'Leather Messenger Bag',
        'slug' => 'leather-messenger-bag',
        'regular_price' => 4500.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->landingPage = LandingPage::create([
        'product_id' => $this->product->id,
        'title' => 'Premium Messenger Bag Campaign',
        'slug' => 'leather-messenger-bag-sale',
        'status' => 'published',
    ]);

    $this->validator = app(PageAstValidator::class);
});

function validHeroBlock(array $overrides = []): array
{
    return array_replace_recursive([
        'id' => 'blk_hero_test',
        'type' => 'HeroBlock',
        'props' => [
            'headline' => 'Authentic Leather Messenger Bag',
            'subheadline' => 'Handcrafted full-grain leather with nationwide cash on delivery.',
            'ctaText' => 'Order Now',
            'ctaTarget' => '#cod-checkout',
            'badgeText' => 'Special Eid Offer',
        ],
        'styles' => [
            'backgroundColor' => '#f8fafc',
            'paddingTop' => '40px',
            'paddingBottom' => '40px',
            'color' => '#111827',
        ],
    ], $overrides);
}

test('payload containing script tags in props returns HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            validHeroBlock([
                'props' => [
                    'headline' => 'Special Offer <script>alert("xss")</script>',
                ],
            ]),
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.props.headline']);
});

test('payload containing inline event handlers like onerror returns HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            validHeroBlock([
                'props' => [
                    'subheadline' => 'Great product <img src="invalid" onerror=alert(1)>',
                ],
            ]),
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.props.subheadline']);
});

test('payload containing javascript pseudoprotocol in links or ctaTarget returns HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            validHeroBlock([
                'props' => [
                    'ctaTarget' => 'javascript:alert(document.cookie)',
                ],
            ]),
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.props.ctaTarget']);
});

test('payload containing data url protocol returns HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            validHeroBlock([
                'props' => [
                    'ctaTarget' => 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
                ],
            ]),
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.props.ctaTarget']);
});

test('payload containing vbscript protocol returns HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            validHeroBlock([
                'props' => [
                    'ctaTarget' => 'vbscript:msgbox("hello")',
                ],
            ]),
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.props.ctaTarget']);
});

test('payload containing unapproved block type is rejected with HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_evil_01',
                'type' => 'ArbitraryHtmlBlock',
                'props' => ['rawHtml' => '<div>Custom Content</div>'],
                'styles' => [],
            ],
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.type']);
});

test('payload containing disallowed CSS property returns HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            validHeroBlock([
                'styles' => [
                    'cursor' => 'pointer', // not in allowed styling whitelist
                ],
            ]),
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.styles.cursor']);
});

test('payload containing position fixed on HeroBlock is rejected with HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            validHeroBlock([
                'styles' => [
                    'position' => 'fixed',
                ],
            ]),
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.styles.position']);
});

test('position fixed is permitted exclusively on StickyBarBlock', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_sticky_01',
                'type' => 'StickyBarBlock',
                'props' => [
                    'message' => '50% Off Today Only!',
                    'buttonText' => 'Claim Offer',
                    'buttonTarget' => '#cod-checkout',
                ],
                'styles' => [
                    'position' => 'fixed',
                    'backgroundColor' => '#0f172a',
                    'color' => '#ffffff',
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(201);
});

test('payload with z-index greater than 50 is rejected with HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            validHeroBlock([
                'styles' => [
                    'zIndex' => 9999, // overlay clickjacking vector
                ],
            ]),
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.styles.zIndex']);
});

test('payload with CSS expression or import is rejected with HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            validHeroBlock([
                'styles' => [
                    'backgroundColor' => 'expression(alert(1))',
                ],
            ]),
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.styles.backgroundColor']);
});

test('valid AST with all 9 approved block types passes validation and creates revision', function () {
    $blocks = [
        [
            'id' => 'blk_hero_01',
            'type' => 'HeroBlock',
            'props' => [
                'headline' => 'Handmade Leather Bag',
                'ctaText' => 'Buy Now',
                'ctaTarget' => '#checkout',
            ],
            'styles' => ['paddingTop' => '32px'],
        ],
        [
            'id' => 'blk_product_02',
            'type' => 'ProductSelectorBlock',
            'props' => [
                'productId' => $this->product->id,
                'showPrice' => true,
            ],
            'styles' => ['maxWidth' => '1000px'],
        ],
        [
            'id' => 'blk_cod_03',
            'type' => 'CodCheckoutBlock',
            'props' => [
                'productId' => $this->product->id,
                'buttonText' => 'Confirm Order',
            ],
            'styles' => ['borderColor' => '#16a34a', 'borderWidth' => '2px'],
        ],
        [
            'id' => 'blk_benefits_04',
            'type' => 'BenefitsGridBlock',
            'props' => [
                'title' => 'Why Choose Us',
                'items' => [
                    ['id' => 'b1', 'title' => '100% Leather', 'description' => 'Real full-grain leather.'],
                    ['id' => 'b2', 'title' => 'Cash on Delivery', 'description' => 'Pay upon receiving parcel.'],
                ],
            ],
            'styles' => ['backgroundColor' => '#f9fafb'],
        ],
        [
            'id' => 'blk_reviews_05',
            'type' => 'ReviewsBlock',
            'props' => [
                'title' => 'Customer Reviews',
                'items' => [
                    ['id' => 'r1', 'authorName' => 'Tariq Islam', 'rating' => 5, 'comment' => 'Fantastic bag!'],
                ],
            ],
            'styles' => ['paddingBottom' => '24px'],
        ],
        [
            'id' => 'blk_video_06',
            'type' => 'VideoBlock',
            'props' => [
                'videoUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'aspectRatio' => '16:9',
            ],
            'styles' => ['maxWidth' => '800px'],
        ],
        [
            'id' => 'blk_faq_07',
            'type' => 'FaqBlock',
            'props' => [
                'title' => 'Frequently Asked Questions',
                'items' => [
                    ['id' => 'f1', 'question' => 'How long does delivery take?', 'answer' => '24-48 hours inside Dhaka.'],
                ],
            ],
            'styles' => ['color' => '#1f2937'],
        ],
        [
            'id' => 'blk_timer_08',
            'type' => 'CountdownTimerBlock',
            'props' => [
                'targetDate' => now()->addDays(2)->toIso8601String(),
                'headline' => 'Flash Sale Ending Soon!',
            ],
            'styles' => ['backgroundColor' => '#fee2e2'],
        ],
        [
            'id' => 'blk_sticky_09',
            'type' => 'StickyBarBlock',
            'props' => [
                'message' => 'Cash on Delivery Nationwide!',
                'buttonText' => 'Order Now',
                'buttonTarget' => 'tel:01711223344',
            ],
            'styles' => ['position' => 'fixed', 'zIndex' => 40],
        ],
    ];

    $ast = [
        'version' => 1,
        'settings' => [
            'primaryColor' => '#16a34a',
            'fontFamily' => 'Inter',
            'containerMaxWidth' => '1200px',
        ],
        'blocks' => $blocks,
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('revision.revision_number', 1);

    expect($this->landingPage->revisions)->toHaveCount(1);
    $savedAst = $this->landingPage->revisions->first()->ast_content;
    expect(count($savedAst['blocks']))->toBe(9);
});
