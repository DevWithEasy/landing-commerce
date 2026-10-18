<?php

declare(strict_types=1);

namespace App\Modules\Settings\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Media\Services\MediaUploadService;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AppearanceController extends Controller
{
    public function __construct(
        protected SettingsService $settingsService,
        protected MediaUploadService $mediaUploadService
    ) {}

    /**
     * Display appearance, branding, and theme settings.
     */
    public function index(): Response
    {
        Gate::authorize('manage-appearance');

        $settings = [
            // Storefront Mode
            'storefront_mode' => (string) $this->settingsService->get('storefront.mode', 'full_storefront'),
            'home_landing_page_id' => $this->settingsService->get('storefront.home_landing_page_id'),

            // Branding
            'store_name' => (string) $this->settingsService->get('store.name', config('app.name', 'Landing Commerce')),
            'store_logo_url' => (string) $this->settingsService->get('store.logo_url', ''),
            'store_favicon_url' => (string) $this->settingsService->get('store.favicon_url', ''),
            'support_phone' => (string) $this->settingsService->get('store.phone', ''),
            'support_whatsapp' => (string) $this->settingsService->get('store.whatsapp', ''),

            // Theme Colors & Typography
            'primary_color' => (string) $this->settingsService->get('theme.primary_color', '#4f46e5'),
            'secondary_color' => (string) $this->settingsService->get('theme.secondary_color', '#06b6d4'),
            'accent_color' => (string) $this->settingsService->get('theme.accent_color', '#f59e0b'),
            'background_color' => (string) $this->settingsService->get('theme.background_color', '#f8fafc'),
            'text_color' => (string) $this->settingsService->get('theme.text_color', '#0f172a'),
            'font_family' => (string) $this->settingsService->get('theme.font_family', 'Hind Siliguri, Inter, sans-serif'),
            'custom_css' => (string) $this->settingsService->get('theme.custom_css', ''),
        ];

        $landingPages = LandingPage::query()
            ->where('status', 'published')
            ->orderBy('title')
            ->get(['id', 'title', 'slug']);

        return Inertia::render('Admin/Appearance/Theme', [
            'settings' => $settings,
            'landingPages' => $landingPages,
        ]);
    }

    /**
     * Update appearance, branding, and theme settings.
     */
    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('manage-appearance');

        $validated = $request->validate([
            'storefront_mode' => ['required', 'string', 'in:full_storefront,landing_page_home'],
            'home_landing_page_id' => ['nullable', 'integer', 'exists:landing_pages,id'],

            'store_name' => ['required', 'string', 'max:255'],
            'support_phone' => ['nullable', 'string', 'max:50'],
            'support_whatsapp' => ['nullable', 'string', 'max:50'],

            'primary_color' => ['nullable', 'string', 'regex:/^#([a-f0-9]{3}){1,2}$/i'],
            'secondary_color' => ['nullable', 'string', 'regex:/^#([a-f0-9]{3}){1,2}$/i'],
            'accent_color' => ['nullable', 'string', 'regex:/^#([a-f0-9]{3}){1,2}$/i'],
            'background_color' => ['nullable', 'string', 'regex:/^#([a-f0-9]{3}){1,2}$/i'],
            'text_color' => ['nullable', 'string', 'regex:/^#([a-f0-9]{3}){1,2}$/i'],
            'font_family' => ['nullable', 'string', 'max:255'],
            'custom_css' => ['nullable', 'string', 'max:10000'],

            'logo' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:5120'],
            'favicon' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:2048'],
        ]);

        // Save Storefront Mode
        $this->settingsService->set('storefront.mode', $validated['storefront_mode'], 'storefront');
        $this->settingsService->set(
            'storefront.home_landing_page_id',
            ! empty($validated['home_landing_page_id']) ? (string) $validated['home_landing_page_id'] : null,
            'storefront'
        );

        // Save Store Info
        $this->settingsService->set('store.name', $validated['store_name'], 'general');
        $this->settingsService->set('store.phone', $validated['support_phone'] ?? null, 'general');
        $this->settingsService->set('store.whatsapp', $validated['support_whatsapp'] ?? null, 'general');

        // Handle Logo Upload
        if ($request->hasFile('logo')) {
            $upload = $this->mediaUploadService->upload($request->file('logo'), 'branding');
            $logoUrl = Storage::disk('public')->url($upload['file_path']);
            $this->settingsService->set('store.logo_url', $logoUrl, 'branding');
        }

        // Handle Favicon Upload
        if ($request->hasFile('favicon')) {
            $upload = $this->mediaUploadService->upload($request->file('favicon'), 'branding');
            $faviconUrl = Storage::disk('public')->url($upload['file_path']);
            $this->settingsService->set('store.favicon_url', $faviconUrl, 'branding');
        }

        // Save Theme Colors & Styling
        $this->settingsService->set('theme.primary_color', $validated['primary_color'] ?? '#4f46e5', 'theme');
        $this->settingsService->set('theme.secondary_color', $validated['secondary_color'] ?? '#06b6d4', 'theme');
        $this->settingsService->set('theme.accent_color', $validated['accent_color'] ?? '#f59e0b', 'theme');
        $this->settingsService->set('theme.background_color', $validated['background_color'] ?? '#f8fafc', 'theme');
        $this->settingsService->set('theme.text_color', $validated['text_color'] ?? '#0f172a', 'theme');
        $this->settingsService->set('theme.font_family', $validated['font_family'] ?? 'Hind Siliguri, Inter, sans-serif', 'theme');
        $this->settingsService->set('theme.custom_css', $validated['custom_css'] ?? null, 'theme');

        return redirect()
            ->route('admin.appearance.theme')
            ->with('success', 'Appearance and Theme settings updated successfully.');
    }
}
