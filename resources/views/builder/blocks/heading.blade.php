@php
    $allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    $rawTag = strtolower(trim((string) ($props['tag'] ?? 'h2')));
    $tag = in_array($rawTag, $allowedTags, true) ? $rawTag : 'h2';

    $text = (string) ($props['text'] ?? '');
    $align = in_array($props['align'] ?? '', ['left', 'center', 'right'], true) ? $props['align'] : null;

    $customStyle = '';
    if (!empty($props['color'])) {
        $customStyle .= 'color: ' . e(str_replace(['"', ';'], '', (string) $props['color'])) . '; ';
    }
    if (!empty($props['fontSize'])) {
        $customStyle .= 'font-size: ' . e(str_replace(['"', ';'], '', (string) $props['fontSize'])) . '; ';
    }
    if (!empty($props['fontWeight'])) {
        $customStyle .= 'font-weight: ' . e(str_replace(['"', ';'], '', (string) $props['fontWeight'])) . '; ';
    }
    if ($align) {
        $customStyle .= 'text-align: ' . e($align) . '; ';
    }

    $alignClasses = match($align) {
        'center' => 'text-center',
        'right' => 'text-right',
        default => 'text-left',
    };
@endphp

@php
    $baseStyle = '';
    if (preg_match('/style="([^"]*)"/', $styleAttribute, $styleMatch)) {
        $baseStyle = $styleMatch[1];
    }
    $mergedStyle = trim($customStyle.' '.$baseStyle);
    $finalStyleAttribute = $mergedStyle !== '' ? 'style="'.$mergedStyle.'"' : '';
@endphp

<{{ $tag }} id="{{ $id }}" {!! $finalStyleAttribute !!} data-lc-el="title" class="lc-block-root lc-heading font-bold tracking-tight {{ $alignClasses }} break-words">
    {{ $text }}
</{{ $tag }}>
