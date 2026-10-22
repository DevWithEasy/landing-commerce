import { ChevronDown } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { AccordionBlockProps, BlockStyles } from '@/types/builder';

export interface AccordionBlockComponentProps {
    props: AccordionBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function AccordionBlock({ props, styles = {} }: AccordionBlockComponentProps) {
    const items = Array.isArray(props.items) ? props.items : [];
    const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

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

    const toggleItem = (id: string) => {
        setOpenId((previous) => (previous === id ? null : id));
    };

    return (
        <section style={inlineStyles} className="w-full bg-white py-12">
            <div className="mx-auto max-w-3xl px-4 @min-[640px]:px-6 @min-[1024px]:px-8">
                {props.title && (
                    <h2
                        data-lc-el="title"
                        className="mb-8 text-center text-2xl font-extrabold leading-snug tracking-tight text-slate-900 @min-[640px]:text-3xl"
                    >
                        {props.title}
                    </h2>
                )}

                {items.length > 0 ? (
                    <div className="space-y-3">
                        {items.map((item) => {
                            const isOpen = openId === item.id;

                            return (
                                <div
                                    key={item.id}
                                    data-lc-el="item"
                                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleItem(item.id)}
                                        aria-expanded={isOpen}
                                        data-lc-el="question"
                                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50 @min-[640px]:text-base"
                                    >
                                        <span>{item.title}</span>
                                        <ChevronDown
                                            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                                                isOpen ? 'rotate-180 text-primary-600' : ''
                                            }`}
                                        />
                                    </button>

                                    {isOpen && (
                                        <div
                                            data-lc-el="answer"
                                            className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-600"
                                        >
                                            {item.content}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm font-medium text-slate-400">
                        Add accordion items from the properties panel.
                    </div>
                )}
            </div>
        </section>
    );
}
