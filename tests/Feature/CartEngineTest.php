<?php

declare(strict_types=1);

use App\Modules\Cart\Models\Cart;
use App\Modules\Cart\Models\CartItem;
use App\Modules\Cart\Services\CartManagerService;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create test products
    $this->simpleProduct = Product::create([
        'title' => 'Wireless Mouse',
        'slug' => 'wireless-mouse',
        'description' => 'A great wireless mouse',
        'regular_price' => 1200.00,
        'sale_price' => 1000.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $this->simpleVariant = ProductVariant::create([
        'product_id' => $this->simpleProduct->id,
        'sku' => 'MOUSE-DEF',
        'name' => 'Default',
        'regular_price' => 1200.00,
        'sale_price' => 1000.00,
        'stock_quantity' => 10,
        'manage_stock' => true,
    ]);

    $this->variableProduct = Product::create([
        'title' => 'Cotton T-Shirt',
        'slug' => 'cotton-tshirt',
        'description' => 'Premium cotton',
        'regular_price' => 800.00,
        'sale_price' => null,
        'has_variants' => true,
        'status' => 'active',
    ]);

    $this->variantRedM = ProductVariant::create([
        'product_id' => $this->variableProduct->id,
        'sku' => 'TSHIRT-RED-M',
        'name' => 'Red / M',
        'regular_price' => 800.00,
        'sale_price' => 750.00,
        'stock_quantity' => 5,
        'manage_stock' => true,
    ]);

    $this->variantBlueL = ProductVariant::create([
        'product_id' => $this->variableProduct->id,
        'sku' => 'TSHIRT-BLU-L',
        'name' => 'Blue / L',
        'regular_price' => 850.00,
        'sale_price' => null,
        'stock_quantity' => 3,
        'manage_stock' => true,
    ]);
});

test('guest can get cart summary', function () {
    $response = $this->getJson('/cart/summary');

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'cart' => [
            'id',
            'total_items',
            'subtotal',
            'formatted_subtotal',
            'items',
            'is_empty',
        ],
    ]);
    expect($response->json('cart.total_items'))->toBe(0)
        ->and($response->json('cart.is_empty'))->toBeTrue();
});

test('guest can add a valid simple product to cart without passing variant_id', function () {
    $response = $this->postJson('/cart/items', [
        'product_id' => $this->simpleProduct->id,
        'quantity' => 2,
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('cart.total_items', 2);
    $response->assertJsonPath('cart.subtotal', 2000); // 1000.00 sale price * 2
    $response->assertJsonPath('cart.items.0.product_title', 'Wireless Mouse');
    $response->assertJsonPath('cart.items.0.quantity', 2);
});

test('guest can add a multi-variant product with valid variant to cart', function () {
    $response = $this->postJson('/cart/items', [
        'product_id' => $this->variableProduct->id,
        'variant_id' => $this->variantRedM->id,
        'quantity' => 1,
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('cart.total_items', 1);
    $response->assertJsonPath('cart.subtotal', 750);
    $response->assertJsonPath('cart.items.0.variant_name', 'Red / M');
});

test('rejects adding multi-variant product without selecting a variant', function () {
    $response = $this->postJson('/cart/items', [
        'product_id' => $this->variableProduct->id,
        'quantity' => 1,
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath('error', 'invalid_input');
});

test('rejects variant belonging to another product', function () {
    $otherProduct = Product::create([
        'title' => 'Other Product',
        'slug' => 'other-product',
        'regular_price' => 500.00,
        'status' => 'active',
    ]);

    $response = $this->postJson('/cart/items', [
        'product_id' => $otherProduct->id,
        'variant_id' => $this->variantRedM->id, // variant belongs to variableProduct, not otherProduct
        'quantity' => 1,
    ]);

    $response->assertStatus(404);
});

test('duplicate additions merge quantities instead of creating separate line items', function () {
    $this->postJson('/cart/items', [
        'product_id' => $this->variableProduct->id,
        'variant_id' => $this->variantRedM->id,
        'quantity' => 2,
    ])->assertStatus(200);

    $response = $this->postJson('/cart/items', [
        'product_id' => $this->variableProduct->id,
        'variant_id' => $this->variantRedM->id,
        'quantity' => 2,
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('cart.total_items', 4);
    $response->assertJsonPath('cart.subtotal', 3000); // 750 * 4
    expect(count($response->json('cart.items')))->toBe(1);
    expect($response->json('cart.items.0.quantity'))->toBe(4);
});

test('enforces stock quantity limits on add to cart', function () {
    // variantRedM has 5 in stock
    $response = $this->postJson('/cart/items', [
        'product_id' => $this->variableProduct->id,
        'variant_id' => $this->variantRedM->id,
        'quantity' => 6, // exceeds 5
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath('error', 'out_of_stock');
});

test('update item quantity succeeds for valid quantity and fails when exceeding stock', function () {
    $addRes = $this->postJson('/cart/items', [
        'product_id' => $this->variableProduct->id,
        'variant_id' => $this->variantRedM->id,
        'quantity' => 2,
    ]);
    $itemId = $addRes->json('cart.items.0.id');

    // Valid update to 4
    $updateRes = $this->patchJson("/cart/items/{$itemId}", [
        'quantity' => 4,
    ]);
    $updateRes->assertStatus(200);
    $updateRes->assertJsonPath('cart.total_items', 4);

    // Invalid update exceeding stock (5 available)
    $excessRes = $this->patchJson("/cart/items/{$itemId}", [
        'quantity' => 8,
    ]);
    $excessRes->assertStatus(422);
    $excessRes->assertJsonPath('error', 'out_of_stock');

    // Invalid update with 0 or negative
    $this->patchJson("/cart/items/{$itemId}", ['quantity' => 0])->assertStatus(422);
    $this->patchJson("/cart/items/{$itemId}", ['quantity' => -1])->assertStatus(422);
    $this->patchJson("/cart/items/{$itemId}", ['quantity' => 101])->assertStatus(422);
});

test('remove item deletes line item and updates cart summary', function () {
    $this->postJson('/cart/items', [
        'product_id' => $this->simpleProduct->id,
        'quantity' => 1,
    ]);

    $addRes = $this->postJson('/cart/items', [
        'product_id' => $this->variableProduct->id,
        'variant_id' => $this->variantBlueL->id,
        'quantity' => 2,
    ]);

    expect($addRes->json('cart.total_items'))->toBe(3);
    $itemId = $addRes->json('cart.items.1.id');

    $delRes = $this->deleteJson("/cart/items/{$itemId}");
    $delRes->assertStatus(200);
    $delRes->assertJsonPath('cart.total_items', 1);
    expect(count($delRes->json('cart.items')))->toBe(1);
    expect($delRes->json('cart.items.0.product_title'))->toBe('Wireless Mouse');
});

test('clear cart empties all items', function () {
    $this->postJson('/cart/items', [
        'product_id' => $this->simpleProduct->id,
        'quantity' => 3,
    ]);

    $clearRes = $this->deleteJson('/cart');
    $clearRes->assertStatus(200);
    $clearRes->assertJsonPath('cart.total_items', 0);
    $clearRes->assertJsonPath('cart.is_empty', true);
});

test('client cannot tamper with unit price or subtotals', function () {
    $response = $this->postJson('/cart/items', [
        'product_id' => $this->simpleProduct->id,
        'quantity' => 1,
        'unit_price' => 5.00, // Attacker tries to inject ৳5 price
        'subtotal' => 5.00,
        'total' => 5.00,
    ]);

    $response->assertStatus(200);
    // Verified: Price strictly taken from database (sale_price 1000.00)
    $response->assertJsonPath('cart.subtotal', 1000);
    $response->assertJsonPath('cart.items.0.unit_price', 1000);
});

test('one guest cannot access, mutate, or delete another guest cart item (IDOR protection)', function () {
    // Guest A adds an item
    $cartManager = app(CartManagerService::class);
    $cartA = Cart::create(['token' => 'guest-a-secret-token']);
    $itemA = CartItem::create([
        'cart_id' => $cartA->id,
        'product_id' => $this->simpleProduct->id,
        'variant_id' => $this->simpleVariant->id,
        'quantity' => 1,
    ]);

    // Guest B accesses via HTTP with their own session
    $this->withSession(['cart_token' => 'guest-b-secret-token']);
    Cart::create(['token' => 'guest-b-secret-token']);

    // Guest B attempts to update Guest A's cart item
    $updateResponse = $this->patchJson("/cart/items/{$itemA->id}", [
        'quantity' => 5,
    ]);
    $updateResponse->assertStatus(404);

    // Guest B attempts to delete Guest A's cart item
    $deleteResponse = $this->deleteJson("/cart/items/{$itemA->id}");
    $deleteResponse->assertStatus(404);

    // Ensure itemA quantity was unchanged
    expect($itemA->fresh()->quantity)->toBe(1);
});

test('cart page renders Inertia response with cart data', function () {
    $this->postJson('/cart/items', [
        'product_id' => $this->simpleProduct->id,
        'quantity' => 2,
    ]);

    $response = $this->get('/cart');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Storefront/Cart')
        ->has('cart')
        ->has('theme')
        ->has('categories')
        ->where('cart.total_items', 2)
        ->where('cart.subtotal', 2000)
    );
});
