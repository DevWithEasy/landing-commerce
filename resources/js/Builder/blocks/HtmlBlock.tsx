import { Code } from 'lucide-react';
import { useId, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { BlockStyles, HtmlBlockProps } from '@/types/builder';

export interface HtmlBlockComponentProps {
    props: HtmlBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

/**
 * Client-side sanitization helper to strip script tags and inline event handlers
 * ensuring safe canvas rendering in accordance with AGENTS.md security guardrails.
 */
function sanitizeHtmlForPreview(rawHtml: string): string {
    if (!rawHtml) return '';

    // Strip <script>...</script>
    let sanitized = rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Strip inline event handlers: onclick, onerror, onload, etc.
    sanitized = sanitized.replace(/\bon[a-zA-Z]+\s*=\s*(['"]).*?\1/gi, '');
    sanitized = sanitized.replace(/\bon[a-zA-Z]+\s*=\s*[^ >]+/gi, '');

    // Strip javascript: and vbscript: URIs
    sanitized = sanitized.replace(/(javascript|vbscript):/gi, 'blocked:');

    return sanitized;
}

/**
 * Sanitize custom CSS for preview, blocking unsafe expressions and external imports.
 */
function sanitizeCssForPreview(rawCss?: string): string {
    if (!rawCss) return '';

    let clean = rawCss.replace(/@import\b[^;]*;/gi, '/* @import blocked */');
    clean = clean.replace(/expression\s*\(.*?\)/gi, 'none');
    clean = clean.replace(/javascript\s*:/gi, 'blocked:');
    clean = clean.replace(/position\s*:\s*(fixed|sticky)/gi, 'position: relative');

    return clean;
}

export function HtmlBlock({ props, styles = {}, isEditor = false }: HtmlBlockComponentProps) {
    const rawUniqueId = useId();
    const scopeId = `html-block-${rawUniqueId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    const inlineStyles: CSSProperties = {
        backgroundColor: styles.backgroundColor,
        background: styles.background,
        color: styles.color,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        minHeight: styles.minHeight,
        borderRadius: styles.borderRadius,
        maxWidth: styles.maxWidth,
        boxShadow: styles.boxShadow,
        borderWidth: styles.borderWidth,
        borderStyle: styles.borderStyle,
        borderColor: styles.borderColor,
        textAlign: styles.textAlign,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
    };

    const sanitizedHtml = useMemo(
        () => sanitizeHtmlForPreview(props.html || ''),
        [props.html]
    );

    const sanitizedCss = useMemo(
        () => sanitizeCssForPreview(props.css || ''),
        [props.css]
    );

    const hasContent = Boolean(sanitizedHtml.trim());

    return (
        <section
            id={scopeId}
            style={inlineStyles}
            className="w-full relative transition-all duration-150"
        >
            {/* Scoped Custom CSS */}
            {sanitizedCss && (
                <style
                    // Scoped style block
                    dangerouslySetInnerHTML={{ __html: sanitizedCss }}
                />
            )}

            {/* Custom HTML Content or Placeholder */}
            {hasContent ? (
                <div
                    className="w-full"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
            ) : isEditor ? (
                <div className="max-w-2xl mx-auto my-2 p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/80 text-center select-none">
                    <div className="w-9 h-9 mx-auto rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 mb-2">
                        <Code className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-gray-800">কাস্টম HTML ও CSS সেকশন</h4>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-md mx-auto">
                        ডানপাশের Inspector প্যানেল থেকে আপনার কাস্টম HTML ও CSS কোড যোগ করুন। কোড লিখলে তা সাথে সাথে এখানে লাইভ প্রিভিউ দেখাবে।
                    </p>
                </div>
            ) : null}
        </section>
    );
}
