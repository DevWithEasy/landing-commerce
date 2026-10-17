<?php

declare(strict_types=1);

namespace App\Modules\Orders\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderHistory extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'order_id',
        'from_status',
        'to_status',
        'comment',
        'user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Scope a query to sort histories in strict chronological order.
     *
     * @param  Builder<OrderHistory>  $query
     * @return Builder<OrderHistory>
     */
    public function scopeChronological(Builder $query): Builder
    {
        return $query->orderBy('created_at')->orderBy('id');
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Serialize the history entry into a structured timeline node for order detail/audit views.
     *
     * @return array{
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
     * }
     */
    public function toTimelineArray(): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'from_status' => $this->from_status,
            'to_status' => $this->to_status,
            'comment' => $this->comment,
            'user_id' => $this->user_id,
            'user_name' => $this->user?->name,
            'is_system' => $this->user_id === null,
            'created_at' => $this->created_at?->toISOString(),
            'created_at_human' => $this->created_at?->diffForHumans(),
        ];
    }
}
