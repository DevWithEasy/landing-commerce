<?php

declare(strict_types=1);

namespace App\Modules\Orders\Models;

use App\Models\User;
use App\Modules\Orders\Services\OrderStateMachine;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'order_number',
        'idempotency_key',
        'landing_page_id',
        'customer_id',
        'customer_name',
        'customer_phone',
        'delivery_address',
        'district',
        'upazila',
        'subtotal',
        'shipping_fee',
        'discount',
        'total',
        'payment_method',
        'status',
        'courier_name',
        'courier_tracking_id',
        'notes',
        'ip_address',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'shipping_fee' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasMany<OrderHistory, $this>
     */
    public function histories(): HasMany
    {
        return $this->hasMany(OrderHistory::class)->orderBy('created_at')->orderBy('id');
    }

    /**
     * @return HasOne<OrderHistory, $this>
     */
    public function latestHistory(): HasOne
    {
        return $this->hasOne(OrderHistory::class)->latestOfMany();
    }

    /**
     * Retrieve the structured chronological audit timeline for this order.
     *
     * @return list<array{
     *     id: int,
     *     order_id: int,
     *     from_status: string|null,
     *     to_status: string,
     *     comment: string|null,
     *     user_id: int|null,
     *     user_name: string|null,
     *     is_system: bool,
     *     created_at: string|null,
     *     created_at_human: string|null
     * }>
     */
    public function getTimeline(): array
    {
        return $this->histories()
            ->with('user')
            ->get()
            ->map(fn (OrderHistory $history) => $history->toTimelineArray())
            ->values()
            ->all();
    }

    /**
     * Transition the order to a new status using the OrderStateMachine.
     */
    public function transitionTo(
        string $toStatus,
        ?string $comment = null,
        User|int|null $user = null
    ): self {
        return app(OrderStateMachine::class)->transition(
            $this,
            $toStatus,
            $comment,
            $user
        );
    }
}
