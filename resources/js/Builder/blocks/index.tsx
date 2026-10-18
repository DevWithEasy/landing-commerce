import type {
    BenefitsGridBlockProps,
    Block,
    BlockProps,
    BlockStyles,
    CodCheckoutBlockProps,
    CountdownTimerBlockProps,
    FaqBlockProps,
    HeroBlockProps,
    HtmlBlockProps,
    ProductSelectorBlockProps,
    ReviewsBlockProps,
    StickyBarBlockProps,
    VideoBlockProps,
} from '@/types/builder';

import { BenefitsGridBlock } from './BenefitsGridBlock';
import { CodCheckoutBlock } from './CodCheckoutBlock';
import { CountdownTimerBlock } from './CountdownTimerBlock';
import { FaqBlock } from './FaqBlock';
import { HeroBlock } from './HeroBlock';
import { HtmlBlock } from './HtmlBlock';
import { ProductSelectorBlock } from './ProductSelectorBlock';
import { ReviewsBlock } from './ReviewsBlock';
import { StickyBarBlock } from './StickyBarBlock';
import { VideoBlock } from './VideoBlock';

export interface BlockComponentProps<T = BlockProps> {
    props: T;
    styles?: BlockStyles;
    isEditor?: boolean;
}

/**
 * Registry mapping block types to their React component implementations.
 */
export const BLOCK_COMPONENTS = {
    HeroBlock,
    ProductSelectorBlock,
    CodCheckoutBlock,
    BenefitsGridBlock,
    ReviewsBlock,
    VideoBlock,
    FaqBlock,
    CountdownTimerBlock,
    StickyBarBlock,
    HtmlBlock,
} as const;

/**
 * Render a block from its AST node.
 */
export function renderAstBlock(block: Block, isEditor = false) {
    switch (block.type) {
        case 'HeroBlock':
            return (
                <HeroBlock
                    key={block.id}
                    props={block.props as unknown as HeroBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'ProductSelectorBlock':
            return (
                <ProductSelectorBlock
                    key={block.id}
                    props={block.props as unknown as ProductSelectorBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'CodCheckoutBlock':
            return (
                <CodCheckoutBlock
                    key={block.id}
                    props={block.props as unknown as CodCheckoutBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'BenefitsGridBlock':
            return (
                <BenefitsGridBlock
                    key={block.id}
                    props={block.props as unknown as BenefitsGridBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'ReviewsBlock':
            return (
                <ReviewsBlock
                    key={block.id}
                    props={block.props as unknown as ReviewsBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'VideoBlock':
            return (
                <VideoBlock
                    key={block.id}
                    props={block.props as unknown as VideoBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'FaqBlock':
            return (
                <FaqBlock
                    key={block.id}
                    props={block.props as unknown as FaqBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'CountdownTimerBlock':
            return (
                <CountdownTimerBlock
                    key={block.id}
                    props={block.props as unknown as CountdownTimerBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'StickyBarBlock':
            return (
                <StickyBarBlock
                    key={block.id}
                    props={block.props as unknown as StickyBarBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'HtmlBlock':
            return (
                <HtmlBlock
                    key={block.id}
                    props={block.props as unknown as HtmlBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        default:
            return null;
    }
}

export {
    HeroBlock,
    ProductSelectorBlock,
    CodCheckoutBlock,
    BenefitsGridBlock,
    ReviewsBlock,
    VideoBlock,
    FaqBlock,
    CountdownTimerBlock,
    StickyBarBlock,
    HtmlBlock,
};
