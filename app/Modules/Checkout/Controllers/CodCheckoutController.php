<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cart\Services\CartManagerService;
use App\Modules\Checkout\Actions\ProcessCodOrderAction;
use App\Modules\Checkout\Exceptions\InsufficientStockException;
use App\Modules\Checkout\Requests\StoreCodOrderRequest;
use App\Modules\Checkout\Services\OrderRateLimiter;
use App\Modules\Orders\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class CodCheckoutController extends Controller
{
    /**
     * Handle incoming COD order checkout request.
     */
    public function store(
        StoreCodOrderRequest $request,
        ProcessCodOrderAction $action,
        OrderRateLimiter $rateLimiter,
        CartManagerService $cartManager
    ): JsonResponse {
        $idempotencyKey = (string) $request->input('idempotency_key');

        // Check for existing order by idempotency key (returns 200 without duplicate deduction or throttling)
        $existing = Order::with('items')->where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Order already processed for this idempotency key.',
                'order' => $existing,
            ], 200);
        }

        $ip = (string) $request->ip();
        $phone = (string) ($request->input('customer_phone') ?? $request->input('phone') ?? '');

        // 1. Enforce IP rate limiting: Maximum 3 checkout requests per IP per 15 minutes
        if ($rateLimiter->tooManyIpAttempts($ip)) {
            $retryAfter = $rateLimiter->ipAvailableIn($ip);

            return response()->json([
                'message' => "Too many checkout requests from this IP. Please try again in {$retryAfter} seconds.",
                'error' => 'rate_limit_exceeded',
                'retry_after' => $retryAfter,
            ], 429)->header('Retry-After', (string) $retryAfter);
        }

        // 2. Enforce Phone rate limiting: Maximum 1 checkout request per normalized phone per 5 minutes
        if ($rateLimiter->tooManyPhoneAttempts($phone)) {
            $retryAfter = $rateLimiter->phoneAvailableIn($phone);

            return response()->json([
                'message' => "Too many checkout requests for this phone number. Please try again in {$retryAfter} seconds.",
                'error' => 'rate_limit_exceeded',
                'retry_after' => $retryAfter,
            ], 429)->header('Retry-After', (string) $retryAfter);
        }

        try {
            $payload = $request->toOrderPayload();
            $order = $action->execute($payload, $ip);

            // Record rate limit hits on successful order placement
            $rateLimiter->hit($ip, $phone);

            // Safely clear the purchased cart only when checking out from cart source
            if ($request->input('checkout_source') === 'cart') {
                $cart = $cartManager->getCart($request);
                if ($cart) {
                    $cartManager->clearCart($cart);
                }
            }

            return response()->json([
                'message' => 'Order placed successfully.',
                'order' => $order,
            ], 201);
        } catch (InsufficientStockException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'out_of_stock',
                'variant_id' => $e->variantId,
                'available' => $e->available,
            ], 422);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'invalid_input',
            ], 422);
        } catch (\Throwable $e) {
            Log::error('COD Order placement error: '.$e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'message' => 'অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন। ('.$e->getMessage().')',
                'error' => 'server_error',
            ], 500);
        }
    }
}
