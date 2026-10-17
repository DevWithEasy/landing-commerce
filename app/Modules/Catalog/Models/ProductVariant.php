<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'sku',
        'name',
        'attributes',
        'regular_price',
        'sale_price',
        'stock_quantity',
        'manage_stock',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'attributes' => 'array',
            'regular_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'stock_quantity' => 'integer',
            'manage_stock' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return HasMany<ProductImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'variant_id')->orderBy('sort_order');
    }

    /**
     * @param  Builder<ProductVariant>  $query
     */
    public function scopeInStock(Builder $query): void
    {
        $query->where(function (Builder $q) {
            $q->where('manage_stock', false)
                ->orWhere('stock_quantity', '>', 0);
        });
    }

    /**
     * @param  Builder<ProductVariant>  $query
     */
    public function scopeOutOfStock(Builder $query): void
    {
        $query->where('manage_stock', true)
            ->where('stock_quantity', '<=', 0);
    }

    /**
     * @param  Builder<ProductVariant>  $query
     */
    public function scopeLowStock(Builder $query, int $threshold = 5): void
    {
        $query->where('manage_stock', true)
            ->where('stock_quantity', '>', 0)
            ->where('stock_quantity', '<=', $threshold);
    }
}
