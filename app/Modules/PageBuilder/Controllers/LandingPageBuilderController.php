<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Product;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Services\BlockRegistry;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LandingPageBuilderController extends Controller
{
    public function __construct(
        protected SettingsService $settingsService
    ) {}

    /**
     * Show the visual drag-and-drop page builder editor.
     */
    public function edit(LandingPage $landingPage, Request $request): Response
    {
        if (! $request->user()?->canManageLandingPages()) {
            abort(403, 'Unauthorized to access visual page builder.');
        }

        $landingPage->load([
            'product.variants',
            'product.images',
            'revisions' => function ($query) {
                $query->select(['id', 'landing_page_id', 'revision_number', 'ast_content', 'created_by', 'created_at'])
                    ->orderByDesc('revision_number')
                    ->limit(50);
            },
        ]);

        $latestRevision = $landingPage->revisions->first();
        $initialAst = $latestRevision?->ast_content ?? BlockRegistry::generateDefaultAst($landingPage->product_id);

        $products = Product::where('status', 'active')
            ->select(['id', 'title', 'slug', 'regular_price', 'sale_price'])
            ->with(['variants:id,product_id,name,sku,regular_price,sale_price,stock_quantity', 'images'])
            ->get();

        $aiModels = (array) config('ai.gemini.models', []);
        $aiModel = (string) $this->settingsService->get(
            'ai.gemini.model',
            config('ai.gemini.default_model', 'gemini-3.6-flash')
        );

        if (! array_key_exists($aiModel, $aiModels)) {
            $aiModel = (string) config('ai.gemini.default_model', 'gemini-3.6-flash');
        }

        return Inertia::render('Admin/Builder/Editor', [
            'landingPage' => $landingPage,
            'initialAst' => $initialAst,
            'blockDefinitions' => BlockRegistry::getAllBlockDefinitions(),
            'products' => $products,
            'ai' => [
                'configured' => $this->settingsService->has('ai.gemini.api_key'),
                'enabled' => filter_var(
                    $this->settingsService->get('ai.gemini.enabled', true),
                    FILTER_VALIDATE_BOOLEAN
                ),
                'model' => $aiModel,
            ],
        ]);
    }
}
