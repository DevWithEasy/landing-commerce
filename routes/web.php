<?php

use App\Modules\Cart\Controllers\CartController;
use App\Modules\Checkout\Controllers\CheckoutPageController;
use App\Modules\Checkout\Controllers\CodCheckoutController;
use App\Modules\Customer\Controllers\CustomerAuthController;
use App\Modules\Customer\Controllers\CustomerDashboardController;
use App\Modules\Customer\Controllers\CustomerOrderController;
use App\Modules\Customer\Controllers\OrderTrackingController;
use App\Modules\Customer\Controllers\WishlistController;
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

// Customer Authentication (Guest only)
Route::middleware('guest:customer')->group(function () {
    Route::get('/customer/register', [CustomerAuthController::class, 'showRegister'])->name('customer.register');
    Route::post('/customer/register', [CustomerAuthController::class, 'register'])->name('customer.register.post');
    Route::get('/customer/login', [CustomerAuthController::class, 'showLogin'])->name('customer.login');
    Route::post('/customer/login', [CustomerAuthController::class, 'login'])->name('customer.login.post');
});

// Customer Logout
Route::post('/customer/logout', [CustomerAuthController::class, 'logout'])->name('customer.logout');

// Customer Account Portal (Protected by auth:customer)
Route::middleware('auth:customer')->group(function () {
    Route::get('/customer/dashboard', [CustomerDashboardController::class, 'index'])->name('customer.dashboard');
    Route::get('/customer/orders', [CustomerOrderController::class, 'index'])->name('customer.orders');
    Route::get('/customer/orders/{order:order_number}', [CustomerOrderController::class, 'show'])->name('customer.orders.show');

    // Customer Wishlist
    Route::get('/customer/wishlist', [WishlistController::class, 'index'])->name('customer.wishlist');
    Route::post('/customer/wishlist', [WishlistController::class, 'store'])->name('customer.wishlist.store');
    Route::delete('/customer/wishlist/{id}', [WishlistController::class, 'destroy'])->name('customer.wishlist.destroy');
});

// Public Order Tracking (Accessible to both guests and customers)
Route::get('/track-order', [OrderTrackingController::class, 'show'])->name('order.track.show');
Route::post('/track-order', [OrderTrackingController::class, 'track'])
    ->middleware('throttle:10,1')
    ->name('order.track.post');

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
})->where('slug', '^(?!admin|checkout|login|install|pages|cart|shop|product|category|customer|track-order|wishlist|api|storage|build|_debugbar).*$');
