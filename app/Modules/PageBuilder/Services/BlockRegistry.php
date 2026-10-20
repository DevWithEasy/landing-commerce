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
        'HtmlBlock',
        'ContainerBlock',
        'HeadingBlock',
        'TextBlock',
        'ImageBlock',
        'ButtonBlock',
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
                'headlineColor' => '#0f172a',
                'headlineFontSize' => '',
                'headlineFontWeight' => '',
                'headlineLineHeight' => '',
                'headlineAlign' => 'left',
                'subheadlineColor' => '#475569',
                'subheadlineFontSize' => '',
                'subheadlineFontWeight' => '',
                'badgeTextColor' => '#1e40af',
                'badgeBgColor' => '#dbeafe',
                'badgeBorderRadius' => '9999px',
                'buttonSize' => 'lg',
                'buttonWidth' => 'auto',
                'buttonBgColor' => '#16a34a',
                'buttonTextColor' => '#ffffff',
                'buttonBorderRadius' => '12px',
                'buttonPulseAnimation' => false,
            ],
            'ProductSelectorBlock' => [
                'productId' => 0,
                'productIds' => [],
                'selectionMode' => 'single',
                'defaultSelection' => 'first',
                'defaultSelectedId' => 0,
                'showDescription' => true,
                'showPrice' => true,
                'showDiscountBadge' => true,
                'badgeText' => 'Most Popular',
                'productBadges' => [],
                'orderButtonText' => 'অর্ডার করুন — ক্যাশ অন ডেলিভারি',
                'displayMode' => 'grid',
            ],
            'CodCheckoutBlock' => [
                'productId' => 0,
                'productIds' => [],
                'selectionMode' => 'single',
                'defaultSelection' => 'first',
                'defaultSelectedId' => 0,
                'showDiscountBadge' => true,
                'badgeText' => 'Best Value',
                'productBadges' => [],
                'variantSelectionType' => 'swatches',
                'showQuantity' => true,
                'buttonText' => 'অর্ডার কনফার্ম করুন — ক্যাশ অন ডেলিভারি',
                'nameLabel' => 'আপনার নাম (Your Name)',
                'namePlaceholder' => 'আপনার পুরো নাম লিখুন...',
                'phoneLabel' => 'মোবাইল নাম্বার (Mobile Number)',
                'phonePlaceholder' => '01XXXXXXXXX (১১ ডিজিট)',
                'addressLabel' => 'সম্পূর্ণ ডেলিভারি ঠিকানা (Full Address)',
                'addressPlaceholder' => 'বাসা/হোল্ডিং নং, রোড নং, এলাকা, থানা ও জেলা...',
                'shippingLabel' => 'শিপিং মেথড (Shipping Method)',
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
            'HtmlBlock' => [
                'html' => '<div class="custom-promo p-5 text-center bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto my-1">'."\n".
                          '    <h3 class="text-xl font-bold text-gray-900 mb-1.5">কাস্টম সেকশন বা ব্যানার</h3>'."\n".
                          '    <p class="text-sm text-gray-600 mb-3">এখানে কাস্টম HTML ও CSS কোড লিখে সরাসরি ক্যানভাসে প্রিভিউ দেখুন।</p>'."\n".
                          '    <a href="#cod-checkout" class="inline-block px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition text-sm">অর্ডার করুন</a>'."\n".
                          '</div>',
                'css' => '.custom-promo { transition: transform 0.2s ease, box-shadow 0.2s ease; }'."\n".
                         '.custom-promo:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); }',
            ],
            'ContainerBlock' => [
                'direction' => 'column',
                'wrap' => 'nowrap',
                'justifyContent' => 'flex-start',
                'alignItems' => 'stretch',
                'gap' => '16px',
            ],
            'HeadingBlock' => [
                'text' => 'Exclusive Collection Headline',
                'tag' => 'h2',
                'align' => 'left',
                'color' => '#0f172a',
                'fontSize' => '24px',
                'fontWeight' => '700',
            ],
            'TextBlock' => [
                'content' => 'High quality craftsmanship guaranteed with 100% genuine materials and nationwide delivery.',
                'align' => 'left',
                'color' => '#475569',
                'fontSize' => '16px',
                'lineHeight' => '1.6',
            ],
            'ImageBlock' => [
                'imageUrl' => '',
                'altText' => 'Product Feature Image',
                'caption' => '',
                'aspectRatio' => 'auto',
                'linkUrl' => '',
                'align' => 'center',
            ],
            'ButtonBlock' => [
                'text' => 'অর্ডার করুন — ক্যাশ অন ডেলিভারি',
                'target' => '#cod-checkout',
                'size' => 'lg',
                'width' => 'auto',
                'align' => 'center',
                'backgroundColor' => '#16a34a',
                'textColor' => '#ffffff',
                'borderRadius' => '12px',
                'pulseAnimation' => false,
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
            'HtmlBlock' => [
                'paddingTop' => '12px',
                'paddingBottom' => '12px',
            ],
            'ContainerBlock' => [
                'paddingTop' => '24px',
                'paddingBottom' => '24px',
                'paddingLeft' => '16px',
                'paddingRight' => '16px',
            ],
            'HeadingBlock' => [
                'marginTop' => '0px',
                'marginBottom' => '12px',
            ],
            'TextBlock' => [
                'marginTop' => '0px',
                'marginBottom' => '16px',
            ],
            'ImageBlock' => [
                'marginTop' => '8px',
                'marginBottom' => '8px',
                'maxWidth' => '100%',
                'borderRadius' => '8px',
            ],
            'ButtonBlock' => [
                'marginTop' => '8px',
                'marginBottom' => '8px',
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
            'HtmlBlock' => [
                'name' => 'Custom HTML / CSS',
                'description' => 'Add custom HTML elements with scoped styling for advanced flexibility.',
                'category' => 'Advanced',
                'icon' => 'Code',
            ],
            'ContainerBlock' => [
                'name' => 'Container',
                'description' => 'Nested flexbox container to organize, group, and layout child elements.',
                'category' => 'Layout',
                'icon' => 'Box',
            ],
            'HeadingBlock' => [
                'name' => 'Heading',
                'description' => 'Customizable typography heading with H1-H6 tags and alignment.',
                'category' => 'Basic',
                'icon' => 'Type',
            ],
            'TextBlock' => [
                'name' => 'Text Block',
                'description' => 'Paragraph text block for descriptions, bullet features, and specifications.',
                'category' => 'Basic',
                'icon' => 'FileText',
            ],
            'ImageBlock' => [
                'name' => 'Image',
                'description' => 'Responsive image media element with optional link and aspect ratio control.',
                'category' => 'Basic',
                'icon' => 'Image',
            ],
            'ButtonBlock' => [
                'name' => 'Button',
                'description' => 'Call to action button linking to COD checkout or custom target.',
                'category' => 'Basic',
                'icon' => 'Square',
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
