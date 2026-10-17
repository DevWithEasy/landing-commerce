@php
    $showDescription = $props['showDescription'] ?? true;
    $showPrice = $props['showPrice'] ?? true;
@endphp

<section {!! $styleAttribute !!} class="w-full py-12 bg-white border-b border-gray-100">
    <div class="max-w-5xl mx-auto px-4 sm:px-6">
        @if($product)
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
                <p class="text-sm">Select a product in the editor inspector to preview.</p>
            </div>
        @endif
    </div>
</section>
