import { Box, Plus } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import type { Block, BlockStyles, ContainerBlockProps } from '@/types/builder';

export interface ContainerBlockComponentProps {
    props: ContainerBlockProps;
    styles?: BlockStyles;
    children?: Block[];
    renderChildren?: (children: Block[]) => ReactNode;
    isEditor?: boolean;
    onAddChild?: () => void;
}

export function ContainerBlock({
    props,
    styles = {},
    children = [],
    renderChildren,
    isEditor = false,
    onAddChild,
}: ContainerBlockComponentProps) {
    const inlineStyles: CSSProperties = {
        display: 'flex',
        flexDirection: props.direction || 'column',
        flexWrap: props.wrap || 'nowrap',
        justifyContent: props.justifyContent || 'flex-start',
        alignItems: props.alignItems || 'stretch',
        gap: props.gap || '16px',
        backgroundColor: styles.backgroundColor,
        paddingTop: styles.paddingTop || '24px',
        paddingBottom: styles.paddingBottom || '24px',
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

    const hasChildren = children && children.length > 0;

    return (
        <div
            style={inlineStyles}
            className="lc-container w-full max-w-7xl mx-auto transition-all relative"
        >
            {hasChildren && renderChildren ? (
                renderChildren(children)
            ) : isEditor ? (
                <div
                    onClick={(e) => {
                        if (onAddChild) {
                            e.stopPropagation();
                            onAddChild();
                        }
                    }}
                    className="w-full min-h-[100px] border-2 border-dashed border-primary-300/80 bg-primary-50/40 hover:bg-primary-50/70 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group"
                >
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                        <Box className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-primary-900 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        Container is empty
                    </span>
                    <span className="text-[11px] text-primary-600/80 mt-0.5">
                        Drop widgets inside or click to select this container
                    </span>
                </div>
            ) : null}
        </div>
    );
}
