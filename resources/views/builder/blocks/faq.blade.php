@php
    $items = $props['items'] ?? [];
@endphp

<section {!! $styleAttribute !!} class="lc-block-root w-full py-16 bg-slate-50 border-t border-slate-200">
    <div class="max-w-3xl mx-auto px-4 sm:px-6">
        @if(!empty($props['title']))
            <div class="text-center mb-10">
                <h2 data-lc-el="title" class="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {{ $props['title'] }}
                </h2>
            </div>
        @endif

        <div class="space-y-4">
            @foreach($items as $faq)
                <details data-lc-el="item" class="group bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition open:shadow-sm">
                    <summary data-lc-el="question" class="flex justify-between items-center font-bold text-base text-slate-900 cursor-pointer list-none select-none">
                        <span>{{ $faq['question'] ?? '' }}</span>
                        <span class="ml-4 flex-shrink-0 text-slate-400 group-open:rotate-180 transition-transform duration-200">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </summary>
                    <div data-lc-el="answer" class="mt-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {{ $faq['answer'] ?? '' }}
                    </div>
                </details>
            @endforeach
        </div>
    </div>
</section>
