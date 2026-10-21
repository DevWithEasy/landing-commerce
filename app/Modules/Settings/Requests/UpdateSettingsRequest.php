<?php

declare(strict_types=1);

namespace App\Modules\Settings\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageSettings();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            // Courier
            'courier_default' => ['nullable', 'string', 'in:mock,steadfast,pathao,redx'],
            'steadfast_api_key' => ['nullable', 'string', 'max:255'],
            'steadfast_secret_key' => ['nullable', 'string', 'max:255'],
            'steadfast_base_url' => ['nullable', 'string', 'url', 'max:255'],

            'pathao_client_id' => ['nullable', 'string', 'max:255'],
            'pathao_client_secret' => ['nullable', 'string', 'max:255'],
            'pathao_username' => ['nullable', 'string', 'max:255'],
            'pathao_password' => ['nullable', 'string', 'max:255'],
            'pathao_store_id' => ['nullable', 'string', 'max:100'],
            'pathao_base_url' => ['nullable', 'string', 'url', 'max:255'],

            'redx_api_token' => ['nullable', 'string', 'max:255'],
            'redx_base_url' => ['nullable', 'string', 'url', 'max:255'],

            // SMS
            'sms_default' => ['nullable', 'string', 'in:mock,greenweb,ssl_wireless,smspoh'],
            'greenweb_token' => ['nullable', 'string', 'max:255'],
            'greenweb_base_url' => ['nullable', 'string', 'url', 'max:255'],

            'ssl_wireless_api_token' => ['nullable', 'string', 'max:255'],
            'ssl_wireless_sid' => ['nullable', 'string', 'max:255'],
            'ssl_wireless_base_url' => ['nullable', 'string', 'url', 'max:255'],

            'smspoh_token' => ['nullable', 'string', 'max:255'],
            'smspoh_sender_id' => ['nullable', 'string', 'max:50'],
            'smspoh_base_url' => ['nullable', 'string', 'url', 'max:255'],

            // Store Info
            'store_name' => ['nullable', 'string', 'max:100'],
            'store_phone' => ['nullable', 'string', 'max:50'],
            'store_whatsapp' => ['nullable', 'string', 'max:50'],

            // Customer-owned AI Design Generator
            'ai_gemini_api_key' => ['nullable', 'string', 'max:255'],
            'ai_model' => [
                'nullable',
                'string',
                'in:'.implode(',', array_keys((array) config('ai.gemini.models', []))),
            ],
            'ai_enabled' => ['nullable', 'boolean'],
        ];
    }
}
