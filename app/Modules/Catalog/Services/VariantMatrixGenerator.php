<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Services;

class VariantMatrixGenerator
{
    /**
     * Generate Cartesian product of variant attributes.
     *
     * Example input:
     * [
     *     'Size' => ['M', 'L'],
     *     'Color' => ['Black', 'Brown']
     * ]
     *
     * Example output:
     * [
     *     [
     *         'name' => 'M / Black',
     *         'sku_suffix' => 'M-BLACK',
     *         'attributes' => ['Size' => 'M', 'Color' => 'Black']
     *     ],
     *     ...
     * ]
     *
     * @param  array<string, array<string>>  $attributeGroups
     * @return array<int, array{name: string, sku_suffix: string, attributes: array<string, string>}>
     */
    public function generate(array $attributeGroups): array
    {
        $filtered = array_filter($attributeGroups, fn ($values) => is_array($values) && count($values) > 0);

        if (empty($filtered)) {
            return [];
        }

        $combinations = [[]];

        foreach ($filtered as $attributeName => $values) {
            $current = [];
            foreach ($combinations as $combination) {
                foreach ($values as $val) {
                    $valStr = trim((string) $val);
                    if ($valStr !== '') {
                        $current[] = array_merge($combination, [$attributeName => $valStr]);
                    }
                }
            }
            $combinations = $current;
        }

        $matrix = [];

        foreach ($combinations as $attributes) {
            if (empty($attributes)) {
                continue;
            }

            $nameParts = [];
            $skuParts = [];

            foreach ($attributes as $val) {
                $nameParts[] = $val;
                $cleanedSku = strtoupper((string) preg_replace('/[^A-Za-z0-9]+/', '', $val));
                $skuParts[] = $cleanedSku !== '' ? $cleanedSku : 'VAR';
            }

            $matrix[] = [
                'name' => implode(' / ', $nameParts),
                'sku_suffix' => implode('-', $skuParts),
                'attributes' => $attributes,
            ];
        }

        return $matrix;
    }
}
