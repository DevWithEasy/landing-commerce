<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Actions;

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Catalog\Services\VariantMatrixGenerator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class CreateProductAction
{
    public function __construct(
        protected VariantMatrixGenerator $matrixGenerator
    ) {}

    /**
     * @param array{
     *     title: string,
     *     slug?: string|null,
     *     description?: string|null,
     *     regular_price: float|string|int,
     *     sale_price?: float|string|int|null,
     *     has_variants?: bool,
     *     status?: string,
     *     stock_quantity?: int,
     *     manage_stock?: bool,
     *     variant_matrix_attributes?: array<string, array<string>>,
     *     variants?: array<int, array{
     *         sku?: string|null,
     *         name?: string|null,
     *         attributes?: array<string, string>|null,
     *         regular_price?: float|string|int|null,
     *         sale_price?: float|string|int|null,
     *         stock_quantity?: int,
     *         manage_stock?: bool
     *     }>
     * } $data
     */
    public function execute(array $data): Product
    {
        if (empty(trim($data['title'] ?? ''))) {
            throw new InvalidArgumentException('Product title is required.');
        }

        $regularPrice = (float) ($data['regular_price'] ?? 0);
        if ($regularPrice < 0) {
            throw new InvalidArgumentException('Regular price cannot be negative.');
        }

        $salePrice = isset($data['sale_price']) && $data['sale_price'] !== null && $data['sale_price'] !== ''
            ? (float) $data['sale_price']
            : null;

        if ($salePrice !== null && $salePrice < 0) {
            throw new InvalidArgumentException('Sale price cannot be negative.');
        }

        return DB::transaction(function () use ($data, $regularPrice, $salePrice): Product {
            $baseSlug = ! empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($data['title']);
            $slug = $this->generateUniqueSlug($baseSlug);

            $hasVariants = (bool) ($data['has_variants'] ?? false);

            $product = Product::create([
                'title' => trim($data['title']),
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'regular_price' => $regularPrice,
                'sale_price' => $salePrice,
                'has_variants' => $hasVariants,
                'status' => $data['status'] ?? 'draft',
            ]);

            if ($hasVariants) {
                if (! empty($data['variant_matrix_attributes'])) {
                    $matrix = $this->matrixGenerator->generate($data['variant_matrix_attributes']);
                    foreach ($matrix as $combo) {
                        $variantSku = $this->generateUniqueSku(strtoupper($slug.'-'.$combo['sku_suffix']));
                        ProductVariant::create([
                            'product_id' => $product->id,
                            'sku' => $variantSku,
                            'name' => $combo['name'],
                            'attributes' => $combo['attributes'],
                            'regular_price' => $regularPrice,
                            'sale_price' => $salePrice,
                            'stock_quantity' => $data['stock_quantity'] ?? 0,
                            'manage_stock' => $data['manage_stock'] ?? true,
                        ]);
                    }
                } elseif (! empty($data['variants'])) {
                    foreach ($data['variants'] as $vData) {
                        $vSku = ! empty($vData['sku'])
                            ? strtoupper(trim($vData['sku']))
                            : $this->generateUniqueSku(strtoupper($slug.'-VAR'));

                        ProductVariant::create([
                            'product_id' => $product->id,
                            'sku' => $vSku,
                            'name' => $vData['name'] ?? 'Variant',
                            'attributes' => $vData['attributes'] ?? null,
                            'regular_price' => isset($vData['regular_price']) ? (float) $vData['regular_price'] : $regularPrice,
                            'sale_price' => isset($vData['sale_price']) && $vData['sale_price'] !== null ? (float) $vData['sale_price'] : $salePrice,
                            'stock_quantity' => $vData['stock_quantity'] ?? 0,
                            'manage_stock' => $vData['manage_stock'] ?? true,
                        ]);
                    }
                }
            } else {
                $defaultSku = $this->generateUniqueSku(strtoupper(str_replace('-', '', $slug)));
                ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $defaultSku,
                    'name' => 'Default',
                    'attributes' => null,
                    'regular_price' => $regularPrice,
                    'sale_price' => $salePrice,
                    'stock_quantity' => $data['stock_quantity'] ?? 0,
                    'manage_stock' => $data['manage_stock'] ?? true,
                ]);
            }

            return $product->load('variants');
        });
    }

    protected function generateUniqueSlug(string $baseSlug): string
    {
        $slug = $baseSlug;
        $counter = 1;

        while (Product::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    protected function generateUniqueSku(string $baseSku): string
    {
        $sku = $baseSku;
        $counter = 1;

        while (ProductVariant::where('sku', $sku)->exists()) {
            $sku = "{$baseSku}-{$counter}";
            $counter++;
        }

        return $sku;
    }
}
