<?php

declare(strict_types=1);

use App\Modules\Customer\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

beforeEach(function () {
    RateLimiter::clear('customer-login|127.0.0.1');
});

test('guest can view customer registration page', function () {
    $response = $this->get(route('customer.register'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Customer/Register'));
});

test('customer can register successfully with valid details', function () {
    $response = $this->post(route('customer.register.post'), [
        'name' => 'Rahim Uddin',
        'email' => 'rahim@example.com',
        'phone' => '01712345678',
        'password' => 'secret12345',
        'password_confirmation' => 'secret12345',
    ]);

    $response->assertRedirect(route('customer.dashboard'));

    $this->assertDatabaseHas('customers', [
        'name' => 'Rahim Uddin',
        'email' => 'rahim@example.com',
    ]);

    $customer = Customer::where('email', 'rahim@example.com')->first();
    expect($customer)->not->toBeNull()
        ->and(Hash::check('secret12345', $customer->password))->toBeTrue()
        ->and(auth('customer')->check())->toBeTrue()
        ->and(auth('customer')->id())->toBe($customer->id);
});

test('registration rejects duplicate email', function () {
    Customer::create([
        'name' => 'Existing Customer',
        'email' => 'existing@example.com',
        'password' => Hash::make('password123'),
        'phone' => '01812345678',
    ]);

    $response = $this->post(route('customer.register.post'), [
        'name' => 'Another User',
        'email' => 'existing@example.com',
        'phone' => '01712345678',
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertSessionHasErrors(['email']);
    $this->assertFalse(auth('customer')->check());
});

test('registration validates required fields and password confirmation', function () {
    $response = $this->post(route('customer.register.post'), [
        'name' => '',
        'email' => 'invalid-email',
        'phone' => '1234',
        'password' => 'short',
        'password_confirmation' => 'mismatch',
    ]);

    $response->assertSessionHasErrors(['name', 'email', 'phone', 'password']);
});

test('guest can view customer login page', function () {
    $response = $this->get(route('customer.login'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Customer/Login'));
});

test('customer can log in with valid credentials', function () {
    $customer = Customer::create([
        'name' => 'Karim Ali',
        'email' => 'karim@example.com',
        'password' => Hash::make('securePassword123'),
        'phone' => '01912345678',
    ]);

    $response = $this->post(route('customer.login.post'), [
        'email' => 'karim@example.com',
        'password' => 'securePassword123',
    ]);

    $response->assertRedirect(route('customer.dashboard'));
    $this->assertTrue(auth('customer')->check());
    $this->assertEquals($customer->id, auth('customer')->id());
});

test('customer login fails with invalid password', function () {
    Customer::create([
        'name' => 'Karim Ali',
        'email' => 'karim@example.com',
        'password' => Hash::make('securePassword123'),
        'phone' => '01912345678',
    ]);

    $response = $this->post(route('customer.login.post'), [
        'email' => 'karim@example.com',
        'password' => 'wrongPassword',
    ]);

    $response->assertSessionHasErrors(['email']);
    $this->assertFalse(auth('customer')->check());
});

test('customer login throttles after 5 failed attempts', function () {
    $throttleKey = 'customer-login|127.0.0.1';
    RateLimiter::clear($throttleKey);

    Customer::create([
        'name' => 'Target Customer',
        'email' => 'target@example.com',
        'password' => Hash::make('correctPassword'),
        'phone' => '01700000000',
    ]);

    for ($i = 0; $i < 5; $i++) {
        $this->post(route('customer.login.post'), [
            'email' => 'target@example.com',
            'password' => 'wrong',
        ]);
    }

    // 6th attempt should be throttled
    $response = $this->post(route('customer.login.post'), [
        'email' => 'target@example.com',
        'password' => 'wrong',
    ]);

    $response->assertSessionHasErrors(['email']);
    expect(session('errors')->first('email'))->toContain('Too many login attempts');
});

test('authenticated customer can log out safely', function () {
    $customer = Customer::create([
        'name' => 'Log Out Customer',
        'email' => 'logout@example.com',
        'password' => Hash::make('password123'),
        'phone' => '01711112233',
    ]);

    $this->actingAs($customer, 'customer');
    $this->assertTrue(auth('customer')->check());

    $response = $this->post(route('customer.logout'));

    $response->assertRedirect(route('customer.login'));
    $this->assertFalse(auth('customer')->check());
});

test('unauthenticated guest is redirected when accessing customer dashboard or orders', function () {
    $this->get(route('customer.dashboard'))->assertRedirect(route('customer.login'));
    $this->get(route('customer.orders'))->assertRedirect(route('customer.login'));
    $this->get(route('customer.wishlist'))->assertRedirect(route('customer.login'));
});

test('customer cannot access admin dashboard', function () {
    $customer = Customer::create([
        'name' => 'Regular Customer',
        'email' => 'customer@example.com',
        'password' => Hash::make('password123'),
        'phone' => '01711112233',
    ]);

    $this->actingAs($customer, 'customer');

    // Customer is not authenticated on the 'web' admin guard
    $response = $this->get(route('admin.dashboard'));
    $response->assertRedirect(route('login'));
});
