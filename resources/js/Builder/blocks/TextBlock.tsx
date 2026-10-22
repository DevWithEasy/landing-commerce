import type { CSSProperties } from 'react';
import type { BlockStyles, TextBlockProps } from '@/types/builder';

export interface TextBlockComponentProps {
    props: TextBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function TextBlock({ props, styles = {} }: TextBlockComponentProps) {
    const inlineStyles: CSSProperties = {
        color: props.color || styles.color,
        fontSize: props.fontSize || styles.fontSize,
        lineHeight: props.lineHeight || styles.lineHeight || '1.6',
        textAlign: props.align || styles.textAlign || 'left',
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom || '16px',
        minHeight: styles.minHeight,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        backgroundColor: styles.backgroundColor,
        borderRadius: styles.borderRadius,
    };

    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
        justify: 'text-justify',
    }[props.align || 'left'] || 'text-left';

    return (
        <div
            style={inlineStyles}
            data-lc-el="text"
            className={`lc-text text-base ${alignClass} whitespace-pre-line break-words w-full`}
        >
            {props.content || 'Write your paragraph or product description here.'}
        </div>
    );
}
