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
    $buttonBg = $styles['buttonBgColor'] ?? null;
    $buttonTextColor = $styles['buttonTextColor'] ?? null;
    $buttonPulse = !empty($styles['buttonPulseAnimation']);
    $btnCustomStyle = '';
    if ($buttonBg) $btnCustomStyle .= 'background-color: ' . e($buttonBg) . ';';
    if ($buttonTextColor) $btnCustomStyle .= 'color: ' . e($buttonTextColor) . ';';

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

<section id="cod-checkout" {!! $styleAttribute !!} class="w-full py-12 bg-slate-50 border-t border-slate-200">
    <div class="max-w-2xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-8">
            <span
                class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 text-primary-800 mb-2">
                Fast & Secure Checkout
            </span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Cash On Delivery Available Nationwide
            </h2>
            <p class="text-sm text-slate-600 mt-1">
                Pay in cash only after receiving and inspecting your parcel.
            </p>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
            <form id="landing-cod-form" method="POST" action="{{ route('checkout.cod.store') }}" class="space-y-4">
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
                @if ($hasMultiple)
                    <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Order Items ({{ $mode === 'multiple' ? 'Check Multiple' : 'Select One' }}):
                            </span>
                            <span class="text-[11px] font-semibold text-primary-600">
                                {{ $mode === 'multiple' ? 'Checkbox Selection' : 'Radio Selection' }}
                            </span>
                        </div>

                        <div class="space-y-2.5">
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
                                @endphp
                                <div
                                    class="cod-product-card relative flex flex-col p-3 rounded-xl border bg-white transition hover:border-primary-400 {{ $isItemChecked ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/20' : 'border-slate-200' }}">
                                    <label class="flex items-center justify-between cursor-pointer w-full">
                                        <div class="flex items-center space-x-3 flex-1 min-w-0">
                                            {{-- Selector Input --}}
                                            @if ($mode === 'multiple')
                                                <input type="checkbox"
                                                    class="cod-product-toggle rounded text-primary-600 focus:ring-primary-500 border-gray-300 w-4 h-4 flex-shrink-0"
                                                    data-product-id="{{ $pItem->id }}"
                                                    data-variant-id="{{ $pVarId }}"
                                                    data-price="{{ $pEffPrice }}" data-title="{{ e($pItem->title) }}"
                                                    {{ $isItemChecked ? 'checked' : '' }} />
                                            @else
                                                <input type="radio" name="cod_radio_product"
                                                    class="cod-product-toggle text-primary-600 focus:ring-primary-500 border-gray-300 w-4 h-4 flex-shrink-0"
                                                    data-product-id="{{ $pItem->id }}"
                                                    data-variant-id="{{ $pVarId }}"
                                                    data-price="{{ $pEffPrice }}"
                                                    data-title="{{ e($pItem->title) }}"
                                                    {{ $isItemChecked ? 'checked' : '' }} />
                                            @endif

                                            {{-- Product Thumbnail --}}
                                            <div
                                                class="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                @if ($pImgUrl)
                                                    <img src="{{ e($pImgUrl) }}" alt="{{ e($pItem->title) }}"
                                                        class="cod-card-img w-full h-full object-cover" />
                                                @else
                                                    <svg class="w-6 h-6 text-gray-300" fill="none"
                                                        stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            stroke-width="2"
                                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                @endif
                                            </div>

                                            {{-- Title & Badge --}}
                                            <div class="min-w-0 flex-1">
                                                <div class="flex items-center space-x-1.5 mb-0.5">
                                                    <span class="text-xs font-bold text-slate-800 truncate block">
                                                        {{ $pItem->title }}
                                                    </span>
                                                    @if (!empty($itemBadge))
                                                        <span
                                                            class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500 text-white flex-shrink-0">
                                                            {{ $itemBadge }}
                                                        </span>
                                                    @endif
                                                </div>

                                                <div class="flex items-baseline space-x-2">
                                                    <span
                                                        class="cod-card-price text-xs font-extrabold text-primary-600">
                                                        ৳{{ number_format($pEffPrice, 0) }}
                                                    </span>
                                                    @if ($pHasDiscount)
                                                        <span class="text-[10px] text-gray-400 line-through">
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

                                    {{-- WooCommerce style variants selector inside card (only shown when product is selected) --}}
                                    @if ($pItem->variants->count() > 1)
                                        <div
                                            class="cod-variant-container mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5 {{ $isItemChecked ? '' : 'hidden' }}">
                                            <span
                                                class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">ভ্যারিয়েন্ট:</span>
                                            @foreach ($pItem->variants as $vIdx => $vObj)
                                                @php
                                                    $vItemPrice = (float) ($vObj->sale_price ?? $vObj->regular_price);
                                                    $vItemImg = $vObj->images->first()?->url ?? $pImgUrl;
                                                    $isVActive = $vIdx === 0;
                                                @endphp
                                                <button type="button"
                                                    class="cod-variant-btn px-2 py-0.5 text-[11px] font-medium rounded-md border transition {{ $isVActive ? 'border-primary-600 bg-primary-50 text-primary-900 ring-1 ring-primary-500 font-bold' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' }}"
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
                    class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                </div>

                {{-- Customer Fields (Name, Phone, Address) - Fully Customizable --}}
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {{ $nameLabel }} <span class="text-rose-500">*</span>
                    </label>
                    <input type="text" name="customer_name" required placeholder="{{ $namePlaceholder }}"
                        class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm bg-white" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {{ $phoneLabel }} <span class="text-rose-500">*</span>
                    </label>
                    <input type="tel" name="customer_phone" required placeholder="{{ $phonePlaceholder }}"
                        pattern="01[3-9][0-9]{8}"
                        class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm bg-white font-mono" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {{ $addressLabel }} <span class="text-rose-500">*</span>
                    </label>
                    <textarea name="delivery_address" required rows="2" placeholder="{{ $addressPlaceholder }}"
                        class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm bg-white"></textarea>
                </div>

                {{-- Shipping Method Dropdown --}}
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {{ $shippingLabel }} <span class="text-rose-500">*</span>
                    </label>
                    <div class="relative">
                        <select name="shipping_method_id" id="cod_shipping_method"
                            class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm bg-white font-medium">
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
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                    <div class="flex justify-between text-slate-600">
                        <span>Items Subtotal:</span>
                        <span id="cod-summary-subtotal" class="font-bold text-slate-800">৳0</span>
                    </div>
                    <div class="flex justify-between text-slate-600">
                        <span>Delivery Charge:</span>
                        <span id="cod-summary-shipping"
                            class="font-bold text-emerald-600">৳{{ number_format($defaultShippingFee, 0) }}</span>
                    </div>
                    <div
                        class="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                        <span>Total Payable:</span>
                        <span id="cod-summary-total" class="text-lg font-black text-primary-600">৳0</span>
                    </div>
                </div>

                <div class="pt-2">
                    <button type="submit" id="cod-submit-btn"
                        style="{{ $btnCustomStyle }}"
                        class="w-full py-4 px-6 rounded-xl text-white font-bold text-base bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/30 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed {{ $buttonPulse ? 'animate-pulse' : '' }}">
                        <span id="cod-btn-spinner" class="hidden">
                            <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none"
                                viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10"
                                    stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                        </span>
                        <span id="cod-btn-text">{{ $buttonText }}</span>
                    </button>
                </div>
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
                            b.classList.remove('border-primary-600', 'bg-primary-50',
                                'text-primary-900', 'ring-1', 'ring-primary-500',
                                'font-bold');
                            b.classList.add('border-gray-200', 'bg-white', 'text-gray-700');
                        });
                        btn.classList.add('border-primary-600', 'bg-primary-50', 'text-primary-900',
                            'ring-1', 'ring-primary-500', 'font-bold');
                        btn.classList.remove('border-gray-200', 'bg-white', 'text-gray-700');
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
                            card.classList.add('border-primary-500', 'ring-2', 'ring-primary-500/20',
                                'bg-primary-50/20');
                            card.classList.remove('border-slate-200');
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
                            card.classList.remove('border-primary-500', 'ring-2', 'ring-primary-500/20',
                                'bg-primary-50/20');
                            card.classList.add('border-slate-200');
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
                                card.classList.add('border-primary-500', 'ring-2',
                                    'ring-primary-500/20', 'bg-primary-50/20');
                                card.classList.remove('border-slate-200');
                            } else {
                                card.classList.remove('border-primary-500', 'ring-2',
                                    'ring-primary-500/20', 'bg-primary-50/20');
                                card.classList.add('border-slate-200');
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
                            if (btnText) btnText.innerText = 'Confirm Order - Cash on Delivery';
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
                        if (btnText) btnText.innerText = 'Confirm Order - Cash on Delivery';
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
