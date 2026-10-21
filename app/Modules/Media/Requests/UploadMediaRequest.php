<?php

declare(strict_types=1);

namespace App\Modules\Media\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadMediaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canManageMedia() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'images' => ['required', 'array', 'min:1', 'max:20'],
            'images.*' => ['required', 'file', 'mimes:jpeg,png,webp', 'max:10240'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'images.required' => 'Please choose at least one image to upload.',
            'images.max' => 'You can upload up to 20 images at a time.',
            'images.*.mimes' => 'Only JPEG, PNG, and WebP images are allowed.',
            'images.*.max' => 'Each image may not be larger than 10 MB.',
        ];
    }
}
