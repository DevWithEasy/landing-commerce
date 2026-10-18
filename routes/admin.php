<?php

use App\Modules\Auth\Controllers\AuthController;
use App\Modules\Catalog\Controllers\ProductController;
use App\Modules\Catalog\Controllers\ProductImageController;
use App\Modules\Orders\Controllers\OrderController;
use App\Modules\Orders\Controllers\OrderCourierController;
use App\Modules\PageBuilder\Controllers\LandingPageBuilderController;
use App\Modules\PageBuilder\Controllers\LandingPageController;
use App\Modules\PageBuilder\Controllers\LandingPageRevisionController;
use App\Modules\Payments\Controllers\PaymentMethodController;
use App\Modules\Settings\Controllers\SettingController;
use App\Modules\Shipping\Controllers\ShippingMethodController;
use App\Modules\Sms\Controllers\OrderSmsController;
use App\Modules\Tracking\Controllers\TrackingSettingsController;
use Illuminate\Support\Facades\Route;

// Authentication & Session Routes (with brute-force rate limiting)
Route::middleware(['web'])->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1')->name('login.attempt');
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
});

Route::middleware(['web', 'auth'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', function () {
        $user = auth()->user();
        if ($user && $user->isFulfillmentAgent()) {
            return redirect()->route('admin.orders.index');
        }

        return redirect()->route('admin.products.index');
    })->name('dashboard');

    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    Route::post('products/matrix-preview', [ProductController::class, 'previewMatrix'])
        ->name('products.matrix-preview');

    Route::resource('products', ProductController::class);

    Route::post('products/{product}/images', [ProductImageController::class, 'store'])
        ->name('products.images.store');
    Route::delete('products/{product}/images/{image}', [ProductImageController::class, 'destroy'])
        ->name('products.images.destroy');
    Route::post('products/{product}/images/{image}/primary', [ProductImageController::class, 'setPrimary'])
        ->name('products.images.primary');

    // Orders & Fulfillment Pipeline
    Route::get('orders/export', [OrderController::class, 'export'])->name('orders.export');
    Route::post('orders/bulk-transition', [OrderController::class, 'bulkTransition'])->name('orders.bulk-transition');
    Route::get('orders/{order}/invoice', [OrderController::class, 'invoice'])->name('orders.invoice');
    Route::post('orders/{order}/transition', [OrderController::class, 'transition'])->name('orders.transition');
    Route::post('orders/{order}/courier/dispatch', [OrderCourierController::class, 'dispatchOrder'])->name('orders.courier.dispatch');
    Route::post('orders/{order}/courier/track', [OrderCourierController::class, 'trackOrder'])->name('orders.courier.track');
    Route::post('orders/{order}/sms/send', [OrderSmsController::class, 'sendOrderSms'])->name('orders.sms.send');
    Route::resource('orders', OrderController::class)->only(['index', 'show']);

    // Page Builder & Landing Pages Management
    Route::post('landing-pages/{landing_page}/publish', [LandingPageController::class, 'publish'])
        ->name('landing-pages.publish');
    Route::post('landing-pages/{landing_page}/unpublish', [LandingPageController::class, 'unpublish'])
        ->name('landing-pages.unpublish');
    Route::get('landing-pages/{landing_page}/builder', [LandingPageBuilderController::class, 'edit'])
        ->name('landing-pages.builder');
    Route::post('landing-pages/{landing_page}/revisions', [LandingPageRevisionController::class, 'store'])
        ->name('landing-pages.revisions.store');
    Route::post('landing-pages/{landing_page}/revisions/{revision}/restore', [LandingPageRevisionController::class, 'restore'])
        ->name('landing-pages.revisions.restore');
    Route::resource('landing-pages', LandingPageController::class)->except(['create', 'show', 'edit']);

    // Settings & Integration Credentials Management
    Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
    Route::post('settings', [SettingController::class, 'update'])->name('settings.update');

    // Marketing Pixels & Analytics Tracking Management
    Route::get('tracking', [TrackingSettingsController::class, 'index'])->name('tracking.index');
    Route::post('tracking', [TrackingSettingsController::class, 'update'])->name('tracking.update');
    Route::post('tracking/landing-pages/{landing_page}', [TrackingSettingsController::class, 'updatePage'])->name('tracking.page.update');

    // Shipping Methods Management
    Route::post('shipping-methods/{shipping_method}/toggle', [ShippingMethodController::class, 'toggle'])
        ->name('shipping-methods.toggle');
    Route::resource('shipping-methods', ShippingMethodController::class)->except(['create', 'show', 'edit']);

    // Payment Methods Management
    Route::post('payment-methods/{payment_method}/toggle', [PaymentMethodController::class, 'toggle'])
        ->name('payment-methods.toggle');
    Route::resource('payment-methods', PaymentMethodController::class)->except(['create', 'show', 'edit']);
});
