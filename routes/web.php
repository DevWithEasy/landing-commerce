<?php

use App\Modules\Cart\Controllers\CartController;
use App\Modules\Checkout\Controllers\CheckoutPageController;
use App\Modules\Checkout\Controllers\CodCheckoutController;
use App\Modules\Installer\Controllers\WebInstallerController;
use App\Modules\Installer\Middleware\EnsureNotInstalledMiddleware;
use App\Modules\PageBuilder\Controllers\PublicLandingPageController;
use App\Modules\PageBuilder\Controllers\PublicPolicyPageController;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\Storefront\Controllers\StorefrontHomeController;
use App\Modules\Storefront\Controllers\StorefrontProductController;
use App\Modules\Storefront\Controllers\StorefrontShopController;
use Illuminate\Support\Facades\Route;

Route::get('/', [StorefrontHomeController::class, 'index'])->name('home');

// Storefront Catalog & Product Routes
Route::get('/shop', [StorefrontShopController::class, 'index'])->name('shop.index');
Route::get('/category/{slug}', [StorefrontShopController::class, 'category'])->name('category.show');
Route::get('/product/{slug}', [StorefrontProductController::class, 'show'])->name('product.show');

// Server-Authoritative Shopping Cart Routes
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::get('/cart/summary', [CartController::class, 'summary'])->name('cart.summary');
Route::post('/cart/items', [CartController::class, 'store'])->name('cart.items.store');
Route::patch('/cart/items/{id}', [CartController::class, 'update'])->name('cart.items.update');
Route::delete('/cart/items/{id}', [CartController::class, 'destroy'])->name('cart.items.destroy');
Route::delete('/cart', [CartController::class, 'clear'])->name('cart.clear');

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
Route::get('/{slug}', function (string $slug) {
    $landingPage = LandingPage::where('slug', $slug)
        ->where('status', 'published')
        ->first();

    if ($landingPage) {
        return redirect()->to("/p/{$slug}");
    }

    abort(404);
})->where('slug', '^(?!admin|checkout|login|install|pages|cart|shop|product|category|api|storage|build|_debugbar).*$');
