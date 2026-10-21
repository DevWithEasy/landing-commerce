import type { CSSProperties } from 'react';
import type { BlockStyles, IconListBlockProps } from '@/types/builder';

export interface IconListBlockComponentProps {
    props: IconListBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function IconListBlock({ props, styles = {} }: IconListBlockComponentProps) {
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

    const items = Array.isArray(props.items) ? props.items : [];
    const showDividers = props.showDividers !== false;
    const listType = props.listType === 'ol' ? 'ol' : 'ul';
    const showMarkers = props.showMarkers !== false;
    const rawItemSpacing = Number(props.itemSpacing);
    const itemSpacing = Number.isFinite(rawItemSpacing)
        ? Math.min(48, Math.max(0, rawItemSpacing))
        : 12;
    const ListTag = listType;

    return (
        <section style={inlineStyles} className="w-full bg-white py-12">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                {props.title && (
                    <h2 className="mb-8 text-center text-2xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-3xl">
                        {props.title}
                    </h2>
                )}

                {items.length > 0 ? (
                    <ListTag
                        className="flex list-none flex-col pl-0"
                        style={{ rowGap: `${itemSpacing}px` }}
                    >
                        {items.map((item, index) => (
                            <li
                                key={item.id}
                                className={`rounded-2xl bg-slate-50/80 px-4 py-3.5 sm:px-5 ${
                                    showDividers
                                        ? 'border border-slate-100'
                                        : 'border border-transparent'
                                }`}
                            >
                                <div className="flex items-start gap-1.5">
                                    {showMarkers && (
                                        <span
                                            className="mt-0.5 shrink-0 text-sm font-bold leading-relaxed text-slate-500"
                                            aria-hidden="true"
                                        >
                                            {listType === 'ol' ? `${index + 1}.` : '•'}
                                        </span>
                                    )}
                                    <strong className="flex-1 text-sm font-bold leading-relaxed text-slate-800 sm:text-base">
                                        {item.text}
                                    </strong>
                                </div>
                            </li>
                        ))}
                    </ListTag>
                ) : (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm font-medium text-slate-400">
                        Add list items from the properties panel.
                    </div>
                )}
            </div>
        </section>
    );
}
