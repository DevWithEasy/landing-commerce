<?php

declare(strict_types=1);

namespace App\Modules\Installer\Middleware;

use App\Modules\Installer\Services\InstallationService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotInstalledMiddleware
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
        if ($this->installationService->isInstalled()) {
            abort(404, 'Installation has already been completed.');
        }

        return $next($request);
    }
}
