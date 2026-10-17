<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Checkout\Actions\ProcessCodOrderAction;
use App\Modules\Checkout\Exceptions\InsufficientStockException;
use App\Modules\Checkout\Requests\StoreCodOrderRequest;
use App\Modules\Orders\Models\Order;
use Illuminate\Http\JsonResponse;

class CodCheckoutController extends Controller
{
    /**
     * Handle incoming COD order checkout request.
     */
    public function store(
        StoreCodOrderRequest $request,
        ProcessCodOrderAction $action
    ): JsonResponse {
        $idempotencyKey = (string) $request->input('idempotency_key');

        // Check for existing order by idempotency key (returns 200 without duplicate deduction)
        $existing = Order::with('items')->where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Order already processed for this idempotency key.',
                'order' => $existing,
            ], 200);
        }

        try {
            $payload = $request->toOrderPayload();
            $order = $action->execute($payload, $request->ip());

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
        }
    }
}
