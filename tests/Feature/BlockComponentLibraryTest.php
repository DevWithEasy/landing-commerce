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

test('block registry returns all 9 approved blocks with complete schema definitions', function () {
    $blocks = BlockRegistry::APPROVED_BLOCKS;
    expect($blocks)->toHaveCount(9);

    $definitions = BlockRegistry::getAllBlockDefinitions();
    expect($definitions)->toHaveCount(9);

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
