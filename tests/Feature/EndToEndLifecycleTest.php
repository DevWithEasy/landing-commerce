<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Customer\Models\Customer;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Orders\Services\OrderStateMachine;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use Database\Seeders\BangladeshGeographicSeeder;
use Database\Seeders\ShippingZoneSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([
        BangladeshGeographicSeeder::class,
        ShippingZoneSeeder::class,
    ]);

    // Ensure mock courier and SMS drivers are active for reliable test execution
    config([
        'courier.default' => 'mock',
        'sms.default' => 'mock',
    ]);
});

test('complete end-to-end guest purchase journey from catalog through cart, COD checkout, and thank-you confirmation', function () {
    // 1. Setup catalog product with variants
    $category = Category::create([
        'name' => 'Smart Watches',
        'slug' => 'smart-watches',
        'is_active' => true,
    ]);

    $product = Product::create([
        'title' => 'Ultra Watch Pro',
        'slug' => 'ultra-watch-pro',
        'regular_price' => 3500.00,
        'sale_price' => 2999.00,
        'status' => 'active',
        'has_variants' => true,
    ]);
    $product->categories()->attach($category->id);

    $variantBlack = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'UWP-BLK',
        'name' => 'Black / 44mm',
        'regular_price' => 3500.00,
        'sale_price' => 2999.00,
        'stock_quantity' => 10,
        'manage_stock' => true,
        'attributes' => ['Color' => 'Black', 'Size' => '44mm'],
    ]);

    // 2. Guest visits storefront product page
    $productResponse = $this->get("/product/{$product->slug}");
    $productResponse->assertOk();
    $productResponse->assertSee('Ultra Watch Pro');
    $productResponse->assertSee('2999');

    // 3. Guest adds variant to cart
    $cartAddResponse = $this->postJson('/cart/items', [
        'product_id' => $product->id,
        'variant_id' => $variantBlack->id,
        'quantity' => 2,
    ]);
    $cartAddResponse->assertOk()
        ->assertJsonStructure([
            'message',
            'cart',
        ]);

    $cartCookie = $cartAddResponse->getCookie('cart_token');
    expect($cartCookie)->not->toBeNull();
    $cartToken = $cartCookie->getValue();

    // 4. Guest inspects cart summary
    $cartSummary = $this->withUnencryptedCookie('cart_token', $cartToken)->getJson('/cart');
    $cartSummary->assertOk()
        ->assertJsonPath('cart.total_items', 2)
        ->assertJsonPath('cart.subtotal', 5998);

    // 5. Guest submits COD checkout order
    $idempotencyKey = (string) Str::uuid();
    $checkoutPayload = [
        'customer_name' => 'Rahim Chowdhury',
        'customer_phone' => '01712345678',
        'delivery_address' => 'House 12, Road 4, Dhanmondi',
        'district' => 'Dhaka',
        'idempotency_key' => $idempotencyKey,
        'checkout_source' => 'cart',
    ];

    $checkoutResponse = $this->withUnencryptedCookie('cart_token', $cartToken)
        ->postJson('/checkout/cod', $checkoutPayload);

    $checkoutResponse->assertStatus(201);

    $orderNumber = $checkoutResponse->json('order.order_number');
    expect($orderNumber)->toStartWith('ORD-');

    // Verify database order record
    $order = Order::where('order_number', $orderNumber)->first();
    expect($order)->not->toBeNull()
        ->and($order->customer_name)->toBe('Rahim Chowdhury')
        ->and($order->district)->toBe('Dhaka')
        ->and($order->subtotal)->toEqual(5998.00)
        ->and($order->shipping_fee)->toEqual(70.00) // Inside Dhaka default shipping zone
        ->and($order->total)->toEqual(6068.00)
        ->and($order->status)->toBe(OrderStatus::PENDING)
        ->and($order->tracking_token_hash)->not->toBeNull();

    // 6. Verify inventory decreased by exact purchased quantity inside pessimistic lock
    expect($variantBlack->fresh()->stock_quantity)->toBe(8);

    // 7. Verify purchased cart was cleared post-checkout
    $postCartSummary = $this->withUnencryptedCookie('cart_token', $cartToken)->getJson('/cart');
    $postCartSummary->assertOk()
        ->assertJsonPath('cart.total_items', 0);

    // 8. Verify guest can view Thank You screen
    $thankYouResponse = $this->get("/checkout/thank-you/{$orderNumber}");
    $thankYouResponse->assertOk()
        ->assertSee($orderNumber);
});

test('complete admin fulfillment lifecycle: dispatch courier, audit logging, thermal invoice, and idempotent restock on cancel', function () {
    // 1. Create super admin
    $admin = User::factory()->create([
        'name' => 'Chief Operations',
        'email' => 'ops@landingcommerce.test',
        'role' => 'super_admin',
    ]);

    // 2. Setup inventory and existing order
    $product = Product::create([
        'title' => 'Wireless Soundbar',
        'slug' => 'wireless-soundbar',
        'regular_price' => 4500.00,
        'status' => 'active',
        'has_variants' => false,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'SND-01',
        'name' => 'Standard',
        'regular_price' => 4500.00,
        'stock_quantity' => 5,
        'manage_stock' => true,
    ]);

    $order = Order::create([
        'order_number' => 'ORD-TEST-FULFILL-01',
        'idempotency_key' => (string) Str::uuid(),
        'customer_name' => 'Fahim Hasan',
        'customer_phone' => '01811223344',
        'delivery_address' => 'Gulshan 2, Dhaka',
        'district' => 'Dhaka',
        'subtotal' => 4500.00,
        'shipping_fee' => 70.00,
        'total' => 4570.00,
        'status' => OrderStatus::PENDING,
    ]);

    $order->items()->create([
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'product_title' => $product->title,
        'variant_name' => 'Standard',
        'sku' => 'SND-01',
        'unit_price' => 4500.00,
        'quantity' => 1,
        'total_price' => 4500.00,
        'is_restocked' => false,
    ]);

    // 3. Admin dispatches to courier
    $dispatchResponse = $this->actingAs($admin)
        ->postJson("/admin/orders/{$order->id}/courier/dispatch", [
            'courier' => 'mock',
            'weight' => 1.5,
        ]);

    $dispatchResponse->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::HANDED_TO_COURIER)
        ->and($order->courier_name)->toBe('mock')
        ->and($order->courier_tracking_id)->not->toBeNull()
        ->and($order->courier_tracking_url)->not->toBeNull();

    // 4. Verify thermal invoice printable layout
    $invoiceResponse = $this->actingAs($admin)->get("/admin/orders/{$order->id}/invoice");
    $invoiceResponse->assertOk();
    $invoiceResponse->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    $invoiceResponse->assertSee($order->order_number);
    $invoiceResponse->assertSee('Cash on Delivery');

    // 5. Customer cancels / returns order -> verifies inventory restocking
    $fsm = app(OrderStateMachine::class);
    $fsm->transition($order, OrderStatus::CANCELLED, 'Customer requested cancellation before delivery', $admin->id);

    expect($variant->fresh()->stock_quantity)->toBe(6); // 5 + 1 restocked
    $orderItem = $order->items()->first();
    expect($orderItem->fresh()->is_restocked)->toBeTrue();

    // 6. Test restock idempotency: repeated cancellation must never restock twice
    $fsm->transition($order, OrderStatus::CANCELLED, 'Duplicate cancellation attempt', $admin->id);
    expect($variant->fresh()->stock_quantity)->toBe(6); // Remains strictly 6
});

test('complete customer journey: registration, wishlist to cart, and anti-enumeration self-service order tracking', function () {
    // 1. Customer registration
    $registerResponse = $this->post('/customer/register', [
        'name' => 'Nusrat Jahan',
        'email' => 'nusrat@test.com',
        'phone' => '01912345678',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
        'address' => 'Banani, Dhaka',
        'district' => 'Dhaka',
    ]);

    $registerResponse->assertRedirect('/customer/dashboard');
    $customer = Customer::where('email', 'nusrat@test.com')->first();
    expect($customer)->not->toBeNull();

    // 2. Wishlist item addition
    $product = Product::create([
        'title' => 'Leather Wallet',
        'slug' => 'leather-wallet',
        'regular_price' => 1200.00,
        'status' => 'active',
        'has_variants' => false,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'WLT-01',
        'name' => 'Standard',
        'regular_price' => 1200.00,
        'stock_quantity' => 15,
        'manage_stock' => true,
    ]);

    $wishlistAdd = $this->actingAs($customer, 'customer')
        ->postJson('/customer/wishlist', [
            'product_id' => $product->id,
            'variant_id' => $variant->id,
        ]);

    $wishlistAdd->assertOk()
        ->assertJsonPath('is_in_wishlist', true);

    // 3. Wishlist item duplicate protection: count remains 1
    $duplicateWishlist = $this->actingAs($customer, 'customer')
        ->postJson('/customer/wishlist', [
            'product_id' => $product->id,
            'variant_id' => $variant->id,
        ]);
    $duplicateWishlist->assertOk()
        ->assertJsonPath('total_items', 1)
        ->assertJsonPath('is_in_wishlist', true);

    // 4. Authenticated order placement attaches customer_id
    $orderResponse = $this->actingAs($customer, 'customer')
        ->postJson('/checkout/cod', [
            'customer_name' => $customer->name,
            'customer_phone' => $customer->phone,
            'delivery_address' => 'House 4, Road 11, Banani, Dhaka',
            'district' => 'Dhaka',
            'idempotency_key' => (string) Str::uuid(),
            'checkout_source' => 'direct',
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => 1],
            ],
        ]);

    $orderResponse->assertStatus(201);
    $placedOrderNumber = $orderResponse->json('order.order_number');
    $placedOrder = Order::where('order_number', $placedOrderNumber)->first();
    expect($placedOrder->customer_id)->toBe($customer->id);

    // 5. Self-service order tracking with phone verification
    auth('customer')->logout();

    // Mismatched phone -> 404 with generic message
    $mismatchResponse = $this->postJson('/track-order', [
        'order_number' => $placedOrderNumber,
        'phone' => '01700000000',
    ]);
    $mismatchResponse->assertStatus(404)
        ->assertJson([
            'message' => 'No matching order found for the provided information.',
        ]);

    // Matching phone -> 200 with sanitized tracking status
    $validTrackingResponse = $this->postJson('/track-order', [
        'order_number' => $placedOrderNumber,
        'phone' => $customer->phone,
    ]);
    $validTrackingResponse->assertOk()
        ->assertJsonPath('order.order_number', $placedOrderNumber)
        ->assertJsonPath('order.status', OrderStatus::PENDING);
});

test('complete campaign landing page SSR rendering and direct Quick Order checkout', function () {
    // 1. Create landing campaign with ProductSelector and CodCheckout blocks
    $product = Product::create([
        'title' => 'Sonic Electric Toothbrush',
        'slug' => 'sonic-toothbrush',
        'regular_price' => 2200.00,
        'sale_price' => 1850.00,
        'status' => 'active',
        'has_variants' => false,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'TB-01',
        'name' => 'Standard',
        'regular_price' => 2200.00,
        'sale_price' => 1850.00,
        'stock_quantity' => 20,
        'manage_stock' => true,
    ]);

    $landingPage = LandingPage::create([
        'title' => 'Sonic Toothbrush Eid Deal',
        'slug' => 'toothbrush-deal',
        'status' => 'published',
        'product_id' => $product->id,
    ]);

    $revision = LandingPageRevision::create([
        'landing_page_id' => $landingPage->id,
        'revision_number' => 1,
        'ast_content' => [
            'version' => 1,
            'settings' => ['primaryColor' => '#0284c7'],
            'blocks' => [
                [
                    'id' => 'hero_1',
                    'type' => 'HeroBlock',
                    'props' => ['headline' => 'Next-Gen Sonic Clean'],
                    'styles' => [],
                ],
                [
                    'id' => 'cod_1',
                    'type' => 'CodCheckoutBlock',
                    'props' => [
                        'productId' => $product->id,
                        'productIds' => [$product->id],
                    ],
                    'styles' => [],
                ],
            ],
        ],
    ]);

    $landingPage->update(['published_revision_id' => $revision->id]);

    // 2. Public visits canonical landing route /p/{slug}
    $ssrResponse = $this->get('/p/toothbrush-deal');
    $ssrResponse->assertOk();
    $ssrResponse->assertSee('Next-Gen Sonic Clean');
    $ssrResponse->assertSee('Sonic Electric Toothbrush');

    // 3. Customer executes direct Quick Order checkout
    $quickOrderPayload = [
        'customer_name' => 'Tanvir Alam',
        'customer_phone' => '01611998877',
        'delivery_address' => 'Agrabad, Chattogram',
        'district' => 'Chattogram',
        'idempotency_key' => (string) Str::uuid(),
        'checkout_source' => 'direct',
        'items' => [
            ['variant_id' => $variant->id, 'quantity' => 2],
        ],
    ];

    $quickOrderResponse = $this->postJson('/checkout/cod', $quickOrderPayload);
    $quickOrderResponse->assertStatus(201);

    $quickOrderNumber = $quickOrderResponse->json('order.order_number');
    expect($quickOrderNumber)->not->toBeNull();

    $quickOrder = Order::where('order_number', $quickOrderNumber)->first();
    expect($quickOrder)->not->toBeNull()
        ->and($quickOrder->district)->toBe('Chattogram')
        ->and($quickOrder->subtotal)->toEqual(3700.00) // 1850 * 2
        ->and($quickOrder->shipping_fee)->toEqual(130.00) // Outside Dhaka shipping fee
        ->and($quickOrder->total)->toEqual(3830.00);

    // Stock reduced to 18
    expect($variant->fresh()->stock_quantity)->toBe(18);
});
