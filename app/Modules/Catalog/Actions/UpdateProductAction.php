<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Actions;

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class UpdateProductAction
{
    /**
     * @param array{
     *     title?: string,
     *     slug?: string|null,
     *     description?: string|null,
     *     regular_price?: float|string|int,
     *     sale_price?: float|string|int|null,
     *     has_variants?: bool,
     *     status?: string,
     *     variants?: array<int, array{
     *         id?: int,
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
    public function execute(Product|int $product, array $data): Product
    {
        $model = is_int($product) ? Product::findOrFail($product) : $product;

        if (isset($data['title']) && empty(trim($data['title']))) {
            throw new InvalidArgumentException('Product title cannot be empty.');
        }

        if (isset($data['regular_price'])) {
            $regPrice = (float) $data['regular_price'];
            if ($regPrice < 0) {
                throw new InvalidArgumentException('Regular price cannot be negative.');
            }
        }

        if (isset($data['sale_price']) && $data['sale_price'] !== null && $data['sale_price'] !== '') {
            $salePrice = (float) $data['sale_price'];
            if ($salePrice < 0) {
                throw new InvalidArgumentException('Sale price cannot be negative.');
            }
        }

        return DB::transaction(function () use ($model, $data): Product {
            $updatePayload = [];

            if (isset($data['title'])) {
                $updatePayload['title'] = trim($data['title']);
            }

            if (isset($data['slug'])) {
                $baseSlug = Str::slug($data['slug']);
                if ($baseSlug !== $model->slug) {
                    $updatePayload['slug'] = $this->generateUniqueSlug($baseSlug, $model->id);
                }
            }

            if (array_key_exists('description', $data)) {
                $updatePayload['description'] = $data['description'];
            }

            if (isset($data['regular_price'])) {
                $updatePayload['regular_price'] = (float) $data['regular_price'];
            }

            if (array_key_exists('sale_price', $data)) {
                $updatePayload['sale_price'] = $data['sale_price'] !== null && $data['sale_price'] !== ''
                    ? (float) $data['sale_price']
                    : null;
            }

            if (isset($data['has_variants'])) {
                $updatePayload['has_variants'] = (bool) $data['has_variants'];
            }

            if (isset($data['status'])) {
                $updatePayload['status'] = $data['status'];
            }

            if (! empty($updatePayload)) {
                $model->update($updatePayload);
            }

            if (! empty($data['variants'])) {
                foreach ($data['variants'] as $vData) {
                    if (! empty($vData['id'])) {
                        $variant = ProductVariant::where('product_id', $model->id)
                            ->where('id', $vData['id'])
                            ->first();

                        if ($variant) {
                            $vPayload = [];
                            if (isset($vData['name'])) {
                                $vPayload['name'] = $vData['name'];
                            }
                            if (isset($vData['sku'])) {
                                $vPayload['sku'] = strtoupper(trim($vData['sku']));
                            }
                            if (array_key_exists('attributes', $vData)) {
                                $vPayload['attributes'] = $vData['attributes'];
                            }
                            if (isset($vData['regular_price'])) {
                                $vPayload['regular_price'] = (float) $vData['regular_price'];
                            }
                            if (array_key_exists('sale_price', $vData)) {
                                $vPayload['sale_price'] = $vData['sale_price'] !== null && $vData['sale_price'] !== ''
                                    ? (float) $vData['sale_price']
                                    : null;
                            }
                            if (isset($vData['stock_quantity'])) {
                                $vPayload['stock_quantity'] = (int) $vData['stock_quantity'];
                            }
                            if (isset($vData['manage_stock'])) {
                                $vPayload['manage_stock'] = (bool) $vData['manage_stock'];
                            }

                            $variant->update($vPayload);
                        }
                    } else {
                        $vSku = ! empty($vData['sku'])
                            ? strtoupper(trim($vData['sku']))
                            : strtoupper($model->slug.'-VAR-'.uniqid());

                        ProductVariant::create([
                            'product_id' => $model->id,
                            'sku' => $vSku,
                            'name' => $vData['name'] ?? 'Variant',
                            'attributes' => $vData['attributes'] ?? null,
                            'regular_price' => isset($vData['regular_price']) ? (float) $vData['regular_price'] : (float) $model->regular_price,
                            'sale_price' => isset($vData['sale_price']) && $vData['sale_price'] !== null ? (float) $vData['sale_price'] : $model->sale_price,
                            'stock_quantity' => $vData['stock_quantity'] ?? 0,
                            'manage_stock' => $vData['manage_stock'] ?? true,
                        ]);
                    }
                }
            }

            if (array_key_exists('category_ids', $data)) {
                $model->categories()->sync((array) $data['category_ids']);
            }

            return $model->fresh(['variants', 'images', 'categories']);
        });
    }

    protected function generateUniqueSlug(string $baseSlug, int $currentId): string
    {
        $slug = $baseSlug;
        $counter = 1;

        while (Product::where('slug', $slug)->where('id', '!=', $currentId)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
