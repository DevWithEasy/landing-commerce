@php
    $targetDate = $props['targetDate'] ?? '';
    $timestamp = $targetDate ? strtotime($targetDate) : false;
    $now = time();
    $isExpired = $timestamp ? ($timestamp <= $now) : false;
    $diff = $timestamp && !$isExpired ? max(0, $timestamp - $now) : 0;

    $days = floor($diff / 86400);
    $hours = floor(($diff % 86400) / 3600);
    $minutes = floor(($diff % 3600) / 60);
    $seconds = $diff % 60;
@endphp

@if(!$isExpired || ($props['expiryAction'] ?? 'show_message') !== 'hide')
<section {!! $styleAttribute !!} class="lc-block-root w-full py-8 text-rose-900 bg-rose-50 border-y border-rose-200">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        @if($isExpired)
            <div class="font-bold text-lg text-rose-700">
                {{ $props['expiryMessage'] ?? 'This limited time promotion has concluded.' }}
            </div>
        @else
            <div>
                <div data-lc-el="headline" class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-200/80 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3">
                    <svg class="w-4 h-4 text-rose-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.316.492-.59 1.05-.85 1.63-.526 1.173-1.002 2.456-1.523 3.734-.144.354-.294.708-.45 1.055a4 4 0 106.35 4.887 7.02 7.02 0 00.75-2.887c0-2.433-.943-4.526-2.455-8.904z" clip-rule="evenodd" />
                    </svg>
                    <span>{{ $props['headline'] ?? 'Urgent Limited Deal' }}</span>
                </div>

                @if(!empty($props['urgencyText']))
                    <p data-lc-el="urgency" class="text-sm font-semibold mb-4 text-rose-800">
                        {{ $props['urgencyText'] }}
                    </p>
                @endif

                <div class="flex items-center justify-center space-x-2 sm:space-x-4" data-target="{{ e($targetDate) }}">
                    <div class="flex flex-col items-center">
                        <div data-lc-el="timebox" class="w-14 sm:w-16 h-14 sm:h-16 bg-white rounded-xl shadow-md border border-rose-200 flex items-center justify-center font-extrabold text-2xl sm:text-3xl text-rose-600 font-mono">
                            {{ sprintf('%02d', $days) }}
                        </div>
                        <span data-lc-el="timer-label" class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 mt-1.5">Days</span>
                    </div>

                    <span class="text-2xl font-bold text-rose-400">:</span>

                    <div class="flex flex-col items-center">
                        <div data-lc-el="timebox" class="w-14 sm:w-16 h-14 sm:h-16 bg-white rounded-xl shadow-md border border-rose-200 flex items-center justify-center font-extrabold text-2xl sm:text-3xl text-rose-600 font-mono">
                            {{ sprintf('%02d', $hours) }}
                        </div>
                        <span data-lc-el="timer-label" class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 mt-1.5">Hours</span>
                    </div>

                    <span class="text-2xl font-bold text-rose-400">:</span>

                    <div class="flex flex-col items-center">
                        <div data-lc-el="timebox" class="w-14 sm:w-16 h-14 sm:h-16 bg-white rounded-xl shadow-md border border-rose-200 flex items-center justify-center font-extrabold text-2xl sm:text-3xl text-rose-600 font-mono">
                            {{ sprintf('%02d', $minutes) }}
                        </div>
                        <span data-lc-el="timer-label" class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 mt-1.5">Minutes</span>
                    </div>

                    <span class="text-2xl font-bold text-rose-400">:</span>

                    <div class="flex flex-col items-center">
                        <div data-lc-el="timebox" class="w-14 sm:w-16 h-14 sm:h-16 bg-white rounded-xl shadow-md border border-rose-200 flex items-center justify-center font-extrabold text-2xl sm:text-3xl text-rose-600 font-mono">
                            {{ sprintf('%02d', $seconds) }}
                        </div>
                        <span data-lc-el="timer-label" class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 mt-1.5">Seconds</span>
                    </div>
                </div>
            </div>
        @endif
    </div>
</section>
@endif
