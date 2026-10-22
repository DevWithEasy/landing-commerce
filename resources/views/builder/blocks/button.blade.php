@php
    $rawTarget = (string) ($props['target'] ?? '#cod-checkout');
    $target = \App\Modules\PageBuilder\Services\BlockRendererService::sanitizeUrl($rawTarget);
    if (empty($target)) {
        $target = '#cod-checkout';
    }

    $text = (string) ($props['text'] ?? 'Order Now');
    $size = $props['size'] ?? 'lg';
    $width = $props['width'] ?? 'auto';
    $align = in_array($props['align'] ?? '', ['left', 'center', 'right'], true) ? $props['align'] : 'center';
    $pulse = !empty($props['pulseAnimation']);

    $sizeClasses = match($size) {
        'sm' => 'px-4 py-2 text-sm',
        'md' => 'px-6 py-2.5 text-base',
        'xl' => 'px-10 py-4 text-xl font-bold',
        default => 'px-8 py-3 text-lg font-semibold',
    };

    $containerAlign = match($align) {
        'left' => 'justify-start',
        'right' => 'justify-end',
        default => 'justify-center',
    };

    $widthClass = $width === 'full' ? 'w-full text-center' : 'inline-flex';

    $btnStyle = '';
    if (!empty($props['backgroundColor'])) {
        $btnStyle .= 'background-color: ' . e(str_replace(['"', ';'], '', (string) $props['backgroundColor'])) . '; ';
    }
    if (!empty($props['textColor'])) {
        $btnStyle .= 'color: ' . e(str_replace(['"', ';'], '', (string) $props['textColor'])) . '; ';
    }
    if (!empty($props['borderRadius'])) {
        $btnStyle .= 'border-radius: ' . e(str_replace(['"', ';'], '', (string) $props['borderRadius'])) . '; ';
    }
@endphp

<div id="{{ $id }}" {!! $styleAttribute !!} class="lc-block-root lc-button-wrapper flex {{ $containerAlign }} my-2 w-full">
    <a href="{{ $target }}" data-lc-el="button" style="{{ $btnStyle }}" class="lc-button {{ $sizeClasses }} {{ $widthClass }} items-center justify-center font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-98 {{ $pulse ? 'animate-pulse' : '' }}">
        {{ $text }}
    </a>
</div>
