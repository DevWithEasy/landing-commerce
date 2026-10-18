<?php

use App\Modules\Checkout\Controllers\CheckoutPageController;
use App\Modules\Checkout\Controllers\CodCheckoutController;
use App\Modules\Installer\Controllers\WebInstallerController;
use App\Modules\Installer\Middleware\EnsureNotInstalledMiddleware;
use App\Modules\PageBuilder\Controllers\PublicLandingPageController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['status' => 'ok', 'app' => 'Landing Commerce']);
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

// Public dynamic landing page route (must remain at the end to avoid capturing system/admin routes)
Route::get('/{slug}', [PublicLandingPageController::class, 'show'])
    ->where('slug', '^(?!admin|checkout|login|install|api|storage|build|_debugbar).*$')
    ->name('landing-page.show');
