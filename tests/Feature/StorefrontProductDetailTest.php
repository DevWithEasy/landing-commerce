<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Catalog\Models\ProductVariant;
use Database\Seeders\BangladeshGeographicSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);
});

test('can view product details page for an active product with variants and images', function () {
    $category = Category::create(['name' => 'Fashion', 'slug' => 'fashion', 'is_active' => true]);

    $product = Product::create([
        'title' => 'Premium Silk Panjabi',
        'slug' => 'premium-silk-panjabi',
        'description' => 'Fine embroidered silk festive panjabi.',
        'regular_price' => 3500.0,
        'sale_price' => 2990.0,
        'status' => 'active',
    ]);
    $product->categories()->attach($category->id);

    // Variants
    $v1 = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'PANJABI-M',
        'name' => 'Size M - White',
        'attributes' => ['Size' => 'M', 'Color' => 'White'],
        'regular_price' => 3500.0,
        'sale_price' => 2990.0,
        'stock_quantity' => 15,
        'manage_stock' => true,
    ]);

    $v2 = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'PANJABI-L',
        'name' => 'Size L - White',
        'attributes' => ['Size' => 'L', 'Color' => 'White'],
        'regular_price' => 3500.0,
        'sale_price' => 2990.0,
        'stock_quantity' => 0,
        'manage_stock' => true,
    ]);

    // Images
    ProductImage::create([
        'product_id' => $product->id,
        'file_path' => 'products/panjabi-main.webp',
        'sort_order' => 1,
        'is_primary' => true,
    ]);

    $response = $this->get('/product/premium-silk-panjabi');
    $response->assertStatus(200);

    $response->assertInertia(fn ($page) => $page
        ->component('Storefront/ProductDetail')
        ->where('product.slug', 'premium-silk-panjabi')
        ->where('product.title', 'Premium Silk Panjabi')
        ->has('product.variants', 2)
        ->has('product.images', 1)
        ->has('product.categories', 1)
        ->where('deliveryInfo.inside_dhaka_fee', 70)
        ->where('deliveryInfo.outside_dhaka_fee', 130)
        ->where('deliveryInfo.cod_available', true)
    );
});

test('requesting a draft or archived product returns 404', function () {
    Product::create([
        'title' => 'Draft Product',
        'slug' => 'draft-product',
        'regular_price' => 1000.0,
        'status' => 'draft',
    ]);

    Product::create([
        'title' => 'Archived Product',
        'slug' => 'archived-product',
        'regular_price' => 1000.0,
        'status' => 'archived',
    ]);

    $this->get('/product/draft-product')->assertStatus(404);
    $this->get('/product/archived-product')->assertStatus(404);
    $this->get('/product/completely-non-existent-product')->assertStatus(404);
});

test('related products feature returns other products from the same category', function () {
    $cat = Category::create(['name' => 'Gadgets', 'slug' => 'gadgets', 'is_active' => true]);

    $mainProduct = Product::create([
        'title' => 'Smart Watch Pro',
        'slug' => 'smart-watch-pro',
        'regular_price' => 4500.0,
        'status' => 'active',
    ]);
    $mainProduct->categories()->attach($cat->id);

    $related1 = Product::create([
        'title' => 'Fitness Band 2',
        'slug' => 'fitness-band-2',
        'regular_price' => 1800.0,
        'status' => 'active',
    ]);
    $related1->categories()->attach($cat->id);

    $related2 = Product::create([
        'title' => 'Magnetic Charger Cable',
        'slug' => 'magnetic-charger',
        'regular_price' => 400.0,
        'status' => 'active',
    ]);
    $related2->categories()->attach($cat->id);

    $response = $this->get('/product/smart-watch-pro');
    $response->assertStatus(200);

    $response->assertInertia(fn ($page) => $page
        ->component('Storefront/ProductDetail')
        ->where('product.slug', 'smart-watch-pro')
        ->has('relatedProducts', 2)
        ->where('relatedProducts.0.slug', 'magnetic-charger')
        ->where('relatedProducts.1.slug', 'fitness-band-2')
    );
});
