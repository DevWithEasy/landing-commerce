<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Requests;

use App\Modules\PageBuilder\Controllers\PublicLandingPageController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLandingPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageLandingPages() ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
                Rule::unique('landing_pages', 'slug'),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $slug = strtolower(trim((string) $value));
                    if (str_starts_with($slug, '.') || in_array($slug, PublicLandingPageController::RESERVED_SLUGS, true)) {
                        $fail('The selected URL slug is reserved by the system.');
                    }
                },
            ],
            'product_id' => ['nullable', 'exists:products,id'],
            'status' => ['nullable', 'in:draft,published'],
            'is_default' => ['nullable', 'boolean'],
            'meta_seo' => ['nullable', 'array'],
            'meta_seo.title' => ['nullable', 'string', 'max:255'],
            'meta_seo.description' => ['nullable', 'string', 'max:500'],
            'meta_seo.keywords' => ['nullable', 'string', 'max:255'],
            'settings' => ['nullable', 'array'],
            'settings.primaryColor' => ['nullable', 'string', 'max:50'],
            'settings.fontFamily' => ['nullable', 'string', 'max:50'],
            'settings.containerMaxWidth' => ['nullable', 'string', 'max:50'],
        ];
    }
}
