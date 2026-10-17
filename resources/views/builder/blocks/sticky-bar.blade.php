@php
    $placement = $props['placement'] ?? 'bottom';
    $isTop = $placement === 'top';
    $buttonTarget = $props['buttonTarget'] ?? '#cod-checkout';
    if (!str_starts_with($buttonTarget, '#') && !str_starts_with($buttonTarget, 'https://') && !str_starts_with($buttonTarget, 'http://') && !str_starts_with($buttonTarget, 'tel:')) {
        $buttonTarget = '#cod-checkout';
    }
@endphp

<div {!! $styleAttribute !!} class="fixed {{ $isTop ? 'top-0' : 'bottom-0' }} left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md text-white py-3 px-4 border-{{ $isTop ? 'b' : 't' }} border-slate-700 shadow-2xl transition-all">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="text-center sm:text-left flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="text-sm font-semibold text-slate-100">
                {{ $props['message'] ?? 'Special Offer: Free Delivery across Bangladesh today!' }}
            </span>
        </div>

        <div>
            <a href="{{ e($buttonTarget) }}" class="inline-flex items-center justify-center px-6 py-2.5 text-xs sm:text-sm font-extrabold rounded-lg text-white bg-primary-600 hover:bg-primary-500 shadow-md shadow-primary-600/40 transition">
                <span>{{ $props['buttonText'] ?? 'Order Now' }}</span>
                <svg class="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </a>
        </div>
    </div>
</div>
