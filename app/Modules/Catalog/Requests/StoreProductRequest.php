<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Requests;

use App\Modules\Catalog\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Product::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'regular_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'has_variants' => ['boolean'],
            'status' => ['nullable', 'string', 'in:draft,active,archived'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'manage_stock' => ['nullable', 'boolean'],
            'variant_matrix_attributes' => ['nullable', 'array'],
            'variant_matrix_attributes.*' => ['array'],
            'variants' => ['nullable', 'array'],
            'variants.*.sku' => ['nullable', 'string', 'max:100'],
            'variants.*.name' => ['nullable', 'string', 'max:255'],
            'variants.*.attributes' => ['nullable', 'array'],
            'variants.*.regular_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.sale_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock_quantity' => ['nullable', 'integer', 'min:0'],
            'variants.*.manage_stock' => ['nullable', 'boolean'],
            'images' => ['nullable', 'array'],
            'images.*' => ['file', 'mimes:jpeg,png,webp', 'max:10240'],
            'variant_images' => ['nullable', 'array'],
            'variant_images.*' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:10240'],
        ];
    }
}
