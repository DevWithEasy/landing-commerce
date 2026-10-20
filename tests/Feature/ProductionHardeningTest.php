<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Catalog\Models\Product;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;

uses(RefreshDatabase::class);

test('web responses include baseline defensive security headers', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    $response->assertHeader('X-XSS-Protection', '0');
});

test('Content-Security-Policy header is included and allows essential application assets', function () {
    $response = $this->get('/');

    $response->assertHeader('Content-Security-Policy');
    $csp = (string) $response->headers->get('Content-Security-Policy');

    // Directives must be present
    expect($csp)->toContain("default-src 'self'")
        ->and($csp)->toContain("script-src 'self' 'unsafe-inline'")
        ->and($csp)->toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com")
        ->and($csp)->toContain("font-src 'self' https://fonts.gstatic.com data:")
        ->and($csp)->toContain("img-src 'self' data: blob: https:")
        ->and($csp)->toContain("frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com")
        ->and($csp)->toContain("frame-ancestors 'self'")
        ->and($csp)->toContain("object-src 'none'")
        ->and($csp)->toContain("base-uri 'self'")
        ->and($csp)->toContain("form-action 'self' https://wa.me https://api.whatsapp.com");
});

test('CSP only allowlists the Vite dev server when its hot file points at loopback', function () {
    $hotFile = public_path('hot');
    $original = is_file($hotFile) ? (string) file_get_contents($hotFile) : null;

    try {
        file_put_contents($hotFile, 'http://127.0.0.1:5173');
        $csp = (string) $this->get('/')->headers->get('Content-Security-Policy');

        expect($csp)->toContain('http://127.0.0.1:5173')
            ->and($csp)->toContain('ws://127.0.0.1:5173');

        file_put_contents($hotFile, 'https://evil.example.com');
        $csp = (string) $this->get('/')->headers->get('Content-Security-Policy');

        expect($csp)->not->toContain('evil.example.com');
    } finally {
        if ($original === null) {
            @unlink($hotFile);
        } else {
            file_put_contents($hotFile, $original);
        }
    }
});

test('HSTS header is strictly excluded on non-HTTPS requests or in non-production environments', function () {
    // 1. Local environment over HTTP
    Config::set('app.env', 'local');
    $responseHttp = $this->get('/');
    $responseHttp->assertHeaderMissing('Strict-Transport-Security');

    // 2. Production environment over insecure HTTP
    Config::set('app.env', 'production');
    $responseInsecure = $this->get('/');
    $responseInsecure->assertHeaderMissing('Strict-Transport-Security');
});

test('HSTS header is included when request is secure HTTPS in production environment', function () {
    Config::set('app.env', 'production');

    $response = $this->withServerVariables([
        'HTTPS' => 'on',
        'SERVER_PORT' => '443',
        'HTTP_X_FORWARDED_PROTO' => 'https',
    ])->get('/');

    $response->assertHeader('Strict-Transport-Security');
    $hsts = (string) $response->headers->get('Strict-Transport-Security');
    expect($hsts)->toContain('max-age=31536000')
        ->and($hsts)->toContain('includeSubDomains');
});

test('sensitive administrative and checkout routes enforce anti-caching headers', function () {
    // 1. Admin login route
    $loginResponse = $this->get('/login');
    $loginResponse->assertHeader('Cache-Control');
    $cacheControl = (string) $loginResponse->headers->get('Cache-Control');
    expect($cacheControl)->toContain('no-store')
        ->and($cacheControl)->toContain('no-cache');

    // 2. Checkout route
    $checkoutResponse = $this->get('/checkout');
    $checkoutCache = (string) $checkoutResponse->headers->get('Cache-Control');
    expect($checkoutCache)->toContain('no-store')
        ->and($checkoutCache)->toContain('no-cache');
});

test('public dynamic route blocks dotfiles and reserved sensitive paths with 404', function () {
    $sensitivePaths = [
        '/.env',
        '/.git',
        '/backups',
        '/snapshots',
        '/.hidden',
    ];

    foreach ($sensitivePaths as $path) {
        $response = $this->get($path);
        $response->assertStatus(404);
    }
});

test('public landing page renders with security headers without breaking markup or scripts', function () {
    $product = Product::create([
        'title' => 'Security Hardened Watch',
        'slug' => 'security-hardened-watch',
        'regular_price' => 3000.00,
        'sale_price' => 2500.00,
        'has_variants' => false,
        'status' => 'active',
    ]);

    $landingPage = LandingPage::create([
        'product_id' => $product->id,
        'title' => 'Security Campaign Page',
        'slug' => 'hardened-deal',
        'status' => 'published',
        'meta_seo' => [
            'title' => 'Secure Landing Page',
            'description' => 'Tested with CSP headers',
        ],
    ]);

    $revision = LandingPageRevision::create([
        'landing_page_id' => $landingPage->id,
        'revision_number' => 1,
        'ast_content' => [
            'version' => 1,
            'settings' => ['primaryColor' => '#10b981'],
            'blocks' => [
                [
                    'id' => 'hero_1',
                    'type' => 'HeroBlock',
                    'props' => [
                        'headline' => 'Protected Storefront Headline',
                        'ctaText' => 'Buy Now',
                    ],
                ],
            ],
        ],
    ]);

    $landingPage->update(['published_revision_id' => $revision->id]);

    $response = $this->get('/p/hardened-deal');

    $response->assertStatus(200);
    $response->assertHeader('Content-Security-Policy');
    $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    $response->assertSee('Protected Storefront Headline');
});

test('thermal printable invoices render with SAMEORIGIN to allow printing without clickjacking risk', function () {
    $user = User::factory()->create(['role' => 'store_manager']);

    $order = Order::create([
        'order_number' => 'ORD-SEC-001',
        'idempotency_key' => 'idemp_sec_001',
        'customer_name' => 'Secure Customer',
        'customer_phone' => '01712345678',
        'delivery_address' => 'Dhaka',
        'district' => 'Dhaka',
        'subtotal' => 1000.00,
        'shipping_fee' => 70.00,
        'total' => 1070.00,
        'payment_method' => 'cod',
        'status' => OrderStatus::CONFIRMED,
    ]);

    $response = $this->actingAs($user)->get("/admin/orders/{$order->id}/invoice?type=thermal");

    $response->assertStatus(200);
    $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertSee('ORD-SEC-001');
});
