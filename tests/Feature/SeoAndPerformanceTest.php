<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use App\Modules\PageBuilder\Models\PolicyPage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SeoAndPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_robots_txt_exists_and_contains_disallow_rules_and_sitemap(): void
    {
        $robotsPath = public_path('robots.txt');
        $this->assertFileExists($robotsPath);

        $content = file_get_contents($robotsPath);
        $this->assertIsString($content);

        $this->assertStringContainsString('User-agent: *', $content);
        $this->assertStringContainsString('Disallow: /admin/', $content);
        $this->assertStringContainsString('Disallow: /checkout/', $content);
        $this->assertStringContainsString('Disallow: /cart', $content);
        $this->assertStringContainsString('Disallow: /customer/', $content);
        $this->assertStringContainsString('Disallow: /track-order', $content);
        $this->assertStringContainsString('Disallow: /install/', $content);
        $this->assertStringContainsString('Allow: /shop', $content);
        $this->assertStringContainsString('Allow: /product/', $content);
        $this->assertStringContainsString('Allow: /category/', $content);
        $this->assertStringContainsString('Sitemap:', $content);
        $this->assertStringContainsString('/sitemap.xml', $content);
    }

    public function test_sitemap_xml_returns_valid_xml_with_published_entities(): void
    {
        // 1. Create active product
        $activeProduct = Product::create([
            'title' => 'Sitemap Active Product',
            'slug' => 'sitemap-active-product',
            'regular_price' => 1500,
            'sale_price' => 1200,
            'has_variants' => false,
            'status' => 'active',
        ]);

        ProductImage::create([
            'product_id' => $activeProduct->id,
            'file_path' => 'products/active-prod.webp',
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        // 2. Create inactive product (should NOT be in sitemap)
        Product::create([
            'title' => 'Draft Inactive Product',
            'slug' => 'draft-inactive-product',
            'regular_price' => 2000,
            'has_variants' => false,
            'status' => 'inactive',
        ]);

        // 3. Create active category
        Category::create([
            'name' => 'Sitemap Active Category',
            'slug' => 'sitemap-active-cat',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // 4. Create inactive category (should NOT be in sitemap)
        Category::create([
            'name' => 'Inactive Category',
            'slug' => 'inactive-cat',
            'is_active' => false,
            'sort_order' => 2,
        ]);

        // 5. Ensure the published privacy policy page exists
        PolicyPage::firstOrCreate(
            ['slug' => 'privacy-policy'],
            [
                'title' => 'Privacy Policy',
                'content' => 'Sample privacy content',
                'is_published' => true,
            ]
        );

        // 6. Create published landing page
        LandingPage::create([
            'title' => 'Campaign Offer Landing',
            'slug' => 'campaign-offer',
            'status' => 'published',
            'product_id' => $activeProduct->id,
        ]);

        // 7. Create draft landing page (should NOT be in sitemap)
        LandingPage::create([
            'title' => 'Draft Landing Page',
            'slug' => 'draft-campaign',
            'status' => 'draft',
        ]);

        // Clear sitemap cache before requesting
        Cache::forget('storefront_sitemap_xml');

        $response = $this->get('/sitemap.xml');
        $response->assertStatus(200);
        $this->assertStringContainsString('xml', (string) $response->headers->get('Content-Type'));

        $content = $response->getContent();
        $this->assertIsString($content);

        // Verify XML structure
        $this->assertStringContainsString('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"', $content);

        // Verify indexable items
        $this->assertStringContainsString('/product/sitemap-active-product', $content);
        $this->assertStringContainsString('/category/sitemap-active-cat', $content);
        $this->assertStringContainsString('/pages/privacy-policy', $content);
        $this->assertStringContainsString('/p/campaign-offer', $content);
        $this->assertStringContainsString('/shop', $content);

        // Verify excluded items
        $this->assertStringNotContainsString('draft-inactive-product', $content);
        $this->assertStringNotContainsString('inactive-cat', $content);
        $this->assertStringNotContainsString('draft-campaign', $content);
        $this->assertStringNotContainsString('/admin', $content);
        $this->assertStringNotContainsString('/checkout', $content);
        $this->assertStringNotContainsString('/cart', $content);
        $this->assertStringNotContainsString('/customer', $content);
    }

    public function test_sitemap_xml_is_cached_and_invalidates_on_model_events(): void
    {
        Cache::forget('storefront_sitemap_xml');

        $this->assertFalse(Cache::has('storefront_sitemap_xml'));

        $this->get('/sitemap.xml')->assertStatus(200);

        $this->assertTrue(Cache::has('storefront_sitemap_xml'));

        // Saving a product should clear the sitemap cache
        $product = Product::create([
            'title' => 'New Product For Invalidation',
            'slug' => 'new-product-invalidation',
            'regular_price' => 500,
            'status' => 'active',
        ]);

        $this->assertFalse(Cache::has('storefront_sitemap_xml'));

        // Requesting sitemap repopulates cache
        $this->get('/sitemap.xml')->assertStatus(200);
        $this->assertTrue(Cache::has('storefront_sitemap_xml'));

        // Deleting the product clears the sitemap cache
        $product->delete();
        $this->assertFalse(Cache::has('storefront_sitemap_xml'));
    }

    public function test_category_tree_is_cached_and_invalidates_on_save_and_delete(): void
    {
        Cache::forget('storefront_category_tree_active');

        $this->assertFalse(Cache::has('storefront_category_tree_active'));

        // Call toTree
        Category::toTree(true);

        $this->assertTrue(Cache::has('storefront_category_tree_active'));

        // Creating or saving category clears the cache
        $category = Category::create([
            'name' => 'Electronics Cache Test',
            'slug' => 'electronics-cache-test',
            'is_active' => true,
        ]);

        $this->assertFalse(Cache::has('storefront_category_tree_active'));

        // Call toTree again
        Category::toTree(true);
        $this->assertTrue(Cache::has('storefront_category_tree_active'));

        // Deleting category clears the cache
        $category->delete();
        $this->assertFalse(Cache::has('storefront_category_tree_active'));
    }

    public function test_storefront_product_details_returns_inertia_with_required_seo_props(): void
    {
        $product = Product::create([
            'title' => 'Premium Leather Backpack',
            'slug' => 'premium-leather-backpack',
            'description' => 'Detailed backpack description for test.',
            'regular_price' => 3500,
            'sale_price' => 2990,
            'status' => 'active',
        ]);

        $response = $this->get("/product/{$product->slug}");
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page
            ->component('Storefront/ProductDetail')
            ->has('product')
            ->where('product.slug', 'premium-leather-backpack')
            ->where('product.title', 'Premium Leather Backpack')
            ->has('theme')
        );
    }

    public function test_landing_page_blade_view_contains_canonical_and_json_ld(): void
    {
        $product = Product::create([
            'title' => 'Landing Page Hero Product',
            'slug' => 'landing-hero-product',
            'regular_price' => 1990,
            'sale_price' => 1490,
            'status' => 'active',
        ]);

        $landingPage = LandingPage::create([
            'title' => 'Exclusive Summer Offer',
            'slug' => 'summer-offer',
            'status' => 'published',
            'product_id' => $product->id,
            'meta_seo' => [
                'title' => 'Special Summer Sale 2026',
                'description' => 'Best summer deals in Bangladesh.',
            ],
        ]);

        $revision = LandingPageRevision::create([
            'landing_page_id' => $landingPage->id,
            'revision_number' => 1,
            'ast_content' => [
                'version' => 1,
                'settings' => [
                    'primaryColor' => '#16a34a',
                ],
                'blocks' => [],
            ],
            'created_by' => 'System',
        ]);

        $landingPage->update(['published_revision_id' => $revision->id]);

        $response = $this->get("/p/{$landingPage->slug}");
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertIsString($content);

        $this->assertStringContainsString('<link rel="canonical"', $content);
        $this->assertStringContainsString('application/ld+json', $content);
        $this->assertStringContainsString('https://schema.org', $content);
        $this->assertStringContainsString('Landing Page Hero Product', $content);
        $this->assertStringContainsString('"price":1490', $content);
    }

    public function test_policy_page_renders_storefront_inertia_component(): void
    {
        $policy = PolicyPage::create([
            'title' => 'Terms and Conditions',
            'slug' => 'terms-conditions',
            'content' => '<p>These are our terms of service.</p>',
            'is_published' => true,
        ]);

        $response = $this->get("/pages/{$policy->slug}");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $inertia) => $inertia
            ->component('Storefront/Policy')
            ->where('page.title', 'Terms and Conditions')
            ->where('page.slug', 'terms-conditions')
            ->where('page.is_published', true)
            ->has('categories')
            ->has('theme')
        );

        $response->assertSee('These are our terms of service.');
    }

    public function test_unpublished_landing_page_returns_404(): void
    {
        LandingPage::create([
            'title' => 'Unpublished Draft',
            'slug' => 'unpublished-draft-page',
            'status' => 'draft',
        ]);

        $response = $this->get('/p/unpublished-draft-page');
        $response->assertStatus(404);
    }

    public function test_unpublished_policy_page_returns_404(): void
    {
        PolicyPage::create([
            'title' => 'Draft Policy',
            'slug' => 'draft-policy',
            'content' => 'Draft content',
            'is_published' => false,
        ]);

        $response = $this->get('/pages/draft-policy');
        $response->assertStatus(404);
    }
}
