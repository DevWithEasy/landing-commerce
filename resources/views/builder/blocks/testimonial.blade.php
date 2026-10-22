@php
    $safeCss = static function ($value): ?string {
        if (! is_string($value) && ! is_numeric($value)) {
            return null;
        }

        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        if (preg_match('/(?:expression\s*\(|@import|url\s*\(|javascript\s*:|behavior\s*:|-moz-binding|[;{}<>\\\\])/i', $value)) {
            return null;
        }

        return $value;
    };

    $inlineStyle = static function (array $declarations) use ($safeCss): string {
        $parts = [];

        foreach ($declarations as $property => $value) {
            $safeValue = $safeCss($value);

            if ($safeValue !== null) {
                $parts[] = $property.': '.$safeValue;
            }
        }

        return $parts === [] ? '' : 'style="'.e(implode('; ', $parts)).'"';
    };

    $legacyItem = [
        'quote' => (string) ($props['quote'] ?? ''),
        'authorName' => (string) ($props['authorName'] ?? 'Customer Name'),
        'authorRole' => (string) ($props['authorRole'] ?? ''),
        'location' => (string) ($props['location'] ?? ''),
        'rating' => (int) ($props['rating'] ?? 5),
        'avatarUrl' => (string) ($props['avatarUrl'] ?? ''),
        'verifiedPurchase' => $props['verifiedPurchase'] ?? true,
    ];

    $rawItems = is_array($props['items'] ?? null) ? $props['items'] : [];
    $items = [];

    foreach ($rawItems as $index => $item) {
        if (! is_array($item)) {
            continue;
        }

        $items[] = [
            'id' => (string) ($item['id'] ?? 'testimonial_'.($index + 1)),
            'quote' => (string) ($item['quote'] ?? ''),
            'authorName' => (string) ($item['authorName'] ?? 'Customer Name'),
            'authorRole' => (string) ($item['authorRole'] ?? ''),
            'location' => (string) ($item['location'] ?? ''),
            'rating' => (int) ($item['rating'] ?? 5),
            'avatarUrl' => (string) ($item['avatarUrl'] ?? ''),
            'verifiedPurchase' => $item['verifiedPurchase'] ?? true,
        ];
    }

    if ($items === []) {
        $items[] = $legacyItem;
    }

    $isMinimal = ($props['layout'] ?? 'card') === 'minimal';
    $showQuoteIcon = $props['showQuoteIcon'] ?? true;
    $showRating = $props['showRating'] ?? true;
    $isCarousel = count($items) > 1;

    $autoplay = (bool) ($props['autoplay'] ?? true);
    $autoplayInterval = max(2000, min(15000, (int) ($props['autoplayInterval'] ?? 5000)));
    $loop = (bool) ($props['loop'] ?? true);
    $showArrows = $props['showArrows'] ?? true;
    $showDots = $props['showDots'] ?? true;

    $accentColor = $safeCss($props['accentColor'] ?? '#059669') ?: '#059669';
    $quoteColor = $safeCss($props['quoteColor'] ?? '#1e293b') ?: '#1e293b';
    $authorColor = $safeCss($props['authorColor'] ?? '#0f172a') ?: '#0f172a';
    $quoteFontSize = $safeCss($props['quoteFontSize'] ?? '20px') ?: '20px';
    $avatarSize = $safeCss($props['avatarSize'] ?? '52px') ?: '52px';
    $cardRadius = $safeCss($props['cardRadius'] ?? '20px') ?: '20px';
    $cardPadding = $safeCss($props['cardPadding'] ?? '32px') ?: '32px';
    $starColor = $safeCss($props['starColor'] ?? '') ?: $accentColor;
    $starSize = $safeCss($props['starSize'] ?? '') ?: '16px';
    $starStyle = ($props['starStyle'] ?? 'filled') === 'outline' ? 'outline' : 'filled';

    $cardDeclarations = [
        'display' => 'flex',
        'flex-direction' => 'column',
        'gap' => '18px',
        'height' => '100%',
    ];

    if ($isMinimal) {
        $cardDeclarations['align-items'] = 'center';
        $cardDeclarations['text-align'] = 'center';
        $cardDeclarations['padding'] = '8px';
    } else {
        $cardDeclarations['align-items'] = 'stretch';
        $cardDeclarations['padding'] = $cardPadding;
        $cardDeclarations['border-radius'] = $cardRadius;
        $cardDeclarations['background-color'] = $safeCss($props['cardBgColor'] ?? '#ffffff') ?: '#ffffff';
        $cardDeclarations['border'] = '1px solid rgba(148, 163, 184, 0.22)';
        $cardDeclarations['box-shadow'] = '0 18px 40px -24px rgba(15, 23, 42, 0.35)';
    }

    $cardStyle = $inlineStyle($cardDeclarations);

    $quoteStyle = $inlineStyle([
        'color' => $quoteColor,
        'font-size' => $quoteFontSize,
        'line-height' => '1.6',
        'font-weight' => '500',
        'margin' => '0',
    ]);

    $authorStyle = $inlineStyle([
        'color' => $authorColor,
    ]);

    $avatarStyle = $inlineStyle([
        'width' => $avatarSize,
        'height' => $avatarSize,
        'border-radius' => '9999px',
        'background-color' => 'color-mix(in srgb, '.$accentColor.' 10%, transparent)',
        'color' => $accentColor,
    ]);

    $iconBoxStyle = $inlineStyle([
        'background-color' => 'color-mix(in srgb, '.$accentColor.' 8%, transparent)',
        'color' => $accentColor,
    ]);
@endphp

<section id="{{ $id }}" {!! $styleAttribute !!} class="lc-block-root w-full">
    <div class="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <div
            class="relative"
            @if ($isCarousel)
                data-lc-carousel
                data-autoplay="{{ $autoplay ? '1' : '0' }}"
                data-interval="{{ $autoplayInterval }}"
                data-loop="{{ $loop ? '1' : '0' }}"
                style="--lc-desktop: 1; --lc-mobile: 1; --lc-gap: 16px;"
            @endif
        >
            <div @if ($isCarousel) data-lc-carousel-track @endif class="{{ $isCarousel ? 'lc-carousel-track py-2' : '' }}">
                @foreach ($items as $item)
                    @php
                        $itemRating = max(1, min(5, (int) ($item['rating'] ?? 5)));
                        $authorName = (string) ($item['authorName'] ?? 'Customer Name');
                        $nameParts = preg_split('/\s+/', trim($authorName)) ?: [];
                        $initials = strtoupper(
                            mb_substr($nameParts[0] ?? '', 0, 1).mb_substr($nameParts[1] ?? '', 0, 1)
                        );
                        $avatarUrl = \App\Modules\PageBuilder\Services\BlockRendererService::sanitizeUrl(
                            (string) ($item['avatarUrl'] ?? '')
                        );
                        $verified = $item['verifiedPurchase'] ?? true;
                    @endphp

                    <div @if ($isCarousel) class="lc-carousel-slide" data-lc-slide @endif>
                        <div {!! $cardStyle !!} data-lc-el="card">
                            <div class="flex items-center {{ $isMinimal ? 'justify-center' : 'justify-between' }}">
                                @if ($showQuoteIcon)
                                    <span class="flex h-9 w-9 items-center justify-center rounded-full" {!! $iconBoxStyle !!}>
                                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M9.6 6C6.5 7.4 4.7 10 4.7 13.2c0 2.7 1.6 4.5 3.8 4.5 2 0 3.5-1.5 3.5-3.4 0-1.9-1.3-3.3-3.1-3.3-.3 0-.6 0-.9.1.4-1.4 1.5-2.6 3-3.4L9.6 6Zm9 0c-3.1 1.4-4.9 4-4.9 7.2 0 2.7 1.6 4.5 3.8 4.5 2 0 3.5-1.5 3.5-3.4 0-1.9-1.3-3.3-3.1-3.3-.3 0-.6 0-.9.1.4-1.4 1.5-2.6 3-3.4L18.6 6Z" />
                                        </svg>
                                    </span>
                                @endif

                                @if ($showRating)
                                    <div data-lc-el="stars" class="flex items-center gap-0.5" aria-label="{{ $itemRating }} out of 5 stars">
                                        @for ($i = 1; $i <= 5; $i++)
                                            <svg viewBox="0 0 20 20" aria-hidden="true"
                                                style="width: {{ e($starSize) }}; height: {{ e($starSize) }}; color: {{ $i <= $itemRating ? e($starColor) : '#e2e8f0' }}; fill: {{ $i <= $itemRating && $starStyle === 'filled' ? e($starColor) : 'transparent' }};">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        @endfor
                                    </div>
                                @endif
                            </div>

                            <blockquote style="margin: 0;">
                                <p {!! $quoteStyle !!} data-lc-el="quote">&ldquo;{{ $item['quote'] }}&rdquo;</p>
                            </blockquote>

                            <div class="flex items-center gap-3 {{ $isMinimal ? 'justify-center' : '' }}">
                                <div data-lc-el="avatar" class="flex shrink-0 items-center justify-center overflow-hidden text-sm font-extrabold" {!! $avatarStyle !!}>
                                    @if (!empty($avatarUrl))
                                        <img src="{{ $avatarUrl }}" alt="{{ $authorName }}" loading="lazy"
                                            class="h-full w-full object-cover" />
                                    @else
                                        <span>{{ $initials }}</span>
                                    @endif
                                </div>

                                <div class="min-w-0">
                                    <div class="flex flex-wrap items-center gap-1.5">
                                        <span data-lc-el="author" class="text-sm font-bold" {!! $authorStyle !!}>{{ $authorName }}</span>
                                        @if ($verified)
                                            <span class="inline-flex items-center gap-0.5 text-[10px] font-bold"
                                                style="color: {{ e($accentColor) }};">
                                                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor"
                                                    viewBox="0 0 24 24" aria-hidden="true">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                </svg>
                                                Verified
                                            </span>
                                        @endif
                                    </div>
                                    <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                                        @if (!empty($item['authorRole']))
                                            <span>{{ $item['authorRole'] }}</span>
                                        @endif
                                        @if (!empty($item['location']))
                                            <span class="inline-flex items-center gap-0.5">
                                                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                    aria-hidden="true">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                                </svg>
                                                {{ $item['location'] }}
                                            </span>
                                        @endif
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>

            @if ($isCarousel && $showArrows)
                <button type="button" data-lc-prev data-lc-el="arrow" aria-label="Previous testimonial"
                    class="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 19-7-7 7-7" />
                    </svg>
                </button>
                <button type="button" data-lc-next data-lc-el="arrow" aria-label="Next testimonial"
                    class="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7" />
                    </svg>
                </button>
            @endif

            @if ($isCarousel && $showDots)
                <div data-lc-dots class="mt-5 flex items-center justify-center gap-1.5">
                    @foreach ($items as $index => $item)
                        <button type="button" data-lc-dot data-lc-el="dot" aria-label="Go to testimonial {{ $index + 1 }}"
                            class="lc-carousel-dot"></button>
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</section>
