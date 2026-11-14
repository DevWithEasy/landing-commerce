import { ChevronDown, HelpCircle } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { BlockStyles, FaqBlockProps } from '@/types/builder';

export interface FaqBlockComponentProps {
    props: FaqBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function FaqBlock({ props, styles = {} }: FaqBlockComponentProps) {
    const [openId, setOpenId] = useState<string | null>(props.items?.[0]?.id || null);

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
        setOpenId((prev) => (prev === id ? null : id));
    };

    return (
        <section style={inlineStyles} className="w-full py-12">
            <div className="w-full max-w-7xl mx-auto px-4 @min-[640px]:px-6 @min-[1024px]:px-8 [.lc-container_&]:max-w-none [.lc-container_&]:px-0 [.lc-grid_&]:max-w-none [.lc-grid_&]:px-0">
                {props.title && (
                    <div className="text-center mb-8">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-3">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2
                            data-lc-el="title"
                            className="text-2xl @min-[640px]:text-3xl font-extrabold text-gray-900 tracking-tight"
                        >
                            {props.title}
                        </h2>
                    </div>
                )}

                <div className="space-y-3">
                    {props.items?.map((item) => {
                        const isOpen = openId === item.id;

                        return (
                            <div
                                key={item.id}
                                data-lc-el="item"
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs transition-all"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleItem(item.id)}
                                    data-lc-el="question"
                                    className="w-full px-5 py-4 text-left font-bold text-sm @min-[640px]:text-base text-gray-900 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <span>{item.question}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                                            isOpen ? 'rotate-180 text-primary-600' : ''
                                        }`}
                                    />
                                </button>

                                {isOpen && (
                                    <div
                                        data-lc-el="answer"
                                        className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100"
                                    >
                                        {item.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
