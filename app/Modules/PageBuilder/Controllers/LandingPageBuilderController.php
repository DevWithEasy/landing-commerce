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
                    ->limit(20);
            },
        ]);

        $latestRevision = $landingPage->revisions->first();
        $initialAst = $latestRevision?->ast_content ?? [
            'version' => 1,
            'settings' => [
                'primaryColor' => '#16a34a',
                'fontFamily' => 'Inter',
                'containerMaxWidth' => '1200px',
            ],
            'blocks' => [
                [
                    'id' => 'blk_hero_'.bin2hex(random_bytes(4)),
                    'type' => 'HeroBlock',
                    'props' => BlockRegistry::getDefaultProps('HeroBlock'),
                    'styles' => BlockRegistry::getDefaultStyles('HeroBlock'),
                ],
                [
                    'id' => 'blk_product_'.bin2hex(random_bytes(4)),
                    'type' => 'ProductSelectorBlock',
                    'props' => array_merge(BlockRegistry::getDefaultProps('ProductSelectorBlock'), [
                        'productId' => $landingPage->product_id ?? 0,
                    ]),
                    'styles' => BlockRegistry::getDefaultStyles('ProductSelectorBlock'),
                ],
                [
                    'id' => 'blk_cod_'.bin2hex(random_bytes(4)),
                    'type' => 'CodCheckoutBlock',
                    'props' => array_merge(BlockRegistry::getDefaultProps('CodCheckoutBlock'), [
                        'productId' => $landingPage->product_id ?? 0,
                    ]),
                    'styles' => BlockRegistry::getDefaultStyles('CodCheckoutBlock'),
                ],
            ],
        ];

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
