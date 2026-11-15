<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Requests;

use App\Modules\Catalog\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use InvalidArgumentException;

class StoreCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canManageCategories() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:categories,slug'],
            'description' => ['nullable', 'string', 'max:2000'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:10240'],
            'image_path' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Configure the validator instance with custom hierarchy validation.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $parentId = $this->filled('parent_id') ? (int) $this->input('parent_id') : null;

            if ($parentId !== null) {
                try {
                    Category::validateHierarchy($parentId);
                } catch (InvalidArgumentException $e) {
                    $v->errors()->add('parent_id', $e->getMessage());
                }
            }
        });
    }
}
