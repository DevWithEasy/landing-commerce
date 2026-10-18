<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Services;

class BlockRegistry
{
    /**
     * Complete list of registered and approved block types.
     * Any block type outside this registry is strictly prohibited.
     *
     * @var list<string>
     */
    public const APPROVED_BLOCKS = [
        'HeroBlock',
        'ProductSelectorBlock',
        'CodCheckoutBlock',
        'BenefitsGridBlock',
        'ReviewsBlock',
        'VideoBlock',
        'FaqBlock',
        'CountdownTimerBlock',
        'StickyBarBlock',
    ];

    /**
     * Check if a block type is in the approved allowlist.
     */
    public static function isApproved(string $blockType): bool
    {
        return in_array($blockType, self::APPROVED_BLOCKS, true);
    }

    /**
     * Get the full list of approved block types.
     *
     * @return list<string>
     */
    public static function getApprovedBlocks(): array
    {
        return self::APPROVED_BLOCKS;
    }

    /**
     * Get default properties for a block type.
     *
     * @return array<string, mixed>
     */
    public static function getDefaultProps(string $blockType): array
    {
        return match ($blockType) {
            'HeroBlock' => [
                'headline' => 'Exclusive Premium Collection',
                'subheadline' => '100% authentic quality guaranteed. Cash on delivery available across all 64 districts.',
                'badgeText' => 'Limited Stock Offer',
                'ctaText' => 'Order Now - Cash on Delivery',
                'ctaTarget' => '#cod-checkout',
                'imageUrl' => '',
                'imagePosition' => 'right',
            ],
            'ProductSelectorBlock' => [
                'productId' => 0,
                'productIds' => [],
                'selectionMode' => 'single',
                'showDescription' => true,
                'showPrice' => true,
                'displayMode' => 'grid',
            ],
            'CodCheckoutBlock' => [
                'productId' => 0,
                'productIds' => [],
                'selectionMode' => 'single',
                'variantSelectionType' => 'swatches',
                'showQuantity' => true,
                'buttonText' => 'Confirm Order - Cash on Delivery',
                'highlightColor' => '#16a34a',
            ],
            'BenefitsGridBlock' => [
                'title' => 'Why Order From Us?',
                'columns' => 3,
                'items' => [
                    [
                        'id' => 'b1',
                        'icon' => 'ShieldCheck',
                        'title' => '100% Genuine Quality',
                        'description' => 'Tested and verified products before shipping.',
                    ],
                    [
                        'id' => 'b2',
                        'icon' => 'Truck',
                        'title' => 'Fast COD Delivery',
                        'description' => '24-48h in Dhaka, 48-72h nationwide.',
                    ],
                    [
                        'id' => 'b3',
                        'icon' => 'RotateCcw',
                        'title' => '7-Day Easy Return',
                        'description' => 'Hassle-free return policy if not satisfied.',
                    ],
                ],
            ],
            'ReviewsBlock' => [
                'title' => 'What Our Customers Say',
                'layout' => 'grid',
                'items' => [
                    [
                        'id' => 'r1',
                        'authorName' => 'Tanvir Hasan',
                        'location' => 'Dhaka',
                        'rating' => 5,
                        'comment' => 'Received within 24 hours. The packaging and product quality exceeded my expectations!',
                        'verifiedPurchase' => true,
                    ],
                    [
                        'id' => 'r2',
                        'authorName' => 'Nusrat Jahan',
                        'location' => 'Chittagong',
                        'rating' => 5,
                        'comment' => 'Very reliable service. Cash on delivery was seamless, highly recommended.',
                        'verifiedPurchase' => true,
                    ],
                ],
            ],
            'VideoBlock' => [
                'videoUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'aspectRatio' => '16:9',
                'autoplay' => false,
                'controls' => true,
            ],
            'FaqBlock' => [
                'title' => 'Frequently Asked Questions',
                'items' => [
                    [
                        'id' => 'f1',
                        'question' => 'How can I pay for my order?',
                        'answer' => 'You can pay via Cash on Delivery (COD) directly to the delivery rider once you receive and inspect your parcel.',
                    ],
                    [
                        'id' => 'f2',
                        'question' => 'How long does delivery take?',
                        'answer' => 'Inside Dhaka delivery takes 24-48 hours. Outside Dhaka takes 48-72 hours via our official courier partners.',
                    ],
                    [
                        'id' => 'f3',
                        'question' => 'Can I check the product before paying?',
                        'answer' => 'Yes, our riders allow parcel verification in front of the delivery agent before completing payment.',
                    ],
                ],
            ],
            'CountdownTimerBlock' => [
                'targetDate' => date('Y-m-d\TH:i:s\Z', strtotime('+2 days')),
                'headline' => 'Flash Sale Ending Soon!',
                'urgencyText' => 'Special discount pricing expires in:',
                'expiryAction' => 'show_message',
                'expiryMessage' => 'Offer has concluded. Regular prices now apply.',
            ],
            'StickyBarBlock' => [
                'message' => 'Special Campaign Discount - Order Now & Save ৳200!',
                'buttonText' => 'Order Now',
                'buttonTarget' => '#cod-checkout',
                'placement' => 'bottom',
            ],
            default => [],
        };
    }

    /**
     * Get default styles for a block type.
     *
     * @return array<string, string>
     */
    public static function getDefaultStyles(string $blockType): array
    {
        return match ($blockType) {
            'HeroBlock' => [
                'backgroundColor' => '#f8fafc',
                'paddingTop' => '48px',
                'paddingBottom' => '48px',
                'color' => '#0f172a',
            ],
            'BenefitsGridBlock' => [
                'backgroundColor' => '#ffffff',
                'paddingTop' => '40px',
                'paddingBottom' => '40px',
            ],
            'ReviewsBlock' => [
                'backgroundColor' => '#f8fafc',
                'paddingTop' => '48px',
                'paddingBottom' => '48px',
            ],
            'StickyBarBlock' => [
                'position' => 'fixed',
                'backgroundColor' => '#0f172a',
                'color' => '#ffffff',
                'zIndex' => '40',
            ],
            default => [
                'paddingTop' => '32px',
                'paddingBottom' => '32px',
            ],
        };
    }

    /**
     * Get metadata description for all approved blocks.
     *
     * @return array<string, array{type: string, name: string, description: string, category: string, icon: string, defaultProps: array<string, mixed>, defaultStyles: array<string, mixed>}>
     */
    public static function getAllBlockDefinitions(): array
    {
        $definitions = [
            'HeroBlock' => [
                'name' => 'Hero Banner',
                'description' => 'High-converting headline, badge, call-to-action button, and showcase media.',
                'category' => 'Header',
                'icon' => 'Sparkles',
            ],
            'ProductSelectorBlock' => [
                'name' => 'Product Showcase',
                'description' => 'Display selected product with title, pricing, images, and variant swatches.',
                'category' => 'Commerce',
                'icon' => 'Package',
            ],
            'CodCheckoutBlock' => [
                'name' => 'COD Checkout Form',
                'description' => 'Fast 1-step Cash on Delivery checkout form with real-time fee calculations.',
                'category' => 'Commerce',
                'icon' => 'ShoppingBag',
            ],
            'BenefitsGridBlock' => [
                'name' => 'Trust & Benefits Grid',
                'description' => 'Feature badges highlight guarantees like 100% genuine and easy returns.',
                'category' => 'Content',
                'icon' => 'ShieldCheck',
            ],
            'ReviewsBlock' => [
                'name' => 'Customer Reviews',
                'description' => 'Verified buyer testimonials and star ratings for social proof.',
                'category' => 'Social Proof',
                'icon' => 'Star',
            ],
            'VideoBlock' => [
                'name' => 'Video Showcase',
                'description' => 'Embed product demonstrations from YouTube or Vimeo.',
                'category' => 'Media',
                'icon' => 'Video',
            ],
            'FaqBlock' => [
                'name' => 'FAQ Accordion',
                'description' => 'Address common buyer questions about delivery, returns, and payment.',
                'category' => 'Content',
                'icon' => 'HelpCircle',
            ],
            'CountdownTimerBlock' => [
                'name' => 'Urgency Countdown',
                'description' => 'Live countdown timer creating urgency for limited-time flash deals.',
                'category' => 'Marketing',
                'icon' => 'Clock',
            ],
            'StickyBarBlock' => [
                'name' => 'Sticky Bottom Bar',
                'description' => 'Floating mobile-first bar keeping the "Order Now" button always within reach.',
                'category' => 'Marketing',
                'icon' => 'Layers',
            ],
        ];

        foreach ($definitions as $type => &$def) {
            $def['type'] = $type;
            $def['defaultProps'] = self::getDefaultProps($type);
            $def['defaultStyles'] = self::getDefaultStyles($type);
        }
        unset($def);

        return $definitions;
    }

    /**
     * Generate a complete, valid initial AST document for a new or unrevised landing page.
     *
     * @param  array<string, mixed>  $settings
     * @return array<string, mixed>
     */
    public static function generateDefaultAst(?int $productId = null, array $settings = []): array
    {
        return [
            'version' => 1,
            'settings' => array_merge([
                'primaryColor' => '#16a34a',
                'fontFamily' => 'Inter',
                'containerMaxWidth' => '1200px',
            ], $settings),
            'blocks' => [
                [
                    'id' => 'blk_hero_'.bin2hex(random_bytes(4)),
                    'type' => 'HeroBlock',
                    'props' => self::getDefaultProps('HeroBlock'),
                    'styles' => self::getDefaultStyles('HeroBlock'),
                ],
                [
                    'id' => 'blk_product_'.bin2hex(random_bytes(4)),
                    'type' => 'ProductSelectorBlock',
                    'props' => array_merge(self::getDefaultProps('ProductSelectorBlock'), [
                        'productId' => $productId ?? 0,
                        'productIds' => $productId ? [$productId] : [],
                        'selectionMode' => 'single',
                    ]),
                    'styles' => self::getDefaultStyles('ProductSelectorBlock'),
                ],
                [
                    'id' => 'blk_cod_'.bin2hex(random_bytes(4)),
                    'type' => 'CodCheckoutBlock',
                    'props' => array_merge(self::getDefaultProps('CodCheckoutBlock'), [
                        'productId' => $productId ?? 0,
                        'productIds' => $productId ? [$productId] : [],
                        'selectionMode' => 'single',
                    ]),
                    'styles' => self::getDefaultStyles('CodCheckoutBlock'),
                ],
            ],
        ];
    }
}
