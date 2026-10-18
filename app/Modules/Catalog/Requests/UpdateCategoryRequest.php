<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Requests;

use App\Modules\Catalog\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use InvalidArgumentException;

class UpdateCategoryRequest extends FormRequest
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
        /** @var Category|null $category */
        $category = $this->route('category');
        $categoryId = $category?->id ?? (int) $this->route('id');

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')->ignore($categoryId),
            ],
            'description' => ['nullable', 'string', 'max:2000'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:10240'],
        ];
    }

    /**
     * Configure the validator instance with custom hierarchy validation.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            /** @var Category|null $category */
            $category = $this->route('category');
            $categoryId = $category?->id ?? (int) $this->route('id');

            $parentId = $this->filled('parent_id') ? (int) $this->input('parent_id') : null;

            if ($parentId !== null) {
                try {
                    Category::validateHierarchy($parentId, $categoryId);
                } catch (InvalidArgumentException $e) {
                    $v->errors()->add('parent_id', $e->getMessage());
                }
            }
        });
    }
}
