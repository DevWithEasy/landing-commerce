<?php

use App\Modules\Catalog\Controllers\ProductController;
use App\Modules\Catalog\Controllers\ProductImageController;
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
});
