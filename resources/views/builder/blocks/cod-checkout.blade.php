@php
    $buttonText = $props['buttonText'] ?? 'Confirm Order - Cash on Delivery';
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
                Pay only after you receive and inspect your package.
            </p>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
            {{-- Blade fallback rendering for COD form --}}
            <form method="POST" action="{{ route('checkout.cod.store') }}" class="space-y-4">
                @csrf
                <input type="hidden" name="product_id" value="{{ $product?->id ?? ($props['productId'] ?? '') }}" />
                <input type="hidden" name="idempotency_key" value="{{ Str::uuid()->toString() }}" />

                {{-- Off-screen honeypot --}}
                <div class="hidden" aria-hidden="true">
                    <input type="text" name="website_url" tabindex="-1" autocomplete="off" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Your Full Name <span class="text-rose-500">*</span>
                    </label>
                    <input type="text" name="customer_name" required placeholder="e.g. Rahim Uddin" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Phone Number <span class="text-rose-500">*</span>
                    </label>
                    <input type="tel" name="customer_phone" required placeholder="017XXXXXXXX" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Delivery Address <span class="text-rose-500">*</span>
                    </label>
                    <textarea name="delivery_address" required rows="2" placeholder="House/Road/Area" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm"></textarea>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        District <span class="text-rose-500">*</span>
                    </label>
                    <input type="text" name="district" required placeholder="e.g. Dhaka" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>

                <div class="pt-4">
                    <button type="submit" class="w-full py-4 px-6 rounded-xl text-white font-bold text-base bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/30 transition">
                        {{ $buttonText }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</section>
