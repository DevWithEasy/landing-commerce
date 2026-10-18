<?php

declare(strict_types=1);

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Maximum login attempts before lockout.
     */
    protected const MAX_ATTEMPTS = 5;

    /**
     * Lockout decay time in seconds (1 minute).
     */
    protected const DECAY_SECONDS = 60;

    /**
     * Display the admin login form.
     */
    public function showLogin(): Response|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Admin/Auth/Login');
    }

    /**
     * Authenticate an admin user with strict brute-force rate limiting.
     *
     * @throws ValidationException
     */
    public function login(Request $request): RedirectResponse|JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $throttleKey = $this->throttleKey($request);

        // Check rate limiting
        if (RateLimiter::tooManyAttempts($throttleKey, static::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            abort(429, "Too many login attempts. Please try again in {$seconds} seconds.");
        }

        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (! Auth::attempt($credentials, $remember)) {
            RateLimiter::hit($throttleKey, static::DECAY_SECONDS);

            throw ValidationException::withMessages([
                'email' => [
                    'These credentials do not match our records.',
                ],
            ]);
        }

        // Reset rate limiter on successful authentication
        RateLimiter::clear($throttleKey);

        $request->session()->regenerate();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'user' => Auth::user(),
                'redirect' => route('admin.dashboard'),
            ]);
        }

        return redirect()->intended(route('admin.dashboard'));
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request): RedirectResponse|JsonResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'redirect' => route('login'),
            ]);
        }

        return redirect()->route('login');
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    protected function throttleKey(Request $request): string
    {
        $normalizedEmail = Str::lower(trim((string) $request->input('email')));

        return Str::transliterate($normalizedEmail.'|'.$request->ip());
    }
}
