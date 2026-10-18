<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Product;
use App\Modules\Orders\Models\Order;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use App\Modules\PageBuilder\Requests\StoreLandingPageRequest;
use App\Modules\PageBuilder\Requests\UpdateLandingPageRequest;
use App\Modules\PageBuilder\Services\BlockRegistry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LandingPageController extends Controller
{
    /**
     * Display a listing of all landing pages.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('manage-landing-pages');

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', ''));

        $query = LandingPage::query()
            ->with(['product:id,title,slug,regular_price,sale_price'])
            ->withCount('revisions')
            ->orderByDesc('updated_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if (in_array($status, ['published', 'draft', 'archived'], true)) {
            $query->where('status', $status);
        }

        $landingPages = $query->paginate(15)->withQueryString();

        $products = Product::where('status', 'active')
            ->select(['id', 'title', 'slug', 'regular_price', 'sale_price'])
            ->orderBy('title')
            ->get();

        return Inertia::render('Admin/LandingPages/Index', [
            'landingPages' => $landingPages,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created landing page with initial compatible AST revision.
     */
    public function store(StoreLandingPageRequest $request): RedirectResponse
    {
        Gate::authorize('manage-landing-pages');

        $validated = $request->validated();

        $landingPage = DB::transaction(function () use ($validated, $request): LandingPage {
            $isDefault = (bool) ($validated['is_default'] ?? false);

            if ($isDefault) {
                LandingPage::where('is_default', true)->update(['is_default' => false]);
            }

            $landingPage = LandingPage::create([
                'product_id' => $validated['product_id'] ?? null,
                'title' => $validated['title'],
                'slug' => strtolower(trim($validated['slug'])),
                'is_default' => $isDefault,
                'status' => $validated['status'] ?? 'draft',
                'meta_seo' => $validated['meta_seo'] ?? null,
            ]);

            // Generate initial default AST document
            $settings = $validated['settings'] ?? [];
            $initialAst = BlockRegistry::generateDefaultAst(
                $landingPage->product_id ? (int) $landingPage->product_id : null,
                $settings
            );

            $revision = LandingPageRevision::create([
                'landing_page_id' => $landingPage->id,
                'revision_number' => 1,
                'ast_content' => $initialAst,
                'created_by' => $request->user()?->name ?? 'Admin',
            ]);

            if ($landingPage->status === 'published') {
                $landingPage->update(['published_revision_id' => $revision->id]);
            }

            return $landingPage;
        });

        if ($request->boolean('open_builder', false)) {
            return redirect()->route('admin.landing-pages.builder', $landingPage)
                ->with('success', 'Landing page created! Start designing your blocks.');
        }

        return redirect()->route('admin.landing-pages.index')
            ->with('success', "Landing page '{$landingPage->title}' created successfully.");
    }

    /**
     * Update the specified landing page details.
     */
    public function update(LandingPage $landingPage, UpdateLandingPageRequest $request): RedirectResponse
    {
        Gate::authorize('manage-landing-pages');

        $validated = $request->validated();
        $isDefault = (bool) ($validated['is_default'] ?? false);

        DB::transaction(function () use ($landingPage, $validated, $isDefault): void {
            if ($isDefault && ! $landingPage->is_default) {
                LandingPage::where('is_default', true)->update(['is_default' => false]);
            }

            $landingPage->update([
                'product_id' => $validated['product_id'] ?? null,
                'title' => $validated['title'],
                'slug' => strtolower(trim($validated['slug'])),
                'is_default' => $isDefault,
                'status' => $validated['status'] ?? $landingPage->status,
                'meta_seo' => $validated['meta_seo'] ?? $landingPage->meta_seo,
            ]);

            // If updated to published and published_revision_id is missing, link latest revision
            if ($landingPage->status === 'published' && ! $landingPage->published_revision_id) {
                $latestRevision = $landingPage->revisions()->first();
                if ($latestRevision) {
                    $landingPage->update(['published_revision_id' => $latestRevision->id]);
                }
            }
        });

        return redirect()->route('admin.landing-pages.index')
            ->with('success', "Landing page '{$landingPage->title}' updated successfully.");
    }

    /**
     * Publish the landing page after verifying valid AST revision content.
     */
    public function publish(LandingPage $landingPage, Request $request): RedirectResponse
    {
        Gate::authorize('manage-landing-pages');

        $latestRevision = $landingPage->revisions()->first();

        // Ensure valid AST content exists before publishing
        if (! $latestRevision || empty($latestRevision->ast_content) || ! is_array($latestRevision->ast_content)) {
            $initialAst = BlockRegistry::generateDefaultAst(
                $landingPage->product_id ? (int) $landingPage->product_id : null
            );

            $latestRevision = LandingPageRevision::create([
                'landing_page_id' => $landingPage->id,
                'revision_number' => ($landingPage->revisions()->max('revision_number') ?? 0) + 1,
                'ast_content' => $initialAst,
                'created_by' => $request->user()?->name ?? 'System',
            ]);
        }

        $landingPage->update([
            'status' => 'published',
            'published_revision_id' => $latestRevision->id,
        ]);

        return redirect()->route('admin.landing-pages.index')
            ->with('success', "Landing page '{$landingPage->title}' is now published and live at /{$landingPage->slug}.");
    }

    /**
     * Unpublish the landing page (revert to draft).
     */
    public function unpublish(LandingPage $landingPage): RedirectResponse
    {
        Gate::authorize('manage-landing-pages');

        $landingPage->update([
            'status' => 'draft',
        ]);

        return redirect()->route('admin.landing-pages.index')
            ->with('success', "Landing page '{$landingPage->title}' unpublished and set to draft.");
    }

    /**
     * Remove the specified landing page and cascade its revisions safely.
     */
    public function destroy(LandingPage $landingPage): RedirectResponse
    {
        Gate::authorize('manage-landing-pages');

        $title = $landingPage->title;

        DB::transaction(function () use ($landingPage): void {
            // Nullify any orders associated with this specific landing page
            Order::where('landing_page_id', $landingPage->id)
                ->update(['landing_page_id' => null]);

            // Database cascade deletes landing_page_revisions for this page only
            $landingPage->delete();
        });

        return redirect()->route('admin.landing-pages.index')
            ->with('success', "Landing page '{$title}' and its revision history were deleted.");
    }
}
