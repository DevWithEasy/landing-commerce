<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Product;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Services\BlockRegistry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LandingPageBuilderController extends Controller
{
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

        return Inertia::render('Admin/Builder/Editor', [
            'landingPage' => $landingPage,
            'initialAst' => $initialAst,
            'blockDefinitions' => BlockRegistry::getAllBlockDefinitions(),
            'products' => $products,
        ]);
    }
}
