<?php

declare(strict_types=1);

namespace App\Modules\Orders\Services;

use App\Models\User;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Orders\Exceptions\InvalidOrderStateTransitionException;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use Illuminate\Support\Facades\DB;

class OrderStateMachine
{
    /**
     * Explicit map of valid order state transitions.
     *
     * @var array<string, list<string>>
     */
    public const ALLOWED_TRANSITIONS = [
        OrderStatus::PENDING => [
            OrderStatus::CONFIRMED,
            OrderStatus::CANCELLED,
            OrderStatus::SPAM,
        ],
        OrderStatus::CONFIRMED => [
            OrderStatus::PROCESSING,
            OrderStatus::CANCELLED,
            OrderStatus::SPAM,
        ],
        OrderStatus::PROCESSING => [
            OrderStatus::HANDED_TO_COURIER,
            OrderStatus::CONFIRMED, // Allow rollback to confirmed if packing issues arise
            OrderStatus::CANCELLED,
        ],
        OrderStatus::HANDED_TO_COURIER => [
            OrderStatus::IN_TRANSIT,
            OrderStatus::DELIVERED, // Local same-day riders completing delivery directly
            OrderStatus::RETURNED,
            OrderStatus::CANCELLED,
        ],
        OrderStatus::IN_TRANSIT => [
            OrderStatus::DELIVERED,
            OrderStatus::RETURNED,
        ],
        OrderStatus::DELIVERED => [
            OrderStatus::RETURNED, // Post-delivery return / warranty return
        ],
        OrderStatus::RETURNED => [], // Terminal state
        OrderStatus::CANCELLED => [], // Terminal state
        OrderStatus::SPAM => [], // Terminal state
    ];

    /**
     * Statuses that trigger inventory replenishment.
     *
     * @var list<string>
     */
    public const RESTOCK_STATUSES = [
        OrderStatus::CANCELLED,
        OrderStatus::RETURNED,
        OrderStatus::SPAM,
    ];

    /**
     * Determine if a transition from one status to another is valid.
     */
    public function canTransition(string $fromStatus, string $toStatus): bool
    {
        // Identical status is an idempotent no-op
        if ($fromStatus === $toStatus) {
            return true;
        }

        $allowed = self::ALLOWED_TRANSITIONS[$fromStatus] ?? [];

        return in_array($toStatus, $allowed, true);
    }

    /**
     * Get all allowed next transitions from a given status.
     *
     * @return list<string>
     */
    public function getAllowedTransitions(string $status): array
    {
        return self::ALLOWED_TRANSITIONS[$status] ?? [];
    }

    /**
     * Determine if a target status requires inventory restocking.
     */
    public function isRestockStatus(string $status): bool
    {
        return in_array($status, self::RESTOCK_STATUSES, true);
    }

    /**
     * Execute a state transition on an order with strict guards, pessimistic locking,
     * idempotent stock restoration, and audit history logging.
     *
     * @throws InvalidOrderStateTransitionException
     */
    public function transition(
        Order $order,
        string $toStatus,
        ?string $comment = null,
        User|int|null $user = null
    ): Order {
        return DB::connection($order->getConnectionName())->transaction(function () use ($order, $toStatus, $comment, $user) {
            // Lock order row pessimistically to prevent concurrent transition races
            $lockedOrder = $order->newQuery()
                ->where($order->getKeyName(), $order->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $fromStatus = $lockedOrder->status;

            // Enforce state transition guards
            if (! $this->canTransition($fromStatus, $toStatus)) {
                throw new InvalidOrderStateTransitionException(
                    fromStatus: $fromStatus,
                    toStatus: $toStatus,
                    orderNumber: $lockedOrder->order_number
                );
            }

            // Handle idempotent inventory restocking for Cancelled, Returned, or Spam
            if ($this->isRestockStatus($toStatus)) {
                $this->restockOrderItems($lockedOrder);
            }

            // If it is an identical status call (e.g. duplicate webhook or repeated click),
            // do not duplicate status change or history log, just return the order
            if ($fromStatus === $toStatus) {
                return $lockedOrder->fresh(['items', 'histories']);
            }

            // Update order status
            $lockedOrder->update(['status' => $toStatus]);

            // Record audit trail
            $userId = $user instanceof User ? $user->id : $user;

            $lockedOrder->histories()->create([
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'comment' => $comment,
                'user_id' => $userId,
            ]);

            return $lockedOrder->fresh(['items', 'histories']);
        });
    }

    /**
     * Restore stock for all un-restocked items of an order using pessimistic locks.
     */
    public function restockOrderItems(Order $order): void
    {
        // Re-query order items inside transaction with lock to ensure idempotent evaluation
        $items = $order->items()
            ->lockForUpdate()
            ->get();

        foreach ($items as $item) {
            // Strictly check is_restocked flag: never restock twice
            if ($item->is_restocked) {
                continue;
            }

            if ($item->variant_id) {
                $variant = ProductVariant::on($order->getConnectionName())
                    ->where('id', $item->variant_id)
                    ->lockForUpdate()
                    ->first();

                if ($variant && $variant->manage_stock) {
                    $variant->increment('stock_quantity', $item->quantity);
                }
            }

            // Mark item as restocked
            $item->update(['is_restocked' => true]);
        }
    }
}
