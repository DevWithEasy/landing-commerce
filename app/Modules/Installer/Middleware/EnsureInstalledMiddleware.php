<?php

declare(strict_types=1);

namespace App\Modules\Installer\Middleware;

use App\Modules\Installer\Services\InstallationService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstalledMiddleware
{
    public function __construct(
        protected InstallationService $installationService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Bypass redirect in testing unless explicitly instructed
        if (app()->environment('testing') && ! config('installer.enforce_in_testing', false)) {
            return $next($request);
        }

        // Exclude installer endpoints, health check, and compiled assets
        $path = ltrim($request->path(), '/');
        if (
            str_starts_with($path, 'install') ||
            str_starts_with($path, 'up') ||
            str_starts_with($path, 'build') ||
            str_starts_with($path, 'storage') ||
            $path === 'favicon.ico'
        ) {
            return $next($request);
        }

        if (! $this->installationService->isInstalled()) {
            return redirect()->route('installer.index');
        }

        return $next($request);
    }
}
