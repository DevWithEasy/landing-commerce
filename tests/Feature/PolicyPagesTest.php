<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\PageBuilder\Models\PolicyPage;
use Database\Seeders\PolicyPagesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makePolicyTestUser(string $role): User
{
    return User::factory()->create([
        'name' => ucfirst($role),
        'email' => "policy_{$role}_".uniqid().'@example.com',
        'role' => $role,
        'password' => bcrypt('secret123'),
    ]);
}

test('super admin and store manager can view policy pages index', function () {
    $superAdmin = makePolicyTestUser('super_admin');
    $storeManager = makePolicyTestUser('store_manager');
    $agent = makePolicyTestUser('fulfillment_agent');

    $this->actingAs($superAdmin)->get('/admin/pages')->assertStatus(200);
    $this->actingAs($storeManager)->get('/admin/pages')->assertStatus(200);
    $this->actingAs($agent)->get('/admin/pages')->assertStatus(403);
});

test('can create and update a policy page with unique slug', function () {
    $admin = makePolicyTestUser('super_admin');

    $response = $this->actingAs($admin)->post('/admin/pages', [
        'title' => 'Return & Refund Policy',
        'content' => '<p>Items can be returned within 3 days.</p>',
        'is_published' => 1,
    ]);

    $response->assertRedirect('/admin/pages');
    $this->assertDatabaseHas('policy_pages', [
        'title' => 'Return & Refund Policy',
        'slug' => 'return-refund-policy',
        'is_published' => 1,
    ]);

    $page = PolicyPage::where('slug', 'return-refund-policy')->first();

    $updateResponse = $this->actingAs($admin)->put("/admin/pages/{$page->id}", [
        'title' => 'Updated Refund Policy',
        'content' => '<p>Updated return timeline.</p>',
        'is_published' => 1,
    ]);

    $updateResponse->assertRedirect('/admin/pages');
    expect($page->fresh()->title)->toBe('Updated Refund Policy');
});

test('public route renders published policy page and sanitizes malicious script tags', function () {
    $page = PolicyPage::create([
        'title' => 'Privacy Protection',
        'slug' => 'privacy-safe',
        'content' => '<p>Safe intro</p><script>alert("hacked")</script><a href="javascript:alert(1)">Click me</a><span onclick="evil()">Span</span>',
        'is_published' => true,
    ]);

    $response = $this->get('/pages/privacy-safe');
    $response->assertStatus(200);
    $response->assertSee('Privacy Protection');
    $response->assertSee('Safe intro');

    // Ensure script and inline handlers are stripped from output
    $response->assertDontSee('<script>alert("hacked")</script>', false);
    $response->assertDontSee('javascript:alert(1)', false);
    $response->assertDontSee('onclick=', false);
});

test('unpublished policy page returns 404 on public route', function () {
    $page = PolicyPage::create([
        'title' => 'Draft Internal Policy',
        'slug' => 'draft-internal',
        'content' => '<p>Internal guidelines</p>',
        'is_published' => false,
    ]);

    $this->get('/pages/draft-internal')->assertStatus(404);
});

test('policy pages seeder populates standard default policies', function () {
    $this->seed(PolicyPagesSeeder::class);

    $this->assertDatabaseHas('policy_pages', ['slug' => 'privacy-policy']);
    $this->assertDatabaseHas('policy_pages', ['slug' => 'terms']);
    $this->assertDatabaseHas('policy_pages', ['slug' => 'refund-policy']);
    $this->assertDatabaseHas('policy_pages', ['slug' => 'about']);
    $this->assertDatabaseHas('policy_pages', ['slug' => 'contact']);
});
