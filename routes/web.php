<?php

use App\Modules\Catalog\Models\Category;
use App\Modules\Checkout\Controllers\CheckoutPageController;
use App\Modules\Checkout\Controllers\CodCheckoutController;
use App\Modules\Installer\Controllers\WebInstallerController;
use App\Modules\Installer\Middleware\EnsureNotInstalledMiddleware;
use App\Modules\PageBuilder\Controllers\PublicLandingPageController;
use App\Modules\PageBuilder\Controllers\PublicPolicyPageController;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Services\BlockRendererService;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function (BlockRendererService $renderer, Request $request, SettingsService $settingsService) {
    if ($request->wantsJson()) {
        return response()->json(['status' => 'ok', 'app' => 'Landing Commerce']);
    }

    try {
        $mode = (string) $settingsService->get('storefront.mode', 'full_storefront');

        if ($mode === 'landing_page_home') {
            $homeLandingPageId = $settingsService->get('storefront.home_landing_page_id');
            $landingPage = null;

            if ($homeLandingPageId) {
                $landingPage = LandingPage::where('id', $homeLandingPageId)
                    ->where('status', 'published')
                    ->first();
            }

            if (! $landingPage) {
                $landingPage = LandingPage::where('is_default', true)
                    ->where('status', 'published')
                    ->first()
                    ?? LandingPage::where('status', 'published')->first();
            }

            if ($landingPage) {
                return app(PublicLandingPageController::class)->show($landingPage->slug, $renderer, $request);
            }
        }

        // Full Storefront Mode
        $categories = Category::toTree(true);

        return view('storefront.home', [
            'storeName' => $settingsService->get('store.name', config('app.name', 'Landing Commerce')),
            'storePhone' => $settingsService->get('store.phone', ''),
            'storeWhatsapp' => $settingsService->get('store.whatsapp', ''),
            'logoUrl' => $settingsService->get('store.logo_url', ''),
            'primaryColor' => $settingsService->get('theme.primary_color', '#4f46e5'),
            'categories' => $categories,
        ]);
    } catch (Throwable) {
        // Fall through to basic status if database is not ready or migrated
        return response()->json(['status' => 'ok', 'app' => 'Landing Commerce']);
    }
});

// One-time Web Installer routes (locked out permanently once installed)
Route::middleware([EnsureNotInstalledMiddleware::class])
    ->prefix('install')
    ->name('installer.')
    ->group(function () {
        Route::get('/', [WebInstallerController::class, 'index'])->name('index');
        Route::post('/database', [WebInstallerController::class, 'postDatabase'])->name('database.post');
        Route::get('/schema', [WebInstallerController::class, 'showSchema'])->name('schema');
        Route::post('/schema', [WebInstallerController::class, 'postSchema'])->name('schema.post');
        Route::get('/admin', [WebInstallerController::class, 'showAdmin'])->name('admin');
        Route::post('/admin', [WebInstallerController::class, 'postAdmin'])->name('admin.post');
    });

Route::get('/checkout/{product:slug?}', [CheckoutPageController::class, 'show'])->name('checkout.show');
Route::post('/checkout/shipping-fee', [CheckoutPageController::class, 'shippingFee'])->name('checkout.shipping-fee');
Route::post('/checkout/cod', [CodCheckoutController::class, 'store'])->name('checkout.cod.store');
Route::get('/checkout/thank-you/{order:order_number}', [CheckoutPageController::class, 'thankYou'])->name('checkout.thank-you');

require __DIR__.'/admin.php';

// Public policy & content pages route (/pages/{slug})
Route::get('/pages/{slug}', [PublicPolicyPageController::class, 'show'])
    ->name('pages.show');

// Public dynamic landing page route (/p/{slug})
Route::get('/p/{slug}', [PublicLandingPageController::class, 'show'])
    ->name('landing-page.show');

// Legacy & direct landing page route (/{slug})
Route::get('/{slug}', [PublicLandingPageController::class, 'show'])
    ->where('slug', '^(?!admin|checkout|login|install|pages|cart|shop|product|category|api|storage|build|_debugbar).*$');
