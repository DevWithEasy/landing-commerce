<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Catalog\Models\Slider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function makeSliderTestUser(string $role): User
{
    return User::factory()->create([
        'name' => ucfirst($role),
        'email' => "slider_{$role}_".uniqid().'@example.com',
        'role' => $role,
        'password' => bcrypt('secret123'),
    ]);
}

test('super admin and store manager can access slider management', function () {
    $superAdmin = makeSliderTestUser('super_admin');
    $storeManager = makeSliderTestUser('store_manager');
    $agent = makeSliderTestUser('fulfillment_agent');

    $this->actingAs($superAdmin)->get('/admin/sliders')->assertStatus(200);
    $this->actingAs($storeManager)->get('/admin/sliders')->assertStatus(200);
    $this->actingAs($agent)->get('/admin/sliders')->assertStatus(403);
});

test('can create a hero slider with valid desktop image and optional mobile image', function () {
    Storage::fake('public');
    $admin = makeSliderTestUser('super_admin');

    $desktopImage = UploadedFile::fake()->image('hero-desktop.jpg', 1920, 600);
    $mobileImage = UploadedFile::fake()->image('hero-mobile.png', 768, 600);

    $response = $this->actingAs($admin)->post('/admin/sliders', [
        'title' => 'Mega Eid Sale',
        'subtitle' => 'Up to 50% discount on all items',
        'button_text' => 'Shop Now',
        'link_url' => '/shop',
        'sort_order' => 1,
        'is_active' => 1,
        'image' => $desktopImage,
        'mobile_image' => $mobileImage,
    ]);

    $response->assertRedirect('/admin/sliders');
    $this->assertDatabaseHas('sliders', [
        'title' => 'Mega Eid Sale',
        'subtitle' => 'Up to 50% discount on all items',
        'button_text' => 'Shop Now',
        'link_url' => '/shop',
        'sort_order' => 1,
        'is_active' => 1,
    ]);

    $slider = Slider::where('title', 'Mega Eid Sale')->first();
    expect($slider)->not->toBeNull();
    expect($slider->image_path)->toEndWith('.webp');
    expect($slider->mobile_image_path)->toEndWith('.webp');
    expect(Storage::disk('public')->exists($slider->image_path))->toBeTrue();
    expect(Storage::disk('public')->exists($slider->mobile_image_path))->toBeTrue();
});

test('slider creation requires a valid image and title', function () {
    $admin = makeSliderTestUser('super_admin');

    $response = $this->actingAs($admin)->post('/admin/sliders', [
        'title' => '',
    ]);

    $response->assertSessionHasErrors(['title', 'image']);
});

test('can update slider fields and optionally replace images', function () {
    Storage::fake('public');
    $admin = makeSliderTestUser('super_admin');

    $originalImage = UploadedFile::fake()->image('original.jpg', 1200, 500);
    $this->actingAs($admin)->post('/admin/sliders', [
        'title' => 'Initial Title',
        'image' => $originalImage,
    ]);

    $slider = Slider::where('title', 'Initial Title')->firstOrFail();
    $oldImagePath = $slider->image_path;
    expect(Storage::disk('public')->exists($oldImagePath))->toBeTrue();

    $newImage = UploadedFile::fake()->image('replacement.png', 1200, 500);
    $updateResponse = $this->actingAs($admin)->put("/admin/sliders/{$slider->id}", [
        'title' => 'Updated Banner Title',
        'subtitle' => 'New Subtitle',
        'sort_order' => 5,
        'is_active' => 1,
        'image' => $newImage,
    ]);

    $updateResponse->assertRedirect('/admin/sliders');
    $slider->refresh();

    expect($slider->title)->toBe('Updated Banner Title');
    expect($slider->subtitle)->toBe('New Subtitle');
    expect($slider->sort_order)->toBe(5);
    expect($slider->image_path)->not->toBe($oldImagePath);
    expect(Storage::disk('public')->exists($slider->image_path))->toBeTrue();
    expect(Storage::disk('public')->exists($oldImagePath))->toBeFalse();
});

test('can toggle slider active status', function () {
    Storage::fake('public');
    $admin = makeSliderTestUser('super_admin');

    $slider = Slider::create([
        'title' => 'Toggle Me',
        'image_path' => 'sliders/test.webp',
        'is_active' => true,
    ]);

    $this->actingAs($admin)->post("/admin/sliders/{$slider->id}/toggle")
        ->assertRedirect('/admin/sliders');
    expect($slider->fresh()->is_active)->toBeFalse();

    $this->actingAs($admin)->post("/admin/sliders/{$slider->id}/toggle")
        ->assertRedirect('/admin/sliders');
    expect($slider->fresh()->is_active)->toBeTrue();
});

test('can delete slider and its images are purged from storage', function () {
    Storage::fake('public');
    $admin = makeSliderTestUser('super_admin');

    $image = UploadedFile::fake()->image('delete-me.jpg', 800, 400);
    $this->actingAs($admin)->post('/admin/sliders', [
        'title' => 'Delete Slide',
        'image' => $image,
    ]);

    $slider = Slider::where('title', 'Delete Slide')->firstOrFail();
    $imagePath = $slider->image_path;
    expect(Storage::disk('public')->exists($imagePath))->toBeTrue();

    $delResponse = $this->actingAs($admin)->delete("/admin/sliders/{$slider->id}");
    $delResponse->assertRedirect('/admin/sliders');

    $this->assertDatabaseMissing('sliders', ['id' => $slider->id]);
    expect(Storage::disk('public')->exists($imagePath))->toBeFalse();
});
