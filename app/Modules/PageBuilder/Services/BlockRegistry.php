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
        'AccordionBlock',
        'CountdownTimerBlock',
        'StickyBarBlock',
        'HtmlBlock',
        'ContainerBlock',
        'GridBlock',
        'HeadingBlock',
        'TextBlock',
        'ImageBlock',
        'ButtonBlock',
        'IconListBlock',
        'ImageCarouselBlock',
        'TestimonialBlock',
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

                // Content visibility & copy
                'showHeader' => true,
                'showHeaderBadge' => true,
                'showHeaderTitle' => true,
                'showHeaderSubtitle' => true,
                'headerBadgeText' => 'Fast & Secure Checkout',
                'headerTitle' => 'Cash On Delivery Available Nationwide',
                'headerSubtitle' => 'Pay in cash only after receiving and inspecting your parcel.',
                'headerAlign' => 'center',
                'showProductSelector' => true,
                'showVariants' => true,
                'showSummary' => true,
                'showTrustBadges' => true,
                'showRequiredMark' => true,
                'trustText1' => '১০০% ক্যাশ অন ডেলিভারি',
                'trustText2' => 'প্রোডাক্ট দেখে মূল্য পরিশোধ',

                // Typography & layout
                'fontFamily' => '',
                'accentColor' => '#059669',
                'containerMaxWidth' => '1280px',
                'containerPaddingX' => '16px',
                'fieldGap' => '16px',

                // Header design
                'headerPaddingTop' => '0px',
                'headerPaddingBottom' => '24px',
                'headerBorderColor' => '#f1f5f9',
                'headerBorderWidth' => '1px',
                'bodyPaddingTop' => '24px',
                'badgeBgColor' => '#d1fae5',
                'badgeTextColor' => '#065f46',
                'badgeBorderRadius' => '9999px',
                'badgeFontSize' => '11px',
                'badgeFontWeight' => '700',
                'badgePaddingX' => '12px',
                'badgePaddingY' => '4px',
                'titleColor' => '#0f172a',
                'titleFontSize' => '30px',
                'titleFontWeight' => '800',
                'titleLineHeight' => '1.2',
                'titleLetterSpacing' => '-0.02em',
                'titleMarginBottom' => '4px',
                'subtitleColor' => '#64748b',
                'subtitleFontSize' => '13px',
                'subtitleLineHeight' => '1.5',
                'subtitleLetterSpacing' => '0px',

                // Card design
                'cardBgColor' => '#ffffff',
                'cardBorderColor' => '#10b981',
                'cardBorderWidth' => '2px',
                'cardBorderStyle' => 'solid',
                'cardBorderRadius' => '24px',
                'cardMinHeight' => '',
                'cardPaddingTop' => '32px',
                'cardPaddingBottom' => '32px',
                'cardPaddingLeft' => '32px',
                'cardPaddingRight' => '32px',
                'cardShadow' => '0 25px 50px -12px rgb(0 0 0 / 0.25)',

                // Labels
                'labelColor' => '#334155',
                'labelFontSize' => '11px',
                'labelFontWeight' => '700',
                'labelLineHeight' => '1.35',
                'labelLetterSpacing' => '0.05em',
                'labelTextTransform' => 'uppercase',
                'labelMarginBottom' => '4px',
                'requiredMarkColor' => '#f43f5e',

                // Inputs
                'inputBgColor' => '#ffffff',
                'inputTextColor' => '#0f172a',
                'inputBorderColor' => '#cbd5e1',
                'inputBorderWidth' => '1px',
                'inputBorderRadius' => '12px',
                'inputPaddingX' => '12px',
                'inputPaddingY' => '10px',
                'inputFontSize' => '14px',
                'inputFontWeight' => '400',
                'inputMinHeight' => '44px',
                'inputIconColor' => '#94a3b8',
                'inputPlaceholderColor' => '#94a3b8',
                'inputFocusColor' => '#10b981',
                'inputFocusRingColor' => 'rgba(16, 185, 129, 0.18)',
                'inputFocusRingWidth' => '3px',

                // Product cards
                'productPanelBgColor' => '#f8fafc',
                'productPanelBorderColor' => '#e2e8f0',
                'productPanelBorderRadius' => '12px',
                'productPanelPadding' => '12px',
                'productPanelTitleColor' => '#334155',
                'productCardBgColor' => '#ffffff',
                'productCardSelectedBgColor' => '#ecfdf5',
                'productCardBorderColor' => '#e2e8f0',
                'productCardSelectedBorderColor' => '#10b981',
                'productCardBorderWidth' => '1px',
                'productCardSelectedBorderWidth' => '2px',
                'productCardBorderRadius' => '12px',
                'productCardPadding' => '10px',
                'productCardGap' => '8px',
                'productTitleColor' => '#0f172a',
                'productTitleFontSize' => '12px',
                'productTitleFontWeight' => '700',
                'productPriceColor' => '#059669',
                'productPriceFontSize' => '14px',
                'productOldPriceColor' => '#94a3b8',
                'productInfoTextColor' => '#64748b',
                'productInfoFontSize' => '10px',
                'productImageSize' => '40px',
                'productImageRadius' => '8px',
                'productImageFit' => 'cover',
                'productBadgeBgColor' => '#fef3c7',
                'productBadgeTextColor' => '#92400e',
                'productBadgeBorderRadius' => '9999px',
                'productBadgeFontSize' => '9px',
                'variantBgColor' => '#ffffff',
                'variantTextColor' => '#334155',
                'variantBorderColor' => '#e2e8f0',
                'variantSelectedBgColor' => '#059669',
                'variantSelectedTextColor' => '#ffffff',
                'variantSelectedBorderColor' => '#059669',
                'variantBorderRadius' => '6px',
                'variantFontSize' => '10px',

                // Shipping select
                'shippingBgColor' => '#ecfdf5',
                'shippingTextColor' => '#0f172a',
                'shippingBorderColor' => '#10b981',
                'shippingBorderWidth' => '2px',
                'shippingBorderRadius' => '12px',
                'shippingPadding' => '10px',
                'shippingFontSize' => '14px',
                'shippingFontWeight' => '600',

                // Summary
                'summaryBgColor' => '#f8fafc',
                'summaryBorderColor' => '#e2e8f0',
                'summaryBorderWidth' => '1px',
                'summaryBorderRadius' => '12px',
                'summaryPadding' => '16px',
                'summaryRowGap' => '8px',
                'summaryTextColor' => '#475569',
                'summaryValueColor' => '#1e293b',
                'summaryTotalColor' => '#059669',
                'summaryTotalFontSize' => '18px',
                'summaryFontSize' => '12px',

                // Submit button
                'buttonBgColor' => '#059669',
                'buttonTextColor' => '#ffffff',
                'buttonHoverBgColor' => '#047857',
                'buttonBorderWidth' => '0px',
                'buttonBorderColor' => '#059669',
                'buttonBorderRadius' => '12px',
                'buttonMinHeight' => '',
                'buttonPaddingY' => '16px',
                'buttonPaddingX' => '24px',
                'buttonFontSize' => '16px',
                'buttonFontWeight' => '800',
                'buttonShadow' => '0 20px 25px -5px rgb(5 150 105 / 0.3)',
                'buttonWidth' => 'full',
                'buttonTextTransform' => 'none',
                'buttonLetterSpacing' => '0px',

                // Trust row
                'trustTextColor' => '#64748b',
                'trustFontSize' => '11px',
                'trustFontWeight' => '400',
                'trustIconColor' => '#059669',
                'trustIconSize' => '14px',
                'trustGap' => '16px',
                'trustPaddingTop' => '8px',
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
                'starColor' => '#f59e0b',
                'starEmptyColor' => '#d1d5db',
                'starSize' => '16px',
                'starStyle' => 'filled',
                'showStars' => true,
                'showRatingSummary' => true,
                'ratingSummaryText' => '4.9/5 from verified buyers',
                'ratingSummaryColor' => '#334155',
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
            'TestimonialBlock' => [
                'items' => [
                    [
                        'id' => 'testimonial_1',
                        'quote' => 'The quality is outstanding and the delivery was faster than expected. I will definitely order again!',
                        'authorName' => 'Tanvir Hasan',
                        'authorRole' => 'Verified Customer',
                        'location' => 'Dhaka',
                        'rating' => 5,
                        'avatarUrl' => '',
                        'verifiedPurchase' => true,
                    ],
                    [
                        'id' => 'testimonial_2',
                        'quote' => 'Cash on delivery was seamless and the product matched the photos perfectly. Highly recommended!',
                        'authorName' => 'Nusrat Jahan',
                        'authorRole' => 'Repeat Buyer',
                        'location' => 'Chattogram',
                        'rating' => 5,
                        'avatarUrl' => '',
                        'verifiedPurchase' => true,
                    ],
                    [
                        'id' => 'testimonial_3',
                        'quote' => 'Excellent packaging and very responsive support. My order arrived within 48 hours.',
                        'authorName' => 'Rafiq Ahmed',
                        'authorRole' => 'Verified Customer',
                        'location' => 'Sylhet',
                        'rating' => 4,
                        'avatarUrl' => '',
                        'verifiedPurchase' => true,
                    ],
                ],
                'showQuoteIcon' => true,
                'showRating' => true,
                'layout' => 'card',
                'accentColor' => '#059669',
                'cardBgColor' => '#ffffff',
                'quoteColor' => '#1e293b',
                'authorColor' => '#0f172a',
                'quoteFontSize' => '20px',
                'avatarSize' => '52px',
                'cardRadius' => '20px',
                'cardPadding' => '32px',
                'autoplay' => true,
                'autoplayInterval' => 5000,
                'showArrows' => true,
                'showDots' => true,
                'loop' => true,
                'starColor' => '#059669',
                'starSize' => '16px',
                'starStyle' => 'filled',
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
            'AccordionBlock' => [
                'title' => 'Title',
                'items' => [
                    [
                        'id' => 'ac1',
                        'title' => 'Accordion Item 1',
                        'content' => 'Accordion content goes here.',
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
            'GridBlock' => [
                'columns' => 3,
                'tabletColumns' => 2,
                'mobileColumns' => 1,
                'columnGap' => '16px',
                'rowGap' => '16px',
                'alignItems' => 'stretch',
                'justifyItems' => 'stretch',
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
            'IconListBlock' => [
                'title' => 'Title',
                'listType' => 'ul',
                'showMarkers' => true,
                'showDividers' => true,
                'itemSpacing' => 12,
                'items' => [
                    [
                        'id' => 'il1',
                        'text' => 'List Item 01',
                    ],
                    [
                        'id' => 'il2',
                        'text' => 'List Item 2',
                    ],
                ],
            ],
            'ImageCarouselBlock' => [
                'title' => '',
                'images' => [
                    [
                        'id' => 'ic1',
                        'imageUrl' => 'https://picsum.photos/seed/landing-carousel-1/1200/900',
                        'altText' => 'Carousel image 1',
                    ],
                    [
                        'id' => 'ic2',
                        'imageUrl' => 'https://picsum.photos/seed/landing-carousel-2/1200/900',
                        'altText' => 'Carousel image 2',
                    ],
                    [
                        'id' => 'ic3',
                        'imageUrl' => 'https://picsum.photos/seed/landing-carousel-3/1200/900',
                        'altText' => 'Carousel image 3',
                    ],
                ],
                'desktopItemsPerView' => 3,
                'mobileItemsPerView' => 1,
                'gap' => '16px',
                'aspectRatio' => '4 / 3',
                'imageFit' => 'cover',
                'showArrows' => true,
                'showDots' => true,
                'autoplay' => false,
                'autoplayInterval' => 4000,
                'loop' => true,
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
            'GridBlock' => [
                'paddingTop' => '16px',
                'paddingBottom' => '16px',
                'paddingLeft' => '16px',
                'paddingRight' => '16px',
            ],
            'TestimonialBlock' => [
                'backgroundColor' => '#f8fafc',
                'paddingTop' => '48px',
                'paddingBottom' => '48px',
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
            'IconListBlock' => [
                'backgroundColor' => '#ffffff',
                'paddingTop' => '48px',
                'paddingBottom' => '48px',
            ],
            'AccordionBlock' => [
                'backgroundColor' => '#ffffff',
                'paddingTop' => '48px',
                'paddingBottom' => '48px',
            ],
            'ImageCarouselBlock' => [
                'backgroundColor' => '#ffffff',
                'paddingTop' => '40px',
                'paddingBottom' => '40px',
            ],
            'CodCheckoutBlock' => [
                'backgroundColor' => '#f8fafc',
                'paddingTop' => '0px',
                'paddingBottom' => '0px',
                'marginTop' => '0px',
                'marginBottom' => '0px',
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
            'TestimonialBlock' => [
                'name' => 'Testimonial Carousel',
                'description' => 'Multiple testimonials with auto-scroll, arrows, dots and verified rating badges.',
                'category' => 'Social Proof',
                'icon' => 'Quote',
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
            'AccordionBlock' => [
                'name' => 'Accordion',
                'description' => 'Collapsible content sections with editable titles, descriptions, and add/remove controls.',
                'category' => 'Content',
                'icon' => 'ChevronDown',
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
            'GridBlock' => [
                'name' => 'Grid',
                'description' => 'Responsive CSS grid container with desktop, tablet and mobile column counts.',
                'category' => 'Layout',
                'icon' => 'LayoutGrid',
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
            'IconListBlock' => [
                'name' => 'Feature List',
                'description' => 'Editable feature list with optional ordered or unordered markers and bold text.',
                'category' => 'Content',
                'icon' => 'ListChecks',
            ],
            'ImageCarouselBlock' => [
                'name' => 'Image Carousel',
                'description' => 'Responsive image slider with configurable desktop and mobile items per view.',
                'category' => 'Media',
                'icon' => 'Images',
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
