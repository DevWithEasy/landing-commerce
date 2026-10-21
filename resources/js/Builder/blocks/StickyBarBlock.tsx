import { ArrowRight, ShoppingCart } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { BlockStyles, StickyBarBlockProps } from '@/types/builder';

export interface StickyBarBlockComponentProps {
    props: StickyBarBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function StickyBarBlock({
    props,
    styles = {},
    isEditor = false,
}: StickyBarBlockComponentProps) {
    const isTop = props.placement === 'top';

    const inlineStyles: CSSProperties = {
        backgroundColor: styles.backgroundColor || (styles.background ? 'transparent' : '#0f172a'),
        background: styles.background,
        color: styles.color || '#ffffff',
        zIndex: styles.zIndex ? Math.min(Number(styles.zIndex), 50) : 40,
        boxShadow: styles.boxShadow,
        minHeight: styles.minHeight,
    };

    const buttonCustomStyle: CSSProperties = {
        backgroundColor: styles.buttonBgColor || undefined,
        color: styles.buttonTextColor || undefined,
    };
    const buttonPulseClass = styles.buttonPulseAnimation ? 'animate-pulse' : '';

    return (
        <aside
            style={inlineStyles}
            className={`${
                isEditor ? 'relative' : `fixed ${isTop ? 'top-0' : 'bottom-0'} left-0 right-0`
            } w-full py-3 px-4 shadow-2xl border-t border-slate-800 transition-all`}
        >
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                <div className="flex-1 truncate">
                    <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate block">
                        {props.message || 'Special Promotion - Cash on Delivery Available!'}
                    </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                    {isEditor ? (
                        <button
                            type="button"
                            style={buttonCustomStyle}
                            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-primary-600 hover:bg-primary-700 shadow-md cursor-pointer ${buttonPulseClass}`}
                        >
                            <ShoppingCart className="w-4 h-4 mr-1.5" />
                            <span>{props.buttonText || 'Order Now'}</span>
                        </button>
                    ) : (
                        <a
                            href={props.buttonTarget || '#cod-checkout'}
                            style={buttonCustomStyle}
                            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-primary-600 hover:bg-primary-700 shadow-md transform hover:-translate-y-0.5 transition-transform ${buttonPulseClass}`}
                        >
                            <ShoppingCart className="w-4 h-4 mr-1.5" />
                            <span>{props.buttonText || 'Order Now'}</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </a>
                    )}
                </div>
            </div>
        </aside>
    );
}
