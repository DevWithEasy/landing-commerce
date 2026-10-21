<?php

declare(strict_types=1);

namespace App\Modules\Settings\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Couriers\Services\CourierManager;
use App\Modules\Settings\Requests\UpdateSettingsRequest;
use App\Modules\Settings\Services\SettingsService;
use App\Modules\Sms\Services\SmsManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function __construct(
        protected SettingsService $settingsService,
        protected CourierManager $courierManager,
        protected SmsManager $smsManager
    ) {}

    /**
     * Display the settings and credentials dashboard.
     */
    public function index(): Response
    {
        Gate::authorize('manage-settings');

        $maskedSettings = $this->settingsService->getMaskedSettingsForUi();

        $aiModels = (array) config('ai.gemini.models', []);
        $defaultAiModel = (string) config('ai.gemini.default_model', 'gemini-3.6-flash');

        // A previously saved model may have been removed or become unavailable.
        // Show the effective fallback instead of a blank/stale model selection.
        if (! array_key_exists((string) ($maskedSettings['ai_model'] ?? ''), $aiModels)) {
            $maskedSettings['ai_model'] = $defaultAiModel;
        }

        $courierDrivers = [
            'mock' => 'Mock Courier (Offline Simulation)',
            'steadfast' => 'Steadfast Courier',
            'pathao' => 'Pathao Courier',
            'redx' => 'RedX Courier',
        ];

        $smsDrivers = [
            'mock' => 'Mock SMS (Offline Simulation)',
            'greenweb' => 'Greenweb SMS',
            'ssl_wireless' => 'SSL Wireless SMS',
            'smspoh' => 'SMSPoh SMS',
        ];

        $courierConfigured = [
            'mock' => true,
            'steadfast' => $this->courierManager->isConfigured('steadfast'),
            'pathao' => $this->courierManager->isConfigured('pathao'),
            'redx' => $this->courierManager->isConfigured('redx'),
        ];

        $smsConfigured = [
            'mock' => true,
            'greenweb' => $this->smsManager->isConfigured('greenweb'),
            'ssl_wireless' => $this->smsManager->isConfigured('ssl_wireless'),
            'smspoh' => $this->smsManager->isConfigured('smspoh'),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $maskedSettings,
            'courierDrivers' => $courierDrivers,
            'smsDrivers' => $smsDrivers,
            'courierConfigured' => $courierConfigured,
            'smsConfigured' => $smsConfigured,
            'aiModels' => $aiModels,
        ]);
    }

    /**
     * Update integration credentials and general settings.
     */
    public function update(UpdateSettingsRequest $request): RedirectResponse
    {
        Gate::authorize('manage-settings');

        $this->settingsService->updateSettings($request->validated());

        return redirect()
            ->route('admin.settings.index')
            ->with('success', 'Settings and API credentials updated successfully.');
    }
}
