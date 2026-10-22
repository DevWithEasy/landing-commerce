import type {
    AccordionBlockProps,
    BenefitsGridBlockProps,
    Block,
    BlockProps,
    BlockStyles,
    ButtonBlockProps,
    CodCheckoutBlockProps,
    ContainerBlockProps,
    CountdownTimerBlockProps,
    FaqBlockProps,
    GridBlockProps,
    HeadingBlockProps,
    HeroBlockProps,
    HtmlBlockProps,
    IconListBlockProps,
    ImageBlockProps,
    ImageCarouselBlockProps,
    ProductSelectorBlockProps,
    ReviewsBlockProps,
    StickyBarBlockProps,
    TestimonialBlockProps,
    TextBlockProps,
    VideoBlockProps,
} from '@/types/builder';

import { AccordionBlock } from './AccordionBlock';
import { BenefitsGridBlock } from './BenefitsGridBlock';
import { ButtonBlock } from './ButtonBlock';
import { CodCheckoutBlock } from './CodCheckoutBlock';
import { ContainerBlock } from './ContainerBlock';
import { CountdownTimerBlock } from './CountdownTimerBlock';
import { FaqBlock } from './FaqBlock';
import { GridBlock } from './GridBlock';
import { HeadingBlock } from './HeadingBlock';
import { HeroBlock } from './HeroBlock';
import { HtmlBlock } from './HtmlBlock';
import { IconListBlock } from './IconListBlock';
import { ImageBlock } from './ImageBlock';
import { ImageCarouselBlock } from './ImageCarouselBlock';
import { ProductSelectorBlock } from './ProductSelectorBlock';
import { ReviewsBlock } from './ReviewsBlock';
import { StickyBarBlock } from './StickyBarBlock';
import { TestimonialBlock } from './TestimonialBlock';
import { TextBlock } from './TextBlock';
import { VideoBlock } from './VideoBlock';

export interface BlockComponentProps<T = BlockProps> {
    props: T;
    styles?: BlockStyles;
    children?: Block[];
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
    AccordionBlock,
    CountdownTimerBlock,
    StickyBarBlock,
    HtmlBlock,
    ContainerBlock,
    GridBlock,
    HeadingBlock,
    TextBlock,
    ImageBlock,
    ButtonBlock,
    IconListBlock,
    ImageCarouselBlock,
    TestimonialBlock,
} as const;

/**
 * Render a block from its AST node.
 */
export function renderAstBlock(
    block: Block,
    isEditor = false,
    renderChildren?: (children: Block[]) => React.ReactNode,
    onAddChild?: () => void
) {
    switch (block.type) {
        case 'ContainerBlock':
            return (
                <ContainerBlock
                    key={block.id}
                    props={block.props as unknown as ContainerBlockProps}
                    styles={block.styles}
                    children={block.children}
                    renderChildren={
                        renderChildren ||
                        ((ch) => ch.map((c) => renderAstBlock(c, isEditor, renderChildren, onAddChild)))
                    }
                    isEditor={isEditor}
                    onAddChild={onAddChild}
                />
            );
        case 'GridBlock':
            return (
                <GridBlock
                    key={block.id}
                    props={block.props as unknown as GridBlockProps}
                    styles={block.styles}
                    children={block.children}
                    renderChildren={
                        renderChildren ||
                        ((ch) => ch.map((c) => renderAstBlock(c, isEditor, renderChildren, onAddChild)))
                    }
                    isEditor={isEditor}
                    onAddChild={onAddChild}
                />
            );
        case 'HeadingBlock':
            return (
                <HeadingBlock
                    key={block.id}
                    props={block.props as unknown as HeadingBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'TextBlock':
            return (
                <TextBlock
                    key={block.id}
                    props={block.props as unknown as TextBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'ImageBlock':
            return (
                <ImageBlock
                    key={block.id}
                    props={block.props as unknown as ImageBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'ButtonBlock':
            return (
                <ButtonBlock
                    key={block.id}
                    props={block.props as unknown as ButtonBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
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
        case 'TestimonialBlock':
            return (
                <TestimonialBlock
                    key={block.id}
                    props={block.props as unknown as TestimonialBlockProps}
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
        case 'AccordionBlock':
            return (
                <AccordionBlock
                    key={block.id}
                    props={block.props as unknown as AccordionBlockProps}
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
        case 'IconListBlock':
            return (
                <IconListBlock
                    key={block.id}
                    props={block.props as unknown as IconListBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        case 'ImageCarouselBlock':
            return (
                <ImageCarouselBlock
                    key={block.id}
                    props={block.props as unknown as ImageCarouselBlockProps}
                    styles={block.styles}
                    isEditor={isEditor}
                />
            );
        default:
            return null;
    }
}

export {
    AccordionBlock,
    BenefitsGridBlock,
    ButtonBlock,
    CodCheckoutBlock,
    ContainerBlock,
    CountdownTimerBlock,
    FaqBlock,
    HeadingBlock,
    HeroBlock,
    HtmlBlock,
    IconListBlock,
    ImageBlock,
    ImageCarouselBlock,
    GridBlock,
    ProductSelectorBlock,
    ReviewsBlock,
    StickyBarBlock,
    TestimonialBlock,
    TextBlock,
    VideoBlock,
};

