@php
    $direction = (string) ($props['direction'] ?? 'col');
    $gap = is_numeric($props['gap'] ?? null) ? (int) $props['gap'] : 16;
    $alignItems = (string) ($props['alignItems'] ?? 'stretch');
    $justifyContent = (string) ($props['justifyContent'] ?? 'start');
    $wrap = (bool) ($props['wrap'] ?? false);

    $alignMap = [
        'start' => 'items-start',
        'center' => 'items-center',
        'end' => 'items-end',
        'stretch' => 'items-stretch',
    ];

    $justifyMap = [
        'start' => 'justify-start',
        'center' => 'justify-center',
        'end' => 'justify-end',
        'between' => 'justify-between',
        'around' => 'justify-around',
    ];

    $flexDirClass = $direction === 'row' ? 'flex flex-col md:flex-row' : 'flex flex-col';
    $alignClass = $alignMap[$alignItems] ?? 'items-stretch';
    $justifyClass = $justifyMap[$justifyContent] ?? 'justify-start';
    $wrapClass = $wrap ? 'flex-wrap' : '';
    $mergedStyle = trim('gap: '.$gap.'px; '.($inlineCss ?? ''));
@endphp

<div
    id="{{ $id }}"
    style="{{ $mergedStyle }}"
    data-lc-el="container"
    class="lc-block-root lc-container w-full max-w-7xl mx-auto px-4 sm:px-6 {{ $flexDirClass }} {{ $alignClass }} {{ $justifyClass }} {{ $wrapClass }}"
>
    {!! $childrenHtml !!}
</div>
