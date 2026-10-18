@php
    $imagePosition = $props['imagePosition'] ?? 'right';
    $isBackground = $imagePosition === 'background';
    $isLeft = $imagePosition === 'left';
    $imageUrl = $props['imageUrl'] ?? '';
    $ctaTarget = $props['ctaTarget'] ?? '#cod-checkout';
    if (!str_starts_with($ctaTarget, '#') && !str_starts_with($ctaTarget, 'https://') && !str_starts_with($ctaTarget, 'http://') && !str_starts_with($ctaTarget, 'tel:')) {
        $ctaTarget = '#cod-checkout';
    }
    $buttonBg = $styles['buttonBgColor'] ?? null;
    $buttonTextColor = $styles['buttonTextColor'] ?? null;
    $buttonPulse = !empty($styles['buttonPulseAnimation']);
    $btnCustomStyle = '';
    if ($buttonBg) $btnCustomStyle .= 'background-color: ' . e($buttonBg) . ';';
    if ($buttonTextColor) $btnCustomStyle .= 'color: ' . e($buttonTextColor) . ';';
@endphp

<section {!! $styleAttribute !!} class="relative w-full py-12 md:py-20 overflow-hidden {{ $isBackground ? 'bg-slate-900 text-white' : 'bg-gradient-to-b from-slate-50 to-white text-slate-900' }}">
    @if($isBackground && $imageUrl)
        <div class="absolute inset-0 z-0">
            <img src="{{ e($imageUrl) }}" alt="" class="w-full h-full object-cover opacity-20 filter blur-xs" />
            <div class="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-slate-900/80"></div>
        </div>
    @endif

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 {{ !$isBackground && $imageUrl ? 'lg:grid-cols-12 gap-12' : '' }} items-center">
            <div class="{{ !$isBackground && $imageUrl ? 'lg:col-span-7 ' . ($isLeft ? 'lg:order-2' : 'lg:order-1') : 'max-w-3xl mx-auto text-center' }}">
                @if(!empty($props['badgeText']))
                    <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-4 {{ $isBackground ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-primary-50 text-primary-700 border border-primary-200' }}">
                        <span>{{ $props['badgeText'] }}</span>
                    </div>
                @endif

                <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
                    {{ $props['headline'] ?? '' }}
                </h1>

                @if(!empty($props['subheadline']))
                    <p class="text-base sm:text-lg md:text-xl font-normal leading-relaxed mb-8 {{ $isBackground ? 'text-slate-300' : 'text-slate-600' }}">
                        {{ $props['subheadline'] }}
                    </p>
                @endif

                <div>
                    <a href="{{ e($ctaTarget) }}" style="{{ $btnCustomStyle }}" class="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 {{ $buttonPulse ? 'animate-pulse' : '' }}">
                        <span>{{ $props['ctaText'] ?? 'Order Now - Cash on Delivery' }}</span>
                        <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </a>
                </div>
            </div>

            @if(!$isBackground && $imageUrl)
                <div class="lg:col-span-5 {{ $isLeft ? 'lg:order-1' : 'lg:order-2' }}">
                    <div class="relative mx-auto max-w-md lg:max-w-none">
                        <div class="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 bg-white aspect-square">
                            <img src="{{ e($imageUrl) }}" alt="{{ e($props['headline'] ?? 'Product Showcase') }}" class="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            @endif
        </div>
    </div>
</section>
