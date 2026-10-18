<?php

declare(strict_types=1);

namespace App\Modules\Cart\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cart\Requests\AddToCartRequest;
use App\Modules\Cart\Requests\UpdateCartItemRequest;
use App\Modules\Cart\Services\CartManagerService;
use App\Modules\Catalog\Models\Category;
use App\Modules\Checkout\Exceptions\InsufficientStockException;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class CartController extends Controller
{
    public function __construct(
        protected CartManagerService $cartManager,
        protected SettingsService $settings
    ) {}

    /**
     * Display the shopping cart page or return JSON summary.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $cart = $this->cartManager->getOrCreateCart($request);
        $summary = $this->cartManager->getSummary($cart);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'cart' => $summary,
            ]);
        }

        $theme = [
            'store_name' => (string) $this->settings->get('store.name', config('app.name', 'Landing Commerce')),
            'store_phone' => (string) $this->settings->get('store.phone', ''),
            'store_whatsapp' => (string) $this->settings->get('store.whatsapp', ''),
            'logo_url' => (string) $this->settings->get('store.logo_url', ''),
            'favicon_url' => (string) $this->settings->get('store.favicon_url', ''),
            'primary_color' => (string) $this->settings->get('theme.primary_color', '#4f46e5'),
            'secondary_color' => (string) $this->settings->get('theme.secondary_color', '#06b6d4'),
            'accent_color' => (string) $this->settings->get('theme.accent_color', '#f59e0b'),
            'font_family' => (string) $this->settings->get('theme.font_family', 'Hind Siliguri, Inter, sans-serif'),
            'custom_css' => (string) $this->settings->get('theme.custom_css', ''),
        ];
        $categories = Category::active()
            ->root()
            ->with(['children' => fn ($q) => $q->active()->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Storefront/Cart', [
            'theme' => $theme,
            'categories' => $categories,
            'cart' => $summary,
        ]);
    }

    /**
     * Return authoritative cart summary via JSON.
     */
    public function summary(Request $request): JsonResponse
    {
        $cart = $this->cartManager->getOrCreateCart($request);

        return response()->json([
            'cart' => $this->cartManager->getSummary($cart),
        ]);
    }

    /**
     * Add an item to the cart.
     */
    public function store(AddToCartRequest $request): JsonResponse
    {
        $cart = $this->cartManager->getOrCreateCart($request);

        try {
            $productId = (int) $request->input('product_id');
            $variantId = $request->filled('variant_id') ? (int) $request->input('variant_id') : null;
            $quantity = (int) ($request->input('quantity') ?? 1);

            $this->cartManager->addItem($cart, $productId, $variantId, $quantity);

            return response()->json([
                'message' => 'পণ্যটি কার্টে সফলভাবে যুক্ত করা হয়েছে।',
                'cart' => $this->cartManager->getSummary($cart),
            ], 200);
        } catch (InsufficientStockException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'out_of_stock',
                'variant_id' => $e->variantId,
                'available' => $e->available,
            ], 422);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'invalid_input',
            ], 422);
        }
    }

    /**
     * Update an item's quantity in the cart.
     */
    public function update(UpdateCartItemRequest $request, int $id): JsonResponse
    {
        $cart = $this->cartManager->getOrCreateCart($request);

        try {
            $quantity = (int) $request->input('quantity');
            $this->cartManager->updateItemQuantity($cart, $id, $quantity);

            return response()->json([
                'message' => 'কার্ট সফলভাবে আপডেট করা হয়েছে।',
                'cart' => $this->cartManager->getSummary($cart),
            ], 200);
        } catch (InsufficientStockException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'out_of_stock',
                'variant_id' => $e->variantId,
                'available' => $e->available,
            ], 422);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'invalid_input',
            ], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'কার্ট আইটেমটি পাওয়া যায়নি।',
                'error' => 'item_not_found',
            ], 404);
        }
    }

    /**
     * Remove an item from the cart.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $cart = $this->cartManager->getOrCreateCart($request);
        $removed = $this->cartManager->removeItem($cart, $id);

        if (! $removed) {
            return response()->json([
                'message' => 'আইটেমটি কার্টে নেই।',
                'cart' => $this->cartManager->getSummary($cart),
            ], 404);
        }

        return response()->json([
            'message' => 'পণ্যটি কার্ট থেকে সরানো হয়েছে।',
            'cart' => $this->cartManager->getSummary($cart),
        ], 200);
    }

    /**
     * Clear the entire cart.
     */
    public function clear(Request $request): JsonResponse
    {
        $cart = $this->cartManager->getOrCreateCart($request);
        $this->cartManager->clearCart($cart);

        return response()->json([
            'message' => 'কার্ট খালি করা হয়েছে।',
            'cart' => $this->cartManager->getSummary($cart),
        ], 200);
    }
}
