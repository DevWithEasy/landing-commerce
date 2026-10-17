<?php

declare(strict_types=1);

namespace App\Modules\Orders\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        return $this->hasMany(OrderHistory::class)->orderBy('created_at');
    }
}
