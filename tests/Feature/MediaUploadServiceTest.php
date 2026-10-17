<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Media\Services\MediaUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

test('MediaUploadService converts valid PNG upload to WebP with responsive variants', function () {
    $service = app(MediaUploadService::class);

    // Create 1000x800 test PNG
    $file = UploadedFile::fake()->image('test-product.png', 1000, 800);

    $result = $service->upload($file, 'products', ['thumb' => 300, 'medium' => 800]);

    expect($result['mime_type'])->toBe('image/webp')
        ->and($result['width'])->toBe(1000)
        ->and($result['height'])->toBe(800)
        ->and($result['variants'])->toHaveKeys(['thumb', 'medium']);

    // Check files exist on public storage disk
    Storage::disk('public')->assertExists($result['file_path']);
    Storage::disk('public')->assertExists($result['variants']['thumb']);
    Storage::disk('public')->assertExists($result['variants']['medium']);

    // Check stored content starts with RIFF WebP header
    $content = Storage::disk('public')->get($result['file_path']);
    expect(str_starts_with($content, 'RIFF'))->toBeTrue();
});

test('MediaUploadService converts JPEG upload to WebP', function () {
    $service = app(MediaUploadService::class);

    $file = UploadedFile::fake()->image('photo.jpg', 600, 400);

    $result = $service->upload($file, 'products', ['thumb' => 200]);

    expect($result['mime_type'])->toBe('image/webp')
        ->and($result['width'])->toBe(600)
        ->and($result['height'])->toBe(400)
        ->and($result['variants'])->toHaveKey('thumb');

    Storage::disk('public')->assertExists($result['file_path']);
    Storage::disk('public')->assertExists($result['variants']['thumb']);
});

test('MediaUploadService rejects SVG uploads by default for security', function () {
    $service = app(MediaUploadService::class);

    $svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    $tempFile = tempnam(sys_get_temp_dir(), 'svg_test').'.svg';
    file_put_contents($tempFile, $svgContent);

    try {
        expect(fn () => $service->upload($tempFile))->toThrow(
            InvalidArgumentException::class,
            'Unsupported or unsafe image format'
        );
    } finally {
        if (file_exists($tempFile)) {
            unlink($tempFile);
        }
    }
});

test('MediaUploadService rejects text or HTML disguised as image extension', function () {
    $service = app(MediaUploadService::class);

    $fakeImage = UploadedFile::fake()->createWithContent(
        'exploit.jpg',
        '<html><body><h1>Fake Image Payload</h1></body></html>'
    );

    expect(fn () => $service->upload($fakeImage))->toThrow(
        InvalidArgumentException::class,
        'Unsupported or unsafe image format'
    );
});

test('MediaUploadService delete cleans up main image and all variants', function () {
    $service = app(MediaUploadService::class);

    $file = UploadedFile::fake()->image('to-delete.jpg', 900, 600);
    $result = $service->upload($file, 'products', ['thumb' => 300, 'medium' => 600]);

    Storage::disk('public')->assertExists($result['file_path']);
    Storage::disk('public')->assertExists($result['variants']['thumb']);
    Storage::disk('public')->assertExists($result['variants']['medium']);

    $service->delete($result['file_path']);

    Storage::disk('public')->assertMissing($result['file_path']);
    Storage::disk('public')->assertMissing($result['variants']['thumb']);
    Storage::disk('public')->assertMissing($result['variants']['medium']);
});

test('MediaUploadService output integrates seamlessly with ProductImage model', function () {
    $service = app(MediaUploadService::class);

    $product = Product::create([
        'title' => 'Watch with Uploaded Image',
        'slug' => 'watch-uploaded-image',
        'regular_price' => 1500.00,
    ]);

    $file = UploadedFile::fake()->image('watch.png', 500, 500);
    $uploaded = $service->upload($file, 'products');

    $productImage = ProductImage::create([
        'product_id' => $product->id,
        'file_path' => $uploaded['file_path'],
        'sort_order' => 1,
        'is_primary' => true,
        'alt_text' => 'Watch primary image',
    ]);

    expect($product->images)->toHaveCount(1)
        ->and($product->primaryImage->file_path)->toBe($uploaded['file_path'])
        ->and(str_ends_with($productImage->file_path, '.webp'))->toBeTrue();
});
