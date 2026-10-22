@php
    $rawItems = is_array($props['items'] ?? null) ? $props['items'] : [];
    $items = array_values(array_filter($rawItems, 'is_array'));
    $groupId = 'accordion-'.preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($id ?? 'block'));
    $groupId = rtrim($groupId, '-') ?: 'accordion-block';
@endphp

<section {!! $styleAttribute !!} class="lc-block-root w-full bg-white py-12">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        @if(!empty($props['title']))
            <h2 data-lc-el="title" class="mb-8 text-center text-2xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-3xl">
                {{ $props['title'] }}
            </h2>
        @endif

        @if(!empty($items))
            <div class="space-y-3">
                @foreach($items as $item)
                    <details
                        name="{{ $groupId }}"
                        @if($loop->first) open @endif
                        data-lc-el="item"
                        class="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow"
                    >
                        <summary data-lc-el="question" class="flex cursor-pointer list-none select-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50 sm:text-base">
                            <span>{{ $item['title'] ?? '' }}</span>
                            <svg
                                class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </summary>
                        <div data-lc-el="answer" class="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-600">
                            {{ $item['content'] ?? '' }}
                        </div>
                    </details>
                @endforeach
            </div>
        @else
            <div class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm font-medium text-slate-400">
                Add accordion items from the properties panel.
            </div>
        @endif
    </div>
</section>
