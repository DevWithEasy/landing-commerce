<?php

use App\Modules\Catalog\Controllers\ProductController;
use App\Modules\Catalog\Controllers\ProductImageController;
use App\Modules\Orders\Controllers\OrderController;
use App\Modules\PageBuilder\Controllers\LandingPageBuilderController;
use App\Modules\PageBuilder\Controllers\LandingPageRevisionController;
use Illuminate\Support\Facades\Route;

// Login placeholder endpoint to prevent undefined route errors for unauthenticated requests
Route::get('login', function () {
    return response()->json([
        'message' => 'Unauthenticated. Merchant login interface is planned in the upcoming authentication milestone.',
    ], 401);
})->name('login');

Route::middleware(['web', 'auth'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', function () {
        return redirect()->route('admin.products.index');
    })->name('dashboard');

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
    Route::resource('orders', OrderController::class)->only(['index', 'show']);

    // Page Builder & Landing Pages
    Route::get('landing-pages/{landing_page}/builder', [LandingPageBuilderController::class, 'edit'])
        ->name('landing-pages.builder');
    Route::post('landing-pages/{landing_page}/revisions', [LandingPageRevisionController::class, 'store'])
        ->name('landing-pages.revisions.store');
});
