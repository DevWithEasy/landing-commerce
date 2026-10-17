<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Services;

use App\Modules\Catalog\Models\Product;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;

class BlockRendererService
{
    /**
     * Map block type to Blade view name.
     *
     * @var array<string, string>
     */
    public const BLOCK_VIEW_MAP = [
        'HeroBlock' => 'builder.blocks.hero',
        'ProductSelectorBlock' => 'builder.blocks.product-selector',
        'CodCheckoutBlock' => 'builder.blocks.cod-checkout',
        'BenefitsGridBlock' => 'builder.blocks.benefits-grid',
        'ReviewsBlock' => 'builder.blocks.reviews',
        'VideoBlock' => 'builder.blocks.video',
        'FaqBlock' => 'builder.blocks.faq',
        'CountdownTimerBlock' => 'builder.blocks.countdown-timer',
        'StickyBarBlock' => 'builder.blocks.sticky-bar',
    ];

    /**
     * Render an entire AST of blocks into safe HTML.
     *
     * @param  array{version?: int, settings?: array<string, mixed>, blocks?: list<array{id?: string, type: string, props?: array<string, mixed>, styles?: array<string, mixed>}>}  $ast
     * @param  array<string, mixed>  $context
     */
    public function renderAst(array $ast, array $context = []): string
    {
        $blocks = $ast['blocks'] ?? [];
        $html = '';

        foreach ($blocks as $block) {
            $html .= $this->renderBlock($block, $context);
        }

        return $html;
    }

    /**
     * Render a single AST block into safe HTML.
     *
     * @param  array{id?: string, type: string, props?: array<string, mixed>, styles?: array<string, mixed>}  $block
     * @param  array<string, mixed>  $context
     */
    public function renderBlock(array $block, array $context = []): string
    {
        $type = $block['type'] ?? '';

        if (! BlockRegistry::isApproved($type)) {
            return '';
        }

        $viewName = self::BLOCK_VIEW_MAP[$type] ?? null;

        if (! $viewName || ! View::exists($viewName)) {
            return '';
        }

        $defaultProps = BlockRegistry::getDefaultProps($type);
        $props = array_merge($defaultProps, $block['props'] ?? []);
        $styles = $block['styles'] ?? [];
        $styleAttribute = $this->convertStylesToCssAttribute($styles);

        // Preload product for product-dependent blocks if needed
        $product = null;
        if (in_array($type, ['ProductSelectorBlock', 'CodCheckoutBlock'], true)) {
            $productId = $props['productId'] ?? null;
            if ($productId) {
                if (isset($context['products'][$productId])) {
                    $product = $context['products'][$productId];
                } else {
                    $product = Product::with(['variants', 'images'])->find($productId);
                }
            }
        }

        return View::make($viewName, [
            'id' => $block['id'] ?? Str::uuid()->toString(),
            'props' => $props,
            'styles' => $styles,
            'styleAttribute' => $styleAttribute,
            'product' => $product,
            'context' => $context,
        ])->render();
    }

    /**
     * Convert AST styles dictionary to a sanitized inline CSS style attribute string.
     *
     * @param  array<string, mixed>  $styles
     */
    public function convertStylesToCssAttribute(array $styles): string
    {
        $cssDeclarations = [];

        foreach ($styles as $property => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            // Convert camelCase to kebab-case
            $kebabProperty = strtolower((string) preg_replace('/(?<!^)[A-Z]/', '-$0', $property));

            // Strictly check allowlisted property names
            if (! in_array($kebabProperty, PageAstValidator::ALLOWED_CSS_PROPERTIES, true)) {
                continue;
            }

            // Sanitize value: disallow dangerous css injection patterns
            $stringValue = (string) $value;
            if (preg_match('/(?:url\(|expression\(|javascript:|@import)/i', $stringValue)) {
                continue;
            }

            // Escape double quotes or semicolons
            $safeValue = str_replace(['"', ';'], '', $stringValue);

            $cssDeclarations[] = "{$kebabProperty}: {$safeValue}";
        }

        if (empty($cssDeclarations)) {
            return '';
        }

        return 'style="'.implode('; ', $cssDeclarations).'"';
    }

    /**
     * Sanitize and format video embed URLs for YouTube/Vimeo.
     */
    public static function formatVideoEmbedUrl(string $rawUrl): string
    {
        if (empty($rawUrl)) {
            return '';
        }

        // YouTube
        if (preg_match('/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/', $rawUrl, $matches)) {
            return "https://www.youtube-nocookie.com/embed/{$matches[1]}?rel=0";
        }

        // Vimeo
        if (preg_match('/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/', $rawUrl, $matches)) {
            return "https://player.vimeo.com/video/{$matches[1]}";
        }

        return $rawUrl;
    }
}
