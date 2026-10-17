/**
 * TypeScript Abstract Syntax Tree (AST) Schema for Page Builder.
 *
 * Defines the strict, allowlisted block models, props, and styling dictionaries.
 * Stores zero raw merchant HTML or arbitrary JavaScript.
 */

export type BlockType =
    | 'HeroBlock'
    | 'ProductSelectorBlock'
    | 'CodCheckoutBlock'
    | 'BenefitsGridBlock'
    | 'ReviewsBlock'
    | 'VideoBlock'
    | 'FaqBlock'
    | 'CountdownTimerBlock'
    | 'StickyBarBlock';

export interface BlockStyles {
    color?: string;
    backgroundColor?: string;
    padding?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    margin?: string;
    marginTop?: string;
    marginBottom?: string;
    marginLeft?: string;
    marginRight?: string;
    borderRadius?: string;
    fontSize?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    maxWidth?: string;
    borderColor?: string;
    borderWidth?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
    zIndex?: number;
    position?: 'relative' | 'static' | 'fixed' | 'sticky';
}

export interface HeroBlockProps {
    headline: string;
    subheadline?: string;
    badgeText?: string;
    ctaText: string;
    ctaTarget: string; // URL, tel:, or #anchor
    imageUrl?: string;
    imagePosition?: 'right' | 'left' | 'background';
}

export interface ProductSelectorBlockProps {
    productId: number;
    showDescription?: boolean;
    showPrice?: boolean;
    displayMode?: 'grid' | 'carousel';
}

export interface CodCheckoutBlockProps {
    productId: number;
    variantSelectionType?: 'swatches' | 'dropdown' | 'radio';
    showQuantity?: boolean;
    buttonText?: string;
    highlightColor?: string;
}

export interface BenefitItem {
    id: string;
    icon?: string;
    title: string;
    description: string;
}

export interface BenefitsGridBlockProps {
    title?: string;
    columns?: 2 | 3 | 4;
    items: BenefitItem[];
}

export interface ReviewItem {
    id: string;
    authorName: string;
    location?: string;
    rating: number; // 1 to 5
    comment: string;
    verifiedPurchase?: boolean;
    avatarUrl?: string;
}

export interface ReviewsBlockProps {
    title?: string;
    layout?: 'grid' | 'carousel' | 'list';
    items: ReviewItem[];
}

export interface VideoBlockProps {
    videoUrl: string; // YouTube, Vimeo, or direct video URL
    aspectRatio?: '16:9' | '4:3' | '1:1';
    autoplay?: boolean;
    controls?: boolean;
}

export interface FaqItem {
    id: string;
    question: string;
    answer: string;
}

export interface FaqBlockProps {
    title?: string;
    items: FaqItem[];
}

export interface CountdownTimerBlockProps {
    targetDate: string; // ISO timestamp
    headline?: string;
    urgencyText?: string;
    expiryAction?: 'hide' | 'show_message';
    expiryMessage?: string;
}

export interface StickyBarBlockProps {
    message: string;
    buttonText: string;
    buttonTarget: string; // #anchor or URL
    placement?: 'top' | 'bottom';
}

export type BlockProps =
    | HeroBlockProps
    | ProductSelectorBlockProps
    | CodCheckoutBlockProps
    | BenefitsGridBlockProps
    | ReviewsBlockProps
    | VideoBlockProps
    | FaqBlockProps
    | CountdownTimerBlockProps
    | StickyBarBlockProps
    | Record<string, unknown>;

export interface Block<TProps = BlockProps> {
    id: string;
    type: BlockType;
    props: TProps;
    styles: BlockStyles;
}

export interface PageSettings {
    primaryColor?: string;
    fontFamily?: string;
    containerMaxWidth?: string;
    backgroundColor?: string;
}

export interface PageAst {
    version: number;
    settings?: PageSettings;
    blocks: Block[];
}
