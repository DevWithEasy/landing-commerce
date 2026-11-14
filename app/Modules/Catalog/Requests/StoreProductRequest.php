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
            'combo_pack_size' => ['nullable', 'integer', 'min:1', 'max:12'],
            'combo_colors' => ['nullable', 'array'],
            'combo_colors.*.name' => ['nullable', 'string', 'max:100'],
            'combo_colors.*.image_url' => ['nullable', 'string', 'max:500'],
            'combo_color_images' => ['nullable', 'array'],
            'combo_color_images.*' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:10240'],
            'combo_sizes' => ['nullable', 'array'],
            'combo_sizes.*' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'in:draft,active,archived'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'manage_stock' => ['nullable', 'boolean'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
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
            'featured_image' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:10240'],
            'featured_library_path' => ['nullable', 'string', 'max:500'],
            'images' => ['nullable', 'array'],
            'images.*' => ['file', 'mimes:jpeg,png,webp', 'max:10240'],
            'gallery_library_paths' => ['nullable', 'array'],
            'gallery_library_paths.*' => ['nullable', 'string', 'max:500'],
            'variant_images' => ['nullable', 'array'],
            'variant_images.*' => ['nullable', 'file', 'mimes:jpeg,png,webp', 'max:10240'],
        ];
    }
}
