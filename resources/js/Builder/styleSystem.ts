import type { CSSProperties } from 'react';
import type { Block, BlockStyles, BlockType, ViewportMode } from '@/types/builder';

/**
 * The builder always renders each device at its true design width. The visual
 * canvas may be narrower on a laptop, so the fixed-width surface is scaled
 * down only for display. Responsive utilities inside the canvas must therefore
 * use container queries scoped to that surface instead of the browser window.
 */
export const DEVICE_DESIGN_WIDTHS: Record<ViewportMode, number> = {
    desktop: 1440,
    tablet: 768,
    mobile: 390,
};

export const DEVICE_LABELS: Record<ViewportMode, string> = {
    desktop: 'Desktop',
    tablet: 'Tablet',
    mobile: 'Mobile',
};

export const DEVICE_STYLE_BREAKPOINTS: Record<'tablet' | 'mobile', number> = {
    tablet: 1024,
    mobile: 767,
};

export const NON_CSS_STYLE_KEYS = new Set<string>([
    'responsive',
    'elements',
    'selfAlign',
    'buttonBgColor',
    'buttonTextColor',
    'buttonBorderRadius',
    'buttonPulseAnimation',
]);

const SAFE_CSS_VALUE_PATTERN = /(?:expression\s*\(|@import|url\s*\(|javascript\s*:|behavior\s*:|-moz-binding|[;{}<>\\])/i;

const ELEMENT_KEY_PATTERN = /^[a-z][a-z0-9-]{0,39}$/;

export function sanitizeStyleValue(value: unknown): string | undefined {
    if (value === undefined || value === null || typeof value === 'boolean') {
        return undefined;
    }

    const text = String(value).trim();

    if (text === '' || SAFE_CSS_VALUE_PATTERN.test(text)) {
        return undefined;
    }

    return text;
}

export function toCssPropertyName(property: string): string {
    return property
        .replace(/^ms-?/, 'ms-')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase();
}

/**
 * Desktop values live on the flat style object. Tablet and mobile only store
 * explicit overrides, so every control inherits the desktop value until the
 * merchant edits it for the active device.
 */
export function resolveBlockStyles(
    styles: BlockStyles | undefined,
    viewport: ViewportMode
): BlockStyles {
    if (!styles) {
        return {};
    }

    if (viewport === 'desktop') {
        return styles;
    }

    const override = styles.responsive?.[viewport] ?? {};

    return {
        ...styles,
        ...override,
        responsive: styles.responsive,
        elements: mergeElementStyleMaps(styles.elements, override.elements),
    };
}

function mergeElementStyleMaps(
    base?: Record<string, Partial<BlockStyles>>,
    override?: Record<string, Partial<BlockStyles>>
): Record<string, Partial<BlockStyles>> | undefined {
    if (!base && !override) {
        return undefined;
    }

    const merged: Record<string, Partial<BlockStyles>> = { ...(base || {}) };

    Object.entries(override || {}).forEach(([key, value]) => {
        merged[key] = { ...(merged[key] || {}), ...(value || {}) };
    });

    return merged;
}

export function resolveElementStyles(
    styles: BlockStyles | undefined,
    element: string,
    viewport: ViewportMode
): Partial<BlockStyles> {
    const elementStyles = styles?.elements?.[element] || {};

    if (viewport === 'desktop') {
        return elementStyles;
    }

    return {
        ...elementStyles,
        ...(elementStyles.responsive?.[viewport] ?? {}),
    };
}

export function resolveBlocksForViewport(blocks: Block[], viewport: ViewportMode): Block[] {
    return blocks.map((block) => ({
        ...block,
        styles: resolveBlockStyles(block.styles, viewport),
        children: block.children ? resolveBlocksForViewport(block.children, viewport) : undefined,
    }));
}

export function getBlockWrapperStyle(styles: BlockStyles | undefined): CSSProperties {
    if (!styles) {
        return {};
    }

    const wrapperStyle: CSSProperties = {};

    if (styles.width) {
        wrapperStyle.width = styles.width;
    }

    switch (styles.selfAlign) {
        case 'left':
            wrapperStyle.marginLeft = 0;
            wrapperStyle.marginRight = 'auto';
            break;
        case 'center':
            wrapperStyle.marginLeft = 'auto';
            wrapperStyle.marginRight = 'auto';
            break;
        case 'right':
            wrapperStyle.marginLeft = 'auto';
            wrapperStyle.marginRight = 0;
            break;
        default:
            break;
    }

    return wrapperStyle;
}

export function getBlockScopeClass(blockId: string): string {
    return `lc-scope-${blockId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function buildDeclarations(styles: Partial<BlockStyles> | undefined): string[] {
    if (!styles) {
        return [];
    }

    return Object.entries(styles).flatMap(([property, value]) => {
        if (NON_CSS_STYLE_KEYS.has(property) || !/^[a-zA-Z][a-zA-Z0-9-]*$/.test(property)) {
            return [];
        }

        const safeValue = sanitizeStyleValue(value);

        if (safeValue === undefined) {
            return [];
        }

        const cssProperty = toCssPropertyName(property);

        if (!/^[a-z][a-z0-9-]*$/.test(cssProperty)) {
            return [];
        }

        if (
            cssProperty === 'position' &&
            ['fixed', 'sticky', 'absolute'].includes(safeValue.toLowerCase())
        ) {
            return [];
        }

        if (cssProperty === 'z-index' && Number(safeValue) > 50) {
            return [];
        }

        return [`${cssProperty}: ${safeValue} !important;`];
    });
}

/**
 * Generates scoped CSS for inner elements. Only allowlisted style keys are
 * converted; dangerous values such as url(), @import and expression() are
 * discarded before the string reaches the browser.
 */
export function buildElementStyleCss(
    blockId: string,
    styles: BlockStyles | undefined,
    viewport: ViewportMode
): string {
    if (!styles?.elements) {
        return '';
    }

    const scope = getBlockScopeClass(blockId);
    const rules: string[] = [];

    Object.entries(styles.elements).forEach(([element]) => {
        if (!ELEMENT_KEY_PATTERN.test(element)) {
            return;
        }

        const declarations = buildDeclarations(
            resolveElementStyles(styles, element, viewport)
        );

        if (declarations.length === 0) {
            return;
        }

        rules.push(
            `[data-lc-block-scope="${scope}"] [data-lc-el="${element}"] { ${declarations.join(' ')} }`
        );
    });

    return rules.join('\n');
}

export interface ElementStyleOption {
    key: string;
    label: string;
}

/**
 * Friendly element targets shown in the inspector. The data attributes with
 * the same keys are emitted by both React and the published Blade renderers.
 */
export const BLOCK_ELEMENT_STYLE_OPTIONS: Record<BlockType, ElementStyleOption[]> = {
    HeroBlock: [
        { key: 'badge', label: 'Badge' },
        { key: 'title', label: 'Headline' },
        { key: 'subtitle', label: 'Subheadline' },
        { key: 'cta', label: 'CTA button' },
        { key: 'image', label: 'Showcase image' },
    ],
    ProductSelectorBlock: [
        { key: 'section', label: 'Section' },
        { key: 'title', label: 'Section title' },
        { key: 'card', label: 'Product card' },
        { key: 'image', label: 'Product image' },
        { key: 'product-title', label: 'Product title' },
        { key: 'price', label: 'Price' },
        { key: 'description', label: 'Description' },
        { key: 'button', label: 'Order button' },
    ],
    CodCheckoutBlock: [
        { key: 'section', label: 'Checkout section' },
        { key: 'header', label: 'Header' },
        { key: 'title', label: 'Header title' },
        { key: 'subtitle', label: 'Header subtitle' },
        { key: 'card', label: 'Checkout card' },
        { key: 'label', label: 'Field labels' },
        { key: 'input', label: 'Inputs' },
        { key: 'product-card', label: 'Product card' },
        { key: 'summary', label: 'Order summary' },
        { key: 'button', label: 'Submit button' },
        { key: 'trust', label: 'Trust row' },
    ],
    BenefitsGridBlock: [
        { key: 'title', label: 'Section title' },
        { key: 'card', label: 'Benefit card' },
        { key: 'icon', label: 'Icon box' },
        { key: 'card-title', label: 'Card title' },
        { key: 'card-text', label: 'Card description' },
    ],
    ReviewsBlock: [
        { key: 'title', label: 'Section title' },
        { key: 'summary', label: 'Rating summary' },
        { key: 'stars', label: 'Star row' },
        { key: 'card', label: 'Review card' },
        { key: 'comment', label: 'Review text' },
        { key: 'author', label: 'Author name' },
        { key: 'verified', label: 'Verified badge' },
    ],
    VideoBlock: [{ key: 'video', label: 'Video frame' }],
    FaqBlock: [
        { key: 'title', label: 'Section title' },
        { key: 'item', label: 'FAQ item' },
        { key: 'question', label: 'Question' },
        { key: 'answer', label: 'Answer' },
    ],
    AccordionBlock: [
        { key: 'title', label: 'Section title' },
        { key: 'item', label: 'Accordion item' },
        { key: 'question', label: 'Question' },
        { key: 'answer', label: 'Answer' },
    ],
    CountdownTimerBlock: [
        { key: 'headline', label: 'Headline badge' },
        { key: 'urgency', label: 'Urgency text' },
        { key: 'timebox', label: 'Time box' },
        { key: 'timer-label', label: 'Time label' },
    ],
    StickyBarBlock: [
        { key: 'message', label: 'Message' },
        { key: 'button', label: 'CTA button' },
    ],
    HtmlBlock: [{ key: 'html', label: 'HTML container' }],
    ContainerBlock: [{ key: 'container', label: 'Container' }],
    GridBlock: [{ key: 'grid', label: 'Grid' }],
    HeadingBlock: [{ key: 'title', label: 'Heading text' }],
    TextBlock: [{ key: 'text', label: 'Paragraph' }],
    ImageBlock: [
        { key: 'image', label: 'Image' },
        { key: 'caption', label: 'Caption' },
    ],
    ButtonBlock: [{ key: 'button', label: 'Button' }],
    IconListBlock: [
        { key: 'title', label: 'Section title' },
        { key: 'item', label: 'List item' },
        { key: 'marker', label: 'Marker' },
        { key: 'text', label: 'Item text' },
    ],
    ImageCarouselBlock: [
        { key: 'title', label: 'Section title' },
        { key: 'slide', label: 'Slide' },
        { key: 'image', label: 'Image frame' },
        { key: 'arrow', label: 'Arrow buttons' },
        { key: 'dot', label: 'Dots' },
    ],
    TestimonialBlock: [
        { key: 'card', label: 'Testimonial card' },
        { key: 'quote', label: 'Quote' },
        { key: 'author', label: 'Author' },
        { key: 'avatar', label: 'Avatar' },
        { key: 'stars', label: 'Stars' },
        { key: 'arrow', label: 'Arrow buttons' },
        { key: 'dot', label: 'Dots' },
    ],
};
