@php
    $items = $props['items'] ?? [];
@endphp

<section {!! $styleAttribute !!} class="w-full py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        @if(!empty($props['title']))
            <div class="text-center max-w-2xl mx-auto mb-12">
                <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {{ $props['title'] }}
                </h2>
                <div class="flex items-center justify-center space-x-1 mt-3">
                    @for($i = 0; $i < 5; $i++)
                        <svg class="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    @endfor
                    <span class="text-sm font-semibold text-slate-700 ml-2">4.9/5 from verified buyers</span>
                </div>
            </div>
        @endif

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @foreach($items as $review)
                <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center space-x-1 mb-3">
                            @php
                                $rating = (int) ($review['rating'] ?? 5);
                            @endphp
                            @for($s = 0; $s < 5; $s++)
                                <svg class="w-4 h-4 {{ $s < $rating ? 'text-amber-400 fill-current' : 'text-gray-300 fill-current' }}" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            @endfor
                        </div>

                        <p class="text-slate-700 text-sm leading-relaxed mb-4 italic">
                            "{{ $review['comment'] ?? '' }}"
                        </p>
                    </div>

                    <div class="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div>
                            <span class="block font-bold text-sm text-slate-900">
                                {{ $review['authorName'] ?? 'Verified Customer' }}
                            </span>
                            @if(!empty($review['location']))
                                <span class="text-xs text-slate-500">
                                    {{ $review['location'] }}
                                </span>
                            @endif
                        </div>

                        @if(!empty($review['verifiedPurchase']))
                            <span class="inline-flex items-center text-xs font-semibold text-emerald-600">
                                <svg class="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                </svg>
                                Verified
                            </span>
                        @endif
                    </div>
                </div>
            @endforeach
        </div>
    </div>
</section>
