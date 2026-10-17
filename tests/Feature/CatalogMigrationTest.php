<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Catalog\Models\ProductVariant;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can create product with decimal prices and attributes', function () {
    $product = Product::create([
        'title' => 'Premium Panjabi',
        'slug' => 'premium-panjabi',
        'description' => 'Fine cotton panjabi for Eid.',
        'regular_price' => 2500.50,
        'sale_price' => 1999.00,
        'has_variants' => true,
        'status' => 'active',
    ]);

    expect($product->id)->toBeGreaterThan(0)
        ->and($product->title)->toBe('Premium Panjabi')
        ->and($product->slug)->toBe('premium-panjabi')
        ->and($product->regular_price)->toBe('2500.50')
        ->and($product->sale_price)->toBe('1999.00')
        ->and($product->has_variants)->toBeTrue()
        ->and($product->status)->toBe('active');
});

test('enforces unique slug on products table', function () {
    Product::create([
        'title' => 'First Product',
        'slug' => 'unique-slug',
        'regular_price' => 100.00,
    ]);

    expect(fn () => Product::create([
        'title' => 'Duplicate Slug Product',
        'slug' => 'unique-slug',
        'regular_price' => 150.00,
    ]))->toThrow(QueryException::class);
});

test('can create variants with JSON attributes and relationships', function () {
    $product = Product::create([
        'title' => 'Silk Saree',
        'slug' => 'silk-saree',
        'regular_price' => 5000.00,
        'has_variants' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'SAREE-RED-M',
        'name' => 'Red / Medium',
        'attributes' => ['color' => 'Red', 'size' => 'M'],
        'regular_price' => 5000.00,
        'sale_price' => 4500.00,
        'stock_quantity' => 15,
        'manage_stock' => true,
    ]);

    expect($variant->product->id)->toBe($product->id)
        ->and($variant->attributes)->toBe(['color' => 'Red', 'size' => 'M'])
        ->and($variant->stock_quantity)->toBe(15)
        ->and($product->variants)->toHaveCount(1)
        ->and($product->variants->first()->sku)->toBe('SAREE-RED-M');
});

test('enforces unique sku on product variants table', function () {
    $product = Product::create([
        'title' => 'Polo Shirt',
        'slug' => 'polo-shirt',
        'regular_price' => 800.00,
    ]);

    ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'POLO-BLK-L',
        'name' => 'Black / L',
        'regular_price' => 800.00,
    ]);

    expect(fn () => ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'POLO-BLK-L',
        'name' => 'Duplicate SKU',
        'regular_price' => 800.00,
    ]))->toThrow(QueryException::class);
});

test('can create product images and resolve primary image relationship', function () {
    $product = Product::create([
        'title' => 'Smart Watch',
        'slug' => 'smart-watch',
        'regular_price' => 3200.00,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'WATCH-BLK',
        'name' => 'Black',
        'regular_price' => 3200.00,
    ]);

    $primaryImg = ProductImage::create([
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'file_path' => 'products/watch-main.webp',
        'sort_order' => 1,
        'is_primary' => true,
        'alt_text' => 'Smart watch front view',
    ]);

    $secondaryImg = ProductImage::create([
        'product_id' => $product->id,
        'variant_id' => null,
        'file_path' => 'products/watch-box.webp',
        'sort_order' => 2,
        'is_primary' => false,
        'alt_text' => 'Packaging box',
    ]);

    expect($product->images)->toHaveCount(2)
        ->and($product->primaryImage->id)->toBe($primaryImg->id)
        ->and($variant->images)->toHaveCount(1)
        ->and($secondaryImg->product->id)->toBe($product->id);
});

test('cascades delete from product to variants and images', function () {
    $product = Product::create([
        'title' => 'Leather Wallet',
        'slug' => 'leather-wallet',
        'regular_price' => 1200.00,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'WALLET-BRN',
        'name' => 'Brown',
        'regular_price' => 1200.00,
    ]);

    ProductImage::create([
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'file_path' => 'products/wallet.webp',
        'is_primary' => true,
    ]);

    expect(ProductVariant::count())->toBe(1)
        ->and(ProductImage::count())->toBe(1);

    $product->delete();

    expect(ProductVariant::count())->toBe(0)
        ->and(ProductImage::count())->toBe(0);
});
