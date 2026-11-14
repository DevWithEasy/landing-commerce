import { ImageIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { BlockStyles, ImageBlockProps } from '@/types/builder';

export interface ImageBlockComponentProps {
    props: ImageBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function ImageBlock({ props, styles = {} }: ImageBlockComponentProps) {
    const inlineStyles: CSSProperties = {
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom || '8px',
        minHeight: styles.minHeight,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        maxWidth: styles.maxWidth || '100%',
        borderRadius: styles.borderRadius || '8px',
    };

    const alignClass = {
        left: 'justify-start text-left',
        center: 'justify-center text-center',
        right: 'justify-end text-right',
    }[props.align || 'center'] || 'justify-center text-center';

    return (
        <figure className={`lc-image flex flex-col ${alignClass} my-2 w-full max-w-7xl mx-auto px-4 @min-[640px]:px-6 @min-[1024px]:px-8 [.lc-container_&]:max-w-none [.lc-container_&]:px-0 [.lc-grid_&]:max-w-none [.lc-grid_&]:px-0`}>
            {props.imageUrl ? (
                <div className="inline-block max-w-full">
                    <img
                        src={props.imageUrl}
                        alt={props.altText || 'Showcase image'}
                        data-lc-el="image"
                        style={inlineStyles}
                        className="max-w-full h-auto object-contain rounded-lg shadow-xs"
                    />
                    {props.caption && (
                        <figcaption
                            data-lc-el="caption"
                            className="mt-1.5 text-xs text-gray-500"
                        >
                            {props.caption}
                        </figcaption>
                    )}
                </div>
            ) : (
                <div className="w-full min-h-[140px] bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-60" />
                    <span className="text-xs font-semibold text-slate-500">No image specified</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                        Configure image URL in the customizer panel
                    </span>
                </div>
            )}
        </figure>
    );
}
