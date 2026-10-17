<?php

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Media\Services\MediaUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

test('unauthenticated users cannot access catalog admin endpoints', function () {
    $this->get(route('admin.products.index'))
        ->assertRedirect(route('login'));

    $this->get(route('admin.products.create'))
        ->assertRedirect(route('login'));

    $this->post(route('admin.products.store'), [
        'title' => 'Test Product',
        'regular_price' => 100,
    ])->assertRedirect(route('login'));
});

test('fulfillment agents are forbidden from catalog management', function () {
    $agent = User::factory()->create(['role' => 'fulfillment_agent']);
    $product = Product::create([
        'title' => 'Test Watch',
        'slug' => 'test-watch',
        'regular_price' => 500.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->actingAs($agent)->get(route('admin.products.index'))->assertForbidden();
    $this->actingAs($agent)->get(route('admin.products.create'))->assertForbidden();
    $this->actingAs($agent)->post(route('admin.products.store'), [
        'title' => 'Agent Product',
        'regular_price' => 200,
    ])->assertForbidden();
    $this->actingAs($agent)->get(route('admin.products.edit', $product))->assertForbidden();
    $this->actingAs($agent)->put(route('admin.products.update', $product), [
        'title' => 'Updated Product',
        'regular_price' => 250,
    ])->assertForbidden();
    $this->actingAs($agent)->delete(route('admin.products.destroy', $product))->assertForbidden();
});

test('store managers and super admins can view catalog index with statistics and pagination', function () {
    $manager = User::factory()->create(['role' => 'store_manager']);

    $p1 = Product::create([
        'title' => 'Active Product 1',
        'slug' => 'active-prod-1',
        'regular_price' => 1500.00,
        'status' => 'active',
        'has_variants' => false,
    ]);
    ProductVariant::create([
        'product_id' => $p1->id,
        'sku' => 'ACT-1',
        'name' => 'Default',
        'regular_price' => 1500.00,
        'stock_quantity' => 20,
        'manage_stock' => true,
    ]);

    $p2 = Product::create([
        'title' => 'Draft Product 2',
        'slug' => 'draft-prod-2',
        'regular_price' => 800.00,
        'status' => 'draft',
        'has_variants' => false,
    ]);
    ProductVariant::create([
        'product_id' => $p2->id,
        'sku' => 'DFT-2',
        'name' => 'Default',
        'regular_price' => 800.00,
        'stock_quantity' => 0,
        'manage_stock' => true,
    ]);

    $this->actingAs($manager)
        ->get(route('admin.products.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Products/Index')
            ->has('products.data', 2)
            ->where('stats.total', 2)
            ->where('stats.active', 1)
            ->where('stats.out_of_stock', 1)
        );
});

test('catalog index filters by search query', function () {
    $admin = User::factory()->create(['role' => 'super_admin']);

    $p1 = Product::create([
        'title' => 'Leather Shoes Oxford',
        'slug' => 'leather-shoes-oxford',
        'regular_price' => 3500.00,
        'status' => 'active',
        'has_variants' => false,
    ]);
    ProductVariant::create([
        'product_id' => $p1->id,
        'sku' => 'SHOES-OXF',
        'name' => 'Default',
        'regular_price' => 3500.00,
        'stock_quantity' => 10,
        'manage_stock' => true,
    ]);

    $p2 = Product::create([
        'title' => 'Wireless Gaming Mouse',
        'slug' => 'wireless-gaming-mouse',
        'regular_price' => 1200.00,
        'status' => 'active',
        'has_variants' => false,
    ]);
    ProductVariant::create([
        'product_id' => $p2->id,
        'sku' => 'MOUSE-WL',
        'name' => 'Default',
        'regular_price' => 1200.00,
        'stock_quantity' => 5,
        'manage_stock' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.products.index', ['search' => 'Oxford']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Products/Index')
            ->has('products.data', 1)
            ->where('products.data.0.title', 'Leather Shoes Oxford')
        );

    // Search by variant SKU
    $this->actingAs($admin)
        ->get(route('admin.products.index', ['search' => 'MOUSE-WL']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Products/Index')
            ->has('products.data', 1)
            ->where('products.data.0.title', 'Wireless Gaming Mouse')
        );
});

test('catalog index filters by status and stock level', function () {
    $admin = User::factory()->create(['role' => 'super_admin']);

    $p1 = Product::create([
        'title' => 'In Stock Item',
        'slug' => 'in-stock-item',
        'regular_price' => 100.00,
        'status' => 'active',
        'has_variants' => false,
    ]);
    ProductVariant::create([
        'product_id' => $p1->id,
        'sku' => 'INSTOCK-1',
        'name' => 'Default',
        'regular_price' => 100.00,
        'stock_quantity' => 50,
        'manage_stock' => true,
    ]);

    $p2 = Product::create([
        'title' => 'Out of Stock Item',
        'slug' => 'out-of-stock-item',
        'regular_price' => 100.00,
        'status' => 'draft',
        'has_variants' => false,
    ]);
    ProductVariant::create([
        'product_id' => $p2->id,
        'sku' => 'OUTSTOCK-1',
        'name' => 'Default',
        'regular_price' => 100.00,
        'stock_quantity' => 0,
        'manage_stock' => true,
    ]);

    // Status filter
    $this->actingAs($admin)
        ->get(route('admin.products.index', ['status' => 'draft']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.title', 'Out of Stock Item')
        );

    // Stock level filter
    $this->actingAs($admin)
        ->get(route('admin.products.index', ['stock_level' => 'out_of_stock']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.title', 'Out of Stock Item')
        );
});

test('store manager can view create product page', function () {
    $manager = User::factory()->create(['role' => 'store_manager']);

    $this->actingAs($manager)
        ->get(route('admin.products.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Products/Create')
        );
});

test('can create standalone product with default variant and redirect to index', function () {
    $manager = User::factory()->create(['role' => 'store_manager']);

    $response = $this->actingAs($manager)
        ->post(route('admin.products.store'), [
            'title' => 'Smart Fitness Band',
            'slug' => 'smart-fitness-band',
            'description' => 'Heart rate monitoring & sleep tracker',
            'regular_price' => 2500.00,
            'sale_price' => 1999.00,
            'has_variants' => false,
            'status' => 'active',
            'stock_quantity' => 30,
            'manage_stock' => true,
        ]);

    $response->assertRedirect(route('admin.products.index'));

    $product = Product::where('slug', 'smart-fitness-band')->first();
    expect($product)->not->toBeNull()
        ->and($product->title)->toBe('Smart Fitness Band')
        ->and((float) $product->regular_price)->toBe(2500.00)
        ->and((float) $product->sale_price)->toBe(1999.00)
        ->and($product->has_variants)->toBeFalse()
        ->and($product->variants)->toHaveCount(1);

    $defaultVariant = $product->variants->first();
    expect($defaultVariant->name)->toBe('Default')
        ->and($defaultVariant->stock_quantity)->toBe(30);
});

test('can create multi-variant product with custom variant rows', function () {
    $manager = User::factory()->create(['role' => 'store_manager']);

    $response = $this->actingAs($manager)
        ->post(route('admin.products.store'), [
            'title' => 'Casual Cotton T-Shirt',
            'slug' => 'casual-cotton-tshirt',
            'description' => '100% Organic combed cotton',
            'regular_price' => 600.00,
            'has_variants' => true,
            'status' => 'active',
            'variants' => [
                [
                    'sku' => 'TSHIRT-M-BLK',
                    'name' => 'Medium / Black',
                    'regular_price' => 600.00,
                    'sale_price' => 500.00,
                    'stock_quantity' => 15,
                    'manage_stock' => true,
                ],
                [
                    'sku' => 'TSHIRT-L-WHT',
                    'name' => 'Large / White',
                    'regular_price' => 650.00,
                    'sale_price' => null,
                    'stock_quantity' => 10,
                    'manage_stock' => true,
                ],
            ],
        ]);

    $response->assertRedirect(route('admin.products.index'));

    $product = Product::where('slug', 'casual-cotton-tshirt')->first();
    expect($product)->not->toBeNull()
        ->and($product->has_variants)->toBeTrue()
        ->and($product->variants)->toHaveCount(2);

    expect($product->variants[0]->sku)->toBe('TSHIRT-M-BLK')
        ->and($product->variants[0]->stock_quantity)->toBe(15)
        ->and($product->variants[1]->sku)->toBe('TSHIRT-L-WHT')
        ->and((float) $product->variants[1]->regular_price)->toBe(650.00);
});

test('can create product with uploaded images converting them to WebP and marking first as primary', function () {
    $manager = User::factory()->create(['role' => 'store_manager']);

    $image1 = UploadedFile::fake()->image('hero.png', 600, 600);
    $image2 = UploadedFile::fake()->image('side.jpg', 600, 600);

    $response = $this->actingAs($manager)
        ->post(route('admin.products.store'), [
            'title' => 'Sneakers Pro Runner',
            'regular_price' => 4500.00,
            'has_variants' => false,
            'images' => [$image1, $image2],
        ]);

    $response->assertRedirect(route('admin.products.index'));

    $product = Product::where('title', 'Sneakers Pro Runner')->first();
    expect($product)->not->toBeNull()
        ->and($product->images)->toHaveCount(2);

    $firstImage = $product->images()->where('is_primary', true)->first();
    expect($firstImage)->not->toBeNull()
        ->and($firstImage->file_path)->toEndWith('.webp');

    Storage::disk('public')->assertExists($firstImage->file_path);
});

test('validation rejects missing title, negative prices, and invalid file mime types', function () {
    $manager = User::factory()->create(['role' => 'store_manager']);

    // Missing title and negative price
    $this->actingAs($manager)
        ->post(route('admin.products.store'), [
            'regular_price' => -50.00,
        ])
        ->assertSessionHasErrors(['title', 'regular_price']);

    // Disallowed file extension (text file)
    $textFile = UploadedFile::fake()->create('document.pdf', 500, 'application/pdf');
    $this->actingAs($manager)
        ->post(route('admin.products.store'), [
            'title' => 'Invalid File Product',
            'regular_price' => 100.00,
            'images' => [$textFile],
        ])
        ->assertSessionHasErrors(['images.0']);
});

test('can view edit page and update product details and variants', function () {
    $manager = User::factory()->create(['role' => 'store_manager']);

    $product = Product::create([
        'title' => 'Original Backpack',
        'slug' => 'original-backpack',
        'description' => 'Original desc',
        'regular_price' => 2000.00,
        'has_variants' => false,
        'status' => 'draft',
    ]);
    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'BCK-DEF',
        'name' => 'Default',
        'regular_price' => 2000.00,
        'stock_quantity' => 5,
        'manage_stock' => true,
    ]);

    // View edit page
    $this->actingAs($manager)
        ->get(route('admin.products.edit', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Products/Edit')
            ->where('product.id', $product->id)
            ->where('product.title', 'Original Backpack')
        );

    // Update product and existing variant
    $response = $this->actingAs($manager)
        ->put(route('admin.products.update', $product), [
            'title' => 'Updated Executive Backpack',
            'regular_price' => 2400.00,
            'sale_price' => 1999.00,
            'status' => 'active',
            'variants' => [
                [
                    'id' => $variant->id,
                    'sku' => 'BCK-EXEC',
                    'name' => 'Executive Default',
                    'regular_price' => 2400.00,
                    'sale_price' => 1999.00,
                    'stock_quantity' => 18,
                    'manage_stock' => true,
                ],
            ],
        ]);

    $response->assertRedirect(route('admin.products.edit', $product));

    $product->refresh();
    expect($product->title)->toBe('Updated Executive Backpack')
        ->and((float) $product->regular_price)->toBe(2400.00)
        ->and((float) $product->sale_price)->toBe(1999.00)
        ->and($product->status)->toBe('active');

    $variant->refresh();
    expect($variant->name)->toBe('Executive Default')
        ->and($variant->sku)->toBe('BCK-EXEC')
        ->and($variant->stock_quantity)->toBe(18);
});

test('can delete product and clean up images', function () {
    $admin = User::factory()->create(['role' => 'super_admin']);

    $imageFile = UploadedFile::fake()->image('test.png', 400, 400);
    $uploadService = app(MediaUploadService::class);
    $upload = $uploadService->upload($imageFile, 'products');

    $product = Product::create([
        'title' => 'Product To Delete',
        'slug' => 'product-to-delete',
        'regular_price' => 100.00,
        'has_variants' => false,
        'status' => 'active',
    ]);
    ProductImage::create([
        'product_id' => $product->id,
        'file_path' => $upload['file_path'],
        'sort_order' => 0,
        'is_primary' => true,
        'alt_text' => 'Product To Delete',
    ]);

    Storage::disk('public')->assertExists($upload['file_path']);

    $this->actingAs($admin)
        ->delete(route('admin.products.destroy', $product))
        ->assertRedirect(route('admin.products.index'));

    expect(Product::find($product->id))->toBeNull();
    Storage::disk('public')->assertMissing($upload['file_path']);
});

test('can attach image, set primary, and delete image on existing product', function () {
    $manager = User::factory()->create(['role' => 'store_manager']);

    $product = Product::create([
        'title' => 'Image Test Product',
        'slug' => 'image-test-product',
        'regular_price' => 1000.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    // Attach image 1
    $image1 = UploadedFile::fake()->image('img1.jpg', 400, 400);
    $this->actingAs($manager)
        ->post(route('admin.products.images.store', $product), ['image' => $image1])
        ->assertRedirect();

    expect($product->images()->count())->toBe(1);
    $firstImg = $product->images()->first();
    expect($firstImg->is_primary)->toBeTrue();

    // Attach image 2
    $image2 = UploadedFile::fake()->image('img2.png', 400, 400);
    $this->actingAs($manager)
        ->post(route('admin.products.images.store', $product), ['image' => $image2])
        ->assertRedirect();

    expect($product->images()->count())->toBe(2);
    $secondImg = $product->images()->where('id', '!=', $firstImg->id)->first();
    expect($secondImg->is_primary)->toBeFalse();

    // Set image 2 as primary
    $this->actingAs($manager)
        ->post(route('admin.products.images.primary', [$product, $secondImg]))
        ->assertRedirect();

    expect($secondImg->fresh()->is_primary)->toBeTrue()
        ->and($firstImg->fresh()->is_primary)->toBeFalse();

    // Delete image 2
    $this->actingAs($manager)
        ->delete(route('admin.products.images.destroy', [$product, $secondImg]))
        ->assertRedirect();

    expect($product->images()->count())->toBe(1)
        ->and($firstImg->fresh()->is_primary)->toBeTrue();
});

test('variant matrix preview returns JSON combinations', function () {
    $manager = User::factory()->create(['role' => 'store_manager']);

    $response = $this->actingAs($manager)
        ->postJson(route('admin.products.matrix-preview'), [
            'attributes' => [
                'Size' => ['S', 'M'],
                'Color' => ['Blue', 'Red'],
            ],
        ]);

    $response->assertOk()
        ->assertJsonCount(4, 'combinations')
        ->assertJsonFragment(['name' => 'S / Blue', 'sku_suffix' => 'S-BLUE'])
        ->assertJsonFragment(['name' => 'M / Red', 'sku_suffix' => 'M-RED']);
});
