<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Landing Commerce') }}</title>

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
