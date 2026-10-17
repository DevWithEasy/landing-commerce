<?php

declare(strict_types=1);

use App\Modules\Catalog\Models\Product;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
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
        'description' => 'Military grade titanium smartwatch with AMOLED display and heart rate monitoring.',
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->publishedPage = LandingPage::create([
        'product_id' => $this->product->id,
        'title' => 'Titanium Smartwatch Exclusive Campaign',
        'slug' => 'smartwatch-deal',
        'status' => 'published',
        'meta_seo' => [
            'title' => 'Special Eid Launch - Titanium Smartwatch ৳4,500',
            'description' => 'Fast cash on delivery across Bangladesh with 1-year official warranty.',
            'keywords' => 'smartwatch, bangladesh, cod',
        ],
    ]);

    $this->sampleAst = [
        'version' => 1,
        'settings' => [
            'primaryColor' => '#059669',
            'fontFamily' => 'Outfit, sans-serif',
            'backgroundColor' => '#f8fafc',
        ],
        'blocks' => [
            [
                'id' => 'hero_blk',
                'type' => 'HeroBlock',
                'props' => [
                    'headline' => 'Next-Gen Titanium Smartwatch',
                    'subheadline' => 'Super AMOLED display with 7-day battery life.',
                    'ctaText' => 'Order COD Now',
                    'ctaTarget' => '#cod-checkout',
                    'badgeText' => 'Limited Eid Offer',
                ],
                'styles' => [
                    'backgroundColor' => '#0f172a',
                    'paddingTop' => '60px',
                ],
            ],
            [
                'id' => 'prod_blk',
                'type' => 'ProductSelectorBlock',
                'props' => [
                    'productId' => $this->product->id,
                    'showPrice' => true,
                    'showDescription' => true,
                ],
            ],
            [
                'id' => 'benefits_blk',
                'type' => 'BenefitsGridBlock',
                'props' => [
                    'title' => 'Why Choose Titanium Pro',
                    'columns' => 3,
                    'items' => [
                        ['id' => '1', 'title' => 'AMOLED Display', 'description' => 'Crisp sunlight readability.'],
                        ['id' => '2', 'title' => 'IP68 Waterproof', 'description' => 'Swim proof up to 50 meters.'],
                        ['id' => '3', 'title' => 'Official Warranty', 'description' => '12 months instant replacement.'],
                    ],
                ],
            ],
            [
                'id' => 'reviews_blk',
                'type' => 'ReviewsBlock',
                'props' => [
                    'title' => 'Loved by 5,000+ Customers',
                    'items' => [
                        [
                            'id' => '1',
                            'authorName' => 'Tanvir Ahmed',
                            'location' => 'Chittagong',
                            'rating' => 5,
                            'comment' => 'Received within 2 days in Chittagong. Outstanding build quality!',
                            'verifiedPurchase' => true,
                        ],
                    ],
                ],
            ],
            [
                'id' => 'video_blk',
                'type' => 'VideoBlock',
                'props' => [
                    'videoUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    'aspectRatio' => '16:9',
                ],
            ],
            [
                'id' => 'faq_blk',
                'type' => 'FaqBlock',
                'props' => [
                    'title' => 'Frequently Asked Questions',
                    'items' => [
                        [
                            'id' => '1',
                            'question' => 'Can I inspect the package before paying?',
                            'answer' => 'Yes, our delivery hero will wait while you open and verify the watch.',
                        ],
                    ],
                ],
            ],
            [
                'id' => 'countdown_blk',
                'type' => 'CountdownTimerBlock',
                'props' => [
                    'targetDate' => date('Y-m-d\TH:i:s\Z', time() + 86400 * 3),
                    'headline' => 'Eid Discount Concluding Soon',
                    'urgencyText' => 'Only 14 units left at promotional price!',
                ],
            ],
            [
                'id' => 'cod_blk',
                'type' => 'CodCheckoutBlock',
                'props' => [
                    'productId' => $this->product->id,
                    'buttonText' => 'Confirm Watch Order - Cash on Delivery',
                ],
            ],
            [
                'id' => 'sticky_blk',
                'type' => 'StickyBarBlock',
                'props' => [
                    'message' => 'Eid Super Deal: Free delivery nationwide today!',
                    'buttonText' => 'Order Now',
                    'buttonTarget' => '#cod-checkout',
                    'placement' => 'bottom',
                ],
            ],
        ],
    ];

    $this->revision = LandingPageRevision::create([
        'landing_page_id' => $this->publishedPage->id,
        'revision_number' => 1,
        'ast_content' => $this->sampleAst,
        'created_by' => 'System',
    ]);

    $this->publishedPage->update([
        'published_revision_id' => $this->revision->id,
    ]);
});

test('public published landing page resolves dynamically and renders all 9 blocks in SSR', function () {
    $response = $this->get('/smartwatch-deal');

    $response->assertStatus(200);

    // Verify SEO metadata
    $response->assertSee('Special Eid Launch - Titanium Smartwatch ৳4,500');
    $response->assertSee('Fast cash on delivery across Bangladesh with 1-year official warranty.');
    $response->assertSee('--primary-color: #059669', false);

    // Verify all 9 blocks rendered
    $response->assertSee('Next-Gen Titanium Smartwatch'); // HeroBlock
    $response->assertSee('Titanium Smartwatch Pro'); // ProductSelectorBlock
    $response->assertSee('4,500'); // Product Price
    $response->assertSee('Why Choose Titanium Pro'); // BenefitsGridBlock
    $response->assertSee('Loved by 5,000+ Customers'); // ReviewsBlock
    $response->assertSee('Tanvir Ahmed'); // Review author
    $response->assertSee('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0'); // VideoBlock
    $response->assertSee('Can I inspect the package before paying?'); // FaqBlock
    $response->assertSee('Eid Discount Concluding Soon'); // CountdownTimerBlock
    $response->assertSee('Confirm Watch Order - Cash on Delivery'); // CodCheckoutBlock
    $response->assertSee('Eid Super Deal: Free delivery nationwide today!'); // StickyBarBlock
});

test('draft or archived landing pages return HTTP 404', function () {
    $draftPage = LandingPage::create([
        'product_id' => $this->product->id,
        'title' => 'Draft Campaign',
        'slug' => 'draft-campaign-slug',
        'status' => 'draft',
    ]);

    $response = $this->get('/draft-campaign-slug');
    $response->assertStatus(404);

    $draftPage->update(['status' => 'archived']);
    $responseArchived = $this->get('/draft-campaign-slug');
    $responseArchived->assertStatus(404);
});

test('non-existent landing page slug returns HTTP 404', function () {
    $response = $this->get('/random-non-existent-campaign-page');
    $response->assertStatus(404);
});

test('landing page without any revision returns HTTP 404', function () {
    $emptyPage = LandingPage::create([
        'product_id' => $this->product->id,
        'title' => 'Empty Campaign',
        'slug' => 'empty-campaign',
        'status' => 'published',
        'published_revision_id' => null,
    ]);

    $response = $this->get('/empty-campaign');
    $response->assertStatus(404);
});

test('reserved system routes are never intercepted by landing page dynamic router', function () {
    // Checkout route remains functional
    $checkoutResponse = $this->get('/checkout');
    $checkoutResponse->assertStatus(200);

    // Login route remains functional
    $loginResponse = $this->get('/login');
    $loginResponse->assertStatus(401);

    // Root route remains functional
    $rootResponse = $this->get('/');
    $rootResponse->assertStatus(200)->assertJson(['status' => 'ok']);

    // Direct match against reserved keywords returns 404 if not defined
    $reservedResponse = $this->get('/admin');
    // /admin redirects to login or admin dashboard, never captured by landing-page.show
    expect($reservedResponse->status())->toBeIn([302, 401, 200]);
});

test('unapproved or malicious blocks in AST are ignored safely without executing arbitrary HTML', function () {
    $maliciousAst = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'hero_safe',
                'type' => 'HeroBlock',
                'props' => [
                    'headline' => 'Authentic Watch Deal',
                    'ctaText' => 'Buy Now',
                    'ctaTarget' => '#cod-checkout',
                ],
            ],
            [
                'id' => 'unapproved_blk',
                'type' => 'RawMerchantHtmlBlock',
                'props' => [
                    'html' => '<script>window.location="https://malicious.test"</script>',
                ],
            ],
        ],
    ];

    $maliciousRevision = LandingPageRevision::create([
        'landing_page_id' => $this->publishedPage->id,
        'revision_number' => 2,
        'ast_content' => $maliciousAst,
        'created_by' => 'Tester',
    ]);

    $this->publishedPage->update([
        'published_revision_id' => $maliciousRevision->id,
    ]);

    $response = $this->get('/smartwatch-deal');
    $response->assertStatus(200);
    $response->assertSee('Authentic Watch Deal');
    $response->assertDontSee('<script>window.location="https://malicious.test"</script>', false);
});
