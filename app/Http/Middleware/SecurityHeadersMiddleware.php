<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // 1. Standard Security Headers
        $this->applyStandardHeaders($response);

        // 2. HTTP Strict Transport Security (HSTS)
        $this->applyHstsHeader($request, $response);

        // 3. Content Security Policy (CSP)
        $this->applyCspHeader($response);

        // 4. Sensitive Path Anti-Caching
        $this->applyAntiCachingOnSensitiveRoutes($request, $response);

        return $response;
    }

    /**
     * Apply fundamental defensive HTTP headers.
     */
    protected function applyStandardHeaders(Response $response): void
    {
        $headers = config('security.headers', []);

        if (! empty($headers['x_content_type_options'])) {
            $response->headers->set('X-Content-Type-Options', $headers['x_content_type_options']);
        }

        if (! empty($headers['x_frame_options'])) {
            $response->headers->set('X-Frame-Options', $headers['x_frame_options']);
        }

        if (! empty($headers['referrer_policy'])) {
            $response->headers->set('Referrer-Policy', $headers['referrer_policy']);
        }

        if (! empty($headers['permissions_policy'])) {
            $response->headers->set('Permissions-Policy', $headers['permissions_policy']);
        }

        if (isset($headers['x_xss_protection'])) {
            $response->headers->set('X-XSS-Protection', (string) $headers['x_xss_protection']);
        }
    }

    /**
     * Apply Strict-Transport-Security (HSTS) only on HTTPS requests in production.
     */
    protected function applyHstsHeader(Request $request, Response $response): void
    {
        $isProduction = app()->environment('production') || config('app.env') === 'production';
        $isHttps = $request->isSecure() || $request->header('X-Forwarded-Proto') === 'https' || $request->server('HTTPS') === 'on';
        $hstsConfig = config('security.hsts', []);

        if ($isProduction && $isHttps && ($hstsConfig['enabled'] ?? true)) {
            $maxAge = (int) ($hstsConfig['max_age'] ?? 31536000);
            $parts = ["max-age={$maxAge}"];

            if ($hstsConfig['include_subdomains'] ?? true) {
                $parts[] = 'includeSubDomains';
            }

            if (! empty($hstsConfig['preload'])) {
                $parts[] = 'preload';
            }

            $response->headers->set('Strict-Transport-Security', implode('; ', $parts));
        }
    }

    /**
     * Compile and apply Content Security Policy (CSP) header.
     */
    protected function applyCspHeader(Response $response): void
    {
        $cspConfig = config('security.csp', []);

        if (! ($cspConfig['enabled'] ?? true)) {
            return;
        }

        $directives = $cspConfig['directives'] ?? [];
        if (empty($directives)) {
            return;
        }

        $isLocal = app()->environment('local', 'development');
        $policyParts = [];

        foreach ($directives as $directive => $sources) {
            $sourceList = (array) $sources;

            // In local development, permit Vite HMR connections
            if ($isLocal && $directive === 'connect-src') {
                $sourceList = array_unique(array_merge($sourceList, ['ws:', 'wss:', 'http:']));
            }

            $policyParts[] = $directive.' '.implode(' ', $sourceList);
        }

        $policyString = implode('; ', $policyParts);
        $headerName = ($cspConfig['report_only'] ?? false)
            ? 'Content-Security-Policy-Report-Only'
            : 'Content-Security-Policy';

        $response->headers->set($headerName, $policyString);
    }

    /**
     * Ensure sensitive administrative and checkout endpoints are never stored by shared caches.
     */
    protected function applyAntiCachingOnSensitiveRoutes(Request $request, Response $response): void
    {
        $path = ltrim($request->path(), '/');

        if (
            str_starts_with($path, 'admin') ||
            str_starts_with($path, 'checkout') ||
            str_starts_with($path, 'login') ||
            str_starts_with($path, 'api')
        ) {
            $response->headers->addCacheControlDirective('no-store', true);
            $response->headers->addCacheControlDirective('no-cache', true);
            $response->headers->addCacheControlDirective('must-revalidate', true);
            $response->headers->addCacheControlDirective('max-age', '0');
            $response->headers->addCacheControlDirective('private', true);
            $response->headers->set('Pragma', 'no-cache');
        }
    }
}
