import type { CSSProperties, JSX } from 'react';
import type { BlockStyles, HeadingBlockProps } from '@/types/builder';

export interface HeadingBlockComponentProps {
    props: HeadingBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function HeadingBlock({ props, styles = {} }: HeadingBlockComponentProps) {
    const allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
    type ValidTag = (typeof allowedTags)[number];
    const rawTag = (props.tag?.toLowerCase() || 'h2') as ValidTag;
    const Tag: keyof JSX.IntrinsicElements = allowedTags.includes(rawTag) ? rawTag : 'h2';

    const inlineStyles: CSSProperties = {
        color: props.color || styles.color,
        fontSize: props.fontSize || styles.fontSize,
        fontWeight: props.fontWeight || styles.fontWeight,
        textAlign: props.align || styles.textAlign || 'left',
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom || '12px',
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
    }[props.align || 'left'] || 'text-left';

    return (
        <Tag
            style={inlineStyles}
            data-lc-el="title"
            className={`lc-heading font-bold tracking-tight ${alignClass} break-words w-full`}
        >
            {props.text || 'Heading Title'}
        </Tag>
    );
}
