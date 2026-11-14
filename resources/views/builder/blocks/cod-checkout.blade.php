@php
    $buttonText = $props['buttonText'] ?? 'Confirm Order - Cash on Delivery';
    $nameLabel = $props['nameLabel'] ?? 'আপনার নাম';
    $namePlaceholder = $props['namePlaceholder'] ?? 'আপনার পুরো নাম লিখুন...';
    $phoneLabel = $props['phoneLabel'] ?? 'মোবাইল নাম্বার';
    $phonePlaceholder = $props['phonePlaceholder'] ?? '01XXXXXXXXX (১১ ডিজিট)';
    $addressLabel = $props['addressLabel'] ?? 'সম্পূর্ণ ডেলিভারি ঠিকানা';
    $addressPlaceholder = $props['addressPlaceholder'] ?? 'বাসা/হোল্ডিং নং, রোড নং, এলাকা, থানা ও জেলা...';
    $shippingLabel = $props['shippingLabel'] ?? 'শিপিং মেথড';
    $mode = $selectionMode ?? ($props['selectionMode'] ?? 'single');
    $defaultSelection = $props['defaultSelection'] ?? 'first';
    $defaultSelectedId = (int) ($props['defaultSelectedId'] ?? 0);
    $showDiscountBadge = $props['showDiscountBadge'] ?? true;
    $badgeText = $props['badgeText'] ?? 'Best Value';
    $productBadges = $props['productBadges'] ?? [];
    $hasMultiple = isset($products) && $products->count() > 1;
    $firstProduct = $products->first() ?? $product;
    $firstVariant = $firstProduct?->variants?->first();
    $firstVariantId = $firstVariant?->id ?? 0;

    // Visibility & copy controls
    $showHeader = $props['showHeader'] ?? true;
    $showHeaderBadge = $props['showHeaderBadge'] ?? true;
    $showHeaderTitle = $props['showHeaderTitle'] ?? true;
    $showHeaderSubtitle = $props['showHeaderSubtitle'] ?? true;
    $showProductSelector = $props['showProductSelector'] ?? true;
    $showVariants = $props['showVariants'] ?? true;
    $showSummary = $props['showSummary'] ?? true;
    $showTrustBadges = $props['showTrustBadges'] ?? true;
    $showRequiredMark = $props['showRequiredMark'] ?? true;
    $headerBadgeText = $props['headerBadgeText'] ?? 'Fast & Secure Checkout';
    $headerTitle = $props['headerTitle'] ?? 'Cash On Delivery Available Nationwide';
    $headerSubtitle = $props['headerSubtitle'] ?? 'Pay in cash only after receiving and inspecting your parcel.';
    $headerAlign = $props['headerAlign'] ?? 'center';
    $trustText1 = $props['trustText1'] ?? '১০০% ক্যাশ অন ডেলিভারি';
    $trustText2 = $props['trustText2'] ?? 'প্রোডাক্ট দেখে মূল্য পরিশোধ';

    /**
     * Only design tokens are accepted here. Semicolons, braces and remote
     * resource loaders are rejected so a props value can never escape its
     * inline declaration or inject additional CSS.
     */
    $safeCss = static function ($value): ?string {
        if (! is_string($value) && ! is_numeric($value)) {
            return null;
        }

        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        if (preg_match('/(?:expression\s*\(|@import|url\s*\(|javascript\s*:|behavior\s*:|-moz-binding|[;{}<>\\\\])/i', $value)) {
            return null;
        }

        return $value;
    };

    $inlineStyle = static function (array $declarations) use ($safeCss): string {
        $parts = [];

        foreach ($declarations as $property => $value) {
            $safeValue = $safeCss($value);

            if ($safeValue !== null) {
                $parts[] = $property.': '.$safeValue;
            }
        }

        return $parts === [] ? '' : 'style="'.e(implode('; ', $parts)).'"';
    };

    $accentColor = $safeCss($props['accentColor'] ?? ($props['highlightColor'] ?? '#059669')) ?: '#059669';
    $requiredMarkColor = $safeCss($props['requiredMarkColor'] ?? '#f43f5e') ?: '#f43f5e';
    $inputHorizontalPadding = $safeCss($props['inputPaddingX'] ?? '12px') ?: '12px';
    $productPanelTitleColor = $safeCss($props['productPanelTitleColor'] ?? '#334155') ?: '#334155';
    $productOldPriceColor = $safeCss($props['productOldPriceColor'] ?? '#94a3b8') ?: '#94a3b8';
    $productImageFit = ($props['productImageFit'] ?? 'cover') === 'contain' ? 'contain' : 'cover';
    $variantTextColor = $safeCss($props['variantTextColor'] ?? '#64748b') ?: '#64748b';
    $summaryBorderColor = $safeCss($props['summaryBorderColor'] ?? '#e2e8f0') ?: '#e2e8f0';
    $trustIconColor = $safeCss($props['trustIconColor'] ?? $accentColor) ?: $accentColor;

    $rawContainerMaxWidth = $safeCss($props['containerMaxWidth'] ?? null);
    $rawContainerPad = $safeCss($props['containerPaddingX'] ?? null);
    $explicitContainerPad = ($rawContainerPad !== null && $rawContainerPad !== '16px') ? $rawContainerPad : null;
    $stylePadAll = $safeCss($styles['padding'] ?? null);
    $containerStyle = $inlineStyle([
        'max-width' => ($rawContainerMaxWidth && $rawContainerMaxWidth !== '672px' && $rawContainerMaxWidth !== '1080px') ? $rawContainerMaxWidth : '1280px',
        'padding-top' => $explicitContainerPad ?? $safeCss($styles['paddingTop'] ?? ($styles['padding-top'] ?? null)) ?? $stylePadAll ?? '16px',
        'padding-bottom' => $explicitContainerPad ?? $safeCss($styles['paddingBottom'] ?? ($styles['padding-bottom'] ?? null)) ?? $stylePadAll ?? '16px',
        'padding-left' => $explicitContainerPad ?? $safeCss($styles['paddingLeft'] ?? ($styles['padding-left'] ?? null)) ?? $stylePadAll,
        'padding-right' => $explicitContainerPad ?? $safeCss($styles['paddingRight'] ?? ($styles['padding-right'] ?? null)) ?? $stylePadAll,
    ]);

    $pickCardToken = static function ($propVal, string $defaultVal, $styleVal = null) use ($safeCss): string {
        $safeProp = $safeCss($propVal);
        $safeStyle = $safeCss($styleVal);
        if ($safeProp !== null && $safeProp !== $defaultVal) {
            return $safeProp;
        }

        return $safeStyle ?? $safeProp ?? $defaultVal;
    };

    $resolvedCardBorderWidth = $pickCardToken(
        $props['cardBorderWidth'] ?? null,
        '2px',
        $styles['borderWidth'] ?? ($styles['border-width'] ?? null)
    );
    $propBorderStyle = $safeCss($props['cardBorderStyle'] ?? null);
    $styleBorderStyle = $safeCss($styles['borderStyle'] ?? ($styles['border-style'] ?? null));
    $resolvedCardBorderStyle = ($propBorderStyle !== null && $propBorderStyle !== 'solid')
        ? $propBorderStyle
        : ($styleBorderStyle ?? $propBorderStyle ?? 'solid');
    $isCardBorderless = $resolvedCardBorderStyle === 'none'
        || (bool) preg_match('/^0(?:\.0+)?(?:[a-z%]+)?$/i', $resolvedCardBorderWidth);

    $cardStyle = $inlineStyle([
        'font-family' => $props['fontFamily'] ?? null,
        '--cod-accent' => $accentColor,
        '--cod-focus' => $props['inputFocusColor'] ?? $accentColor,
        '--cod-focus-ring' => $props['inputFocusRingColor'] ?? 'rgba(16, 185, 129, 0.18)',
        '--cod-focus-ring-width' => $props['inputFocusRingWidth'] ?? '3px',
        '--cod-placeholder' => $props['inputPlaceholderColor'] ?? '#94a3b8',
        '--cod-btn-hover' => $props['buttonHoverBgColor'] ?? '#047857',
        '--cod-card-selected-bg' => $props['productCardSelectedBgColor'] ?? '#ecfdf5',
        '--cod-card-selected-border' => $props['productCardSelectedBorderColor'] ?? $accentColor,
        '--cod-card-selected-width' => $props['productCardSelectedBorderWidth'] ?? '2px',
        '--cod-variant-active-bg' => $props['variantSelectedBgColor'] ?? $accentColor,
        '--cod-variant-active-text' => $props['variantSelectedTextColor'] ?? '#ffffff',
        '--cod-variant-active-border' => $props['variantSelectedBorderColor'] ?? $accentColor,
        'background-color' => $props['cardBgColor'] ?? '#ffffff',
        'border-color' => $pickCardToken(
            $props['cardBorderColor'] ?? null,
            '#10b981',
            $styles['borderColor'] ?? ($styles['border-color'] ?? null)
        ),
        'border-width' => $isCardBorderless ? '0px' : $resolvedCardBorderWidth,
        'border-style' => $isCardBorderless ? 'none' : $resolvedCardBorderStyle,
        'border-radius' => $pickCardToken(
            $props['cardBorderRadius'] ?? null,
            '24px',
            $styles['borderRadius'] ?? ($styles['border-radius'] ?? null)
        ),
        'min-height' => $props['cardMinHeight'] ?? null,
        'padding-top' => $safeCss($props['cardPaddingTop'] ?? null) ?? '32px',
        'padding-bottom' => $safeCss($props['cardPaddingBottom'] ?? null) ?? '32px',
        'padding-left' => $safeCss($props['cardPaddingLeft'] ?? null) ?? '32px',
        'padding-right' => $safeCss($props['cardPaddingRight'] ?? null) ?? '32px',
        'box-shadow' => $pickCardToken(
            $props['cardShadow'] ?? null,
            '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            $styles['boxShadow'] ?? ($styles['box-shadow'] ?? null)
        ),
    ]);

    $headerStyle = $inlineStyle([
        'text-align' => $headerAlign,
        'padding-top' => $props['headerPaddingTop'] ?? '0px',
        'padding-bottom' => $props['headerPaddingBottom'] ?? '24px',
        'border-bottom-width' => $props['headerBorderWidth'] ?? '1px',
        'border-bottom-style' => 'solid',
        'border-bottom-color' => $props['headerBorderColor'] ?? '#f1f5f9',
    ]);

    $bodyStyle = $inlineStyle([
        'padding-top' => $props['bodyPaddingTop'] ?? '24px',
        'display' => 'flex',
        'flex-direction' => 'column',
        'gap' => $props['fieldGap'] ?? '24px',
    ]);

    $badgeStyle = $inlineStyle([
        'display' => 'inline-flex',
        'align-items' => 'center',
        'gap' => '6px',
        'padding' => ($safeCss($props['badgePaddingY'] ?? '4px') ?: '4px').' '.($safeCss($props['badgePaddingX'] ?? '12px') ?: '12px'),
        'border-radius' => $props['badgeBorderRadius'] ?? '9999px',
        'background-color' => $props['badgeBgColor'] ?? '#d1fae5',
        'color' => $props['badgeTextColor'] ?? '#065f46',
        'font-size' => $props['badgeFontSize'] ?? '11px',
        'font-weight' => $props['badgeFontWeight'] ?? '700',
        'letter-spacing' => '0.05em',
        'text-transform' => 'uppercase',
        'margin-bottom' => '8px',
    ]);

    $titleStyle = $inlineStyle([
        'color' => $props['titleColor'] ?? '#0f172a',
        'font-size' => $props['titleFontSize'] ?? '30px',
        'font-weight' => $props['titleFontWeight'] ?? '800',
        'line-height' => $props['titleLineHeight'] ?? '1.2',
        'letter-spacing' => $props['titleLetterSpacing'] ?? null,
        'margin' => '0',
        'margin-bottom' => $props['titleMarginBottom'] ?? '4px',
    ]);

    $subtitleStyle = $inlineStyle([
        'color' => $props['subtitleColor'] ?? '#64748b',
        'font-size' => $props['subtitleFontSize'] ?? '13px',
        'line-height' => $props['subtitleLineHeight'] ?? '1.5',
        'letter-spacing' => $props['subtitleLetterSpacing'] ?? null,
        'margin' => '0',
    ]);

    $productPanelStyle = $inlineStyle([
        'background-color' => $props['productPanelBgColor'] ?? '#f8fafc',
        'border-color' => $props['productPanelBorderColor'] ?? '#e2e8f0',
        'border-width' => '1px',
        'border-style' => 'solid',
        'border-radius' => $props['productPanelBorderRadius'] ?? '12px',
        'padding' => $props['productPanelPadding'] ?? '12px',
    ]);

    $productCardBaseStyle = [
        'background-color' => $props['productCardBgColor'] ?? '#ffffff',
        'border-color' => $props['productCardBorderColor'] ?? '#e2e8f0',
        'border-width' => $props['productCardBorderWidth'] ?? '1px',
        'border-style' => 'solid',
        'border-radius' => $props['productCardBorderRadius'] ?? '12px',
        'padding' => $props['productCardPadding'] ?? '10px',
    ];

    $productThumbStyle = $inlineStyle([
        'width' => $props['productImageSize'] ?? '48px',
        'height' => $props['productImageSize'] ?? '48px',
        'border-radius' => $props['productImageRadius'] ?? '8px',
    ]);

    $productTitleStyle = $inlineStyle([
        'color' => $props['productTitleColor'] ?? '#0f172a',
        'font-size' => $props['productTitleFontSize'] ?? '12px',
        'font-weight' => $props['productTitleFontWeight'] ?? '700',
    ]);

    $productInfoStyle = $inlineStyle([
        'color' => $props['productInfoTextColor'] ?? '#64748b',
        'font-size' => $props['productInfoFontSize'] ?? '10px',
    ]);

    $productPriceStyle = $inlineStyle([
        'color' => $props['productPriceColor'] ?? $accentColor,
        'font-size' => $props['productPriceFontSize'] ?? '14px',
    ]);

    $productBadgeStyle = $inlineStyle([
        'background-color' => $props['productBadgeBgColor'] ?? '#fef3c7',
        'color' => $props['productBadgeTextColor'] ?? '#92400e',
        'border-radius' => $props['productBadgeBorderRadius'] ?? '9999px',
        'font-size' => $props['productBadgeFontSize'] ?? '9px',
    ]);

    $labelStyle = $inlineStyle([
        'display' => 'block',
        'color' => $props['labelColor'] ?? '#334155',
        'font-size' => $props['labelFontSize'] ?? '11px',
        'font-weight' => $props['labelFontWeight'] ?? '700',
        'line-height' => $props['labelLineHeight'] ?? '1.35',
        'letter-spacing' => $props['labelLetterSpacing'] ?? '0.05em',
        'text-transform' => $props['labelTextTransform'] ?? 'uppercase',
        'margin-bottom' => $props['labelMarginBottom'] ?? '4px',
    ]);

    $inputStyle = $inlineStyle([
        'width' => '100%',
        'background-color' => $props['inputBgColor'] ?? '#ffffff',
        'color' => $props['inputTextColor'] ?? '#0f172a',
        'border-color' => $props['inputBorderColor'] ?? '#cbd5e1',
        'border-width' => $props['inputBorderWidth'] ?? '1px',
        'border-style' => 'solid',
        'border-radius' => $props['inputBorderRadius'] ?? '12px',
        'padding-top' => $props['inputPaddingY'] ?? '10px',
        'padding-bottom' => $props['inputPaddingY'] ?? '10px',
        'padding-left' => $inputHorizontalPadding,
        'padding-right' => $inputHorizontalPadding,
        'font-size' => $props['inputFontSize'] ?? '14px',
        'font-weight' => $props['inputFontWeight'] ?? '400',
        'min-height' => $props['inputMinHeight'] ?? null,
        'font-family' => 'inherit',
        'transition' => 'border-color 0.15s ease, box-shadow 0.15s ease',
    ]);

    $shippingStyle = $inlineStyle([
        'width' => '100%',
        'background-color' => $props['shippingBgColor'] ?? '#ecfdf5',
        'color' => $props['shippingTextColor'] ?? '#0f172a',
        'border-color' => $props['shippingBorderColor'] ?? '#10b981',
        'border-width' => $props['shippingBorderWidth'] ?? '2px',
        'border-style' => 'solid',
        'border-radius' => $props['shippingBorderRadius'] ?? '12px',
        'padding' => $props['shippingPadding'] ?? '10px',
        'font-size' => $props['shippingFontSize'] ?? '14px',
        'font-weight' => $props['shippingFontWeight'] ?? '600',
        'font-family' => 'inherit',
    ]);

    $summaryStyle = $inlineStyle([
        'background-color' => $props['summaryBgColor'] ?? '#f8fafc',
        'border-color' => $props['summaryBorderColor'] ?? '#e2e8f0',
        'border-width' => $props['summaryBorderWidth'] ?? '1px',
        'border-style' => 'solid',
        'border-radius' => $props['summaryBorderRadius'] ?? '12px',
        'padding' => $props['summaryPadding'] ?? '16px',
        'color' => $props['summaryTextColor'] ?? '#475569',
        'font-size' => $props['summaryFontSize'] ?? '12px',
        'display' => 'flex',
        'flex-direction' => 'column',
        'gap' => $props['summaryRowGap'] ?? '8px',
    ]);

    $summaryValueStyle = $inlineStyle([
        'color' => $props['summaryValueColor'] ?? '#1e293b',
    ]);

    $summaryTotalStyle = $inlineStyle([
        'color' => $props['summaryTotalColor'] ?? $accentColor,
        'font-size' => $props['summaryTotalFontSize'] ?? '18px',
    ]);

    $buttonBg = $props['buttonBgColor'] ?? ($styles['buttonBgColor'] ?? '#059669');
    $buttonTextColor = $props['buttonTextColor'] ?? ($styles['buttonTextColor'] ?? '#ffffff');
    $buttonPulse = ! empty($styles['buttonPulseAnimation']);

    $buttonStyle = $inlineStyle([
        'width' => ($props['buttonWidth'] ?? 'full') === 'auto' ? 'auto' : '100%',
        'background-color' => $buttonBg,
        'color' => $buttonTextColor,
        'border-width' => $props['buttonBorderWidth'] ?? '0px',
        'border-style' => 'solid',
        'border-color' => $props['buttonBorderColor'] ?? $buttonBg,
        'border-radius' => $props['buttonBorderRadius'] ?? '12px',
        'min-height' => $props['buttonMinHeight'] ?? null,
        'padding-top' => $props['buttonPaddingY'] ?? '16px',
        'padding-bottom' => $props['buttonPaddingY'] ?? '16px',
        'padding-left' => $props['buttonPaddingX'] ?? '24px',
        'padding-right' => $props['buttonPaddingX'] ?? '24px',
        'font-size' => $props['buttonFontSize'] ?? '16px',
        'font-weight' => $props['buttonFontWeight'] ?? '800',
        'box-shadow' => $props['buttonShadow'] ?? '0 20px 25px -5px rgb(5 150 105 / 0.3)',
        'text-transform' => $props['buttonTextTransform'] ?? 'none',
        'letter-spacing' => $props['buttonLetterSpacing'] ?? '0px',
        'transition' => 'background-color 0.15s ease, transform 0.15s ease',
    ]);

    $trustRowStyle = $inlineStyle([
        'padding-top' => $props['trustPaddingTop'] ?? '8px',
        'color' => $props['trustTextColor'] ?? '#64748b',
        'font-size' => $props['trustFontSize'] ?? '11px',
        'font-weight' => $props['trustFontWeight'] ?? '400',
        'gap' => $props['trustGap'] ?? '16px',
    ]);

    $trustIconSize = $safeCss($props['trustIconSize'] ?? '14px') ?: '14px';

    // Resolve active shipping methods or fallbacks
    $activeMethods = $shippingMethods ?? collect();
    if ($activeMethods->isEmpty()) {
        $activeMethods = collect([
            (object) [
                'id' => 1,
                'name' => 'Inside Dhaka',
                'rate' => 70.0,
                'delivery_time' => '24-48 hours',
                'zone_code' => 'inside_dhaka',
            ],
            (object) [
                'id' => 2,
                'name' => 'Outside Dhaka',
                'rate' => 130.0,
                'delivery_time' => '48-72 hours',
                'zone_code' => 'outside_dhaka',
            ],
        ]);
    }
    $firstMethod = $activeMethods->first();
    $defaultShippingFee = (float) ($firstMethod?->rate ?? 70.0);

    $resolveProductImgUrl = static function ($prod, $variant = null): ?string {
        $vUrl = $variant?->images?->first()?->url;
        if ($vUrl) return $vUrl;
        $pUrl = $prod?->primaryImage?->url ?? ($prod?->images?->first()?->url ?? null);
        if ($pUrl) return $pUrl;
        if (is_array($prod?->combo_colors ?? null)) {
            foreach ($prod->combo_colors as $cc) {
                if (!empty($cc['image_url'])) {
                    return (string) $cc['image_url'];
                }
            }
        }
        return null;
    };

    $extractComboColors = static function ($prod, ?string $fallbackImg): array {
        $raw = is_array($prod?->combo_colors ?? null) ? $prod->combo_colors : [];
        $out = [];
        foreach ($raw as $c) {
            if (!is_array($c)) continue;
            $name = trim((string) ($c['name'] ?? ''));
            if ($name === '') continue;
            $img = trim((string) ($c['image_url'] ?? ''));
            $out[] = [
                'name' => $name,
                'image_url' => $img !== '' ? $img : ($fallbackImg ?? ''),
            ];
        }
        return $out;
    };

    $extractComboSizes = static function ($prod): array {
        $raw = is_array($prod?->combo_sizes ?? null) ? $prod->combo_sizes : [];
        $out = [];
        foreach ($raw as $sz) {
            $clean = trim((string) $sz);
            if ($clean !== '') $out[] = $clean;
        }
        return $out;
    };

    $comboMetaByPid = [];
    $productsCollection = isset($products) && $products->isNotEmpty() ? $products : collect(array_filter([$product ?? null]));
    foreach ($productsCollection as $metaProd) {
        if (!$metaProd) continue;
        $metaPackSize = max(1, (int) ($metaProd->combo_pack_size ?? 1));
        $metaImg = $resolveProductImgUrl($metaProd, $metaProd->variants?->first());
        $comboMetaByPid[$metaProd->id] = [
            'id' => $metaProd->id,
            'title' => $metaProd->title,
            'is_combo' => $metaPackSize > 1,
            'pack_size' => $metaPackSize,
            'colors' => $extractComboColors($metaProd, $metaImg),
            'sizes' => $extractComboSizes($metaProd),
            'main_image' => $metaImg ?? '',
        ];
    }
@endphp

<style>
    #cod-checkout input:focus,
    #cod-checkout select:focus,
    #cod-checkout textarea:focus {
        outline: none !important;
        border-color: var(--cod-focus, #10b981) !important;
        box-shadow: 0 0 0 var(--cod-focus-ring-width, 3px) var(--cod-focus-ring, rgba(16, 185, 129, 0.18)) !important;
    }

    #cod-checkout input::placeholder,
    #cod-checkout textarea::placeholder {
        color: var(--cod-placeholder, #94a3b8) !important;
        opacity: 1;
    }

    #cod-checkout .cod-submit-btn:hover:not(:disabled) {
        background-color: var(--cod-btn-hover, #047857) !important;
    }

    #cod-checkout .cod-product-card {
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }

    #cod-checkout .cod-product-card.cod-card-selected {
        background-color: var(--cod-card-selected-bg, #ecfdf5) !important;
        border-color: var(--cod-card-selected-border, #10b981) !important;
        border-width: var(--cod-card-selected-width, 2px) !important;
    }

    #cod-checkout .cod-variant-btn.cod-variant-active {
        background-color: var(--cod-variant-active-bg, #059669) !important;
        color: var(--cod-variant-active-text, #ffffff) !important;
        border-color: var(--cod-variant-active-border, #059669) !important;
        font-weight: 700 !important;
    }

    #cod-checkout .cod-product-card:not(.cod-card-selected):hover {
        border-color: var(--cod-accent, #10b981) !important;
    }
</style>

<section id="cod-checkout" {!! $styleAttribute !!} data-lc-el="section" class="lc-block-root w-full">
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 [.lc-container_&]:max-w-none [.lc-container_&]:px-0 [.lc-grid_&]:max-w-none [.lc-grid_&]:px-0" data-lc-el="container" {!! $containerStyle !!}>
        <div {!! $cardStyle !!} data-lc-el="card">
            @if ($showHeader)
                <div {!! $headerStyle !!} data-lc-el="header">
                    @if ($showHeaderBadge)
                        <div {!! $badgeStyle !!}>
                            <svg class="h-4 w-4" style="color: {{ e($accentColor) }}" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                            </svg>
                            <span>{{ $headerBadgeText }}</span>
                        </div>
                    @endif
                    @if ($showHeaderTitle)
                        <h2 {!! $titleStyle !!} data-lc-el="title">{{ $headerTitle }}</h2>
                    @endif
                    @if ($showHeaderSubtitle)
                        <p {!! $subtitleStyle !!} data-lc-el="subtitle">{{ $headerSubtitle }}</p>
                    @endif
                </div>
            @endif

            <form id="landing-cod-form" method="POST" action="{{ route('checkout.cod.store') }}"
                {!! $bodyStyle !!}>
                @csrf
                <input type="hidden" name="idempotency_key" id="cod_idempotency_key"
                    value="{{ Str::uuid()->toString() }}" />
                <input type="hidden" name="district" id="cod_district" value="Dhaka" />

                {{-- Off-screen honeypot protection --}}
                <div class="hidden" aria-hidden="true">
                    <input type="text" name="website_url" tabindex="-1" autocomplete="off" />
                    <input type="text" name="_hp_trap" tabindex="-1" autocomplete="off" />
                    <input type="text" name="fax_number" tabindex="-1" autocomplete="off" />
                </div>

                {{-- Global Combo Metadata JSON for JS state (works in both multi & single product modes) --}}
                <script type="application/json" id="cod-products-combo-meta">
                    {!! json_encode($comboMetaByPid, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) !!}
                </script>

                {{-- Product selection cards in Checkout form --}}
                @if ($hasMultiple && $showProductSelector)
                    <div {!! $productPanelStyle !!}>
                        <div class="flex items-center justify-between"
                            style="margin-bottom: 10px; color: {{ e($productPanelTitleColor) }}; font-size: 15px; font-weight: 700;">
                            <span>Your Products</span>
                            <span class="text-xs font-semibold" style="color: {{ e($accentColor) }};">
                                {{ $mode === 'multiple' ? 'Multiple Selection' : 'Select Product' }}
                            </span>
                        </div>

                        <div class="flex flex-col" style="gap: {{ e($safeCss($props['productCardGap'] ?? '8px') ?: '8px') }};">
                            @foreach ($products as $pIndex => $pItem)
                                @php
                                    $pVar = $pItem->variants->first();
                                    $pVarId = $pVar?->id ?? 0;
                                    $pEffPrice =
                                        (float) ($pVar?->sale_price ??
                                            ($pVar?->regular_price ?? ($pItem->sale_price ?? $pItem->regular_price)));
                                    $pRegPrice = (float) ($pVar?->regular_price ?? $pItem->regular_price);
                                    $pHasDiscount = $pEffPrice < $pRegPrice;
                                    $pDiscountPct =
                                        $pHasDiscount && $pRegPrice > 0
                                            ? round((($pRegPrice - $pEffPrice) / $pRegPrice) * 100)
                                            : 0;
                                    $pImgUrl = $resolveProductImgUrl($pItem, $pVar);

                                    $pComboMeta = $comboMetaByPid[$pItem->id] ?? [
                                        'is_combo' => false,
                                        'pack_size' => 1,
                                        'colors' => [],
                                        'sizes' => [],
                                    ];
                                    $pIsCombo = !empty($pComboMeta['is_combo']);
                                    $pPackSize = (int) ($pComboMeta['pack_size'] ?? 1);
                                    $pComboSizes = $pComboMeta['sizes'] ?? [];

                                    // Per-product badge customization
                                    $itemBadge = $productBadges[$pItem->id] ?? ($pIndex === 0 ? $badgeText : null);

                                    // Determine initial checked state based on defaultSelection
                                    if ($defaultSelection === 'all') {
                                        $isItemChecked = true;
                                    } elseif ($defaultSelection === 'specific' && $defaultSelectedId > 0) {
                                        $isItemChecked = $pItem->id === $defaultSelectedId;
                                    } else {
                                        $isItemChecked = $pIndex === 0;
                                    }

                                    $itemCardStyle = $inlineStyle($productCardBaseStyle);
                                @endphp
                                <div class="cod-product-card relative flex flex-col {{ $isItemChecked ? 'cod-card-selected' : '' }}"
                                    data-lc-el="product-card"
                                    data-product-id="{{ $pItem->id }}"
                                    data-is-combo="{{ $pIsCombo ? '1' : '0' }}"
                                    {!! $itemCardStyle !!}>
                                    <div class="flex w-full flex-wrap items-center justify-between gap-3">
                                        <label class="flex min-w-0 flex-1 cursor-pointer items-center space-x-3">
                                            {{-- Selector Input --}}
                                            @if ($mode === 'multiple')
                                                <input type="checkbox"
                                                    class="cod-product-toggle h-4 w-4 flex-shrink-0 rounded"
                                                    style="accent-color: {{ e($accentColor) }};"
                                                    data-product-id="{{ $pItem->id }}"
                                                    data-variant-id="{{ $pVarId }}"
                                                    data-price="{{ $pEffPrice }}"
                                                    data-title="{{ e($pItem->title) }}"
                                                    data-image="{{ e($pImgUrl ?? '') }}"
                                                    {{ $isItemChecked ? 'checked' : '' }} />
                                            @else
                                                <input type="radio" name="cod_radio_product"
                                                    class="cod-product-toggle h-4 w-4 flex-shrink-0"
                                                    style="accent-color: {{ e($accentColor) }};"
                                                    data-product-id="{{ $pItem->id }}"
                                                    data-variant-id="{{ $pVarId }}"
                                                    data-price="{{ $pEffPrice }}"
                                                    data-title="{{ e($pItem->title) }}"
                                                    data-image="{{ e($pImgUrl ?? '') }}"
                                                    {{ $isItemChecked ? 'checked' : '' }} />
                                            @endif

                                            {{-- Product Thumbnail --}}
                                            <div class="flex flex-shrink-0 items-center justify-center overflow-hidden border border-gray-200 bg-gray-50"
                                                {!! $productThumbStyle !!}>
                                                @if ($pImgUrl)
                                                    <img src="{{ e($pImgUrl) }}" alt="{{ e($pItem->title) }}"
                                                        class="cod-card-img h-full w-full"
                                                        style="object-fit: {{ e($productImageFit) }};" />
                                                @else
                                                    <svg class="h-6 w-6 text-gray-300" fill="none"
                                                        stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            stroke-width="2"
                                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                @endif
                                            </div>

                                            {{-- Title & Badge --}}
                                            <div class="min-w-0 flex-1">
                                                <div class="mb-0.5 flex flex-wrap items-center gap-1.5">
                                                    <span class="block truncate font-bold" {!! $productTitleStyle !!}>
                                                        {{ $pItem->title }}
                                                    </span>
                                                    @if ($pIsCombo)
                                                        <span class="flex-shrink-0 rounded-full bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-900">
                                                            {{ $pPackSize }} Pcs Combo
                                                        </span>
                                                    @endif
                                                    @if (!empty($itemBadge))
                                                        <span class="flex-shrink-0 px-1.5 py-0.5 font-bold"
                                                            {!! $productBadgeStyle !!}>
                                                            {{ $itemBadge }}
                                                        </span>
                                                    @endif
                                                </div>

                                                <div class="flex items-baseline space-x-2">
                                                    <span class="cod-card-price font-extrabold"
                                                        data-unit-price="{{ $pEffPrice }}"
                                                        {!! $productPriceStyle !!}>
                                                        ৳{{ number_format($pEffPrice, 0) }}
                                                    </span>
                                                    @if ($pHasDiscount)
                                                        <span class="text-[10px] line-through"
                                                            style="color: {{ e($productOldPriceColor) }};">
                                                            ৳{{ number_format($pRegPrice, 0) }}
                                                        </span>
                                                        @if ($showDiscountBadge)
                                                            <span class="text-[10px] font-bold text-rose-600">
                                                                ({{ $pDiscountPct }}% OFF)
                                                            </span>
                                                        @endif
                                                    @endif
                                                </div>
                                            </div>
                                        </label>

                                        {{-- Quantity Stepper --}}
                                        <div class="flex items-center rounded-md border border-slate-200 bg-white">
                                            <button type="button"
                                                class="cod-qty-minus px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                                aria-label="Decrease quantity">&minus;</button>
                                            <span class="cod-qty-val min-w-[26px] text-center text-xs font-bold text-slate-800"
                                                data-qty="1">1</span>
                                            <button type="button"
                                                class="cod-qty-plus px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                                aria-label="Increase quantity">+</button>
                                        </div>
                                    </div>

                                    {{-- Combo Pack `[ + ]` Boxes & Size selector inside selected card --}}
                                    @if ($pIsCombo)
                                        <div class="cod-combo-container mt-2.5 border-t border-slate-200/80 pt-2.5 space-y-2.5 {{ $isItemChecked ? '' : 'hidden' }}"
                                            data-product-id="{{ $pItem->id }}">
                                            <div class="flex flex-wrap items-center justify-between gap-2">
                                                <span class="text-[11px] font-bold text-slate-800">
                                                    পছন্দের {{ $pPackSize }}টি কালার সিলেক্ট করুন (<span class="cod-combo-filled-count">0</span>/{{ $pPackSize }})
                                                </span>
                                                <button type="button"
                                                    class="cod-open-combo-modal-btn text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 transition cursor-pointer"
                                                    data-product-id="{{ $pItem->id }}">
                                                    কালার বাছাই করুন
                                                </button>
                                            </div>

                                            <div class="cod-combo-slots-row flex flex-wrap items-center gap-2">
                                                @for ($sIdx = 0; $sIdx < $pPackSize; $sIdx++)
                                                    <div role="button" tabindex="0"
                                                        class="cod-combo-slot-box relative w-14 h-16 rounded-lg border-2 border-dashed border-amber-400 bg-amber-100/60 hover:bg-amber-100 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden select-none"
                                                        data-product-id="{{ $pItem->id }}"
                                                        data-slot-index="{{ $sIdx }}">
                                                        <span class="absolute top-0.5 left-0.5 z-10 w-3.5 h-3.5 rounded-full bg-slate-900/75 text-white text-[8px] font-bold flex items-center justify-center">{{ $sIdx + 1 }}</span>
                                                        <div class="slot-empty-ui flex flex-col items-center justify-center gap-0.5 text-amber-900">
                                                            <span class="text-xs font-bold">+</span>
                                                            <span class="text-[8px] font-bold">+ কালার</span>
                                                        </div>
                                                        <img class="slot-img-ui w-full h-10 object-cover hidden" src="" alt="" />
                                                        <span class="slot-name-ui w-full px-0.5 py-0.5 text-[8px] font-bold text-slate-800 text-center truncate bg-white/95 border-t border-slate-100 hidden"></span>
                                                        <button type="button" class="cod-combo-slot-clear hidden absolute top-0.5 right-0.5 z-10 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center hover:bg-rose-700"
                                                            data-product-id="{{ $pItem->id }}" data-slot-index="{{ $sIdx }}">×</button>
                                                    </div>
                                                @endfor
                                            </div>

                                            @if (count($pComboSizes) > 0)
                                                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                                                    <span class="text-[10px] font-bold text-slate-600 mr-1">সাইজ (Size):</span>
                                                    @foreach ($pComboSizes as $szIdx => $szVal)
                                                        <button type="button"
                                                            class="cod-combo-size-btn px-2.5 py-1 rounded-md text-[10px] font-bold border transition cursor-pointer {{ $szIdx === 0 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500' }}"
                                                            data-product-id="{{ $pItem->id }}"
                                                            data-size="{{ e($szVal) }}">
                                                            {{ $szVal }}
                                                        </button>
                                                    @endforeach
                                                </div>
                                            @endif
                                        </div>
                                    @elseif ($showVariants && $pItem->variants->count() > 1)
                                        {{-- Standard Variants selector inside card (only shown when product is selected) --}}
                                        <div class="cod-variant-container mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2 {{ $isItemChecked ? '' : 'hidden' }}">
                                            <span
                                                class="mr-1 text-[10px] font-bold uppercase tracking-wider"
                                                style="color: {{ e($variantTextColor) }};">ভ্যারিয়েন্ট:</span>
                                            @foreach ($pItem->variants as $vIdx => $vObj)
                                                @php
                                                    $vItemPrice = (float) ($vObj->sale_price ?? $vObj->regular_price);
                                                    $vItemImg = $vObj->images->first()?->url ?? $pImgUrl;
                                                    $isVActive = $vIdx === 0;
                                                    $variantButtonStyle = $inlineStyle([
                                                        'background-color' => $props['variantBgColor'] ?? '#ffffff',
                                                        'color' => $variantTextColor,
                                                        'border-color' => $props['variantBorderColor'] ?? '#e2e8f0',
                                                        'border-radius' => $props['variantBorderRadius'] ?? '6px',
                                                        'font-size' => $props['variantFontSize'] ?? '11px',
                                                        'font-weight' => '500',
                                                        'padding' => '2px 8px',
                                                    ]);
                                                @endphp
                                                <button type="button"
                                                    class="cod-variant-btn rounded-md border transition {{ $isVActive ? 'cod-variant-active' : '' }}"
                                                    {!! $variantButtonStyle !!}
                                                    data-product-id="{{ $pItem->id }}"
                                                    data-variant-id="{{ $vObj->id }}"
                                                    data-price="{{ $vItemPrice }}" data-image="{{ $vItemImg }}"
                                                    data-name="{{ e($vObj->name) }}">
                                                    {{ $vObj->name }}
                                                </button>
                                            @endforeach
                                        </div>
                                    @endif
                                </div>
                            @endforeach
                        </div>
                    </div>
                @else
                    {{-- Standalone Combo Configurator when Top Product Selector is hidden OR single combo product --}}
                    @php
                        $standaloneComboProd = ($firstProduct && (($comboMetaByPid[$firstProduct->id]['is_combo'] ?? false))) ? $firstProduct : null;
                        $standaloneComboMeta = $standaloneComboProd ? ($comboMetaByPid[$standaloneComboProd->id] ?? null) : null;
                    @endphp
                    @if ($standaloneComboProd && $standaloneComboMeta)
                        @php
                            $sPackSize = (int) ($standaloneComboMeta['pack_size'] ?? 2);
                            $sComboSizes = $standaloneComboMeta['sizes'] ?? [];
                        @endphp
                        <div class="cod-combo-container rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 space-y-3"
                            data-product-id="{{ $standaloneComboProd->id }}">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <span class="text-xs font-bold text-slate-800">
                                    {{ $standaloneComboProd->title }} — পছন্দের {{ $sPackSize }}টি কালার সিলেক্ট করুন (<span class="cod-combo-filled-count">0</span>/{{ $sPackSize }})
                                </span>
                                <button type="button"
                                    class="cod-open-combo-modal-btn text-[10px] font-bold px-2.5 py-1 rounded-full border bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 transition cursor-pointer"
                                    data-product-id="{{ $standaloneComboProd->id }}">
                                    কালার বাছাই করুন
                                </button>
                            </div>

                            <div class="cod-combo-slots-row flex flex-wrap items-center gap-2.5">
                                @for ($sIdx = 0; $sIdx < $sPackSize; $sIdx++)
                                    <div role="button" tabindex="0"
                                        class="cod-combo-slot-box relative w-16 h-18 rounded-xl border-2 border-dashed border-amber-400 bg-amber-100/60 hover:bg-amber-100 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden select-none"
                                        data-product-id="{{ $standaloneComboProd->id }}"
                                        data-slot-index="{{ $sIdx }}">
                                        <span class="absolute top-1 left-1 z-10 w-4 h-4 rounded-full bg-slate-900/75 text-white text-[9px] font-bold flex items-center justify-center">{{ $sIdx + 1 }}</span>
                                        <div class="slot-empty-ui flex flex-col items-center justify-center gap-0.5 text-amber-900">
                                            <span class="text-sm font-bold">+</span>
                                            <span class="text-[9px] font-bold">+ কালার</span>
                                        </div>
                                        <img class="slot-img-ui w-full h-12 object-cover hidden" src="" alt="" />
                                        <span class="slot-name-ui w-full px-1 py-0.5 text-[9px] font-bold text-slate-800 text-center truncate bg-white/95 border-t border-slate-100 hidden"></span>
                                        <button type="button" class="cod-combo-slot-clear hidden absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center hover:bg-rose-700"
                                            data-product-id="{{ $standaloneComboProd->id }}" data-slot-index="{{ $sIdx }}">×</button>
                                    </div>
                                @endfor
                            </div>

                            @if (count($sComboSizes) > 0)
                                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span class="text-xs font-bold text-slate-700 mr-1">কমন সাইজ (Size):</span>
                                    @foreach ($sComboSizes as $szIdx => $szVal)
                                        <button type="button"
                                            class="cod-combo-size-btn px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer {{ $szIdx === 0 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500' }}"
                                            data-product-id="{{ $standaloneComboProd->id }}"
                                            data-size="{{ e($szVal) }}">
                                            {{ $szVal }}
                                        </button>
                                    @endforeach
                                </div>
                            @endif
                        </div>
                    @endif
                @endif

                {{-- Hidden container for dynamic items inputs --}}
                <div id="cod-items-container">
                    @if ($hasMultiple)
                        @foreach ($products as $idx => $item)
                            @php
                                $firstVar = $item->variants->first();
                                $varId = $firstVar?->id ?? 0;
                                $effectivePrice =
                                    (float) ($firstVar?->sale_price ??
                                        ($firstVar?->regular_price ??
                                            ($item->sale_price ?? $item->regular_price)));
                                $itemImgUrl = $resolveProductImgUrl($item, $firstVar) ?? '';
                                if ($defaultSelection === 'all') {
                                    $isChecked = true;
                                } elseif ($defaultSelection === 'specific' && $defaultSelectedId > 0) {
                                    $isChecked = $item->id === $defaultSelectedId;
                                } else {
                                    $isChecked = $idx === 0;
                                }
                            @endphp
                            @if ($isChecked)
                                <input type="hidden" class="cod-item-input"
                                    name="items[{{ $idx }}][variant_id]" value="{{ $varId }}"
                                    data-product-id="{{ $item->id }}" data-price="{{ $effectivePrice }}"
                                    data-title="{{ e($item->title) }}" data-image="{{ e($itemImgUrl) }}" />
                                <input type="hidden" class="cod-item-qty" name="items[{{ $idx }}][quantity]"
                                    value="1" />
                            @endif
                        @endforeach
                    @elseif($firstVariantId)
                        @php
                            $firstProductImgUrl = $resolveProductImgUrl($firstProduct, $firstVariant) ?? '';
                        @endphp
                        <input type="hidden" class="cod-item-input" name="items[0][variant_id]"
                            value="{{ $firstVariantId }}"
                            data-product-id="{{ $firstProduct?->id ?? '' }}"
                            data-price="{{ (float) ($firstVariant?->sale_price ?? ($firstVariant?->regular_price ?? ($firstProduct?->sale_price ?? ($firstProduct?->regular_price ?? 0)))) }}"
                            data-title="{{ e($firstProduct?->title ?? '') }}"
                            data-image="{{ e($firstProductImgUrl) }}" />
                        <input type="hidden" class="cod-item-qty" name="items[0][quantity]" value="1" />
                    @endif
                </div>

                {{-- Alert Box for Errors --}}
                <div id="cod-error-box"
                    class="hidden rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                </div>

                {{-- Bottom 2-Column Layout on PC (Mobile remains single-column) --}}
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {{-- Left Column: Billing details & Shipping --}}
                    <div class="lg:col-span-6 space-y-4">
                        <h3 class="text-base font-bold text-slate-900">
                            Billing details
                        </h3>

                        <div>
                            <label {!! $labelStyle !!} data-lc-el="label">
                                {{ $nameLabel }}
                                @if ($showRequiredMark)
                                    <span style="color: {{ e($requiredMarkColor) }};">*</span>
                                @endif
                            </label>
                            <input type="text" name="customer_name" required data-lc-el="input"
                                placeholder="{{ $namePlaceholder }}" {!! $inputStyle !!} />
                        </div>

                        <div>
                            <label {!! $labelStyle !!} data-lc-el="label">
                                {{ $addressLabel }}
                                @if ($showRequiredMark)
                                    <span style="color: {{ e($requiredMarkColor) }};">*</span>
                                @endif
                            </label>
                            <textarea name="delivery_address" required rows="2" data-lc-el="input"
                                placeholder="{{ $addressPlaceholder }}" {!! $inputStyle !!}></textarea>
                        </div>

                        <div>
                            <label {!! $labelStyle !!} data-lc-el="label">
                                {{ $phoneLabel }}
                                @if ($showRequiredMark)
                                    <span style="color: {{ e($requiredMarkColor) }};">*</span>
                                @endif
                            </label>
                            <input type="tel" name="customer_phone" required placeholder="{{ $phonePlaceholder }}"
                                pattern="01[3-9][0-9]{8}" data-lc-el="input" {!! $inputStyle !!} />
                        </div>

                        {{-- Shipping Method Radio Cards --}}
                        <div class="pt-2">
                            <h3 class="text-base font-bold text-slate-900 mb-2.5">
                                {{ $shippingLabel }}
                                @if ($showRequiredMark)
                                    <span style="color: {{ e($requiredMarkColor) }};">*</span>
                                @endif
                            </h3>
                            <div class="space-y-2">
                                @foreach ($activeMethods as $sMethod)
                                    @php
                                        $sRate = (float) ($sMethod->rate ?? 70.0);
                                        $sTime = $sMethod->delivery_time ? "({$sMethod->delivery_time})" : '';
                                        $zCode = $sMethod->zone_code ?? ($sMethod->zone?->code ?? '');
                                        if ($zCode === 'inside_dhaka' || str_contains(strtolower($sMethod->name), 'inside')) {
                                            $zoneDistrict = 'Dhaka';
                                        } elseif ($zCode === 'sub_dhaka' || str_contains(strtolower($sMethod->name), 'sub')) {
                                            $zoneDistrict = 'Gazipur';
                                        } else {
                                            $zoneDistrict = 'Chattogram';
                                        }
                                    @endphp
                                    <label class="cod-shipping-option flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-emerald-500">
                                        <span class="flex items-center gap-2.5">
                                            <input type="radio" name="shipping_method_id"
                                                class="cod-shipping-radio h-4 w-4"
                                                style="accent-color: {{ e($accentColor) }};"
                                                value="{{ $sMethod->id }}"
                                                data-rate="{{ $sRate }}"
                                                data-zone="{{ $zoneDistrict }}"
                                                {{ $loop->first ? 'checked' : '' }} />
                                            <span>
                                                {{ $sMethod->name }}
                                                @if ($sTime)
                                                    <span class="text-xs font-normal text-slate-500">{{ $sTime }}</span>
                                                @endif
                                            </span>
                                        </span>
                                        <span class="font-bold">৳{{ number_format($sRate, 0) }}</span>
                                    </label>
                                @endforeach
                            </div>
                        </div>
                    </div>

                    {{-- Right Column: Your order, Payment Method & Submit --}}
                    <div class="lg:col-span-6 space-y-4">
                        <h3 class="text-base font-bold text-slate-900">
                            Your order
                        </h3>

                        {{-- Live Summary Breakdown --}}
                        @if ($showSummary)
                            <div {!! $summaryStyle !!} data-lc-el="summary">
                                <div class="flex justify-between pb-2 border-b border-slate-200 font-bold text-slate-700">
                                    <span>Product</span>
                                    <span>Subtotal</span>
                                </div>
                                <div id="cod-order-items-list" class="space-y-2 py-1 border-b border-slate-200 empty:hidden"></div>
                                <div class="flex justify-between">
                                    <span>Subtotal</span>
                                    <span id="cod-summary-subtotal" class="font-bold"
                                        {!! $summaryValueStyle !!}>৳0</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Shipment</span>
                                    <span id="cod-summary-shipping" class="font-bold"
                                        style="color: {{ e($accentColor) }};">৳{{ number_format($defaultShippingFee, 0) }}</span>
                                </div>
                                <div class="flex justify-between border-t pt-2 font-extrabold"
                                    style="border-color: {{ e($summaryBorderColor) }};">
                                    <span>Total</span>
                                    <span id="cod-summary-total" class="font-black" {!! $summaryTotalStyle !!}>৳0</span>
                                </div>
                            </div>
                        @endif

                        {{-- Payment Method Info Box --}}
                        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                            <div class="text-sm font-bold text-slate-800">
                                Cash on delivery
                            </div>
                            <div class="rounded-lg bg-slate-200/70 px-3.5 py-2.5 text-xs text-slate-600">
                                Pay with cash upon delivery.
                            </div>
                        </div>

                        <p class="text-[11px] leading-relaxed text-slate-500">
                            Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
                        </p>

                        <div id="cod-submit-btn-wrap" class="relative">
                            <button type="submit" id="cod-submit-btn"
                                data-default-text="{{ e($buttonText) }}" data-lc-el="button" {!! $buttonStyle !!}
                                class="cod-submit-btn flex w-full cursor-pointer items-center justify-center space-x-2 text-white transition disabled:cursor-not-allowed disabled:opacity-60 {{ $buttonPulse ? 'animate-pulse' : '' }}">
                                <span id="cod-btn-spinner" class="hidden">
                                    <svg class="-ml-1 mr-2 h-5 w-5 animate-spin text-white" fill="none"
                                        viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10"
                                            stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                </span>
                                <span id="cod-btn-text">{{ $buttonText }}</span>
                            </button>
                            <div id="cod-combo-incomplete-notice" class="hidden mt-2 text-center text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-2 px-3"></div>
                        </div>

                        @if ($showTrustBadges)
                            <div class="flex flex-wrap items-center justify-center text-center" data-lc-el="trust" {!! $trustRowStyle !!}>
                                <span class="inline-flex items-center">
                                    <svg class="mr-1" style="width: {{ e($trustIconSize) }}; height: {{ e($trustIconSize) }}; color: {{ e($trustIconColor) }};"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    {{ $trustText1 }}
                                </span>
                                <span class="inline-flex items-center">
                                    <svg class="mr-1" style="width: {{ e($trustIconSize) }}; height: {{ e($trustIconSize) }}; color: {{ e($trustIconColor) }};"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    {{ $trustText2 }}
                                </span>
                            </div>
                        @endif
                    </div>
                </div>
            </form>
        </div>
    </div>

    {{-- Checkout Combo Color Selection Modal --}}
    <div id="cod-combo-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-100" onclick="event.stopPropagation()">
            <div class="relative z-30 flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                <div>
                    <span id="cod-combo-modal-eyebrow" class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Combo Pack Selection</span>
                    <h3 id="cod-combo-modal-title" class="text-sm sm:text-base font-bold text-slate-900">বক্স #1-এর জন্য কালার সিলেক্ট করুন</h3>
                </div>
                <button type="button" id="cod-combo-modal-close" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="relative z-10 p-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
                <div id="cod-combo-modal-slots" class="flex flex-wrap items-center gap-2"></div>
                <div id="cod-combo-modal-colors" class="grid grid-cols-2 sm:grid-cols-3 gap-3"></div>
                <div id="cod-combo-modal-sizes-wrap" class="hidden pt-3 border-t border-slate-100">
                    <div class="text-xs font-bold text-slate-700 mb-2">
                        কমন সাইজ সিলেক্ট করুন (Size): <span id="cod-combo-modal-size-val" class="text-emerald-700"></span>
                    </div>
                    <div id="cod-combo-modal-sizes" class="flex flex-wrap gap-1.5"></div>
                </div>
            </div>
        </div>
    </div>
</section>

<script>
    (function() {
        function initCodCheckout() {
            var form = document.getElementById('landing-cod-form');
            if (!form) return;

            var itemsContainer = document.getElementById('cod-items-container');
            var orderItemsList = document.getElementById('cod-order-items-list');
            var subtotalEl = document.getElementById('cod-summary-subtotal');
            var shippingEl = document.getElementById('cod-summary-shipping');
            var totalEl = document.getElementById('cod-summary-total');
            var errorBox = document.getElementById('cod-error-box');
            var submitBtn = document.getElementById('cod-submit-btn');
            var btnSpinner = document.getElementById('cod-btn-spinner');
            var btnText = document.getElementById('cod-btn-text');
            var toggles = form.querySelectorAll('.cod-product-toggle');
            var shippingRadios = form.querySelectorAll('.cod-shipping-radio');
            var districtInput = document.getElementById('cod_district');
            var variantBtns = form.querySelectorAll('.cod-variant-btn');
            var defaultButtonText = submitBtn ? (submitBtn.getAttribute('data-default-text') || 'Confirm Order - Cash on Delivery') : 'Confirm Order - Cash on Delivery';
            var submitWrap = document.getElementById('cod-submit-btn-wrap');
            var comboIncompleteNotice = document.getElementById('cod-combo-incomplete-notice');

            // Combo modal elements & state
            var comboModal = document.getElementById('cod-combo-modal');
            var comboModalEyebrow = document.getElementById('cod-combo-modal-eyebrow');
            var comboModalTitle = document.getElementById('cod-combo-modal-title');
            var comboModalClose = document.getElementById('cod-combo-modal-close');
            var comboModalSlots = document.getElementById('cod-combo-modal-slots');
            var comboModalColors = document.getElementById('cod-combo-modal-colors');
            var comboModalSizesWrap = document.getElementById('cod-combo-modal-sizes-wrap');
            var comboModalSizeVal = document.getElementById('cod-combo-modal-size-val');
            var comboModalSizes = document.getElementById('cod-combo-modal-sizes');

            var comboMetaMap = {};
            var metaScript = document.getElementById('cod-products-combo-meta');
            if (metaScript) {
                try {
                    comboMetaMap = JSON.parse(metaScript.textContent) || {};
                } catch (err) {
                    comboMetaMap = {};
                }
            }

            var comboState = {};
            Object.keys(comboMetaMap).forEach(function(pidKey) {
                var meta = comboMetaMap[pidKey];
                var pid = parseInt(pidKey, 10);
                var packSize = Math.max(1, parseInt(meta.pack_size || '1', 10));
                var slots = [];
                for (var i = 0; i < packSize; i++) slots.push(null);
                comboState[pid] = {
                    isCombo: Boolean(meta.is_combo),
                    packSize: packSize,
                    colors: Array.isArray(meta.colors) ? meta.colors : [],
                    sizes: Array.isArray(meta.sizes) ? meta.sizes : [],
                    mainImage: meta.main_image || '',
                    slots: slots,
                    selectedSize: (Array.isArray(meta.sizes) && meta.sizes[0]) ? meta.sizes[0] : ''
                };
            });

            var activeModalPid = null;
            var activeModalSlotIdx = 0;

            function buildComboSummary(pid) {
                var st = comboState[pid];
                if (!st || !st.isCombo) return '';
                var parts = [];
                st.slots.forEach(function(slot, idx) {
                    if (slot && slot.name) {
                        parts.push('[' + (idx + 1) + '] ' + slot.name);
                    }
                });
                if (parts.length === 0) return '';
                var sizePart = st.selectedSize ? ' | Size: ' + st.selectedSize : '';
                return st.packSize + ' Pcs Combo — Colors: ' + parts.join(', ') + sizePart;
            }

            function renderComboContainerUI(pid) {
                var st = comboState[pid];
                if (!st || !st.isCombo) return;
                var containers = form.querySelectorAll('.cod-combo-container[data-product-id="' + pid + '"]');
                var filledCount = st.slots.filter(Boolean).length;

                containers.forEach(function(container) {
                    var countEl = container.querySelector('.cod-combo-filled-count');
                    if (countEl) countEl.textContent = String(filledCount);

                    var openBtn = container.querySelector('.cod-open-combo-modal-btn');
                    if (openBtn) {
                        var isAllFilled = filledCount === st.packSize && (st.sizes.length === 0 || Boolean(st.selectedSize));
                        openBtn.textContent = isAllFilled ? '✓ কালার কমপ্লিট (পরিবর্তন করুন)' : 'কালার বাছাই করুন';
                        if (isAllFilled) {
                            openBtn.classList.remove('bg-amber-100', 'border-amber-300', 'text-amber-900');
                            openBtn.classList.add('bg-emerald-50', 'border-emerald-200', 'text-emerald-700');
                        } else {
                            openBtn.classList.add('bg-amber-100', 'border-amber-300', 'text-amber-900');
                            openBtn.classList.remove('bg-emerald-50', 'border-emerald-200', 'text-emerald-700');
                        }
                    }

                    container.querySelectorAll('.cod-combo-slot-box').forEach(function(box) {
                        var sIdx = parseInt(box.getAttribute('data-slot-index') || '0', 10);
                        var slot = st.slots[sIdx];
                        var emptyUi = box.querySelector('.slot-empty-ui');
                        var imgUi = box.querySelector('.slot-img-ui');
                        var nameUi = box.querySelector('.slot-name-ui');
                        var clearBtn = box.querySelector('.cod-combo-slot-clear');

                        if (slot) {
                            box.classList.remove('border-dashed', 'border-amber-400', 'bg-amber-100/60', 'hover:bg-amber-100');
                            box.classList.add('border-emerald-500', 'bg-white');
                            if (emptyUi) emptyUi.classList.add('hidden');
                            if (imgUi) {
                                imgUi.src = slot.image_url || slot.imageUrl || st.mainImage || '';
                                imgUi.alt = slot.name || '';
                                imgUi.classList.remove('hidden');
                            }
                            if (nameUi) {
                                nameUi.textContent = slot.name || '';
                                nameUi.classList.remove('hidden');
                            }
                            if (clearBtn) clearBtn.classList.remove('hidden');
                        } else {
                            box.classList.add('border-dashed', 'border-amber-400', 'bg-amber-100/60', 'hover:bg-amber-100');
                            box.classList.remove('border-emerald-500', 'bg-white');
                            if (emptyUi) emptyUi.classList.remove('hidden');
                            if (imgUi) {
                                imgUi.src = '';
                                imgUi.classList.add('hidden');
                            }
                            if (nameUi) {
                                nameUi.textContent = '';
                                nameUi.classList.add('hidden');
                            }
                            if (clearBtn) clearBtn.classList.add('hidden');
                        }
                    });

                    container.querySelectorAll('.cod-combo-size-btn').forEach(function(szBtn) {
                        var szVal = szBtn.getAttribute('data-size') || '';
                        if (st.selectedSize === szVal) {
                            szBtn.classList.add('bg-emerald-600', 'border-emerald-600', 'text-white');
                            szBtn.classList.remove('bg-white', 'border-slate-200', 'text-slate-700');
                        } else {
                            szBtn.classList.remove('bg-emerald-600', 'border-emerald-600', 'text-white');
                            szBtn.classList.add('bg-white', 'border-slate-200', 'text-slate-700');
                        }
                    });
                });
            }

            function renderComboModalBody() {
                if (!activeModalPid || !comboState[activeModalPid] || !comboModal) return;
                var st = comboState[activeModalPid];
                var filledCount = st.slots.filter(Boolean).length;

                if (comboModalEyebrow) {
                    comboModalEyebrow.textContent = st.packSize + ' Pcs Combo (' + filledCount + '/' + st.packSize + ' সিলেক্টেড)';
                }
                if (comboModalTitle) {
                    comboModalTitle.textContent = 'বক্স #' + (activeModalSlotIdx + 1) + '-এর জন্য কালার সিলেক্ট করুন';
                }

                if (comboModalSlots) {
                    comboModalSlots.innerHTML = '';
                    st.slots.forEach(function(slot, sIdx) {
                        var isActive = activeModalSlotIdx === sIdx;
                        var box = document.createElement('div');
                        box.setAttribute('role', 'button');
                        box.setAttribute('tabindex', '0');
                        box.className = 'relative w-14 h-16 rounded-xl border-2 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden select-none ' +
                            (isActive
                                ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/40'
                                : (slot ? 'border-slate-300 bg-white' : 'border-dashed border-amber-400 bg-amber-100/60'));

                        var badgeNum = document.createElement('span');
                        badgeNum.className = 'absolute top-0.5 left-0.5 z-[2] w-3.5 h-3.5 rounded-full bg-slate-900/75 text-white text-[8px] font-bold flex items-center justify-center';
                        badgeNum.textContent = String(sIdx + 1);
                        box.appendChild(badgeNum);

                        if (slot) {
                            var img = document.createElement('img');
                            img.src = slot.image_url || slot.imageUrl || st.mainImage || '';
                            img.alt = slot.name || '';
                            img.className = 'w-full h-10 object-cover';
                            var lbl = document.createElement('span');
                            lbl.className = 'w-full px-0.5 py-0.5 text-[8px] font-bold text-slate-800 text-center truncate bg-white/95 border-t border-slate-100';
                            lbl.textContent = slot.name || '';
                            box.appendChild(img);
                            box.appendChild(lbl);
                        } else {
                            var empty = document.createElement('div');
                            empty.className = 'flex flex-col items-center justify-center gap-0.5 text-amber-900';
                            empty.innerHTML = '<span class="text-xs font-bold">+</span><span class="text-[8px] font-bold">বক্স #' + (sIdx + 1) + '</span>';
                            box.appendChild(empty);
                        }

                        box.addEventListener('click', function() {
                            activeModalSlotIdx = sIdx;
                            renderComboModalBody();
                        });
                        comboModalSlots.appendChild(box);
                    });
                }

                if (comboModalColors) {
                    comboModalColors.innerHTML = '';
                    if (st.colors.length === 0) {
                        comboModalColors.innerHTML = '<div class="col-span-3 text-center py-6 text-xs text-slate-500">কোনো কালার অপশন পাওয়া যায়নি।</div>';
                    } else {
                        st.colors.forEach(function(c) {
                            var isPicked = st.slots[activeModalSlotIdx] && st.slots[activeModalSlotIdx].name === c.name;
                            var btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = 'group flex flex-col items-center rounded-xl border-2 p-2 transition text-left cursor-pointer ' +
                                (isPicked ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-amber-400 hover:shadow-sm');

                            var imgWrap = document.createElement('div');
                            imgWrap.className = 'w-full aspect-square rounded-lg overflow-hidden bg-slate-50 mb-1.5 border border-slate-100';
                            var img = document.createElement('img');
                            img.src = c.image_url || st.mainImage || '';
                            img.alt = c.name || '';
                            img.className = 'w-full h-full object-cover group-hover:scale-105 transition duration-300';
                            imgWrap.appendChild(img);

                            var nameSpan = document.createElement('span');
                            nameSpan.className = 'text-xs font-bold text-slate-900 truncate w-full text-center';
                            nameSpan.textContent = c.name || '';

                            var pickLabel = document.createElement('span');
                            pickLabel.className = 'mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700';
                            pickLabel.textContent = '+ সিলেক্ট করুন';

                            btn.appendChild(imgWrap);
                            btn.appendChild(nameSpan);
                            btn.appendChild(pickLabel);

                            btn.addEventListener('click', function() {
                                st.slots[activeModalSlotIdx] = {
                                    name: c.name,
                                    image_url: c.image_url || st.mainImage || ''
                                };
                                renderComboContainerUI(activeModalPid);
                                syncActiveSelectionAfterComboChange();

                                var nextEmpty = -1;
                                for (var i = activeModalSlotIdx + 1; i < st.packSize; i++) {
                                    if (!st.slots[i]) { nextEmpty = i; break; }
                                }
                                if (nextEmpty === -1) {
                                    for (var j = 0; j < st.packSize; j++) {
                                        if (!st.slots[j]) { nextEmpty = j; break; }
                                    }
                                }

                                if (nextEmpty !== -1) {
                                    activeModalSlotIdx = nextEmpty;
                                    renderComboModalBody();
                                } else {
                                    closeComboModal();
                                }
                            });

                            comboModalColors.appendChild(btn);
                        });
                    }
                }

                if (comboModalSizesWrap && comboModalSizes) {
                    if (st.sizes.length > 0) {
                        comboModalSizesWrap.classList.remove('hidden');
                        if (comboModalSizeVal) comboModalSizeVal.textContent = st.selectedSize || '';
                        comboModalSizes.innerHTML = '';
                        st.sizes.forEach(function(sz) {
                            var isSel = st.selectedSize === sz;
                            var sBtn = document.createElement('button');
                            sBtn.type = 'button';
                            sBtn.className = 'min-w-[40px] px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ' +
                                (isSel ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500');
                            sBtn.textContent = sz;
                            sBtn.addEventListener('click', function() {
                                st.selectedSize = sz;
                                renderComboContainerUI(activeModalPid);
                                renderComboModalBody();
                                syncActiveSelectionAfterComboChange();
                            });
                            comboModalSizes.appendChild(sBtn);
                        });
                    } else {
                        comboModalSizesWrap.classList.add('hidden');
                    }
                }
            }

            function openComboModal(pid, slotIndex) {
                var st = comboState[pid];
                if (!st || !st.isCombo || !comboModal) return;
                activeModalPid = pid;
                if (typeof slotIndex === 'number' && slotIndex >= 0 && slotIndex < st.packSize) {
                    activeModalSlotIdx = slotIndex;
                } else {
                    var firstEmpty = st.slots.indexOf(null);
                    activeModalSlotIdx = firstEmpty !== -1 ? firstEmpty : 0;
                }
                renderComboModalBody();
                comboModal.classList.remove('hidden');
                comboModal.classList.add('flex');
            }

            function closeComboModal() {
                if (!comboModal) return;
                comboModal.classList.add('hidden');
                comboModal.classList.remove('flex');
            }

            if (comboModal) {
                comboModal.addEventListener('click', function(e) {
                    if (e.target === comboModal) closeComboModal();
                });
            }
            if (comboModalClose) {
                comboModalClose.addEventListener('click', closeComboModal);
            }

            // Wire up click handlers for inline `[ + ]` slot boxes, clear buttons, size buttons, and "কালার বাছাই করুন" button
            form.querySelectorAll('.cod-combo-slot-box').forEach(function(box) {
                box.addEventListener('click', function(e) {
                    if (e.target && e.target.closest('.cod-combo-slot-clear')) return;
                    e.stopPropagation();
                    var pid = parseInt(box.getAttribute('data-product-id') || '0', 10);
                    var sIdx = parseInt(box.getAttribute('data-slot-index') || '0', 10);
                    openComboModal(pid, sIdx);
                });
            });

            form.querySelectorAll('.cod-combo-slot-clear').forEach(function(cBtn) {
                cBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var pid = parseInt(cBtn.getAttribute('data-product-id') || '0', 10);
                    var sIdx = parseInt(cBtn.getAttribute('data-slot-index') || '0', 10);
                    if (comboState[pid]) {
                        comboState[pid].slots[sIdx] = null;
                        renderComboContainerUI(pid);
                        syncActiveSelectionAfterComboChange();
                    }
                });
            });

            form.querySelectorAll('.cod-open-combo-modal-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var pid = parseInt(btn.getAttribute('data-product-id') || '0', 10);
                    openComboModal(pid);
                });
            });

            form.querySelectorAll('.cod-combo-size-btn').forEach(function(szBtn) {
                szBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var pid = parseInt(szBtn.getAttribute('data-product-id') || '0', 10);
                    var szVal = szBtn.getAttribute('data-size') || '';
                    if (comboState[pid]) {
                        comboState[pid].selectedSize = szVal;
                        renderComboContainerUI(pid);
                        syncActiveSelectionAfterComboChange();
                    }
                });
            });

            // Quantity stepper click handlers
            form.querySelectorAll('.cod-product-card').forEach(function(card) {
                var minusBtn = card.querySelector('.cod-qty-minus');
                var plusBtn = card.querySelector('.cod-qty-plus');
                var qtyEl = card.querySelector('.cod-qty-val');
                var priceEl = card.querySelector('.cod-card-price');
                var toggle = card.querySelector('.cod-product-toggle');

                function setQty(nextQty) {
                    if (nextQty < 1) nextQty = 1;
                    if (qtyEl) {
                        qtyEl.setAttribute('data-qty', String(nextQty));
                        qtyEl.innerText = String(nextQty);
                    }
                    if (priceEl && toggle) {
                        var unit = parseFloat(toggle.getAttribute('data-price') || '0');
                        priceEl.innerText = '৳' + Math.round(unit * nextQty).toLocaleString();
                    }
                    calculateFromToggles();
                }

                if (minusBtn) {
                    minusBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var cur = parseInt((qtyEl && qtyEl.getAttribute('data-qty')) || '1', 10);
                        setQty(cur - 1);
                    });
                }
                if (plusBtn) {
                    plusBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var cur = parseInt((qtyEl && qtyEl.getAttribute('data-qty')) || '1', 10);
                        setQty(cur + 1);
                    });
                }
            });

            // Variant button click handler
            variantBtns.forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    var vid = btn.getAttribute('data-variant-id');
                    var vPrice = parseFloat(btn.getAttribute('data-price') || '0');
                    var vImg = btn.getAttribute('data-image');
                    var card = btn.closest('.cod-product-card');
                    if (!card) return;

                    var toggle = card.querySelector('.cod-product-toggle');
                    if (toggle) {
                        toggle.setAttribute('data-variant-id', vid);
                        toggle.setAttribute('data-price', vPrice);
                        if (vImg) {
                            toggle.setAttribute('data-image', vImg);
                        }
                        if (!toggle.checked) {
                            toggle.checked = true;
                        }
                    }

                    var container = card.querySelector('.cod-variant-container');
                    if (container) {
                        container.querySelectorAll('.cod-variant-btn').forEach(function(b) {
                            b.classList.remove('cod-variant-active');
                        });
                        btn.classList.add('cod-variant-active');
                    }

                    var priceEl = card.querySelector('.cod-card-price');
                    if (priceEl) {
                        priceEl.innerText = '৳' + Math.round(vPrice).toLocaleString();
                    }

                    if (vImg) {
                        var imgEl = card.querySelector('.cod-card-img');
                        if (imgEl) {
                            imgEl.src = vImg;
                        }
                    }

                    calculateFromToggles();
                });
            });

            var currentSubtotal = 0;

            function getSelectedShippingRadio() {
                for (var i = 0; i < shippingRadios.length; i++) {
                    if (shippingRadios[i].checked) return shippingRadios[i];
                }
                return shippingRadios[0] || null;
            }

            function getShippingRate() {
                var radio = getSelectedShippingRadio();
                return radio ? parseFloat(radio.getAttribute('data-rate') || '70') : 70;
            }

            function checkComboIncompleteness() {
                var itemInputs = itemsContainer ? itemsContainer.querySelectorAll('.cod-item-input') : [];
                if (itemInputs.length === 0) {
                    return { isIncomplete: false, reason: null };
                }
                for (var idx = 0; idx < itemInputs.length; idx++) {
                    var pidAttr = parseInt(itemInputs[idx].getAttribute('data-product-id') || '0', 10);
                    var st = pidAttr ? comboState[pidAttr] : null;
                    if (st && st.isCombo) {
                        var emptySlotIdx = st.slots.indexOf(null);
                        if (emptySlotIdx !== -1) {
                            return {
                                isIncomplete: true,
                                pid: pidAttr,
                                emptySlotIndex: emptySlotIdx,
                                packSize: st.packSize,
                                reason: 'অনুগ্রহ করে কম্বো প্যাকের সবগুলো (' + st.packSize + 'টি) বক্সে পছন্দের কালার সিলেক্ট করুন। (বক্স #' + (emptySlotIdx + 1) + ' খালি আছে)'
                            };
                        }
                        if (st.sizes.length > 0 && !st.selectedSize) {
                            return {
                                isIncomplete: true,
                                pid: pidAttr,
                                emptySlotIndex: -1,
                                packSize: st.packSize,
                                reason: 'অনুগ্রহ করে কম্বো প্যাকের সাইজ (Size) সিলেক্ট করুন।'
                            };
                        }
                    }
                }
                return { isIncomplete: false, reason: null };
            }

            function updateSubmitButtonState() {
                if (!submitBtn) return;
                var check = checkComboIncompleteness();
                var shipFee = getShippingRate();
                var grandTotal = Math.round(currentSubtotal + shipFee);

                if (check.isIncomplete) {
                    submitBtn.disabled = true;
                    submitBtn.classList.add('cursor-not-allowed', 'opacity-50');
                    submitBtn.classList.remove('cursor-pointer');
                    if (btnText) {
                        if (check.emptySlotIndex !== -1) {
                            btnText.innerText = 'কালার সিলেক্ট করুন (বক্স #' + (check.emptySlotIndex + 1) + ' খালি)';
                        } else {
                            btnText.innerText = 'কম্বো সাইজ সিলেক্ট করুন';
                        }
                    }
                    if (comboIncompleteNotice) {
                        comboIncompleteNotice.textContent = '⚠️ ' + check.reason;
                        comboIncompleteNotice.classList.remove('hidden');
                    }
                } else {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('cursor-not-allowed', 'opacity-50');
                    submitBtn.classList.add('cursor-pointer');
                    if (btnText) {
                        btnText.innerText = defaultButtonText + ' ৳' + grandTotal.toLocaleString();
                    }
                    if (comboIncompleteNotice) {
                        comboIncompleteNotice.textContent = '';
                        comboIncompleteNotice.classList.add('hidden');
                    }
                }
            }

            function updateTotals() {
                var shipFee = getShippingRate();
                var grandTotal = Math.round(currentSubtotal + shipFee);
                if (shippingEl) shippingEl.innerText = '৳' + Math.round(shipFee).toLocaleString();
                if (subtotalEl) subtotalEl.innerText = '৳' + Math.round(currentSubtotal).toLocaleString();
                if (totalEl) totalEl.innerText = '৳' + grandTotal.toLocaleString();

                var radio = getSelectedShippingRadio();
                if (radio && districtInput) {
                    districtInput.value = radio.getAttribute('data-zone') || 'Dhaka';
                }

                updateSubmitButtonState();
            }

            function rebuildFromItems(items) {
                if (!itemsContainer) return;
                itemsContainer.innerHTML = '';
                if (orderItemsList) orderItemsList.innerHTML = '';
                var subtotal = 0;

                items.forEach(function(item, idx) {
                    var qty = item.quantity || 1;
                    var lineTotal = (item.price || 0) * qty;
                    var pid = parseInt(item.productId || '0', 10);
                    var resolvedSummary = item.comboSummary || (pid ? buildComboSummary(pid) : '');

                    var inputVar = document.createElement('input');
                    inputVar.type = 'hidden';
                    inputVar.className = 'cod-item-input';
                    inputVar.name = 'items[' + idx + '][variant_id]';
                    inputVar.value = item.variantId;
                    if (pid) inputVar.setAttribute('data-product-id', String(pid));
                    inputVar.setAttribute('data-price', String(item.price || 0));
                    inputVar.setAttribute('data-title', item.title || '');
                    inputVar.setAttribute('data-image', item.image || '');
                    itemsContainer.appendChild(inputVar);

                    var inputQty = document.createElement('input');
                    inputQty.type = 'hidden';
                    inputQty.className = 'cod-item-qty';
                    inputQty.name = 'items[' + idx + '][quantity]';
                    inputQty.value = qty;
                    itemsContainer.appendChild(inputQty);

                    if (resolvedSummary) {
                        var inputSummary = document.createElement('input');
                        inputSummary.type = 'hidden';
                        inputSummary.className = 'cod-item-combo-summary';
                        inputSummary.name = 'items[' + idx + '][combo_summary]';
                        inputSummary.value = resolvedSummary;
                        itemsContainer.appendChild(inputSummary);
                    }

                    if (orderItemsList) {
                        var row = document.createElement('div');
                        row.className = 'flex items-center justify-between gap-2 text-xs';

                        var left = document.createElement('div');
                        left.className = 'flex items-center gap-2 min-w-0';

                        var thumbWrap = document.createElement('div');
                        thumbWrap.className = 'h-8 w-8 rounded border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center';
                        var fallbackSvg = '<svg class="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>';

                        if (item.image) {
                            var img = document.createElement('img');
                            img.src = item.image;
                            img.alt = item.title || '';
                            img.className = 'h-full w-full object-cover';
                            img.onerror = function() {
                                thumbWrap.innerHTML = fallbackSvg;
                            };
                            thumbWrap.appendChild(img);
                        } else {
                            thumbWrap.innerHTML = fallbackSvg;
                        }
                        left.appendChild(thumbWrap);

                        var textWrap = document.createElement('div');
                        textWrap.className = 'min-w-0';
                        var titleSpan = document.createElement('span');
                        titleSpan.className = 'truncate block font-medium text-slate-700';
                        titleSpan.textContent = item.title || '';
                        textWrap.appendChild(titleSpan);

                        if (resolvedSummary) {
                            var summarySub = document.createElement('span');
                            summarySub.className = 'block text-[10px] font-semibold text-emerald-700 truncate';
                            summarySub.textContent = resolvedSummary;
                            textWrap.appendChild(summarySub);
                        }

                        left.appendChild(textWrap);

                        var right = document.createElement('div');
                        right.className = 'shrink-0 flex items-center gap-3';
                        var qtySpan = document.createElement('span');
                        qtySpan.className = 'text-slate-500';
                        qtySpan.textContent = '× ' + qty;
                        var priceSpan = document.createElement('span');
                        priceSpan.className = 'font-bold text-slate-800';
                        priceSpan.textContent = '৳' + Math.round(lineTotal).toLocaleString();
                        right.appendChild(qtySpan);
                        right.appendChild(priceSpan);

                        row.appendChild(left);
                        row.appendChild(right);
                        orderItemsList.appendChild(row);
                    }

                    subtotal += lineTotal;
                });

                currentSubtotal = subtotal;
                updateTotals();
            }

            function readSingleItemsFromDom() {
                var existingInputs = itemsContainer.querySelectorAll('.cod-item-input');
                var initialItems = [];
                existingInputs.forEach(function(inp) {
                    var pid = parseInt(inp.getAttribute('data-product-id') || '0', 10);
                    initialItems.push({
                        productId: pid,
                        variantId: inp.value,
                        price: parseFloat(inp.getAttribute('data-price') || '0'),
                        title: inp.getAttribute('data-title') || 'Product',
                        image: inp.getAttribute('data-image') || '',
                        quantity: 1,
                        comboSummary: pid ? buildComboSummary(pid) : ''
                    });
                });
                return initialItems;
            }

            function syncActiveSelectionAfterComboChange() {
                if (toggles.length > 0) {
                    calculateFromToggles();
                } else {
                    rebuildFromItems(readSingleItemsFromDom());
                }
            }

            function calculateFromToggles() {
                var selected = [];
                toggles.forEach(function(t) {
                    var pid = parseInt(t.getAttribute('data-product-id'), 10);
                    var card = t.closest('.cod-product-card');
                    var variantContainer = card ? card.querySelector('.cod-variant-container') : null;
                    var comboContainer = card ? card.querySelector('.cod-combo-container') : null;
                    var qtyEl = card ? card.querySelector('.cod-qty-val') : null;
                    var qty = parseInt((qtyEl && qtyEl.getAttribute('data-qty')) || '1', 10) || 1;
                    if (t.checked) {
                        if (card) card.classList.add('cod-card-selected');
                        if (variantContainer) variantContainer.classList.remove('hidden');
                        if (comboContainer) comboContainer.classList.remove('hidden');
                        selected.push({
                            productId: pid,
                            variantId: parseInt(t.getAttribute('data-variant-id'), 10),
                            price: parseFloat(t.getAttribute('data-price') || '0'),
                            title: t.getAttribute('data-title'),
                            image: t.getAttribute('data-image') || '',
                            quantity: qty,
                            comboSummary: buildComboSummary(pid)
                        });
                    } else {
                        if (card) card.classList.remove('cod-card-selected');
                        if (variantContainer) variantContainer.classList.add('hidden');
                        if (comboContainer) comboContainer.classList.add('hidden');
                    }
                });

                rebuildFromItems(selected);
            }

            shippingRadios.forEach(function(radio) {
                radio.addEventListener('change', updateTotals);
            });

            if (toggles.length > 0) {
                toggles.forEach(function(t) {
                    var wasCheckedBeforeClick = t.checked;
                    var card = t.closest('.cod-product-card');
                    var labelEl = card ? card.querySelector('label') : null;
                    if (labelEl) {
                        labelEl.addEventListener('pointerdown', function() {
                            wasCheckedBeforeClick = t.checked;
                        });
                        labelEl.addEventListener('click', function() {
                            if (t.type === 'radio' && wasCheckedBeforeClick && t.checked) {
                                var pid = parseInt(t.getAttribute('data-product-id') || '0', 10);
                                if (comboState[pid] && comboState[pid].isCombo) {
                                    var firstEmpty = comboState[pid].slots.indexOf(null);
                                    if (firstEmpty !== -1) {
                                        openComboModal(pid, firstEmpty);
                                    }
                                }
                            }
                        });
                    }
                    t.addEventListener('change', function() {
                        wasCheckedBeforeClick = t.checked;
                        calculateFromToggles();
                        var pid = parseInt(t.getAttribute('data-product-id') || '0', 10);
                        if (t.checked && comboState[pid] && comboState[pid].isCombo) {
                            var firstEmpty = comboState[pid].slots.indexOf(null);
                            if (firstEmpty !== -1) {
                                openComboModal(pid, firstEmpty);
                            }
                        }
                    });
                });
                calculateFromToggles();
            } else {
                rebuildFromItems(readSingleItemsFromDom());
            }

            // Listen to event from external product-selector block
            window.addEventListener('landing-selection-updated', function(e) {
                if (e.detail && Array.isArray(e.detail.selectedItems)) {
                    var selectedPids = e.detail.selectedItems.map(function(i) {
                        return i.productId;
                    });
                    var imageByPid = {};

                    // Sync incoming combo selections into checkout comboState
                    var firstIncompleteComboPid = null;
                    e.detail.selectedItems.forEach(function(incoming) {
                        var pid = parseInt(incoming.productId || '0', 10);
                        if (!pid) return;
                        if (comboState[pid] && comboState[pid].isCombo) {
                            if (Array.isArray(incoming.comboSlots)) {
                                for (var idx = 0; idx < comboState[pid].packSize; idx++) {
                                    var incomingSlot = incoming.comboSlots[idx];
                                    comboState[pid].slots[idx] = incomingSlot
                                        ? {
                                            name: incomingSlot.name,
                                            image_url: incomingSlot.image_url || incomingSlot.imageUrl || comboState[pid].mainImage || ''
                                        }
                                        : null;
                                }
                            }
                            if (typeof incoming.comboSize === 'string' && incoming.comboSize) {
                                comboState[pid].selectedSize = incoming.comboSize;
                            }
                            renderComboContainerUI(pid);
                            if (comboState[pid].slots.indexOf(null) !== -1 && firstIncompleteComboPid === null) {
                                firstIncompleteComboPid = pid;
                            }
                        }
                    });

                    toggles.forEach(function(t) {
                        var pid = parseInt(t.getAttribute('data-product-id'), 10);
                        imageByPid[pid] = t.getAttribute('data-image') || '';
                        t.checked = selectedPids.indexOf(pid) !== -1;
                        var card = t.closest('.cod-product-card');
                        var variantContainer = card ? card.querySelector('.cod-variant-container') : null;
                        var comboContainer = card ? card.querySelector('.cod-combo-container') : null;
                        if (card) {
                            if (t.checked) {
                                card.classList.add('cod-card-selected');
                            } else {
                                card.classList.remove('cod-card-selected');
                            }
                        }
                        if (variantContainer) {
                            if (t.checked) {
                                variantContainer.classList.remove('hidden');
                            } else {
                                variantContainer.classList.add('hidden');
                            }
                        }
                        if (comboContainer) {
                            if (t.checked) {
                                comboContainer.classList.remove('hidden');
                            } else {
                                comboContainer.classList.add('hidden');
                            }
                        }
                    });

                    var enrichedItems = e.detail.selectedItems.map(function(item) {
                        var pid = parseInt(item.productId || '0', 10);
                        return Object.assign({}, item, {
                            image: item.image || imageByPid[pid] || '',
                            comboSummary: item.comboSummary || (pid ? buildComboSummary(pid) : '')
                        });
                    });

                    rebuildFromItems(enrichedItems);

                    if (firstIncompleteComboPid !== null) {
                        openComboModal(firstIncompleteComboPid);
                    }
                }
            });

            // Form submission via AJAX for seamless user experience
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                if (errorBox) {
                    errorBox.classList.add('hidden');
                    errorBox.innerText = '';
                }

                // Ensure at least one item is in the cart
                var itemInputs = itemsContainer.querySelectorAll('input[name$="[variant_id]"]');
                if (itemInputs.length === 0) {
                    if (errorBox) {
                        errorBox.innerText = 'Please select at least one product to place your order.';
                        errorBox.classList.remove('hidden');
                    }
                    return;
                }

                // Validate combo pack color slots & size before submit
                for (var idx = 0; idx < itemInputs.length; idx++) {
                    var pidAttr = parseInt(itemInputs[idx].getAttribute('data-product-id') || '0', 10);
                    var st = pidAttr ? comboState[pidAttr] : null;
                    if (st && st.isCombo) {
                        var emptySlotIdx = st.slots.indexOf(null);
                        if (emptySlotIdx !== -1) {
                            if (errorBox) {
                                errorBox.innerText = 'অনুগ্রহ করে কম্বো প্যাকের সবগুলো (' + st.packSize + 'টি) বক্সে পছন্দের কালার সিলেক্ট করুন। (বক্স #' + (emptySlotIdx + 1) + ' খালি আছে)';
                                errorBox.classList.remove('hidden');
                                errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                            openComboModal(pidAttr, emptySlotIdx);
                            return;
                        }
                        if (st.sizes.length > 0 && !st.selectedSize) {
                            if (errorBox) {
                                errorBox.innerText = 'অনুগ্রহ করে কম্বো প্যাকের সাইজ (Size) সিলেক্ট করুন।';
                                errorBox.classList.remove('hidden');
                                errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                            return;
                        }
                    }
                }

                // Loading state
                if (submitBtn) submitBtn.disabled = true;
                if (btnSpinner) btnSpinner.classList.remove('hidden');
                if (btnText) btnText.innerText = 'Processing Order...';

                var formData = new FormData(form);

                fetch(form.action, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: formData
                    })
                    .then(function(res) {
                        return res.json().then(function(data) {
                            return {
                                ok: res.ok,
                                status: res.status,
                                data: data
                            };
                        });
                    })
                    .then(function(res) {
                        if (!res.ok) {
                            var msg = 'Failed to place order. Please check inputs.';
                            if (res.data.message) {
                                msg = res.data.message;
                            } else if (res.data.errors) {
                                var firstKey = Object.keys(res.data.errors)[0];
                                msg = res.data.errors[firstKey][0] || msg;
                            }

                            if (errorBox) {
                                errorBox.innerText = msg;
                                errorBox.classList.remove('hidden');
                            }

                            if (btnSpinner) btnSpinner.classList.add('hidden');
                            updateSubmitButtonState();
                            return;
                        }

                        // Redirect to thank-you page
                        var orderNum = res.data.order ? res.data.order.order_number : null;
                        if (orderNum) {
                            window.location.href = '/checkout/thank-you/' + encodeURIComponent(
                                orderNum);
                        } else {
                            window.location.reload();
                        }
                    })
                    .catch(function(err) {
                        if (errorBox) {
                            errorBox.innerText =
                                'Network error. Please check your internet connection and try again.';
                            errorBox.classList.remove('hidden');
                        }
                        if (btnSpinner) btnSpinner.classList.add('hidden');
                        updateSubmitButtonState();
                    });
            });

            if (submitWrap) {
                submitWrap.addEventListener('click', function(e) {
                    var check = checkComboIncompleteness();
                    if (check.isIncomplete) {
                        e.preventDefault();
                        if (errorBox) {
                            errorBox.innerText = check.reason;
                            errorBox.classList.remove('hidden');
                            errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        if (check.pid && check.emptySlotIndex !== -1) {
                            openComboModal(check.pid, check.emptySlotIndex);
                        }
                    }
                });
            }

            updateSubmitButtonState();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initCodCheckout);
        } else {
            initCodCheckout();
        }
    })();
</script>
