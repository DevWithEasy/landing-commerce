import {
    AlignLeft,
    Palette,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { PageSettingsInspector } from './PageSettingsInspector';
import { CodCheckoutDesignSettings } from './CodCheckoutDesignSettings';
import {
    BlockAdvancedForm,
    BlockStylesForm,
    ElementStylesPanel,
} from './inspector/StyleAndAdvancedForms';
import {
    CodCheckoutBlockInspector,
    ProductSelectorBlockInspector,
} from './inspector/CommerceInspectors';
import {
    AccordionBlockInspector,
    BenefitsGridBlockInspector,
    FaqBlockInspector,
    HeroBlockInspector,
    IconListBlockInspector,
    ImageCarouselBlockInspector,
    VideoBlockInspector,
} from './inspector/ContentAndMediaInspectors';
import {
    ButtonBlockInspector,
    ContainerBlockInspector,
    GridBlockInspector,
    HeadingBlockInspector,
    ImageBlockInspector,
    TextBlockInspector,
} from './inspector/LayoutAndBasicInspectors';
import {
    CountdownTimerBlockInspector,
    HtmlBlockInspector,
    ReviewsBlockInspector,
    StickyBarBlockInspector,
    TestimonialBlockInspector,
} from './inspector/SocialAndMarketingInspectors';
import { ResponsiveDeviceBar } from './controls';
import { findBlockInTree, useBuilderStore } from '../stores/useBuilderStore';
import {
    DEVICE_LABELS,
    resolveBlockStyles,
} from '../styleSystem';
import type {
    AccordionBlockProps,
    BenefitsGridBlockProps,
    Block,
    BlockDefinition,
    BlockStyles,
    BlockType,
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
    ViewportMode,
} from '@/types';

function applyStylePatch(
    target: Partial<BlockStyles>,
    updates: Partial<BlockStyles>
): void {
    const writable = target as Record<string, unknown>;

    Object.entries(updates).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
            delete writable[key];
            return;
        }

        writable[key] = value;
    });
}

export interface InspectorProps {
    blockDefinitions: Record<BlockType, BlockDefinition>;
    products: Array<{
        id: number;
        title: string;
        slug: string;
        regular_price: string | number;
        sale_price: string | number | null;
    }>;
    width?: number;
    embedded?: boolean;
}

export function Inspector({
    blockDefinitions,
    products,
    width,
    embedded = false,
}: InspectorProps) {
    const {
        ast,
        viewport,
        setViewport,
        selectedBlockId,
        setSelectedBlockId,
        updateBlockProps,
        setBlockStyles,
    } = useBuilderStore();

    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content');
    const [showPageSettings, setShowPageSettings] = useState(false);

    const selectedBlock = selectedBlockId ? findBlockInTree(ast.blocks, selectedBlockId) : null;

    if (!selectedBlock || showPageSettings) {
        return (
            <PageSettingsInspector
                width={width}
                hasSelectedBlock={!!selectedBlock}
                onBackToBlock={() => setShowPageSettings(false)}
                embedded={embedded}
            />
        );
    }

    const def = blockDefinitions[selectedBlock.type];
    const rawStyles = selectedBlock.styles || {};
    const styles = resolveBlockStyles(rawStyles, viewport);

    const handlePropChange = (key: string, value: unknown) => {
        updateBlockProps(selectedBlock.id, { [key]: value });
    };

    const writeStylePatch = (updates: Partial<BlockStyles>, element?: string) => {
        if (element) {
            const baseElement = rawStyles.elements?.[element] || {};
            const nextElement: Partial<BlockStyles> = { ...baseElement };

            if (viewport === 'desktop') {
                applyStylePatch(nextElement, updates);
            } else {
                const currentOverride = baseElement.responsive?.[viewport] ?? {};
                const nextOverride: Partial<BlockStyles> = { ...currentOverride };
                applyStylePatch(nextOverride, updates);

                const nextResponsive = { ...(baseElement.responsive || {}) };

                if (Object.keys(nextOverride).length > 0) {
                    nextResponsive[viewport] = nextOverride;
                } else {
                    delete nextResponsive[viewport];
                }

                nextElement.responsive = nextResponsive;
            }

            const nextElements = { ...(rawStyles.elements || {}) };

            if (Object.keys(nextElement).length > 0) {
                nextElements[element] = nextElement;
            } else {
                delete nextElements[element];
            }

            setBlockStyles(selectedBlock.id, {
                ...rawStyles,
                elements: nextElements,
            });
            return;
        }

        if (viewport === 'desktop') {
            const nextStyles: BlockStyles = { ...rawStyles };
            applyStylePatch(nextStyles, updates);
            setBlockStyles(selectedBlock.id, nextStyles);
            return;
        }

        const currentOverride = rawStyles.responsive?.[viewport] ?? {};
        const nextOverride: Partial<BlockStyles> = { ...currentOverride };
        applyStylePatch(nextOverride, updates);

        const nextResponsive = { ...(rawStyles.responsive || {}) };

        if (Object.keys(nextOverride).length > 0) {
            nextResponsive[viewport] = nextOverride;
        } else {
            delete nextResponsive[viewport];
        }

        setBlockStyles(selectedBlock.id, {
            ...rawStyles,
            responsive: nextResponsive,
        });
    };

    const handleStyleChange = (key: keyof BlockStyles, value: BlockStyles[keyof BlockStyles]) => {
        if (selectedBlock.type === 'CodCheckoutBlock' && viewport === 'desktop') {
            if (key === 'borderColor') {
                updateBlockProps(selectedBlock.id, { cardBorderColor: value });
            } else if (key === 'borderWidth') {
                updateBlockProps(selectedBlock.id, { cardBorderWidth: value });
            } else if (key === 'borderStyle') {
                updateBlockProps(selectedBlock.id, { cardBorderStyle: value });
            } else if (key === 'borderRadius') {
                updateBlockProps(selectedBlock.id, { cardBorderRadius: value });
            } else if (key === 'boxShadow') {
                updateBlockProps(selectedBlock.id, { cardShadow: value });
            }
        }
        writeStylePatch({ [key]: value } as Partial<BlockStyles>);
    };

    const handleBatchStyleChange = (updates: Partial<BlockStyles>) => {
        if (selectedBlock.type === 'CodCheckoutBlock' && viewport === 'desktop') {
            const propSync: Record<string, unknown> = {};
            if ('borderColor' in updates) propSync.cardBorderColor = updates.borderColor;
            if ('borderWidth' in updates) propSync.cardBorderWidth = updates.borderWidth;
            if ('borderStyle' in updates) propSync.cardBorderStyle = updates.borderStyle;
            if ('borderRadius' in updates) propSync.cardBorderRadius = updates.borderRadius;
            if ('boxShadow' in updates) propSync.cardShadow = updates.boxShadow;
            if (Object.keys(propSync).length > 0) {
                updateBlockProps(selectedBlock.id, propSync);
            }
        }
        writeStylePatch(updates);
    };

    const handleElementStyleChange = (
        element: string,
        key: keyof BlockStyles,
        value: BlockStyles[keyof BlockStyles]
    ) => {
        writeStylePatch({ [key]: value } as Partial<BlockStyles>, element);
    };

    const handleElementBatchStyleChange = (element: string, updates: Partial<BlockStyles>) => {
        writeStylePatch(updates, element);
    };

    const resetActiveDevice = () => {
        if (viewport === 'desktop') {
            return;
        }

        const nextResponsive = { ...(rawStyles.responsive || {}) };
        delete nextResponsive[viewport];

        setBlockStyles(selectedBlock.id, {
            ...rawStyles,
            responsive: nextResponsive,
        });
    };

    const Wrapper = embedded ? 'div' : 'aside';

    return (
        <Wrapper
            style={!embedded && width ? { width: `${width}px` } : undefined}
            className={
                embedded
                    ? 'flex-1 flex flex-col min-h-0 bg-white select-none overflow-hidden'
                    : 'w-80 sm:w-88 shrink-0 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-4rem)] select-none transition-[width] duration-75'
            }
        >
            {/* Inspector Header (shown only when standalone, not embedded in LeftSidebar) */}
            {!embedded && (
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
                    <div>
                        <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-gray-900 truncate max-w-[180px]">
                                {def?.name || selectedBlock.type}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                                #{selectedBlock.id.slice(-4)}
                            </span>
                        </div>
                        <span className="text-[11px] text-gray-500 block">
                            {def?.category || 'Block Properties'}
                        </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                        <button
                            type="button"
                            onClick={() => setShowPageSettings(true)}
                            className="px-2 py-1 rounded-md text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 flex items-center space-x-1 transition-colors"
                            title="Page Settings"
                        >
                            <Palette className="w-3.5 h-3.5" />
                            <span>Page Settings</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedBlockId(null)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/50"
                            title="Close Inspector"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Elementor-Style 3-Tab Header: Content | Style | Advanced */}
            <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50/80 shrink-0">
                <button
                    type="button"
                    onClick={() => setActiveTab('content')}
                    className={`py-2.5 text-[11px] font-bold border-b-2 flex flex-col items-center justify-center gap-1 transition ${
                        activeTab === 'content'
                            ? 'border-primary-600 bg-white text-primary-700'
                            : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                    }`}
                >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Content</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('style')}
                    className={`py-2.5 text-[11px] font-bold border-b-2 flex flex-col items-center justify-center gap-1 transition ${
                        activeTab === 'style'
                            ? 'border-primary-600 bg-white text-primary-700'
                            : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                    }`}
                >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Style</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('advanced')}
                    className={`py-2.5 text-[11px] font-bold border-b-2 flex flex-col items-center justify-center gap-1 transition ${
                        activeTab === 'advanced'
                            ? 'border-primary-600 bg-white text-primary-700'
                            : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                    }`}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Advanced</span>
                </button>
            </div>

            {/* Inspector Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {activeTab === 'content' && (
                    <BlockPropsForm
                        block={selectedBlock}
                        products={products}
                        viewport={viewport}
                        onChange={handlePropChange}
                    />
                )}

                {activeTab === 'style' && (
                    <div className="space-y-3">
                        <ResponsiveDeviceBar
                            viewport={viewport}
                            onChange={setViewport}
                            label="Style for"
                        />
                        {viewport !== 'desktop' && (
                            <div className="flex items-center justify-between rounded-md border border-indigo-200 bg-indigo-50/50 px-2.5 py-1.5">
                                <span className="text-[10px] font-medium text-indigo-800">
                                    {DEVICE_LABELS[viewport]} overrides active
                                </span>
                                <button
                                    type="button"
                                    onClick={resetActiveDevice}
                                    className="rounded border border-indigo-200 bg-white px-2 py-0.5 text-[9.5px] font-bold text-indigo-700 transition hover:bg-indigo-100"
                                    title="Remove all tablet/mobile overrides for this block"
                                >
                                    Reset {DEVICE_LABELS[viewport]}
                                </button>
                            </div>
                        )}
                        {selectedBlock.type === 'CodCheckoutBlock' && (
                            <CodCheckoutDesignSettings
                                mode="styles"
                                props={selectedBlock.props as unknown as CodCheckoutBlockProps}
                                onChange={handlePropChange}
                            />
                        )}
                        <BlockStylesForm
                            styles={styles}
                            onChange={handleStyleChange}
                            onBatchChange={handleBatchStyleChange}
                        />
                        <ElementStylesPanel
                            key={`${selectedBlock.id}-${selectedBlock.type}`}
                            blockType={selectedBlock.type}
                            styles={rawStyles}
                            viewport={viewport}
                            onChange={handleElementStyleChange}
                            onBatchChange={handleElementBatchStyleChange}
                        />
                    </div>
                )}

                {activeTab === 'advanced' && (
                    <div className="space-y-3">
                        <ResponsiveDeviceBar
                            viewport={viewport}
                            onChange={setViewport}
                            label="Layout for"
                        />
                        {viewport !== 'desktop' && (
                            <div className="flex items-center justify-between rounded-md border border-indigo-200 bg-indigo-50/50 px-2.5 py-1.5">
                                <span className="text-[10px] font-medium text-indigo-800">
                                    {DEVICE_LABELS[viewport]} overrides active
                                </span>
                                <button
                                    type="button"
                                    onClick={resetActiveDevice}
                                    className="rounded border border-indigo-200 bg-white px-2 py-0.5 text-[9.5px] font-bold text-indigo-700 transition hover:bg-indigo-100"
                                    title="Remove all tablet/mobile overrides for this block"
                                >
                                    Reset {DEVICE_LABELS[viewport]}
                                </button>
                            </div>
                        )}
                        <BlockAdvancedForm
                            styles={styles}
                            onChange={handleStyleChange}
                            onBatchChange={handleBatchStyleChange}
                        />
                    </div>
                )}
            </div>
        </Wrapper>
    );
}

interface BlockPropsFormProps {
    block: Block;
    products: Array<{ id: number; title: string }>;
    viewport: ViewportMode;
    onChange: (key: string, value: unknown) => void;
}

function BlockPropsForm({ block, products, viewport, onChange }: BlockPropsFormProps) {
    const props = block.props as Record<string, unknown>;

    switch (block.type) {
        case 'HeroBlock':
            return (
                <HeroBlockInspector
                    block={block}
                    props={props as unknown as HeroBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'ProductSelectorBlock':
            return (
                <ProductSelectorBlockInspector
                    props={props as unknown as ProductSelectorBlockProps}
                    products={products}
                    onChange={onChange}
                />
            );

        case 'CodCheckoutBlock':
            return (
                <CodCheckoutBlockInspector
                    props={props as unknown as CodCheckoutBlockProps}
                    products={products}
                    onChange={onChange}
                />
            );

        case 'BenefitsGridBlock':
            return (
                <BenefitsGridBlockInspector
                    block={block}
                    props={props as unknown as BenefitsGridBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'ReviewsBlock':
            return (
                <ReviewsBlockInspector
                    block={block}
                    props={props as unknown as ReviewsBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'VideoBlock':
            return (
                <VideoBlockInspector
                    block={block}
                    props={props as unknown as VideoBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'FaqBlock':
            return (
                <FaqBlockInspector
                    block={block}
                    props={props as unknown as FaqBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'AccordionBlock':
            return (
                <AccordionBlockInspector
                    block={block}
                    props={props as unknown as AccordionBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'CountdownTimerBlock':
            return (
                <CountdownTimerBlockInspector
                    block={block}
                    props={props as unknown as CountdownTimerBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'StickyBarBlock':
            return (
                <StickyBarBlockInspector
                    block={block}
                    props={props as unknown as StickyBarBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'HtmlBlock':
            return (
                <HtmlBlockInspector
                    block={block}
                    props={props as unknown as HtmlBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'ContainerBlock':
            return (
                <ContainerBlockInspector
                    block={block}
                    props={props as unknown as ContainerBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'HeadingBlock':
            return (
                <HeadingBlockInspector
                    block={block}
                    props={props as unknown as HeadingBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'TextBlock':
            return (
                <TextBlockInspector
                    block={block}
                    props={props as unknown as TextBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'ImageBlock':
            return (
                <ImageBlockInspector
                    block={block}
                    props={props as unknown as ImageBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'ButtonBlock':
            return (
                <ButtonBlockInspector
                    block={block}
                    props={props as unknown as ButtonBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'IconListBlock':
            return (
                <IconListBlockInspector
                    block={block}
                    props={props as unknown as IconListBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'ImageCarouselBlock':
            return (
                <ImageCarouselBlockInspector
                    block={block}
                    props={props as unknown as ImageCarouselBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'GridBlock':
            return (
                <GridBlockInspector
                    block={block}
                    props={props as unknown as GridBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        case 'TestimonialBlock':
            return (
                <TestimonialBlockInspector
                    block={block}
                    props={props as unknown as TestimonialBlockProps}
                    viewport={viewport}
                    onChange={onChange}
                />
            );

        default:
            return <div className="text-xs text-gray-400">No properties for this block.</div>;
    }
}
