<!DOCTYPE html>
<html lang="bn" class="scroll-smooth">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $page->title }} - {{ $storeName }}</title>
    <meta name="description" content="{{ Str::limit(strip_tags($content), 160) }}">
    <link rel="canonical" href="{{ url()->current() }}">

    <meta property="og:type" content="article">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:title" content="{{ $page->title }} - {{ $storeName }}">
    <meta property="og:description" content="{{ Str::limit(strip_tags($content), 160) }}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{{ $page->title }} - {{ $storeName }}">
    <meta name="twitter:description" content="{{ Str::limit(strip_tags($content), 160) }}">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- CSS -->
    @vite(['resources/css/app.css'])

    <style>
        :root {
            --primary-color: {{ e($primaryColor) }};
        }
        body {
            font-family: 'Hind Siliguri', 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen flex flex-col justify-between">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" class="flex items-center space-x-3 text-gray-900 hover:text-indigo-600 transition">
                @if(!empty($logoUrl))
                    <img src="{{ e($logoUrl) }}" alt="{{ e($storeName) }}" class="h-8 w-auto">
                @else
                    <span class="text-xl font-bold tracking-tight text-indigo-600">{{ $storeName }}</span>
                @endif
            </a>
            <a href="/" class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">
                &larr; হোমপেজে ফিরুন
            </a>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
            <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">
                {{ $page->title }}
            </h1>
            <div class="prose prose-indigo max-w-none text-gray-700 leading-relaxed space-y-4">
                {!! $content !!}
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <div class="max-w-6xl mx-auto px-4">
            <p>&copy; {{ date('Y') }} {{ $storeName }}. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
    </footer>
</body>
</html>
