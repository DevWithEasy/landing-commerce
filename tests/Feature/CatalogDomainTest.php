<?php

use App\Modules\Catalog\Actions\CreateProductAction;
use App\Modules\Catalog\Actions\UpdateProductAction;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Catalog\Services\VariantMatrixGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('VariantMatrixGenerator generates Cartesian product of variants', function () {
    $generator = new VariantMatrixGenerator;

    $matrix = $generator->generate([
        'Size' => ['M', 'L', 'XL'],
        'Color' => ['Black', 'Brown'],
    ]);

    expect($matrix)->toHaveCount(6)
        ->and($matrix[0]['name'])->toBe('M / Black')
        ->and($matrix[0]['sku_suffix'])->toBe('M-BLACK')
        ->and($matrix[0]['attributes'])->toBe(['Size' => 'M', 'Color' => 'Black'])
        ->and($matrix[5]['name'])->toBe('XL / Brown')
        ->and($matrix[5]['sku_suffix'])->toBe('XL-BROWN');
});

test('VariantMatrixGenerator ignores empty attribute groups', function () {
    $generator = new VariantMatrixGenerator;

    expect($generator->generate([]))->toBe([])
        ->and($generator->generate(['Size' => []]))->toBe([]);
});

test('CreateProductAction creates standalone product with default variant', function () {
    $action = app(CreateProductAction::class);

    $product = $action->execute([
        'title' => 'Single Hero Watch',
        'regular_price' => 2999.00,
        'sale_price' => 2499.00,
        'has_variants' => false,
        'stock_quantity' => 25,
        'manage_stock' => true,
    ]);

    expect($product->id)->toBeGreaterThan(0)
        ->and($product->slug)->toBe('single-hero-watch')
        ->and($product->has_variants)->toBeFalse()
        ->and($product->variants)->toHaveCount(1);

    $defaultVariant = $product->variants->first();
    expect($defaultVariant->name)->toBe('Default')
        ->and($defaultVariant->regular_price)->toBe('2999.00')
        ->and($defaultVariant->sale_price)->toBe('2499.00')
        ->and($defaultVariant->stock_quantity)->toBe(25);
});

test('CreateProductAction creates product with auto-generated variant matrix', function () {
    $action = app(CreateProductAction::class);

    $product = $action->execute([
        'title' => 'Oxford Shirt',
        'regular_price' => 1500.00,
        'has_variants' => true,
        'stock_quantity' => 10,
        'variant_matrix_attributes' => [
            'Size' => ['M', 'L'],
            'Color' => ['Blue', 'White'],
        ],
    ]);

    expect($product->variants)->toHaveCount(4)
        ->and($product->variants->pluck('name')->toArray())->toBe([
            'M / Blue',
            'M / White',
            'L / Blue',
            'L / White',
        ])
        ->and($product->variants->first()->stock_quantity)->toBe(10);
});

test('CreateProductAction auto-suffixes duplicate slugs to maintain uniqueness', function () {
    $action = app(CreateProductAction::class);

    $first = $action->execute([
        'title' => 'Leather Belt',
        'regular_price' => 600.00,
    ]);

    $second = $action->execute([
        'title' => 'Leather Belt',
        'regular_price' => 700.00,
    ]);

    expect($first->slug)->toBe('leather-belt')
        ->and($second->slug)->toBe('leather-belt-1');
});

test('CreateProductAction rejects invalid or negative prices', function () {
    $action = app(CreateProductAction::class);

    expect(fn () => $action->execute([
        'title' => 'Invalid Price Product',
        'regular_price' => -100.00,
    ]))->toThrow(InvalidArgumentException::class);

    expect(fn () => $action->execute([
        'title' => 'Negative Sale Price Product',
        'regular_price' => 100.00,
        'sale_price' => -10.00,
    ]))->toThrow(InvalidArgumentException::class);
});

test('UpdateProductAction updates product details and modifies existing variants', function () {
    $createAction = app(CreateProductAction::class);
    $updateAction = app(UpdateProductAction::class);

    $product = $createAction->execute([
        'title' => 'Old Title',
        'regular_price' => 1000.00,
        'has_variants' => false,
        'stock_quantity' => 5,
    ]);

    $variantId = $product->variants->first()->id;

    $updated = $updateAction->execute($product, [
        'title' => 'New Title',
        'regular_price' => 1200.00,
        'variants' => [
            [
                'id' => $variantId,
                'stock_quantity' => 15,
                'regular_price' => 1200.00,
            ],
        ],
    ]);

    expect($updated->title)->toBe('New Title')
        ->and($updated->regular_price)->toBe('1200.00')
        ->and($updated->variants->first()->stock_quantity)->toBe(15);
});

test('Stock query scopes correctly identify in-stock, out-of-stock, and low-stock items', function () {
    $product = Product::create([
        'title' => 'Stock Test Product',
        'slug' => 'stock-test',
        'regular_price' => 500.00,
        'has_variants' => true,
        'status' => 'active',
    ]);

    $inStockVariant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'TEST-IN',
        'name' => 'In Stock',
        'stock_quantity' => 20,
        'manage_stock' => true,
    ]);

    $lowStockVariant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'TEST-LOW',
        'name' => 'Low Stock',
        'stock_quantity' => 3,
        'manage_stock' => true,
    ]);

    $outOfStockVariant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'TEST-OUT',
        'name' => 'Out of Stock',
        'stock_quantity' => 0,
        'manage_stock' => true,
    ]);

    $unmanagedVariant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'TEST-UNMANAGED',
        'name' => 'Unmanaged Stock',
        'stock_quantity' => 0,
        'manage_stock' => false,
    ]);

    // Variant scopes
    expect(ProductVariant::inStock()->pluck('id')->toArray())
        ->toContain($inStockVariant->id, $lowStockVariant->id, $unmanagedVariant->id)
        ->not->toContain($outOfStockVariant->id);

    expect(ProductVariant::outOfStock()->pluck('id')->toArray())
        ->toContain($outOfStockVariant->id)
        ->not->toContain($inStockVariant->id, $unmanagedVariant->id);

    expect(ProductVariant::lowStock(5)->pluck('id')->toArray())
        ->toContain($lowStockVariant->id)
        ->not->toContain($inStockVariant->id, $outOfStockVariant->id);

    // Product scopes
    expect(Product::active()->inStock()->count())->toBe(1)
        ->and(Product::lowStock(5)->count())->toBe(1);

    // If we mark all variants out of stock
    $inStockVariant->update(['stock_quantity' => 0]);
    $lowStockVariant->update(['stock_quantity' => 0]);
    $unmanagedVariant->update(['manage_stock' => true, 'stock_quantity' => 0]);

    expect(Product::outOfStock()->pluck('id')->toArray())->toContain($product->id);
});
