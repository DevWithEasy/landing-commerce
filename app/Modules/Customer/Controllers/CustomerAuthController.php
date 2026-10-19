<?php

declare(strict_types=1);

namespace App\Modules\Customer\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Category;
use App\Modules\Customer\Models\Customer;
use App\Modules\Customer\Requests\CustomerLoginRequest;
use App\Modules\Customer\Requests\CustomerRegisterRequest;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAuthController extends Controller
{
    public function __construct(
        protected SettingsService $settings
    ) {}

    /**
     * Show registration page.
     */
    public function showRegister(): Response|RedirectResponse
    {
        if (Auth::guard('customer')->check()) {
            return redirect()->route('customer.dashboard');
        }

        $theme = $this->settings->getStorefrontTheme();
        $categories = Category::active()->root()->get();

        return Inertia::render('Customer/Register', [
            'theme' => $theme,
            'categories' => $categories,
        ]);
    }

    /**
     * Handle customer registration.
     */
    public function register(CustomerRegisterRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $customer = Customer::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        Auth::guard('customer')->login($customer);
        $request->session()->regenerate();

        return redirect()->route('customer.dashboard')->with('success', 'Your account has been created successfully!');
    }

    /**
     * Show login page.
     */
    public function showLogin(Request $request): Response|RedirectResponse
    {
        if (Auth::guard('customer')->check()) {
            return redirect()->route('customer.dashboard');
        }

        $theme = $this->settings->getStorefrontTheme();
        $categories = Category::active()->root()->get();

        return Inertia::render('Customer/Login', [
            'theme' => $theme,
            'categories' => $categories,
        ]);
    }

    /**
     * Handle customer login with throttling.
     */
    public function login(CustomerLoginRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $throttleKey = Str::transliterate(Str::lower($validated['email']).'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return back()->withErrors([
                'email' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        $remember = (bool) ($validated['remember'] ?? false);

        if (! Auth::guard('customer')->attempt([
            'email' => $validated['email'],
            'password' => $validated['password'],
        ], $remember)) {
            RateLimiter::hit($throttleKey);

            return back()->withErrors([
                'email' => 'Invalid email or password.',
            ]);
        }

        $customer = Auth::guard('customer')->user();
        if ($customer && ! $customer->is_active) {
            Auth::guard('customer')->logout();

            return back()->withErrors([
                'email' => 'Your account has been deactivated. Please contact support.',
            ]);
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();

        return redirect()->intended(route('customer.dashboard'));
    }

    /**
     * Handle customer logout.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('customer.login')->with('success', 'You have been logged out.');
    }
}
