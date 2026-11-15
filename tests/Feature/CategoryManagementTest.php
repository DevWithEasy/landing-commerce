<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeCategoryTestUser(string $role): User
{
    return User::factory()->create([
        'name' => ucfirst($role),
        'email' => "cat_{$role}_".uniqid().'@example.com',
        'role' => $role,
        'password' => bcrypt('secret123'),
    ]);
}

test('super admin and store manager can view categories index', function () {
    $superAdmin = makeCategoryTestUser('super_admin');
    $storeManager = makeCategoryTestUser('store_manager');
    $agent = makeCategoryTestUser('fulfillment_agent');

    $this->actingAs($superAdmin)->get('/admin/categories')->assertStatus(200);
    $this->actingAs($storeManager)->get('/admin/categories')->assertStatus(200);
    $this->actingAs($agent)->get('/admin/categories')->assertStatus(403);
});

test('can create a root category and auto-generate slug', function () {
    $admin = makeCategoryTestUser('super_admin');

    $response = $this->actingAs($admin)->post('/admin/categories', [
        'name' => 'Fashion & Apparel',
        'description' => 'Quality clothing items',
        'sort_order' => 1,
        'is_active' => 1,
    ]);

    $response->assertRedirect('/admin/categories');
    $this->assertDatabaseHas('categories', [
        'name' => 'Fashion & Apparel',
        'slug' => 'fashion-apparel',
        'parent_id' => null,
        'sort_order' => 1,
        'is_active' => 1,
    ]);
});

test('can create a subcategory under a root category (Level 2)', function () {
    $admin = makeCategoryTestUser('super_admin');

    $root = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->post('/admin/categories', [
        'name' => 'Smartphones',
        'parent_id' => $root->id,
        'is_active' => 1,
    ]);

    $response->assertRedirect('/admin/categories');
    $this->assertDatabaseHas('categories', [
        'name' => 'Smartphones',
        'slug' => 'smartphones',
        'parent_id' => $root->id,
    ]);

    $child = Category::where('slug', 'smartphones')->first();
    expect($child->parent->id)->toBe($root->id);
    expect($root->children)->toHaveCount(1);
});

test('cannot create a sub-subcategory exceeding 2 levels depth', function () {
    $admin = makeCategoryTestUser('super_admin');

    $root = Category::create(['name' => 'Root Cat', 'slug' => 'root-cat']);
    $sub = Category::create(['name' => 'Sub Cat', 'slug' => 'sub-cat', 'parent_id' => $root->id]);

    // Attempt to make a child under sub (Level 3)
    $response = $this->actingAs($admin)->post('/admin/categories', [
        'name' => 'Sub-Sub Cat',
        'parent_id' => $sub->id,
    ]);

    $response->assertSessionHasErrors(['parent_id']);
    $this->assertDatabaseMissing('categories', ['name' => 'Sub-Sub Cat']);
});

test('cannot set category as its own parent or circular child reference', function () {
    $admin = makeCategoryTestUser('super_admin');

    $cat = Category::create(['name' => 'Gadgets', 'slug' => 'gadgets']);

    // Self parent
    $response = $this->actingAs($admin)->put("/admin/categories/{$cat->id}", [
        'name' => 'Gadgets',
        'parent_id' => $cat->id,
    ]);
    $response->assertSessionHasErrors(['parent_id']);

    // Circular reference
    $child = Category::create(['name' => 'Audio', 'slug' => 'audio', 'parent_id' => $cat->id]);

    $circularResponse = $this->actingAs($admin)->put("/admin/categories/{$cat->id}", [
        'name' => 'Gadgets Updated',
        'parent_id' => $child->id,
    ]);
    $circularResponse->assertSessionHasErrors(['parent_id']);
});

test('can toggle category active status', function () {
    $admin = makeCategoryTestUser('super_admin');
    $cat = Category::create(['name' => 'Winter Deals', 'slug' => 'winter-deals', 'is_active' => true]);

    $this->actingAs($admin)->post("/admin/categories/{$cat->id}/toggle")
        ->assertRedirect('/admin/categories');

    expect($cat->fresh()->is_active)->toBeFalse();

    $this->actingAs($admin)->post("/admin/categories/{$cat->id}/toggle")
        ->assertRedirect('/admin/categories');

    expect($cat->fresh()->is_active)->toBeTrue();
});

test('deleting parent category nullifies children parent_id without deleting children', function () {
    $admin = makeCategoryTestUser('super_admin');

    $parent = Category::create(['name' => 'Parent Cat', 'slug' => 'parent-cat']);
    $child = Category::create(['name' => 'Child Cat', 'slug' => 'child-cat', 'parent_id' => $parent->id]);

    $this->actingAs($admin)->delete("/admin/categories/{$parent->id}")
        ->assertRedirect('/admin/categories');

    $this->assertDatabaseMissing('categories', ['id' => $parent->id]);
    $this->assertDatabaseHas('categories', ['id' => $child->id, 'parent_id' => null]);
});

test('can assign multiple categories to product and pivot cascades on delete', function () {
    $admin = makeCategoryTestUser('super_admin');

    $cat1 = Category::create(['name' => 'Men', 'slug' => 'men']);
    $cat2 = Category::create(['name' => 'Shoes', 'slug' => 'shoes']);

    $response = $this->actingAs($admin)->post('/admin/products', [
        'title' => 'Running Leather Shoes',
        'regular_price' => 2500,
        'category_ids' => [$cat1->id, $cat2->id],
        'status' => 'active',
        'stock_quantity' => 15,
        'manage_stock' => true,
    ]);

    $response->assertRedirect('/admin/products');

    $product = Product::where('slug', 'running-leather-shoes')->first();
    expect($product)->not->toBeNull();
    expect($product->categories)->toHaveCount(2);

    // Verify category products count and relationship
    expect($cat1->products)->toHaveCount(1);
    expect($cat2->products)->toHaveCount(1);

    // Deleting one category removes pivot association without deleting the product
    $this->actingAs($admin)->delete("/admin/categories/{$cat1->id}");

    $this->assertDatabaseMissing('category_product', ['category_id' => $cat1->id]);
    expect($product->fresh()->categories)->toHaveCount(1);
    $this->assertDatabaseHas('products', ['id' => $product->id]);
});

test('Category::toTree returns structured 2-level hierarchy', function () {
    $root1 = Category::create(['name' => 'Fashion', 'slug' => 'fashion', 'sort_order' => 1, 'is_active' => true]);
    $child1 = Category::create(['name' => 'Men', 'slug' => 'fashion-men', 'parent_id' => $root1->id, 'sort_order' => 1, 'is_active' => true]);
    $child2 = Category::create(['name' => 'Women', 'slug' => 'fashion-women', 'parent_id' => $root1->id, 'sort_order' => 2, 'is_active' => true]);

    $root2 = Category::create(['name' => 'Electronics', 'slug' => 'electronics', 'sort_order' => 2, 'is_active' => true]);

    $tree = Category::toTree(true);
    expect($tree)->toHaveCount(2);
    expect($tree->first()->children)->toHaveCount(2);
    expect($tree->last()->children)->toHaveCount(0);
});

test('can create category with image picked from media library', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    \Illuminate\Support\Facades\Storage::disk('public')->put('media/category-sample.webp', 'sample image content');

    $admin = makeCategoryTestUser('super_admin');

    $response = $this->actingAs($admin)->post('/admin/categories', [
        'name' => 'Home & Living',
        'image_path' => 'media/category-sample.webp',
        'is_active' => 1,
    ]);

    $response->assertRedirect('/admin/categories');
    $this->assertDatabaseHas('categories', [
        'name' => 'Home & Living',
        'image_path' => 'media/category-sample.webp',
    ]);
});

test('can update category with image picked from media library and can remove image', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    \Illuminate\Support\Facades\Storage::disk('public')->put('media/picked-image.webp', 'sample content');

    $admin = makeCategoryTestUser('super_admin');

    $category = Category::create([
        'name' => 'Outdoor & Sports',
        'slug' => 'outdoor-sports',
        'is_active' => true,
    ]);

    // 1. Update with media image
    $response = $this->actingAs($admin)->put("/admin/categories/{$category->id}", [
        'name' => 'Outdoor & Sports Updated',
        'image_path' => 'media/picked-image.webp',
    ]);

    $response->assertRedirect('/admin/categories');
    expect($category->fresh()->image_path)->toBe('media/picked-image.webp');

    // 2. Remove image
    $removeResponse = $this->actingAs($admin)->put("/admin/categories/{$category->id}", [
        'name' => 'Outdoor & Sports Updated',
        'remove_image' => 1,
    ]);

    $removeResponse->assertRedirect('/admin/categories');
    expect($category->fresh()->image_path)->toBeNull();
});

test('deleting category does not delete shared media library image', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    \Illuminate\Support\Facades\Storage::disk('public')->put('media/shared-banner.webp', 'banner content');

    $admin = makeCategoryTestUser('super_admin');

    $category = Category::create([
        'name' => 'Seasonal Deals',
        'slug' => 'seasonal-deals',
        'image_path' => 'media/shared-banner.webp',
        'is_active' => true,
    ]);

    $this->actingAs($admin)->delete("/admin/categories/{$category->id}")
        ->assertRedirect('/admin/categories');

    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    expect(\Illuminate\Support\Facades\Storage::disk('public')->exists('media/shared-banner.webp'))->toBeTrue();
});
