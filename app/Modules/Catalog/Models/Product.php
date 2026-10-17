<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'regular_price',
        'sale_price',
        'has_variants',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'regular_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'has_variants' => 'boolean',
        ];
    }

    /**
     * @return HasMany<ProductVariant, $this>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * @return HasMany<ProductImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    /**
     * @return HasOne<ProductImage, $this>
     */
    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->ofMany([
            'is_primary' => 'max',
            'sort_order' => 'min',
        ], function ($query) {
            $query->where('is_primary', true);
        });
    }

    /**
     * @param  Builder<Product>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'active');
    }

    /**
     * @param  Builder<Product>  $query
     */
    public function scopeInStock(Builder $query): void
    {
        $query->whereHas('variants', fn (Builder $q) => $q->inStock());
    }

    /**
     * @param  Builder<Product>  $query
     */
    public function scopeOutOfStock(Builder $query): void
    {
        $query->whereDoesntHave('variants', fn (Builder $q) => $q->inStock());
    }

    /**
     * @param  Builder<Product>  $query
     */
    public function scopeLowStock(Builder $query, int $threshold = 5): void
    {
        $query->whereHas('variants', fn (Builder $q) => $q->lowStock($threshold));
    }
}
