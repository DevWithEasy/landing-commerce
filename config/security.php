<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | HTTP Security Headers Configuration
    |--------------------------------------------------------------------------
    |
    | Production-ready security headers to protect against common web
    | vulnerabilities including MIME-type sniffing, clickjacking,
    | cross-site scripting (XSS), and data injection attacks.
    |
    */

    'headers' => [
        'x_content_type_options' => env('SECURITY_X_CONTENT_TYPE_OPTIONS', 'nosniff'),

        'x_frame_options' => env('SECURITY_X_FRAME_OPTIONS', 'SAMEORIGIN'),

        'referrer_policy' => env('SECURITY_REFERRER_POLICY', 'strict-origin-when-cross-origin'),

        'permissions_policy' => env('SECURITY_PERMISSIONS_POLICY', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'),

        'x_xss_protection' => env('SECURITY_X_XSS_PROTECTION', '0'),
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP Strict Transport Security (HSTS)
    |--------------------------------------------------------------------------
    |
    | Instructs modern browsers to only connect over HTTPS. Only applied
    | when the incoming request is genuinely encrypted (HTTPS) and
    | when running in the production environment.
    |
    */

    'hsts' => [
        'enabled' => env('SECURITY_HSTS_ENABLED', true),
        'max_age' => (int) env('SECURITY_HSTS_MAX_AGE', 31536000), // 1 year
        'include_subdomains' => env('SECURITY_HSTS_SUBDOMAINS', true),
        'preload' => env('SECURITY_HSTS_PRELOAD', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Content Security Policy (CSP)
    |--------------------------------------------------------------------------
    |
    | Restrictive Content Security Policy designed specifically for Landing
    | Commerce, accommodating Inertia.js, Vite pre-compiled assets, Google
    | Webfonts, AST dynamic styles, and YouTube/Vimeo video embeds.
    |
    */

    'csp' => [
        'enabled' => env('SECURITY_CSP_ENABLED', true),

        'report_only' => env('SECURITY_CSP_REPORT_ONLY', false),

        'directives' => [
            'default-src' => ["'self'"],

            'script-src' => [
                "'self'",
                "'unsafe-inline'", // Required for Vite chunk bootstrapping and Blade countdown timer islands
                'https://connect.facebook.net',
                'https://www.googletagmanager.com',
                'https://www.google-analytics.com',
                'https://analytics.tiktok.com',
            ],

            'style-src' => [
                "'self'",
                "'unsafe-inline'", // Required for Tailwind CSS dynamic utility classes and page builder inline styles
                'https://fonts.googleapis.com',
            ],

            'font-src' => [
                "'self'",
                'https://fonts.gstatic.com',
                'data:',
            ],

            'img-src' => [
                "'self'",
                'data:',
                'blob:',
                'https:', // Required for uploaded product images and barcode SVGs
            ],

            'connect-src' => [
                "'self'",
                'https:',
            ],

            'frame-src' => [
                "'self'",
                'https://www.youtube.com',
                'https://www.youtube-nocookie.com',
                'https://player.vimeo.com',
                'https://www.googletagmanager.com',
            ],

            'frame-ancestors' => ["'self'"],

            'object-src' => ["'none'"],

            'base-uri' => ["'self'"],

            'form-action' => [
                "'self'",
                'https://wa.me',
                'https://api.whatsapp.com',
            ],
        ],
    ],
];
