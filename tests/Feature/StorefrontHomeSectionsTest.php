<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Catalog\Models\Slider;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('homepage renders active sliders in sort_order sequence and excludes inactive slides', function () {
    // 3 sliders: 2 active (orders 10, 5) and 1 inactive (order 1)
    Slider::create([
        'title' => 'First Banner in View',
        'image_path' => 'sliders/banner1.webp',
        'sort_order' => 5,
        'is_active' => true,
    ]);

    Slider::create([
        'title' => 'Second Banner in View',
        'image_path' => 'sliders/banner2.webp',
        'sort_order' => 10,
        'is_active' => true,
    ]);

    Slider::create([
        'title' => 'Hidden Inactive Banner',
        'image_path' => 'sliders/banner3.webp',
        'sort_order' => 1,
        'is_active' => false,
    ]);

    $response = $this->get('/');
    $response->assertStatus(200);

    $response->assertInertia(fn ($page) => $page
        ->component('Storefront/Home')
        ->has('sliders', 2)
        ->where('sliders.0.title', 'First Banner in View')
        ->where('sliders.1.title', 'Second Banner in View')
    );
});

test('homepage renders real database products and category collections', function () {
    $category = Category::create([
        'name' => 'Men Fashion',
        'slug' => 'men-fashion',
        'is_active' => true,
    ]);

    $product = Product::create([
        'title' => 'Slim Fit Oxford Shirt',
        'slug' => 'slim-fit-oxford-shirt',
        'regular_price' => 1500.0,
        'sale_price' => 1250.0,
        'status' => 'active',
    ]);
    $product->categories()->attach($category->id);

    ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'OXFORD-SHIRT-M',
        'name' => 'Size M',
        'regular_price' => 1500.0,
        'sale_price' => 1250.0,
        'stock_quantity' => 20,
        'manage_stock' => true,
    ]);

    $response = $this->get('/');
    $response->assertStatus(200);

    $response->assertInertia(fn ($page) => $page
        ->component('Storefront/Home')
        ->has('featuredProducts', 1)
        ->has('newArrivals', 1)
        ->has('bestSellers', 1)
        ->has('categorySections', 1)
        ->where('newArrivals.0.title', 'Slim Fit Oxford Shirt')
        ->where('categorySections.0.name', 'Men Fashion')
        ->where('categorySections.0.products.0.title', 'Slim Fit Oxford Shirt')
    );
});

test('homepage respects section visibility toggles from settings', function () {
    $settings = app(SettingsService::class);
    $settings->set('homepage.hero_slider_enabled', '0');
    $settings->set('homepage.categories_enabled', '0');

    $response = $this->get('/');
    $response->assertStatus(200);

    $response->assertInertia(fn ($page) => $page
        ->component('Storefront/Home')
        ->where('sectionsConfig.hero_slider_enabled', false)
        ->where('sectionsConfig.categories_enabled', false)
        ->where('sectionsConfig.featured_enabled', true)
        ->where('sectionsConfig.new_arrivals_enabled', true)
    );
});
