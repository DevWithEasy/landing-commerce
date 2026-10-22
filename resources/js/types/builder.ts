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
    | 'AccordionBlock'
    | 'CountdownTimerBlock'
    | 'StickyBarBlock'
    | 'HtmlBlock'
    | 'ContainerBlock'
    | 'GridBlock'
    | 'HeadingBlock'
    | 'TextBlock'
    | 'ImageBlock'
    | 'ButtonBlock'
    | 'IconListBlock'
    | 'ImageCarouselBlock'
    | 'TestimonialBlock';

export interface BlockStyles {
    color?: string;
    backgroundColor?: string;
    background?: string;
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
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    maxWidth?: string;
    minHeight?: string;
    borderColor?: string;
    borderWidth?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
    boxShadow?: string;
    zIndex?: number;
    position?: 'relative' | 'static' | 'fixed' | 'sticky';
    buttonBgColor?: string;
    buttonTextColor?: string;
    buttonBorderRadius?: string;
    buttonPulseAnimation?: boolean;
}

export interface HeroBlockProps {
    headline: string;
    subheadline?: string;
    badgeText?: string;
    ctaText: string;
    ctaTarget: string; // URL, tel:, or #anchor
    imageUrl?: string;
    imagePosition?: 'right' | 'left' | 'background';
    // Element-level design properties
    headlineColor?: string;
    headlineFontSize?: string;
    headlineFontWeight?: string;
    headlineLineHeight?: string;
    headlineAlign?: 'left' | 'center' | 'right';
    subheadlineColor?: string;
    subheadlineFontSize?: string;
    subheadlineFontWeight?: string;
    badgeTextColor?: string;
    badgeBgColor?: string;
    badgeBorderRadius?: string;
    buttonSize?: 'sm' | 'md' | 'lg' | 'xl';
    buttonWidth?: 'auto' | 'full';
    buttonBgColor?: string;
    buttonTextColor?: string;
    buttonBorderRadius?: string;
    buttonPulseAnimation?: boolean;
}

export interface HtmlBlockProps {
    html: string;
    css?: string;
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
    productBadges?: Record<string | number, string>;
    orderButtonText?: string;
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
    productBadges?: Record<string | number, string>;
    variantSelectionType?: 'swatches' | 'dropdown' | 'radio';
    showQuantity?: boolean;
    buttonText?: string;
    nameLabel?: string;
    namePlaceholder?: string;
    phoneLabel?: string;
    phonePlaceholder?: string;
    addressLabel?: string;
    addressPlaceholder?: string;
    shippingLabel?: string;
    highlightColor?: string;

    // ---------------------------------------------------------------------
    // Content visibility & copy
    // ---------------------------------------------------------------------
    showHeader?: boolean;
    showHeaderBadge?: boolean;
    showHeaderTitle?: boolean;
    showHeaderSubtitle?: boolean;
    headerBadgeText?: string;
    headerTitle?: string;
    headerSubtitle?: string;
    headerAlign?: 'left' | 'center' | 'right';
    showProductSelector?: boolean;
    showVariants?: boolean;
    showSummary?: boolean;
    showTrustBadges?: boolean;
    showRequiredMark?: boolean;
    trustText1?: string;
    trustText2?: string;

    // ---------------------------------------------------------------------
    // Typography & layout
    // ---------------------------------------------------------------------
    fontFamily?: string;
    accentColor?: string;
    containerMaxWidth?: string;
    containerPaddingX?: string;
    fieldGap?: string;

    // Header design
    headerPaddingTop?: string;
    headerPaddingBottom?: string;
    headerBorderColor?: string;
    headerBorderWidth?: string;
    bodyPaddingTop?: string;
    badgeBgColor?: string;
    badgeTextColor?: string;
    badgeBorderRadius?: string;
    badgeFontSize?: string;
    badgeFontWeight?: string;
    badgePaddingX?: string;
    badgePaddingY?: string;
    titleColor?: string;
    titleFontSize?: string;
    titleFontWeight?: string;
    titleLineHeight?: string;
    titleLetterSpacing?: string;
    titleMarginBottom?: string;
    subtitleColor?: string;
    subtitleFontSize?: string;
    subtitleLineHeight?: string;
    subtitleLetterSpacing?: string;

    // Card design
    cardBgColor?: string;
    cardBorderColor?: string;
    cardBorderWidth?: string;
    cardBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
    cardBorderRadius?: string;
    cardMinHeight?: string;
    cardPaddingTop?: string;
    cardPaddingBottom?: string;
    cardPaddingLeft?: string;
    cardPaddingRight?: string;
    cardShadow?: string;

    // Labels
    labelColor?: string;
    labelFontSize?: string;
    labelFontWeight?: string;
    labelLineHeight?: string;
    labelLetterSpacing?: string;
    labelTextTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    labelMarginBottom?: string;
    requiredMarkColor?: string;

    // Inputs
    inputBgColor?: string;
    inputTextColor?: string;
    inputBorderColor?: string;
    inputBorderWidth?: string;
    inputBorderRadius?: string;
    inputPaddingX?: string;
    inputPaddingY?: string;
    inputFontSize?: string;
    inputFontWeight?: string;
    inputMinHeight?: string;
    inputIconColor?: string;
    inputPlaceholderColor?: string;
    inputFocusColor?: string;
    inputFocusRingColor?: string;
    inputFocusRingWidth?: string;

    // Product cards
    productPanelBgColor?: string;
    productPanelBorderColor?: string;
    productPanelBorderRadius?: string;
    productPanelPadding?: string;
    productPanelTitleColor?: string;
    productCardBgColor?: string;
    productCardSelectedBgColor?: string;
    productCardBorderColor?: string;
    productCardSelectedBorderColor?: string;
    productCardBorderWidth?: string;
    productCardSelectedBorderWidth?: string;
    productCardBorderRadius?: string;
    productCardPadding?: string;
    productCardGap?: string;
    productTitleColor?: string;
    productTitleFontSize?: string;
    productTitleFontWeight?: string;
    productPriceColor?: string;
    productPriceFontSize?: string;
    productOldPriceColor?: string;
    productInfoTextColor?: string;
    productInfoFontSize?: string;
    productImageSize?: string;
    productImageRadius?: string;
    productImageFit?: 'cover' | 'contain';
    productBadgeBgColor?: string;
    productBadgeTextColor?: string;
    productBadgeBorderRadius?: string;
    productBadgeFontSize?: string;
    variantBgColor?: string;
    variantTextColor?: string;
    variantBorderColor?: string;
    variantSelectedBgColor?: string;
    variantSelectedTextColor?: string;
    variantSelectedBorderColor?: string;
    variantBorderRadius?: string;
    variantFontSize?: string;

    // Shipping select
    shippingBgColor?: string;
    shippingTextColor?: string;
    shippingBorderColor?: string;
    shippingBorderWidth?: string;
    shippingBorderRadius?: string;
    shippingPadding?: string;
    shippingFontSize?: string;
    shippingFontWeight?: string;

    // Summary
    summaryBgColor?: string;
    summaryBorderColor?: string;
    summaryBorderWidth?: string;
    summaryBorderRadius?: string;
    summaryPadding?: string;
    summaryRowGap?: string;
    summaryTextColor?: string;
    summaryValueColor?: string;
    summaryTotalColor?: string;
    summaryTotalFontSize?: string;
    summaryFontSize?: string;

    // Submit button
    buttonBgColor?: string;
    buttonTextColor?: string;
    buttonHoverBgColor?: string;
    buttonBorderWidth?: string;
    buttonBorderColor?: string;
    buttonBorderRadius?: string;
    buttonMinHeight?: string;
    buttonPaddingY?: string;
    buttonPaddingX?: string;
    buttonFontSize?: string;
    buttonFontWeight?: string;
    buttonShadow?: string;
    buttonWidth?: 'full' | 'auto';
    buttonTextTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    buttonLetterSpacing?: string;

    // Trust row
    trustTextColor?: string;
    trustFontSize?: string;
    trustFontWeight?: string;
    trustIconColor?: string;
    trustIconSize?: string;
    trustGap?: string;
    trustPaddingTop?: string;
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
    starColor?: string;
    starEmptyColor?: string;
    starSize?: string;
    starStyle?: 'filled' | 'outline';
    showStars?: boolean;
    showRatingSummary?: boolean;
    ratingSummaryText?: string;
    ratingSummaryColor?: string;
}

export interface TestimonialItem {
    id: string;
    quote: string;
    authorName: string;
    authorRole?: string;
    location?: string;
    rating?: number;
    avatarUrl?: string;
    verifiedPurchase?: boolean;
}

export interface TestimonialBlockProps {
    /**
     * Multi-testimonial carousel items. Legacy single-testimonial props below
     * remain supported so previously published AST revisions keep rendering.
     */
    items?: TestimonialItem[];
    quote?: string;
    authorName?: string;
    authorRole?: string;
    location?: string;
    rating?: number;
    avatarUrl?: string;
    verifiedPurchase?: boolean;
    showQuoteIcon?: boolean;
    showRating?: boolean;
    layout?: 'card' | 'minimal';
    accentColor?: string;
    cardBgColor?: string;
    quoteColor?: string;
    authorColor?: string;
    quoteFontSize?: string;
    avatarSize?: string;
    cardRadius?: string;
    cardPadding?: string;
    autoplay?: boolean;
    autoplayInterval?: number;
    showArrows?: boolean;
    showDots?: boolean;
    loop?: boolean;
    starColor?: string;
    starSize?: string;
    starStyle?: 'filled' | 'outline';
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

export interface AccordionItem {
    id: string;
    title: string;
    content: string;
}

export interface AccordionBlockProps {
    title?: string;
    items: AccordionItem[];
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

export interface ContainerBlockProps {
    direction?: 'column' | 'row';
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    justifyContent?:
        'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
    gap?: string;
}

export interface GridBlockProps {
    columns?: number;
    tabletColumns?: number;
    mobileColumns?: number;
    columnGap?: string;
    rowGap?: string;
    alignItems?: 'stretch' | 'start' | 'center' | 'end';
    justifyItems?: 'stretch' | 'start' | 'center' | 'end';
}

export interface HeadingBlockProps {
    text: string;
    tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    align?: 'left' | 'center' | 'right';
    color?: string;
    fontSize?: string;
    fontWeight?: string;
}

export interface TextBlockProps {
    content: string;
    align?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    fontSize?: string;
    lineHeight?: string;
}

export interface ImageBlockProps {
    imageUrl: string;
    altText?: string;
    caption?: string;
    aspectRatio?: string;
    linkUrl?: string;
    align?: 'left' | 'center' | 'right';
}

export interface ButtonBlockProps {
    text: string;
    target?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    width?: 'auto' | 'full';
    align?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    pulseAnimation?: boolean;
}

export interface IconListItem {
    id: string;
    text: string;
}

export interface IconListBlockProps {
    title?: string;
    listType?: 'ul' | 'ol';
    showMarkers?: boolean;
    items: IconListItem[];
    showDividers?: boolean;
    itemSpacing?: number;
}

export interface ImageCarouselItem {
    id: string;
    imageUrl: string;
    altText?: string;
}

export interface ImageCarouselBlockProps {
    title?: string;
    images: ImageCarouselItem[];
    desktopItemsPerView?: number;
    mobileItemsPerView?: number;
    gap?: string;
    aspectRatio?: '1 / 1' | '4 / 3' | '16 / 9' | '3 / 4';
    imageFit?: 'cover' | 'contain';
    showArrows?: boolean;
    showDots?: boolean;
    autoplay?: boolean;
    autoplayInterval?: number;
    loop?: boolean;
}

export type BlockProps =
    | HeroBlockProps
    | ProductSelectorBlockProps
    | CodCheckoutBlockProps
    | BenefitsGridBlockProps
    | ReviewsBlockProps
    | VideoBlockProps
    | FaqBlockProps
    | AccordionBlockProps
    | CountdownTimerBlockProps
    | StickyBarBlockProps
    | HtmlBlockProps
    | ContainerBlockProps
    | GridBlockProps
    | HeadingBlockProps
    | TextBlockProps
    | ImageBlockProps
    | ButtonBlockProps
    | IconListBlockProps
    | ImageCarouselBlockProps
    | TestimonialBlockProps
    | Record<string, unknown>;

export interface Block<TProps = BlockProps> {
    id: string;
    type: BlockType;
    props: TProps;
    styles: BlockStyles;
    children?: Block[];
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

export interface BuilderAiConfig {
    configured: boolean;
    enabled: boolean;
    model: string | null;
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
    ai: BuilderAiConfig;
}
