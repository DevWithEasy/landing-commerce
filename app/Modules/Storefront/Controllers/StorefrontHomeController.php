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

            // Featured Products (active, with images & variants)
            $featuredProducts = Product::query()
                ->active()
                ->with(['primaryImage', 'variants' => fn ($q) => $q->orderBy('id')])
                ->latest('id')
                ->take(8)
                ->get();

            // New Arrivals
            $newArrivals = Product::query()
                ->active()
                ->with(['primaryImage', 'variants' => fn ($q) => $q->orderBy('id')])
                ->latest('created_at')
                ->take(8)
                ->get();

            // Best Sellers
            $bestSellers = Product::query()
                ->active()
                ->with(['primaryImage', 'variants' => fn ($q) => $q->orderBy('id')])
                ->orderBy('id', 'asc')
                ->take(8)
                ->get();

            // Category Collections (up to 3 root categories with 4 active products each)
            $categorySections = Category::query()
                ->root()
                ->active()
                ->with(['products' => function ($q) {
                    $q->active()->with(['primaryImage', 'variants' => fn ($v) => $v->orderBy('id')])->take(4);
                }])
                ->whereHas('products', fn ($q) => $q->active())
                ->take(3)
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
                'categories' => $categories,
                'featuredProducts' => $featuredProducts,
                'newArrivals' => $newArrivals,
                'bestSellers' => $bestSellers,
                'categorySections' => $categorySections,
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
}
