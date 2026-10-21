<?php

declare(strict_types=1);

use App\Modules\Catalog\Models\Product;
use App\Modules\PageBuilder\Services\BlockRegistry;
use App\Modules\PageBuilder\Services\BlockRendererService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->renderer = app(BlockRendererService::class);

    $this->product = Product::create([
        'title' => 'Executive Leather Backpack',
        'slug' => 'executive-leather-backpack',
        'regular_price' => 3800.00,
        'sale_price' => 3200.00,
        'description' => 'Waterproof genuine leather backpack with 15.6 inch laptop compartment.',
        'has_variants' => false,
        'status' => 'active',
    ]);
});

test('block registry returns all 18 approved blocks with complete schema definitions', function () {
    $blocks = BlockRegistry::APPROVED_BLOCKS;
    expect($blocks)->toHaveCount(18);

    $definitions = BlockRegistry::getAllBlockDefinitions();
    expect($definitions)->toHaveCount(18);

    foreach ($blocks as $blockType) {
        expect(BlockRegistry::isApproved($blockType))->toBeTrue();

        $defaultProps = BlockRegistry::getDefaultProps($blockType);
        expect($defaultProps)->toBeArray();

        $defaultStyles = BlockRegistry::getDefaultStyles($blockType);
        expect($defaultStyles)->toBeArray();

        expect($definitions)->toHaveKey($blockType);
        expect($definitions[$blockType])->toHaveKeys(['type', 'name', 'category', 'defaultProps', 'defaultStyles']);
    }
});

test('feature list block defaults to a title and two list items', function () {
    $props = BlockRegistry::getDefaultProps('IconListBlock');

    expect($props['title'])->toBe('Title')
        ->and($props['listType'])->toBe('ul')
        ->and($props['showMarkers'])->toBeTrue()
        ->and($props['itemSpacing'])->toBe(12)
        ->and($props['items'])->toHaveCount(2)
        ->and($props['items'][0]['text'])->toBe('List Item 01')
        ->and($props['items'][1]['text'])->toBe('List Item 2');
});

test('feature list supports adjustable spacing between items', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'icon-list-spacing',
        'type' => 'IconListBlock',
        'props' => [
            'title' => 'Feature Spacing',
            'itemSpacing' => 28,
            'items' => [
                ['id' => '1', 'text' => 'First feature'],
                ['id' => '2', 'text' => 'Second feature'],
            ],
        ],
    ]);

    expect($html)
        ->toContain('row-gap: 28px')
        ->toContain('First feature')
        ->toContain('Second feature');
});

test('accordion block defaults to a title and one editable item', function () {
    $props = BlockRegistry::getDefaultProps('AccordionBlock');

    expect($props['title'])->toBe('Title')
        ->and($props['items'])->toHaveCount(1)
        ->and($props['items'][0]['title'])->not->toBeEmpty()
        ->and($props['items'][0]['content'])->not->toBeEmpty();
});

test('accordion block renders multiple collapsible details items', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'accordion-1',
        'type' => 'AccordionBlock',
        'props' => [
            'title' => 'Delivery Information',
            'items' => [
                [
                    'id' => 'a1',
                    'title' => 'Inside Dhaka',
                    'content' => 'Delivery within 24-48 hours.',
                ],
                [
                    'id' => 'a2',
                    'title' => 'Outside Dhaka',
                    'content' => 'Delivery within 48-72 hours.',
                ],
            ],
        ],
    ]);

    expect($html)
        ->toContain('Delivery Information')
        ->toContain('Inside Dhaka')
        ->toContain('Delivery within 24-48 hours.')
        ->toContain('Outside Dhaka')
        ->toContain('Delivery within 48-72 hours.')
        ->toContain('<details')
        ->toContain('name="accordion-accordion-1"');
});

test('hero block renders expected title and escaped markup', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'hero-1',
        'type' => 'HeroBlock',
        'props' => [
            'headline' => 'Luxury Timepiece Collection',
            'subheadline' => 'Crafted with precision & style',
            'badgeText' => 'Exclusive Eid Launch',
            'ctaText' => 'Order COD Now',
            'ctaTarget' => '#cod-checkout',
        ],
        'styles' => [
            'backgroundColor' => '#0f172a',
            'paddingTop' => '60px',
        ],
    ]);

    expect($html)
        ->toContain('Luxury Timepiece Collection')
        ->toContain('Crafted with precision &amp; style')
        ->toContain('Exclusive Eid Launch')
        ->toContain('Order COD Now')
        ->toContain('style="background-color: #0f172a; padding-top: 60px"');
});

test('product selector block renders with loaded product', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'prod-1',
        'type' => 'ProductSelectorBlock',
        'props' => [
            'productId' => $this->product->id,
            'showDescription' => true,
            'showPrice' => true,
        ],
    ]);

    expect($html)
        ->toContain('Executive Leather Backpack')
        ->toContain('3,200')
        ->toContain('3,800')
        ->toContain('Waterproof genuine leather backpack');
});

test('cod checkout block renders nationwide guarantee and honeypot field', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'cod-1',
        'type' => 'CodCheckoutBlock',
        'props' => [
            'productId' => $this->product->id,
            'buttonText' => 'Complete COD Order',
        ],
    ]);

    expect($html)
        ->toContain('Complete COD Order')
        ->toContain('Cash On Delivery Available Nationwide')
        ->toContain('name="website_url"')
        ->toContain('name="idempotency_key"');
});

test('cod checkout block ships with zero outer spacing by default', function () {
    $defaults = BlockRegistry::getDefaultStyles('CodCheckoutBlock');

    expect($defaults)
        ->toMatchArray([
            'paddingTop' => '0px',
            'paddingBottom' => '0px',
            'marginTop' => '0px',
            'marginBottom' => '0px',
        ]);

    $html = $this->renderer->renderBlock([
        'id' => 'cod-spacing',
        'type' => 'CodCheckoutBlock',
        'props' => ['productId' => $this->product->id],
        'styles' => $defaults,
    ]);

    expect($html)
        ->toContain('padding-top: 0px')
        ->toContain('padding-bottom: 0px')
        ->not->toContain('py-12')
        ->not->toContain('py-10');
});

test('cod checkout design props are rendered and unsafe css values are discarded', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'cod-design',
        'type' => 'CodCheckoutBlock',
        'props' => [
            'productId' => $this->product->id,
            'headerTitle' => 'Custom Checkout Heading',
            'headerSubtitle' => 'Custom subtitle copy',
            'showHeaderSubtitle' => false,
            'cardBgColor' => '#123456',
            'cardBorderRadius' => '6px',
            'containerMaxWidth' => '800px',
            'buttonBgColor' => '#abcdef',
            'buttonTextColor' => '#111111',
            'inputFocusColor' => '#ff0000',
            'fontFamily' => 'Arial, sans-serif',
            'cardShadow' => 'red; position: fixed; z-index: 9999',
        ],
        'styles' => BlockRegistry::getDefaultStyles('CodCheckoutBlock'),
    ]);

    expect($html)
        ->toContain('Custom Checkout Heading')
        ->toContain('background-color: #123456')
        ->toContain('border-radius: 6px')
        ->toContain('max-width: 800px')
        ->toContain('background-color: #abcdef')
        ->toContain('color: #111111')
        ->toContain('--cod-focus: #ff0000')
        ->toContain('font-family: Arial, sans-serif')
        ->not->toContain('Custom subtitle copy')
        ->not->toContain('position: fixed')
        ->not->toContain('z-index: 9999');
});

test('benefits grid block renders items properly', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'ben-1',
        'type' => 'BenefitsGridBlock',
        'props' => [
            'title' => 'Why Customers Choose Us',
            'columns' => 3,
            'items' => [
                ['id' => '1', 'title' => '100% Genuine', 'description' => 'Original imported product.'],
                ['id' => '2', 'title' => 'Fast Delivery', 'description' => '24-48 hour nationwide shipping.'],
                ['id' => '3', 'title' => 'Open Box Check', 'description' => 'Inspect product before paying COD.'],
            ],
        ],
    ]);

    expect($html)
        ->toContain('Why Customers Choose Us')
        ->toContain('100% Genuine')
        ->toContain('Fast Delivery')
        ->toContain('Open Box Check');
});

test('icon list block renders ordered text items without legacy icons', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'icon-list-1',
        'type' => 'IconListBlock',
        'props' => [
            'title' => 'আমাদের ৫টি সুবিধা',
            'listType' => 'ol',
            'showMarkers' => true,
            'showDividers' => true,
            'items' => [
                ['id' => '1', 'icon' => '🌸', 'text' => 'ত্বক উজ্জ্বল দেখাতে সাহায্য করে'],
                ['id' => '2', 'icon' => '🌿', 'text' => 'প্রাকৃতিক উপাদানে তৈরি'],
            ],
        ],
    ]);

    expect($html)
        ->toContain('<ol')
        ->not->toContain('<ul')
        ->toContain('আমাদের ৫টি সুবিধা')
        ->toContain('aria-hidden="true"')
        ->toMatch('/aria-hidden="true">\s*1\.\s*<\/span>/')
        ->toMatch('/aria-hidden="true">\s*2\.\s*<\/span>/')
        ->toContain('ত্বক উজ্জ্বল দেখাতে সাহায্য করে')
        ->toContain('প্রাকৃতিক উপাদানে তৈরি')
        ->toContain('<strong')
        ->toContain('gap-1.5')
        ->not->toContain('gap-3.5')
        ->not->toContain('🌸')
        ->not->toContain('🌿')
        ->not->toContain('কেন InnerMe Cream নিবেন ?');
});

test('icon list block supports unordered markers and hiding them', function () {
    $withBullets = $this->renderer->renderBlock([
        'id' => 'icon-list-2',
        'type' => 'IconListBlock',
        'props' => [
            'listType' => 'ul',
            'showMarkers' => true,
            'items' => [
                ['id' => '1', 'text' => 'First benefit'],
            ],
        ],
    ]);

    expect($withBullets)
        ->toContain('<ul')
        ->not->toContain('<ol')
        ->toContain('•')
        ->toContain('First benefit');

    $withoutMarkers = $this->renderer->renderBlock([
        'id' => 'icon-list-3',
        'type' => 'IconListBlock',
        'props' => [
            'listType' => 'ol',
            'showMarkers' => false,
            'items' => [
                ['id' => '1', 'text' => 'Second benefit'],
            ],
        ],
    ]);

    expect($withoutMarkers)
        ->toContain('<ol')
        ->toContain('Second benefit')
        ->not->toContain('•')
        ->not->toContain('aria-hidden="true"');
});

test('image carousel block renders dynamic images and responsive item settings', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'carousel-1',
        'type' => 'ImageCarouselBlock',
        'props' => [
            'title' => 'Product Gallery',
            'desktopItemsPerView' => 4,
            'mobileItemsPerView' => 2,
            'gap' => '12px',
            'aspectRatio' => '1 / 1',
            'showArrows' => true,
            'showDots' => true,
            'images' => [
                [
                    'id' => '1',
                    'imageUrl' => 'https://example.com/first.jpg',
                    'altText' => 'First product image',
                ],
                [
                    'id' => '2',
                    'imageUrl' => 'https://example.com/second.jpg',
                    'altText' => 'Second product image',
                ],
            ],
        ],
    ]);

    expect($html)
        ->toContain('Product Gallery')
        ->toContain('https://example.com/first.jpg')
        ->toContain('https://example.com/second.jpg')
        ->toContain('alt="First product image"')
        ->toContain('--lc-desktop: 4')
        ->toContain('--lc-mobile: 2')
        ->toContain('--lc-gap: 12px')
        ->toContain('aspect-ratio: 1 / 1')
        ->toContain('data-lc-carousel-track')
        ->toContain('data-lc-prev')
        ->toContain('data-lc-next');
});

test('image carousel block skips unsafe image schemes and escapes alt text', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'carousel-2',
        'type' => 'ImageCarouselBlock',
        'props' => [
            'images' => [
                [
                    'id' => '1',
                    'imageUrl' => 'https://example.com/safe.jpg',
                    'altText' => '"><script>alert(1)</script>',
                ],
                [
                    'id' => '2',
                    'imageUrl' => 'javascript:alert(1)',
                    'altText' => 'Unsafe image',
                ],
            ],
        ],
    ]);

    expect($html)
        ->not->toContain('javascript:alert')
        ->not->toContain('<script>alert')
        ->toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
        ->toContain('https://example.com/safe.jpg');
});

test('reviews block renders customer feedback and star ratings', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'rev-1',
        'type' => 'ReviewsBlock',
        'props' => [
            'title' => 'Real Reviews from Verified Customers',
            'items' => [
                [
                    'id' => '1',
                    'authorName' => 'Ashraful Islam',
                    'location' => 'Dhaka',
                    'rating' => 5,
                    'comment' => 'Excellent build quality, loved the packaging!',
                    'verifiedPurchase' => true,
                ],
            ],
        ],
    ]);

    expect($html)
        ->toContain('Real Reviews from Verified Customers')
        ->toContain('Ashraful Islam')
        ->toContain('Dhaka')
        ->toContain('Excellent build quality, loved the packaging!')
        ->toContain('Verified');
});

test('video block formats and embeds youtube and vimeo URLs safely', function () {
    $ytUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    $embedYt = BlockRendererService::formatVideoEmbedUrl($ytUrl);
    expect($embedYt)->toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');

    $vimeoUrl = 'https://vimeo.com/76979871';
    $embedVimeo = BlockRendererService::formatVideoEmbedUrl($vimeoUrl);
    expect($embedVimeo)->toBe('https://player.vimeo.com/video/76979871');

    $html = $this->renderer->renderBlock([
        'id' => 'vid-1',
        'type' => 'VideoBlock',
        'props' => [
            'videoUrl' => $ytUrl,
            'aspectRatio' => '16:9',
        ],
    ]);

    expect($html)
        ->toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0')
        ->toContain('<iframe');
});

test('faq block renders expandable details accordions', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'faq-1',
        'type' => 'FaqBlock',
        'props' => [
            'title' => 'Frequently Asked Questions',
            'items' => [
                [
                    'id' => '1',
                    'question' => 'How can I pay for my order?',
                    'answer' => 'You can pay using Cash On Delivery when receiving the parcel.',
                ],
            ],
        ],
    ]);

    expect($html)
        ->toContain('Frequently Asked Questions')
        ->toContain('How can I pay for my order?')
        ->toContain('You can pay using Cash On Delivery when receiving the parcel.')
        ->toContain('<details');
});

test('countdown timer block displays countdown components', function () {
    $futureDate = date('Y-m-d\TH:i:s\Z', time() + 86400 * 2);

    $html = $this->renderer->renderBlock([
        'id' => 'timer-1',
        'type' => 'CountdownTimerBlock',
        'props' => [
            'targetDate' => $futureDate,
            'headline' => 'Special Ramadan Offer Ending Soon',
            'urgencyText' => 'Limited stock remaining at this discounted price!',
        ],
    ]);

    expect($html)
        ->toContain('Special Ramadan Offer Ending Soon')
        ->toContain('Limited stock remaining at this discounted price!')
        ->toContain('Days')
        ->toContain('Hours')
        ->toContain('Minutes');
});

test('sticky bar block renders fixed action bar', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'bar-1',
        'type' => 'StickyBarBlock',
        'props' => [
            'message' => 'Free Delivery on all orders today!',
            'buttonText' => 'Claim Offer',
            'buttonTarget' => '#cod-checkout',
            'placement' => 'bottom',
        ],
    ]);

    expect($html)
        ->toContain('Free Delivery on all orders today!')
        ->toContain('Claim Offer')
        ->toContain('#cod-checkout')
        ->toContain('fixed bottom-0');
});

test('unapproved block types return empty string and do not render', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'malicious-1',
        'type' => 'ArbitraryHtmlBlock',
        'props' => ['rawHtml' => '<script>alert(1)</script>'],
    ]);

    expect($html)->toBe('');
});

test('dangerous css properties and injection attacks are stripped from inline styles', function () {
    $styles = [
        'backgroundColor' => '#ffffff',
        'position' => 'relative',
        'expression' => 'expression(alert(1))',
        'backgroundImage' => 'url(javascript:alert(1))',
        'evilProperty' => 'red',
        'color' => 'blue; font-size: 500px', // Attempting multiple statements
    ];

    $css = $this->renderer->convertStylesToCssAttribute($styles);

    expect($css)
        ->toContain('background-color: #ffffff')
        ->toContain('position: relative')
        ->toContain('color: blue font-size: 500px')
        ->not->toContain('expression')
        ->not->toContain('url(')
        ->not->toContain('evilProperty');
});

test('renderAst renders complete page sequence', function () {
    $ast = [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'hero-1',
                'type' => 'HeroBlock',
                'props' => ['headline' => 'AST Hero Headline'],
            ],
            [
                'id' => 'benefits-1',
                'type' => 'BenefitsGridBlock',
                'props' => [
                    'title' => 'AST Benefits Title',
                    'items' => [
                        ['id' => '1', 'title' => 'Quality First', 'description' => 'Tested rigorously.'],
                    ],
                ],
            ],
        ],
    ];

    $html = $this->renderer->renderAst($ast);

    expect($html)
        ->toContain('AST Hero Headline')
        ->toContain('AST Benefits Title')
        ->toContain('Quality First');
});

test('html block renders safe custom html and scoped css', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'html-1',
        'type' => 'HtmlBlock',
        'props' => [
            'html' => '<div class="custom-card"><h3 class="custom-title">Special Custom Feature</h3></div>',
            'css' => '.custom-card { border-radius: 16px; } .custom-title { color: #16a34a; }',
        ],
        'styles' => [
            'paddingTop' => '20px',
        ],
    ]);

    expect($html)
        ->toContain('Special Custom Feature')
        ->toContain('.custom-title { color: #16a34a; }')
        ->toContain('style="padding-top: 20px"');
});

test('hero block applies individual element styling to headline, subheadline, badge and button', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'hero-elem-1',
        'type' => 'HeroBlock',
        'props' => [
            'headline' => 'Custom Headline Title',
            'headlineColor' => '#dc2626',
            'headlineFontSize' => '48px',
            'subheadline' => 'Custom Subheadline Description',
            'subheadlineColor' => '#4b5563',
            'badgeText' => 'Super Deal',
            'badgeTextColor' => '#1e40af',
            'badgeBgColor' => '#dbeafe',
            'ctaText' => 'Instant Buy',
            'buttonSize' => 'xl',
            'buttonWidth' => 'full',
            'buttonBgColor' => '#059669',
        ],
    ]);

    expect($html)
        ->toContain('Custom Headline Title')
        ->toContain('color: #dc2626;')
        ->toContain('font-size: 48px;')
        ->toContain('Custom Subheadline Description')
        ->toContain('color: #4b5563;')
        ->toContain('Super Deal')
        ->toContain('color: #1e40af;')
        ->toContain('background-color: #dbeafe;')
        ->toContain('Instant Buy')
        ->toContain('background-color: #059669;')
        ->toContain('w-full justify-center')
        ->toContain('px-10 py-5 text-xl font-black');
});
