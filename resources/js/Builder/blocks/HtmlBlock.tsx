import { Code } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useBuilderStore } from '../stores/useBuilderStore';
import type { BlockStyles, HtmlBlockProps, ViewportMode } from '@/types/builder';

/**
 * Virtual viewport heights used to resolve `vh` units inside the preview
 * iframe. The iframe height itself is driven by the rendered content, so
 * leaving `vh` untouched would make content using `100vh` grow every time the
 * height is measured. Converting to a fixed height keeps the preview stable.
 */
const PREVIEW_VIEWPORT_HEIGHTS: Record<ViewportMode, number> = {
    desktop: 900,
    tablet: 1024,
    mobile: 844,
};

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
    // Never allow the CSS payload to escape its <style> element.
    clean = clean.replace(/[<>]/g, '');

    return clean;
}

/**
 * Convert viewport-height units to a fixed pixel height for the preview iframe.
 * The published page keeps the original `vh` values; this only affects the
 * builder canvas so auto-height measurement cannot feed back into the layout.
 */
function resolveViewportHeightUnits(css: string, viewportHeight: number): string {
    if (!css) return css;

    return css.replace(/(\d*\.?\d+)(d|s|l)?vh\b/gi, (match, value: string) => {
        const numeric = Number.parseFloat(value);

        if (!Number.isFinite(numeric)) return match;

        return `${Math.round((numeric / 100) * viewportHeight)}px`;
    });
}

/**
 * Build a self-contained document for the preview iframe.
 *
 * Rendering custom HTML/CSS inside an iframe (instead of inline) is what makes
 * the responsive breakpoints behave like the published page: `@media` queries
 * are evaluated against the iframe width, which matches the selected builder
 * viewport (desktop / tablet / mobile) instead of the whole browser window.
 */
function buildPreviewDocument(html: string, css: string): string {
    return [
        '<!DOCTYPE html>',
        '<html>',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        '<style>',
        'html,body{margin:0;padding:0;background:transparent;overflow:hidden;}',
        '*,*::before,*::after{box-sizing:border-box;}',
        css,
        '</style>',
        '</head>',
        `<body>${html}</body>`,
        '</html>',
    ].join('');
}

export function HtmlBlock({ props, styles = {}, isEditor = false }: HtmlBlockComponentProps) {
    const rawUniqueId = useId();
    const scopeId = `html-block-${rawUniqueId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const viewport = useBuilderStore((state) => state.viewport);
    const frameRef = useRef<HTMLIFrameElement | null>(null);
    // Start tall enough to avoid a visible layout jump while the first
    // measurement runs; the iframe shrinks to the real content height on load.
    const [frameHeight, setFrameHeight] = useState(800);

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

    const sanitizedHtml = useMemo(() => sanitizeHtmlForPreview(props.html || ''), [props.html]);

    const sanitizedCss = useMemo(() => sanitizeCssForPreview(props.css || ''), [props.css]);

    const hasContent = Boolean(sanitizedHtml.trim());

    const previewDocument = useMemo(
        () =>
            buildPreviewDocument(
                sanitizedHtml,
                resolveViewportHeightUnits(
                    sanitizedCss,
                    PREVIEW_VIEWPORT_HEIGHTS[viewport] ?? PREVIEW_VIEWPORT_HEIGHTS.desktop
                )
            ),
        [sanitizedCss, sanitizedHtml, viewport]
    );

    const syncPreviewFrame = useCallback(() => {
        const frame = frameRef.current;
        const doc = frame?.contentDocument;

        if (!frame || !doc?.body) return;

        // Inherit the page typography so the preview matches published output.
        const source = frame.parentElement;
        if (source) {
            const computed = window.getComputedStyle(source);
            doc.body.style.fontFamily = computed.fontFamily;
            doc.body.style.fontSize = computed.fontSize;
            doc.body.style.fontWeight = computed.fontWeight;
            doc.body.style.color = computed.color;
            doc.body.style.textAlign = computed.textAlign;
        }

        const height = Math.max(
            doc.documentElement?.scrollHeight ?? 0,
            doc.body.scrollHeight ?? 0,
            doc.body.offsetHeight ?? 0
        );

        if (height > 0) {
            setFrameHeight((previous) => (Math.abs(previous - height) > 1 ? height : previous));
        }
    }, []);

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) return;

        let observer: ResizeObserver | null = null;

        const attach = () => {
            observer?.disconnect();
            syncPreviewFrame();

            const doc = frame.contentDocument;
            if (doc?.body && typeof ResizeObserver !== 'undefined') {
                observer = new ResizeObserver(() => syncPreviewFrame());
                observer.observe(doc.body);
                observer.observe(doc.documentElement);
            }
        };

        frame.addEventListener('load', attach);
        attach();

        return () => {
            frame.removeEventListener('load', attach);
            observer?.disconnect();
        };
    }, [previewDocument, syncPreviewFrame]);

    return (
        <section
            id={scopeId}
            style={inlineStyles}
            className="w-full relative transition-all duration-150"
        >
            {/* Custom HTML Content or Placeholder */}
            {hasContent ? (
                <iframe
                    ref={frameRef}
                    title="Custom HTML/CSS preview"
                    srcDoc={previewDocument}
                    sandbox="allow-same-origin"
                    referrerPolicy="no-referrer"
                    scrolling="no"
                    style={{
                        width: '100%',
                        height: `${frameHeight}px`,
                        border: 0,
                        display: 'block',
                        overflow: 'hidden',
                    }}
                />
            ) : isEditor ? (
                <div className="max-w-2xl mx-auto my-2 p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/80 text-center select-none">
                    <div className="w-9 h-9 mx-auto rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 mb-2">
                        <Code className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-gray-800">কাস্টম HTML ও CSS সেকশন</h4>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-md mx-auto">
                        ডানপাশের Inspector প্যানেল থেকে আপনার কাস্টম HTML ও CSS কোড যোগ করুন। কোড
                        লিখলে তা সাথে সাথে এখানে লাইভ প্রিভিউ দেখাবে।
                    </p>
                </div>
            ) : null}
        </section>
    );
}
