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
        $blockProps = $block['props'] ?? [];

        // Legacy testimonial ASTs stored a single quote/author on the block
        // itself. The registry now defaults to a multi-item array, so remove
        // that default when a legacy block has no explicit items. Without this
        // guard the defaults would silently replace the saved testimonial.
        if (
            $type === 'TestimonialBlock'
            && ! array_key_exists('items', $blockProps)
            && (array_key_exists('quote', $blockProps) || array_key_exists('authorName', $blockProps))
        ) {
            unset($defaultProps['items']);
        }

        $props = array_merge($defaultProps, $blockProps);
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

        $styleAttribute = $this->convertStylesToCssAttribute($this->withoutRootOnlyStyles($styles, $type));
        $blockId = (string) ($block['id'] ?? Str::uuid()->toString());
        $scopeClass = $this->buildBlockScopeClass($blockId);
        $wrapperStyleAttribute = $this->convertStylesToCssAttribute(
            $this->buildWrapperStyles($styles)
        );
        $scopedCss = $this->buildScopedCss($scopeClass, $styles, $type);

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
            } elseif (! empty($context['product']) && $context['product'] instanceof Product) {
                $product = $context['product']->loadMissing(['variants.images', 'images', 'primaryImage']);
                $products = collect([$product]);
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

        $renderedBlock = View::make($viewName, [
            'id' => $blockId,
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

        $styleTag = $scopedCss !== '' ? '<style>'.$scopedCss.'</style>' : '';

        return $styleTag
            .'<div class="lc-block-scope '.e($scopeClass).'"'
            .' data-lc-block-scope="'.e($scopeClass).'"'
            .' data-lc-block-id="'.e($blockId).'"'
            .($wrapperStyleAttribute !== '' ? ' '.$wrapperStyleAttribute : '')
            .'>'.$renderedBlock.'</div>';
    }

    /**
     * Remove structural keys that belong to the wrapper/scoped CSS system
     * rather than the block root inline style.
     *
     * @param  array<string, mixed>  $styles
     * @return array<string, mixed>
     */
    private function withoutStructuralStyles(array $styles): array
    {
        unset(
            $styles['responsive'],
            $styles['elements'],
            $styles['selfAlign'],
            $styles['selfalign']
        );

        return $styles;
    }

    /**
     * Root width belongs to the alignment wrapper, not to the block root.
     * For CodCheckoutBlock, padding and border/shadow tokens are delegated to
     * its inner container/card elements so they do not duplicate on <section>.
     *
     * @param  array<string, mixed>  $styles
     * @return array<string, mixed>
     */
    private function withoutRootOnlyStyles(array $styles, string $type = ''): array
    {
        $styles = $this->withoutStructuralStyles($styles);
        unset($styles['width']);

        if ($type === 'CodCheckoutBlock') {
            unset(
                $styles['padding'],
                $styles['paddingTop'],
                $styles['paddingRight'],
                $styles['paddingBottom'],
                $styles['paddingLeft'],
                $styles['padding-top'],
                $styles['padding-right'],
                $styles['padding-bottom'],
                $styles['padding-left'],
                $styles['borderColor'],
                $styles['borderWidth'],
                $styles['borderStyle'],
                $styles['borderRadius'],
                $styles['boxShadow'],
                $styles['border-color'],
                $styles['border-width'],
                $styles['border-style'],
                $styles['border-radius'],
                $styles['box-shadow']
            );
        }

        return $styles;
    }

    /**
     * @param  array<string, mixed>  $styles
     * @return array<string, string>
     */
    private function buildWrapperStyles(array $styles): array
    {
        $wrapper = [];
        $width = $this->sanitizeCssValue($styles['width'] ?? null);

        if ($width !== null) {
            $wrapper['width'] = $width;
        }

        $alignment = $styles['selfAlign'] ?? $styles['selfalign'] ?? null;

        if ($alignment === 'left') {
            $wrapper['margin-left'] = '0';
            $wrapper['margin-right'] = 'auto';
        } elseif ($alignment === 'center') {
            $wrapper['margin-left'] = 'auto';
            $wrapper['margin-right'] = 'auto';
        } elseif ($alignment === 'right') {
            $wrapper['margin-left'] = 'auto';
            $wrapper['margin-right'] = '0';
        }

        return $wrapper;
    }

    private function buildBlockScopeClass(string $blockId): string
    {
        return 'lc-scope-'.preg_replace('/[^a-zA-Z0-9_-]/', '_', $blockId);
    }

    /**
     * Build responsive root and per-element CSS for the published page.
     *
     * Inline styles win over normal stylesheet declarations, so scoped
     * overrides are emitted with !important. Values still pass the same
     * allowlist and injection checks as inline styles.
     *
     * @param  array<string, mixed>  $styles
     */
    private function buildScopedCss(string $scopeClass, array $styles, string $type = ''): string
    {
        $scopeSelector = '[data-lc-block-scope="'.e($scopeClass).'"]';
        $rootSelector = $scopeSelector.' > .lc-block-root';
        $rules = [];

        $elements = $styles['elements'] ?? [];

        if (is_array($elements)) {
            foreach ($elements as $elementKey => $elementStyles) {
                if (
                    ! is_string($elementKey)
                    || ! preg_match('/^[a-z][a-z0-9-]{0,39}$/', $elementKey)
                    || ! is_array($elementStyles)
                ) {
                    continue;
                }

                $elementSelector = $scopeSelector.' [data-lc-el="'.$elementKey.'"]';
                $baseDeclarations = $this->convertStylesToCssDeclarations(
                    $this->withoutStructuralStyles($elementStyles)
                );

                if ($baseDeclarations !== []) {
                    $rules[] = $elementSelector.' { '
                        .implode(' ', $this->importantDeclarations($baseDeclarations))
                        .' }';
                }

                $elementResponsive = $elementStyles['responsive'] ?? [];

                if (is_array($elementResponsive)) {
                    foreach (['tablet' => 1024, 'mobile' => 767] as $device => $maxWidth) {
                        $deviceStyles = $elementResponsive[$device] ?? null;

                        if (! is_array($deviceStyles)) {
                            continue;
                        }

                        $declarations = $this->convertStylesToCssDeclarations(
                            $this->withoutStructuralStyles($deviceStyles)
                        );

                        if ($declarations === []) {
                            continue;
                        }

                        $rules[] = '@media (max-width: '.$maxWidth.'px) { '
                            .$elementSelector.' { '
                            .implode(' ', $this->importantDeclarations($declarations))
                            .' } }';
                    }
                }
            }
        }

        $responsive = $styles['responsive'] ?? [];

        if (is_array($responsive)) {
            foreach (['tablet' => 1024, 'mobile' => 767] as $device => $maxWidth) {
                $deviceStyles = $responsive[$device] ?? null;

                if (! is_array($deviceStyles)) {
                    continue;
                }

                $rootDeclarations = $this->convertStylesToCssDeclarations(
                    $this->withoutRootOnlyStyles($deviceStyles, $type)
                );
                $wrapperDeclarations = $this->convertStylesToCssDeclarations(
                    $this->buildWrapperStyles($deviceStyles)
                );

                if ($rootDeclarations !== []) {
                    $rules[] = '@media (max-width: '.$maxWidth.'px) { '
                        .$rootSelector.' { '
                        .implode(' ', $this->importantDeclarations($rootDeclarations))
                        .' } }';
                }

                if ($wrapperDeclarations !== []) {
                    $rules[] = '@media (max-width: '.$maxWidth.'px) { '
                        .$scopeSelector.' { '
                        .implode(' ', $this->importantDeclarations($wrapperDeclarations))
                        .' } }';
                }

                if ($type === 'CodCheckoutBlock') {
                    $containerStyles = array_intersect_key($deviceStyles, array_flip([
                        'padding',
                        'paddingTop',
                        'paddingRight',
                        'paddingBottom',
                        'paddingLeft',
                        'padding-top',
                        'padding-right',
                        'padding-bottom',
                        'padding-left',
                    ]));
                    $containerDeclarations = $this->convertStylesToCssDeclarations($containerStyles);

                    if ($containerDeclarations !== []) {
                        $rules[] = '@media (max-width: '.$maxWidth.'px) { '
                            .$scopeSelector.' [data-lc-el="container"] { '
                            .implode(' ', $this->importantDeclarations($containerDeclarations))
                            .' } }';
                    }

                    $cardStyles = array_intersect_key($deviceStyles, array_flip([
                        'borderColor',
                        'borderWidth',
                        'borderStyle',
                        'borderRadius',
                        'boxShadow',
                        'border-color',
                        'border-width',
                        'border-style',
                        'border-radius',
                        'box-shadow',
                    ]));
                    $cardDeclarations = $this->convertStylesToCssDeclarations($cardStyles);

                    if ($cardDeclarations !== []) {
                        $rules[] = '@media (max-width: '.$maxWidth.'px) { '
                            .$scopeSelector.' [data-lc-el="card"] { '
                            .implode(' ', $this->importantDeclarations($cardDeclarations))
                            .' } }';
                    }
                }
            }
        }

        return implode("\n", $rules);
    }

    /**
     * @param  list<string>  $declarations
     * @return list<string>
     */
    private function importantDeclarations(array $declarations): array
    {
        return array_map(
            static fn (string $declaration): string => $declaration.' !important;',
            $declarations
        );
    }

    private function sanitizeCssValue(mixed $value): ?string
    {
        if ($value === null || $value === '' || is_array($value) || is_object($value)) {
            return null;
        }

        $stringValue = trim((string) $value);

        if (
            $stringValue === ''
            || preg_match('/(?:url\s*\(|expression\s*\(|javascript\s*:|@import|behavior\s*:|-moz-binding|[;{}<>\\\\])/i', $stringValue)
        ) {
            return null;
        }

        return $stringValue;
    }

    /**
     * Convert AST style dictionaries into sanitized CSS declarations.
     *
     * @param  array<string, mixed>  $styles
     * @return list<string>
     */
    public function convertStylesToCssDeclarations(array $styles): array
    {
        $cssDeclarations = [];

        foreach ($styles as $property => $value) {
            if ($value === null || $value === '' || is_array($value) || is_object($value)) {
                continue;
            }

            // Convert camelCase to kebab-case
            $kebabProperty = strtolower((string) preg_replace('/(?<!^)[A-Z]/', '-$0', (string) $property));
            $normalizedProperty = str_replace(['-', '_'], '', $kebabProperty);

            // Strictly check allowlisted property names
            if (! in_array($normalizedProperty, PageAstValidator::ALLOWED_CSS_PROPERTIES, true)) {
                continue;
            }

            $safeValue = $this->sanitizeCssValue($value);

            if ($safeValue === null) {
                continue;
            }

            // The renderer must not depend on the save-time validator alone.
            // Never emit overlay positioning or high z-index values from AST data.
            if (
                $normalizedProperty === 'position'
                && in_array(strtolower(trim($safeValue)), ['fixed', 'sticky', 'absolute'], true)
            ) {
                continue;
            }

            if ($normalizedProperty === 'zindex' && (int) $safeValue > PageAstValidator::MAX_Z_INDEX) {
                continue;
            }

            $cssDeclarations[] = "{$kebabProperty}: {$safeValue}";
        }

        return $cssDeclarations;
    }

    /**
     * Convert AST styles dictionary to a sanitized inline CSS style attribute string.
     *
     * @param  array<string, mixed>  $styles
     */
    public function convertStylesToCssAttribute(array $styles): string
    {
        $cssDeclarations = array_map(
            static function (string $declaration): string {
                [$property, $value] = explode(':', $declaration, 2);

                return $property.': '.htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
            },
            $this->convertStylesToCssDeclarations($styles)
        );

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
