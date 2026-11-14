<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Media\Models\MediaAsset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

function makeMediaLibraryUser(string $role): User
{
    return User::factory()->create([
        'name' => ucfirst($role),
        'email' => "media_{$role}_".uniqid().'@example.com',
        'role' => $role,
        'password' => bcrypt('secret123'),
    ]);
}

function makeMediaLibraryProduct(): Product
{
    return Product::create([
        'title' => 'Media Library Test Product',
        'slug' => 'media-library-test-product-'.uniqid(),
        'regular_price' => 1200.00,
        'has_variants' => false,
        'status' => 'active',
    ]);
}

test('media library is restricted to catalog managers', function () {
    $superAdmin = makeMediaLibraryUser('super_admin');
    $storeManager = makeMediaLibraryUser('store_manager');
    $agent = makeMediaLibraryUser('fulfillment_agent');

    $this->actingAs($superAdmin)
        ->get(route('admin.media.index'))
        ->assertOk();

    $this->actingAs($storeManager)
        ->get(route('admin.media.index'))
        ->assertOk();

    $this->actingAs($agent)
        ->get(route('admin.media.index'))
        ->assertForbidden();
});

test('media library lists product and standalone library images', function () {
    $admin = makeMediaLibraryUser('super_admin');
    $product = makeMediaLibraryProduct();

    Storage::disk('public')->put('products/product-image.webp', 'product-image');
    Storage::disk('public')->put('media/library-image.webp', 'library-image');

    $productImage = ProductImage::create([
        'product_id' => $product->id,
        'file_path' => 'products/product-image.webp',
        'sort_order' => 0,
        'is_primary' => true,
        'alt_text' => 'Product image',
    ]);
    $productImage->forceFill([
        'created_at' => now()->subMinute(),
        'updated_at' => now()->subMinute(),
    ])->save();

    $mediaAsset = MediaAsset::create([
        'file_path' => 'media/library-image.webp',
        'original_name' => 'library-image.webp',
        'mime_type' => 'image/webp',
        'size_bytes' => 12,
        'width' => 800,
        'height' => 600,
        'alt_text' => 'Library image',
        'uploaded_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.media.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Media/Index')
            ->has('media.data', 2)
            ->where('stats.total', 2)
            ->where('stats.product', 1)
            ->where('stats.library', 1)
            ->where('media.data.0.key', "library:{$mediaAsset->id}")
            ->where('media.data.0.source_label', 'Media Library')
            ->where('media.data.0.url', Storage::disk('public')->url('media/library-image.webp'))
            ->where('media.data.1.key', "product:{$productImage->id}")
            ->where('media.data.1.source_label', $product->title)
            ->where('media.data.1.is_primary', true)
        );
});

test('media asset exposes copyable absolute and thumbnail urls', function () {
    Storage::disk('public')->put('media/copy-link.webp', 'image');
    Storage::disk('public')->put('media/copy-link-thumb.webp', 'thumb');

    $asset = MediaAsset::create([
        'file_path' => 'media/copy-link.webp',
        'original_name' => 'copy-link.webp',
        'mime_type' => 'image/webp',
        'size_bytes' => 5,
        'width' => 800,
        'height' => 600,
    ]);

    expect($asset->url)->toBe(Storage::disk('public')->url('media/copy-link.webp'))
        ->and($asset->thumb_url)->toBe(Storage::disk('public')->url('media/copy-link-thumb.webp'));
});

test('catalog managers can upload multiple images to the media library', function () {
    $admin = makeMediaLibraryUser('super_admin');

    $response = $this->actingAs($admin)->post(route('admin.media.store'), [
        'images' => [
            UploadedFile::fake()->image('banner.png', 900, 600),
            UploadedFile::fake()->image('gallery.jpg', 700, 500),
        ],
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect(MediaAsset::count())->toBe(2);

    $asset = MediaAsset::query()->orderBy('id')->first();

    expect($asset)->not->toBeNull()
        ->and($asset->file_path)->toStartWith('media/')
        ->and($asset->original_name)->toBe('banner.png')
        ->and($asset->mime_type)->toBe('image/webp')
        ->and($asset->uploaded_by)->toBe($admin->id);

    Storage::disk('public')->assertExists($asset->file_path);
});

test('invalid uploads are rejected by media library validation', function () {
    $admin = makeMediaLibraryUser('super_admin');

    $response = $this->actingAs($admin)->post(route('admin.media.store'), [
        'images' => [
            UploadedFile::fake()->create('document.pdf', 20, 'application/pdf'),
        ],
    ]);

    $response->assertSessionHasErrors('images.0');

    expect(MediaAsset::count())->toBe(0);
});

test('catalog managers can delete selected product and library images', function () {
    $admin = makeMediaLibraryUser('super_admin');
    $product = makeMediaLibraryProduct();

    Storage::disk('public')->put('products/primary.webp', 'primary');
    Storage::disk('public')->put('products/secondary.webp', 'secondary');
    Storage::disk('public')->put('media/library-delete.webp', 'library');

    $primary = ProductImage::create([
        'product_id' => $product->id,
        'file_path' => 'products/primary.webp',
        'sort_order' => 0,
        'is_primary' => true,
        'alt_text' => 'Primary image',
    ]);
    $secondary = ProductImage::create([
        'product_id' => $product->id,
        'file_path' => 'products/secondary.webp',
        'sort_order' => 1,
        'is_primary' => false,
        'alt_text' => 'Secondary image',
    ]);
    $asset = MediaAsset::create([
        'file_path' => 'media/library-delete.webp',
        'original_name' => 'library-delete.webp',
        'mime_type' => 'image/webp',
        'size_bytes' => 7,
        'width' => 800,
        'height' => 600,
    ]);

    $response = $this->actingAs($admin)->delete(route('admin.media.destroy'), [
        'items' => [
            "product:{$primary->id}",
            "library:{$asset->id}",
        ],
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect(ProductImage::find($primary->id))->toBeNull()
        ->and(MediaAsset::find($asset->id))->toBeNull()
        ->and($secondary->fresh()->is_primary)->toBeTrue();

    Storage::disk('public')->assertMissing('products/primary.webp');
    Storage::disk('public')->assertMissing('media/library-delete.webp');
    Storage::disk('public')->assertExists('products/secondary.webp');
});

test('fulfillment agents cannot upload or delete media library images', function () {
    $agent = makeMediaLibraryUser('fulfillment_agent');

    $this->actingAs($agent)
        ->post(route('admin.media.store'), [
            'images' => [UploadedFile::fake()->image('blocked.png', 400, 400)],
        ])
        ->assertForbidden();

    $this->actingAs($agent)
        ->delete(route('admin.media.destroy'), [
            'items' => ['library:1'],
        ])
        ->assertForbidden();
});

test('media picker endpoint is restricted to catalog managers', function () {
    $superAdmin = makeMediaLibraryUser('super_admin');
    $storeManager = makeMediaLibraryUser('store_manager');
    $agent = makeMediaLibraryUser('fulfillment_agent');

    $this->actingAs($superAdmin)
        ->getJson(route('admin.media.picker'))
        ->assertOk();

    $this->actingAs($storeManager)
        ->getJson(route('admin.media.picker'))
        ->assertOk();

    $this->actingAs($agent)
        ->getJson(route('admin.media.picker'))
        ->assertForbidden();
});

test('media picker returns a paginated unified media payload', function () {
    $admin = makeMediaLibraryUser('super_admin');
    $product = makeMediaLibraryProduct();

    Storage::disk('public')->put('products/picker-product.webp', 'product');
    Storage::disk('public')->put('media/picker-banner.webp', 'banner');
    Storage::disk('public')->put('media/picker-banner-thumb.webp', 'thumb');

    $productImage = ProductImage::create([
        'product_id' => $product->id,
        'file_path' => 'products/picker-product.webp',
        'sort_order' => 0,
        'is_primary' => true,
        'alt_text' => 'Picker product image',
    ]);
    $productImage->forceFill([
        'created_at' => now()->subMinute(),
        'updated_at' => now()->subMinute(),
    ])->save();

    $asset = MediaAsset::create([
        'file_path' => 'media/picker-banner.webp',
        'original_name' => 'picker-banner.webp',
        'mime_type' => 'image/webp',
        'size_bytes' => 12,
        'width' => 800,
        'height' => 600,
        'alt_text' => 'Picker banner',
        'uploaded_by' => $admin->id,
    ]);

    $response = $this->actingAs($admin)
        ->getJson(route('admin.media.picker', ['per_page' => 500]));

    $response->assertOk()
        ->assertJsonPath('total', 2)
        ->assertJsonPath('per_page', 60)
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.key', "library:{$asset->id}")
        ->assertJsonPath('data.0.url', Storage::disk('public')->url('media/picker-banner.webp'))
        ->assertJsonPath('data.0.thumb_url', Storage::disk('public')->url('media/picker-banner-thumb.webp'))
        ->assertJsonPath('data.0.source', 'library')
        ->assertJsonPath('data.1.key', "product:{$productImage->id}")
        ->assertJsonPath('data.1.source', 'product')
        ->assertJsonPath('data.1.source_label', $product->title);
});

test('media picker searches across product titles, alt text and original filenames', function () {
    $admin = makeMediaLibraryUser('super_admin');
    $product = makeMediaLibraryProduct();
    $product->update(['title' => 'Searchable Summer Collection']);

    Storage::disk('public')->put('products/search-target.webp', 'product');
    Storage::disk('public')->put('media/searchable-banner.webp', 'banner');
    Storage::disk('public')->put('media/unrelated.webp', 'unrelated');

    ProductImage::create([
        'product_id' => $product->id,
        'file_path' => 'products/search-target.webp',
        'sort_order' => 0,
        'is_primary' => true,
        'alt_text' => 'A different alt label',
    ]);

    MediaAsset::create([
        'file_path' => 'media/searchable-banner.webp',
        'original_name' => 'searchable-banner.webp',
        'mime_type' => 'image/webp',
        'size_bytes' => 12,
        'width' => 800,
        'height' => 600,
        'alt_text' => 'Campaign artwork',
        'uploaded_by' => $admin->id,
    ]);

    MediaAsset::create([
        'file_path' => 'media/unrelated.webp',
        'original_name' => 'unrelated.webp',
        'mime_type' => 'image/webp',
        'size_bytes' => 12,
        'width' => 800,
        'height' => 600,
        'alt_text' => 'Something else',
        'uploaded_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->getJson(route('admin.media.picker', ['search' => 'searchable']))
        ->assertOk()
        ->assertJsonPath('total', 2)
        ->assertJsonCount(2, 'data');

    $this->actingAs($admin)
        ->getJson(route('admin.media.picker', ['search' => 'Campaign']))
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.alt_text', 'Campaign artwork');

    $this->actingAs($admin)
        ->getJson(route('admin.media.picker', ['search' => 'does-not-exist']))
        ->assertOk()
        ->assertJsonPath('total', 0)
        ->assertJsonCount(0, 'data');
});

test('duplicating a combo product does not duplicate its images in media gallery and new uploads still appear', function () {
    $admin = makeMediaLibraryUser('super_admin');

    Storage::disk('public')->put('products/combo-black.webp', 'black');
    Storage::disk('public')->put('products/combo-navy.webp', 'navy');

    $blackUrl = Storage::disk('public')->url('products/combo-black.webp');
    $navyUrl = Storage::disk('public')->url('products/combo-navy.webp');

    $comboProduct = Product::create([
        'title' => 'T-Shirt Combo Pack',
        'slug' => 't-shirt-combo-pack-'.uniqid(),
        'regular_price' => 990.00,
        'has_variants' => false,
        'combo_pack_size' => 2,
        'combo_colors' => [
            ['name' => 'Black', 'image_url' => $blackUrl],
            ['name' => 'Navy', 'image_url' => $navyUrl],
        ],
        'combo_sizes' => ['M', 'L', 'XL'],
        'status' => 'active',
    ]);

    ProductImage::create([
        'product_id' => $comboProduct->id,
        'file_path' => 'products/combo-black.webp',
        'sort_order' => 0,
        'is_primary' => true,
        'alt_text' => $comboProduct->title,
    ]);

    ProductImage::create([
        'product_id' => $comboProduct->id,
        'file_path' => 'products/combo-navy.webp',
        'sort_order' => 1,
        'is_primary' => false,
        'alt_text' => $comboProduct->title,
    ]);

    // Duplicate twice (total 3 products referencing the same 2 image files across 12 slots)
    $this->actingAs($admin)
        ->post(route('admin.products.duplicate', $comboProduct))
        ->assertRedirect();

    $this->actingAs($admin)
        ->post(route('admin.products.duplicate', $comboProduct))
        ->assertRedirect();

    expect(Product::count())->toBe(3)
        ->and(ProductImage::count())->toBe(6);

    $this->actingAs($admin)
        ->get(route('admin.media.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Media/Index')
            ->has('media.data', 2)
            ->where('stats.total', 2)
        );

    $this->actingAs($admin)
        ->getJson(route('admin.media.picker', ['per_page' => 60]))
        ->assertOk()
        ->assertJsonPath('total', 2)
        ->assertJsonCount(2, 'data');

    // Uploading a genuine new image on a duplicated product increases media count to 3
    $duplicatedProduct = Product::query()->orderByDesc('id')->firstOrFail();

    $this->actingAs($admin)
        ->post(route('admin.products.images.store', $duplicatedProduct), [
            'image' => UploadedFile::fake()->image('new-combo-angle.png', 800, 800),
        ])
        ->assertRedirect();

    $this->actingAs($admin)
        ->get(route('admin.media.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Media/Index')
            ->has('media.data', 3)
            ->where('stats.total', 3)
        );
});

test('deleting a duplicated product preserves shared files and deleting from media library clears all references', function () {
    $admin = makeMediaLibraryUser('super_admin');

    Storage::disk('public')->put('products/shared-combo-1.webp', 'shared-1');
    Storage::disk('public')->put('products/shared-combo-2.webp', 'shared-2');

    $url1 = Storage::disk('public')->url('products/shared-combo-1.webp');
    $url2 = Storage::disk('public')->url('products/shared-combo-2.webp');

    $original = Product::create([
        'title' => 'Original Combo Shirt',
        'slug' => 'original-combo-shirt-'.uniqid(),
        'regular_price' => 1150.00,
        'has_variants' => false,
        'combo_pack_size' => 2,
        'combo_colors' => [
            ['name' => 'Olive', 'image_url' => $url1],
            ['name' => 'Maroon', 'image_url' => $url2],
        ],
        'combo_sizes' => ['L', 'XL'],
        'status' => 'active',
    ]);

    ProductImage::create([
        'product_id' => $original->id,
        'file_path' => 'products/shared-combo-1.webp',
        'sort_order' => 0,
        'is_primary' => true,
        'alt_text' => $original->title,
    ]);

    ProductImage::create([
        'product_id' => $original->id,
        'file_path' => 'products/shared-combo-2.webp',
        'sort_order' => 1,
        'is_primary' => false,
        'alt_text' => $original->title,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.products.duplicate', $original))
        ->assertRedirect();

    $copy = Product::where('id', '!=', $original->id)->firstOrFail();

    $this->actingAs($admin)
        ->delete(route('admin.products.destroy', $copy))
        ->assertRedirect();

    Storage::disk('public')->assertExists('products/shared-combo-1.webp');
    Storage::disk('public')->assertExists('products/shared-combo-2.webp');

    $pickerResponse = $this->actingAs($admin)
        ->getJson(route('admin.media.picker', ['per_page' => 60]))
        ->assertOk()
        ->assertJsonPath('total', 2);

    $firstKey = (string) collect($pickerResponse->json('data'))
        ->firstWhere('file_path', 'products/shared-combo-2.webp')['key'];

    $this->actingAs($admin)
        ->delete(route('admin.media.destroy'), [
            'items' => [$firstKey],
        ])
        ->assertRedirect();

    Storage::disk('public')->assertMissing('products/shared-combo-2.webp');
    Storage::disk('public')->assertExists('products/shared-combo-1.webp');

    $original->refresh();
    expect($original->combo_colors[1]['image_url'])->toBeNull()
        ->and($original->combo_colors[0]['image_url'])->toBe($url1);

    $this->actingAs($admin)
        ->get(route('admin.media.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.total', 1)
            ->has('media.data', 1)
        );
});
