<?php

declare(strict_types=1);

namespace App\Modules\Orders\Policies;

use App\Models\User;
use App\Modules\Orders\Models\Order;

class OrderPolicy
{
    /**
     * Determine whether the user can view any orders.
     */
    public function viewAny(User $user): bool
    {
        return $user->canManageOrders();
    }

    /**
     * Determine whether the user can view the order.
     */
    public function view(User $user, Order $order): bool
    {
        return $user->canManageOrders();
    }

    /**
     * Determine whether the user can update the order status.
     */
    public function update(User $user, Order $order): bool
    {
        return $user->canManageOrders();
    }

    /**
     * Determine whether the user can export orders to CSV.
     */
    public function export(User $user): bool
    {
        return $user->canManageOrders();
    }

    /**
     * Determine whether the user can delete an order.
     */
    public function delete(User $user, Order $order): bool
    {
        return $user->canManageOrders();
    }

    /**
     * Determine whether the user can bulk delete orders.
     */
    public function deleteAny(User $user): bool
    {
        return $user->canManageOrders();
    }
}
