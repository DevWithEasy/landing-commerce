<?php

declare(strict_types=1);

namespace App\Modules\Customer\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Customer\Models\Customer;
use App\Modules\Customer\Models\Wishlist;
use App\Modules\Customer\Requests\AddToWishlistRequest;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    public function __construct(
        protected SettingsService $settings
    ) {}

    /**
     * Display the authenticated customer's wishlist.
     */
    public function index(Request $request): Response
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');

        $theme = $this->settings->getStorefrontTheme();
        $categories = Category::active()->root()->get();

        $wishlistItems = $customer->wishlistItems()
            ->with([
                'product' => fn ($q) => $q->with(['primaryImage', 'images', 'variants']),
                'variant',
            ])
            ->latest()
            ->paginate(12);

        return Inertia::render('Customer/Wishlist', [
            'theme' => $theme,
            'categories' => $categories,
            'wishlist' => $wishlistItems,
        ]);
    }

    /**
     * Add an item to the authenticated customer's wishlist.
     */
    public function store(AddToWishlistRequest $request): JsonResponse|RedirectResponse
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');
        $validated = $request->validated();

        $product = Product::active()->findOrFail($validated['product_id']);

        $variantId = null;
        if (! empty($validated['variant_id'])) {
            $variant = ProductVariant::where('id', $validated['variant_id'])
                ->where('product_id', $product->id)
                ->firstOrFail();
            $variantId = $variant->id;
        }

        $wishlistItem = Wishlist::firstOrCreate([
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'variant_id' => $variantId,
        ]);

        $count = $customer->wishlistItems()->count();

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Item added to your wishlist.',
                'wishlist_item' => $wishlistItem,
                'total_items' => $count,
                'is_in_wishlist' => true,
            ]);
        }

        return back()->with('success', 'Item added to your wishlist.');
    }

    /**
     * Remove an item from the customer's wishlist.
     */
    public function destroy(Request $request, int $id): JsonResponse|RedirectResponse
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');

        // Enforce strict ownership scoping
        $item = Wishlist::where('id', $id)
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        $item->delete();
        $count = $customer->wishlistItems()->count();

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Item removed from your wishlist.',
                'total_items' => $count,
                'is_in_wishlist' => false,
            ]);
        }

        return back()->with('success', 'Item removed from your wishlist.');
    }
}
