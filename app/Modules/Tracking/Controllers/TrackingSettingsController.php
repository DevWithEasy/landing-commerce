<?php

declare(strict_types=1);

namespace App\Modules\Tracking\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\Tracking\Requests\UpdateTrackingSettingsRequest;
use App\Modules\Tracking\Services\TrackingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TrackingSettingsController extends Controller
{
    public function __construct(
        protected TrackingService $trackingService
    ) {}

    /**
     * Display the tracking & marketing pixels management dashboard.
     */
    public function index(): Response
    {
        Gate::authorize('manage-settings');

        $globalSettings = $this->trackingService->getGlobalSettings();

        $landingPages = LandingPage::query()
            ->select(['id', 'title', 'slug', 'status', 'tracking_settings'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn (LandingPage $page) => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'status' => $page->status,
                'override_global' => ! empty($page->tracking_settings['override_global']),
                'tracking_settings' => $page->tracking_settings,
            ]);

        return Inertia::render('Admin/Tracking/Index', [
            'settings' => $globalSettings,
            'landingPages' => $landingPages,
        ]);
    }

    /**
     * Update the global tracking configuration.
     */
    public function update(UpdateTrackingSettingsRequest $request): RedirectResponse
    {
        Gate::authorize('manage-settings');

        $this->trackingService->updateGlobalSettings($request->validated());

        return redirect()
            ->route('admin.tracking.index')
            ->with('success', 'Marketing Pixels & Analytics configuration updated successfully.');
    }

    /**
     * Update page-specific tracking override.
     */
    public function updatePage(Request $request, LandingPage $landingPage): RedirectResponse
    {
        Gate::authorize('manage-settings');

        $validated = $request->validate([
            'override_global' => ['required', 'boolean'],
            'meta_pixel' => ['nullable', 'array'],
            'meta_pixel.enabled' => ['boolean'],
            'meta_pixel.pixel_id' => ['nullable', 'string', 'regex:'.TrackingService::META_PIXEL_REGEX],

            'ga4' => ['nullable', 'array'],
            'ga4.enabled' => ['boolean'],
            'ga4.measurement_id' => ['nullable', 'string', 'regex:'.TrackingService::GA4_REGEX],

            'google_ads' => ['nullable', 'array'],
            'google_ads.enabled' => ['boolean'],
            'google_ads.conversion_id' => ['nullable', 'string', 'regex:'.TrackingService::GOOGLE_ADS_ID_REGEX],
            'google_ads.conversion_label' => ['nullable', 'string', 'regex:'.TrackingService::GOOGLE_ADS_LABEL_REGEX],

            'tiktok_pixel' => ['nullable', 'array'],
            'tiktok_pixel.enabled' => ['boolean'],
            'tiktok_pixel.pixel_id' => ['nullable', 'string', 'regex:'.TrackingService::TIKTOK_PIXEL_REGEX],

            'gtm' => ['nullable', 'array'],
            'gtm.enabled' => ['boolean'],
            'gtm.container_id' => ['nullable', 'string', 'regex:'.TrackingService::GTM_REGEX],
        ]);

        $landingPage->update([
            'tracking_settings' => $validated,
        ]);

        return redirect()->route('admin.tracking.index')->with('success', "Custom tracking for '{$landingPage->title}' updated successfully.");
    }
}
