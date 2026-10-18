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
@endphp

<section {!! $styleAttribute !!} class="w-full py-12 bg-white border-b border-gray-100" id="product-selection-section" data-selection-mode="{{ $mode }}">
    <div class="max-w-5xl mx-auto px-4 sm:px-6">
        @if($hasMultiple)
            {{-- Multi-Product Selector Mode --}}
            <div class="mb-8 text-center">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-50 text-primary-700 mb-2">
                    Featured Collection
                </span>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900">
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
                        $imgUrl = $firstVariant?->images?->first()?->url ?? ($item->primaryImage?->url ?? ($item->images->first()?->url ?? null));

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
                        if (empty($galleryUrls) && $imgUrl) {
                            $galleryUrls[] = $imgUrl;
                        }

                        $hasVariants = $item->variants && $item->variants->count() > 1;

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

                    {{-- Traditional E-commerce Product Card (No Radio/Checkbox, Equal Height) --}}
                    <div class="product-selection-card group/card relative flex flex-col justify-between rounded-2xl border border-gray-200 transition-all p-4 bg-white shadow-xs hover:shadow-lg hover:border-primary-500 h-full"
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
                            <div class="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-3 flex items-center justify-center group/img">
                                @if($imgUrl)
                                    <img src="{{ e($imgUrl) }}" alt="{{ e($item->title) }}" class="selector-card-img w-full h-full object-cover transition duration-500 group-hover/img:scale-105" />
                                @else
                                    <div class="text-gray-400 text-xs flex flex-col items-center">
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

                                @if($hasVariants)
                                    <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/75 text-white text-[9px] font-bold backdrop-blur-xs flex items-center space-x-1">
                                        <svg class="w-3 h-3 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                                        <span>{{ $item->variants->count() }} Options</span>
                                    </div>
                                @endif
                            </div>

                            {{-- Title & Pricing --}}
                            <div>
                                <h3 class="text-sm font-bold text-gray-900 line-clamp-2 min-h-[2.5rem] mb-1.5 leading-snug" title="{{ e($item->title) }}">
                                    {{ $item->title }}
                                </h3>

                                @if($showPrice)
                                    <div class="flex items-baseline space-x-2 mb-2">
                                        <span class="selector-card-price text-base font-extrabold text-primary-600">
                                            ৳{{ number_format($itemEffectivePrice, 0) }}
                                        </span>
                                        @if($hasDiscount)
                                            <span class="selector-card-regprice text-xs text-gray-400 line-through">
                                                ৳{{ number_format($itemRegPrice, 0) }}
                                            </span>
                                        @endif
                                    </div>
                                @endif

                                @if($showDescription && $item->description)
                                    <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">
                                        {{ $item->description }}
                                    </p>
                                @endif
                            </div>
                        </div>

                        {{-- Order Now Button on Each Card (Anchored to bottom) --}}
                        <div class="mt-auto pt-3 border-t border-gray-100">
                            <button type="button"
                                class="card-order-btn w-full py-2.5 px-4 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                                data-product-id="{{ $item->id }}"
                                data-has-variants="{{ $hasVariants ? '1' : '0' }}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                                <span>{{ $orderButtonText }}</span>
                            </button>
                        </div>
                    </div>
                @endforeach
            </div>

            {{-- Summary & Call to Action Bar --}}
            <div class="mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="text-xs text-gray-600">
                    <span class="font-bold text-gray-900">{{ $products->count() }} Products</span> available in this section.
                </div>
                <a href="#cod-checkout" class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-xs transition text-center">
                    Proceed to Cash on Delivery Checkout
                </a>
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
                $singleImg = $firstVar?->images?->first()?->url ?? ($product->primaryImage?->url ?? ($product->images->first()?->url ?? null));
                $singleBadge = $productBadges[$product->id] ?? $badgeText;
                $hasVariants = $product->variants && $product->variants->count() > 1;

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
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 sm:p-8" id="single-product-showcase" data-product-id="{{ $product->id }}" data-variant-id="{{ $firstVarId }}" data-price="{{ $effPrice }}" data-title="{{ e($product->title) }}">
                <script type="application/json" class="product-json-data">
                    {!! json_encode($singleJsonData, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) !!}
                </script>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <div class="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center relative group/single">
                            @if($singleImg)
                                <img src="{{ e($singleImg) }}" alt="{{ e($product->title) }}" id="single-product-main-img" class="w-full h-full object-cover" />
                            @else
                                <span class="text-gray-400">No Image Available</span>
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
                        <div class="flex items-center space-x-2 mb-2">
                            @if(!empty($singleBadge))
                                <span class="px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-md bg-amber-500 text-white">
                                    🔥 {{ $singleBadge }}
                                </span>
                            @endif
                            @if($showDiscountBadge && $hasDisc)
                                <span class="px-2.5 py-0.5 text-xs font-bold rounded-md bg-rose-100 text-rose-700">
                                    {{ $discPct }}% OFF
                                </span>
                            @endif
                        </div>

                        <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                            {{ $product->title }}
                        </h2>

                        @if($showPrice)
                            <div class="flex items-baseline space-x-3 mb-4">
                                <span id="single-product-price" class="text-3xl font-black text-primary-600">
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
                            <p class="text-sm text-gray-600 leading-relaxed mb-6">
                                {{ $product->description }}
                            </p>
                        @endif

                        @if($product->variants && $product->variants->count() > 1)
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
                            class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-600/20 transition cursor-pointer">
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

    {{-- Shared Modal 1: Variant Selection Modal --}}
    <div id="ps-variant-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100" onclick="event.stopPropagation()">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-primary-700 block">Select Variation</span>
                    <h4 id="ps-vmodal-title" class="text-sm font-bold text-gray-900 truncate max-w-[280px]">Product Title</h4>
                </div>
                <button type="button" id="ps-vmodal-close-btn" class="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="p-5 space-y-4">
                <div class="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div class="w-14 h-14 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        <img id="ps-vmodal-img" src="" alt="Variant" class="w-full h-full object-cover" />
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

                <div>
                    <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        ভ্যারিয়েন্ট বাছাই করুন (Choose Option):
                    </label>
                    <div id="ps-vmodal-options" class="grid grid-cols-2 gap-2">
                        {{-- Populated dynamically --}}
                    </div>
                </div>

                <div class="pt-2">
                    <button type="button" id="ps-vmodal-confirm-btn" class="w-full py-3 px-4 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer">
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
                    <div class="aspect-square rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center mb-3">
                        <img id="ps-qvmodal-main-img" src="" alt="Main Product Preview" class="w-full h-full object-cover" />
                    </div>
                    <div id="ps-qvmodal-gallery-strip" class="flex items-center gap-2 overflow-x-auto pb-1">
                        {{-- Populated dynamically --}}
                    </div>
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
                        <div id="ps-qvmodal-variants-list" class="flex flex-wrap gap-1.5">
                            {{-- Populated dynamically --}}
                        </div>
                    </div>

                    <div id="ps-qvmodal-desc-container" class="pt-2 border-t border-gray-100">
                        <span class="text-xs font-bold text-gray-700 block mb-1">Product Description:</span>
                        <p id="ps-qvmodal-desc" class="text-xs text-gray-600 leading-relaxed max-h-36 overflow-y-auto pr-1">
                            Description text...
                        </p>
                    </div>

                    <div class="pt-3">
                        <button type="button" id="ps-qvmodal-order-btn" class="w-full py-3 px-4 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                            <span>{{ $orderButtonText }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<script>
(function() {
    function initProductSelector() {
        var section = document.getElementById('product-selection-section');
        if (!section) return;

        var mode = section.getAttribute('data-selection-mode') || 'single';
        var cards = section.querySelectorAll('.product-selection-card');
        var checkoutSection = document.getElementById('cod-checkout');

        // Modal Elements
        var vModal = document.getElementById('ps-variant-modal');
        var vModalClose = document.getElementById('ps-vmodal-close-btn');
        var vModalTitle = document.getElementById('ps-vmodal-title');
        var vModalImg = document.getElementById('ps-vmodal-img');
        var vModalSelectedName = document.getElementById('ps-vmodal-selected-name');
        var vModalPrice = document.getElementById('ps-vmodal-price');
        var vModalRegPrice = document.getElementById('ps-vmodal-regprice');
        var vModalDiscount = document.getElementById('ps-vmodal-discount');
        var vModalOptions = document.getElementById('ps-vmodal-options');
        var vModalConfirmBtn = document.getElementById('ps-vmodal-confirm-btn');

        var qvModal = document.getElementById('ps-quickview-modal');
        var qvModalClose = document.getElementById('ps-qvmodal-close-btn');
        var qvModalTitle = document.getElementById('ps-qvmodal-title');
        var qvModalMainImg = document.getElementById('ps-qvmodal-main-img');
        var qvModalGalleryStrip = document.getElementById('ps-qvmodal-gallery-strip');
        var qvModalPrice = document.getElementById('ps-qvmodal-price');
        var qvModalRegPrice = document.getElementById('ps-qvmodal-regprice');
        var qvModalDiscount = document.getElementById('ps-qvmodal-discount');
        var qvModalVariantsContainer = document.getElementById('ps-qvmodal-variants-container');
        var qvModalVariantsList = document.getElementById('ps-qvmodal-variants-list');
        var qvModalDesc = document.getElementById('ps-qvmodal-desc');
        var qvModalOrderBtn = document.getElementById('ps-qvmodal-order-btn');

        var activeVariantState = {};
        var currentModalProduct = null;

        // Parse product JSON for a card
        function getProductData(card) {
            if (!card) return null;
            var script = card.querySelector('.product-json-data');
            if (!script) return null;
            try {
                return JSON.parse(script.textContent);
            } catch(e) {
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

        // Close modals on backdrop click
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

        // Open Variant Selection Modal
        function openVariantModal(prodData) {
            if (!prodData || !vModal) return;
            currentModalProduct = prodData;

            vModalTitle.innerText = prodData.title;

            var activeVId = activeVariantState[prodData.id] || (prodData.variants[0] ? prodData.variants[0].id : 0);
            var activeVariant = prodData.variants.find(function(v) { return v.id === activeVId; }) || prodData.variants[0];

            function renderVariantDetails(v) {
                activeVariantState[prodData.id] = v.id;
                vModalSelectedName.innerText = 'Selected: ' + v.name;
                vModalPrice.innerText = '৳' + Math.round(v.price).toLocaleString();
                if (v.image) vModalImg.src = v.image;

                if (v.regular_price && v.regular_price > v.price) {
                    vModalRegPrice.innerText = '৳' + Math.round(v.regular_price).toLocaleString();
                    vModalRegPrice.classList.remove('hidden');
                    var pct = Math.round(((v.regular_price - v.price) / v.regular_price) * 100);
                    vModalDiscount.innerText = pct + '% OFF';
                    vModalDiscount.classList.remove('hidden');
                } else {
                    vModalRegPrice.classList.add('hidden');
                    vModalDiscount.classList.add('hidden');
                }

                // Update active state in buttons
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
                var activeVId = activeVariantState[currentModalProduct.id] || (currentModalProduct.variants[0] ? currentModalProduct.variants[0].id : 0);
                var activeVariant = currentModalProduct.variants.find(function(v) { return v.id === activeVId; }) || currentModalProduct.variants[0];

                vModal.classList.add('hidden');
                vModal.classList.remove('flex');

                dispatchSelection({
                    productId: currentModalProduct.id,
                    variantId: activeVariant.id,
                    price: activeVariant.price,
                    title: currentModalProduct.title + ' (' + activeVariant.name + ')',
                    quantity: 1
                });
            });
        }

        // Open Quick View Modal
        function openQuickViewModal(prodData) {
            if (!prodData || !qvModal) return;
            currentModalProduct = prodData;

            qvModalTitle.innerText = prodData.title;
            qvModalDesc.innerText = prodData.description || 'Verified authentic item with nationwide Cash on Delivery and inspection guarantee.';

            var activeVId = activeVariantState[prodData.id] || (prodData.variants && prodData.variants[0] ? prodData.variants[0].id : 0);
            var activeVariant = prodData.variants ? prodData.variants.find(function(v) { return v.id === activeVId; }) || prodData.variants[0] : null;

            var currentPrice = activeVariant ? activeVariant.price : prodData.sale_price;
            var regPrice = activeVariant ? activeVariant.regular_price : prodData.regular_price;

            qvModalPrice.innerText = '৳' + Math.round(currentPrice).toLocaleString();
            if (regPrice && regPrice > currentPrice) {
                qvModalRegPrice.innerText = '৳' + Math.round(regPrice).toLocaleString();
                qvModalRegPrice.classList.remove('hidden');
                var pct = Math.round(((regPrice - currentPrice) / regPrice) * 100);
                qvModalDiscount.innerText = 'SAVE ' + pct + '%';
                qvModalDiscount.classList.remove('hidden');
            } else {
                qvModalRegPrice.classList.add('hidden');
                qvModalDiscount.classList.add('hidden');
            }

            var mainImg = (activeVariant && activeVariant.image) ? activeVariant.image : prodData.main_image;
            qvModalMainImg.src = mainImg || '';

            // Gallery Thumbnails
            qvModalGalleryStrip.innerHTML = '';
            if (prodData.gallery && prodData.gallery.length > 1) {
                qvModalGalleryStrip.classList.remove('hidden');
                prodData.gallery.forEach(function(gUrl) {
                    var thumbBtn = document.createElement('button');
                    thumbBtn.type = 'button';
                    thumbBtn.className = 'w-14 h-14 rounded-lg overflow-hidden border shrink-0 transition cursor-pointer ' + (gUrl === mainImg ? 'border-primary-600 ring-2 ring-primary-500/30' : 'border-gray-200 hover:border-gray-400 opacity-80');
                    thumbBtn.innerHTML = '<img src="' + gUrl + '" class="w-full h-full object-cover" />';
                    thumbBtn.addEventListener('click', function() {
                        qvModalMainImg.src = gUrl;
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

            // Variant swatches in quick view
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
                        if (v.image) qvModalMainImg.src = v.image;

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

            qvModal.classList.remove('hidden');
            qvModal.classList.add('flex');
        }

        if (qvModalOrderBtn) {
            qvModalOrderBtn.addEventListener('click', function() {
                if (!currentModalProduct) return;
                var activeVId = activeVariantState[currentModalProduct.id] || (currentModalProduct.variants && currentModalProduct.variants[0] ? currentModalProduct.variants[0].id : 0);
                var activeVariant = currentModalProduct.variants ? currentModalProduct.variants.find(function(v) { return v.id === activeVId; }) || currentModalProduct.variants[0] : null;

                qvModal.classList.add('hidden');
                qvModal.classList.remove('flex');

                dispatchSelection({
                    productId: currentModalProduct.id,
                    variantId: activeVariant ? activeVariant.id : 0,
                    price: activeVariant ? activeVariant.price : currentModalProduct.sale_price,
                    title: currentModalProduct.title + (activeVariant ? ' (' + activeVariant.name + ')' : ''),
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

                if (data.has_variants && data.variants && data.variants.length > 1) {
                    openVariantModal(data);
                } else {
                    var vId = data.variants && data.variants[0] ? data.variants[0].id : 0;
                    var vPrice = data.variants && data.variants[0] ? data.variants[0].price : data.sale_price;
                    dispatchSelection({
                        productId: data.id,
                        variantId: vId,
                        price: vPrice,
                        title: data.title,
                        quantity: 1
                    });
                }
            });
        });

        // Single product showcase variant buttons
        var singleVariantBtns = section.querySelectorAll('.single-variant-btn');
        var singleShowcase = document.getElementById('single-product-showcase');
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
                    if (imgEl && vImg) imgEl.src = vImg;
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

                dispatchSelection({
                    productId: pId,
                    variantId: vId,
                    price: vPrice,
                    title: vTitle,
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
