<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Services;

use App\Modules\Catalog\Models\Product;
use App\Modules\Shipping\Models\ShippingMethod;
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
        'AccordionBlock' => 'builder.blocks.accordion',
        'CountdownTimerBlock' => 'builder.blocks.countdown-timer',
        'StickyBarBlock' => 'builder.blocks.sticky-bar',
        'HtmlBlock' => 'builder.blocks.html',
        'ContainerBlock' => 'builder.blocks.container',
        'GridBlock' => 'builder.blocks.grid',
        'HeadingBlock' => 'builder.blocks.heading',
        'TextBlock' => 'builder.blocks.text',
        'ImageBlock' => 'builder.blocks.image',
        'ButtonBlock' => 'builder.blocks.button',
        'IconListBlock' => 'builder.blocks.icon-list',
        'ImageCarouselBlock' => 'builder.blocks.image-carousel',
        'TestimonialBlock' => 'builder.blocks.testimonial',
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

        // For ContainerBlock, merge safe flex layout props into styles
        if ($type === 'ContainerBlock') {
            $layoutStyles = [
                'display' => 'flex',
                'flex-direction' => ($props['direction'] ?? 'column') === 'row' ? 'row' : 'column',
            ];

            if (! empty($props['wrap']) && in_array($props['wrap'], ['nowrap', 'wrap', 'wrap-reverse'], true)) {
                $layoutStyles['flex-wrap'] = $props['wrap'];
            }

            $allowedJustify = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'];
            if (! empty($props['justifyContent']) && in_array($props['justifyContent'], $allowedJustify, true)) {
                $layoutStyles['justify-content'] = $props['justifyContent'];
            }

            $allowedAlign = ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'];
            if (! empty($props['alignItems']) && in_array($props['alignItems'], $allowedAlign, true)) {
                $layoutStyles['align-items'] = $props['alignItems'];
            }

            if (! empty($props['gap'])) {
                $safeGap = trim((string) preg_replace('/[^0-9a-zA-Z\s\.\-%]/', '', (string) $props['gap']));
                if ($safeGap !== '') {
                    $layoutStyles['gap'] = $safeGap;
                }
            }

            $styles = array_merge($layoutStyles, $styles);
        }

        $styleAttribute = $this->convertStylesToCssAttribute($styles);

        // Recursively render child blocks if present
        $childrenHtml = '';
        if (! empty($block['children']) && is_array($block['children'])) {
            foreach ($block['children'] as $childBlock) {
                if (is_array($childBlock)) {
                    $childrenHtml .= $this->renderBlock($childBlock, $context);
                }
            }
        }

        // Preload product(s) for product-dependent blocks if needed
        $product = null;
        $products = collect();
        if (in_array($type, ['ProductSelectorBlock', 'CodCheckoutBlock'], true)) {
            $rawProductIds = ! empty($props['productIds']) && is_array($props['productIds'])
                ? $props['productIds']
                : (! empty($props['productId']) ? [$props['productId']] : []);

            $productIds = array_values(array_filter(array_map('intval', $rawProductIds)));

            if (! empty($productIds)) {
                $products = Product::with(['variants.images', 'images', 'primaryImage'])
                    ->whereIn('id', $productIds)
                    ->get()
                    ->sortBy(function ($p) use ($productIds) {
                        return array_search($p->id, $productIds, true);
                    })
                    ->values();

                $product = $products->first();
            }
        }

        $shippingMethods = collect();
        if ($type === 'CodCheckoutBlock') {
            try {
                $shippingMethods = ShippingMethod::with('zone')
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get();
            } catch (\Throwable) {
                $shippingMethods = collect();
            }
        }

        return View::make($viewName, [
            'id' => $block['id'] ?? Str::uuid()->toString(),
            'props' => $props,
            'styles' => $styles,
            'styleAttribute' => $styleAttribute,
            'children' => $block['children'] ?? [],
            'childrenHtml' => $childrenHtml,
            'product' => $product,
            'products' => $products,
            'selectionMode' => $props['selectionMode'] ?? 'single',
            'shippingMethods' => $shippingMethods,
            'context' => $context,
            'renderer' => $this,
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

    /**
     * Sanitize and escape URL to prevent JavaScript execution and dangerous URI schemes.
     */
    public static function sanitizeUrl(?string $rawUrl): string
    {
        if (empty($rawUrl)) {
            return '';
        }

        $trimmed = trim($rawUrl);

        // Internal anchor hashes (#cod-checkout) or relative paths (/checkout) are safe
        if (str_starts_with($trimmed, '#') || str_starts_with($trimmed, '/')) {
            return htmlspecialchars($trimmed, ENT_QUOTES, 'UTF-8');
        }

        // Scheme validation
        if (preg_match('/^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/s', $trimmed, $matches)) {
            $scheme = strtolower($matches[1]);
            if (! in_array($scheme, ['http', 'https', 'tel', 'mailto'], true)) {
                return '#';
            }
        }

        return htmlspecialchars($trimmed, ENT_QUOTES, 'UTF-8');
    }
}
