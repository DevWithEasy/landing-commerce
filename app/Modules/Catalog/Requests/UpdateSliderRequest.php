<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSliderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canManageAppearance() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:10240'],
            'mobile_image' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:10240'],
            'link_url' => ['nullable', 'string', 'max:2048'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
