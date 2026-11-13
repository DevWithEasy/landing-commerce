<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Slider;
use App\Modules\Catalog\Requests\StoreSliderRequest;
use App\Modules\Catalog\Requests\UpdateSliderRequest;
use App\Modules\Media\Services\MediaUploadService;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SliderController extends Controller
{
    public function __construct(
        protected MediaUploadService $mediaUploadService,
        protected SettingsService $settingsService
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
            'defaultHero' => $this->settingsService->getDefaultHeroConfig(),
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

    /**
     * Update the default fallback hero section shown when no active sliders exist.
     */
    public function updateDefaultHero(Request $request): RedirectResponse
    {
        Gate::authorize('manage-appearance');

        $validated = $request->validate([
            'badge_text' => ['nullable', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:600'],
            'primary_button_text' => ['nullable', 'string', 'max:80'],
            'primary_button_url' => ['nullable', 'string', 'max:255'],
            'secondary_button_text' => ['nullable', 'string', 'max:80'],
            'secondary_button_url' => ['nullable', 'string', 'max:255'],
            'card_title' => ['nullable', 'string', 'max:120'],
            'card_subtitle' => ['nullable', 'string', 'max:200'],
            'image' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:5120'],
            'remove_image' => ['nullable', 'boolean'],
        ]);

        $sanitizeUrl = static function (?string $url, string $fallback): string {
            $trimmed = trim((string) $url);
            if ($trimmed === '') {
                return $fallback;
            }
            if (preg_match('/^(javascript|data|vbscript):/i', $trimmed) === 1) {
                return $fallback;
            }

            return $trimmed;
        };

        $textFields = [
            'homepage.default_hero.badge_text' => trim((string) ($validated['badge_text'] ?? '')),
            'homepage.default_hero.title' => trim((string) $validated['title']),
            'homepage.default_hero.description' => trim((string) ($validated['description'] ?? '')),
            'homepage.default_hero.primary_button_text' => trim((string) ($validated['primary_button_text'] ?? '')),
            'homepage.default_hero.primary_button_url' => $sanitizeUrl($validated['primary_button_url'] ?? null, '/shop'),
            'homepage.default_hero.secondary_button_text' => trim((string) ($validated['secondary_button_text'] ?? '')),
            'homepage.default_hero.secondary_button_url' => $sanitizeUrl($validated['secondary_button_url'] ?? null, '/shop?sort=latest'),
            'homepage.default_hero.card_title' => trim((string) ($validated['card_title'] ?? '')),
            'homepage.default_hero.card_subtitle' => trim((string) ($validated['card_subtitle'] ?? '')),
        ];

        foreach ($textFields as $key => $value) {
            $this->settingsService->set($key, $value, 'homepage');
        }

        $oldImagePath = (string) $this->settingsService->get('homepage.default_hero.image_path', '');

        if ($request->boolean('remove_image')) {
            if ($oldImagePath !== '') {
                $this->mediaUploadService->delete($oldImagePath);
            }
            $this->settingsService->set('homepage.default_hero.image_path', null, 'homepage');
            $this->settingsService->set('homepage.default_hero.image_url', null, 'homepage');
        } elseif ($request->hasFile('image')) {
            if ($oldImagePath !== '') {
                $this->mediaUploadService->delete($oldImagePath);
            }
            $upload = $this->mediaUploadService->upload($request->file('image'), 'sliders', [
                'thumb' => 300,
                'medium' => 800,
            ]);
            $imagePath = $upload['file_path'];
            $imageUrl = Storage::disk('public')->url($imagePath);

            $this->settingsService->set('homepage.default_hero.image_path', $imagePath, 'homepage');
            $this->settingsService->set('homepage.default_hero.image_url', $imageUrl, 'homepage');
        }

        return redirect()
            ->route('admin.sliders.index')
            ->with('success', 'Default fallback hero updated successfully.');
    }
}
