<?php

declare(strict_types=1);

namespace App\Modules\Settings\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TestCourierConnectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canManageSettings() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'driver' => ['required', 'string', 'in:mock,steadfast,pathao,redx'],

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
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'driver.required' => 'Choose a courier driver to test.',
            'driver.in' => 'The selected courier driver is not supported.',
        ];
    }
}
