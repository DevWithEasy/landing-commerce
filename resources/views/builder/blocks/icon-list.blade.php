@php
    $rawItems = is_array($props['items'] ?? null) ? $props['items'] : [];
    $items = array_values(array_filter($rawItems, 'is_array'));
    $listType = ($props['listType'] ?? 'ul') === 'ol' ? 'ol' : 'ul';
    $showMarkers = !isset($props['showMarkers'])
        || filter_var($props['showMarkers'], FILTER_VALIDATE_BOOLEAN);
    $showDividers = !isset($props['showDividers'])
        || filter_var($props['showDividers'], FILTER_VALIDATE_BOOLEAN);
    $itemSpacing = isset($props['itemSpacing']) && is_numeric($props['itemSpacing'])
        ? max(0, min(48, (int) $props['itemSpacing']))
        : 12;
@endphp

<section {!! $styleAttribute !!} class="lc-block-root w-full bg-white py-12">
    <div class="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 [.lc-container_&]:max-w-none [.lc-container_&]:px-0 [.lc-grid_&]:max-w-none [.lc-grid_&]:px-0">
        @if(!empty($props['title']))
            <h2 data-lc-el="title" class="mb-8 text-center text-2xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-3xl">
                {{ $props['title'] }}
            </h2>
        @endif

        @if(!empty($items))
            @if($listType === 'ol')
                <ol class="flex list-none flex-col pl-0" style="row-gap: {{ $itemSpacing }}px">
            @else
                <ul class="flex list-none flex-col pl-0" style="row-gap: {{ $itemSpacing }}px">
            @endif
                @foreach($items as $item)
                    <li data-lc-el="item" class="rounded-2xl bg-slate-50/80 px-4 py-3.5 sm:px-5 {{ $showDividers ? 'border border-slate-100' : 'border border-transparent' }}">
                        <div class="flex items-start gap-1.5">
                            @if($showMarkers)
                                <span data-lc-el="marker" class="mt-0.5 shrink-0 text-sm font-bold leading-relaxed text-slate-500" aria-hidden="true">
                                    {{ $listType === 'ol' ? $loop->iteration . '.' : '•' }}
                                </span>
                            @endif
                            <strong data-lc-el="text" class="flex-1 text-sm font-bold leading-relaxed text-slate-800 sm:text-base">
                                {{ $item['text'] ?? '' }}
                            </strong>
                        </div>
                    </li>
                @endforeach
            @if($listType === 'ol')
                </ol>
            @else
                </ul>
            @endif
        @endif
    </div>
</section>
