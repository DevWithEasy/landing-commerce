import type { CSSProperties } from 'react';
import type { CodCheckoutBlockProps } from '@/types/builder';

/**
 * CSS injection guard shared by every merchant-configurable checkout value.
 *
 * The checkout design panel only accepts design tokens (colors, lengths,
 * shadows, gradients). Values that could escape the declaration or load
 * remote resources are rejected before they reach React or Blade.
 */
const UNSAFE_CSS_PATTERN = /(?:expression\s*\(|@import|url\s*\(|javascript\s*:|behavior\s*:|-moz-binding|[;{}<>\\])/i;

export function safeCheckoutCss(value?: string | number | null): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    const cssValue = String(value).trim();

    if (cssValue === '' || UNSAFE_CSS_PATTERN.test(cssValue)) {
        return undefined;
    }

    return cssValue;
}

export type CheckoutCssVariables = CSSProperties & Record<`--${string}`, string>;

/**
 * Pseudo-class styling (focus rings, placeholder colour, button hover) cannot
 * be expressed through React inline styles, so it is driven by CSS variables
 * set on the checkout section. Only sanitized values are written to variables.
 */
export function buildCheckoutCssVariables(props: CodCheckoutBlockProps): CheckoutCssVariables {
    const variables: Record<string, string> = {};
    const set = (name: string, value?: string | null): void => {
        const safeValue = safeCheckoutCss(value);
        if (safeValue) {
            variables[name] = safeValue;
        }
    };

    set('--cod-accent', props.accentColor || props.highlightColor || '#059669');
    set('--cod-focus', props.inputFocusColor || props.accentColor || props.highlightColor || '#10b981');
    set('--cod-focus-ring', props.inputFocusRingColor || 'rgba(16, 185, 129, 0.18)');
    set('--cod-focus-ring-width', props.inputFocusRingWidth || '3px');
    set('--cod-placeholder', props.inputPlaceholderColor || '#94a3b8');
    set('--cod-btn-hover', props.buttonHoverBgColor || '#047857');

    return variables as CheckoutCssVariables;
}

/**
 * Static, developer-authored CSS. No merchant strings are interpolated here;
 * dynamic values are injected as sanitized CSS custom properties instead.
 */
export const COD_CHECKOUT_STATIC_CSS = `
#cod-checkout input:focus,
#cod-checkout select:focus,
#cod-checkout textarea:focus {
    outline: none !important;
    border-color: var(--cod-focus, #10b981) !important;
    box-shadow: 0 0 0 var(--cod-focus-ring-width, 3px) var(--cod-focus-ring, rgba(16, 185, 129, 0.18)) !important;
}
#cod-checkout input::placeholder,
#cod-checkout textarea::placeholder {
    color: var(--cod-placeholder, #94a3b8) !important;
    opacity: 1;
}
#cod-checkout .cod-submit-btn:hover:not(:disabled) {
    background-color: var(--cod-btn-hover, #047857) !important;
}
#cod-checkout .cod-product-card {
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
#cod-checkout .cod-product-card:not(.cod-card-selected):hover {
    border-color: var(--cod-accent, #10b981) !important;
}
`;
