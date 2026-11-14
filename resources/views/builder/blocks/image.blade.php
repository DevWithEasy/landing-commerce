@php
    $rawImageUrl = (string) ($props['imageUrl'] ?? '');
    $imageUrl = \App\Modules\PageBuilder\Services\BlockRendererService::sanitizeUrl($rawImageUrl);

    $rawLinkUrl = (string) ($props['linkUrl'] ?? '');
    $linkUrl = !empty($rawLinkUrl) ? \App\Modules\PageBuilder\Services\BlockRendererService::sanitizeUrl($rawLinkUrl) : '';

    $altText = e((string) ($props['altText'] ?? 'Product Image'));
    $caption = (string) ($props['caption'] ?? '');
    $align = in_array($props['align'] ?? '', ['left', 'center', 'right'], true) ? $props['align'] : 'center';

    $containerAlign = match($align) {
        'left' => 'justify-start',
        'right' => 'justify-end',
        default => 'justify-center',
    };
@endphp

<figure id="{{ $id }}" {!! $styleAttribute !!} class="lc-block-root lc-image flex flex-col {{ $containerAlign }} my-2 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 [.lc-container_&]:max-w-none [.lc-container_&]:px-0 [.lc-grid_&]:max-w-none [.lc-grid_&]:px-0">
    @if(!empty($imageUrl))
        @if(!empty($linkUrl))
            <a href="{{ $linkUrl }}" class="inline-block transition-opacity hover:opacity-95" target="{{ str_starts_with($linkUrl, 'http') ? '_blank' : '_self' }}" rel="noopener noreferrer">
                <img src="{{ $imageUrl }}" alt="{{ $altText }}" loading="lazy" data-lc-el="image" class="max-w-full h-auto rounded-lg object-contain shadow-xs" />
            </a>
        @else
            <img src="{{ $imageUrl }}" alt="{{ $altText }}" loading="lazy" data-lc-el="image" class="max-w-full h-auto rounded-lg object-contain shadow-xs" />
        @endif
        @if(!empty($caption))
            <figcaption data-lc-el="caption" class="mt-2 text-xs text-gray-500 text-center">{{ $caption }}</figcaption>
        @endif
    @endif
</figure>
