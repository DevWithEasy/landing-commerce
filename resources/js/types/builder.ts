/**
 * TypeScript Abstract Syntax Tree (AST) Schema for Page Builder.
 *
 * Defines the strict, allowlisted block models, props, and styling dictionaries.
 * Stores zero raw merchant HTML or arbitrary JavaScript.
 */

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

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
    productId?: number;
    productIds?: number[];
    selectionMode?: 'single' | 'multiple';
    defaultSelection?: 'first' | 'all' | 'specific';
    defaultSelectedId?: number;
    showDescription?: boolean;
    showPrice?: boolean;
    showDiscountBadge?: boolean;
    badgeText?: string;
    displayMode?: 'grid' | 'carousel';
}

export interface CodCheckoutBlockProps {
    productId?: number;
    productIds?: number[];
    selectionMode?: 'single' | 'multiple';
    defaultSelection?: 'first' | 'all' | 'specific';
    defaultSelectedId?: number;
    showDiscountBadge?: boolean;
    badgeText?: string;
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

export interface BlockDefinition {
    type: BlockType;
    name: string;
    description: string;
    category: string;
    icon: string;
    defaultProps: Record<string, unknown>;
    defaultStyles: BlockStyles;
}

export interface LandingPageRevisionSummary {
    id: number;
    landing_page_id: number;
    revision_number: number;
    ast_content?: PageAst;
    created_by: string | null;
    created_at: string;
}

export interface LandingPageData {
    id: number;
    product_id: number | null;
    title: string;
    slug: string;
    is_default: boolean;
    status: 'draft' | 'published' | 'archived';
    meta_seo?: Record<string, unknown> | null;
    published_revision_id?: number | null;
    created_at: string;
    updated_at: string;
    product?: {
        id: number;
        title: string;
        slug: string;
        regular_price: string | number;
        sale_price: string | number | null;
    } | null;
    revisions_count?: number;
    revisions?: LandingPageRevisionSummary[];
}

export interface BuilderEditorProps {
    landingPage: LandingPageData;
    initialAst: PageAst;
    blockDefinitions: Record<BlockType, BlockDefinition>;
    products: Array<{
        id: number;
        title: string;
        slug: string;
        regular_price: string | number;
        sale_price: string | number | null;
    }>;
}
