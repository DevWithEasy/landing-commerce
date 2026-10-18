<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Landing Commerce') }}</title>

        {{-- Google Fonts for Page Builder Typography (Hind Siliguri, Tiro Bangla, Inter) --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Tiro+Bangla:ital@0;1&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

        @viteReactRefresh
        @vite(['resources/js/app.tsx', 'resources/css/app.css'])
        @inertiaHead

        {{-- Marketing Pixels & Analytics (Public Routes Only) --}}
        @php
            $isPublicRoute = ! request()->is('admin*') && ! request()->is('login*');
            $trackingService = app(\App\Modules\Tracking\Services\TrackingService::class);
            $globalTracking = $isPublicRoute ? $trackingService->getResolvedSettings() : null;
        @endphp
        @if($isPublicRoute && $globalTracking)
            {!! $trackingService->renderHeadScripts($globalTracking) !!}
        @endif
    </head>
    <body class="font-sans antialiased">
        @if($isPublicRoute && $globalTracking)
            {!! $trackingService->renderBodyScripts($globalTracking) !!}
        @endif
        @inertia
    </body>
</html>
