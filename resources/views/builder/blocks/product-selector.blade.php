@php
    $showDescription = $props['showDescription'] ?? true;
    $showPrice = $props['showPrice'] ?? true;
    $showDiscountBadge = $props['showDiscountBadge'] ?? true;
    $badgeText = $props['badgeText'] ?? 'Most Popular';
    $productBadges = $props['productBadges'] ?? [];
    $orderButtonText = $props['orderButtonText'] ?? 'অর্ডার করুন — ক্যাশ অন ডেলিভারি';
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
                    @if($mode === 'multiple')
                        Choose Products (Order Together & Save)
                    @else
                        Choose Any 1 Option
                    @endif
                </span>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    @if($mode === 'multiple')
                        Select The Products You Wish To Order
                    @else
                        Select Your Preferred Product Option
                    @endif
                </h2>
                <p class="text-sm text-gray-500 mt-1 max-w-xl mx-auto">
                    @if($mode === 'multiple')
                        Check the items you want delivered. You can select one or multiple products.
                    @else
                        Select one option below to proceed with Cash on Delivery.
                    @endif
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                        // Determine initial checked state based on defaultSelection
                        if ($defaultSelection === 'all') {
                            $isChecked = true;
                        } elseif ($defaultSelection === 'specific' && $defaultSelectedId > 0) {
                            $isChecked = ($item->id === $defaultSelectedId);
                        } else {
                            $isChecked = ($index === 0);
                        }
                    @endphp
                    <div class="product-selection-card relative flex flex-col justify-between rounded-2xl border-2 transition-all p-5 bg-white shadow-sm hover:shadow-md {{ $isChecked ? 'border-primary-600 ring-2 ring-primary-500/20 bg-primary-50/10' : 'border-gray-200' }}"
                        data-product-id="{{ $item->id }}"
                        data-variant-id="{{ $firstVariantId }}"
                        data-price="{{ $itemEffectivePrice }}"
                        data-title="{{ e($item->title) }}">
                        
                        <div>
                            {{-- Top Bar: Checkbox/Radio + Badges --}}
                            <div class="flex items-center justify-between mb-3">
                                <label class="flex items-center space-x-2.5 cursor-pointer">
                                    @if($mode === 'multiple')
                                        <input type="checkbox"
                                            name="selected_products_picker[]"
                                            value="{{ $item->id }}"
                                            data-variant-id="{{ $firstVariantId }}"
                                            data-price="{{ $itemEffectivePrice }}"
                                            data-title="{{ e($item->title) }}"
                                            {{ $isChecked ? 'checked' : '' }}
                                            class="product-picker-input w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300" />
                                        <span class="text-xs font-bold text-gray-800">Select Item</span>
                                    @else
                                        <input type="radio"
                                            name="selected_product_picker"
                                            value="{{ $item->id }}"
                                            data-variant-id="{{ $firstVariantId }}"
                                            data-price="{{ $itemEffectivePrice }}"
                                            data-title="{{ e($item->title) }}"
                                            {{ $isChecked ? 'checked' : '' }}
                                            class="product-picker-input w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300" />
                                        <span class="text-xs font-bold text-gray-800">Select Item</span>
                                    @endif
                                </label>

                                <div class="flex items-center space-x-1.5">
                                    @if(!empty($cardBadge))
                                        <span class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-500 text-white shadow-xs">
                                            🔥 {{ $cardBadge }}
                                        </span>
                                    @endif

                                    @if($showDiscountBadge && $hasDiscount)
                                        <span class="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-700">
                                            {{ $discountPercent }}% OFF
                                        </span>
                                    @endif
                                </div>
                            </div>

                            {{-- Product Image Thumbnail (WooCommerce style switchable) --}}
                            <div class="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-3 flex items-center justify-center relative group">
                                @if($imgUrl)
                                    <img src="{{ e($imgUrl) }}" alt="{{ e($item->title) }}" class="selector-card-img w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                                @else
                                    <div class="text-gray-400 text-xs flex flex-col items-center">
                                        <svg class="w-8 h-8 mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                        <span>No Image</span>
                                    </div>
                                @endif
                            </div>

                            {{-- Title & Pricing --}}
                            <div>
                                <h3 class="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 mb-1.5">
                                    {{ $item->title }}
                                </h3>

                                @if($showPrice)
                                    <div class="flex items-baseline space-x-2 mb-2">
                                        <span class="selector-card-price text-xl font-black text-primary-600">
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
                                    <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                                        {{ $item->description }}
                                    </p>
                                @endif

                                {{-- WooCommerce style variant swatches/buttons --}}
                                @if($item->variants && $item->variants->count() > 1)
                                    <div class="mt-3 pt-2.5 border-t border-gray-100">
                                        <div class="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                            <span>ভ্যারিয়েন্ট নির্বাচন:</span>
                                            <span class="text-primary-600 font-extrabold text-[11px] selector-variant-name">{{ $firstVariant?->name }}</span>
                                        </div>
                                        <div class="flex flex-wrap gap-1.5 selector-variant-container">
                                            @foreach($item->variants as $vIdx => $v)
                                                @php
                                                    $vPrice = (float) ($v->sale_price ?? $v->regular_price ?? $itemEffectivePrice);
                                                    $vImage = $v->images->first()?->url ?? $imgUrl;
                                                    $isVActive = ($vIdx === 0);
                                                @endphp
                                                <button type="button"
                                                    class="selector-variant-btn px-2.5 py-1 text-xs font-semibold rounded-lg border transition {{ $isVActive ? 'border-primary-600 bg-primary-50 text-primary-900 ring-1 ring-primary-500 font-bold' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' }}"
                                                    data-product-id="{{ $item->id }}"
                                                    data-variant-id="{{ $v->id }}"
                                                    data-price="{{ $vPrice }}"
                                                    data-image="{{ $vImage }}"
                                                    data-name="{{ e($v->name) }}">
                                                    {{ $v->name }}
                                                </button>
                                            @endforeach
                                        </div>
                                    </div>
                                @endif
                            </div>
                        </div>

                        {{-- Order Now Button on Each Card --}}
                        <div class="mt-4 pt-3 border-t border-gray-100">
                            <button type="button"
                                class="card-order-btn w-full py-2.5 px-4 text-xs sm:text-sm font-extrabold rounded-xl text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 shadow-md shadow-primary-600/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                                data-product-id="{{ $item->id }}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                                <span>{{ $orderButtonText }}</span>
                            </button>
                        </div>
                    </div>
                @endforeach
            </div>

            {{-- Summary & Call to Action Bar --}}
            <div class="mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block">Your Selected Order:</span>
                    <div class="flex items-baseline space-x-2 mt-0.5">
                        <span id="selected-summary-count" class="text-sm font-semibold text-gray-700">1 Item Selected</span>
                        <span class="text-gray-300">•</span>
                        <span id="selected-summary-total" class="text-2xl font-black text-primary-600">৳0</span>
                    </div>
                </div>
                <a href="#cod-checkout" class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-600/20 transition text-center">
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
            @endphp
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 sm:p-8" id="single-product-showcase" data-product-id="{{ $product->id }}" data-variant-id="{{ $firstVarId }}" data-price="{{ $effPrice }}" data-title="{{ e($product->title) }}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <div class="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center">
                            @if($singleImg)
                                <img src="{{ e($singleImg) }}" alt="{{ e($product->title) }}" id="single-product-main-img" class="w-full h-full object-cover" />
                            @else
                                <span class="text-gray-400">No Image Available</span>
                            @endif
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
                            <p class="text-gray-600 text-sm leading-relaxed mb-6">
                                {{ $product->description }}
                            </p>
                        @endif

                        {{-- WooCommerce style variants on single product --}}
                        @if($product->variants && $product->variants->count() > 1)
                            <div class="mb-6">
                                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Select Variant (ভ্যারিয়েন্ট নির্বাচন):
                                </label>
                                <div class="flex flex-wrap gap-2">
                                    @foreach($product->variants as $vIdx => $variant)
                                        @php
                                            $vP = (float) ($variant->sale_price ?? $variant->regular_price ?? $effPrice);
                                            $vI = $variant->images->first()?->url ?? $singleImg;
                                        @endphp
                                        <button type="button"
                                            class="single-variant-btn px-3.5 py-2 rounded-xl border text-sm font-semibold transition {{ $vIdx === 0 ? 'border-primary-600 bg-primary-50 text-primary-900 ring-2 ring-primary-500 font-bold' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' }}"
                                            data-variant-id="{{ $variant->id }}"
                                            data-price="{{ $vP }}"
                                            data-image="{{ $vI }}"
                                            data-name="{{ e($variant->name) }}">
                                            {{ $variant->name }} (৳{{ number_format($vP, 0) }})
                                        </button>
                                    @endforeach
                                </div>
                            </div>
                        @endif

                        <div>
                            <button type="button" id="single-product-order-btn" class="inline-flex w-full items-center justify-center px-6 py-4 text-base font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition cursor-pointer shadow-lg shadow-primary-600/30">
                                {{ $orderButtonText }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        @else
            <div class="text-center py-12 px-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-500">
                <p class="text-sm">Select products in the editor inspector to preview.</p>
            </div>
        @endif
    </div>
</section>

<script>
(function() {
    function initProductSelector() {
        var section = document.getElementById('product-selection-section');
        if (!section) return;

        var mode = section.getAttribute('data-selection-mode') || 'single';
        var cards = section.querySelectorAll('.product-selection-card');
        var inputs = section.querySelectorAll('.product-picker-input');
        var summaryCount = document.getElementById('selected-summary-count');
        var summaryTotal = document.getElementById('selected-summary-total');

        function updateState() {
            var selectedItems = [];
            var total = 0;

            cards.forEach(function(card) {
                var input = card.querySelector('.product-picker-input');
                var isChecked = input && input.checked;

                if (isChecked) {
                    card.classList.add('border-primary-600', 'ring-2', 'ring-primary-500/20', 'bg-primary-50/10');
                    card.classList.remove('border-gray-200');

                    var variantId = parseInt(card.getAttribute('data-variant-id') || '0', 10);
                    var price = parseFloat(card.getAttribute('data-price') || '0');

                    selectedItems.push({
                        productId: parseInt(card.getAttribute('data-product-id'), 10),
                        variantId: variantId,
                        price: price,
                        title: card.getAttribute('data-title'),
                        quantity: 1
                    });

                    total += price;
                } else {
                    card.classList.remove('border-primary-600', 'ring-2', 'ring-primary-500/20', 'bg-primary-50/10');
                    card.classList.add('border-gray-200');
                }
            });

            if (summaryCount) {
                summaryCount.innerText = selectedItems.length + (selectedItems.length === 1 ? ' Item Selected' : ' Items Selected');
            }
            if (summaryTotal) {
                summaryTotal.innerText = '৳' + Math.round(total).toLocaleString();
            }

            // Dispatch global event for checkout block synchronization
            window.dispatchEvent(new CustomEvent('landing-selection-updated', {
                detail: {
                    mode: mode,
                    selectedItems: selectedItems,
                    total: total
                }
            }));
        }

        // Checkbox/radio toggle changes
        inputs.forEach(function(input) {
            input.addEventListener('change', updateState);
        });

        // WooCommerce-style variant buttons inside card
        var variantBtns = section.querySelectorAll('.selector-variant-btn');
        variantBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                var vid = btn.getAttribute('data-variant-id');
                var vPrice = parseFloat(btn.getAttribute('data-price') || '0');
                var vImg = btn.getAttribute('data-image');
                var vName = btn.getAttribute('data-name');
                var card = btn.closest('.product-selection-card');
                if (!card) return;

                // Update card attributes
                card.setAttribute('data-variant-id', vid);
                card.setAttribute('data-price', vPrice);

                var input = card.querySelector('.product-picker-input');
                if (input) {
                    input.setAttribute('data-variant-id', vid);
                    input.setAttribute('data-price', vPrice);
                }

                // Update container buttons
                var container = card.querySelector('.selector-variant-container');
                if (container) {
                    container.querySelectorAll('.selector-variant-btn').forEach(function(b) {
                        b.classList.remove('border-primary-600', 'bg-primary-50', 'text-primary-900', 'ring-1', 'ring-primary-500', 'font-bold');
                        b.classList.add('border-gray-200', 'bg-white', 'text-gray-700');
                    });
                    btn.classList.add('border-primary-600', 'bg-primary-50', 'text-primary-900', 'ring-1', 'ring-primary-500', 'font-bold');
                    btn.classList.remove('border-gray-200', 'bg-white', 'text-gray-700');
                }

                var nameEl = card.querySelector('.selector-variant-name');
                if (nameEl && vName) {
                    nameEl.innerText = vName;
                }

                // Update card price
                var priceEl = card.querySelector('.selector-card-price');
                if (priceEl) {
                    priceEl.innerText = '৳' + Math.round(vPrice).toLocaleString();
                }

                // Switch card image (WooCommerce style)
                if (vImg) {
                    var imgEl = card.querySelector('.selector-card-img');
                    if (imgEl) {
                        imgEl.src = vImg;
                    }
                }

                updateState();
            });
        });

        // Order button click on each product card
        var orderBtns = section.querySelectorAll('.card-order-btn');
        orderBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                var card = btn.closest('.product-selection-card');
                if (!card) return;

                var input = card.querySelector('.product-picker-input');
                if (input) {
                    if (mode === 'single') {
                        inputs.forEach(function(i) { i.checked = false; });
                        input.checked = true;
                    } else {
                        input.checked = true;
                    }
                }

                updateState();

                // Smooth scroll to checkout section
                var checkoutSection = document.getElementById('cod-checkout');
                if (checkoutSection) {
                    checkoutSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Single product showcase variant button & order button
        var singleVariantBtns = section.querySelectorAll('.single-variant-btn');
        var singleShowcase = document.getElementById('single-product-showcase');
        if (singleShowcase && singleVariantBtns.length > 0) {
            singleVariantBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var vid = btn.getAttribute('data-variant-id');
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
        if (singleOrderBtn) {
            singleOrderBtn.addEventListener('click', function() {
                var checkoutSection = document.getElementById('cod-checkout');
                if (checkoutSection) {
                    checkoutSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        updateState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductSelector);
    } else {
        initProductSelector();
    }
})();
</script>
