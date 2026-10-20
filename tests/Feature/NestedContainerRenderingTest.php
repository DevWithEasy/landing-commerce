<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use App\Modules\PageBuilder\Services\BlockRendererService;
use Database\Seeders\BangladeshGeographicSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);

    $this->product = Product::create([
        'title' => 'Titanium Smartwatch Pro',
        'slug' => 'titanium-smartwatch-pro',
        'regular_price' => 5500.00,
        'sale_price' => 4500.00,
        'description' => 'Military grade titanium smartwatch with AMOLED display.',
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->landingPage = LandingPage::create([
        'product_id' => $this->product->id,
        'title' => 'Titanium Smartwatch Deal',
        'slug' => 'titanium-deal',
        'status' => 'published',
    ]);

    $this->renderer = app(BlockRendererService::class);
});

test('old flat AST without children renders completely and backwards compatibility is preserved', function () {
    $flatAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'hero_flat',
                'type' => 'HeroBlock',
                'props' => [
                    'headline' => 'Next-Gen Titanium Smartwatch',
                    'subheadline' => 'Exclusive Eid Campaign Offer',
                    'ctaText' => 'Order COD Now',
                    'ctaTarget' => '#cod-checkout',
                ],
                'styles' => [
                    'backgroundColor' => '#0f172a',
                ],
            ],
        ],
    ];

    LandingPageRevision::create([
        'landing_page_id' => $this->landingPage->id,
        'revision_number' => 1,
        'ast_content' => $flatAst,
    ]);

    $response = $this->get('/p/titanium-deal');

    $response->assertStatus(200);
    $response->assertSee('Next-Gen Titanium Smartwatch');
    $response->assertSee('Exclusive Eid Campaign Offer');
    $response->assertSee('Order COD Now');
});

test('nested container with heading, text, image, and button renders properly', function () {
    $nestedAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'main_container',
                'type' => 'ContainerBlock',
                'props' => [
                    'direction' => 'row',
                    'wrap' => 'wrap',
                    'justifyContent' => 'space-between',
                    'alignItems' => 'center',
                    'gap' => '24px',
                ],
                'styles' => [
                    'paddingTop' => '32px',
                    'paddingBottom' => '32px',
                ],
                'children' => [
                    [
                        'id' => 'heading_child',
                        'type' => 'HeadingBlock',
                        'props' => [
                            'text' => 'Premium Titanium Finish',
                            'tag' => 'h1',
                            'align' => 'center',
                            'color' => '#1e293b',
                        ],
                    ],
                    [
                        'id' => 'text_child',
                        'type' => 'TextBlock',
                        'props' => [
                            'content' => "First line of details.\nSecond line of description.",
                            'align' => 'left',
                            'color' => '#64748b',
                        ],
                    ],
                    [
                        'id' => 'image_child',
                        'type' => 'ImageBlock',
                        'props' => [
                            'imageUrl' => 'https://example.test/watch.webp',
                            'altText' => 'Watch Hero Image',
                            'caption' => 'Official 1-Year Warranty',
                            'linkUrl' => 'https://example.test/product-details',
                        ],
                    ],
                    [
                        'id' => 'button_child',
                        'type' => 'ButtonBlock',
                        'props' => [
                            'text' => 'ক্যাশ অন ডেলিভারিতে অর্ডার করুন',
                            'target' => '#cod-checkout',
                            'size' => 'xl',
                            'backgroundColor' => '#16a34a',
                            'pulseAnimation' => true,
                        ],
                    ],
                ],
            ],
        ],
    ];

    LandingPageRevision::create([
        'landing_page_id' => $this->landingPage->id,
        'revision_number' => 1,
        'ast_content' => $nestedAst,
    ]);

    $response = $this->get('/p/titanium-deal');

    $response->assertStatus(200);

    // Assert container and flex attributes
    $response->assertSee('lc-container');
    $response->assertSee('flex-direction: row', false);
    $response->assertSee('gap: 24px', false);

    // Assert heading
    $response->assertSee('<h1', false);
    $response->assertSee('Premium Titanium Finish');

    // Assert text block with preserved line break
    $response->assertSee('First line of details.<br />', false);
    $response->assertSee('Second line of description.');

    // Assert image with alt and caption
    $response->assertSee('src="https://example.test/watch.webp"', false);
    $response->assertSee('alt="Watch Hero Image"', false);
    $response->assertSee('Official 1-Year Warranty');

    // Assert button
    $response->assertSee('href="#cod-checkout"', false);
    $response->assertSee('ক্যাশ অন ডেলিভারিতে অর্ডার করুন');
    $response->assertSee('animate-pulse');
});

test('multi-level nested containers render recursively', function () {
    $multiLevelAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'outer_container',
                'type' => 'ContainerBlock',
                'props' => ['direction' => 'column'],
                'children' => [
                    [
                        'id' => 'inner_container_1',
                        'type' => 'ContainerBlock',
                        'props' => ['direction' => 'row'],
                        'children' => [
                            [
                                'id' => 'deep_heading',
                                'type' => 'HeadingBlock',
                                'props' => [
                                    'text' => 'Deep Level 3 Heading',
                                    'tag' => 'h3',
                                ],
                            ],
                            [
                                'id' => 'deep_text',
                                'type' => 'TextBlock',
                                'props' => [
                                    'content' => 'Deep Level 3 Paragraph Text',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ];

    $html = $this->renderer->renderAst($multiLevelAst);

    expect($html)->toContain('Deep Level 3 Heading');
    expect($html)->toContain('<h3');
    expect($html)->toContain('Deep Level 3 Paragraph Text');
    expect(substr_count($html, 'lc-container'))->toBe(2);
});

test('malicious script tags and event handlers in nested widget props are strictly escaped', function () {
    $xssAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'xss_container',
                'type' => 'ContainerBlock',
                'props' => [],
                'children' => [
                    [
                        'id' => 'xss_heading',
                        'type' => 'HeadingBlock',
                        'props' => [
                            'text' => '<script>alert("heading-xss")</script>',
                            'tag' => 'h2',
                        ],
                    ],
                    [
                        'id' => 'xss_text',
                        'type' => 'TextBlock',
                        'props' => [
                            'content' => '<img src=x onerror=alert("text-xss")>',
                        ],
                    ],
                ],
            ],
        ],
    ];

    $html = $this->renderer->renderAst($xssAst);

    // Unescaped script or event handler must never appear
    expect($html)->not->toContain('<script>alert("heading-xss")</script>');
    expect($html)->not->toContain('<img src=x onerror=alert("text-xss")>');

    // Safe escaped output must be present
    expect($html)->toContain('&lt;script&gt;alert(&quot;heading-xss&quot;)&lt;/script&gt;');
    expect($html)->toContain('&lt;img src=x onerror=alert(&quot;text-xss&quot;)&gt;');
});

test('malicious javascript and data URLs in button and image targets are sanitized', function () {
    $maliciousUrlAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'url_container',
                'type' => 'ContainerBlock',
                'props' => [],
                'children' => [
                    [
                        'id' => 'bad_btn',
                        'type' => 'ButtonBlock',
                        'props' => [
                            'text' => 'Click Me',
                            'target' => 'javascript:alert("pwned")',
                        ],
                    ],
                    [
                        'id' => 'bad_img',
                        'type' => 'ImageBlock',
                        'props' => [
                            'imageUrl' => 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
                            'linkUrl' => 'vbscript:msgbox(1)',
                            'altText' => 'Injected Alt',
                        ],
                    ],
                ],
            ],
        ],
    ];

    $html = $this->renderer->renderAst($maliciousUrlAst);

    expect($html)->not->toContain('javascript:alert');
    expect($html)->not->toContain('data:text/html');
    expect($html)->not->toContain('vbscript:msgbox');
    expect($html)->toContain('href="#"');
});

test('heading block strictly validates allowed HTML tags (h1-h6) and defaults to h2', function () {
    $invalidTagAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'script_tag_heading',
                'type' => 'HeadingBlock',
                'props' => [
                    'text' => 'Injected Tag Attempt',
                    'tag' => 'script',
                ],
            ],
            [
                'id' => 'div_tag_heading',
                'type' => 'HeadingBlock',
                'props' => [
                    'text' => 'Non Heading Tag Attempt',
                    'tag' => 'div',
                ],
            ],
        ],
    ];

    $html = $this->renderer->renderAst($invalidTagAst);

    expect($html)->not->toContain('<script');
    expect($html)->toContain('<h2');
    expect($html)->toContain('Injected Tag Attempt');
    expect($html)->toContain('Non Heading Tag Attempt');
});

test('unknown or unapproved nested blocks are safely ignored without breaking the page', function () {
    $unknownAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'cnt_1',
                'type' => 'ContainerBlock',
                'props' => [],
                'children' => [
                    [
                        'id' => 'valid_hd',
                        'type' => 'HeadingBlock',
                        'props' => ['text' => 'Valid Heading Beside Unknown'],
                    ],
                    [
                        'id' => 'unapproved_child',
                        'type' => 'RawArbitraryCodeWidget',
                        'props' => ['code' => 'system("rm -rf /")'],
                    ],
                ],
            ],
        ],
    ];

    $html = $this->renderer->renderAst($unknownAst);

    expect($html)->toContain('Valid Heading Beside Unknown');
    expect($html)->not->toContain('system("rm -rf /")');
});

test('full builder lifecycle: authenticated user saves nested revision, reloads, views public page with product binding, and restores revision', function () {
    $admin = User::factory()->create([
        'email' => 'builder_admin@example.com',
    ]);

    // 1. Authenticated user can open builder UI
    $builderResponse = $this->actingAs($admin)->get("/admin/landing-pages/{$this->landingPage->id}/builder");
    $builderResponse->assertStatus(200);

    // 2. User creates a nested AST containing Container with Heading, Text, Button, and Monolithic ProductSelector & CodCheckout
    $nestedAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'blk_cnt_hero',
                'type' => 'ContainerBlock',
                'props' => [
                    'direction' => 'column',
                    'justifyContent' => 'center',
                    'alignItems' => 'center',
                    'gap' => '16px',
                ],
                'children' => [
                    [
                        'id' => 'blk_hd_1',
                        'type' => 'HeadingBlock',
                        'props' => [
                            'text' => 'Premium Wireless Headphone',
                            'tag' => 'h1',
                            'align' => 'center',
                        ],
                    ],
                    [
                        'id' => 'blk_txt_1',
                        'type' => 'TextBlock',
                        'props' => [
                            'content' => 'High fidelity sound with active noise cancellation.',
                            'align' => 'center',
                        ],
                    ],
                    [
                        'id' => 'blk_btn_1',
                        'type' => 'ButtonBlock',
                        'props' => [
                            'text' => 'Order COD Now',
                            'target' => '#cod-checkout',
                            'pulseAnimation' => true,
                        ],
                    ],
                ],
            ],
            [
                'id' => 'blk_prod_selector',
                'type' => 'ProductSelectorBlock',
                'props' => [
                    'productId' => $this->product->id,
                    'headline' => 'Choose Your Package',
                ],
            ],
            [
                'id' => 'blk_cod_checkout',
                'type' => 'CodCheckoutBlock',
                'props' => [
                    'productId' => $this->product->id,
                    'headline' => 'Cash On Delivery Checkout',
                ],
            ],
        ],
    ];

    // 3. User saves the revision via POST endpoint
    $saveResponse = $this->actingAs($admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $nestedAst]
    );

    $saveResponse->assertStatus(201);
    $saveResponse->assertJson(['success' => true]);

    $data = $saveResponse->json();
    $revId = $data['revision']['id'];
    expect($revId)->toBeGreaterThan(0);

    // 4. Verify landing page product binding was automatically synchronized
    $this->landingPage->refresh();
    expect($this->landingPage->product_id)->toBe($this->product->id);
    expect($this->landingPage->published_revision_id)->toBe($revId);

    // 5. Verify public landing page renders the nested blocks and monolithic blocks
    $publicResponse = $this->get("/p/{$this->landingPage->slug}");
    $publicResponse->assertStatus(200);
    $publicResponse->assertSee('Premium Wireless Headphone');
    $publicResponse->assertSee('High fidelity sound with active noise cancellation.');
    $publicResponse->assertSee('Order COD Now');
    $publicResponse->assertSee('Titanium Smartwatch Pro');

    // 6. Test revision history restore
    // Save revision 2 with different title
    $nestedAst2 = $nestedAst;
    $nestedAst2['blocks'][0]['children'][0]['props']['text'] = 'Updated Title Rev 2';
    $save2Response = $this->actingAs($admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions",
        ['ast' => $nestedAst2]
    );
    $save2Response->assertStatus(201);
    $rev2Id = $save2Response->json()['revision']['id'];

    $publicResponse2 = $this->get("/p/{$this->landingPage->slug}");
    $publicResponse2->assertSee('Updated Title Rev 2');

    // Restore back to revision 1
    $restoreResponse = $this->actingAs($admin)->postJson(
        "/admin/landing-pages/{$this->landingPage->id}/revisions/{$revId}/restore"
    );
    $restoreResponse->assertStatus(200);
    $restoreResponse->assertJson(['success' => true]);

    // Verify public page now shows restored revision 1 content
    $publicResponseRestored = $this->get("/p/{$this->landingPage->slug}");
    $publicResponseRestored->assertSee('Premium Wireless Headphone');
    $publicResponseRestored->assertDontSee('Updated Title Rev 2');
});
