@php
    $blockId = $block['id'] ?? ('blk_html_' . bin2hex(random_bytes(4)));
    $rawHtml = $props['html'] ?? '';
    $customCss = $props['css'] ?? '';
@endphp

<div id="{{ e($blockId) }}" {!! $styleAttribute !!} data-lc-el="html" class="lc-block-root w-full custom-html-block overflow-hidden relative">
    @if(!empty($customCss))
        <style>
            {!! $customCss !!}
        </style>
    @endif

    {!! $rawHtml !!}
</div>
