import { LayoutGrid, Plus } from 'lucide-react';
import { useId, type CSSProperties, type ReactNode } from 'react';
import type { Block, BlockStyles, GridBlockProps } from '@/types/builder';

const UNSAFE_CSS_PATTERN =
    /(?:expression\s*\(|@import|url\s*\(|javascript\s*:|behavior\s*:|-moz-binding|[;{}<>\\])/i;

function safeCss(value?: string | number | null): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    const cssValue = String(value).trim();

    if (cssValue === '' || UNSAFE_CSS_PATTERN.test(cssValue)) {
        return undefined;
    }

    return cssValue;
}

function clampColumns(value: unknown, fallback: number): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(6, Math.max(1, Math.round(parsed)));
}

const ALIGN_ITEMS = new Set(['stretch', 'start', 'center', 'end']);
const JUSTIFY_ITEMS = new Set(['stretch', 'start', 'center', 'end']);

export interface GridBlockComponentProps {
    props: GridBlockProps;
    styles?: BlockStyles;
    children?: Block[];
    renderChildren?: (children: Block[]) => ReactNode;
    isEditor?: boolean;
    onAddChild?: () => void;
    dropRef?: (node: HTMLElement | null) => void;
}

export function GridBlock({
    props,
    styles = {},
    children = [],
    renderChildren,
    isEditor = false,
    onAddChild,
    dropRef,
}: GridBlockComponentProps) {
    const rawId = useId();
    const scope = `lc-grid-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const containerScope = `${scope}-container`;

    const columns = clampColumns(props.columns, 3);
    const tabletColumns = clampColumns(props.tabletColumns, Math.min(columns, 2));
    const mobileColumns = clampColumns(props.mobileColumns, 1);
    const columnGap = safeCss(props.columnGap) || '16px';
    const rowGap = safeCss(props.rowGap) || '16px';
    const alignItems = ALIGN_ITEMS.has(props.alignItems || '')
        ? (props.alignItems as string)
        : 'stretch';
    const justifyItems = JUSTIFY_ITEMS.has(props.justifyItems || '')
        ? (props.justifyItems as string)
        : 'stretch';

    const containerStyle: CSSProperties = {
        containerType: 'inline-size',
        width: '100%',
        backgroundColor: styles.backgroundColor,
        background: styles.background,
        paddingTop: styles.paddingTop || '16px',
        paddingBottom: styles.paddingBottom || '16px',
        paddingLeft: styles.paddingLeft || '16px',
        paddingRight: styles.paddingRight || '16px',
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        minHeight: styles.minHeight,
        borderRadius: styles.borderRadius,
        borderWidth: styles.borderWidth,
        borderStyle: styles.borderStyle,
        borderColor: styles.borderColor,
        boxShadow: styles.boxShadow,
        maxWidth: styles.maxWidth,
    };

    const gridStyle: CSSProperties = {
        columnGap,
        rowGap,
        alignItems,
        justifyItems,
    };

    const responsiveCss = `
.${scope} {
    display: grid;
    grid-template-columns: repeat(${columns}, minmax(0, 1fr));
}
@container (max-width: 1024px) {
    .${scope} {
        grid-template-columns: repeat(${tabletColumns}, minmax(0, 1fr));
    }
}
@container (max-width: 640px) {
    .${scope} {
        grid-template-columns: repeat(${mobileColumns}, minmax(0, 1fr));
    }
}
`;

    const hasChildren = children && children.length > 0;

    return (
        <div
            style={containerStyle}
            className={`${containerScope} lc-grid-container mx-auto w-full max-w-7xl transition-all`}
        >
            <style>{responsiveCss}</style>
            <div ref={dropRef} data-lc-el="grid" style={gridStyle} className={`${scope} lc-grid`}>
                {hasChildren && renderChildren ? (
                    renderChildren(children)
                ) : isEditor ? (
                    <div
                        onClick={(event) => {
                            if (onAddChild) {
                                event.stopPropagation();
                                onAddChild();
                            }
                        }}
                        className="flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary-300/80 bg-primary-50/40 p-6 text-center transition-colors hover:bg-primary-50/70 group"
                        style={{ gridColumn: '1 / -1' }}
                    >
                        <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-transform group-hover:scale-110">
                            <LayoutGrid className="h-4 w-4" />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-primary-900">
                            <Plus className="h-3.5 w-3.5" />
                            Grid is empty
                        </span>
                        <span className="mt-0.5 text-[11px] text-primary-600/80">
                            Drop widgets inside or click to add a child block
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
