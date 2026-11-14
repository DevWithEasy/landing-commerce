<?php

declare(strict_types=1);

namespace App\Modules\Customer\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Category;
use App\Modules\Checkout\Rules\BdPhoneRule;
use App\Modules\Customer\Requests\TrackOrderRequest;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class OrderTrackingController extends Controller
{
    public function __construct(
        protected SettingsService $settings
    ) {}

    /**
     * Show tracking search page or preloaded tracking result.
     */
    public function show(Request $request): Response
    {
        $theme = $this->settings->getStorefrontTheme();
        $categories = Category::toTree(true);

        $token = (string) $request->query('token', '');
        $orderNumber = (string) $request->query('order_number', '');
        $phone = (string) $request->query('phone', '');

        $trackingData = null;

        if ($token !== '' || ($orderNumber !== '' && $phone !== '') || ($orderNumber !== '' && Auth::guard('customer')->check())) {
            $trackingData = $this->resolveOrderTracking($token, $orderNumber, $phone, $request->ip());
        }

        return Inertia::render('Customer/TrackOrder', [
            'theme' => $theme,
            'categories' => $categories,
            'initialTracking' => $trackingData,
            'queryParams' => [
                'token' => $token,
                'order_number' => $orderNumber,
                'phone' => $phone,
            ],
        ]);
    }

    /**
     * Handle AJAX or form submission for order tracking with anti-enumeration protection.
     */
    public function track(TrackOrderRequest $request): JsonResponse
    {
        $throttleKey = 'order-track|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'message' => "Too many tracking attempts. Please try again in {$seconds} seconds.",
                'error' => 'rate_limited',
            ], 429);
        }

        $token = (string) $request->input('token', '');
        $orderNumber = (string) $request->input('order_number', '');
        $phone = (string) $request->input('phone', '');

        $trackingData = $this->resolveOrderTracking($token, $orderNumber, $phone, $request->ip());

        if (! $trackingData) {
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'message' => 'No matching order found for the provided information.',
                'error' => 'not_found',
            ], 404);
        }

        RateLimiter::clear($throttleKey);

        return response()->json([
            'order' => $trackingData,
        ]);
    }

    /**
     * Safely resolve tracking information without exposing sensitive internal data.
     *
     * @return array<string, mixed>|null
     */
    protected function resolveOrderTracking(string $token, string $orderNumber, string $phone, string $ip): ?array
    {
        $order = null;

        // 1. Cryptographic tracking token lookup
        if ($token !== '' && strlen($token) === 64) {
            $tokenHash = hash('sha256', $token);
            $order = Order::with(['items', 'histories'])->where('tracking_token_hash', $tokenHash)->first();
        }

        // 2. Authenticated customer direct lookup by order number
        if (! $order && $orderNumber !== '' && Auth::guard('customer')->check()) {
            $order = Order::with(['items', 'histories'])
                ->where('order_number', $orderNumber)
                ->where('customer_id', Auth::guard('customer')->id())
                ->first();
        }

        // 3. Guest lookup: strictly require BOTH Order Number AND matching Customer Phone
        if (! $order && $orderNumber !== '' && $phone !== '') {
            $potentialOrder = Order::with(['items', 'histories'])
                ->where('order_number', $orderNumber)
                ->first();

            if ($potentialOrder) {
                $normalizedInputPhone = BdPhoneRule::normalize($phone);
                $normalizedOrderPhone = BdPhoneRule::normalize($potentialOrder->customer_phone);

                if ($normalizedInputPhone === $normalizedOrderPhone) {
                    $order = $potentialOrder;
                }
            }
        }

        if (! $order) {
            return null;
        }

        return [
            'order_number' => $order->order_number,
            'created_at' => $order->created_at->toISOString(),
            'created_at_human' => $order->created_at->format('M d, Y h:i A'),
            'status' => $order->status,
            'status_label' => $this->getStatusLabel($order->status),
            'masked_phone' => $order->getMaskedPhone(),
            'district' => $order->district,
            'subtotal' => (float) $order->subtotal,
            'shipping_fee' => (float) $order->shipping_fee,
            'discount' => (float) $order->discount,
            'total' => (float) $order->total,
            'payment_method' => $order->payment_method,
            'payment_status' => $order->payment_status,
            'courier_name' => $order->courier_name,
            'courier_tracking_id' => $order->courier_tracking_id,
            'courier_tracking_url' => $order->courier_tracking_url,
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'product_title' => $item->product_title,
                'variant_name' => $item->variant_name,
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'total_price' => (float) $item->total_price,
            ])->values()->all(),
            'timeline' => $order->histories->map(fn ($h) => [
                'from_status' => $h->from_status,
                'to_status' => $h->to_status,
                'created_at' => $h->created_at->toISOString(),
                'created_at_human' => $h->created_at->format('d M, Y h:i A'),
            ])->values()->all(),
        ];
    }

    /**
     * Localized status label helper.
     *
     * @return array{en: string, bn: string}
     */
    protected function getStatusLabel(string $status): array
    {
        return match ($status) {
            OrderStatus::PENDING => ['en' => 'Order Placed', 'bn' => 'অর্ডার গৃহীত হয়েছে'],
            OrderStatus::CONFIRMED => ['en' => 'Confirmed', 'bn' => 'কনফার্ম করা হয়েছে'],
            OrderStatus::PROCESSING => ['en' => 'Processing', 'bn' => 'প্রস্তুত করা হচ্ছে'],
            OrderStatus::HANDED_TO_COURIER => ['en' => 'Handed to Courier', 'bn' => 'কুরিয়ারে হস্তান্তর করা হয়েছে'],
            OrderStatus::IN_TRANSIT => ['en' => 'In Transit', 'bn' => 'ডেলিভারির পথে'],
            OrderStatus::DELIVERED => ['en' => 'Delivered', 'bn' => 'ডেলিভারি সম্পন্ন'],
            OrderStatus::RETURNED => ['en' => 'Returned', 'bn' => 'ফেরত এসেছে'],
            OrderStatus::CANCELLED => ['en' => 'Cancelled', 'bn' => 'বাতিল করা হয়েছে'],
            OrderStatus::SPAM => ['en' => 'Spam / Rejected', 'bn' => 'স্প্যাম হিসেবে প্রত্যাখ্যাত'],
            default => ['en' => ucfirst($status), 'bn' => $status],
        };
    }
}
