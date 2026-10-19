<?php

declare(strict_types=1);

namespace App\Modules\Storefront\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\PolicyPage;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    /**
     * Generate dynamic XML sitemap containing only eligible public URLs.
     */
    public function index(): Response
    {
        // Cache the rendered sitemap XML for 1 hour to optimize performance
        $xml = Cache::remember('storefront_sitemap_xml', 3600, function () {
            return $this->generateSitemapXml();
        });

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
            'X-Robots-Tag' => 'noindex', // The sitemap itself should not be indexed as a content page
        ]);
    }

    /**
     * Build the raw XML string for the sitemap.
     */
    protected function generateSitemapXml(): string
    {
        $baseUrl = rtrim(config('app.url', url('/')), '/');

        $categories = Category::query()
            ->where('is_active', true)
            ->select('slug', 'updated_at')
            ->get();

        $products = Product::query()
            ->active()
            ->with('primaryImage')
            ->select('id', 'title', 'slug', 'updated_at')
            ->get();

        $policyPages = PolicyPage::query()
            ->where('is_published', true)
            ->select('slug', 'updated_at')
            ->get();

        $landingPages = LandingPage::query()
            ->where('status', 'published')
            ->select('slug', 'updated_at')
            ->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'.PHP_EOL;
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'.PHP_EOL;

        // 1. Static Storefront Index Pages
        $now = now()->toAtomString();
        $xml .= $this->formatUrlEntry("{$baseUrl}/", $now, 'daily', '1.0');
        $xml .= $this->formatUrlEntry("{$baseUrl}/shop", $now, 'daily', '0.9');

        // 2. Active Categories
        foreach ($categories as $category) {
            $lastMod = $category->updated_at ? $category->updated_at->toAtomString() : $now;
            $xml .= $this->formatUrlEntry("{$baseUrl}/category/{$category->slug}", $lastMod, 'weekly', '0.8');
        }

        // 3. Active Products
        foreach ($products as $product) {
            $lastMod = $product->updated_at ? $product->updated_at->toAtomString() : $now;
            $imageUrl = null;
            $imageTitle = null;

            if ($product->primaryImage && ! empty($product->primaryImage->file_path)) {
                $imageUrl = "{$baseUrl}/storage/{$product->primaryImage->file_path}";
                $imageTitle = $product->title;
            }

            $xml .= $this->formatUrlEntry(
                "{$baseUrl}/product/{$product->slug}",
                $lastMod,
                'daily',
                '0.9',
                $imageUrl,
                $imageTitle
            );
        }

        // 4. Published Dynamic Landing Pages
        foreach ($landingPages as $landingPage) {
            $lastMod = $landingPage->updated_at ? $landingPage->updated_at->toAtomString() : $now;
            $xml .= $this->formatUrlEntry("{$baseUrl}/p/{$landingPage->slug}", $lastMod, 'daily', '0.9');
        }

        // 5. Published Policy Pages
        foreach ($policyPages as $page) {
            $lastMod = $page->updated_at ? $page->updated_at->toAtomString() : $now;
            $xml .= $this->formatUrlEntry("{$baseUrl}/pages/{$page->slug}", $lastMod, 'monthly', '0.5');
        }

        $xml .= '</urlset>';

        return $xml;
    }

    /**
     * Format a single URL XML node with safe escaping.
     */
    protected function formatUrlEntry(
        string $loc,
        string $lastMod,
        string $changeFreq,
        string $priority,
        ?string $imageUrl = null,
        ?string $imageTitle = null
    ): string {
        $escapedLoc = htmlspecialchars($loc, ENT_XML1, 'UTF-8');
        $escapedLastMod = htmlspecialchars($lastMod, ENT_XML1, 'UTF-8');
        $escapedChangeFreq = htmlspecialchars($changeFreq, ENT_XML1, 'UTF-8');
        $escapedPriority = htmlspecialchars($priority, ENT_XML1, 'UTF-8');

        $entry = '  <url>'.PHP_EOL;
        $entry .= "    <loc>{$escapedLoc}</loc>".PHP_EOL;
        $entry .= "    <lastmod>{$escapedLastMod}</lastmod>".PHP_EOL;
        $entry .= "    <changefreq>{$escapedChangeFreq}</changefreq>".PHP_EOL;
        $entry .= "    <priority>{$escapedPriority}</priority>".PHP_EOL;

        if ($imageUrl !== null) {
            $escapedImageUrl = htmlspecialchars($imageUrl, ENT_XML1, 'UTF-8');
            $entry .= '    <image:image>'.PHP_EOL;
            $entry .= "      <image:loc>{$escapedImageUrl}</image:loc>".PHP_EOL;
            if ($imageTitle !== null) {
                $escapedImageTitle = htmlspecialchars($imageTitle, ENT_XML1, 'UTF-8');
                $entry .= "      <image:title>{$escapedImageTitle}</image:title>".PHP_EOL;
            }
            $entry .= '    </image:image>'.PHP_EOL;
        }

        $entry .= '  </url>'.PHP_EOL;

        return $entry;
    }
}
