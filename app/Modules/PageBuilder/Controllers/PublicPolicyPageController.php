<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Category;
use App\Modules\PageBuilder\Models\PolicyPage;
use App\Modules\Settings\Services\SettingsService;
use Inertia\Inertia;
use Inertia\Response;

class PublicPolicyPageController extends Controller
{
    /**
     * Display a public policy or content page inside the storefront layout.
     */
    public function show(string $slug, SettingsService $settingsService): Response
    {
        $page = PolicyPage::where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $sanitizedContent = $this->sanitizeContent($page->content);

        $theme = [
            'store_name' => (string) $settingsService->get('store.name', config('app.name', 'Landing Commerce')),
            'store_phone' => (string) $settingsService->get('store.phone', ''),
            'store_whatsapp' => (string) $settingsService->get('store.whatsapp', ''),
            'logo_url' => (string) $settingsService->get('store.logo_url', ''),
            'favicon_url' => (string) $settingsService->get('store.favicon_url', ''),
            'primary_color' => (string) $settingsService->get('theme.primary_color', '#4f46e5'),
            'secondary_color' => (string) $settingsService->get('theme.secondary_color', '#06b6d4'),
            'accent_color' => (string) $settingsService->get('theme.accent_color', '#f59e0b'),
            'font_family' => (string) $settingsService->get('theme.font_family', 'Hind Siliguri, Inter, sans-serif'),
            'custom_css' => (string) $settingsService->get('theme.custom_css', ''),
        ];

        return Inertia::render('Storefront/Policy', [
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'is_published' => $page->is_published,
                'is_protected' => $page->is_protected,
            ],
            'content' => $sanitizedContent,
            'categories' => Category::toTree(true),
            'theme' => $theme,
        ]);
    }

    /**
     * Sanitize HTML content to prevent XSS and arbitrary script execution.
     */
    protected function sanitizeContent(string $raw): string
    {
        $allowedTags = '<p><br><strong><b><em><i><u><h1><h2><h3><h4><h5><h6><ul><ol><li><a><blockquote><pre><code><table><thead><tbody><tr><th><td><hr>';
        $cleaned = strip_tags($raw, $allowedTags);
        $cleaned = (string) preg_replace('/on[a-z]+\s*=\s*([\'"]).*?\1/i', '', $cleaned);
        $cleaned = (string) preg_replace('/href\s*=\s*([\'"])\s*javascript:[^\'"]*\1/i', 'href="#"', $cleaned);

        return $cleaned;
    }
}
