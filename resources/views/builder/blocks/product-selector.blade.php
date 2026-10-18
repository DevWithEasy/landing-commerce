@php
    $showDescription = $props['showDescription'] ?? true;
    $showPrice = $props['showPrice'] ?? true;
    $mode = $selectionMode ?? ($props['selectionMode'] ?? 'single');
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
                        Check all the items you want delivered. You can select one or multiple products.
                    @else
                        Select one option below to proceed with Cash on Delivery.
                    @endif
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @foreach($products as $index => $item)
                    @php
                        $itemEffectivePrice = (float) ($item->sale_price ?? $item->regular_price);
                        $itemRegPrice = (float) $item->regular_price;
                        $firstVariant = $item->variants->first();
                        $firstVariantId = $firstVariant?->id ?? 0;
                        $imgUrl = $item->primaryImage?->url ?? ($item->images->first()?->url ?? null);
                        $isChecked = $index === 0 || $mode === 'multiple';
                    @endphp
                    <label class="product-selection-card relative block rounded-2xl border-2 transition-all cursor-pointer overflow-hidden p-5 bg-white shadow-sm hover:shadow-md {{ $isChecked ? 'border-primary-600 ring-2 ring-primary-500/20 bg-primary-50/10' : 'border-gray-200' }}"
                        data-product-id="{{ $item->id }}"
                        data-variant-id="{{ $firstVariantId }}"
                        data-price="{{ $itemEffectivePrice }}"
                        data-title="{{ e($item->title) }}">
                        
                        {{-- Selection Control Indicator (Radio or Checkbox) --}}
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-2.5">
                                @if($mode === 'multiple')
                                    <input type="checkbox"
                                        name="selected_products_picker[]"
                                        value="{{ $item->id }}"
                                        data-variant-id="{{ $firstVariantId }}"
                                        data-price="{{ $itemEffectivePrice }}"
                                        data-title="{{ e($item->title) }}"
                                        {{ $isChecked ? 'checked' : '' }}
                                        class="product-picker-input w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300" />
                                    <span class="text-xs font-bold text-gray-700">Add to Package</span>
                                @else
                                    <input type="radio"
                                        name="selected_product_picker"
                                        value="{{ $item->id }}"
                                        data-variant-id="{{ $firstVariantId }}"
                                        data-price="{{ $itemEffectivePrice }}"
                                        data-title="{{ e($item->title) }}"
                                        {{ $isChecked ? 'checked' : '' }}
                                        class="product-picker-input w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300" />
                                    <span class="text-xs font-bold text-gray-700">Select This</span>
                                @endif
                            </div>

                            @if($item->sale_price && $item->sale_price < $item->regular_price)
                                <span class="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-700">
                                    SAVE ৳{{ number_format($itemRegPrice - $itemEffectivePrice, 0) }}
                                </span>
                            @endif
                        </div>

                        {{-- Product Image --}}
                        <div class="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-4 flex items-center justify-center">
                            @if($imgUrl)
                                <img src="{{ e($imgUrl) }}" alt="{{ e($item->title) }}" class="w-full h-full object-cover" />
                            @else
                                <div class="text-gray-400 text-xs flex flex-col items-center">
                                    <svg class="w-8 h-8 mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                    <span>No Image</span>
                                </div>
                            @endif
                        </div>

                        {{-- Title & Pricing --}}
                        <h3 class="text-base font-bold text-gray-900 line-clamp-2 mb-2">
                            {{ $item->title }}
                        </h3>

                        @if($showPrice)
                            <div class="flex items-baseline space-x-2 mb-2">
                                <span class="text-xl font-extrabold text-primary-600">
                                    ৳{{ number_format($itemEffectivePrice, 0) }}
                                </span>
                                @if($item->sale_price && $item->sale_price < $item->regular_price)
                                    <span class="text-xs text-gray-400 line-through">
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

                        @if($item->variants && $item->variants->count() > 1)
                            <div class="mt-2 pt-2 border-t border-gray-100">
                                <label class="block text-[11px] font-semibold text-gray-600 mb-1">Variant:</label>
                                <select class="card-variant-select w-full text-xs rounded-lg border-gray-200 bg-white p-1.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500" data-product-id="{{ $item->id }}">
                                    @foreach($item->variants as $v)
                                        <option value="{{ $v->id }}" data-price="{{ (float) ($v->sale_price ?? $v->regular_price ?? $itemEffectivePrice) }}">
                                            {{ $v->name }} (৳{{ number_format((float) ($v->sale_price ?? $v->regular_price ?? $itemEffectivePrice), 0) }})
                                        </option>
                                    @endforeach
                                </select>
                            </div>
                        @endif
                    </label>
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
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 sm:p-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        @if($product->primaryImage)
                            <div class="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                                <img src="{{ e($product->primaryImage->url) }}" alt="{{ e($product->title) }}" class="w-full h-full object-cover" />
                            </div>
                        @else
                            <div class="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center text-gray-400">
                                <span>No Image Available</span>
                            </div>
                        @endif
                    </div>

                    <div>
                        <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                            {{ $product->title }}
                        </h2>

                        @if($showPrice)
                            <div class="flex items-baseline space-x-3 mb-4">
                                <span class="text-3xl font-black text-primary-600">
                                    ৳{{ number_format((float) ($product->sale_price ?? $product->regular_price), 0) }}
                                </span>
                                @if($product->sale_price && $product->sale_price < $product->regular_price)
                                    <span class="text-lg text-gray-400 line-through">
                                        ৳{{ number_format((float) $product->regular_price, 0) }}
                                    </span>
                                @endif
                            </div>
                        @endif

                        @if($showDescription && $product->description)
                            <p class="text-gray-600 text-sm leading-relaxed mb-6">
                                {{ $product->description }}
                            </p>
                        @endif

                        @if($product->variants && $product->variants->isNotEmpty())
                            <div class="mb-6">
                                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Select Variant
                                </label>
                                <div class="flex flex-wrap gap-2">
                                    @foreach($product->variants as $variant)
                                        <div class="px-3 py-1.5 rounded-lg border text-sm font-medium border-gray-300 text-gray-700 bg-white cursor-pointer hover:border-primary-500">
                                            {{ $variant->name ?? $variant->title }}
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        @endif

                        <div>
                            <a href="#cod-checkout" class="inline-flex w-full items-center justify-center px-6 py-3.5 text-base font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition">
                                Buy Now - Cash on Delivery
                            </a>
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

                    var variantSelect = card.querySelector('.card-variant-select');
                    var variantId = variantSelect ? parseInt(variantSelect.value, 10) : parseInt(card.getAttribute('data-variant-id') || '0', 10);
                    var price = variantSelect && variantSelect.selectedOptions[0] 
                        ? parseFloat(variantSelect.selectedOptions[0].getAttribute('data-price') || card.getAttribute('data-price'))
                        : parseFloat(card.getAttribute('data-price') || '0');

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

        inputs.forEach(function(input) {
            input.addEventListener('change', updateState);
        });

        var variantSelects = section.querySelectorAll('.card-variant-select');
        variantSelects.forEach(function(sel) {
            sel.addEventListener('change', updateState);
        });

        updateState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductSelector);
    } else {
        initProductSelector();
    }
})();
</script>
