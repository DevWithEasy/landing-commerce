<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createShopTestProduct(
    string $title,
    string $slug,
    float $regularPrice = 1000.0,
    ?float $salePrice = null,
    string $status = 'active',
    int $stock = 10
): Product {
    $product = Product::create([
        'title' => $title,
        'slug' => $slug,
        'description' => "Description for {$title}",
        'regular_price' => $regularPrice,
        'sale_price' => $salePrice,
        'status' => $status,
    ]);

    ProductVariant::create([
        'product_id' => $product->id,
        'sku' => "SKU-{$slug}",
        'name' => 'Default Variant',
        'regular_price' => $regularPrice,
        'sale_price' => $salePrice,
        'stock_quantity' => $stock,
        'manage_stock' => true,
    ]);

    return $product;
}

test('can access /shop and see active products in Inertia response', function () {
    $p1 = createShopTestProduct('Classic Cotton Shirt', 'classic-cotton-shirt', 1200.0, 990.0);
    $p2 = createShopTestProduct('Wireless Bluetooth Earbuds', 'wireless-earbuds', 2500.0);
    $draft = createShopTestProduct('Secret Unreleased Item', 'secret-item', 5000.0, null, 'draft');

    $response = $this->get('/shop');
    $response->assertStatus(200);

    $response->assertInertia(fn ($page) => $page
        ->component('Storefront/Shop')
        ->has('products.data', 2)
        ->where('products.data.0.slug', $p2->slug)
        ->where('products.data.1.slug', $p1->slug)
    );
});

test('shop search filters products by title or description', function () {
    createShopTestProduct('Red Leather Handbag', 'red-handbag');
    createShopTestProduct('Blue Denim Jeans', 'blue-jeans');

    $response = $this->get('/shop?search=Handbag');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Storefront/Shop')
        ->has('products.data', 1)
        ->where('products.data.0.slug', 'red-handbag')
    );
});

test('shop category filtering loads products in selected parent and child categories', function () {
    $parent = Category::create(['name' => 'Fashion', 'slug' => 'fashion', 'is_active' => true]);
    $child = Category::create([
        'name' => 'Shoes',
        'slug' => 'shoes',
        'parent_id' => $parent->id,
        'is_active' => true,
    ]);
    $other = Category::create(['name' => 'Electronics', 'slug' => 'electronics', 'is_active' => true]);

    $shirt = createShopTestProduct('Men Formal Shirt', 'men-shirt');
    $shirt->categories()->attach($parent->id);

    $sneakers = createShopTestProduct('Running Sneakers', 'running-sneakers');
    $sneakers->categories()->attach($child->id);

    $gadget = createShopTestProduct('Smart Watch', 'smart-watch');
    $gadget->categories()->attach($other->id);

    // Filtering by parent category should include products in parent AND subcategory
    $parentResponse = $this->get('/shop?category=fashion');
    $parentResponse->assertStatus(200);
    $parentResponse->assertInertia(fn ($page) => $page
        ->component('Storefront/Shop')
        ->has('products.data', 2)
    );

    // Filtering by subcategory loads only subcategory products
    $childResponse = $this->get('/shop?category=shoes');
    $childResponse->assertStatus(200);
    $childResponse->assertInertia(fn ($page) => $page
        ->component('Storefront/Shop')
        ->has('products.data', 1)
        ->where('products.data.0.slug', 'running-sneakers')
    );
});

test('shop sorting works for price low-to-high and high-to-low', function () {
    createShopTestProduct('Budget Item', 'budget-item', 200.0);
    createShopTestProduct('Mid Item', 'mid-item', 800.0);
    createShopTestProduct('Luxury Item', 'luxury-item', 3000.0);

    // Low to high
    $ascResponse = $this->get('/shop?sort=price_low_high');
    $ascResponse->assertStatus(200);
    $ascResponse->assertInertia(fn ($page) => $page
        ->component('Storefront/Shop')
        ->where('products.data.0.slug', 'budget-item')
        ->where('products.data.2.slug', 'luxury-item')
    );

    // High to low
    $descResponse = $this->get('/shop?sort=price_high_low');
    $descResponse->assertStatus(200);
    $descResponse->assertInertia(fn ($page) => $page
        ->component('Storefront/Shop')
        ->where('products.data.0.slug', 'luxury-item')
        ->where('products.data.2.slug', 'budget-item')
    );
});

test('shop in_stock filter excludes out of stock items', function () {
    createShopTestProduct('Available Item', 'available-item', 500.0, null, 'active', 15);
    createShopTestProduct('Sold Out Item', 'sold-out-item', 500.0, null, 'active', 0);

    $response = $this->get('/shop?in_stock=1');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Storefront/Shop')
        ->has('products.data', 1)
        ->where('products.data.0.slug', 'available-item')
    );
});

test('direct category route /category/{slug} renders shop with preselected category', function () {
    $cat = Category::create(['name' => 'Home & Kitchen', 'slug' => 'home-kitchen', 'is_active' => true]);
    $p = createShopTestProduct('Blender Machine', 'blender-machine');
    $p->categories()->attach($cat->id);

    $response = $this->get('/category/home-kitchen');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Storefront/Shop')
        ->where('selectedCategory.slug', 'home-kitchen')
        ->has('products.data', 1)
    );
});

test('requesting an inactive or non-existent category returns 404', function () {
    Category::create(['name' => 'Hidden Archive', 'slug' => 'hidden-archive', 'is_active' => false]);

    // Inactive category via direct route
    $this->get('/category/hidden-archive')->assertStatus(404);

    // Inactive category via query param on shop
    $this->get('/shop?category=hidden-archive')->assertStatus(404);

    // Non-existent category
    $this->get('/category/does-not-exist-xyz')->assertStatus(404);
    $this->get('/shop?category=does-not-exist-xyz')->assertStatus(404);
});
