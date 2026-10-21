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
