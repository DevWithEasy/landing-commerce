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

test('html block containing script tags returns HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_html_xss',
                'type' => 'HtmlBlock',
                'props' => [
                    'html' => '<div><h3>Promo</h3><script>alert("hacked")</script></div>',
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.props.html']);
});

test('html block containing inline onerror returns HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_html_onerror',
                'type' => 'HtmlBlock',
                'props' => [
                    'html' => '<img src="bad.jpg" onerror="alert(1)">',
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.props.html']);
});

test('html block with safe html and scoped css passes validation', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_html_safe',
                'type' => 'HtmlBlock',
                'props' => [
                    'html' => '<div class="custom-card"><h2 class="title">Safe Content</h2><p>Great product details</p></div>',
                    'css' => '.custom-card { padding: 20px; } .title { color: #16a34a; font-weight: bold; }',
                ],
                'styles' => [
                    'paddingTop' => '24px',
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(201)
        ->assertJsonPath('success', true);
});

test('old flat AST without children field passes validation and backward compatibility is preserved', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            validHeroBlock(),
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(201)
        ->assertJsonPath('success', true);
});

test('valid nested container with heading, text, image, and button passes validation', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_container_1',
                'type' => 'ContainerBlock',
                'props' => [
                    'direction' => 'column',
                    'gap' => '20px',
                ],
                'styles' => [
                    'paddingTop' => '30px',
                    'paddingBottom' => '30px',
                    'display' => 'flex',
                ],
                'children' => [
                    [
                        'id' => 'blk_heading_1',
                        'type' => 'HeadingBlock',
                        'props' => [
                            'text' => 'Premium Smartwatch 2026',
                            'tag' => 'h1',
                            'align' => 'center',
                        ],
                        'styles' => [
                            'color' => '#0f172a',
                        ],
                    ],
                    [
                        'id' => 'blk_text_1',
                        'type' => 'TextBlock',
                        'props' => [
                            'content' => 'High quality craftsmanship guaranteed nationwide.',
                            'align' => 'center',
                        ],
                        'styles' => [
                            'color' => '#475569',
                        ],
                    ],
                    [
                        'id' => 'blk_image_1',
                        'type' => 'ImageBlock',
                        'props' => [
                            'imageUrl' => 'https://example.com/watch.webp',
                            'altText' => 'Watch Image',
                        ],
                        'styles' => [
                            'maxWidth' => '100%',
                        ],
                    ],
                    [
                        'id' => 'blk_btn_1',
                        'type' => 'ButtonBlock',
                        'props' => [
                            'text' => 'অর্ডার করুন এখনই',
                            'target' => '#cod-checkout',
                        ],
                        'styles' => [
                            'backgroundColor' => '#16a34a',
                        ],
                    ],
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(201)
        ->assertJsonPath('success', true);
});

test('unknown nested block type is rejected with HTTP 422 with accurate AST path', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_container_1',
                'type' => 'ContainerBlock',
                'props' => [],
                'styles' => [],
                'children' => [
                    [
                        'id' => 'blk_sub_unknown',
                        'type' => 'ArbitraryUnapprovedBlock',
                        'props' => [],
                        'styles' => [],
                    ],
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.children.0.type']);
});

test('invalid children type like string or number is rejected with HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_container_1',
                'type' => 'ContainerBlock',
                'props' => [],
                'styles' => [],
                'children' => 'not-an-array',
            ],
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.children']);
});

test('nested AST exceeding maximum depth of 5 is rejected with HTTP 422', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_lvl_1',
                'type' => 'ContainerBlock',
                'props' => [],
                'styles' => [],
                'children' => [
                    [
                        'id' => 'blk_lvl_2',
                        'type' => 'ContainerBlock',
                        'props' => [],
                        'styles' => [],
                        'children' => [
                            [
                                'id' => 'blk_lvl_3',
                                'type' => 'ContainerBlock',
                                'props' => [],
                                'styles' => [],
                                'children' => [
                                    [
                                        'id' => 'blk_lvl_4',
                                        'type' => 'ContainerBlock',
                                        'props' => [],
                                        'styles' => [],
                                        'children' => [
                                            [
                                                'id' => 'blk_lvl_5',
                                                'type' => 'ContainerBlock',
                                                'props' => [],
                                                'styles' => [],
                                                'children' => [
                                                    [
                                                        'id' => 'blk_lvl_6',
                                                        'type' => 'HeadingBlock',
                                                        'props' => ['text' => 'Too Deep'],
                                                        'styles' => [],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.children.0.children.0.children.0.children.0.children.0']);
});

test('nested block with malicious XSS script tag is rejected with HTTP 422 pointing to nested path', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_container_1',
                'type' => 'ContainerBlock',
                'props' => [],
                'styles' => [],
                'children' => [
                    [
                        'id' => 'blk_nested_heading',
                        'type' => 'HeadingBlock',
                        'props' => [
                            'text' => 'Heading with <script>alert("xss")</script>',
                        ],
                        'styles' => [],
                    ],
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['blocks.0.children.0.props.text']);
});

test('nested checkout block inside container correctly syncs product_id to landing page', function () {
    $secondProduct = Product::create([
        'title' => 'Wireless Noise Cancelling Earbuds',
        'slug' => 'wireless-earbuds-pro',
        'regular_price' => 3200.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_container_checkout',
                'type' => 'ContainerBlock',
                'props' => [],
                'styles' => [],
                'children' => [
                    [
                        'id' => 'blk_nested_checkout',
                        'type' => 'CodCheckoutBlock',
                        'props' => [
                            'productId' => $secondProduct->id,
                            'productIds' => [$secondProduct->id],
                        ],
                        'styles' => [],
                    ],
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $ast]
    );

    $response->assertStatus(201)
        ->assertJsonPath('success', true);

    $this->landingPage->refresh();
    expect($this->landingPage->product_id)->toBe($secondProduct->id);
});
