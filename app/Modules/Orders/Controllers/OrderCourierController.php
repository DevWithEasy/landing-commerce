<?php

declare(strict_types=1);

namespace App\Modules\Orders\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Couriers\Services\CourierManager;
use App\Modules\Orders\Exceptions\InvalidOrderStateTransitionException;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Orders\Requests\DispatchOrderCourierRequest;
use App\Modules\Orders\Services\OrderStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class OrderCourierController extends Controller
{
    public function __construct(
        protected CourierManager $courierManager,
        protected OrderStateMachine $stateMachine
    ) {}

    /**
     * Dispatch an order to a courier provider and record consignment tracking details.
     */
    public function dispatchOrder(Order $order, DispatchOrderCourierRequest $request): JsonResponse|RedirectResponse
    {
        Gate::authorize('update', $order);

        // Guard against dispatching cancelled, returned, or spam orders
        if (in_array($order->status, [OrderStatus::CANCELLED, OrderStatus::RETURNED, OrderStatus::SPAM], true)) {
            $msg = "Order #{$order->order_number} cannot be dispatched in '{$order->status}' status.";
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $msg], 422);
            }

            return back()->with('error', $msg);
        }

        $driver = (string) ($request->validated('driver') ?: config('courier.default', 'mock'));

        if (! $this->courierManager->isConfigured($driver)) {
            $msg = "Courier driver [{$driver}] is not configured with required API credentials.";
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $msg], 422);
            }

            return back()->with('error', $msg);
        }

        $options = array_filter([
            'recipient_name' => $request->validated('recipient_name'),
            'recipient_phone' => $request->validated('recipient_phone'),
            'recipient_address' => $request->validated('recipient_address'),
            'cod_amount' => $request->validated('cod_amount') !== null ? (float) $request->validated('cod_amount') : null,
            'note' => $request->validated('note'),
            'weight' => $request->validated('weight') !== null ? (float) $request->validated('weight') : null,
        ], fn ($val) => $val !== null);

        try {
            $booking = $this->courierManager->createOrder($order, $options, $driver);
        } catch (\Throwable $e) {
            $msg = "Courier dispatch error: {$e->getMessage()}";
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $msg], 422);
            }

            return back()->with('error', $msg);
        }

        if (! $booking->success) {
            $msg = $booking->message ?: 'Courier booking failed.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => $msg,
                    'raw' => $booking->rawResponse,
                ], 422);
            }

            return back()->with('error', $msg);
        }

        // Transactionally update order and advance state machine
        DB::transaction(function () use ($order, $driver, $booking, $request) {
            $order->courier_name = $driver;
            $order->courier_tracking_id = $booking->trackingCode ?: $booking->consignmentId;
            $order->courier_tracking_url = $booking->trackingUrl;
            $order->save();

            $user = $request->user();
            $consignmentComment = "Dispatched via {$driver} courier. Consignment: {$booking->consignmentId}";

            if ($order->status === OrderStatus::PROCESSING) {
                $order->transitionTo(OrderStatus::HANDED_TO_COURIER, $consignmentComment, $user);
            } elseif ($order->status === OrderStatus::CONFIRMED) {
                $order->transitionTo(OrderStatus::PROCESSING, 'Auto-advanced to processing for dispatch', $user);
                $order->transitionTo(OrderStatus::HANDED_TO_COURIER, $consignmentComment, $user);
            } elseif ($order->status === OrderStatus::PENDING) {
                $order->transitionTo(OrderStatus::CONFIRMED, 'Auto-confirmed for courier dispatch', $user);
                $order->transitionTo(OrderStatus::PROCESSING, 'Auto-advanced to processing for dispatch', $user);
                $order->transitionTo(OrderStatus::HANDED_TO_COURIER, $consignmentComment, $user);
            } else {
                // For orders already handed_to_courier or in_transit, log history entry without status mutation
                $order->histories()->create([
                    'from_status' => $order->status,
                    'to_status' => $order->status,
                    'comment' => "Consignment updated via {$driver}: {$booking->consignmentId}",
                    'user_id' => $user?->id,
                ]);
            }
        });

        $order->refresh();
        $order->load(['items', 'histories.user']);

        $successMsg = "Order #{$order->order_number} successfully dispatched via {$driver}. Consignment: {$booking->consignmentId}";

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $successMsg,
                'order' => $order,
                'timeline' => $order->getTimeline(),
                'booking' => $booking->toArray(),
            ]);
        }

        return back()->with('success', $successMsg);
    }

    /**
     * Query live courier delivery tracking and update order state if valid transition.
     */
    public function trackOrder(Order $order, Request $request): JsonResponse|RedirectResponse
    {
        Gate::authorize('view', $order);

        if (empty($order->courier_tracking_id)) {
            $msg = "Order #{$order->order_number} has not been dispatched to a courier yet.";
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $msg], 422);
            }

            return back()->with('error', $msg);
        }

        $driver = $order->courier_name ?: config('courier.default', 'mock');

        try {
            $tracking = $this->courierManager->trackOrder($order->courier_tracking_id, $driver);
        } catch (\Throwable $e) {
            $msg = "Tracking lookup failed: {$e->getMessage()}";
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $msg], 422);
            }

            return back()->with('error', $msg);
        }

        if (! $tracking->success) {
            $msg = $tracking->message ?: 'Unable to retrieve tracking status.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $msg], 422);
            }

            return back()->with('error', $msg);
        }

        // If provider tracking status has progressed and is an allowed state transition, advance order
        if ($tracking->status !== $order->status && $this->stateMachine->canTransition($order->status, $tracking->status)) {
            try {
                $order->transitionTo(
                    $tracking->status,
                    "Status synced from {$driver} courier: {$tracking->rawStatus}",
                    $request->user()
                );
            } catch (InvalidOrderStateTransitionException) {
                // Non-fatal: if transition is not permitted, retain current order status
            }
        }

        $order->refresh();
        $order->load(['items', 'histories.user']);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $tracking->message,
                'order' => $order,
                'timeline' => $order->getTimeline(),
                'tracking' => $tracking->toArray(),
            ]);
        }

        return back()->with('success', $tracking->message);
    }
}
