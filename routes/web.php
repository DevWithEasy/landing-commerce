<?php

use App\Modules\Checkout\Controllers\CodCheckoutController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['status' => 'ok', 'app' => 'Landing Commerce']);
});

Route::post('/checkout/cod', [CodCheckoutController::class, 'store'])->name('checkout.cod.store');

require __DIR__.'/admin.php';
