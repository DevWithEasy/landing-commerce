<?php

declare(strict_types=1);

namespace App\Modules\Storefront\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontShopController extends Controller
{
    public function __construct(
        protected SettingsService $settingsService
    ) {}

    /**
     * Display the storefront catalog/shop listing.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'in:latest,price_low_high,price_high_low,popular'],
            'in_stock' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $search = isset($validated['search']) ? trim($validated['search']) : null;
        $categorySlug = $validated['category'] ?? null;
        $sort = $validated['sort'] ?? 'latest';
        $inStockOnly = ! empty($validated['in_stock']);

        $selectedCategory = null;
        if ($categorySlug) {
            $selectedCategory = Category::query()
                ->where('slug', $categorySlug)
                ->first();

            // If an explicitly requested category slug is missing or inactive, return 404
            if (! $selectedCategory || ! $selectedCategory->is_active) {
                abort(404, 'Category not found or inactive.');
            }
        }

        $query = Product::query()
            ->active()
            ->with([
                'primaryImage',
                'categories' => fn ($q) => $q->select('categories.id', 'categories.name', 'categories.slug'),
                'variants' => fn ($q) => $q->orderBy('id'),
            ]);

        // Search Filter
        if ($search) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Category Filter (includes category and any of its child subcategories)
        if ($selectedCategory) {
            $categoryIds = [$selectedCategory->id];
            if ($selectedCategory->parent_id === null) {
                $childIds = Category::query()
                    ->where('parent_id', $selectedCategory->id)
                    ->where('is_active', true)
                    ->pluck('id')
                    ->all();
                $categoryIds = array_merge($categoryIds, $childIds);
            }

            $query->whereHas('categories', function (Builder $q) use ($categoryIds) {
                $q->whereIn('categories.id', $categoryIds);
            });
        }

        // In-Stock Filter
        if ($inStockOnly) {
            $query->inStock();
        }

        // Sorting
        match ($sort) {
            'price_low_high' => $query->orderByRaw('COALESCE(sale_price, regular_price) ASC'),
            'price_high_low' => $query->orderByRaw('COALESCE(sale_price, regular_price) DESC'),
            'popular' => $query->orderBy('id', 'asc'),
            default => $query->latest('id'),
        };

        $products = $query->paginate(16)->withQueryString();

        $categoriesTree = Category::toTree(true);

        $theme = [
            'store_name' => (string) $this->settingsService->get('store.name', config('app.name', 'Landing Commerce')),
            'store_phone' => (string) $this->settingsService->get('store.phone', ''),
            'store_whatsapp' => (string) $this->settingsService->get('store.whatsapp', ''),
            'logo_url' => (string) $this->settingsService->get('store.logo_url', ''),
            'primary_color' => (string) $this->settingsService->get('theme.primary_color', '#4f46e5'),
        ];

        return Inertia::render('Storefront/Shop', [
            'products' => $products,
            'categories' => $categoriesTree,
            'selectedCategory' => $selectedCategory ? [
                'id' => $selectedCategory->id,
                'name' => $selectedCategory->name,
                'slug' => $selectedCategory->slug,
                'description' => $selectedCategory->description,
                'image_url' => $selectedCategory->image_url,
            ] : null,
            'filters' => [
                'search' => $search ?? '',
                'category' => $categorySlug ?? '',
                'sort' => $sort,
                'in_stock' => $inStockOnly,
            ],
            'theme' => $theme,
        ]);
    }

    /**
     * Browse products by category slug (/category/{slug}).
     */
    public function category(string $slug, Request $request): Response
    {
        $category = Category::query()->where('slug', $slug)->first();

        if (! $category || ! $category->is_active) {
            abort(404, 'Category not found or inactive.');
        }

        $request->merge(['category' => $category->slug]);

        return $this->index($request);
    }
}
