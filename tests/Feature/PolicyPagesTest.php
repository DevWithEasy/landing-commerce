<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\PageBuilder\Models\PolicyPage;
use Database\Seeders\PolicyPagesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

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
    $response->assertInertia(fn (Assert $inertia) => $inertia
        ->component('Storefront/Policy')
        ->where('page.title', 'Privacy Protection')
        ->where('page.slug', 'privacy-safe')
        ->where('page.is_published', true)
        ->has('categories')
        ->has('theme')
    );
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

    $this->assertDatabaseHas('policy_pages', ['slug' => 'privacy-policy', 'is_protected' => 1]);
    $this->assertDatabaseHas('policy_pages', ['slug' => 'terms', 'is_protected' => 1]);
    $this->assertDatabaseHas('policy_pages', ['slug' => 'refund-policy', 'is_protected' => 1]);
    $this->assertDatabaseHas('policy_pages', ['slug' => 'about', 'is_protected' => 1]);
    $this->assertDatabaseHas('policy_pages', ['slug' => 'contact', 'is_protected' => 1]);
});

test('default navigation policy pages exist and are protected', function () {
    $expectedTitles = [
        'about' => 'আমাদের সম্পর্কে',
        'contact' => 'যোগাযোগ',
        'privacy-policy' => 'গোপনীয়তা নীতি',
        'terms' => 'ব্যবহারের শর্তাবলী',
        'refund-policy' => 'রিটার্ন ও রিফান্ড নীতি',
    ];

    foreach ($expectedTitles as $slug => $title) {
        $page = PolicyPage::where('slug', $slug)->first();

        expect($page)->not->toBeNull()
            ->and($page->title)->toBe($title)
            ->and($page->is_published)->toBeTrue()
            ->and($page->is_protected)->toBeTrue()
            ->and($page->isProtected())->toBeTrue();
    }
});

test('default navigation pages are publicly accessible', function () {
    foreach (PolicyPage::PROTECTED_SLUGS as $slug) {
        $this->get("/pages/{$slug}")->assertStatus(200);
    }
});

test('protected navigation pages cannot be deleted but remain editable', function () {
    $admin = makePolicyTestUser('super_admin');
    $page = PolicyPage::where('slug', 'privacy-policy')->firstOrFail();

    $this->actingAs($admin)
        ->delete("/admin/pages/{$page->id}")
        ->assertRedirect('/admin/pages')
        ->assertSessionHas('error');

    $this->assertDatabaseHas('policy_pages', ['id' => $page->id, 'slug' => 'privacy-policy']);

    $this->actingAs($admin)
        ->put("/admin/pages/{$page->id}", [
            'title' => 'আপডেটেড গোপনীয়তা নীতি',
            'slug' => 'changed-privacy-slug',
            'content' => '<p>Updated privacy content.</p>',
            'is_published' => 1,
        ])
        ->assertRedirect('/admin/pages');

    $page->refresh();

    expect($page->title)->toBe('আপডেটেড গোপনীয়তা নীতি')
        ->and($page->slug)->toBe('privacy-policy')
        ->and($page->content)->toContain('Updated privacy content.')
        ->and($page->is_protected)->toBeTrue();
});
