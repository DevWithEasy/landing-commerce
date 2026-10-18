<?php

declare(strict_types=1);

namespace App\Modules\Storefront\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Product;
use App\Modules\Settings\Services\SettingsService;
use App\Modules\Shipping\Services\ShippingCalculatorService;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontProductController extends Controller
{
    public function __construct(
        protected SettingsService $settingsService,
        protected ShippingCalculatorService $shippingCalculator
    ) {}

    /**
     * Display the product details page.
     */
    public function show(string $slug): Response
    {
        $product = Product::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->with([
                'images' => fn ($q) => $q->orderBy('sort_order'),
                'primaryImage',
                'variants' => fn ($q) => $q->orderBy('id')->with(['images' => fn ($img) => $img->orderBy('sort_order')]),
                'categories' => fn ($q) => $q->select('categories.id', 'categories.name', 'categories.slug'),
            ])
            ->first();

        if (! $product) {
            abort(404, 'Product not found.');
        }

        // Related Products: Products sharing any category, or other active products
        $categoryIds = $product->categories->pluck('id')->all();

        $relatedProductsQuery = Product::query()
            ->active()
            ->where('id', '!=', $product->id)
            ->with([
                'primaryImage',
                'variants' => fn ($q) => $q->orderBy('id'),
            ]);

        if (! empty($categoryIds)) {
            $relatedProductsQuery->whereHas('categories', function (Builder $q) use ($categoryIds) {
                $q->whereIn('categories.id', $categoryIds);
            });
        }

        $relatedProducts = $relatedProductsQuery
            ->latest('id')
            ->take(4)
            ->get();

        // If category had fewer than 4 items, backfill with general active products
        if ($relatedProducts->count() < 4) {
            $existingIds = $relatedProducts->pluck('id')->push($product->id)->all();
            $backfill = Product::query()
                ->active()
                ->whereNotIn('id', $existingIds)
                ->with(['primaryImage', 'variants' => fn ($q) => $q->orderBy('id')])
                ->latest('id')
                ->take(4 - $relatedProducts->count())
                ->get();
            $relatedProducts = $relatedProducts->merge($backfill);
        }

        // Delivery info from Shipping Calculator
        $dhakaCalc = $this->shippingCalculator->calculate('Dhaka');
        $outsideCalc = $this->shippingCalculator->calculate('Chittagong');

        $deliveryInfo = [
            'inside_dhaka_fee' => $dhakaCalc->shippingFee,
            'outside_dhaka_fee' => $outsideCalc->shippingFee,
            'cod_available' => true,
            'return_policy_days' => 7,
        ];

        $theme = [
            'store_name' => (string) $this->settingsService->get('store.name', config('app.name', 'Landing Commerce')),
            'store_phone' => (string) $this->settingsService->get('store.phone', ''),
            'store_whatsapp' => (string) $this->settingsService->get('store.whatsapp', ''),
            'logo_url' => (string) $this->settingsService->get('store.logo_url', ''),
            'primary_color' => (string) $this->settingsService->get('theme.primary_color', '#4f46e5'),
        ];

        return Inertia::render('Storefront/ProductDetail', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
            'deliveryInfo' => $deliveryInfo,
            'theme' => $theme,
        ]);
    }
}
