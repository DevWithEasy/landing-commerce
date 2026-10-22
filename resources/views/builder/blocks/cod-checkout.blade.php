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

    $containerStyle = $inlineStyle([
        'max-width' => $props['containerMaxWidth'] ?? '672px',
        'padding-top' => $props['containerPaddingX'] ?? '16px',
        'padding-bottom' => $props['containerPaddingX'] ?? '16px',
        'padding-left' => $props['containerPaddingX'] ?? '16px',
        'padding-right' => $props['containerPaddingX'] ?? '16px',
    ]);

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
        'border-color' => $props['cardBorderColor'] ?? '#10b981',
        'border-width' => $props['cardBorderWidth'] ?? '2px',
        'border-style' => $props['cardBorderStyle'] ?? 'solid',
        'border-radius' => $props['cardBorderRadius'] ?? '24px',
        'min-height' => $props['cardMinHeight'] ?? null,
        'padding-top' => $props['cardPaddingTop'] ?? '32px',
        'padding-bottom' => $props['cardPaddingBottom'] ?? '32px',
        'padding-left' => $props['cardPaddingLeft'] ?? '32px',
        'padding-right' => $props['cardPaddingRight'] ?? '32px',
        'box-shadow' => $props['cardShadow'] ?? '0 25px 50px -12px rgb(0 0 0 / 0.25)',
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
        'gap' => $props['fieldGap'] ?? '16px',
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
    <div class="mx-auto" {!! $containerStyle !!}>
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

                {{-- Product selection cards in Checkout form --}}
                @if ($hasMultiple && $showProductSelector)
                    <div {!! $productPanelStyle !!}>
                        <div class="flex items-center justify-between"
                            style="margin-bottom: 8px; color: {{ e($productPanelTitleColor) }}; font-size: 11px; font-weight: 700;">
                            <span>
                                Order Items ({{ $mode === 'multiple' ? 'Check Multiple' : 'Select One' }}):
                            </span>
                            <span style="color: {{ e($accentColor) }}; font-weight: 600;">
                                {{ $mode === 'multiple' ? 'Checkbox Selection' : 'Radio Selection' }}
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
                                    $pImgUrl =
                                        $pVar?->images?->first()?->url ??
                                        ($pItem->primaryImage?->url ?? ($pItem->images->first()?->url ?? null));

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
                                <div class="cod-product-card relative flex flex-col {{ $isItemChecked ? 'cod-card-selected' : '' }}" data-lc-el="product-card"
                                    {!! $itemCardStyle !!}>
                                    <label class="flex w-full cursor-pointer items-center justify-between">
                                        <div class="flex min-w-0 flex-1 items-center space-x-3">
                                            {{-- Selector Input --}}
                                            @if ($mode === 'multiple')
                                                <input type="checkbox"
                                                    class="cod-product-toggle h-4 w-4 flex-shrink-0 rounded"
                                                    style="accent-color: {{ e($accentColor) }};"
                                                    data-product-id="{{ $pItem->id }}"
                                                    data-variant-id="{{ $pVarId }}"
                                                    data-price="{{ $pEffPrice }}"
                                                    data-title="{{ e($pItem->title) }}"
                                                    {{ $isItemChecked ? 'checked' : '' }} />
                                            @else
                                                <input type="radio" name="cod_radio_product"
                                                    class="cod-product-toggle h-4 w-4 flex-shrink-0"
                                                    style="accent-color: {{ e($accentColor) }};"
                                                    data-product-id="{{ $pItem->id }}"
                                                    data-variant-id="{{ $pVarId }}"
                                                    data-price="{{ $pEffPrice }}"
                                                    data-title="{{ e($pItem->title) }}"
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
                                                <div class="mb-0.5 flex items-center space-x-1.5">
                                                    <span class="block truncate font-bold" {!! $productTitleStyle !!}>
                                                        {{ $pItem->title }}
                                                    </span>
                                                    @if (!empty($itemBadge))
                                                        <span class="flex-shrink-0 px-1.5 py-0.5 font-bold"
                                                            {!! $productBadgeStyle !!}>
                                                            {{ $itemBadge }}
                                                        </span>
                                                    @endif
                                                </div>

                                                <div class="flex items-baseline space-x-2">
                                                    <span class="cod-card-price font-extrabold"
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
                                        </div>
                                    </label>

                                    {{-- Variants selector inside card (only shown when product is selected) --}}
                                    @if ($showVariants && $pItem->variants->count() > 1)
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
                @endif

                {{-- Hidden container for dynamic items inputs --}}
                <div id="cod-items-container">
                    @if ($hasMultiple)
                        @foreach ($products as $idx => $item)
                            @php
                                $varId = $item->variants->first()?->id ?? 0;
                                $effectivePrice =
                                    (float) ($item->variants->first()?->sale_price ??
                                        ($item->variants->first()?->regular_price ??
                                            ($item->sale_price ?? $item->regular_price)));
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
                                    data-title="{{ e($item->title) }}" />
                                <input type="hidden" class="cod-item-qty" name="items[{{ $idx }}][quantity]"
                                    value="1" />
                            @endif
                        @endforeach
                    @elseif($firstVariantId)
                        <input type="hidden" class="cod-item-input" name="items[0][variant_id]"
                            value="{{ $firstVariantId }}"
                            data-price="{{ (float) ($firstProduct?->sale_price ?? ($firstProduct?->regular_price ?? 0)) }}"
                            data-title="{{ e($firstProduct?->title ?? '') }}" />
                        <input type="hidden" class="cod-item-qty" name="items[0][quantity]" value="1" />
                    @endif
                </div>

                {{-- Alert Box for Errors --}}
                <div id="cod-error-box"
                    class="hidden rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                </div>

                {{-- Customer Fields (Name, Phone, Address) - Fully Customizable --}}
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
                        {{ $phoneLabel }}
                        @if ($showRequiredMark)
                            <span style="color: {{ e($requiredMarkColor) }};">*</span>
                        @endif
                    </label>
                    <input type="tel" name="customer_phone" required placeholder="{{ $phonePlaceholder }}"
                        pattern="01[3-9][0-9]{8}" data-lc-el="input" {!! $inputStyle !!} />
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

                {{-- Shipping Method Dropdown --}}
                <div>
                    <label {!! $labelStyle !!} data-lc-el="label">
                        {{ $shippingLabel }}
                        @if ($showRequiredMark)
                            <span style="color: {{ e($requiredMarkColor) }};">*</span>
                        @endif
                    </label>
                    <div class="relative">
                        <select name="shipping_method_id" id="cod_shipping_method" {!! $shippingStyle !!}>
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
                                <option value="{{ $sMethod->id }}" data-rate="{{ $sRate }}"
                                    data-zone="{{ $zoneDistrict }}" {{ $loop->first ? 'selected' : '' }}>
                                    {{ $sMethod->name }} — ৳{{ number_format($sRate, 0) }} {{ $sTime }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                </div>

                {{-- Live Summary Breakdown --}}
                @if ($showSummary)
                    <div {!! $summaryStyle !!} data-lc-el="summary">
                        <div class="flex justify-between">
                            <span>Items Subtotal:</span>
                            <span id="cod-summary-subtotal" class="font-bold"
                                {!! $summaryValueStyle !!}>৳0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Delivery Charge:</span>
                            <span id="cod-summary-shipping" class="font-bold"
                                style="color: {{ e($accentColor) }};">৳{{ number_format($defaultShippingFee, 0) }}</span>
                        </div>
                        <div class="flex justify-between border-t pt-2 font-extrabold"
                            style="border-color: {{ e($summaryBorderColor) }};">
                            <span>Total Payable:</span>
                            <span id="cod-summary-total" class="font-black" {!! $summaryTotalStyle !!}>৳0</span>
                        </div>
                    </div>
                @endif

                <div>
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
            </form>
        </div>
    </div>
</section>

<script>
    (function() {
        function initCodCheckout() {
            var form = document.getElementById('landing-cod-form');
            if (!form) return;

            var itemsContainer = document.getElementById('cod-items-container');
            var subtotalEl = document.getElementById('cod-summary-subtotal');
            var shippingEl = document.getElementById('cod-summary-shipping');
            var totalEl = document.getElementById('cod-summary-total');
            var errorBox = document.getElementById('cod-error-box');
            var submitBtn = document.getElementById('cod-submit-btn');
            var btnSpinner = document.getElementById('cod-btn-spinner');
            var btnText = document.getElementById('cod-btn-text');
            var toggles = form.querySelectorAll('.cod-product-toggle');
            var shippingSelect = document.getElementById('cod_shipping_method');
            var districtInput = document.getElementById('cod_district');
            var variantBtns = form.querySelectorAll('.cod-variant-btn');
            var defaultButtonText = submitBtn ? (submitBtn.getAttribute('data-default-text') || 'Confirm Order - Cash on Delivery') : 'Confirm Order - Cash on Delivery';

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

                    // Update toggle attributes and ensure checked
                    var toggle = card.querySelector('.cod-product-toggle');
                    if (toggle) {
                        toggle.setAttribute('data-variant-id', vid);
                        toggle.setAttribute('data-price', vPrice);
                        if (!toggle.checked) {
                            toggle.checked = true;
                        }
                    }

                    // Update active state in container
                    var container = card.querySelector('.cod-variant-container');
                    if (container) {
                        container.querySelectorAll('.cod-variant-btn').forEach(function(b) {
                            b.classList.remove('cod-variant-active');
                        });
                        btn.classList.add('cod-variant-active');
                    }

                    // Update card price text
                    var priceEl = card.querySelector('.cod-card-price');
                    if (priceEl) {
                        priceEl.innerText = '৳' + Math.round(vPrice).toLocaleString();
                    }

                    // Update variant image if provided (WooCommerce style)
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

            function getShippingRate() {
                if (!shippingSelect) return 70;
                var opt = shippingSelect.selectedOptions[0];
                return opt ? parseFloat(opt.getAttribute('data-rate') || '70') : 70;
            }

            function updateTotals() {
                var shipFee = getShippingRate();
                if (shippingEl) shippingEl.innerText = '৳' + Math.round(shipFee).toLocaleString();
                if (subtotalEl) subtotalEl.innerText = '৳' + Math.round(currentSubtotal).toLocaleString();
                if (totalEl) totalEl.innerText = '৳' + Math.round(currentSubtotal + shipFee).toLocaleString();

                if (shippingSelect && districtInput) {
                    var opt = shippingSelect.selectedOptions[0];
                    var zoneStr = opt ? (opt.getAttribute('data-zone') || 'Dhaka') : 'Dhaka';
                    districtInput.value = zoneStr;
                }
            }

            function rebuildFromItems(items) {
                if (!itemsContainer) return;
                itemsContainer.innerHTML = '';
                var subtotal = 0;

                items.forEach(function(item, idx) {
                    var inputVar = document.createElement('input');
                    inputVar.type = 'hidden';
                    inputVar.name = 'items[' + idx + '][variant_id]';
                    inputVar.value = item.variantId;
                    itemsContainer.appendChild(inputVar);

                    var inputQty = document.createElement('input');
                    inputQty.type = 'hidden';
                    inputQty.name = 'items[' + idx + '][quantity]';
                    inputQty.value = item.quantity || 1;
                    itemsContainer.appendChild(inputQty);

                    subtotal += (item.price || 0) * (item.quantity || 1);
                });

                currentSubtotal = subtotal;
                updateTotals();
            }

            function calculateFromToggles() {
                var selected = [];
                toggles.forEach(function(t) {
                    var card = t.closest('.cod-product-card');
                    var variantContainer = card ? card.querySelector('.cod-variant-container') : null;
                    if (t.checked) {
                        if (card) {
                            card.classList.add('cod-card-selected');
                        }
                        if (variantContainer) {
                            variantContainer.classList.remove('hidden');
                        }
                        selected.push({
                            productId: parseInt(t.getAttribute('data-product-id'), 10),
                            variantId: parseInt(t.getAttribute('data-variant-id'), 10),
                            price: parseFloat(t.getAttribute('data-price') || '0'),
                            title: t.getAttribute('data-title'),
                            quantity: 1
                        });
                    } else {
                        if (card) {
                            card.classList.remove('cod-card-selected');
                        }
                        if (variantContainer) {
                            variantContainer.classList.add('hidden');
                        }
                    }
                });

                rebuildFromItems(selected);
            }

            if (shippingSelect) {
                shippingSelect.addEventListener('change', updateTotals);
            }

            if (toggles.length > 0) {
                toggles.forEach(function(t) {
                    t.addEventListener('change', calculateFromToggles);
                });
                calculateFromToggles();
            } else {
                // Single product initial calculation
                var existingInputs = itemsContainer.querySelectorAll('.cod-item-input');
                var initialSubtotal = 0;
                existingInputs.forEach(function(inp) {
                    initialSubtotal += parseFloat(inp.getAttribute('data-price') || '0');
                });
                currentSubtotal = initialSubtotal;
                updateTotals();
            }

            // Listen to event from external product-selector block
            window.addEventListener('landing-selection-updated', function(e) {
                if (e.detail && Array.isArray(e.detail.selectedItems)) {
                    var selectedPids = e.detail.selectedItems.map(function(i) {
                        return i.productId;
                    });
                    toggles.forEach(function(t) {
                        var pid = parseInt(t.getAttribute('data-product-id'), 10);
                        t.checked = selectedPids.indexOf(pid) !== -1;
                        var card = t.closest('.cod-product-card');
                        var variantContainer = card ? card.querySelector('.cod-variant-container') : null;
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
                    });

                    rebuildFromItems(e.detail.selectedItems);
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

                            if (submitBtn) submitBtn.disabled = false;
                            if (btnSpinner) btnSpinner.classList.add('hidden');
                            if (btnText) btnText.innerText = defaultButtonText;
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
                        if (submitBtn) submitBtn.disabled = false;
                        if (btnSpinner) btnSpinner.classList.add('hidden');
                        if (btnText) btnText.innerText = defaultButtonText;
                    });
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initCodCheckout);
        } else {
            initCodCheckout();
        }
    })();
</script>
