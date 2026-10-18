<?php

declare(strict_types=1);

namespace App\Modules\Cart\Services;

use App\Modules\Cart\Models\Cart;
use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Checkout\Exceptions\InsufficientStockException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class CartManagerService
{
    public const COOKIE_NAME = 'cart_token';

    public const COOKIE_LIFETIME_MINUTES = 60 * 24 * 30; // 30 days

    /**
     * Retrieve the current guest/user cart or create one securely.
     */
    public function getOrCreateCart(?Request $request = null): Cart
    {
        $token = $this->resolveCartToken($request);

        if ($token) {
            $cart = Cart::where('token', $token)->first();
            if ($cart) {
                // If user is authenticated and cart has no user_id, associate it
                if ($request && $request->user() && ! $cart->user_id) {
                    $cart->update(['user_id' => $request->user()->id]);
                }

                return $cart;
            }
        }

        // Generate unpredictable 40-character secure token
        $newToken = Str::random(40);

        $cart = Cart::create([
            'token' => $newToken,
            'user_id' => $request?->user()?->id,
        ]);

        if ($request && $request->hasSession()) {
            $request->session()->put(self::COOKIE_NAME, $newToken);
        }

        Cookie::queue(self::COOKIE_NAME, $newToken, self::COOKIE_LIFETIME_MINUTES);

        return $cart;
    }

    /**
     * Retrieve existing cart if one exists for the current session/cookie, without creating a new record.
     */
    public function getCart(?Request $request = null): ?Cart
    {
        $token = $this->resolveCartToken($request);

        if (! $token) {
            return null;
        }

        return Cart::where('token', $token)->first();
    }

    /**
     * Resolve cart token from session, cookie, or authorization header.
     */
    protected function resolveCartToken(?Request $request = null): ?string
    {
        if (! $request) {
            $request = request();
        }

        $token = null;

        if ($request->hasSession()) {
            $token = $request->session()->get(self::COOKIE_NAME);
        }

        if (! $token) {
            $token = $request->cookie(self::COOKIE_NAME);
        }

        if (! $token && $request->header('X-Cart-Token')) {
            $token = $request->header('X-Cart-Token');
        }

        return is_string($token) && trim($token) !== '' ? trim($token) : null;
    }

    /**
     * Add a product and variant to the cart. Server-authoritatively validates existence, variant ownership, and stock.
     */
    public function addItem(Cart $cart, int $productId, ?int $variantId = null, int $quantity = 1): CartItem
    {
        if ($quantity < 1) {
            throw new InvalidArgumentException('Quantity must be at least 1.');
        }

        if ($quantity > 100) {
            throw new InvalidArgumentException('Quantity cannot exceed 100 units per item.');
        }

        /** @var Product $product */
        $product = Product::where('status', 'active')->findOrFail($productId);

        /** @var ProductVariant $variant */
        if (! $variantId) {
            if ($product->has_variants && $product->variants()->count() > 1) {
                throw new InvalidArgumentException('অনুগ্রহ করে পণ্যের নির্দিষ্ট ভ্যারিয়েন্ট নির্বাচন করুন।');
            }
            $variant = $product->variants()->firstOrFail();
        } else {
            $variant = ProductVariant::where('product_id', $product->id)->findOrFail($variantId);
        }

        return DB::transaction(function () use ($cart, $product, $variant, $quantity): CartItem {
            /** @var CartItem|null $existing */
            $existing = CartItem::where('cart_id', $cart->id)
                ->where('variant_id', $variant->id)
                ->first();

            $targetQuantity = $existing ? ($existing->quantity + $quantity) : $quantity;

            if ($targetQuantity > 100) {
                throw new InvalidArgumentException('Total quantity for this item in cart cannot exceed 100 units.');
            }

            // Check current available inventory
            if ($variant->manage_stock && $variant->stock_quantity < $targetQuantity) {
                throw new InsufficientStockException(
                    message: "স্টক অপর্যাপ্ত। '{$variant->name}' মাত্র {$variant->stock_quantity} টি উপলব্ধ আছে।",
                    variantId: $variant->id,
                    available: $variant->stock_quantity,
                    requested: $targetQuantity
                );
            }

            if ($existing) {
                $existing->update(['quantity' => $targetQuantity]);

                return $existing->fresh(['product', 'variant']);
            }

            return CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'quantity' => $quantity,
            ])->load(['product', 'variant']);
        });
    }

    /**
     * Update an item's quantity in the cart with stock limit re-validation.
     */
    public function updateItemQuantity(Cart $cart, int $cartItemId, int $quantity): CartItem
    {
        if ($quantity < 1) {
            throw new InvalidArgumentException('Quantity must be at least 1.');
        }

        if ($quantity > 100) {
            throw new InvalidArgumentException('Quantity cannot exceed 100 units per item.');
        }

        /** @var CartItem $item */
        $item = CartItem::where('cart_id', $cart->id)
            ->where('id', $cartItemId)
            ->with(['variant', 'product'])
            ->firstOrFail();

        $variant = $item->variant;

        if ($variant->manage_stock && $variant->stock_quantity < $quantity) {
            throw new InsufficientStockException(
                message: "স্টক অপর্যাপ্ত। '{$variant->name}' মাত্র {$variant->stock_quantity} টি উপলব্ধ আছে।",
                variantId: $variant->id,
                available: $variant->stock_quantity,
                requested: $quantity
            );
        }

        $item->update(['quantity' => $quantity]);

        return $item->fresh(['product', 'variant']);
    }

    /**
     * Remove an item from the cart safely.
     */
    public function removeItem(Cart $cart, int $cartItemId): bool
    {
        $item = CartItem::where('cart_id', $cart->id)
            ->where('id', $cartItemId)
            ->first();

        if ($item) {
            $item->delete();

            return true;
        }

        return false;
    }

    /**
     * Clear all items from the cart.
     */
    public function clearCart(Cart $cart): void
    {
        $cart->items()->delete();
    }

    /**
     * Return formatted server-authoritative cart summary.
     *
     * @return array<string, mixed>
     */
    public function getSummary(Cart $cart): array
    {
        return $cart->toSummaryArray();
    }
}
