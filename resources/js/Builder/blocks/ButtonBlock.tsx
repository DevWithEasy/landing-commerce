import type { CSSProperties } from 'react';
import type { BlockStyles, ButtonBlockProps } from '@/types/builder';

export interface ButtonBlockComponentProps {
    props: ButtonBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function ButtonBlock({ props, styles = {} }: ButtonBlockComponentProps) {
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-8 py-3 text-lg font-semibold',
        xl: 'px-10 py-4 text-xl font-bold',
    }[props.size || 'lg'];

    const containerAlign = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
    }[props.align || 'center'] || 'justify-center';

    const widthClass = props.width === 'full' ? 'w-full text-center' : 'inline-flex';

    const btnStyle: CSSProperties = {
        backgroundColor: props.backgroundColor || styles.buttonBgColor || '#16a34a',
        color: props.textColor || styles.buttonTextColor || '#ffffff',
        borderRadius: props.borderRadius || styles.buttonBorderRadius || '12px',
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        minHeight: styles.minHeight,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
    };

    return (
        <div className={`lc-button-wrapper flex ${containerAlign} my-2 w-full`}>
            <span
                style={btnStyle}
                className={`lc-button ${sizeClasses} ${widthClass} items-center justify-center font-bold shadow-md select-none transition-all duration-200 ${
                    props.pulseAnimation ? 'animate-pulse' : ''
                }`}
            >
                {props.text || 'Order Now — Cash on Delivery'}
            </span>
        </div>
    );
}
