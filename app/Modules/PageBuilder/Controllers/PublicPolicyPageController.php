<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PageBuilder\Models\PolicyPage;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Contracts\View\View;

class PublicPolicyPageController extends Controller
{
    /**
     * Display a public policy or content page.
     */
    public function show(string $slug, SettingsService $settingsService): View
    {
        $page = PolicyPage::where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $sanitizedContent = $this->sanitizeContent($page->content);

        return view('storefront.policy', [
            'page' => $page,
            'content' => $sanitizedContent,
            'storeName' => $settingsService->get('store.name', config('app.name', 'Landing Commerce')),
            'logoUrl' => $settingsService->get('store.logo_url'),
            'primaryColor' => $settingsService->get('theme.primary_color', '#4f46e5'),
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
