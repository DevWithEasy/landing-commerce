<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeThemeTestUser(string $role): User
{
    return User::factory()->create([
        'name' => ucfirst($role),
        'email' => "theme_{$role}_".uniqid().'@example.com',
        'role' => $role,
        'password' => bcrypt('secret123'),
    ]);
}

test('super admin and store manager can access appearance customize theme page', function () {
    $superAdmin = makeThemeTestUser('super_admin');
    $storeManager = makeThemeTestUser('store_manager');
    $agent = makeThemeTestUser('fulfillment_agent');

    $this->actingAs($superAdmin)->get('/admin/appearance/theme')->assertStatus(200);
    $this->actingAs($storeManager)->get('/admin/appearance/theme')->assertStatus(200);
    $this->actingAs($agent)->get('/admin/appearance/theme')->assertStatus(403);
});

test('can save storefront mode, branding, and theme color schema', function () {
    $admin = makeThemeTestUser('super_admin');

    $response = $this->actingAs($admin)->post('/admin/appearance/theme', [
        'storefront_mode' => 'full_storefront',
        'store_name' => 'Elite Commerce BD',
        'support_phone' => '+8801700000000',
        'support_whatsapp' => '01700000000',
        'primary_color' => '#6366f1',
        'secondary_color' => '#14b8a6',
        'accent_color' => '#f97316',
        'background_color' => '#ffffff',
        'text_color' => '#111827',
        'font_family' => 'Hind Siliguri, Inter, sans-serif',
        'custom_css' => '.hero-banner { border-radius: 12px; }',
    ]);

    $response->assertRedirect('/admin/appearance/theme');

    $settingsService = app(SettingsService::class);
    expect($settingsService->get('storefront.mode'))->toBe('full_storefront');
    expect($settingsService->get('store.name'))->toBe('Elite Commerce BD');
    expect($settingsService->get('store.phone'))->toBe('+8801700000000');
    expect($settingsService->get('store.whatsapp'))->toBe('01700000000');
    expect($settingsService->get('theme.primary_color'))->toBe('#6366f1');
    expect($settingsService->get('theme.secondary_color'))->toBe('#14b8a6');
    expect($settingsService->get('theme.accent_color'))->toBe('#f97316');
    expect($settingsService->get('theme.background_color'))->toBe('#ffffff');
    expect($settingsService->get('theme.text_color'))->toBe('#111827');
    expect($settingsService->get('theme.font_family'))->toBe('Hind Siliguri, Inter, sans-serif');
    expect($settingsService->get('theme.custom_css'))->toBe('.hero-banner { border-radius: 12px; }');
});

test('validates storefront mode and hex color format', function () {
    $admin = makeThemeTestUser('super_admin');

    $response = $this->actingAs($admin)->post('/admin/appearance/theme', [
        'storefront_mode' => 'invalid_mode',
        'store_name' => 'Test Store',
        'primary_color' => 'not-a-color',
    ]);

    $response->assertSessionHasErrors(['storefront_mode', 'primary_color']);
});

test('can save and render customized storefront color tokens and reset defaults', function () {
    $admin = makeThemeTestUser('super_admin');
    $settingsService = app(SettingsService::class);

    // By default, no custom CSS override is rendered
    expect($settingsService->renderStorefrontColorCss())->toBe('');

    $response = $this->actingAs($admin)->post('/admin/appearance/theme', [
        'storefront_mode' => 'full_storefront',
        'store_name' => 'Velure Store',
        'storefront_colors' => [
            'page' => '#f8f5f0',
            'cta' => '#111827',
            'price' => '#dc2626',
            'surface' => '#ffffff', // matches default, should not be stored as override
        ],
    ]);

    $response->assertRedirect('/admin/appearance/theme');

    $colors = $settingsService->getStorefrontColors();
    expect($colors['page'])->toBe('#f8f5f0');
    expect($colors['cta'])->toBe('#111827');
    expect($colors['price'])->toBe('#dc2626');
    expect($colors['surface'])->toBe('#ffffff');

    $css = $settingsService->renderStorefrontColorCss();
    expect($css)->toContain('--color-page:#f8f5f0');
    expect($css)->toContain('--color-cta:#111827');
    expect($css)->toContain('--color-price:#dc2626');
    expect($css)->not->toContain('--color-surface');
});

