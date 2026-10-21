<?php

declare(strict_types=1);

namespace App\Modules\Ai\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ai\Exceptions\AiGenerationException;
use App\Modules\Ai\Requests\GenerateDesignRequest;
use App\Modules\Ai\Requests\TestAiConnectionRequest;
use App\Modules\Ai\Services\AiBlockGenerator;
use App\Modules\Ai\Services\GeminiClient;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Throwable;

class AiDesignController extends Controller
{
    public function __construct(
        protected AiBlockGenerator $generator,
        protected GeminiClient $geminiClient,
        protected SettingsService $settingsService
    ) {}

    /**
     * Generate validated blocks without mutating the landing page.
     */
    public function generate(GenerateDesignRequest $request): JsonResponse
    {
        Gate::authorize('manage-landing-pages');

        $landingPage = LandingPage::query()->findOrFail($request->integer('landing_page_id'));

        try {
            $blocks = $this->generator->generate((string) $request->input('prompt'));
        } catch (AiGenerationException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], $exception->status());
        } catch (Throwable) {
            return response()->json([
                'success' => false,
                'message' => 'AI generation failed unexpectedly. Please try again.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Design generated successfully.',
            'blocks' => $blocks,
            'count' => count($blocks),
            'landing_page_id' => $landingPage->id,
        ]);
    }

    /**
     * Test the entered or saved Gemini key against the selected model.
     */
    public function testConnection(TestAiConnectionRequest $request): JsonResponse
    {
        Gate::authorize('manage-settings');

        $apiKey = trim((string) $request->input('api_key', ''));
        if ($apiKey === '') {
            $apiKey = trim((string) $this->settingsService->get('ai.gemini.api_key', ''));
        }

        if ($apiKey === '') {
            return response()->json([
                'success' => false,
                'message' => 'Enter a Gemini API key or save one before testing the connection.',
            ], 422);
        }

        try {
            $this->geminiClient->testConnection($apiKey, (string) $request->input('model'));
        } catch (AiGenerationException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], $exception->status());
        } catch (Throwable) {
            return response()->json([
                'success' => false,
                'message' => 'Could not verify the Gemini connection. Please try again.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Connection successful. Gemini generated a test response for the selected model.',
        ]);
    }

    /**
     * Remove the saved key without changing pages, revisions, or generated blocks.
     */
    public function removeKey(): RedirectResponse
    {
        Gate::authorize('manage-settings');

        $this->settingsService->forget('ai.gemini.api_key');

        return redirect()
            ->back()
            ->with('success', 'Gemini API key removed. Existing pages and blocks were not changed.');
    }
}
