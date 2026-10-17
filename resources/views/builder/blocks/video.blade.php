@php
    $rawUrl = $props['videoUrl'] ?? '';
    $embedUrl = \App\Modules\PageBuilder\Services\BlockRendererService::formatVideoEmbedUrl($rawUrl);
    $aspectRatio = $props['aspectRatio'] ?? '16:9';
    $aspectClass = match ($aspectRatio) {
        '4:3' => 'aspect-[4/3]',
        '1:1' => 'aspect-square',
        default => 'aspect-video',
    };
@endphp

<section {!! $styleAttribute !!} class="w-full py-12 bg-white">
    <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800 {{ $aspectClass }}">
            @if(!empty($embedUrl))
                <iframe
                    src="{{ e($embedUrl) }}"
                    title="Product Video Showcase"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    class="w-full h-full border-0"
                ></iframe>
            @else
                <div class="w-full h-full flex items-center justify-center text-slate-500">
                    <span class="text-sm">No video configured</span>
                </div>
            @endif
        </div>
    </div>
</section>
