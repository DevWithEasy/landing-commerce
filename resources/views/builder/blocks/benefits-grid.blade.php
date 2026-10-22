@php
    $columns = $props['columns'] ?? 3;
    $gridColsClass = match ($columns) {
        2 => 'sm:grid-cols-2',
        4 => 'sm:grid-cols-2 lg:grid-cols-4',
        default => 'sm:grid-cols-2 lg:grid-cols-3',
    };
    $items = $props['items'] ?? [];
@endphp

<section {!! $styleAttribute !!} class="lc-block-root w-full py-16 bg-slate-50 border-y border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        @if(!empty($props['title']))
            <div class="text-center max-w-3xl mx-auto mb-12">
                <h2 data-lc-el="title" class="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {{ $props['title'] }}
                </h2>
            </div>
        @endif

        <div class="grid grid-cols-1 {{ $gridColsClass }} gap-6 sm:gap-8">
            @foreach($items as $item)
                <div data-lc-el="card" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
                    <div data-lc-el="icon" class="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>

                    <h3 data-lc-el="card-title" class="text-lg font-bold text-slate-900 mb-2">
                        {{ $item['title'] ?? '' }}
                    </h3>

                    <p data-lc-el="card-text" class="text-slate-600 text-sm leading-relaxed">
                        {{ $item['description'] ?? '' }}
                    </p>
                </div>
            @endforeach
        </div>
    </div>
</section>
