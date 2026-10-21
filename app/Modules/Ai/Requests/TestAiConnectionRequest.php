<?php

declare(strict_types=1);

namespace App\Modules\Ai\Requests;

use App\Modules\Settings\Services\SettingsService;
use Illuminate\Foundation\Http\FormRequest;

class TestAiConnectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageSettings() ?? false;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        $models = array_keys((array) config('ai.gemini.models', []));

        return [
            'api_key' => ['nullable', 'string', 'max:255'],
            'model' => ['required', 'string', 'in:'.implode(',', $models)],
        ];
    }

    protected function prepareForValidation(): void
    {
        $apiKey = $this->input('api_key');

        if (is_string($apiKey) && (
            $apiKey === SettingsService::SECRET_MASK
            || str_starts_with($apiKey, '••••')
        )) {
            $this->merge(['api_key' => null]);
        }

        if (is_string($this->input('api_key'))) {
            $this->merge(['api_key' => trim($this->input('api_key'))]);
        }

        $models = (array) config('ai.gemini.models', []);
        $model = $this->input('model');

        // A browser tab may still hold a previously selected model that has
        // since been removed. Test the effective fallback instead of failing.
        if (! is_string($model) || ! array_key_exists($model, $models)) {
            $this->merge([
                'model' => (string) config('ai.gemini.default_model', 'gemini-3.6-flash'),
            ]);
        }
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'model.required' => 'Choose a Gemini model to test.',
            'model.in' => 'The selected Gemini model is not supported.',
        ];
    }
}
