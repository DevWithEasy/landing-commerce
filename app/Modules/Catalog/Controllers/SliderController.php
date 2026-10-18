<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Slider;
use App\Modules\Catalog\Requests\StoreSliderRequest;
use App\Modules\Catalog\Requests\UpdateSliderRequest;
use App\Modules\Media\Services\MediaUploadService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SliderController extends Controller
{
    public function __construct(
        protected MediaUploadService $mediaUploadService
    ) {}

    /**
     * Display a listing of homepage sliders.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('manage-appearance');

        $query = Slider::query()->orderBy('sort_order')->orderByDesc('id');

        if ($search = $request->input('search')) {
            $term = trim((string) $search);
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                    ->orWhere('subtitle', 'like', "%{$term}%");
            });
        }

        $sliders = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Sliders/Index', [
            'sliders' => $sliders,
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Store a newly created slider.
     */
    public function store(StoreSliderRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $imageUpload = $this->mediaUploadService->upload($request->file('image'), 'sliders', [
            'thumb' => 300,
            'medium' => 800,
        ]);
        $imagePath = $imageUpload['file_path'];

        $mobileImagePath = null;
        if ($request->hasFile('mobile_image')) {
            $mobileUpload = $this->mediaUploadService->upload($request->file('mobile_image'), 'sliders', [
                'thumb' => 300,
                'medium' => 600,
            ]);
            $mobileImagePath = $mobileUpload['file_path'];
        }

        $slider = Slider::create([
            'title' => trim($validated['title']),
            'subtitle' => $validated['subtitle'] ?? null,
            'image_path' => $imagePath,
            'mobile_image_path' => $mobileImagePath,
            'link_url' => $validated['link_url'] ?? null,
            'button_text' => $validated['button_text'] ?? null,
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect()
            ->route('admin.sliders.index')
            ->with('success', "Slider '{$slider->title}' created successfully.");
    }

    /**
     * Update the specified slider.
     */
    public function update(UpdateSliderRequest $request, Slider $slider): RedirectResponse
    {
        $validated = $request->validated();

        $imagePath = $slider->image_path;
        if ($request->hasFile('image')) {
            if ($slider->image_path) {
                $this->mediaUploadService->delete($slider->image_path);
            }
            $imageUpload = $this->mediaUploadService->upload($request->file('image'), 'sliders', [
                'thumb' => 300,
                'medium' => 800,
            ]);
            $imagePath = $imageUpload['file_path'];
        }

        $mobileImagePath = $slider->mobile_image_path;
        if ($request->hasFile('mobile_image')) {
            if ($slider->mobile_image_path) {
                $this->mediaUploadService->delete($slider->mobile_image_path);
            }
            $mobileUpload = $this->mediaUploadService->upload($request->file('mobile_image'), 'sliders', [
                'thumb' => 300,
                'medium' => 600,
            ]);
            $mobileImagePath = $mobileUpload['file_path'];
        }

        $slider->update([
            'title' => trim($validated['title']),
            'subtitle' => $validated['subtitle'] ?? null,
            'image_path' => $imagePath,
            'mobile_image_path' => $mobileImagePath,
            'link_url' => $validated['link_url'] ?? null,
            'button_text' => $validated['button_text'] ?? null,
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect()
            ->route('admin.sliders.index')
            ->with('success', "Slider '{$slider->title}' updated successfully.");
    }

    /**
     * Remove the specified slider.
     */
    public function destroy(Slider $slider): RedirectResponse
    {
        Gate::authorize('manage-appearance');

        if ($slider->image_path) {
            $this->mediaUploadService->delete($slider->image_path);
        }
        if ($slider->mobile_image_path) {
            $this->mediaUploadService->delete($slider->mobile_image_path);
        }

        $title = $slider->title;
        $slider->delete();

        return redirect()
            ->route('admin.sliders.index')
            ->with('success', "Slider '{$title}' deleted successfully.");
    }

    /**
     * Toggle the active status of the slider.
     */
    public function toggle(Slider $slider): RedirectResponse
    {
        Gate::authorize('manage-appearance');

        $slider->update([
            'is_active' => ! $slider->is_active,
        ]);

        $status = $slider->is_active ? 'activated' : 'deactivated';

        return redirect()
            ->route('admin.sliders.index')
            ->with('success', "Slider '{$slider->title}' has been {$status}.");
    }
}
