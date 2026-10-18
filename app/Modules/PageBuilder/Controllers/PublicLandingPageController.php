<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Services\BlockRendererService;
use App\Modules\Tracking\Services\TrackingService;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class PublicLandingPageController extends Controller
{
    /**
     * Reserved routes and prefixes that cannot be matched as public landing page slugs.
     *
     * @var list<string>
     */
    public const RESERVED_SLUGS = [
        'admin',
        'checkout',
        'login',
        'api',
        'storage',
        'build',
        'up',
        'telescope',
        'horizon',
        '_debugbar',
        'sanctum',
        '.env',
        '.git',
        'pages',
        'cart',
        'shop',
        'product',
        'categories',
        'category',
        'backups',
        'backup',
        'snapshots',
    ];

    /**
     * Display a published landing page by its slug.
     */
    public function show(string $slug, BlockRendererService $renderer, Request $request): View
    {
        // 1. Check reserved slugs and prevent dotfiles
        $normalizedSlug = strtolower(trim($slug));
        if (str_starts_with($normalizedSlug, '.') || in_array($normalizedSlug, self::RESERVED_SLUGS, true)) {
            abort(404, 'Reserved path cannot be used as landing page.');
        }

        // 2. Query published landing page
        $landingPage = LandingPage::where('slug', $normalizedSlug)
            ->where('status', 'published')
            ->with(['product.variants', 'product.images', 'publishedRevision'])
            ->first();

        if (! $landingPage) {
            abort(404, 'Landing page not found or unpublished.');
        }

        // 3. Resolve published revision AST
        $revision = $landingPage->publishedRevision;

        // Fallback to the highest revision if published_revision_id was not explicitly linked
        if (! $revision) {
            $revision = $landingPage->revisions()->orderByDesc('revision_number')->first();
        }

        if (! $revision || empty($revision->ast_content) || ! is_array($revision->ast_content)) {
            abort(404, 'No published revision content available.');
        }

        $ast = $revision->ast_content;

        // 4. Render blocks through BlockRendererService
        $context = [
            'landingPage' => $landingPage,
            'product' => $landingPage->product,
        ];

        $renderedBlocksHtml = $renderer->renderAst($ast, $context);
        $settings = $ast['settings'] ?? [];
        $metaSeo = $landingPage->meta_seo ?? [];

        $trackingService = app(TrackingService::class);
        $resolvedTracking = $trackingService->getResolvedSettings($landingPage);

        $contextProduct = $landingPage->product ? [
            'id' => $landingPage->product->id,
            'title' => $landingPage->product->title,
            'regular_price' => $landingPage->product->regular_price,
            'sale_price' => $landingPage->product->sale_price,
        ] : null;

        $trackingHead = $trackingService->renderHeadScripts($resolvedTracking, [
            'event' => 'ViewContent',
            'product' => $contextProduct,
            'landingPage' => [
                'id' => $landingPage->id,
                'title' => $landingPage->title,
            ],
        ]);

        $trackingBody = $trackingService->renderBodyScripts($resolvedTracking);

        return view('landing-page.show', [
            'landingPage' => $landingPage,
            'revision' => $revision,
            'renderedBlocksHtml' => $renderedBlocksHtml,
            'settings' => $settings,
            'metaSeo' => $metaSeo,
            'trackingHead' => $trackingHead,
            'trackingBody' => $trackingBody,
        ]);
    }
}
