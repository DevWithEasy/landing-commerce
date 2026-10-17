<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Product;
use App\Modules\Orders\Models\Order;
use App\Modules\Shipping\Models\District;
use App\Modules\Shipping\Services\ShippingCalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutPageController extends Controller
{
    /**
     * Display the checkout page for a product.
     */
    public function show(?Product $product, ShippingCalculatorService $calculator): Response
    {
        if (! $product || ! $product->exists) {
            $product = Product::where('status', 'active')
                ->with([
                    'variants' => fn ($q) => $q->orderBy('id'),
                    'images' => fn ($q) => $q->orderBy('sort_order'),
                ])
                ->firstOrFail();
        } else {
            $product->load([
                'variants' => fn ($q) => $q->orderBy('id'),
                'images' => fn ($q) => $q->orderBy('sort_order'),
            ]);
        }

        $districts = District::with([
            'upazilas' => fn ($q) => $q->orderBy('name'),
        ])->orderBy('name')->get();

        $defaultCalc = $calculator->calculate('Dhaka');

        return Inertia::render('Checkout/Show', [
            'product' => $product,
            'districts' => $districts,
            'defaultShippingFee' => $defaultCalc->shippingFee,
            'defaultZoneName' => $defaultCalc->zoneName,
        ]);
    }

    /**
     * Calculate dynamic shipping fee based on district and optional upazila.
     */
    public function shippingFee(Request $request, ShippingCalculatorService $calculator): JsonResponse
    {
        $validated = $request->validate([
            'district' => ['required', 'string', 'max:100'],
            'upazila' => ['nullable', 'string', 'max:100'],
        ]);

        $result = $calculator->calculate(
            $validated['district'],
            $validated['upazila'] ?? null
        );

        return response()->json([
            'shipping_fee' => $result->shippingFee,
            'zone_code' => $result->zoneCode,
            'zone_name' => $result->zoneName,
            'delivery_time' => $result->deliveryTime,
        ]);
    }

    /**
     * Display the order confirmation / Thank You page.
     */
    public function thankYou(string $orderNumber): Response
    {
        $order = Order::with('items')
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        $merchantWhatsapp = (string) config('services.whatsapp.merchant_phone', '');

        return Inertia::render('Checkout/ThankYou', [
            'order' => $order,
            'merchantWhatsapp' => $merchantWhatsapp !== '' ? $merchantWhatsapp : null,
        ]);
    }
}
