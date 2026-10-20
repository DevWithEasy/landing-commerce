<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use App\Modules\PageBuilder\Requests\StoreRevisionRequest;
use App\Modules\PageBuilder\Services\PageAstValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LandingPageRevisionController extends Controller
{
    public function __construct(
        protected PageAstValidator $astValidator
    ) {}

    /**
     * Store a validated AST revision for a landing page.
     */
    public function store(LandingPage $landingPage, StoreRevisionRequest $request): JsonResponse
    {
        $payload = $request->has('ast') && is_array($request->input('ast'))
            ? $request->input('ast')
            : $request->all();

        // Perform validation and get sanitized AST
        $validatedAst = $this->astValidator->validate($payload);

        // Determine next revision number
        $latestNumber = $landingPage->revisions()->max('revision_number') ?? 0;
        $nextNumber = $latestNumber + 1;

        $revision = LandingPageRevision::create([
            'landing_page_id' => $landingPage->id,
            'revision_number' => $nextNumber,
            'ast_content' => $validatedAst,
            'created_by' => $request->user()?->name ?? 'System',
        ]);

        // Auto-sync published_revision_id so live pages immediately reflect saved builder changes
        $updates = [
            'published_revision_id' => $revision->id,
        ];

        // Sync primary product_id if found in AST blocks (including nested containers)
        if (! empty($validatedAst['blocks']) && is_array($validatedAst['blocks'])) {
            $extractedProductId = $this->extractPrimaryProductId($validatedAst['blocks']);
            if ($extractedProductId !== null) {
                $updates['product_id'] = $extractedProductId;
            }
        }

        $landingPage->update($updates);

        return response()->json([
            'success' => true,
            'message' => "Revision #{$nextNumber} saved successfully.",
            'revision' => $revision,
            'published_revision_id' => $revision->id,
        ], 201);
    }

    /**
     * Restore a specific historical revision and make it the active revision.
     */
    public function restore(LandingPage $landingPage, LandingPageRevision $revision, Request $request): JsonResponse
    {
        if ($revision->landing_page_id !== $landingPage->id) {
            abort(404, 'Revision does not belong to this landing page.');
        }

        $latestNumber = $landingPage->revisions()->max('revision_number') ?? 0;
        $nextNumber = $latestNumber + 1;

        $newRevision = LandingPageRevision::create([
            'landing_page_id' => $landingPage->id,
            'revision_number' => $nextNumber,
            'ast_content' => $revision->ast_content,
            'created_by' => $request->user()?->name ?? 'System',
        ]);

        $updates = [
            'published_revision_id' => $newRevision->id,
        ];

        if (! empty($revision->ast_content['blocks']) && is_array($revision->ast_content['blocks'])) {
            $extractedProductId = $this->extractPrimaryProductId($revision->ast_content['blocks']);
            if ($extractedProductId !== null) {
                $updates['product_id'] = $extractedProductId;
            }
        }

        $landingPage->update($updates);

        return response()->json([
            'success' => true,
            'message' => "Revision #{$revision->revision_number} restored successfully as Revision #{$nextNumber}.",
            'revision' => $newRevision,
            'published_revision_id' => $newRevision->id,
        ]);
    }

    /**
     * Recursively extract the primary product ID from an AST block tree.
     *
     * @param  list<array<string, mixed>>  $blocks
     */
    protected function extractPrimaryProductId(array $blocks): ?int
    {
        foreach ($blocks as $block) {
            if (! is_array($block)) {
                continue;
            }

            if (in_array($block['type'] ?? '', ['ProductSelectorBlock', 'CodCheckoutBlock'], true)) {
                $pIds = $block['props']['productIds'] ?? null;
                if (is_array($pIds) && ! empty($pIds)) {
                    return (int) $pIds[0];
                }
                if (! empty($block['props']['productId'])) {
                    return (int) $block['props']['productId'];
                }
            }

            if (! empty($block['children']) && is_array($block['children'])) {
                $nestedId = $this->extractPrimaryProductId($block['children']);
                if ($nestedId !== null) {
                    return $nestedId;
                }
            }
        }

        return null;
    }
}
