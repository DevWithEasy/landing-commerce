<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cart\Services\CartManagerService;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Orders\Models\Order;
use App\Modules\Payments\Models\PaymentMethod;
use App\Modules\Settings\Services\SettingsService;
use App\Modules\Shipping\Models\ShippingMethod;
use App\Modules\Shipping\Services\ShippingCalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutPageController extends Controller
{
    /**
     * Display the checkout page for a direct product or shopping cart.
     */
    public function show(
        ?Product $product,
        ShippingCalculatorService $calculator,
        SettingsService $settings
    ): Response {
        $cartManager = app(CartManagerService::class);
        $cart = $cartManager->getCart(request());
        $cartSummary = $cart ? $cart->toSummaryArray() : null;

        $hasCartItems = $cartSummary && ! empty($cartSummary['items']);
        $isDirectProduct = $product && $product->exists;

        // If direct product specified or cart is empty, run in direct mode
        if ($isDirectProduct || ! $hasCartItems) {
            $mode = 'direct';

            if (! $product || ! $product->exists) {
                $product = Product::where('status', 'active')
                    ->with([
                        'variants' => fn ($q) => $q->orderBy('id')->with(['images' => fn ($img) => $img->orderBy('sort_order')]),
                        'images' => fn ($q) => $q->orderBy('sort_order'),
                    ])
                    ->firstOrFail();
            } else {
                $product->load([
                    'variants' => fn ($q) => $q->orderBy('id')->with(['images' => fn ($img) => $img->orderBy('sort_order')]),
                    'images' => fn ($q) => $q->orderBy('sort_order'),
                ]);
            }
        } else {
            $mode = 'cart';
            // Also load first active product as a safe fallback reference if needed
            $product = Product::where('status', 'active')
                ->with([
                    'variants' => fn ($q) => $q->orderBy('id')->with(['images' => fn ($img) => $img->orderBy('sort_order')]),
                    'images' => fn ($q) => $q->orderBy('sort_order'),
                ])
                ->first();
        }

        // All active delivery methods and payment methods are managed in the admin
        // panel; the checkout page renders them as-is without a hardcoded list.
        $shippingMethods = ShippingMethod::active()
            ->orderBy('shipping_zone_id')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        // Zone default remains a safe fallback for stores that have not created
        // any shipping method rows yet.
        $defaultCalc = $calculator->calculate('Dhaka');
        $paymentMethods = PaymentMethod::forCheckout()->get();

        $theme = [
            'store_name' => (string) $settings->get('store.name', config('app.name', 'Landing Commerce')),
            'store_phone' => (string) $settings->get('store.phone', ''),
            'store_whatsapp' => (string) $settings->get('store.whatsapp', ''),
            'logo_url' => (string) $settings->get('store.logo_url', ''),
            'favicon_url' => (string) $settings->get('store.favicon_url', ''),
            'primary_color' => (string) $settings->get('theme.primary_color', '#4f46e5'),
            'secondary_color' => (string) $settings->get('theme.secondary_color', '#06b6d4'),
            'accent_color' => (string) $settings->get('theme.accent_color', '#f59e0b'),
            'font_family' => (string) $settings->get('theme.font_family', 'Hind Siliguri, Inter, sans-serif'),
            'custom_css' => (string) $settings->get('theme.custom_css', ''),
        ];

        $categories = Category::active()
            ->root()
            ->with(['children' => fn ($q) => $q->active()->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Checkout/Show', [
            'mode' => $mode,
            'cart' => $cartSummary,
            'product' => $product,
            'shippingMethods' => $shippingMethods,
            'defaultShippingFee' => $defaultCalc->shippingFee,
            'defaultZoneName' => $defaultCalc->zoneName,
            'paymentMethods' => $paymentMethods,
            'theme' => $theme,
            'categories' => $categories,
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
            'shipping_method_id' => ['nullable', 'integer'],
        ]);

        $result = $calculator->calculate(
            $validated['district'],
            $validated['upazila'] ?? null,
            isset($validated['shipping_method_id']) ? (int) $validated['shipping_method_id'] : null
        );

        return response()->json([
            'shipping_fee' => $result->shippingFee,
            'zone_code' => $result->zoneCode,
            'zone_name' => $result->zoneName,
            'delivery_time' => $result->deliveryTime,
            'shipping_method_id' => $result->shippingMethodId,
            'shipping_method_name' => $result->shippingMethodName,
            'available_methods' => $result->availableMethods,
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
