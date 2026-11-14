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
            'promoBanners' => $this->settingsService->getPromoBannersConfig(),
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Sanitize a relative storage path selected from the Media Library.
     */
    protected function sanitizeMediaPath(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        $trimmed = ltrim(trim($path), '/');
        if (
            $trimmed === ''
            || str_contains($trimmed, '..')
            || preg_match('#^(https?:|javascript:|data:|vbscript:)#i', $trimmed) === 1
        ) {
            return null;
        }

        if (str_starts_with($trimmed, 'storage/')) {
            $trimmed = substr($trimmed, strlen('storage/'));
        }

        return Storage::disk('public')->exists($trimmed) ? $trimmed : null;
    }

    /**
     * Store a newly created slider.
     */
    public function store(StoreSliderRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imageUpload = $this->mediaUploadService->upload($request->file('image'), 'sliders', [
                'thumb' => 300,
                'medium' => 800,
            ]);
            $imagePath = $imageUpload['file_path'];
        } else {
            $imagePath = $this->sanitizeMediaPath($validated['image_path'] ?? null);
        }

        if (! $imagePath) {
            return back()->withErrors(['image' => 'Please upload a valid image or select one from the Media Library.']);
        }

        $mobileImagePath = null;
        if ($request->hasFile('mobile_image')) {
            $mobileUpload = $this->mediaUploadService->upload($request->file('mobile_image'), 'sliders', [
                'thumb' => 300,
                'medium' => 600,
            ]);
            $mobileImagePath = $mobileUpload['file_path'];
        } elseif (! empty($validated['mobile_image_path'])) {
            $mobileImagePath = $this->sanitizeMediaPath($validated['mobile_image_path']);
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
            if ($slider->image_path && str_starts_with($slider->image_path, 'sliders/')) {
                $this->mediaUploadService->delete($slider->image_path);
            }
            $imageUpload = $this->mediaUploadService->upload($request->file('image'), 'sliders', [
                'thumb' => 300,
                'medium' => 800,
            ]);
            $imagePath = $imageUpload['file_path'];
        } elseif (! empty($validated['image_path'])) {
            $mediaPath = $this->sanitizeMediaPath($validated['image_path']);
            if ($mediaPath) {
                $imagePath = $mediaPath;
            }
        }

        $mobileImagePath = $slider->mobile_image_path;
        if ($request->hasFile('mobile_image')) {
            if ($slider->mobile_image_path && str_starts_with($slider->mobile_image_path, 'sliders/')) {
                $this->mediaUploadService->delete($slider->mobile_image_path);
            }
            $mobileUpload = $this->mediaUploadService->upload($request->file('mobile_image'), 'sliders', [
                'thumb' => 300,
                'medium' => 600,
            ]);
            $mobileImagePath = $mobileUpload['file_path'];
        } elseif (! empty($validated['mobile_image_path'])) {
            $mediaMobilePath = $this->sanitizeMediaPath($validated['mobile_image_path']);
            if ($mediaMobilePath) {
                $mobileImagePath = $mediaMobilePath;
            }
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
            'image_path' => ['nullable', 'string', 'max:500'],
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
            if ($oldImagePath !== '' && str_starts_with($oldImagePath, 'sliders/')) {
                $this->mediaUploadService->delete($oldImagePath);
            }
            $this->settingsService->set('homepage.default_hero.image_path', null, 'homepage');
            $this->settingsService->set('homepage.default_hero.image_url', null, 'homepage');
        } elseif ($request->hasFile('image')) {
            if ($oldImagePath !== '' && str_starts_with($oldImagePath, 'sliders/')) {
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
        } elseif (! empty($validated['image_path'])) {
            $mediaPath = $this->sanitizeMediaPath($validated['image_path']);
            if ($mediaPath) {
                $this->settingsService->set('homepage.default_hero.image_path', $mediaPath, 'homepage');
                $this->settingsService->set('homepage.default_hero.image_url', Storage::disk('public')->url($mediaPath), 'homepage');
            }
        }

        return redirect()
            ->route('admin.sliders.index')
            ->with('success', 'Default fallback hero updated successfully.');
    }

    /**
     * Update the homepage dual promo banners (Seasonal Sale & Combo Deals).
     */
    public function updatePromoBanners(Request $request): RedirectResponse
    {
        Gate::authorize('manage-appearance');

        $validated = $request->validate([
            'enabled' => ['nullable', 'boolean'],
            'seasonal_badge' => ['nullable', 'string', 'max:100'],
            'seasonal_title' => ['required', 'string', 'max:160'],
            'seasonal_subtitle' => ['nullable', 'string', 'max:255'],
            'seasonal_button_text' => ['nullable', 'string', 'max:80'],
            'seasonal_button_url' => ['nullable', 'string', 'max:255'],
            'seasonal_image' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:5120'],
            'seasonal_image_path' => ['nullable', 'string', 'max:500'],
            'remove_seasonal_image' => ['nullable', 'boolean'],
            'combo_title' => ['required', 'string', 'max:160'],
            'combo_subtitle' => ['nullable', 'string', 'max:255'],
            'combo_button_text' => ['nullable', 'string', 'max:80'],
            'combo_button_url' => ['nullable', 'string', 'max:255'],
            'combo_badge_label' => ['nullable', 'string', 'max:40'],
            'combo_badge_value' => ['nullable', 'string', 'max:40'],
            'combo_image' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:5120'],
            'combo_image_path' => ['nullable', 'string', 'max:500'],
            'remove_combo_image' => ['nullable', 'boolean'],
        ]);

        $sanitizeUrl = static function (?string $url, string $fallback): string {
            $trimmed = trim((string) $url);
            if ($trimmed === '' || preg_match('/^(javascript|data|vbscript):/i', $trimmed) === 1) {
                return $fallback;
            }

            return $trimmed;
        };

        $this->settingsService->set(
            'homepage.promo_banners.enabled',
            $request->boolean('enabled', true) ? '1' : '0',
            'homepage'
        );

        $fields = [
            'homepage.promo_banners.seasonal.badge' => trim((string) ($validated['seasonal_badge'] ?? '')),
            'homepage.promo_banners.seasonal.title' => trim((string) $validated['seasonal_title']),
            'homepage.promo_banners.seasonal.subtitle' => trim((string) ($validated['seasonal_subtitle'] ?? '')),
            'homepage.promo_banners.seasonal.button_text' => trim((string) ($validated['seasonal_button_text'] ?? '')),
            'homepage.promo_banners.seasonal.button_url' => $sanitizeUrl($validated['seasonal_button_url'] ?? null, '/shop'),
            'homepage.promo_banners.combo.title' => trim((string) $validated['combo_title']),
            'homepage.promo_banners.combo.subtitle' => trim((string) ($validated['combo_subtitle'] ?? '')),
            'homepage.promo_banners.combo.button_text' => trim((string) ($validated['combo_button_text'] ?? '')),
            'homepage.promo_banners.combo.button_url' => $sanitizeUrl($validated['combo_button_url'] ?? null, '/shop'),
            'homepage.promo_banners.combo.badge_label' => trim((string) ($validated['combo_badge_label'] ?? '')),
            'homepage.promo_banners.combo.badge_value' => trim((string) ($validated['combo_badge_value'] ?? '')),
        ];

        foreach ($fields as $key => $value) {
            $this->settingsService->set($key, $value, 'homepage');
        }

        foreach (['seasonal' => 'seasonal_image', 'combo' => 'combo_image'] as $prefix => $fileInput) {
            $pathKey = "homepage.promo_banners.{$prefix}.image_path";
            $urlKey = "homepage.promo_banners.{$prefix}.image_url";
            $oldPath = (string) $this->settingsService->get($pathKey, '');

            if ($request->boolean("remove_{$prefix}_image")) {
                if ($oldPath !== '' && str_starts_with($oldPath, 'sliders/')) {
                    $this->mediaUploadService->delete($oldPath);
                }
                $this->settingsService->set($pathKey, null, 'homepage');
                $this->settingsService->set($urlKey, null, 'homepage');
            } elseif ($request->hasFile($fileInput)) {
                if ($oldPath !== '' && str_starts_with($oldPath, 'sliders/')) {
                    $this->mediaUploadService->delete($oldPath);
                }
                $upload = $this->mediaUploadService->upload($request->file($fileInput), 'sliders', [
                    'thumb' => 300,
                    'medium' => 800,
                ]);
                $imagePath = $upload['file_path'];
                $this->settingsService->set($pathKey, $imagePath, 'homepage');
                $this->settingsService->set($urlKey, Storage::disk('public')->url($imagePath), 'homepage');
            } elseif (! empty($validated["{$prefix}_image_path"])) {
                $mediaPath = $this->sanitizeMediaPath($validated["{$prefix}_image_path"]);
                if ($mediaPath) {
                    $this->settingsService->set($pathKey, $mediaPath, 'homepage');
                    $this->settingsService->set($urlKey, Storage::disk('public')->url($mediaPath), 'homepage');
                }
            }
        }

        return redirect()
            ->route('admin.sliders.index')
            ->with('success', 'Homepage promo banners updated successfully.');
    }
}
