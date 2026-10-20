@php
    $content = (string) ($props['content'] ?? '');
    $align = in_array($props['align'] ?? '', ['left', 'center', 'right', 'justify'], true) ? $props['align'] : null;

    $customStyle = '';
    if (!empty($props['color'])) {
        $customStyle .= 'color: ' . e(str_replace(['"', ';'], '', (string) $props['color'])) . '; ';
    }
    if (!empty($props['fontSize'])) {
        $customStyle .= 'font-size: ' . e(str_replace(['"', ';'], '', (string) $props['fontSize'])) . '; ';
    }
    if (!empty($props['lineHeight'])) {
        $customStyle .= 'line-height: ' . e(str_replace(['"', ';'], '', (string) $props['lineHeight'])) . '; ';
    }
    if ($align) {
        $customStyle .= 'text-align: ' . e($align) . '; ';
    }

    $alignClasses = match($align) {
        'center' => 'text-center',
        'right' => 'text-right',
        'justify' => 'text-justify',
        default => 'text-left',
    };
@endphp

<div id="{{ $id }}" {!! $styleAttribute !!} style="{{ $customStyle }}" class="lc-text text-base leading-relaxed {{ $alignClasses }} break-words">
    {!! nl2br(e($content)) !!}
</div>
