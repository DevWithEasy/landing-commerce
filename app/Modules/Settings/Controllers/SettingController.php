<?php

declare(strict_types=1);

namespace App\Modules\Settings\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Couriers\Exceptions\CourierException;
use App\Modules\Couriers\Services\CourierManager;
use App\Modules\Settings\Requests\TestCourierConnectionRequest;
use App\Modules\Settings\Requests\UpdateSettingsRequest;
use App\Modules\Settings\Services\SettingsService;
use App\Modules\Sms\Services\SmsManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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

    /**
     * Verify the courier credentials and endpoint currently entered in the form
     * without persisting them.
     */
    public function testCourierConnection(TestCourierConnectionRequest $request): JsonResponse
    {
        Gate::authorize('manage-settings');

        $driver = (string) $request->input('driver');
        $config = $this->courierTestConfig($driver, $request->validated());

        try {
            $result = $this->courierManager->testConnection($driver, $config);
        } catch (CourierException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        } catch (Throwable) {
            return response()->json([
                'success' => false,
                'message' => 'Could not verify the courier connection. Please try again.',
            ], 500);
        }

        return response()->json($result->toArray());
    }

    /**
     * Build a driver configuration from the submitted form values, falling back
     * to saved encrypted settings for blank or masked secrets.
     *
     * @param  array<string, mixed>  $input
     * @return array<string, string>
     */
    protected function courierTestConfig(string $driver, array $input): array
    {
        return match ($driver) {
            'mock' => [],
            'steadfast' => [
                'api_key' => $this->resolveCourierSecret(
                    $input['steadfast_api_key'] ?? null,
                    'courier.steadfast.api_key'
                ),
                'secret_key' => $this->resolveCourierSecret(
                    $input['steadfast_secret_key'] ?? null,
                    'courier.steadfast.secret_key'
                ),
                'base_url' => $this->resolveCourierValue(
                    $input['steadfast_base_url'] ?? null,
                    'courier.steadfast.base_url',
                    'https://portal.steadfast.com.bd/api/v1'
                ),
            ],
            'pathao' => [
                'client_id' => $this->resolveCourierSecret(
                    $input['pathao_client_id'] ?? null,
                    'courier.pathao.client_id'
                ),
                'client_secret' => $this->resolveCourierSecret(
                    $input['pathao_client_secret'] ?? null,
                    'courier.pathao.client_secret'
                ),
                'username' => $this->resolveCourierSecret(
                    $input['pathao_username'] ?? null,
                    'courier.pathao.username'
                ),
                'password' => $this->resolveCourierSecret(
                    $input['pathao_password'] ?? null,
                    'courier.pathao.password'
                ),
                'store_id' => $this->resolveCourierValue(
                    $input['pathao_store_id'] ?? null,
                    'courier.pathao.store_id'
                ),
                'base_url' => $this->resolveCourierValue(
                    $input['pathao_base_url'] ?? null,
                    'courier.pathao.base_url',
                    'https://api-hermes.pathao.com'
                ),
            ],
            'redx' => [
                'api_token' => $this->resolveCourierSecret(
                    $input['redx_api_token'] ?? null,
                    'courier.redx.api_token'
                ),
                'base_url' => $this->resolveCourierValue(
                    $input['redx_base_url'] ?? null,
                    'courier.redx.base_url',
                    'https://openapi.redx.com.bd/v1.0.0-sandbox'
                ),
            ],
            default => [],
        };
    }

    /**
     * Resolve a secret from the submitted value or the saved encrypted setting.
     */
    protected function resolveCourierSecret(mixed $input, string $settingKey): string
    {
        $value = is_string($input) ? trim($input) : '';

        if ($value === '' || $value === SettingsService::SECRET_MASK || str_starts_with($value, '••••')) {
            return trim((string) $this->settingsService->get($settingKey, ''));
        }

        return $value;
    }

    /**
     * Resolve a non-secret value from the submitted value or the saved setting.
     */
    protected function resolveCourierValue(mixed $input, string $settingKey, string $default = ''): string
    {
        $value = is_string($input) ? trim($input) : '';

        if ($value !== '') {
            return $value;
        }

        return trim((string) $this->settingsService->get($settingKey, $default));
    }
}
