<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use App\Modules\PageBuilder\Requests\StoreRevisionRequest;
use App\Modules\PageBuilder\Services\PageAstValidator;
use Illuminate\Http\JsonResponse;

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

        return response()->json([
            'success' => true,
            'message' => "Revision #{$nextNumber} saved successfully.",
            'revision' => $revision,
        ], 201);
    }
}
