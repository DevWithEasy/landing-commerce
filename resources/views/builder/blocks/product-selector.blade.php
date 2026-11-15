@php
    $showDescription = $props['showDescription'] ?? true;
    $showPrice = $props['showPrice'] ?? true;
    $showDiscountBadge = $props['showDiscountBadge'] ?? true;
    $badgeText = $props['badgeText'] ?? 'Most Popular';
    $productBadges = $props['productBadges'] ?? [];
    $orderButtonText = $props['orderButtonText'] ?? 'অর্ডার করুন';
    $mode = $selectionMode ?? ($props['selectionMode'] ?? 'single');
    $defaultSelection = $props['defaultSelection'] ?? 'first';
    $defaultSelectedId = (int) ($props['defaultSelectedId'] ?? 0);
    $hasMultiple = isset($products) && $products->count() > 1;
    $buttonBg = $styles['buttonBgColor'] ?? null;
    $buttonText = $styles['buttonTextColor'] ?? null;
    $buttonPulse = !empty($styles['buttonPulseAnimation']);
    $btnCustomStyle = '';
    if ($buttonBg) $btnCustomStyle .= 'background-color: ' . e($buttonBg) . ';';
    if ($buttonText) $btnCustomStyle .= 'color: ' . e($buttonText) . ';';

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
@endphp

<section {!! $styleAttribute !!} data-lc-el="section" class="lc-block-root w-full py-12 bg-white border-b border-gray-100" id="product-selection-section" data-selection-mode="{{ $mode }}">
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 [.lc-container_&]:max-w-none [.lc-container_&]:px-0 [.lc-grid_&]:max-w-none [.lc-grid_&]:px-0">
        @if($hasMultiple)
            {{-- Multi-Product Selector Mode --}}
            <div class="mb-8 text-center">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-50 text-primary-700 mb-2">
                    Featured Collection
                </span>
                <h2 data-lc-el="title" class="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    Select Your Preferred Product
                </h2>
                <p class="text-sm text-gray-500 mt-1 max-w-xl mx-auto">
                    Browse our collection below and click to place your order with fast Cash on Delivery.
                </p>
            </div>

            {{-- Products Grid with Guaranteed Equal Height --}}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                @foreach($products as $index => $item)
                    @php
                        $firstVariant = $item->variants->first();
                        $firstVariantId = $firstVariant?->id ?? 0;
                        $itemEffectivePrice = (float) ($firstVariant?->sale_price ?? ($firstVariant?->regular_price ?? ($item->sale_price ?? $item->regular_price)));
                        $itemRegPrice = (float) ($firstVariant?->regular_price ?? $item->regular_price);
                        $hasDiscount = ($itemEffectivePrice < $itemRegPrice);
                        $discountPercent = $hasDiscount && $itemRegPrice > 0 ? round((($itemRegPrice - $itemEffectivePrice) / $itemRegPrice) * 100) : 0;

                        $rawComboFirstImg = null;
                        if (is_array($item->combo_colors ?? null)) {
                            foreach ($item->combo_colors as $cc) {
                                if (!empty($cc['image_url'])) {
                                    $rawComboFirstImg = (string) $cc['image_url'];
                                    break;
                                }
                            }
                        }

                        $imgUrl = $firstVariant?->images?->first()?->url
                            ?? ($item->primaryImage?->url ?? ($item->images->first()?->url ?? $rawComboFirstImg));

                        $comboPackSize = max(1, (int) ($item->combo_pack_size ?? 1));
                        $isCombo = $comboPackSize > 1;
                        $comboColors = $extractComboColors($item, $imgUrl);
                        $comboSizes = $extractComboSizes($item);

                        // Custom per-product badge
                        $cardBadge = $productBadges[$item->id] ?? ($index === 0 ? $badgeText : null);

                        // Collect all gallery images
                        $galleryUrls = [];
                        if ($item->primaryImage?->url) $galleryUrls[] = $item->primaryImage->url;
                        foreach ($item->images as $img) {
                            if ($img->url && !in_array($img->url, $galleryUrls, true)) {
                                $galleryUrls[] = $img->url;
                            }
                        }
                        foreach ($item->variants as $v) {
                            foreach ($v->images as $vImg) {
                                if ($vImg->url && !in_array($vImg->url, $galleryUrls, true)) {
                                    $galleryUrls[] = $vImg->url;
                                }
                            }
                        }
                        foreach ($comboColors as $cc) {
                            if (!empty($cc['image_url']) && !in_array($cc['image_url'], $galleryUrls, true)) {
                                $galleryUrls[] = $cc['image_url'];
                            }
                        }
                        if (empty($galleryUrls) && $imgUrl) {
                            $galleryUrls[] = $imgUrl;
                        }

                        $hasVariants = !$isCombo && $item->variants && $item->variants->count() > 1;

                        // Build clean JSON payload for modals
                        $itemJsonData = [
                            'id' => $item->id,
                            'title' => $item->title,
                            'description' => $item->description,
                            'regular_price' => $itemRegPrice,
                            'sale_price' => $itemEffectivePrice,
                            'has_discount' => $hasDiscount,
                            'discount_percent' => $discountPercent,
                            'badge' => $cardBadge,
                            'main_image' => $imgUrl,
                            'gallery' => $galleryUrls,
                            'is_combo' => $isCombo,
                            'combo_pack_size' => $comboPackSize,
                            'combo_colors' => $comboColors,
                            'combo_sizes' => $comboSizes,
                            'has_variants' => $hasVariants,
                            'variants' => $item->variants->map(function($v) use ($imgUrl) {
                                return [
                                    'id' => $v->id,
                                    'name' => $v->name,
                                    'regular_price' => (float) $v->regular_price,
                                    'sale_price' => $v->sale_price ? (float) $v->sale_price : null,
                                    'price' => (float) ($v->sale_price ?? $v->regular_price),
                                    'image' => $v->images->first()?->url ?? $imgUrl,
                                ];
                            })->values()->all(),
                        ];
                    @endphp

                    {{-- Traditional E-commerce Product Card --}}
                    <div data-lc-el="card" class="product-selection-card group/card relative flex flex-col justify-between rounded-2xl border border-gray-200 transition-all p-4 bg-white shadow-xs hover:shadow-lg hover:border-primary-500 h-full"
                        data-product-id="{{ $item->id }}"
                        data-variant-id="{{ $firstVariantId }}"
                        data-price="{{ $itemEffectivePrice }}"
                        data-title="{{ e($item->title) }}">

                        {{-- Hidden JSON storage for modals --}}
                        <script type="application/json" class="product-json-data">
                            {!! json_encode($itemJsonData, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) !!}
                        </script>

                        <div class="flex-1 flex flex-col">
                            {{-- Top Bar: Badges --}}
                            <div class="flex items-center justify-between pointer-events-none mb-2 min-h-[22px] z-10">
                                @if(!empty($cardBadge))
                                    <span class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-500 text-white shadow-xs">
                                        🔥 {{ $cardBadge }}
                                    </span>
                                @else
                                    <span></span>
                                @endif

                                @if($showDiscountBadge && $hasDiscount)
                                    <span class="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-rose-100 text-rose-700">
                                        {{ $discountPercent }}% OFF
                                    </span>
                                @endif
                            </div>

                            {{-- Product Image Thumbnail with Hover Blur & Quick View Eye Icon --}}
                            <div data-lc-el="image" class="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-3 flex items-center justify-center group/img">
                                @if($imgUrl)
                                    <img src="{{ e($imgUrl) }}" alt="{{ e($item->title) }}" class="selector-card-img w-full h-full object-cover transition duration-500 group-hover/img:scale-105" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');" />
                                    <div class="text-gray-400 text-xs flex flex-col items-center justify-center p-2 hidden">
                                        <svg class="w-10 h-10 mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                        <span>No Image</span>
                                    </div>
                                @else
                                    <div class="text-gray-400 text-xs flex flex-col items-center justify-center p-2">
                                        <svg class="w-10 h-10 mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                        <span>No Image</span>
                                    </div>
                                @endif

                                {{-- Translucent / Blur Hover Overlay with Quick View Button --}}
                                <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2 z-10">
                                    <button type="button" class="quick-view-trigger-btn px-3.5 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-full shadow-md text-xs font-bold flex items-center space-x-1.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer" data-product-id="{{ $item->id }}">
                                        <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                        <span>Quick View</span>
                                    </button>
                                </div>

                                @if($isCombo)
                                    <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-amber-500/95 text-white text-[9px] font-extrabold backdrop-blur-xs flex items-center space-x-1 shadow-xs">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                                        <span>{{ $comboPackSize }} Pcs Combo</span>
                                    </div>
                                @elseif($hasVariants)
                                    <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/75 text-white text-[9px] font-bold backdrop-blur-xs flex items-center space-x-1">
                                        <svg class="w-3 h-3 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                                        <span>{{ $item->variants->count() }} Options</span>
                                    </div>
                                @endif
                            </div>

                            {{-- Title & Pricing --}}
                            <div>
                                <h3 data-lc-el="product-title" class="text-sm font-bold text-gray-900 line-clamp-2 min-h-[2.5rem] mb-1.5 leading-snug" title="{{ e($item->title) }}">
                                    {{ $item->title }}
                                </h3>

                                @if($showPrice)
                                    <div class="flex items-baseline space-x-2 mb-2">
                                        <span data-lc-el="price" class="selector-card-price text-base font-extrabold text-primary-600">
                                            ৳{{ number_format($itemEffectivePrice, 0) }}
                                        </span>
                                        @if($hasDiscount)
                                            <span class="selector-card-regprice text-xs text-gray-400 line-through">
                                                ৳{{ number_format($itemRegPrice, 0) }}
                                            </span>
                                        @endif
                                    </div>
                                @endif

                                @if($isCombo)
                                    <div class="card-combo-summary-badge hidden mb-2 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800 line-clamp-2"></div>
                                @endif

                                @if($showDescription && $item->description)
                                    <p data-lc-el="description" class="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">
                                        {{ $item->description }}
                                    </p>
                                @endif
                            </div>
                        </div>

                        {{-- Order Now Button on Each Card (Anchored to bottom) --}}
                        <div class="mt-auto pt-3 border-t border-gray-100">
                            <button type="button"
                                style="{{ $btnCustomStyle }}"
                                data-lc-el="button"
                                class="card-order-btn w-full py-2.5 px-4 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer {{ $buttonPulse ? 'animate-pulse' : '' }}"
                                data-product-id="{{ $item->id }}"
                                data-has-variants="{{ $hasVariants ? '1' : '0' }}"
                                data-is-combo="{{ $isCombo ? '1' : '0' }}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                                <span>{{ $orderButtonText }}</span>
                            </button>
                        </div>
                    </div>
                @endforeach
            </div>

        @elseif($product)
            {{-- Single Product Showcase --}}
            @php
                $firstVar = $product->variants->first();
                $firstVarId = $firstVar?->id ?? 0;
                $effPrice = (float) ($firstVar?->sale_price ?? ($firstVar?->regular_price ?? ($product->sale_price ?? $product->regular_price)));
                $regPrice = (float) ($firstVar?->regular_price ?? $product->regular_price);
                $hasDisc = ($effPrice < $regPrice);
                $discPct = $hasDisc && $regPrice > 0 ? round((($regPrice - $effPrice) / $regPrice) * 100) : 0;

                $rawSingleComboFirstImg = null;
                if (is_array($product->combo_colors ?? null)) {
                    foreach ($product->combo_colors as $cc) {
                        if (!empty($cc['image_url'])) {
                            $rawSingleComboFirstImg = (string) $cc['image_url'];
                            break;
                        }
                    }
                }

                $singleImg = $firstVar?->images?->first()?->url
                    ?? ($product->primaryImage?->url ?? ($product->images->first()?->url ?? $rawSingleComboFirstImg));
                $singleBadge = $productBadges[$product->id] ?? $badgeText;

                $comboPackSize = max(1, (int) ($product->combo_pack_size ?? 1));
                $isCombo = $comboPackSize > 1;
                $comboColors = $extractComboColors($product, $singleImg);
                $comboSizes = $extractComboSizes($product);
                $hasVariants = !$isCombo && $product->variants && $product->variants->count() > 1;

                // Collect gallery
                $galleryUrls = [];
                if ($product->primaryImage?->url) $galleryUrls[] = $product->primaryImage->url;
                foreach ($product->images as $img) {
                    if ($img->url && !in_array($img->url, $galleryUrls, true)) {
                        $galleryUrls[] = $img->url;
                    }
                }
                foreach ($product->variants as $v) {
                    foreach ($v->images as $vImg) {
                        if ($vImg->url && !in_array($vImg->url, $galleryUrls, true)) {
                            $galleryUrls[] = $vImg->url;
                        }
                    }
                }
                foreach ($comboColors as $cc) {
                    if (!empty($cc['image_url']) && !in_array($cc['image_url'], $galleryUrls, true)) {
                        $galleryUrls[] = $cc['image_url'];
                    }
                }
                if (empty($galleryUrls) && $singleImg) {
                    $galleryUrls[] = $singleImg;
                }

                $singleJsonData = [
                    'id' => $product->id,
                    'title' => $product->title,
                    'description' => $product->description,
                    'regular_price' => $regPrice,
                    'sale_price' => $effPrice,
                    'has_discount' => $hasDisc,
                    'discount_percent' => $discPct,
                    'badge' => $singleBadge,
                    'main_image' => $singleImg,
                    'gallery' => $galleryUrls,
                    'is_combo' => $isCombo,
                    'combo_pack_size' => $comboPackSize,
                    'combo_colors' => $comboColors,
                    'combo_sizes' => $comboSizes,
                    'has_variants' => $hasVariants,
                    'variants' => $product->variants->map(function($v) use ($singleImg) {
                        return [
                            'id' => $v->id,
                            'name' => $v->name,
                            'regular_price' => (float) $v->regular_price,
                            'sale_price' => $v->sale_price ? (float) $v->sale_price : null,
                            'price' => (float) ($v->sale_price ?? $v->regular_price),
                            'image' => $v->images->first()?->url ?? $singleImg,
                        ];
                    })->values()->all(),
                ];
            @endphp
            <div data-lc-el="card" class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 sm:p-8" id="single-product-showcase" data-product-id="{{ $product->id }}" data-variant-id="{{ $firstVarId }}" data-price="{{ $effPrice }}" data-title="{{ e($product->title) }}" data-is-combo="{{ $isCombo ? '1' : '0' }}">
                <script type="application/json" class="product-json-data">
                    {!! json_encode($singleJsonData, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) !!}
                </script>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <div data-lc-el="image" class="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center relative group/single">
                            @if($singleImg)
                                <img src="{{ e($singleImg) }}" alt="{{ e($product->title) }}" id="single-product-main-img" class="w-full h-full object-cover" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');" />
                                <div class="text-gray-400 text-xs flex flex-col items-center justify-center p-4 hidden">
                                    <svg class="w-14 h-14 mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                    <span>No Image Available</span>
                                </div>
                            @else
                                <div class="text-gray-400 text-xs flex flex-col items-center justify-center p-4">
                                    <svg class="w-14 h-14 mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                    <span>No Image Available</span>
                                </div>
                            @endif

                            <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] opacity-0 group-hover/single:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2 z-10">
                                <button type="button" class="quick-view-trigger-btn px-3.5 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-full shadow-md text-xs font-bold flex items-center space-x-1.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer" data-product-id="{{ $product->id }}">
                                    <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                    <span>Quick View</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div class="flex flex-wrap items-center gap-2 mb-2">
                            @if(!empty($singleBadge))
                                <span class="px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-md bg-amber-500 text-white">
                                    🔥 {{ $singleBadge }}
                                </span>
                            @endif
                            @if($isCombo)
                                <span class="px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-900">
                                    {{ $comboPackSize }} Pcs Combo Pack
                                </span>
                            @endif
                            @if($showDiscountBadge && $hasDisc)
                                <span class="px-2.5 py-0.5 text-xs font-bold rounded-md bg-rose-100 text-rose-700">
                                    {{ $discPct }}% OFF
                                </span>
                            @endif
                        </div>

                        <h2 data-lc-el="title" class="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                            {{ $product->title }}
                        </h2>

                        @if($showPrice)
                            <div class="flex items-baseline space-x-3 mb-4">
                                <span id="single-product-price" data-lc-el="price" class="text-3xl font-black text-primary-600">
                                    ৳{{ number_format($effPrice, 0) }}
                                </span>
                                @if($hasDisc)
                                    <span class="text-lg text-gray-400 line-through">
                                        ৳{{ number_format($regPrice, 0) }}
                                    </span>
                                @endif
                            </div>
                        @endif

                        @if($showDescription && $product->description)
                            <p data-lc-el="description" class="text-sm text-gray-600 leading-relaxed mb-5">
                                {{ $product->description }}
                            </p>
                        @endif

                        @if($isCombo)
                            {{-- Single Product Combo Pack `[ + ]` Boxes & Size Selector --}}
                            <div id="single-combo-wrapper" class="mb-6 space-y-4">
                                <div class="bg-amber-50/40 border border-amber-200/80 rounded-xl p-3.5 space-y-3">
                                    <div class="flex items-center justify-between gap-2">
                                        <span class="text-xs font-bold text-gray-800">
                                            পছন্দের {{ $comboPackSize }}টি কালার সিলেক্ট করুন (<span id="single-combo-count">0</span>/{{ $comboPackSize }})
                                        </span>
                                        <span id="single-combo-complete-badge" class="hidden inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                            ✓ কমপ্লিট
                                        </span>
                                    </div>

                                    <div id="single-combo-slots" class="flex flex-wrap items-center gap-2.5">
                                        @for($sIdx = 0; $sIdx < $comboPackSize; $sIdx++)
                                            <div role="button" tabindex="0"
                                                class="ps-single-combo-slot relative w-20 h-24 rounded-xl border-2 border-dashed border-amber-400 bg-amber-100/50 hover:bg-amber-100/80 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden select-none shrink-0"
                                                data-slot-index="{{ $sIdx }}">
                                                <span class="slot-num-badge absolute top-1 left-1 z-[2] w-4 h-4 rounded-full bg-slate-900/75 text-white text-[9px] font-bold flex items-center justify-center">{{ $sIdx + 1 }}</span>
                                                <div class="slot-empty-state flex flex-col items-center justify-center gap-1 text-amber-900">
                                                    <div class="w-7 h-7 rounded-full bg-amber-300/60 flex items-center justify-center text-sm font-bold">+</div>
                                                    <span class="text-[10px] font-bold">+ কালার দিন</span>
                                                </div>
                                                <img class="slot-filled-img w-full h-14 object-cover hidden" src="" alt="" />
                                                <span class="slot-filled-name w-full px-1 py-0.5 text-[10px] font-bold text-gray-800 text-center truncate bg-white/95 border-t border-gray-100 hidden"></span>
                                                <button type="button" class="slot-clear-btn hidden absolute top-1 right-1 z-[2] w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center hover:bg-rose-700" data-slot-index="{{ $sIdx }}">×</button>
                                            </div>
                                        @endfor
                                    </div>

                                    <p class="text-[11px] text-gray-500">
                                        উপরের যেকোনো <span class="font-bold text-amber-800">[ + ]</span> বক্সে ক্লিক করে পপআপ থেকে ছবি দেখে পছন্দের কালার সিলেক্ট করুন।
                                    </p>
                                </div>

                                @if(count($comboSizes) > 0)
                                    <div>
                                        <div class="text-xs font-semibold text-gray-700 mb-2">
                                            কমন সাইজ সিলেক্ট করুন (Size): <span id="single-combo-size-label" class="font-bold text-gray-900">{{ $comboSizes[0] }}</span>
                                        </div>
                                        <div class="flex flex-wrap gap-2">
                                            @foreach($comboSizes as $szIdx => $szVal)
                                                <button type="button"
                                                    class="single-combo-size-btn min-w-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border cursor-pointer {{ $szIdx === 0 ? 'bg-primary-600 text-white border-primary-600 shadow-xs' : 'bg-white text-gray-800 border-gray-200 hover:border-primary-500' }}"
                                                    data-size="{{ e($szVal) }}">
                                                    {{ $szVal }}
                                                </button>
                                            @endforeach
                                        </div>
                                    </div>
                                @endif

                                <div id="single-combo-error" class="hidden text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"></div>
                            </div>
                        @elseif($product->variants && $product->variants->count() > 1)
                            <div class="mb-6">
                                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">ভ্যারিয়েন্ট নির্বাচন করুন:</label>
                                <div class="flex flex-wrap gap-2">
                                    @foreach($product->variants as $vIdx => $v)
                                        @php
                                            $vPrice = (float) ($v->sale_price ?? $v->regular_price ?? $effPrice);
                                            $vImage = $v->images->first()?->url ?? $singleImg;
                                            $isVActive = ($vIdx === 0);
                                        @endphp
                                        <button type="button"
                                            class="single-variant-btn px-3 py-1.5 text-xs font-semibold rounded-lg border transition {{ $isVActive ? 'border-primary-600 bg-primary-50 text-primary-900 ring-2 ring-primary-500 font-bold' : 'border-gray-200 bg-white text-gray-700' }}"
                                            data-variant-id="{{ $v->id }}"
                                            data-price="{{ $vPrice }}"
                                            data-image="{{ $vImage }}">
                                            {{ $v->name }}
                                        </button>
                                    @endforeach
                                </div>
                            </div>
                        @endif

                        <button type="button"
                            id="single-product-order-btn"
                            style="{{ $btnCustomStyle }}"
                            data-lc-el="button"
                            class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-600/20 transition cursor-pointer {{ $buttonPulse ? 'animate-pulse' : '' }}">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                            <span>{{ $orderButtonText }}</span>
                        </button>
                    </div>
                </div>
            </div>
        @else
            <div class="text-center py-12 px-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-500">
                <p class="text-sm">Select products in the editor inspector to preview.</p>
            </div>
        @endif
    </div>

    {{-- Shared Modal 1: Variant OR Multi-Product Combo Selection Modal --}}
    <div id="ps-variant-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100" onclick="event.stopPropagation()">
            <div class="sticky top-0 z-40 p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 shadow-2xs">
                <div>
                    <span id="ps-vmodal-eyebrow" class="text-[10px] font-bold uppercase tracking-wider text-primary-700 block">Select Variation</span>
                    <h4 id="ps-vmodal-title" class="text-sm font-bold text-gray-900 truncate max-w-[300px]">Product Title</h4>
                </div>
                <button type="button" id="ps-vmodal-close-btn" class="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="relative z-10 p-5 space-y-4 overflow-y-auto flex-1 min-h-0 isolate">
                <div class="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div class="w-14 h-14 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                        <img id="ps-vmodal-img" src="" alt="Variant" class="w-full h-full object-cover hidden" />
                        <div id="ps-vmodal-no-img" class="text-gray-400 text-[10px] flex flex-col items-center justify-center p-1 text-center">
                            <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                            <span class="scale-75 text-[9px] -mt-0.5">No Image</span>
                        </div>
                    </div>
                    <div class="min-w-0 flex-1">
                        <span id="ps-vmodal-selected-name" class="text-xs font-bold text-gray-900 block truncate">Selected: Standard</span>
                        <div class="flex items-baseline space-x-2 mt-0.5">
                            <span id="ps-vmodal-price" class="text-base font-extrabold text-primary-600">৳0</span>
                            <span id="ps-vmodal-regprice" class="text-xs text-gray-400 line-through hidden">৳0</span>
                            <span id="ps-vmodal-discount" class="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded hidden">0% OFF</span>
                        </div>
                    </div>
                </div>

                {{-- Standard Variant Mode Body --}}
                <div id="ps-vmodal-standard-body">
                    <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        ভ্যারিয়েন্ট বাছাই করুন (Choose Option):
                    </label>
                    <div id="ps-vmodal-options" class="grid grid-cols-2 gap-2"></div>
                </div>

                {{-- Combo Mode Body --}}
                <div id="ps-vmodal-combo-body" class="hidden space-y-4">
                    <div class="flex items-center justify-between gap-2">
                        <span id="ps-vmodal-combo-progress" class="text-xs font-bold text-gray-800">পছন্দের কালার সিলেক্ট করুন</span>
                        <span id="ps-vmodal-combo-active-pill" class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">বক্স #1 অ্যাক্টিভ</span>
                    </div>

                    <div id="ps-vmodal-combo-slots" class="flex flex-wrap items-center gap-2.5"></div>

                    <div>
                        <div id="ps-vmodal-combo-grid-label" class="text-xs font-bold text-gray-700 mb-2">বক্স #1-এর জন্য নিচের ছবি থেকে কালার সিলেক্ট করুন:</div>
                        <div id="ps-vmodal-combo-colors" class="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1"></div>
                    </div>

                    <div id="ps-vmodal-combo-sizes-wrap" class="hidden pt-2 border-t border-gray-100">
                        <div class="text-xs font-bold text-gray-700 mb-2">কমন সাইজ (Size): <span id="ps-vmodal-combo-size-val" class="text-primary-700"></span></div>
                        <div id="ps-vmodal-combo-sizes" class="flex flex-wrap gap-1.5"></div>
                    </div>

                    <div id="ps-vmodal-combo-error" class="hidden text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"></div>
                </div>

                <div class="pt-2">
                    <button type="button" id="ps-vmodal-confirm-btn" style="{{ $btnCustomStyle }}" class="w-full py-3 px-4 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer {{ $buttonPulse ? 'animate-pulse' : '' }}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                        <span>{{ $orderButtonText }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    {{-- Shared Modal 2: Product Quick View & Gallery Modal --}}
    <div id="ps-quickview-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 p-6 relative" onclick="event.stopPropagation()">
            <button type="button" id="ps-qvmodal-close-btn" class="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition z-10">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                    <div class="aspect-square rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center mb-3 relative">
                        <img id="ps-qvmodal-main-img" src="" alt="Main Product Preview" class="w-full h-full object-cover hidden" />
                        <div id="ps-qvmodal-no-img" class="text-gray-400 text-xs flex flex-col items-center justify-center p-2 text-center">
                            <svg class="w-12 h-12 mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                            <span>No Image</span>
                        </div>
                    </div>
                    <div id="ps-qvmodal-gallery-strip" class="flex items-center gap-2 overflow-x-auto pb-1"></div>
                </div>

                <div class="space-y-4">
                    <div>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-1">
                            ✓ In Stock & Fast Shipping
                        </span>
                        <h3 id="ps-qvmodal-title" class="text-xl font-bold text-gray-900 leading-snug">Product Title</h3>
                    </div>

                    <div class="flex items-baseline space-x-3 pt-1">
                        <span id="ps-qvmodal-price" class="text-2xl font-black text-primary-600">৳0</span>
                        <span id="ps-qvmodal-regprice" class="text-sm text-gray-400 line-through hidden">৳0</span>
                        <span id="ps-qvmodal-discount" class="text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md hidden">SAVE 0%</span>
                    </div>

                    <div id="ps-qvmodal-variants-container" class="pt-2 border-t border-gray-100 hidden">
                        <span class="text-xs font-bold text-gray-700 block mb-2">Available Variations:</span>
                        <div id="ps-qvmodal-variants-list" class="flex flex-wrap gap-1.5"></div>
                    </div>

                    <div id="ps-qvmodal-combo-container" class="pt-2 border-t border-gray-100 hidden space-y-3">
                        <span id="ps-qvmodal-combo-title" class="text-xs font-bold text-gray-800 block">পছন্দের কালার সিলেক্ট করুন:</span>
                        <div id="ps-qvmodal-combo-slots" class="flex flex-wrap items-center gap-2"></div>
                        <div id="ps-qvmodal-combo-sizes-wrap" class="hidden">
                            <div class="text-xs font-bold text-gray-700 mb-1.5">কমন সাইজ (Size): <span id="ps-qvmodal-combo-size-val" class="text-primary-700"></span></div>
                            <div id="ps-qvmodal-combo-sizes" class="flex flex-wrap gap-1.5"></div>
                        </div>
                        <div id="ps-qvmodal-combo-error" class="hidden text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"></div>
                    </div>

                    <div id="ps-qvmodal-desc-container" class="pt-2 border-t border-gray-100">
                        <span class="text-xs font-bold text-gray-700 block mb-1">Product Description:</span>
                        <p id="ps-qvmodal-desc" class="text-xs text-gray-600 leading-relaxed max-h-36 overflow-y-auto pr-1">Description text...</p>
                    </div>

                    <div class="pt-3">
                        <button type="button" id="ps-qvmodal-order-btn" style="{{ $btnCustomStyle }}" class="w-full py-3 px-4 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer {{ $buttonPulse ? 'animate-pulse' : '' }}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                            <span>{{ $orderButtonText }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Shared Modal 3: Standalone Color Selection Modal (opened when clicking `[ + ]` slot boxes) --}}
    <div id="ps-combo-color-modal" class="fixed inset-0 z-[60] hidden items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100" onclick="event.stopPropagation()">
            <div class="sticky top-0 z-40 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0 shadow-2xs">
                <div>
                    <h3 id="ps-ccmodal-title" class="text-sm sm:text-base font-bold text-gray-900">বক্স #1-এর জন্য কালার সিলেক্ট করুন</h3>
                    <p id="ps-ccmodal-subtitle" class="text-xs text-gray-500 mt-0.5">যেকোনো ছবির উপর ক্লিক করলে বক্স #1-এ অ্যাড হয়ে যাবে</p>
                </div>
                <button type="button" id="ps-ccmodal-close-btn" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div id="ps-ccmodal-body" class="relative z-10 p-5 overflow-y-auto flex-1 min-h-0 isolate grid grid-cols-2 sm:grid-cols-3 gap-3.5"></div>
        </div>
    </div>
</section>

<script>
(function() {
    function initProductSelector() {
        var section = document.getElementById('product-selection-section');
        if (!section) return;

        var mode = section.getAttribute('data-selection-mode') || 'single';

        // Modal Elements
        var vModal = document.getElementById('ps-variant-modal');
        var vModalClose = document.getElementById('ps-vmodal-close-btn');
        var vModalEyebrow = document.getElementById('ps-vmodal-eyebrow');
        var vModalTitle = document.getElementById('ps-vmodal-title');
        var vModalImg = document.getElementById('ps-vmodal-img');
        var vModalNoImg = document.getElementById('ps-vmodal-no-img');
        var vModalSelectedName = document.getElementById('ps-vmodal-selected-name');
        var vModalPrice = document.getElementById('ps-vmodal-price');
        var vModalRegPrice = document.getElementById('ps-vmodal-regprice');
        var vModalDiscount = document.getElementById('ps-vmodal-discount');
        var vModalStandardBody = document.getElementById('ps-vmodal-standard-body');
        var vModalOptions = document.getElementById('ps-vmodal-options');
        var vModalComboBody = document.getElementById('ps-vmodal-combo-body');
        var vModalComboProgress = document.getElementById('ps-vmodal-combo-progress');
        var vModalComboActivePill = document.getElementById('ps-vmodal-combo-active-pill');
        var vModalComboSlots = document.getElementById('ps-vmodal-combo-slots');
        var vModalComboGridLabel = document.getElementById('ps-vmodal-combo-grid-label');
        var vModalComboColors = document.getElementById('ps-vmodal-combo-colors');
        var vModalComboSizesWrap = document.getElementById('ps-vmodal-combo-sizes-wrap');
        var vModalComboSizeVal = document.getElementById('ps-vmodal-combo-size-val');
        var vModalComboSizes = document.getElementById('ps-vmodal-combo-sizes');
        var vModalComboError = document.getElementById('ps-vmodal-combo-error');
        var vModalConfirmBtn = document.getElementById('ps-vmodal-confirm-btn');

        var qvModal = document.getElementById('ps-quickview-modal');
        var qvModalClose = document.getElementById('ps-qvmodal-close-btn');
        var qvModalTitle = document.getElementById('ps-qvmodal-title');
        var qvModalMainImg = document.getElementById('ps-qvmodal-main-img');
        var qvModalNoImg = document.getElementById('ps-qvmodal-no-img');
        var qvModalGalleryStrip = document.getElementById('ps-qvmodal-gallery-strip');
        var qvModalPrice = document.getElementById('ps-qvmodal-price');
        var qvModalRegPrice = document.getElementById('ps-qvmodal-regprice');
        var qvModalDiscount = document.getElementById('ps-qvmodal-discount');
        var qvModalVariantsContainer = document.getElementById('ps-qvmodal-variants-container');
        var qvModalVariantsList = document.getElementById('ps-qvmodal-variants-list');
        var qvModalComboContainer = document.getElementById('ps-qvmodal-combo-container');
        var qvModalComboTitle = document.getElementById('ps-qvmodal-combo-title');
        var qvModalComboSlots = document.getElementById('ps-qvmodal-combo-slots');
        var qvModalComboSizesWrap = document.getElementById('ps-qvmodal-combo-sizes-wrap');
        var qvModalComboSizeVal = document.getElementById('ps-qvmodal-combo-size-val');
        var qvModalComboSizes = document.getElementById('ps-qvmodal-combo-sizes');
        var qvModalComboError = document.getElementById('ps-qvmodal-combo-error');
        var qvModalDesc = document.getElementById('ps-qvmodal-desc');
        var qvModalOrderBtn = document.getElementById('ps-qvmodal-order-btn');

        var ccModal = document.getElementById('ps-combo-color-modal');
        var ccModalTitle = document.getElementById('ps-ccmodal-title');
        var ccModalSubtitle = document.getElementById('ps-ccmodal-subtitle');
        var ccModalClose = document.getElementById('ps-ccmodal-close-btn');
        var ccModalBody = document.getElementById('ps-ccmodal-body');

        if (vModalImg) {
            vModalImg.onerror = function() {
                vModalImg.classList.add('hidden');
                if (vModalNoImg) vModalNoImg.classList.remove('hidden');
            };
        }
        if (qvModalMainImg) {
            qvModalMainImg.onerror = function() {
                qvModalMainImg.classList.add('hidden');
                if (qvModalNoImg) qvModalNoImg.classList.remove('hidden');
            };
        }

        var activeVariantState = {};
        var comboStateByPid = {};
        var currentModalProduct = null;
        var currentColorPickerContext = null; // { prodData, slotIndex, onPicked }
        var vModalActiveSlot = 0;

        function ensureComboState(prodData) {
            if (!prodData || !prodData.is_combo) return null;
            var pid = prodData.id;
            var packSize = Math.max(2, parseInt(prodData.combo_pack_size || '2', 10));
            if (!comboStateByPid[pid]) {
                var slots = [];
                for (var i = 0; i < packSize; i++) slots.push(null);
                comboStateByPid[pid] = {
                    packSize: packSize,
                    slots: slots,
                    selectedSize: (prodData.combo_sizes && prodData.combo_sizes[0]) ? prodData.combo_sizes[0] : ''
                };
            }
            return comboStateByPid[pid];
        }

        function buildComboSummary(prodData) {
            var st = ensureComboState(prodData);
            if (!st) return null;
            var parts = [];
            st.slots.forEach(function(slot, idx) {
                if (slot) parts.push('[' + (idx + 1) + '] ' + slot.name);
            });
            if (parts.length === 0) return null;
            var sizePart = st.selectedSize ? ' | Size: ' + st.selectedSize : '';
            return st.packSize + ' Pcs Combo — Colors: ' + parts.join(', ') + sizePart;
        }

        function syncCardComboBadge(prodData) {
            if (!prodData || !prodData.is_combo) return;
            var summary = buildComboSummary(prodData);
            var card = section.querySelector('.product-selection-card[data-product-id="' + prodData.id + '"]');
            if (card) {
                var badge = card.querySelector('.card-combo-summary-badge');
                if (badge) {
                    if (summary) {
                        badge.textContent = '✓ ' + summary;
                        badge.classList.remove('hidden');
                    } else {
                        badge.textContent = '';
                        badge.classList.add('hidden');
                    }
                }
            }
        }

        function renderSingleComboSlots(prodData) {
            var singleSlotsWrap = document.getElementById('single-combo-slots');
            if (!singleSlotsWrap || !prodData || !prodData.is_combo) return;
            var st = ensureComboState(prodData);
            var filledCount = 0;
            var slotNodes = singleSlotsWrap.querySelectorAll('.ps-single-combo-slot');
            slotNodes.forEach(function(node, idx) {
                var slot = st.slots[idx];
                var emptyDiv = node.querySelector('.slot-empty-state');
                var img = node.querySelector('.slot-filled-img');
                var nameSpan = node.querySelector('.slot-filled-name');
                var clearBtn = node.querySelector('.slot-clear-btn');

                if (slot) {
                    filledCount++;
                    node.classList.remove('border-dashed', 'border-amber-400', 'bg-amber-100/50', 'hover:bg-amber-100/80');
                    node.classList.add('border-primary-600', 'bg-white', 'shadow-2xs');
                    if (emptyDiv) emptyDiv.classList.add('hidden');
                    if (img) {
                        img.src = slot.image_url || prodData.main_image || '';
                        img.alt = slot.name;
                        img.classList.remove('hidden');
                    }
                    if (nameSpan) {
                        nameSpan.textContent = slot.name;
                        nameSpan.classList.remove('hidden');
                    }
                    if (clearBtn) clearBtn.classList.remove('hidden');
                } else {
                    node.classList.add('border-dashed', 'border-amber-400', 'bg-amber-100/50', 'hover:bg-amber-100/80');
                    node.classList.remove('border-primary-600', 'bg-white', 'shadow-2xs');
                    if (emptyDiv) emptyDiv.classList.remove('hidden');
                    if (img) {
                        img.src = '';
                        img.classList.add('hidden');
                    }
                    if (nameSpan) {
                        nameSpan.textContent = '';
                        nameSpan.classList.add('hidden');
                    }
                    if (clearBtn) clearBtn.classList.add('hidden');
                }
            });

            var countEl = document.getElementById('single-combo-count');
            if (countEl) countEl.textContent = String(filledCount);
            var completeBadge = document.getElementById('single-combo-complete-badge');
            var sizesOk = !(prodData.combo_sizes && prodData.combo_sizes.length > 0) || Boolean(st.selectedSize);
            if (completeBadge) {
                if (filledCount === st.packSize && sizesOk) {
                    completeBadge.classList.remove('hidden');
                } else {
                    completeBadge.classList.add('hidden');
                }
            }
        }

        function getProductData(card) {
            if (!card) return null;
            var script = card.querySelector('.product-json-data');
            if (!script) return null;
            try {
                return JSON.parse(script.textContent);
            } catch (e) {
                return null;
            }
        }

        function scrollToCheckout() {
            var el = document.getElementById('cod-checkout');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }

        function dispatchSelection(item) {
            window.dispatchEvent(new CustomEvent('landing-selection-updated', {
                detail: {
                    mode: mode,
                    selectedItems: [item],
                    total: item.price
                }
            }));
            scrollToCheckout();
        }

        function openColorPickerPopup(prodData, slotIdx, onPicked) {
            if (!ccModal || !ccModalBody) return;
            currentColorPickerContext = { prodData: prodData, slotIndex: slotIdx, onPicked: onPicked };
            var st = ensureComboState(prodData);

            if (ccModalTitle) {
                ccModalTitle.textContent = 'বক্স #' + (slotIdx + 1) + '-এর জন্য কালার সিলেক্ট করুন';
            }
            if (ccModalSubtitle) {
                ccModalSubtitle.textContent = 'যেকোনো ছবির উপর ক্লিক করলে বক্স #' + (slotIdx + 1) + '-এ অ্যাড হয়ে যাবে';
            }

            ccModalBody.innerHTML = '';
            var colors = prodData.combo_colors || [];
            if (colors.length === 0) {
                ccModalBody.className = 'p-6 text-center text-xs text-gray-500';
                ccModalBody.textContent = 'কোনো কালার অপশন পাওয়া যায়নি।';
            } else {
                ccModalBody.className = 'p-5 max-h-[70vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3.5';
                colors.forEach(function(c) {
                    var isActive = st && st.slots[slotIdx] && st.slots[slotIdx].name === c.name;
                    var btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'group flex flex-col items-center rounded-xl border-2 p-2 transition text-left cursor-pointer ' +
                        (isActive ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20' : 'border-gray-200 bg-white hover:border-amber-400 hover:shadow-md');

                    var imgWrap = document.createElement('div');
                    imgWrap.className = 'w-full aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2 border border-gray-100';
                    var img = document.createElement('img');
                    img.src = c.image_url || prodData.main_image || '';
                    img.alt = c.name;
                    img.className = 'w-full h-full object-cover group-hover:scale-105 transition duration-300';
                    imgWrap.appendChild(img);

                    var nameEl = document.createElement('span');
                    nameEl.className = 'text-xs font-bold text-gray-900 truncate w-full text-center';
                    nameEl.textContent = c.name;

                    var subEl = document.createElement('span');
                    subEl.className = 'mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-primary-700';
                    subEl.textContent = '+ সিলেক্ট করুন';

                    btn.appendChild(imgWrap);
                    btn.appendChild(nameEl);
                    btn.appendChild(subEl);

                    btn.addEventListener('click', function() {
                        if (st) {
                            st.slots[slotIdx] = {
                                name: c.name,
                                image_url: c.image_url || prodData.main_image || ''
                            };
                        }
                        ccModal.classList.add('hidden');
                        ccModal.classList.remove('flex');
                        syncCardComboBadge(prodData);
                        renderSingleComboSlots(prodData);
                        if (typeof onPicked === 'function') onPicked();
                    });

                    ccModalBody.appendChild(btn);
                });
            }

            ccModal.classList.remove('hidden');
            ccModal.classList.add('flex');
        }

        if (ccModal) {
            ccModal.addEventListener('click', function(e) {
                if (e.target === ccModal) ccModal.classList.add('hidden'), ccModal.classList.remove('flex');
            });
        }
        if (ccModalClose) {
            ccModalClose.addEventListener('click', function() {
                ccModal.classList.add('hidden'), ccModal.classList.remove('flex');
            });
        }

        if (vModal) {
            vModal.addEventListener('click', function(e) {
                if (e.target === vModal) vModal.classList.add('hidden'), vModal.classList.remove('flex');
            });
        }
        if (vModalClose) {
            vModalClose.addEventListener('click', function() {
                vModal.classList.add('hidden'), vModal.classList.remove('flex');
            });
        }

        if (qvModal) {
            qvModal.addEventListener('click', function(e) {
                if (e.target === qvModal) qvModal.classList.add('hidden'), qvModal.classList.remove('flex');
            });
        }
        if (qvModalClose) {
            qvModalClose.addEventListener('click', function() {
                qvModal.classList.add('hidden'), qvModal.classList.remove('flex');
            });
        }

        function renderComboModalContent(prodData) {
            var st = ensureComboState(prodData);
            if (!st) return;

            var filledCount = st.slots.filter(Boolean).length;
            if (vModalComboError) vModalComboError.classList.add('hidden');
            if (vModalComboProgress) {
                vModalComboProgress.textContent = 'পছন্দের ' + st.packSize + 'টি কালার সিলেক্ট করুন (' + filledCount + '/' + st.packSize + ')';
            }
            if (vModalComboActivePill) {
                vModalComboActivePill.textContent = 'বক্স #' + (vModalActiveSlot + 1) + ' অ্যাক্টিভ';
            }
            if (vModalComboGridLabel) {
                vModalComboGridLabel.textContent = 'বক্স #' + (vModalActiveSlot + 1) + '-এর জন্য নিচের ছবি থেকে কালার সিলেক্ট করুন:';
            }

            // Render `[ + ]` slot boxes
            vModalComboSlots.innerHTML = '';
            st.slots.forEach(function(slot, idx) {
                var isActive = vModalActiveSlot === idx;
                var box = document.createElement('div');
                box.setAttribute('role', 'button');
                box.setAttribute('tabindex', '0');
                box.className = 'relative w-20 h-24 rounded-xl border-2 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden select-none shrink-0 ' +
                    (isActive
                        ? 'border-primary-600 ring-2 ring-primary-500/30 bg-primary-50/40'
                        : (slot ? 'border-gray-300 bg-white' : 'border-dashed border-amber-400 bg-amber-100/60'));

                var badgeNum = document.createElement('span');
                badgeNum.className = 'absolute top-1.5 left-1.5 z-[2] w-4 h-4 rounded-full bg-slate-900/75 text-white text-[9px] font-bold flex items-center justify-center';
                badgeNum.textContent = String(idx + 1);
                box.appendChild(badgeNum);

                if (slot) {
                    var sImg = document.createElement('img');
                    sImg.src = slot.image_url || prodData.main_image || '';
                    sImg.alt = slot.name;
                    sImg.className = 'w-full h-16 object-cover';
                    var sLabel = document.createElement('span');
                    sLabel.className = 'w-full px-1 py-0.5 text-[9px] font-bold text-gray-800 text-center truncate bg-white/95 border-t border-gray-100';
                    sLabel.textContent = slot.name;
                    var xBtn = document.createElement('button');
                    xBtn.type = 'button';
                    xBtn.className = 'absolute top-1.5 right-1.5 z-[2] w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center hover:bg-rose-700 shadow-xs';
                    xBtn.textContent = '×';
                    xBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        st.slots[idx] = null;
                        vModalActiveSlot = idx;
                        syncCardComboBadge(prodData);
                        renderComboModalContent(prodData);
                    });
                    box.appendChild(sImg);
                    box.appendChild(sLabel);
                    box.appendChild(xBtn);
                } else {
                    var emptyWrap = document.createElement('div');
                    emptyWrap.className = 'flex flex-col items-center justify-center gap-1 text-amber-900';
                    emptyWrap.innerHTML = '<span class="text-sm font-bold">+</span><span class="text-[9px] font-bold">কালার দিন</span>';
                    box.appendChild(emptyWrap);
                }

                box.addEventListener('click', function() {
                    vModalActiveSlot = idx;
                    renderComboModalContent(prodData);
                });
                vModalComboSlots.appendChild(box);
            });

            // Render Color Grid
            vModalComboColors.innerHTML = '';
            var colors = prodData.combo_colors || [];
            if (colors.length === 0) {
                vModalComboColors.innerHTML = '<div class="col-span-3 text-xs text-gray-500 text-center py-4 border border-dashed rounded-xl">কোনো কালার কনফিগার করা নেই।</div>';
            } else {
                colors.forEach(function(c) {
                    var isPicked = st.slots[vModalActiveSlot] && st.slots[vModalActiveSlot].name === c.name;
                    var cBtn = document.createElement('button');
                    cBtn.type = 'button';
                    cBtn.className = 'flex flex-col items-center rounded-xl border-2 p-1.5 transition text-left cursor-pointer ' +
                        (isPicked ? 'border-primary-600 bg-primary-50/70 ring-1 ring-primary-500/30' : 'border-gray-200 hover:border-amber-400 bg-white');

                    var imgBox = document.createElement('div');
                    imgBox.className = 'w-full aspect-square rounded-lg overflow-hidden bg-gray-50 mb-1.5 border border-gray-100';
                    var cImg = document.createElement('img');
                    cImg.src = c.image_url || prodData.main_image || '';
                    cImg.alt = c.name;
                    cImg.className = 'w-full h-full object-cover';
                    imgBox.appendChild(cImg);

                    var cName = document.createElement('span');
                    cName.className = 'text-[11px] font-bold text-gray-800 truncate w-full text-center';
                    cName.textContent = c.name;

                    cBtn.appendChild(imgBox);
                    cBtn.appendChild(cName);

                    cBtn.addEventListener('click', function() {
                        st.slots[vModalActiveSlot] = {
                            name: c.name,
                            image_url: c.image_url || prodData.main_image || ''
                        };
                        var nextEmpty = -1;
                        for (var k = vModalActiveSlot + 1; k < st.packSize; k++) {
                            if (!st.slots[k]) { nextEmpty = k; break; }
                        }
                        if (nextEmpty === -1) {
                            for (var k2 = 0; k2 < st.packSize; k2++) {
                                if (!st.slots[k2]) { nextEmpty = k2; break; }
                            }
                        }
                        if (nextEmpty !== -1) vModalActiveSlot = nextEmpty;
                        syncCardComboBadge(prodData);
                        renderComboModalContent(prodData);
                    });

                    vModalComboColors.appendChild(cBtn);
                });
            }

            // Render Sizes
            var sizes = prodData.combo_sizes || [];
            if (sizes.length > 0) {
                vModalComboSizesWrap.classList.remove('hidden');
                if (vModalComboSizeVal) vModalComboSizeVal.textContent = st.selectedSize || '';
                vModalComboSizes.innerHTML = '';
                sizes.forEach(function(sz) {
                    var isSzActive = st.selectedSize === sz;
                    var szBtn = document.createElement('button');
                    szBtn.type = 'button';
                    szBtn.className = 'min-w-[40px] px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ' +
                        (isSzActive ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-primary-500');
                    szBtn.textContent = sz;
                    szBtn.addEventListener('click', function() {
                        st.selectedSize = sz;
                        syncCardComboBadge(prodData);
                        renderComboModalContent(prodData);
                    });
                    vModalComboSizes.appendChild(szBtn);
                });
            } else {
                vModalComboSizesWrap.classList.add('hidden');
            }
        }

        // Open Variant OR Combo Selection Modal
        function openVariantModal(prodData) {
            if (!prodData || !vModal) return;
            currentModalProduct = prodData;

            vModalTitle.textContent = prodData.title;

            if (prodData.is_combo) {
                var st = ensureComboState(prodData);
                var firstEmpty = st.slots.indexOf(null);
                vModalActiveSlot = firstEmpty !== -1 ? firstEmpty : 0;

                if (vModalEyebrow) vModalEyebrow.textContent = st.packSize + ' Pcs Combo Pack Selection';
                if (vModalSelectedName) vModalSelectedName.textContent = 'Select ' + st.packSize + ' colors & size';
                if (vModalPrice) vModalPrice.textContent = '৳' + Math.round(prodData.sale_price).toLocaleString();

                if (prodData.regular_price && prodData.regular_price > prodData.sale_price) {
                    vModalRegPrice.textContent = '৳' + Math.round(prodData.regular_price).toLocaleString();
                    vModalRegPrice.classList.remove('hidden');
                    var pctC = Math.round(((prodData.regular_price - prodData.sale_price) / prodData.regular_price) * 100);
                    vModalDiscount.textContent = pctC + '% OFF';
                    vModalDiscount.classList.remove('hidden');
                } else {
                    vModalRegPrice.classList.add('hidden');
                    vModalDiscount.classList.add('hidden');
                }

                if (prodData.main_image && prodData.main_image.trim() !== '') {
                    vModalImg.src = prodData.main_image;
                    vModalImg.classList.remove('hidden');
                    if (vModalNoImg) vModalNoImg.classList.add('hidden');
                } else {
                    vModalImg.src = '';
                    vModalImg.classList.add('hidden');
                    if (vModalNoImg) vModalNoImg.classList.remove('hidden');
                }

                if (vModalStandardBody) vModalStandardBody.classList.add('hidden');
                if (vModalComboBody) vModalComboBody.classList.remove('hidden');

                renderComboModalContent(prodData);

                vModal.classList.remove('hidden');
                vModal.classList.add('flex');
                return;
            }

            // Standard Variant Selection Modal
            if (vModalEyebrow) vModalEyebrow.textContent = 'Select Variation';
            if (vModalStandardBody) vModalStandardBody.classList.remove('hidden');
            if (vModalComboBody) vModalComboBody.classList.add('hidden');

            var activeVId = activeVariantState[prodData.id] || (prodData.variants[0] ? prodData.variants[0].id : 0);
            var activeVariant = prodData.variants.find(function(v) { return v.id === activeVId; }) || prodData.variants[0];

            function renderVariantDetails(v) {
                activeVariantState[prodData.id] = v.id;
                vModalSelectedName.textContent = 'Selected: ' + v.name;
                vModalPrice.textContent = '৳' + Math.round(v.price).toLocaleString();
                if (v.image && v.image.trim() !== '') {
                    vModalImg.src = v.image;
                    vModalImg.classList.remove('hidden');
                    if (vModalNoImg) vModalNoImg.classList.add('hidden');
                } else {
                    vModalImg.src = '';
                    vModalImg.classList.add('hidden');
                    if (vModalNoImg) vModalNoImg.classList.remove('hidden');
                }

                if (v.regular_price && v.regular_price > v.price) {
                    vModalRegPrice.textContent = '৳' + Math.round(v.regular_price).toLocaleString();
                    vModalRegPrice.classList.remove('hidden');
                    var pct = Math.round(((v.regular_price - v.price) / v.regular_price) * 100);
                    vModalDiscount.textContent = pct + '% OFF';
                    vModalDiscount.classList.remove('hidden');
                } else {
                    vModalRegPrice.classList.add('hidden');
                    vModalDiscount.classList.add('hidden');
                }

                var btns = vModalOptions.querySelectorAll('button');
                btns.forEach(function(b) {
                    var bid = parseInt(b.getAttribute('data-variant-id'), 10);
                    if (bid === v.id) {
                        b.classList.add('border-primary-600', 'bg-primary-50/70', 'ring-2', 'ring-primary-500/20', 'text-primary-950', 'font-bold');
                        b.classList.remove('border-gray-200', 'bg-white', 'text-gray-700');
                    } else {
                        b.classList.remove('border-primary-600', 'bg-primary-50/70', 'ring-2', 'ring-primary-500/20', 'text-primary-950', 'font-bold');
                        b.classList.add('border-gray-200', 'bg-white', 'text-gray-700');
                    }
                });
            }

            vModalOptions.innerHTML = '';
            prodData.variants.forEach(function(v) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.setAttribute('data-variant-id', v.id);
                btn.className = 'p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer border-gray-200 bg-white text-gray-700 hover:border-gray-300';
                btn.innerHTML = '<span class="text-xs truncate">' + v.name + '</span><span class="text-[11px] font-semibold text-primary-700">৳' + Math.round(v.price).toLocaleString() + '</span>';
                btn.addEventListener('click', function() {
                    renderVariantDetails(v);
                });
                vModalOptions.appendChild(btn);
            });

            renderVariantDetails(activeVariant);

            vModal.classList.remove('hidden');
            vModal.classList.add('flex');
        }

        if (vModalConfirmBtn) {
            vModalConfirmBtn.addEventListener('click', function() {
                if (!currentModalProduct) return;

                if (currentModalProduct.is_combo) {
                    var st = ensureComboState(currentModalProduct);
                    var emptyIdx = st.slots.indexOf(null);
                    if (emptyIdx !== -1) {
                        vModalActiveSlot = emptyIdx;
                        renderComboModalContent(currentModalProduct);
                        if (vModalComboError) {
                            vModalComboError.textContent = 'অনুগ্রহ করে কম্বো প্যাকের সবগুলো (' + st.packSize + 'টি) বক্সে কালার সিলেক্ট করুন। (বক্স #' + (emptyIdx + 1) + ' খালি আছে)';
                            vModalComboError.classList.remove('hidden');
                        }
                        return;
                    }
                    if (currentModalProduct.combo_sizes && currentModalProduct.combo_sizes.length > 0 && !st.selectedSize) {
                        if (vModalComboError) {
                            vModalComboError.textContent = 'অনুগ্রহ করে আপনার পছন্দের সাইজ সিলেক্ট করুন।';
                            vModalComboError.classList.remove('hidden');
                        }
                        return;
                    }

                    var vFirst = currentModalProduct.variants && currentModalProduct.variants[0] ? currentModalProduct.variants[0] : null;
                    var summaryStr = buildComboSummary(currentModalProduct);
                    vModal.classList.add('hidden');
                    vModal.classList.remove('flex');

                    dispatchSelection({
                        productId: currentModalProduct.id,
                        variantId: vFirst ? vFirst.id : 0,
                        price: vFirst ? vFirst.price : currentModalProduct.sale_price,
                        title: currentModalProduct.title,
                        image: (st.slots[0] && st.slots[0].image_url) ? st.slots[0].image_url : (currentModalProduct.main_image || ''),
                        quantity: 1,
                        isCombo: true,
                        comboSlots: st.slots,
                        comboSize: st.selectedSize,
                        comboSummary: summaryStr
                    });
                    return;
                }

                var activeVId = activeVariantState[currentModalProduct.id] || (currentModalProduct.variants[0] ? currentModalProduct.variants[0].id : 0);
                var activeVariant = currentModalProduct.variants.find(function(v) { return v.id === activeVId; }) || currentModalProduct.variants[0];

                vModal.classList.add('hidden');
                vModal.classList.remove('flex');

                dispatchSelection({
                    productId: currentModalProduct.id,
                    variantId: activeVariant.id,
                    price: activeVariant.price,
                    title: currentModalProduct.title + ' (' + activeVariant.name + ')',
                    image: activeVariant.image || currentModalProduct.main_image || '',
                    quantity: 1
                });
            });
        }

        function renderQuickViewComboUI(prodData) {
            if (!qvModalComboContainer || !prodData.is_combo) return;
            var st = ensureComboState(prodData);
            if (qvModalComboError) qvModalComboError.classList.add('hidden');
            var filledCount = st.slots.filter(Boolean).length;
            if (qvModalComboTitle) {
                qvModalComboTitle.textContent = 'পছন্দের ' + st.packSize + 'টি কালার সিলেক্ট করুন (' + filledCount + '/' + st.packSize + ')';
            }

            qvModalComboSlots.innerHTML = '';
            st.slots.forEach(function(slot, sIdx) {
                var box = document.createElement('div');
                box.setAttribute('role', 'button');
                box.setAttribute('tabindex', '0');
                box.className = 'relative w-16 h-20 rounded-xl border-2 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden select-none ' +
                    (slot ? 'border-primary-600 bg-white shadow-2xs' : 'border-dashed border-amber-400 bg-amber-100/60 hover:bg-amber-100');

                var num = document.createElement('span');
                num.className = 'absolute top-1 left-1 z-10 w-4 h-4 rounded-full bg-slate-900/75 text-white text-[9px] font-bold flex items-center justify-center';
                num.textContent = String(sIdx + 1);
                box.appendChild(num);

                if (slot) {
                    var sImg = document.createElement('img');
                    sImg.src = slot.image_url || prodData.main_image || '';
                    sImg.alt = slot.name;
                    sImg.className = 'w-full h-14 object-cover';
                    var sName = document.createElement('span');
                    sName.className = 'w-full px-1 py-0.5 text-[9px] font-bold text-gray-800 text-center truncate bg-white/95 border-t border-gray-100';
                    sName.textContent = slot.name;
                    var xBtn = document.createElement('button');
                    xBtn.type = 'button';
                    xBtn.className = 'absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center';
                    xBtn.textContent = '×';
                    xBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        st.slots[sIdx] = null;
                        syncCardComboBadge(prodData);
                        renderSingleComboSlots(prodData);
                        renderQuickViewComboUI(prodData);
                    });
                    box.appendChild(sImg);
                    box.appendChild(sName);
                    box.appendChild(xBtn);
                } else {
                    var plusSpan = document.createElement('span');
                    plusSpan.className = 'text-sm font-bold text-amber-900';
                    plusSpan.textContent = '+';
                    var labelSpan = document.createElement('span');
                    labelSpan.className = 'text-[9px] font-bold text-amber-900';
                    labelSpan.textContent = 'কালার দিন';
                    box.appendChild(plusSpan);
                    box.appendChild(labelSpan);
                }

                box.addEventListener('click', function() {
                    openColorPickerPopup(prodData, sIdx, function() {
                        renderQuickViewComboUI(prodData);
                    });
                });
                qvModalComboSlots.appendChild(box);
            });

            var sizes = prodData.combo_sizes || [];
            if (sizes.length > 0 && qvModalComboSizesWrap && qvModalComboSizes) {
                qvModalComboSizesWrap.classList.remove('hidden');
                if (qvModalComboSizeVal) qvModalComboSizeVal.textContent = st.selectedSize || '';
                qvModalComboSizes.innerHTML = '';
                sizes.forEach(function(sz) {
                    var isSel = st.selectedSize === sz;
                    var btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'min-w-[40px] px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ' +
                        (isSel ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-primary-500');
                    btn.textContent = sz;
                    btn.addEventListener('click', function() {
                        st.selectedSize = sz;
                        syncCardComboBadge(prodData);
                        renderSingleComboSlots(prodData);
                        renderQuickViewComboUI(prodData);
                    });
                    qvModalComboSizes.appendChild(btn);
                });
            } else if (qvModalComboSizesWrap) {
                qvModalComboSizesWrap.classList.add('hidden');
            }
        }

        // Open Quick View Modal
        function openQuickViewModal(prodData) {
            if (!prodData || !qvModal) return;
            currentModalProduct = prodData;

            qvModalTitle.textContent = prodData.title;
            qvModalDesc.textContent = prodData.description || 'Verified authentic item with nationwide Cash on Delivery and inspection guarantee.';

            var activeVId = activeVariantState[prodData.id] || (prodData.variants && prodData.variants[0] ? prodData.variants[0].id : 0);
            var activeVariant = prodData.variants ? prodData.variants.find(function(v) { return v.id === activeVId; }) || prodData.variants[0] : null;

            var currentPrice = activeVariant ? activeVariant.price : prodData.sale_price;
            var regPrice = activeVariant ? activeVariant.regular_price : prodData.regular_price;

            qvModalPrice.textContent = '৳' + Math.round(currentPrice).toLocaleString();
            if (regPrice && regPrice > currentPrice) {
                qvModalRegPrice.textContent = '৳' + Math.round(regPrice).toLocaleString();
                qvModalRegPrice.classList.remove('hidden');
                var pct = Math.round(((regPrice - currentPrice) / regPrice) * 100);
                qvModalDiscount.textContent = 'SAVE ' + pct + '%';
                qvModalDiscount.classList.remove('hidden');
            } else {
                qvModalRegPrice.classList.add('hidden');
                qvModalDiscount.classList.add('hidden');
            }

            var mainImg = (activeVariant && activeVariant.image) ? activeVariant.image : prodData.main_image;
            if (mainImg && mainImg.trim() !== '') {
                qvModalMainImg.src = mainImg;
                qvModalMainImg.classList.remove('hidden');
                if (qvModalNoImg) qvModalNoImg.classList.add('hidden');
            } else {
                qvModalMainImg.src = '';
                qvModalMainImg.classList.add('hidden');
                if (qvModalNoImg) qvModalNoImg.classList.remove('hidden');
            }

            // Gallery Thumbnails
            qvModalGalleryStrip.innerHTML = '';
            if (prodData.gallery && prodData.gallery.length > 1) {
                qvModalGalleryStrip.classList.remove('hidden');
                prodData.gallery.forEach(function(gUrl) {
                    var thumbBtn = document.createElement('button');
                    thumbBtn.type = 'button';
                    thumbBtn.className = 'w-14 h-14 rounded-lg overflow-hidden border shrink-0 transition cursor-pointer ' + (gUrl === mainImg ? 'border-primary-600 ring-2 ring-primary-500/30' : 'border-gray-200 hover:border-gray-400 opacity-80');
                    thumbBtn.innerHTML = '<img src="' + gUrl + '" class="w-full h-full object-cover" onerror="this.style.display=\'none\';" />';
                    thumbBtn.addEventListener('click', function() {
                        if (gUrl && gUrl.trim() !== '') {
                            qvModalMainImg.src = gUrl;
                            qvModalMainImg.classList.remove('hidden');
                            if (qvModalNoImg) qvModalNoImg.classList.add('hidden');
                        } else {
                            qvModalMainImg.src = '';
                            qvModalMainImg.classList.add('hidden');
                            if (qvModalNoImg) qvModalNoImg.classList.remove('hidden');
                        }
                        qvModalGalleryStrip.querySelectorAll('button').forEach(function(b) {
                            b.className = 'w-14 h-14 rounded-lg overflow-hidden border shrink-0 transition cursor-pointer border-gray-200 hover:border-gray-400 opacity-80';
                        });
                        thumbBtn.className = 'w-14 h-14 rounded-lg overflow-hidden border shrink-0 transition cursor-pointer border-primary-600 ring-2 ring-primary-500/30';
                    });
                    qvModalGalleryStrip.appendChild(thumbBtn);
                });
            } else {
                qvModalGalleryStrip.classList.add('hidden');
            }

            if (prodData.is_combo) {
                qvModalVariantsContainer.classList.add('hidden');
                if (qvModalComboContainer) {
                    qvModalComboContainer.classList.remove('hidden');
                    renderQuickViewComboUI(prodData);
                }
            } else {
                if (qvModalComboContainer) qvModalComboContainer.classList.add('hidden');
                if (prodData.variants && prodData.variants.length > 1) {
                    qvModalVariantsContainer.classList.remove('hidden');
                    qvModalVariantsList.innerHTML = '';
                    prodData.variants.forEach(function(v) {
                        var vBtn = document.createElement('button');
                        vBtn.type = 'button';
                        vBtn.className = 'px-3 py-1.5 text-xs rounded-lg border font-medium transition cursor-pointer ' + (v.id === activeVariant.id ? 'bg-primary-600 border-primary-600 text-white font-bold' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50');
                        vBtn.innerText = v.name;
                        vBtn.addEventListener('click', function() {
                            activeVariantState[prodData.id] = v.id;
                            qvModalPrice.innerText = '৳' + Math.round(v.price).toLocaleString();
                            var chosenImg = (v.image && v.image.trim() !== '') ? v.image : (prodData.main_image && prodData.main_image.trim() !== '' ? prodData.main_image : '');
                            if (chosenImg) {
                                qvModalMainImg.src = chosenImg;
                                qvModalMainImg.classList.remove('hidden');
                                if (qvModalNoImg) qvModalNoImg.classList.add('hidden');
                            } else {
                                qvModalMainImg.src = '';
                                qvModalMainImg.classList.add('hidden');
                                if (qvModalNoImg) qvModalNoImg.classList.remove('hidden');
                            }

                            qvModalVariantsList.querySelectorAll('button').forEach(function(b) {
                                b.className = 'px-3 py-1.5 text-xs rounded-lg border font-medium transition cursor-pointer bg-white border-gray-200 text-gray-700 hover:bg-gray-50';
                            });
                            vBtn.className = 'px-3 py-1.5 text-xs rounded-lg border font-medium transition cursor-pointer bg-primary-600 border-primary-600 text-white font-bold';
                        });
                        qvModalVariantsList.appendChild(vBtn);
                    });
                } else {
                    qvModalVariantsContainer.classList.add('hidden');
                }
            }

            qvModal.classList.remove('hidden');
            qvModal.classList.add('flex');
        }

        if (qvModalOrderBtn) {
            qvModalOrderBtn.addEventListener('click', function() {
                if (!currentModalProduct) return;

                if (currentModalProduct.is_combo) {
                    var st = ensureComboState(currentModalProduct);
                    var emptyIdx = st.slots.indexOf(null);
                    if (emptyIdx !== -1) {
                        if (qvModalComboError) {
                            qvModalComboError.textContent = 'অনুগ্রহ করে কম্বো প্যাকের সবগুলো (' + st.packSize + 'টি) বক্সে কালার সিলেক্ট করুন।';
                            qvModalComboError.classList.remove('hidden');
                        }
                        openColorPickerPopup(currentModalProduct, emptyIdx, function() {
                            renderQuickViewComboUI(currentModalProduct);
                        });
                        return;
                    }
                    if (currentModalProduct.combo_sizes && currentModalProduct.combo_sizes.length > 0 && !st.selectedSize) {
                        if (qvModalComboError) {
                            qvModalComboError.textContent = 'অনুগ্রহ করে আপনার পছন্দের সাইজ সিলেক্ট করুন।';
                            qvModalComboError.classList.remove('hidden');
                        }
                        return;
                    }
                    var vFirst = currentModalProduct.variants && currentModalProduct.variants[0] ? currentModalProduct.variants[0] : null;
                    var summaryStr = buildComboSummary(currentModalProduct);
                    qvModal.classList.add('hidden');
                    qvModal.classList.remove('flex');

                    dispatchSelection({
                        productId: currentModalProduct.id,
                        variantId: vFirst ? vFirst.id : 0,
                        price: vFirst ? vFirst.price : currentModalProduct.sale_price,
                        title: currentModalProduct.title,
                        image: (st.slots[0] && st.slots[0].image_url) ? st.slots[0].image_url : (currentModalProduct.main_image || ''),
                        quantity: 1,
                        isCombo: true,
                        comboSlots: st.slots,
                        comboSize: st.selectedSize,
                        comboSummary: summaryStr
                    });
                    return;
                }

                var activeVId = activeVariantState[currentModalProduct.id] || (currentModalProduct.variants && currentModalProduct.variants[0] ? currentModalProduct.variants[0].id : 0);
                var activeVariant = currentModalProduct.variants ? currentModalProduct.variants.find(function(v) { return v.id === activeVId; }) || currentModalProduct.variants[0] : null;

                qvModal.classList.add('hidden');
                qvModal.classList.remove('flex');

                dispatchSelection({
                    productId: currentModalProduct.id,
                    variantId: activeVariant ? activeVariant.id : 0,
                    price: activeVariant ? activeVariant.price : currentModalProduct.sale_price,
                    title: currentModalProduct.title + (activeVariant ? ' (' + activeVariant.name + ')' : ''),
                    image: (activeVariant && activeVariant.image) ? activeVariant.image : (currentModalProduct.main_image || ''),
                    quantity: 1
                });
            });
        }

        // Quick View click listeners
        var qvBtns = section.querySelectorAll('.quick-view-trigger-btn');
        qvBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var card = btn.closest('.product-selection-card') || document.getElementById('single-product-showcase');
                var data = getProductData(card);
                if (data) {
                    openQuickViewModal(data);
                }
            });
        });

        // Order button click listeners
        var orderBtns = section.querySelectorAll('.card-order-btn');
        orderBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                var card = btn.closest('.product-selection-card');
                var data = getProductData(card);
                if (!data) return;

                if (data.is_combo) {
                    openVariantModal(data);
                } else if (data.has_variants && data.variants && data.variants.length > 1) {
                    openVariantModal(data);
                } else {
                    var vId = data.variants && data.variants[0] ? data.variants[0].id : 0;
                    var vPrice = data.variants && data.variants[0] ? data.variants[0].price : data.sale_price;
                    var vImg = (data.variants && data.variants[0] && data.variants[0].image) ? data.variants[0].image : (data.main_image || '');
                    dispatchSelection({
                        productId: data.id,
                        variantId: vId,
                        price: vPrice,
                        title: data.title,
                        image: vImg,
                        quantity: 1
                    });
                }
            });
        });

        // Single product showcase setup (variants + combo boxes)
        var singleShowcase = document.getElementById('single-product-showcase');
        var singleData = getProductData(singleShowcase);

        if (singleShowcase && singleData && singleData.is_combo) {
            ensureComboState(singleData);
            var singleSlotBtns = singleShowcase.querySelectorAll('.ps-single-combo-slot');
            singleSlotBtns.forEach(function(slotBtn) {
                var idx = parseInt(slotBtn.getAttribute('data-slot-index') || '0', 10);
                slotBtn.addEventListener('click', function(e) {
                    if (e.target && e.target.closest('.slot-clear-btn')) return;
                    var errEl = document.getElementById('single-combo-error');
                    if (errEl) errEl.classList.add('hidden');
                    openColorPickerPopup(singleData, idx, function() {
                        renderSingleComboSlots(singleData);
                    });
                });
            });

            var singleClearBtns = singleShowcase.querySelectorAll('.slot-clear-btn');
            singleClearBtns.forEach(function(cBtn) {
                var idx = parseInt(cBtn.getAttribute('data-slot-index') || '0', 10);
                cBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var st = ensureComboState(singleData);
                    st.slots[idx] = null;
                    renderSingleComboSlots(singleData);
                });
            });

            var singleComboSizeBtns = singleShowcase.querySelectorAll('.single-combo-size-btn');
            singleComboSizeBtns.forEach(function(szBtn) {
                szBtn.addEventListener('click', function() {
                    var szVal = szBtn.getAttribute('data-size') || '';
                    var st = ensureComboState(singleData);
                    st.selectedSize = szVal;
                    var lbl = document.getElementById('single-combo-size-label');
                    if (lbl) lbl.textContent = szVal;
                    var errEl = document.getElementById('single-combo-error');
                    if (errEl) errEl.classList.add('hidden');
                    singleComboSizeBtns.forEach(function(b) {
                        b.classList.remove('bg-primary-600', 'text-white', 'border-primary-600', 'shadow-xs');
                        b.classList.add('bg-white', 'text-gray-800', 'border-gray-200');
                    });
                    szBtn.classList.add('bg-primary-600', 'text-white', 'border-primary-600', 'shadow-xs');
                    szBtn.classList.remove('bg-white', 'text-gray-800', 'border-gray-200');
                    renderSingleComboSlots(singleData);
                });
            });
        }

        // Single product showcase variant buttons
        var singleVariantBtns = section.querySelectorAll('.single-variant-btn');
        if (singleShowcase && singleVariantBtns.length > 0) {
            singleVariantBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var vid = parseInt(btn.getAttribute('data-variant-id'), 10);
                    var vPrice = parseFloat(btn.getAttribute('data-price') || '0');
                    var vImg = btn.getAttribute('data-image');

                    singleShowcase.setAttribute('data-variant-id', vid);
                    singleShowcase.setAttribute('data-price', vPrice);

                    singleVariantBtns.forEach(function(b) {
                        b.classList.remove('border-primary-600', 'bg-primary-50', 'text-primary-900', 'ring-2', 'ring-primary-500', 'font-bold');
                        b.classList.add('border-gray-200', 'bg-white', 'text-gray-700');
                    });
                    btn.classList.add('border-primary-600', 'bg-primary-50', 'text-primary-900', 'ring-2', 'ring-primary-500', 'font-bold');
                    btn.classList.remove('border-gray-200', 'bg-white', 'text-gray-700');

                    var priceEl = document.getElementById('single-product-price');
                    if (priceEl) priceEl.innerText = '৳' + Math.round(vPrice).toLocaleString();

                    var imgEl = document.getElementById('single-product-main-img');
                    if (imgEl) {
                        if (vImg && vImg.trim() !== '') {
                            imgEl.src = vImg;
                            imgEl.classList.remove('hidden');
                            if (imgEl.nextElementSibling) imgEl.nextElementSibling.classList.add('hidden');
                        } else {
                            imgEl.src = '';
                            imgEl.classList.add('hidden');
                            if (imgEl.nextElementSibling) imgEl.nextElementSibling.classList.remove('hidden');
                        }
                    }
                });
            });
        }

        var singleOrderBtn = document.getElementById('single-product-order-btn');
        if (singleOrderBtn && singleShowcase) {
            singleOrderBtn.addEventListener('click', function() {
                var pId = parseInt(singleShowcase.getAttribute('data-product-id'), 10);
                var vId = parseInt(singleShowcase.getAttribute('data-variant-id') || '0', 10);
                var vPrice = parseFloat(singleShowcase.getAttribute('data-price') || '0');
                var vTitle = singleShowcase.getAttribute('data-title') || 'Product';
                var singleMainImg = document.getElementById('single-product-main-img');
                var vImg = (singleMainImg && !singleMainImg.classList.contains('hidden')) ? (singleMainImg.getAttribute('src') || '') : '';

                if (singleData && singleData.is_combo) {
                    var st = ensureComboState(singleData);
                    var emptyIdx = st.slots.indexOf(null);
                    var errEl = document.getElementById('single-combo-error');
                    if (emptyIdx !== -1) {
                        if (errEl) {
                            errEl.textContent = 'অনুগ্রহ করে কম্বো প্যাকের সবগুলো (' + st.packSize + 'টি) বক্সে কালার সিলেক্ট করুন।';
                            errEl.classList.remove('hidden');
                        }
                        openColorPickerPopup(singleData, emptyIdx, function() {
                            if (errEl) errEl.classList.add('hidden');
                            renderSingleComboSlots(singleData);
                        });
                        return;
                    }
                    if (singleData.combo_sizes && singleData.combo_sizes.length > 0 && !st.selectedSize) {
                        if (errEl) {
                            errEl.textContent = 'অনুগ্রহ করে নিচের অপশন থেকে আপনার সাইজ সিলেক্ট করুন।';
                            errEl.classList.remove('hidden');
                        }
                        return;
                    }

                    dispatchSelection({
                        productId: pId,
                        variantId: vId,
                        price: vPrice,
                        title: vTitle,
                        image: (st.slots[0] && st.slots[0].image_url) ? st.slots[0].image_url : vImg,
                        quantity: 1,
                        isCombo: true,
                        comboSlots: st.slots,
                        comboSize: st.selectedSize,
                        comboSummary: buildComboSummary(singleData)
                    });
                    return;
                }

                dispatchSelection({
                    productId: pId,
                    variantId: vId,
                    price: vPrice,
                    title: vTitle,
                    image: vImg,
                    quantity: 1
                });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductSelector);
    } else {
        initProductSelector();
    }
})();
</script>
