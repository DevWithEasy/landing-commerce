@php
    $buttonText = $props['buttonText'] ?? 'Confirm Order - Cash on Delivery';
    $mode = $selectionMode ?? ($props['selectionMode'] ?? 'single');
    $hasMultiple = isset($products) && $products->count() > 1;
    $firstProduct = $products->first() ?? $product;
    $firstVariant = $firstProduct?->variants?->first();
    $firstVariantId = $firstVariant?->id ?? 0;
@endphp

<section id="cod-checkout" {!! $styleAttribute !!} class="w-full py-12 bg-slate-50 border-t border-slate-200">
    <div class="max-w-2xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-8">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 text-primary-800 mb-2">
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
                <input type="hidden" name="idempotency_key" id="cod_idempotency_key" value="{{ Str::uuid()->toString() }}" />

                {{-- Off-screen honeypot protection --}}
                <div class="hidden" aria-hidden="true">
                    <input type="text" name="_hp_trap" tabindex="-1" autocomplete="off" />
                    <input type="text" name="fax_number" tabindex="-1" autocomplete="off" />
                </div>

                {{-- Container for dynamic items inputs --}}
                <div id="cod-items-container">
                    @if($hasMultiple)
                        @foreach($products as $idx => $item)
                            @php
                                $varId = $item->variants->first()?->id ?? 0;
                                $effectivePrice = (float) ($item->sale_price ?? $item->regular_price);
                                $isChecked = $idx === 0 || $mode === 'multiple';
                            @endphp
                            @if($isChecked)
                                <input type="hidden" class="cod-item-input" name="items[{{ $idx }}][variant_id]" value="{{ $varId }}" data-product-id="{{ $item->id }}" data-price="{{ $effectivePrice }}" data-title="{{ e($item->title) }}" />
                                <input type="hidden" class="cod-item-qty" name="items[{{ $idx }}][quantity]" value="1" />
                            @endif
                        @endforeach
                    @elseif($firstVariantId)
                        <input type="hidden" class="cod-item-input" name="items[0][variant_id]" value="{{ $firstVariantId }}" data-price="{{ (float) ($firstProduct?->sale_price ?? $firstProduct?->regular_price ?? 0) }}" data-title="{{ e($firstProduct?->title ?? '') }}" />
                        <input type="hidden" class="cod-item-qty" name="items[0][quantity]" value="1" />
                    @endif
                </div>

                {{-- Product selection breakdown in Checkout box --}}
                @if($hasMultiple)
                    <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Order Items ({{ $mode === 'multiple' ? 'Check Multiple' : 'Select One' }}):
                            </span>
                            <span class="text-[11px] font-semibold text-primary-600">
                                {{ $mode === 'multiple' ? 'Checkbox Selection' : 'Radio Selection' }}
                            </span>
                        </div>

                        <div class="space-y-2">
                            @foreach($products as $pIndex => $pItem)
                                @php
                                    $pVarId = $pItem->variants->first()?->id ?? 0;
                                    $pPrice = (float) ($pItem->sale_price ?? $pItem->regular_price);
                                    $isItemChecked = $pIndex === 0 || $mode === 'multiple';
                                @endphp
                                <label class="flex items-center justify-between p-2.5 rounded-lg border bg-white cursor-pointer transition hover:border-primary-400 {{ $isItemChecked ? 'border-primary-500 bg-primary-50/20' : 'border-slate-200' }}">
                                    <div class="flex items-center space-x-3">
                                        @if($mode === 'multiple')
                                            <input type="checkbox"
                                                class="cod-product-toggle rounded text-primary-600 focus:ring-primary-500 border-gray-300 w-4 h-4"
                                                data-product-id="{{ $pItem->id }}"
                                                data-variant-id="{{ $pVarId }}"
                                                data-price="{{ $pPrice }}"
                                                data-title="{{ e($pItem->title) }}"
                                                {{ $isItemChecked ? 'checked' : '' }} />
                                        @else
                                            <input type="radio"
                                                name="cod_radio_product"
                                                class="cod-product-toggle text-primary-600 focus:ring-primary-500 border-gray-300 w-4 h-4"
                                                data-product-id="{{ $pItem->id }}"
                                                data-variant-id="{{ $pVarId }}"
                                                data-price="{{ $pPrice }}"
                                                data-title="{{ e($pItem->title) }}"
                                                {{ $isItemChecked ? 'checked' : '' }} />
                                        @endif
                                        <span class="text-xs font-bold text-slate-800 line-clamp-1">
                                            {{ $pItem->title }}
                                        </span>
                                    </div>
                                    <span class="text-xs font-extrabold text-primary-700 ml-2 whitespace-nowrap">
                                        ৳{{ number_format($pPrice, 0) }}
                                    </span>
                                </label>
                            @endforeach
                        </div>
                    </div>
                @endif

                {{-- Alert Box for Errors --}}
                <div id="cod-error-box" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium"></div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Your Full Name <span class="text-rose-500">*</span>
                    </label>
                    <input type="text" name="customer_name" required placeholder="e.g. Tanvir Hasan" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm bg-white" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Mobile Number (11-digit Bangladeshi) <span class="text-rose-500">*</span>
                    </label>
                    <input type="tel" name="customer_phone" required placeholder="01XXXXXXXXX" pattern="01[3-9][0-9]{8}" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm bg-white font-mono" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Delivery District <span class="text-rose-500">*</span>
                    </label>
                    <input type="text" name="district" required placeholder="e.g. Dhaka, Chittagong, Sylhet..." class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm bg-white" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Full Delivery Address <span class="text-rose-500">*</span>
                    </label>
                    <textarea name="delivery_address" required rows="2" placeholder="House/Flat #, Road #, Area..." class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm bg-white"></textarea>
                </div>

                {{-- Live Summary Breakdown --}}
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                    <div class="flex justify-between text-slate-600">
                        <span>Items Subtotal:</span>
                        <span id="cod-summary-subtotal" class="font-bold text-slate-800">৳0</span>
                    </div>
                    <div class="flex justify-between text-slate-600">
                        <span>Delivery Charge (COD):</span>
                        <span class="font-bold text-emerald-600">Calculated at dispatch</span>
                    </div>
                    <div class="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                        <span>Total Payable:</span>
                        <span id="cod-summary-total" class="text-lg font-black text-primary-600">৳0</span>
                    </div>
                </div>

                <div class="pt-2">
                    <button type="submit" id="cod-submit-btn" class="w-full py-4 px-6 rounded-xl text-white font-bold text-base bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/30 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                        <span id="cod-btn-spinner" class="hidden">
                            <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
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
        var totalEl = document.getElementById('cod-summary-total');
        var errorBox = document.getElementById('cod-error-box');
        var submitBtn = document.getElementById('cod-submit-btn');
        var btnSpinner = document.getElementById('cod-btn-spinner');
        var btnText = document.getElementById('cod-btn-text');
        var toggles = form.querySelectorAll('.cod-product-toggle');

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

            if (subtotalEl) subtotalEl.innerText = '৳' + Math.round(subtotal).toLocaleString();
            if (totalEl) totalEl.innerText = '৳' + Math.round(subtotal).toLocaleString();
        }

        function calculateFromToggles() {
            var selected = [];
            toggles.forEach(function(t) {
                if (t.checked) {
                    var card = t.closest('label');
                    if (card) {
                        card.classList.add('border-primary-500', 'bg-primary-50/20');
                        card.classList.remove('border-slate-200');
                    }
                    selected.push({
                        productId: parseInt(t.getAttribute('data-product-id'), 10),
                        variantId: parseInt(t.getAttribute('data-variant-id'), 10),
                        price: parseFloat(t.getAttribute('data-price') || '0'),
                        title: t.getAttribute('data-title'),
                        quantity: 1
                    });
                } else {
                    var card = t.closest('label');
                    if (card) {
                        card.classList.remove('border-primary-500', 'bg-primary-50/20');
                        card.classList.add('border-slate-200');
                    }
                }
            });

            rebuildFromItems(selected);
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
            if (subtotalEl) subtotalEl.innerText = '৳' + Math.round(initialSubtotal).toLocaleString();
            if (totalEl) totalEl.innerText = '৳' + Math.round(initialSubtotal).toLocaleString();
        }

        // Listen to event from external product-selector block
        window.addEventListener('landing-selection-updated', function(e) {
            if (e.detail && Array.isArray(e.detail.selectedItems)) {
                // Also sync toggles inside form if present
                var selectedPids = e.detail.selectedItems.map(function(i) { return i.productId; });
                toggles.forEach(function(t) {
                    var pid = parseInt(t.getAttribute('data-product-id'), 10);
                    t.checked = selectedPids.indexOf(pid) !== -1;
                    var card = t.closest('label');
                    if (card) {
                        if (t.checked) {
                            card.classList.add('border-primary-500', 'bg-primary-50/20');
                            card.classList.remove('border-slate-200');
                        } else {
                            card.classList.remove('border-primary-500', 'bg-primary-50/20');
                            card.classList.add('border-slate-200');
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
                    return { ok: res.ok, status: res.status, data: data };
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
                    window.location.href = '/checkout/thank-you/' + encodeURIComponent(orderNum);
                } else {
                    window.location.reload();
                }
            })
            .catch(function(err) {
                if (errorBox) {
                    errorBox.innerText = 'Network error. Please check your internet connection and try again.';
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
