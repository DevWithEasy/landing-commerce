<?php

declare(strict_types=1);

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('homepage automatically renders initial 2 category sections and passes remaining category ids', function () {
    // Create 4 active categories with active products
    $categories = [];
    for ($i = 1; $i <= 4; $i++) {
        $cat = Category::create([
            'name' => "Category {$i}",
            'slug' => "category-{$i}",
            'is_active' => true,
            'parent_id' => null,
            'sort_order' => $i,
        ]);

        for ($p = 1; $p <= 3; $p++) {
            $product = Product::create([
                'title' => "Cat {$i} Product {$p}",
                'slug' => "cat-{$i}-prod-{$p}",
                'regular_price' => 1000,
                'sale_price' => 900,
                'status' => 'active',
            ]);
            $cat->products()->attach($product->id);
        }
        $categories[] = $cat;
    }

    $response = $this->get('/');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Storefront/Home')
        ->has('categorySections', 2)
        ->where('categorySections.0.id', $categories[0]->id)
        ->where('categorySections.1.id', $categories[1]->id)
        ->has('remainingCategoryIds', 2)
        ->where('remainingCategoryIds.0', $categories[2]->id)
        ->where('remainingCategoryIds.1', $categories[3]->id)
    );
});

test('storefront lazy load endpoint returns category with its active products', function () {
    $cat = Category::create([
        'name' => 'Panjabi Collection',
        'slug' => 'panjabi-collection',
        'is_active' => true,
        'parent_id' => null,
    ]);

    for ($p = 1; $p <= 10; $p++) {
        $product = Product::create([
            'title' => "Panjabi {$p}",
            'slug' => "panjabi-{$p}",
            'regular_price' => 1500,
            'sale_price' => 1200,
            'status' => 'active',
        ]);
        $cat->products()->attach($product->id);
    }

    $response = $this->getJson("/storefront/home/category-section/{$cat->id}");

    $response->assertOk()
        ->assertJsonPath('status', 'ok')
        ->assertJsonPath('category.id', $cat->id)
        ->assertJsonPath('category.name', 'Panjabi Collection');

    // Should return max 8 active products
    $products = $response->json('category.products');
    expect(count($products))->toBe(8);
});

test('categories without active products are excluded from homepage category showcase', function () {
    // Category with active products
    $catWithProducts = Category::create([
        'name' => 'Has Products',
        'slug' => 'has-products',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $product = Product::create([
        'title' => 'Active Product',
        'slug' => 'active-prod',
        'regular_price' => 500,
        'status' => 'active',
    ]);
    $catWithProducts->products()->attach($product->id);

    // Empty category without any products
    $emptyCat = Category::create([
        'name' => 'Empty Cat',
        'slug' => 'empty-cat',
        'is_active' => true,
        'sort_order' => 2,
    ]);

    $response = $this->get('/');
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Storefront/Home')
        ->has('categorySections', 1)
        ->where('categorySections.0.id', $catWithProducts->id)
        ->has('remainingCategoryIds', 0)
    );
});

test('only main categories form sections and products from subcategories are grouped under main category', function () {
    // Main Category 1: Mens-touser
    $mainCat1 = Category::create([
        'name' => 'Mens-touser',
        'slug' => 'mens-touser',
        'parent_id' => null,
        'is_active' => true,
        'sort_order' => 1,
    ]);

    // Subcategory under Mens-touser: Nike
    $subCat = Category::create([
        'name' => 'Nike',
        'slug' => 'nike',
        'parent_id' => $mainCat1->id,
        'is_active' => true,
        'sort_order' => 2,
    ]);

    // Main Category 2: Watch
    $mainCat2 = Category::create([
        'name' => 'Watch',
        'slug' => 'watch',
        'parent_id' => null,
        'is_active' => true,
        'sort_order' => 3,
    ]);

    // Product attached only to Subcategory (Nike)
    $prodInSub = Product::create([
        'title' => 'Nike Air Pant',
        'slug' => 'nike-air-pant',
        'regular_price' => 1200,
        'status' => 'active',
    ]);
    $subCat->products()->attach($prodInSub->id);

    // Product attached directly to Main Category 1 (Mens-touser)
    $prodInMain = Product::create([
        'title' => 'Cargo Trouser',
        'slug' => 'cargo-trouser',
        'regular_price' => 1500,
        'status' => 'active',
    ]);
    $mainCat1->products()->attach($prodInMain->id);

    // Product attached to Main Category 2 (Watch)
    $prodInWatch = Product::create([
        'title' => 'Luxury Chrono Watch',
        'slug' => 'luxury-chrono-watch',
        'regular_price' => 3500,
        'status' => 'active',
    ]);
    $mainCat2->products()->attach($prodInWatch->id);

    $response = $this->get('/');
    $response->assertOk();

    // Exactly 2 sections should be rendered (Mens-touser and Watch) - Nike must NOT be a separate section
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Storefront/Home')
        ->has('categorySections', 2)
        ->where('categorySections.0.id', $mainCat1->id)
        ->where('categorySections.0.name', 'Mens-touser')
        ->has('categorySections.0.products', 2) // Contains BOTH Cargo Trouser and Nike Air Pant
        ->where('categorySections.1.id', $mainCat2->id)
        ->where('categorySections.1.name', 'Watch')
        ->has('categorySections.1.products', 1)
        ->has('remainingCategoryIds', 0) // Subcategory Nike is NOT in remainingCategoryIds
    );
});

test('uncategorized active products are passed to homepage in otherProducts prop', function () {
    // Categorized product
    $cat = Category::create([
        'name' => 'Fashion',
        'slug' => 'fashion',
        'parent_id' => null,
        'is_active' => true,
    ]);
    $catProd = Product::create([
        'title' => 'Fashion Shirt',
        'slug' => 'fashion-shirt',
        'regular_price' => 1000,
        'status' => 'active',
    ]);
    $cat->products()->attach($catProd->id);

    // Uncategorized active product (no category attached)
    $uncategorizedProd = Product::create([
        'title' => 'Standalone Test Product',
        'slug' => 'standalone-test-prod',
        'regular_price' => 850,
        'status' => 'active',
    ]);

    // Inactive uncategorized product (should NOT be included)
    Product::create([
        'title' => 'Inactive Standalone Product',
        'slug' => 'inactive-standalone',
        'regular_price' => 500,
        'status' => 'draft',
    ]);

    $response = $this->get('/');
    $response->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('Storefront/Home')
        ->has('otherProducts', 1)
        ->where('otherProducts.0.id', $uncategorizedProd->id)
        ->where('otherProducts.0.title', 'Standalone Test Product')
    );
});
