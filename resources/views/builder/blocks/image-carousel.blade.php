@php
    $rawImages = is_array($props['images'] ?? null) ? $props['images'] : [];
    $slides = [];

    foreach ($rawImages as $image) {
        if (!is_array($image)) {
            continue;
        }

        $imageUrl = \App\Modules\PageBuilder\Services\BlockRendererService::sanitizeUrl(
            (string) ($image['imageUrl'] ?? '')
        );

        if (empty($imageUrl) || $imageUrl === '#') {
            continue;
        }

        $slides[] = [
            'url' => $imageUrl,
            'alt' => (string) ($image['altText'] ?? 'Carousel image'),
        ];
    }

    $desktopItems = max(1, min(6, (int) ($props['desktopItemsPerView'] ?? 3)));
    $mobileItems = max(1, min(4, (int) ($props['mobileItemsPerView'] ?? 1)));

    $gapValue = trim((string) ($props['gap'] ?? '16px'));
    $gap = preg_match('/^\d+(?:\.\d+)?(?:px|rem|em|%)$/', $gapValue) === 1 ? $gapValue : '16px';

    $aspectValue = str_replace(' ', '', (string) ($props['aspectRatio'] ?? '4/3'));
    $aspectRatio = in_array($aspectValue, ['1/1', '4/3', '16/9', '3/4'], true)
        ? str_replace('/', ' / ', $aspectValue)
        : '4 / 3';

    $imageFit = ($props['imageFit'] ?? 'cover') === 'contain' ? 'contain' : 'cover';
    $showArrows = filter_var($props['showArrows'] ?? true, FILTER_VALIDATE_BOOLEAN);
    $showDots = filter_var($props['showDots'] ?? true, FILTER_VALIDATE_BOOLEAN);
    $autoplay = filter_var($props['autoplay'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $loop = filter_var($props['loop'] ?? true, FILTER_VALIDATE_BOOLEAN);
    $autoplayInterval = max(2000, min(15000, (int) ($props['autoplayInterval'] ?? 4000)));
@endphp

@if(!empty($slides))
    <section {!! $styleAttribute !!} class="w-full bg-white py-12">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            @if(!empty($props['title']))
                <h2 class="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                    {{ $props['title'] }}
                </h2>
            @endif

            <div
                id="{{ $id }}"
                data-lc-carousel
                data-autoplay="{{ $autoplay ? '1' : '0' }}"
                data-interval="{{ $autoplayInterval }}"
                data-loop="{{ $loop ? '1' : '0' }}"
                style="--lc-desktop: {{ $desktopItems }}; --lc-mobile: {{ $mobileItems }}; --lc-gap: {{ $gap }};"
                class="relative"
                role="region"
                aria-roledescription="carousel"
                aria-label="{{ $props['title'] ?? 'Image carousel' }}"
            >
                <div data-lc-carousel-track class="lc-carousel-track">
                    @foreach($slides as $slide)
                        <div class="lc-carousel-slide" data-lc-slide>
                            <div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm" style="aspect-ratio: {{ $aspectRatio }};">
                                <img
                                    src="{{ $slide['url'] }}"
                                    alt="{{ $slide['alt'] }}"
                                    loading="lazy"
                                    class="h-full w-full {{ $imageFit === 'contain' ? 'object-contain' : 'object-cover' }}"
                                />
                            </div>
                        </div>
                    @endforeach
                </div>

                @if($showArrows && count($slides) > 1)
                    <button
                        type="button"
                        data-lc-prev
                        aria-label="Previous images"
                        class="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 sm:left-2"
                    >
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        data-lc-next
                        aria-label="Next images"
                        class="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 sm:right-2"
                    >
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                @endif

                @if($showDots && count($slides) > 1)
                    <div data-lc-dots class="mt-4 flex items-center justify-center gap-1.5">
                        @foreach($slides as $dotIndex => $slide)
                            <button
                                type="button"
                                data-lc-dot="{{ $dotIndex }}"
                                data-active="{{ $dotIndex === 0 ? 'true' : 'false' }}"
                                aria-label="Go to image group {{ $dotIndex + 1 }}"
                                class="lc-carousel-dot"
                            ></button>
                        @endforeach
                    </div>
                @endif
            </div>
        </div>
    </section>
@endif
