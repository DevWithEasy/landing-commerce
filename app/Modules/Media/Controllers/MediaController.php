<?php

declare(strict_types=1);

namespace App\Modules\Media\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Media\Actions\DeleteMediaItemsAction;
use App\Modules\Media\Actions\UploadMediaAction;
use App\Modules\Media\Requests\DeleteMediaRequest;
use App\Modules\Media\Requests\UploadMediaRequest;
use App\Modules\Media\Services\MediaLibraryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    /**
     * Display the unified media library.
     */
    public function index(MediaLibraryService $mediaLibraryService): Response
    {
        Gate::authorize('manage-media');

        return Inertia::render('Admin/Media/Index', [
            'media' => $mediaLibraryService->paginate(24),
            'stats' => $mediaLibraryService->stats(),
        ]);
    }

    /**
     * Return a searchable, paginated media list for the page builder picker.
     */
    public function picker(Request $request, MediaLibraryService $mediaLibraryService): JsonResponse
    {
        Gate::authorize('manage-media');

        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 24);
        $perPage = max(12, min(60, $perPage));

        return response()->json($mediaLibraryService->paginate($perPage, $search));
    }

    /**
     * Upload one or more images to the media library.
     */
    public function store(
        UploadMediaRequest $request,
        UploadMediaAction $uploadMediaAction
    ): RedirectResponse {
        $files = $request->file('images', []);

        $uploadedCount = $uploadMediaAction->execute(
            is_array($files) ? $files : [],
            $request->user()?->id
        );

        $message = $uploadedCount === 1
            ? 'Image uploaded to the media library.'
            : "{$uploadedCount} images uploaded to the media library.";

        return redirect()
            ->route('admin.media.index')
            ->with('success', $message);
    }

    /**
     * Delete the selected product images and library uploads.
     */
    public function destroy(
        DeleteMediaRequest $request,
        DeleteMediaItemsAction $deleteMediaItemsAction
    ): RedirectResponse {
        /** @var list<string> $items */
        $items = $request->validated('items');

        $deletedCount = $deleteMediaItemsAction->execute($items);

        $message = $deletedCount === 1
            ? 'Image deleted successfully.'
            : "{$deletedCount} images deleted successfully.";

        return back()->with('success', $message);
    }
}
