<?php

declare(strict_types=1);

namespace App\Modules\Cart\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    use HasFactory;

    protected $fillable = [
        'token',
        'user_id',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get total quantity of all items in cart.
     */
    public function getTotalItemsAttribute(): int
    {
        if ($this->relationLoaded('items')) {
            return (int) $this->items->sum('quantity');
        }

        return (int) $this->items()->sum('quantity');
    }

    /**
     * Calculate server-authoritative subtotal.
     */
    public function calculateSubtotal(): float
    {
        $items = $this->relationLoaded('items')
            ? $this->items
            : $this->items()->with(['variant', 'product'])->get();

        $subtotal = 0.0;
        foreach ($items as $item) {
            $subtotal += $item->line_total;
        }

        return round($subtotal, 2);
    }

    /**
     * Format BDT currency helper.
     */
    public static function formatBdt(float $amount): string
    {
        return '৳'.number_format($amount, 0, '.', ',');
    }

    /**
     * Export complete server-authoritative cart summary array for API/Inertia.
     *
     * @return array<string, mixed>
     */
    public function toSummaryArray(): array
    {
        $items = $this->relationLoaded('items')
            ? $this->items
            : $this->items()->with(['product.primaryImage', 'product.images', 'variant'])->get();

        $subtotal = 0.0;
        $totalItems = 0;
        $formattedItems = [];

        foreach ($items as $item) {
            $variant = $item->variant;
            $product = $item->product;

            if (! $product || ! $variant) {
                continue;
            }

            $unitPrice = $item->unit_price;
            $regularPrice = (float) $variant->regular_price;
            $lineTotal = round($unitPrice * $item->quantity, 2);

            $subtotal += $lineTotal;
            $totalItems += $item->quantity;

            // Resolve image url
            $primaryImg = $product->primaryImage?->url
                ?? $product->images->first()?->url
                ?? '/placeholder.png';

            $stockAvailable = $variant->manage_stock ? $variant->stock_quantity : 999;
            $isInStock = ! $variant->manage_stock || $variant->stock_quantity >= $item->quantity;

            $formattedItems[] = [
                'id' => $item->id,
                'product_id' => $product->id,
                'product_title' => $product->title,
                'product_slug' => $product->slug,
                'variant_id' => $variant->id,
                'variant_name' => $variant->name === 'Default' ? '' : $variant->name,
                'image_url' => $primaryImg,
                'unit_price' => $unitPrice,
                'formatted_unit_price' => self::formatBdt($unitPrice),
                'regular_price' => $regularPrice,
                'formatted_regular_price' => self::formatBdt($regularPrice),
                'quantity' => $item->quantity,
                'line_total' => $lineTotal,
                'formatted_line_total' => self::formatBdt($lineTotal),
                'is_in_stock' => $isInStock,
                'available_stock' => $stockAvailable,
                'manage_stock' => (bool) $variant->manage_stock,
            ];
        }

        $subtotal = round($subtotal, 2);

        return [
            'id' => $this->id,
            'total_items' => $totalItems,
            'subtotal' => $subtotal,
            'formatted_subtotal' => self::formatBdt($subtotal),
            'items' => $formattedItems,
            'is_empty' => empty($formattedItems),
        ];
    }
}
