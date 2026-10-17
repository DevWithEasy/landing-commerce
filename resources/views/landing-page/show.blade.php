@php
    $pageTitle = $metaSeo['title'] ?? $landingPage->title;
    $metaDescription = $metaSeo['description'] ?? ($metaSeo['og_description'] ?? 'Exclusive deals and nationwide cash on delivery across Bangladesh.');
    $ogImage = $metaSeo['og_image'] ?? ($landingPage->product?->primaryImage?->url ?? '');
    $primaryColor = $settings['primaryColor'] ?? '#16a34a';
    $backgroundColor = $settings['backgroundColor'] ?? '#ffffff';
    $fontFamily = $settings['fontFamily'] ?? 'Inter, sans-serif';
@endphp
<!DOCTYPE html>
<html lang="bn" class="scroll-smooth">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- SEO Meta Tags --}}
    <title>{{ $pageTitle }}</title>
    <meta name="description" content="{{ e($metaDescription) }}">
    @if(!empty($metaSeo['keywords']))
        <meta name="keywords" content="{{ e($metaSeo['keywords']) }}">
    @endif

    {{-- Open Graph / Facebook --}}
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:title" content="{{ e($pageTitle) }}">
    <meta property="og:description" content="{{ e($metaDescription) }}">
    @if(!empty($ogImage))
        <meta property="og:image" content="{{ e($ogImage) }}">
    @endif

    {{-- Twitter --}}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="{{ url()->current() }}">
    <meta name="twitter:title" content="{{ e($pageTitle) }}">
    <meta name="twitter:description" content="{{ e($metaDescription) }}">
    @if(!empty($ogImage))
        <meta name="twitter:image" content="{{ e($ogImage) }}">
    @endif

    {{-- Dynamic Theme & Typography Tokens --}}
    <style>
        :root {
            --primary-color: {{ e($primaryColor) }};
        }
        body {
            background-color: {{ e($backgroundColor) }};
            font-family: {{ e($fontFamily) }};
        }
    </style>

    {{-- Pre-compiled CSS & Fonts --}}
    @vite(['resources/css/app.css'])
</head>
<body class="font-sans antialiased text-slate-800">
    <div class="min-h-screen flex flex-col justify-between">
        <main>
            {!! $renderedBlocksHtml !!}
        </main>

        <footer class="py-6 text-center text-xs text-slate-400 bg-slate-900 border-t border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6">
                <p>&copy; {{ date('Y') }} {{ config('app.name', 'Landing Commerce') }}. All rights reserved.</p>
            </div>
        </footer>
    </div>

    {{-- Progressive vanilla JS for countdown timers if present --}}
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            var timers = document.querySelectorAll('[data-target]');
            timers.forEach(function (el) {
                var targetStr = el.getAttribute('data-target');
                if (!targetStr) return;
                var target = new Date(targetStr).getTime();
                if (isNaN(target)) return;

                var boxes = el.querySelectorAll('.font-mono');
                if (boxes.length < 4) return;

                var interval = setInterval(function () {
                    var now = new Date().getTime();
                    var diff = Math.max(0, target - now);

                    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                    var minutes = Math.floor((diff / (1000 * 60)) % 60);
                    var seconds = Math.floor((diff / 1000) % 60);

                    boxes[0].innerText = String(days).padStart(2, '0');
                    boxes[1].innerText = String(hours).padStart(2, '0');
                    boxes[2].innerText = String(minutes).padStart(2, '0');
                    boxes[3].innerText = String(seconds).padStart(2, '0');

                    if (diff <= 0) {
                        clearInterval(interval);
                    }
                }, 1000);
            });
        });
    </script>
</body>
</html>
