<?php

declare(strict_types=1);

namespace App\Modules\Storefront\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\Slider;
use App\Modules\PageBuilder\Controllers\PublicLandingPageController;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Services\BlockRendererService;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Throwable;

class StorefrontHomeController extends Controller
{
    public function __construct(
        protected SettingsService $settingsService
    ) {}

    /**
     * Dispatch homepage based on storefront mode.
     */
    public function index(Request $request, BlockRendererService $renderer): mixed
    {
        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['status' => 'ok', 'app' => 'Landing Commerce']);
        }

        try {
            $mode = (string) $this->settingsService->get('storefront.mode', 'full_storefront');

            if ($mode === 'landing_page_home') {
                $homeLandingPageId = $this->settingsService->get('storefront.home_landing_page_id');
                $landingPage = null;

                if ($homeLandingPageId) {
                    $landingPage = LandingPage::where('id', $homeLandingPageId)
                        ->where('status', 'published')
                        ->first();
                }

                if (! $landingPage) {
                    $landingPage = LandingPage::where('is_default', true)
                        ->where('status', 'published')
                        ->first()
                        ?? LandingPage::where('status', 'published')->first();
                }

                if ($landingPage) {
                    return app(PublicLandingPageController::class)->show($landingPage->slug, $renderer, $request);
                }
            }

            // Full Storefront Mode
            $sliders = Slider::query()->active()->get();

            $categories = Category::toTree(true);

            // New Arrivals (active, with images & variants)
            $newArrivals = Product::query()
                ->active()
                ->with(['primaryImage', 'variants' => fn ($q) => $q->orderBy('id')])
                ->latest('created_at')
                ->take(8)
                ->get();

            // Featured & Best Sellers are no longer displayed on homepage
            $featuredProducts = collect();
            $bestSellers = collect();

            // Main (Root) categories that have active products either directly or through subcategories
            $allMainCategories = Category::query()
                ->root()
                ->active()
                ->where(function ($query) {
                    $query->whereHas('products', fn ($q) => $q->active())
                        ->orWhereHas('children.products', fn ($q) => $q->active());
                })
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            $allCategoryIds = $allMainCategories->pluck('id')->all();

            // Load initial 2 main categories for fast initial render; remaining are lazy-loaded on scroll
            $initialIds = array_slice($allCategoryIds, 0, 2);
            $remainingCategoryIds = array_slice($allCategoryIds, 2);

            $categorySections = $allMainCategories
                ->whereIn('id', $initialIds)
                ->values()
                ->each(fn ($cat) => $this->loadCategoryFamilyProducts($cat))
                ->filter(fn ($cat) => $cat->products->isNotEmpty())
                ->values();

            // Uncategorized active products ("Others Product" section at the end of category streams)
            $otherProducts = Product::query()
                ->active()
                ->whereDoesntHave('categories')
                ->with(['primaryImage', 'variants' => fn ($v) => $v->orderBy('id')])
                ->latest('id')
                ->take(8)
                ->get();

            $theme = [
                'store_name' => (string) $this->settingsService->get('store.name', config('app.name', 'Landing Commerce')),
                'store_phone' => (string) $this->settingsService->get('store.phone', ''),
                'store_whatsapp' => (string) $this->settingsService->get('store.whatsapp', ''),
                'logo_url' => (string) $this->settingsService->get('store.logo_url', ''),
                'favicon_url' => (string) $this->settingsService->get('store.favicon_url', ''),
                'primary_color' => (string) $this->settingsService->get('theme.primary_color', '#4f46e5'),
                'secondary_color' => (string) $this->settingsService->get('theme.secondary_color', '#06b6d4'),
                'accent_color' => (string) $this->settingsService->get('theme.accent_color', '#f59e0b'),
                'font_family' => (string) $this->settingsService->get('theme.font_family', 'Hind Siliguri, Inter, sans-serif'),
                'custom_css' => (string) $this->settingsService->get('theme.custom_css', ''),
            ];

            $sectionsConfig = [
                'hero_slider_enabled' => filter_var((string) $this->settingsService->get('homepage.hero_slider_enabled', '1'), FILTER_VALIDATE_BOOLEAN),
                'categories_enabled' => filter_var((string) $this->settingsService->get('homepage.categories_enabled', '1'), FILTER_VALIDATE_BOOLEAN),
                'featured_enabled' => filter_var((string) $this->settingsService->get('homepage.featured_enabled', '1'), FILTER_VALIDATE_BOOLEAN),
                'new_arrivals_enabled' => filter_var((string) $this->settingsService->get('homepage.new_arrivals_enabled', '1'), FILTER_VALIDATE_BOOLEAN),
                'best_sellers_enabled' => filter_var((string) $this->settingsService->get('homepage.best_sellers_enabled', '1'), FILTER_VALIDATE_BOOLEAN),
                'category_sections_enabled' => filter_var((string) $this->settingsService->get('homepage.category_sections_enabled', '1'), FILTER_VALIDATE_BOOLEAN),
            ];

            return Inertia::render('Storefront/Home', [
                'sliders' => $sliders,
                'defaultHero' => $this->settingsService->getDefaultHeroConfig(),
                'promoBanners' => $this->settingsService->getPromoBannersConfig(),
                'categories' => $categories,
                'featuredProducts' => $featuredProducts,
                'newArrivals' => $newArrivals,
                'bestSellers' => $bestSellers,
                'categorySections' => $categorySections,
                'remainingCategoryIds' => $remainingCategoryIds,
                'otherProducts' => $otherProducts,
                'theme' => $theme,
                'sectionsConfig' => $sectionsConfig,
            ]);
        } catch (Throwable $e) {
            if ($request->wantsJson()) {
                return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
            }
            throw $e;
        }
    }

    /**
     * Get a single main category and its up to 8 active products (including subcategories) for lazy-loading.
     */
    public function getCategorySection(int $id): JsonResponse
    {
        $category = Category::query()
            ->root()
            ->active()
            ->find($id);

        if (! $category) {
            return response()->json([
                'status' => 'empty',
                'category' => null,
            ]);
        }

        $this->loadCategoryFamilyProducts($category);

        if ($category->products->isEmpty()) {
            return response()->json([
                'status' => 'empty',
                'category' => null,
            ]);
        }

        return response()->json([
            'status' => 'ok',
            'category' => $category,
        ]);
    }

    /**
     * Load up to 8 active products for a main category, including products assigned to its subcategories.
     */
    protected function loadCategoryFamilyProducts(Category $category): void
    {
        $familyCategoryIds = Category::query()
            ->where('id', $category->id)
            ->orWhere('parent_id', $category->id)
            ->pluck('id');

        $products = Product::query()
            ->active()
            ->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $familyCategoryIds))
            ->with(['primaryImage', 'variants' => fn ($v) => $v->orderBy('id')])
            ->latest('id')
            ->take(8)
            ->get();

        $category->setRelation('products', $products);
    }
}
