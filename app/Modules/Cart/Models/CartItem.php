<?php

declare(strict_types=1);

namespace App\Modules\Cart\Models;

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_id',
        'product_id',
        'variant_id',
        'quantity',
    ];

    protected $casts = [
        'cart_id' => 'integer',
        'product_id' => 'integer',
        'variant_id' => 'integer',
        'quantity' => 'integer',
    ];

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Compute current server-authoritative unit price.
     */
    public function getUnitPriceAttribute(): float
    {
        if (! $this->relationLoaded('variant') && ! $this->variant) {
            return 0.00;
        }

        $variant = $this->variant;
        $sale = $variant->sale_price;

        if ($sale !== null && (float) $sale > 0 && (float) $sale < (float) $variant->regular_price) {
            return (float) $sale;
        }

        return (float) $variant->regular_price;
    }

    /**
     * Compute current server-authoritative line total.
     */
    public function getLineTotalAttribute(): float
    {
        return $this->unit_price * $this->quantity;
    }

    /**
     * Determine if this cart item is valid and purchasable.
     */
    public function isPurchasable(): bool
    {
        if (! $this->product || $this->product->status !== 'active') {
            return false;
        }

        if (! $this->variant) {
            return false;
        }

        if ($this->variant->manage_stock && $this->variant->stock_quantity < $this->quantity) {
            return false;
        }

        return true;
    }
}
