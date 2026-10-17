<?php

use App\Modules\Checkout\Controllers\CheckoutPageController;
use App\Modules\Checkout\Controllers\CodCheckoutController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['status' => 'ok', 'app' => 'Landing Commerce']);
});

Route::get('/checkout/{product:slug?}', [CheckoutPageController::class, 'show'])->name('checkout.show');
Route::post('/checkout/shipping-fee', [CheckoutPageController::class, 'shippingFee'])->name('checkout.shipping-fee');
Route::post('/checkout/cod', [CodCheckoutController::class, 'store'])->name('checkout.cod.store');
Route::get('/checkout/thank-you/{order:order_number}', [CheckoutPageController::class, 'thankYou'])->name('checkout.thank-you');

require __DIR__.'/admin.php';
