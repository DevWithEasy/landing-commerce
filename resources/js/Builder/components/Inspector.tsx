import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Box,
    Code,
    LayoutGrid,
    Maximize2,
    Palette,
    Plus,
    Quote,
    Sparkles,
    Square,
    Trash2,
    Type,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { PageSettingsInspector } from './PageSettingsInspector';
import { CodeEditor } from './CodeEditor';
import { CodCheckoutDesignSettings } from './CodCheckoutDesignSettings';
import { MediaField, MediaLibraryAddButton } from './MediaPickerModal';
import {
    AlignmentControl,
    ColorControl,
    ControlSection,
    NumberUnitControl,
    SelectControl,
    SpacingControl,
    TextControl,
    TextareaControl,
    ToggleControl,
} from './controls';
import { findBlockInTree, useBuilderStore } from '../stores/useBuilderStore';
import {
    BLOCK_ELEMENT_STYLE_OPTIONS,
    DEVICE_LABELS,
    resolveBlockStyles,
    resolveElementStyles,
} from '../styleSystem';
import type {
    AccordionBlockProps,
    AccordionItem,
    BenefitItem,
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
    FaqItem,
    GridBlockProps,
    HeadingBlockProps,
    HeroBlockProps,
    HtmlBlockProps,
    IconListBlockProps,
    IconListItem,
    ImageBlockProps,
    ImageCarouselBlockProps,
    ImageCarouselItem,
    ProductSelectorBlockProps,
    ReviewItem,
    ReviewsBlockProps,
    StickyBarBlockProps,
    TestimonialBlockProps,
    TestimonialItem,
    TextBlockProps,
    VideoBlockProps,
    ViewportMode,
} from '@/types';
import { createTestimonialItem, resolveTestimonialItems } from '../blocks/testimonialItems';

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
}

export function Inspector({ blockDefinitions, products, width }: InspectorProps) {
    const {
        ast,
        viewport,
        selectedBlockId,
        setSelectedBlockId,
        updateBlockProps,
        setBlockStyles,
    } = useBuilderStore();

    const [activeTab, setActiveTab] = useState<'content' | 'styles'>('content');
    const [showPageSettings, setShowPageSettings] = useState(false);

    const selectedBlock = selectedBlockId ? findBlockInTree(ast.blocks, selectedBlockId) : null;

    if (!selectedBlock || showPageSettings) {
        return (
            <PageSettingsInspector
                width={width}
                hasSelectedBlock={!!selectedBlock}
                onBackToBlock={() => setShowPageSettings(false)}
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
        writeStylePatch({ [key]: value } as Partial<BlockStyles>);
    };

    const handleBatchStyleChange = (updates: Partial<BlockStyles>) => {
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

    return (
        <aside
            style={{ width: width ? `${width}px` : undefined }}
            className="w-80 sm:w-88 shrink-0 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-4rem)] select-none transition-[width] duration-75"
        >
            {/* Inspector Header */}
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

            {/* Content vs Styles Tabs */}
            <div className="flex border-b border-gray-200 bg-white p-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center space-x-1 transition ${
                        activeTab === 'content'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Content</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('styles')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center space-x-1 transition ${
                        activeTab === 'styles'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Styles</span>
                </button>
            </div>

            {/* Inspector Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {activeTab === 'content' ? (
                    <BlockPropsForm
                        block={selectedBlock}
                        products={products}
                        viewport={viewport}
                        onChange={handlePropChange}
                    />
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-2">
                            <div className="min-w-0">
                                <span className="block text-[10.5px] font-bold text-indigo-900">
                                    Editing {DEVICE_LABELS[viewport]} styles
                                </span>
                                <span className="block truncate text-[9px] text-indigo-600">
                                    {viewport === 'desktop'
                                        ? 'Desktop is the base style inherited by every device.'
                                        : `Only ${DEVICE_LABELS[viewport].toLowerCase()} overrides are saved. Empty fields inherit desktop.`}
                                </span>
                            </div>
                            {viewport !== 'desktop' && (
                                <button
                                    type="button"
                                    onClick={resetActiveDevice}
                                    className="shrink-0 rounded-md border border-indigo-200 bg-white px-2 py-1 text-[9.5px] font-bold text-indigo-700 transition hover:bg-indigo-100"
                                    title="Remove all tablet/mobile overrides for this block"
                                >
                                    Reset device
                                </button>
                            )}
                        </div>
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
            </div>
        </aside>
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
        case 'HeroBlock': {
            const p = props as unknown as HeroBlockProps;
            return (
                <div className="space-y-4">
                    {/* 1. Headline Element Settings */}
                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                            <span className="text-xs font-bold text-gray-900 flex items-center">
                                <Type className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                                Headline
                            </span>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Text Content
                            </label>
                            <textarea
                                rows={2}
                                value={p.headline || ''}
                                onChange={(e) => onChange('headline', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2 bg-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Text Color
                                </label>
                                <div className="flex items-center space-x-1.5">
                                    <input
                                        type="color"
                                        value={p.headlineColor || '#0f172a'}
                                        onChange={(e) => onChange('headlineColor', e.target.value)}
                                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={p.headlineColor || ''}
                                        onChange={(e) => onChange('headlineColor', e.target.value)}
                                        placeholder="#0f172a"
                                        className="w-full text-[11px] font-mono rounded border-gray-300 p-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Font Size
                                </label>
                                <select
                                    value={p.headlineFontSize || ''}
                                    onChange={(e) => onChange('headlineFontSize', e.target.value)}
                                    className="w-full text-xs rounded border-gray-300 p-1.5 bg-white"
                                >
                                    <option value="">Default (Responsive)</option>
                                    <option value="24px">Small (24px)</option>
                                    <option value="32px">Medium (32px)</option>
                                    <option value="40px">Large (40px)</option>
                                    <option value="48px">Extra Large (48px)</option>
                                    <option value="56px">Huge (56px)</option>
                                    <option value="64px">Display (64px)</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Font Weight
                                </label>
                                <select
                                    value={p.headlineFontWeight || ''}
                                    onChange={(e) => onChange('headlineFontWeight', e.target.value)}
                                    className="w-full text-xs rounded border-gray-300 p-1.5 bg-white"
                                >
                                    <option value="">Default (Extrabold 800)</option>
                                    <option value="600">Semibold (600)</option>
                                    <option value="700">Bold (700)</option>
                                    <option value="800">Extra Bold (800)</option>
                                    <option value="900">Black (900)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Alignment
                                </label>
                                <select
                                    value={p.headlineAlign || 'left'}
                                    onChange={(e) => onChange('headlineAlign', e.target.value)}
                                    className="w-full text-xs rounded border-gray-300 p-1.5 bg-white"
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. Subheadline Element Settings */}
                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                            <span className="text-xs font-bold text-gray-900 flex items-center">
                                <AlignLeft className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                                Subheadline
                            </span>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Text Content
                            </label>
                            <textarea
                                rows={2}
                                value={p.subheadline || ''}
                                onChange={(e) => onChange('subheadline', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2 bg-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Text Color
                                </label>
                                <div className="flex items-center space-x-1.5">
                                    <input
                                        type="color"
                                        value={p.subheadlineColor || '#475569'}
                                        onChange={(e) =>
                                            onChange('subheadlineColor', e.target.value)
                                        }
                                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={p.subheadlineColor || ''}
                                        onChange={(e) =>
                                            onChange('subheadlineColor', e.target.value)
                                        }
                                        placeholder="#475569"
                                        className="w-full text-[11px] font-mono rounded border-gray-300 p-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Font Size
                                </label>
                                <select
                                    value={p.subheadlineFontSize || ''}
                                    onChange={(e) =>
                                        onChange('subheadlineFontSize', e.target.value)
                                    }
                                    className="w-full text-xs rounded border-gray-300 p-1.5 bg-white"
                                >
                                    <option value="">Default (16-18px)</option>
                                    <option value="14px">14px</option>
                                    <option value="16px">16px</option>
                                    <option value="18px">18px</option>
                                    <option value="20px">20px</option>
                                    <option value="22px">22px</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Badge Element Settings */}
                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                            <span className="text-xs font-bold text-gray-900 flex items-center">
                                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                                Badge Tag
                            </span>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Badge Text
                            </label>
                            <input
                                type="text"
                                value={p.badgeText || ''}
                                onChange={(e) => onChange('badgeText', e.target.value)}
                                placeholder="e.g. Limited Stock Offer"
                                className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2 bg-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Text Color
                                </label>
                                <div className="flex items-center space-x-1.5">
                                    <input
                                        type="color"
                                        value={p.badgeTextColor || '#1e40af'}
                                        onChange={(e) => onChange('badgeTextColor', e.target.value)}
                                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={p.badgeTextColor || ''}
                                        onChange={(e) => onChange('badgeTextColor', e.target.value)}
                                        placeholder="#1e40af"
                                        className="w-full text-[11px] font-mono rounded border-gray-300 p-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Background
                                </label>
                                <div className="flex items-center space-x-1.5">
                                    <input
                                        type="color"
                                        value={p.badgeBgColor || '#dbeafe'}
                                        onChange={(e) => onChange('badgeBgColor', e.target.value)}
                                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={p.badgeBgColor || ''}
                                        onChange={(e) => onChange('badgeBgColor', e.target.value)}
                                        placeholder="#dbeafe"
                                        className="w-full text-[11px] font-mono rounded border-gray-300 p-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. CTA Button Element Settings */}
                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                            <span className="text-xs font-bold text-gray-900 flex items-center">
                                <Zap className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                                CTA Button
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Button Text
                                </label>
                                <input
                                    type="text"
                                    value={p.ctaText || ''}
                                    onChange={(e) => onChange('ctaText', e.target.value)}
                                    placeholder="Order Now"
                                    className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Action Target
                                </label>
                                <input
                                    type="text"
                                    value={p.ctaTarget || ''}
                                    onChange={(e) => onChange('ctaTarget', e.target.value)}
                                    placeholder="#cod-checkout"
                                    className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2 bg-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Button Size
                                </label>
                                <select
                                    value={p.buttonSize || 'lg'}
                                    onChange={(e) => onChange('buttonSize', e.target.value)}
                                    className="w-full text-xs rounded border-gray-300 p-1.5 bg-white"
                                >
                                    <option value="sm">Small</option>
                                    <option value="md">Medium</option>
                                    <option value="lg">Large</option>
                                    <option value="xl">Extra Large</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Button Width
                                </label>
                                <select
                                    value={p.buttonWidth || 'auto'}
                                    onChange={(e) => onChange('buttonWidth', e.target.value)}
                                    className="w-full text-xs rounded border-gray-300 p-1.5 bg-white"
                                >
                                    <option value="auto">Auto (Fit Content)</option>
                                    <option value="full">Full Width</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Background
                                </label>
                                <div className="flex items-center space-x-1.5">
                                    <input
                                        type="color"
                                        value={p.buttonBgColor || '#16a34a'}
                                        onChange={(e) => onChange('buttonBgColor', e.target.value)}
                                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={p.buttonBgColor || ''}
                                        onChange={(e) => onChange('buttonBgColor', e.target.value)}
                                        placeholder="#16a34a"
                                        className="w-full text-[11px] font-mono rounded border-gray-300 p-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Text Color
                                </label>
                                <div className="flex items-center space-x-1.5">
                                    <input
                                        type="color"
                                        value={p.buttonTextColor || '#ffffff'}
                                        onChange={(e) =>
                                            onChange('buttonTextColor', e.target.value)
                                        }
                                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={p.buttonTextColor || ''}
                                        onChange={(e) =>
                                            onChange('buttonTextColor', e.target.value)
                                        }
                                        placeholder="#ffffff"
                                        className="w-full text-[11px] font-mono rounded border-gray-300 p-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 items-center pt-1">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Corner Radius
                                </label>
                                <select
                                    value={p.buttonBorderRadius || '12px'}
                                    onChange={(e) => onChange('buttonBorderRadius', e.target.value)}
                                    className="w-full text-xs rounded border-gray-300 p-1.5 bg-white"
                                >
                                    <option value="0px">Square (0px)</option>
                                    <option value="6px">Small (6px)</option>
                                    <option value="12px">Rounded (12px)</option>
                                    <option value="16px">Large (16px)</option>
                                    <option value="9999px">Pill</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-2 pt-4">
                                <input
                                    type="checkbox"
                                    id="hero_btn_pulse"
                                    checked={Boolean(p.buttonPulseAnimation)}
                                    onChange={(e) =>
                                        onChange('buttonPulseAnimation', e.target.checked)
                                    }
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label
                                    htmlFor="hero_btn_pulse"
                                    className="text-xs text-gray-700 font-semibold cursor-pointer"
                                >
                                    Pulse Animation
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 5. Media Image Settings */}
                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                            <span className="text-xs font-bold text-gray-900 flex items-center">
                                <Box className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                                Showcase Image
                            </span>
                        </div>
                        <MediaField
                            label="Image"
                            value={p.imageUrl || ''}
                            onChange={(value) => onChange('imageUrl', value)}
                            placeholder="https://..."
                            hint="Choose an uploaded image or paste a URL."
                        />
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Image Position
                            </label>
                            <select
                                value={p.imagePosition || 'right'}
                                onChange={(e) => onChange('imagePosition', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2 bg-white"
                            >
                                <option value="right">Right Side</option>
                                <option value="left">Left Side</option>
                                <option value="background">Background Overlay</option>
                            </select>
                        </div>
                    </div>
                </div>
            );
        }

        case 'ProductSelectorBlock': {
            const p = props as unknown as ProductSelectorBlockProps;
            return (
                <div className="space-y-4">
                    <ProductPickerSection
                        productIds={p.productIds}
                        productId={p.productId}
                        selectionMode={p.selectionMode}
                        defaultSelection={p.defaultSelection}
                        defaultSelectedId={p.defaultSelectedId}
                        showDiscountBadge={p.showDiscountBadge}
                        badgeText={p.badgeText}
                        productBadges={p.productBadges}
                        products={products}
                        onChange={onChange}
                    />

                    <div className="pt-2 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Order Button Text
                        </label>
                        <input
                            type="text"
                            value={p.orderButtonText || ''}
                            onChange={(e) => onChange('orderButtonText', e.target.value)}
                            placeholder="অর্ডার করুন"
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-1 border-t border-gray-100">
                        <input
                            type="checkbox"
                            id="ps_price"
                            checked={p.showPrice ?? true}
                            onChange={(e) => onChange('showPrice', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="ps_price" className="text-xs text-gray-700">
                            Display Product Price
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="ps_desc"
                            checked={p.showDescription ?? true}
                            onChange={(e) => onChange('showDescription', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="ps_desc" className="text-xs text-gray-700">
                            Display Product Description
                        </label>
                    </div>
                </div>
            );
        }

        case 'CodCheckoutBlock': {
            const p = props as unknown as CodCheckoutBlockProps;
            return (
                <div className="space-y-4">
                    <ProductPickerSection
                        productIds={p.productIds}
                        productId={p.productId}
                        selectionMode={p.selectionMode}
                        defaultSelection={p.defaultSelection}
                        defaultSelectedId={p.defaultSelectedId}
                        showDiscountBadge={p.showDiscountBadge}
                        badgeText={p.badgeText}
                        productBadges={p.productBadges}
                        products={products}
                        onChange={onChange}
                    />

                    {/* Form Fields Customization (Labels & Placeholders) */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-3">
                        <div className="text-xs font-bold text-gray-800 border-b border-gray-200 pb-1.5 flex items-center justify-between">
                            <span>Form Fields</span>
                        </div>

                        {/* Customer Name Field */}
                        <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-gray-700">
                                Name Field Label & Placeholder:
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                                <input
                                    type="text"
                                    value={p.nameLabel ?? ''}
                                    placeholder="আপনার নাম (Your Name)"
                                    onChange={(e) => onChange('nameLabel', e.target.value)}
                                    className="text-xs rounded border-gray-300 bg-white p-1.5"
                                />
                                <input
                                    type="text"
                                    value={p.namePlaceholder ?? ''}
                                    placeholder="আপনার পুরো নাম লিখুন..."
                                    onChange={(e) => onChange('namePlaceholder', e.target.value)}
                                    className="text-xs rounded border-gray-300 bg-white p-1.5"
                                />
                            </div>
                        </div>

                        {/* Mobile Phone Field */}
                        <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-gray-700">
                                Phone Field Label & Placeholder:
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                                <input
                                    type="text"
                                    value={p.phoneLabel ?? ''}
                                    placeholder="মোবাইল নাম্বার"
                                    onChange={(e) => onChange('phoneLabel', e.target.value)}
                                    className="text-xs rounded border-gray-300 bg-white p-1.5"
                                />
                                <input
                                    type="text"
                                    value={p.phonePlaceholder ?? ''}
                                    placeholder="01XXXXXXXXX"
                                    onChange={(e) => onChange('phonePlaceholder', e.target.value)}
                                    className="text-xs rounded border-gray-300 bg-white p-1.5"
                                />
                            </div>
                        </div>

                        {/* Address Field */}
                        <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-gray-700">
                                Address Field Label & Placeholder:
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                                <input
                                    type="text"
                                    value={p.addressLabel ?? ''}
                                    placeholder="সম্পূর্ণ ডেলিভারি ঠিকানা"
                                    onChange={(e) => onChange('addressLabel', e.target.value)}
                                    className="text-xs rounded border-gray-300 bg-white p-1.5"
                                />
                                <input
                                    type="text"
                                    value={p.addressPlaceholder ?? ''}
                                    placeholder="বাসা/রোড/এলাকা..."
                                    onChange={(e) => onChange('addressPlaceholder', e.target.value)}
                                    className="text-xs rounded border-gray-300 bg-white p-1.5"
                                />
                            </div>
                        </div>

                        {/* Shipping Method Label */}
                        <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-gray-700">
                                Shipping Dropdown Label:
                            </label>
                            <input
                                type="text"
                                value={p.shippingLabel ?? ''}
                                placeholder="শিপিং মেথড (Shipping Method)"
                                onChange={(e) => onChange('shippingLabel', e.target.value)}
                                className="w-full text-xs rounded border-gray-300 bg-white p-1.5"
                            />
                        </div>

                        {/* Submit Button Text */}
                        <div className="space-y-1 pt-1 border-t border-gray-200">
                            <label className="block text-[11px] font-semibold text-gray-700">
                                Submit Button Text
                            </label>
                            <input
                                type="text"
                                value={p.buttonText || ''}
                                onChange={(e) => onChange('buttonText', e.target.value)}
                                placeholder="অর্ডার কনফার্ম করুন — ক্যাশ অন ডেলিভারি"
                                className="w-full text-xs rounded border-gray-300 bg-white p-1.5 font-medium"
                            />
                        </div>
                    </div>

                    <CodCheckoutDesignSettings mode="content" props={p} onChange={onChange} />
                </div>
            );
        }

        case 'BenefitsGridBlock': {
            const p = props as unknown as BenefitsGridBlockProps;
            const items = p.items || [];

            const handleUpdateItem = (index: number, key: keyof BenefitItem, val: string) => {
                const next = [...items];
                next[index] = { ...next[index], [key]: val };
                onChange('items', next);
            };

            const handleAddItem = () => {
                const next = [
                    ...items,
                    {
                        id: String(Date.now()),
                        title: 'New Benefit',
                        description: 'Benefit detail explanation.',
                    },
                ];
                onChange('items', next);
            };

            const handleRemoveItem = (index: number) => {
                const next = items.filter((_, i) => i !== index);
                onChange('items', next);
            };

            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Section Title
                        </label>
                        <input
                            type="text"
                            value={p.title || ''}
                            onChange={(e) => onChange('title', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Columns
                        </label>
                        <select
                            value={p.columns || 3}
                            onChange={(e) => onChange('columns', Number(e.target.value))}
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        >
                            <option value={2}>2 Columns</option>
                            <option value={3}>3 Columns</option>
                            <option value={4}>4 Columns</option>
                        </select>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">Benefit Cards</span>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                            >
                                <Plus className="w-3.5 h-3.5 mr-0.5" />
                                <span>Add Card</span>
                            </button>
                        </div>
                        {items.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                className="p-2.5 rounded-lg border border-gray-200 space-y-1.5 bg-gray-50/50"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400">
                                        Card #{idx + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="text-gray-400 hover:text-rose-600"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={item.title}
                                    placeholder="Title"
                                    onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                                    className="w-full text-xs rounded border-gray-300 p-1.5"
                                />
                                <textarea
                                    rows={2}
                                    value={item.description}
                                    placeholder="Description"
                                    onChange={(e) =>
                                        handleUpdateItem(idx, 'description', e.target.value)
                                    }
                                    className="w-full text-xs rounded border-gray-300 p-1.5"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        case 'ReviewsBlock': {
            const p = props as unknown as ReviewsBlockProps;
            const items = p.items || [];

            const handleUpdateReview = (index: number, key: keyof ReviewItem, val: unknown) => {
                const next = [...items];
                next[index] = { ...next[index], [key]: val };
                onChange('items', next);
            };

            const handleAddReview = () => {
                const next = [
                    ...items,
                    {
                        id: String(Date.now()),
                        authorName: 'Customer Name',
                        location: 'Dhaka',
                        rating: 5,
                        comment: 'Very pleased with my purchase!',
                        verifiedPurchase: true,
                    },
                ];
                onChange('items', next);
            };

            const handleRemoveReview = (index: number) => {
                const next = items.filter((_, i) => i !== index);
                onChange('items', next);
            };

            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Section Title
                        </label>
                        <input
                            type="text"
                            value={p.title || ''}
                            onChange={(e) => onChange('title', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>

                    <ControlSection title="Star Rating Design" icon={Palette} defaultOpen>
                        <div className="grid grid-cols-2 gap-1.5">
                            <ColorControl
                                label="Star Color"
                                value={p.starColor || ''}
                                fallback="#f59e0b"
                                onChange={(value) => onChange('starColor', value)}
                            />
                            <ColorControl
                                label="Empty Star"
                                value={p.starEmptyColor || ''}
                                fallback="#d1d5db"
                                onChange={(value) => onChange('starEmptyColor', value)}
                            />
                            <NumberUnitControl
                                label="Star Size"
                                value={p.starSize ?? '16px'}
                                unit="px"
                                min={8}
                                max={48}
                                onChange={(value) => onChange('starSize', value)}
                            />
                            <SelectControl
                                label="Star Style"
                                value={p.starStyle ?? 'filled'}
                                options={[
                                    { label: 'Filled', value: 'filled' },
                                    { label: 'Outline', value: 'outline' },
                                ]}
                                onChange={(value) => onChange('starStyle', value)}
                            />
                        </div>
                        <ToggleControl
                            label="Show Star Icons"
                            checked={p.showStars !== false}
                            onChange={(checked) => onChange('showStars', checked)}
                        />
                        <ToggleControl
                            label="Show Rating Summary"
                            checked={p.showRatingSummary !== false}
                            onChange={(checked) => onChange('showRatingSummary', checked)}
                        />
                        <TextControl
                            label="Summary Text"
                            value={p.ratingSummaryText || ''}
                            placeholder="4.9/5 from verified buyers"
                            onChange={(value) => onChange('ratingSummaryText', value)}
                        />
                        <ColorControl
                            label="Summary Color"
                            value={p.ratingSummaryColor || ''}
                            fallback="#334155"
                            onChange={(value) => onChange('ratingSummaryColor', value)}
                        />
                    </ControlSection>

                    <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">Reviews</span>
                            <button
                                type="button"
                                onClick={handleAddReview}
                                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                            >
                                <Plus className="w-3.5 h-3.5 mr-0.5" />
                                <span>Add Review</span>
                            </button>
                        </div>
                        {items.map((rev, idx) => (
                            <div
                                key={rev.id || idx}
                                className="p-2.5 rounded-lg border border-gray-200 space-y-1.5 bg-gray-50/50"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400">
                                        Review #{idx + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveReview(idx)}
                                        className="text-gray-400 hover:text-rose-600"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <input
                                        type="text"
                                        value={rev.authorName}
                                        placeholder="Name"
                                        onChange={(e) =>
                                            handleUpdateReview(idx, 'authorName', e.target.value)
                                        }
                                        className="w-full text-xs rounded border-gray-300 p-1.5"
                                    />
                                    <input
                                        type="text"
                                        value={rev.location || ''}
                                        placeholder="City/District"
                                        onChange={(e) =>
                                            handleUpdateReview(idx, 'location', e.target.value)
                                        }
                                        className="w-full text-xs rounded border-gray-300 p-1.5"
                                    />
                                </div>
                                <textarea
                                    rows={2}
                                    value={rev.comment}
                                    placeholder="Review comment"
                                    onChange={(e) =>
                                        handleUpdateReview(idx, 'comment', e.target.value)
                                    }
                                    className="w-full text-xs rounded border-gray-300 p-1.5"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        case 'VideoBlock': {
            const p = props as unknown as VideoBlockProps;
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            YouTube or Vimeo URL
                        </label>
                        <input
                            type="url"
                            value={p.videoUrl || ''}
                            onChange={(e) => onChange('videoUrl', e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Aspect Ratio
                        </label>
                        <select
                            value={p.aspectRatio || '16:9'}
                            onChange={(e) => onChange('aspectRatio', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        >
                            <option value="16:9">16:9 Widescreen</option>
                            <option value="4:3">4:3 Standard</option>
                            <option value="1:1">1:1 Square</option>
                        </select>
                    </div>
                </div>
            );
        }

        case 'FaqBlock': {
            const p = props as unknown as FaqBlockProps;
            const items = p.items || [];

            const handleUpdateFaq = (index: number, key: keyof FaqItem, val: string) => {
                const next = [...items];
                next[index] = { ...next[index], [key]: val };
                onChange('items', next);
            };

            const handleAddFaq = () => {
                const next = [
                    ...items,
                    {
                        id: String(Date.now()),
                        question: 'Common Question?',
                        answer: 'Helpful answer detail.',
                    },
                ];
                onChange('items', next);
            };

            const handleRemoveFaq = (index: number) => {
                const next = items.filter((_, i) => i !== index);
                onChange('items', next);
            };

            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Section Title
                        </label>
                        <input
                            type="text"
                            value={p.title || ''}
                            onChange={(e) => onChange('title', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">FAQ Accordions</span>
                            <button
                                type="button"
                                onClick={handleAddFaq}
                                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                            >
                                <Plus className="w-3.5 h-3.5 mr-0.5" />
                                <span>Add Question</span>
                            </button>
                        </div>
                        {items.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                className="p-2.5 rounded-lg border border-gray-200 space-y-1.5 bg-gray-50/50"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400">
                                        Q#{idx + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFaq(idx)}
                                        className="text-gray-400 hover:text-rose-600"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={item.question}
                                    placeholder="Question"
                                    onChange={(e) =>
                                        handleUpdateFaq(idx, 'question', e.target.value)
                                    }
                                    className="w-full text-xs rounded border-gray-300 p-1.5"
                                />
                                <textarea
                                    rows={2}
                                    value={item.answer}
                                    placeholder="Answer"
                                    onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                                    className="w-full text-xs rounded border-gray-300 p-1.5"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        case 'AccordionBlock': {
            const p = props as unknown as AccordionBlockProps;
            const items = p.items || [];

            const handleUpdateAccordionItem = (
                index: number,
                key: keyof AccordionItem,
                val: string
            ) => {
                const next = [...items];
                next[index] = { ...next[index], [key]: val };
                onChange('items', next);
            };

            const handleAddAccordionItem = () => {
                onChange('items', [
                    ...items,
                    {
                        id: String(Date.now()),
                        title: `Accordion Item ${items.length + 1}`,
                        content: 'Accordion content goes here.',
                    },
                ]);
            };

            const handleRemoveAccordionItem = (index: number) => {
                onChange(
                    'items',
                    items.filter((_, itemIndex) => itemIndex !== index)
                );
            };

            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Section Title
                        </label>
                        <input
                            type="text"
                            value={p.title || ''}
                            onChange={(e) => onChange('title', e.target.value)}
                            placeholder="Title"
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">Accordion Items</span>
                            <button
                                type="button"
                                onClick={handleAddAccordionItem}
                                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                            >
                                <Plus className="w-3.5 h-3.5 mr-0.5" />
                                <span>Add Item</span>
                            </button>
                        </div>

                        {items.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                className="p-2.5 rounded-lg border border-gray-200 space-y-1.5 bg-gray-50/50"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400">
                                        Item #{idx + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAccordionItem(idx)}
                                        className="text-gray-400 hover:text-rose-600"
                                        title="Remove item"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={item.title}
                                    placeholder="Accordion item title"
                                    onChange={(e) =>
                                        handleUpdateAccordionItem(idx, 'title', e.target.value)
                                    }
                                    className="w-full text-xs rounded border-gray-300 p-1.5"
                                />
                                <textarea
                                    rows={2}
                                    value={item.content}
                                    placeholder="Accordion item content"
                                    onChange={(e) =>
                                        handleUpdateAccordionItem(idx, 'content', e.target.value)
                                    }
                                    className="w-full text-xs rounded border-gray-300 p-1.5"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        case 'CountdownTimerBlock': {
            const p = props as unknown as CountdownTimerBlockProps;
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Target End Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            value={p.targetDate ? p.targetDate.slice(0, 16) : ''}
                            onChange={(e) =>
                                onChange('targetDate', new Date(e.target.value).toISOString())
                            }
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Headline
                        </label>
                        <input
                            type="text"
                            value={p.headline || ''}
                            onChange={(e) => onChange('headline', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Urgency Note
                        </label>
                        <input
                            type="text"
                            value={p.urgencyText || ''}
                            onChange={(e) => onChange('urgencyText', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Expiration Message
                        </label>
                        <input
                            type="text"
                            value={p.expiryMessage || ''}
                            onChange={(e) => onChange('expiryMessage', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>
                </div>
            );
        }

        case 'StickyBarBlock': {
            const p = props as unknown as StickyBarBlockProps;
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Message Text
                        </label>
                        <input
                            type="text"
                            value={p.message || ''}
                            onChange={(e) => onChange('message', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Button Text
                        </label>
                        <input
                            type="text"
                            value={p.buttonText || ''}
                            onChange={(e) => onChange('buttonText', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Button Target
                        </label>
                        <input
                            type="text"
                            value={p.buttonTarget || ''}
                            onChange={(e) => onChange('buttonTarget', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Screen Placement
                        </label>
                        <select
                            value={p.placement || 'bottom'}
                            onChange={(e) => onChange('placement', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        >
                            <option value="bottom">Bottom of Screen</option>
                            <option value="top">Top of Screen</option>
                        </select>
                    </div>
                </div>
            );
        }

        case 'HtmlBlock': {
            const p = props as unknown as HtmlBlockProps;
            return (
                <div className="space-y-4">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                        <div className="flex items-center space-x-1.5 text-emerald-900 font-bold text-xs mb-1">
                            <Code className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Custom HTML & CSS Editor</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                            Write any valid HTML markup and scoped CSS classes here. The left canvas
                            previews your changes live as you type.
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-gray-800 flex items-center">
                                <span>Custom HTML Code</span>
                            </label>
                            <span className="text-[10px] text-gray-400 font-mono px-1.5 py-0.5 bg-gray-100 rounded">
                                &lt;html&gt;
                            </span>
                        </div>
                        <CodeEditor
                            key={`${block.id}-html`}
                            language="html"
                            value={p.html || ''}
                            onChange={(value) => onChange('html', value)}
                            ariaLabel="Custom HTML code"
                            placeholder={
                                "<div class='my-card'>\n  <h2>Special Title</h2>\n  <p>Your description...</p>\n</div>"
                            }
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-gray-800 flex items-center">
                                <span>Custom Scoped CSS</span>
                            </label>
                            <span className="text-[10px] text-emerald-600 font-mono px-1.5 py-0.5 bg-emerald-50 rounded">
                                &#123;css&#125;
                            </span>
                        </div>
                        <CodeEditor
                            key={`${block.id}-css`}
                            language="css"
                            value={p.css || ''}
                            onChange={(value) => onChange('css', value)}
                            ariaLabel="Custom scoped CSS"
                            placeholder={
                                '.my-card {\n  background: #ffffff;\n  border-radius: 12px;\n  padding: 20px;\n}'
                            }
                        />
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 leading-normal">
                        <strong className="block font-semibold mb-0.5">Security Policy:</strong>
                        For safety, &lt;script&gt; tags and inline event handlers (such as onclick,
                        onerror) are blocked. All valid HTML elements and TailwindCSS classes are
                        supported.
                    </div>
                </div>
            );
        }

        case 'ContainerBlock': {
            const p = props as unknown as ContainerBlockProps;
            const childCount = block.children?.length ?? 0;
            return (
                <div className="space-y-4">
                    {/* Container Info Badge */}
                    <div className="p-3 bg-primary-50/70 rounded-xl border border-primary-200 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                            <Box className="w-4 h-4 text-primary-600" />
                            <span className="font-bold text-primary-900">Container Layout</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-primary-200/60 text-primary-800 text-[11px] font-mono font-semibold">
                            {childCount} {childCount === 1 ? 'child' : 'children'}
                        </span>
                    </div>

                    {/* Flex Direction */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                            Direction
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'column', label: 'Vertical (Column)' },
                                { value: 'row', label: 'Horizontal (Row)' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => onChange('direction', opt.value)}
                                    className={`py-2 px-3 text-xs rounded-lg border font-medium transition cursor-pointer text-center ${
                                        (p.direction || 'column') === opt.value
                                            ? 'bg-primary-50 border-primary-600 text-primary-900 font-bold ring-1 ring-primary-500'
                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Flex Wrap */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                            Flex Wrap
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'nowrap', label: 'No Wrap' },
                                { value: 'wrap', label: 'Wrap' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => onChange('wrap', opt.value)}
                                    className={`py-2 px-3 text-xs rounded-lg border font-medium transition cursor-pointer text-center ${
                                        (p.wrap || 'nowrap') === opt.value
                                            ? 'bg-primary-50 border-primary-600 text-primary-900 font-bold ring-1 ring-primary-500'
                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Justify Content */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Justify Content
                        </label>
                        <select
                            value={p.justifyContent || 'flex-start'}
                            onChange={(e) => onChange('justifyContent', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                        >
                            <option value="flex-start">Start</option>
                            <option value="center">Center</option>
                            <option value="flex-end">End</option>
                            <option value="space-between">Space Between</option>
                            <option value="space-around">Space Around</option>
                            <option value="space-evenly">Space Evenly</option>
                        </select>
                    </div>

                    {/* Align Items */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Align Items
                        </label>
                        <select
                            value={p.alignItems || 'stretch'}
                            onChange={(e) => onChange('alignItems', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                        >
                            <option value="stretch">Stretch</option>
                            <option value="flex-start">Start</option>
                            <option value="center">Center</option>
                            <option value="flex-end">End</option>
                        </select>
                    </div>

                    {/* Gap */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Items Gap
                        </label>
                        <div className="grid grid-cols-4 gap-1 mb-2">
                            {['0px', '8px', '16px', '24px'].map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => onChange('gap', g)}
                                    className={`py-1 text-xs rounded-md border font-medium transition cursor-pointer text-center ${
                                        (p.gap || '16px') === g
                                            ? 'bg-primary-50 border-primary-600 text-primary-900 font-bold'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={p.gap || ''}
                            onChange={(e) => onChange('gap', e.target.value)}
                            placeholder="e.g. 16px"
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>
                </div>
            );
        }

        case 'HeadingBlock': {
            const p = props as unknown as HeadingBlockProps;
            return (
                <div className="space-y-4">
                    {/* Content */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Heading Text
                        </label>
                        <textarea
                            rows={3}
                            value={p.text || ''}
                            onChange={(e) => onChange('text', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="Enter headline..."
                        />
                    </div>

                    {/* HTML Tag Level */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                            HTML Tag
                        </label>
                        <div className="grid grid-cols-6 gap-1">
                            {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => onChange('tag', tag)}
                                    className={`py-1.5 text-xs uppercase font-bold rounded-lg border transition cursor-pointer text-center ${
                                        (p.tag || 'h2') === tag
                                            ? 'bg-primary-50 border-primary-600 text-primary-900 ring-1 ring-primary-500'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                            Alignment
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                            {[
                                { mode: 'left', icon: AlignLeft, label: 'Left' },
                                { mode: 'center', icon: AlignCenter, label: 'Center' },
                                { mode: 'right', icon: AlignRight, label: 'Right' },
                            ].map((item) => {
                                const IconComp = item.icon;
                                const isSel = (p.align || 'left') === item.mode;
                                return (
                                    <button
                                        key={item.mode}
                                        type="button"
                                        onClick={() => onChange('align', item.mode)}
                                        className={`py-1.5 flex flex-col items-center justify-center rounded-lg border text-xs transition cursor-pointer ${
                                            isSel
                                                ? 'bg-primary-50 border-primary-600 text-primary-900 font-bold ring-1 ring-primary-500'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <IconComp className="w-4 h-4" />
                                        <span className="text-[10px] mt-0.5">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Text Color */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Heading Color
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={p.color || '#0f172a'}
                                onChange={(e) => onChange('color', e.target.value)}
                                className="w-8 h-8 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
                            />
                            <input
                                type="text"
                                value={p.color || ''}
                                onChange={(e) => onChange('color', e.target.value)}
                                placeholder="#0f172a"
                                className="w-full text-xs rounded-lg border-gray-300 p-2 font-mono"
                            />
                        </div>
                    </div>

                    {/* Font Size & Weight */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Font Size
                            </label>
                            <input
                                type="text"
                                value={p.fontSize || ''}
                                onChange={(e) => onChange('fontSize', e.target.value)}
                                placeholder="e.g. 32px"
                                className="w-full text-xs rounded-lg border-gray-300 p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Font Weight
                            </label>
                            <select
                                value={p.fontWeight || '700'}
                                onChange={(e) => onChange('fontWeight', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                            >
                                <option value="400">Regular (400)</option>
                                <option value="500">Medium (500)</option>
                                <option value="600">SemiBold (600)</option>
                                <option value="700">Bold (700)</option>
                                <option value="800">Extra Bold (800)</option>
                                <option value="900">Black (900)</option>
                            </select>
                        </div>
                    </div>
                </div>
            );
        }

        case 'TextBlock': {
            const p = props as unknown as TextBlockProps;
            return (
                <div className="space-y-4">
                    {/* Content */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Paragraph Content
                        </label>
                        <textarea
                            rows={5}
                            value={p.content || ''}
                            onChange={(e) => onChange('content', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="Enter paragraph text..."
                        />
                    </div>

                    {/* Text Alignment */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                            Alignment
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                            {[
                                { mode: 'left', icon: AlignLeft, label: 'Left' },
                                { mode: 'center', icon: AlignCenter, label: 'Center' },
                                { mode: 'right', icon: AlignRight, label: 'Right' },
                                { mode: 'justify', icon: AlignJustify, label: 'Justify' },
                            ].map((item) => {
                                const IconComp = item.icon;
                                const isSel = (p.align || 'left') === item.mode;
                                return (
                                    <button
                                        key={item.mode}
                                        type="button"
                                        onClick={() => onChange('align', item.mode)}
                                        className={`py-1.5 flex flex-col items-center justify-center rounded-lg border text-xs transition cursor-pointer ${
                                            isSel
                                                ? 'bg-primary-50 border-primary-600 text-primary-900 font-bold ring-1 ring-primary-500'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <IconComp className="w-4 h-4" />
                                        <span className="text-[10px] mt-0.5">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Text Color
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={p.color || '#334155'}
                                onChange={(e) => onChange('color', e.target.value)}
                                className="w-8 h-8 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
                            />
                            <input
                                type="text"
                                value={p.color || ''}
                                onChange={(e) => onChange('color', e.target.value)}
                                placeholder="#334155"
                                className="w-full text-xs rounded-lg border-gray-300 p-2 font-mono"
                            />
                        </div>
                    </div>

                    {/* Font Size & Line Height */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Font Size
                            </label>
                            <input
                                type="text"
                                value={p.fontSize || ''}
                                onChange={(e) => onChange('fontSize', e.target.value)}
                                placeholder="e.g. 16px"
                                className="w-full text-xs rounded-lg border-gray-300 p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Line Height
                            </label>
                            <input
                                type="text"
                                value={p.lineHeight || ''}
                                onChange={(e) => onChange('lineHeight', e.target.value)}
                                placeholder="e.g. 1.6"
                                className="w-full text-xs rounded-lg border-gray-300 p-2"
                            />
                        </div>
                    </div>
                </div>
            );
        }

        case 'ImageBlock': {
            const p = props as unknown as ImageBlockProps;
            return (
                <div className="space-y-4">
                    {/* Image URL */}
                    <MediaField
                        label="Image"
                        value={p.imageUrl || ''}
                        onChange={(value) => onChange('imageUrl', value)}
                        placeholder="https://images.unsplash.com/..."
                    />

                    {/* Alt Text */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Alt Text
                        </label>
                        <input
                            type="text"
                            value={p.altText || ''}
                            onChange={(e) => onChange('altText', e.target.value)}
                            placeholder="Image description"
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>

                    {/* Caption */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Caption
                        </label>
                        <input
                            type="text"
                            value={p.caption || ''}
                            onChange={(e) => onChange('caption', e.target.value)}
                            placeholder="Optional caption below image"
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>

                    {/* Link URL */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Click Link URL
                        </label>
                        <input
                            type="text"
                            value={p.linkUrl || ''}
                            onChange={(e) => onChange('linkUrl', e.target.value)}
                            placeholder="https://... or #target"
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>

                    {/* Alignment */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                            Image Alignment
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                            {[
                                { mode: 'left', icon: AlignLeft, label: 'Left' },
                                { mode: 'center', icon: AlignCenter, label: 'Center' },
                                { mode: 'right', icon: AlignRight, label: 'Right' },
                            ].map((item) => {
                                const IconComp = item.icon;
                                const isSel = (p.align || 'center') === item.mode;
                                return (
                                    <button
                                        key={item.mode}
                                        type="button"
                                        onClick={() => onChange('align', item.mode)}
                                        className={`py-1.5 flex flex-col items-center justify-center rounded-lg border text-xs transition cursor-pointer ${
                                            isSel
                                                ? 'bg-primary-50 border-primary-600 text-primary-900 font-bold ring-1 ring-primary-500'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <IconComp className="w-4 h-4" />
                                        <span className="text-[10px] mt-0.5">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Aspect Ratio
                        </label>
                        <select
                            value={p.aspectRatio || 'auto'}
                            onChange={(e) => onChange('aspectRatio', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                        >
                            <option value="auto">Auto</option>
                            <option value="1/1">Square (1:1)</option>
                            <option value="4/3">Landscape (4:3)</option>
                            <option value="16/9">Widescreen (16:9)</option>
                        </select>
                    </div>
                </div>
            );
        }

        case 'ButtonBlock': {
            const p = props as unknown as ButtonBlockProps;
            return (
                <div className="space-y-4">
                    {/* Button Text */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Button Text
                        </label>
                        <input
                            type="text"
                            value={p.text || ''}
                            onChange={(e) => onChange('text', e.target.value)}
                            placeholder="অর্ডার করতে ক্লিক করুন"
                            className="w-full text-xs rounded-lg border-gray-300 p-2 font-bold focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                    </div>

                    {/* Target Selector / URL */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Target / Link URL
                        </label>
                        <input
                            type="text"
                            value={p.target || ''}
                            onChange={(e) => onChange('target', e.target.value)}
                            placeholder="#cod_order_form or https://..."
                            className="w-full text-xs rounded-lg border-gray-300 p-2 font-mono"
                        />
                        <span className="text-[10px] text-gray-400 mt-1 block">
                            Use #cod-checkout to scroll to the form, or a full URL to open another
                            page.
                        </span>
                    </div>

                    {/* Size & Width */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Button Size
                            </label>
                            <select
                                value={p.size || 'md'}
                                onChange={(e) => onChange('size', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                            >
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                                <option value="xl">Extra Large</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Width Mode
                            </label>
                            <select
                                value={p.width || 'auto'}
                                onChange={(e) => onChange('width', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                            >
                                <option value="auto">Auto (Fit Content)</option>
                                <option value="full">Full Width</option>
                            </select>
                        </div>
                    </div>

                    {/* Button Alignment */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                            Button Alignment
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                            {[
                                { mode: 'left', icon: AlignLeft, label: 'Left' },
                                { mode: 'center', icon: AlignCenter, label: 'Center' },
                                { mode: 'right', icon: AlignRight, label: 'Right' },
                            ].map((item) => {
                                const IconComp = item.icon;
                                const isSel = (p.align || 'center') === item.mode;
                                return (
                                    <button
                                        key={item.mode}
                                        type="button"
                                        onClick={() => onChange('align', item.mode)}
                                        className={`py-1.5 flex flex-col items-center justify-center rounded-lg border text-xs transition cursor-pointer ${
                                            isSel
                                                ? 'bg-primary-50 border-primary-600 text-primary-900 font-bold ring-1 ring-primary-500'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <IconComp className="w-4 h-4" />
                                        <span className="text-[10px] mt-0.5">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Background Color & Text Color */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Button Background
                            </label>
                            <div className="flex items-center space-x-1.5">
                                <input
                                    type="color"
                                    value={p.backgroundColor || '#059669'}
                                    onChange={(e) => onChange('backgroundColor', e.target.value)}
                                    className="w-7 h-7 rounded border border-gray-300 p-0.5 cursor-pointer shrink-0"
                                />
                                <input
                                    type="text"
                                    value={p.backgroundColor || ''}
                                    onChange={(e) => onChange('backgroundColor', e.target.value)}
                                    placeholder="#059669"
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5 font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Text Color
                            </label>
                            <div className="flex items-center space-x-1.5">
                                <input
                                    type="color"
                                    value={p.textColor || '#ffffff'}
                                    onChange={(e) => onChange('textColor', e.target.value)}
                                    className="w-7 h-7 rounded border border-gray-300 p-0.5 cursor-pointer shrink-0"
                                />
                                <input
                                    type="text"
                                    value={p.textColor || ''}
                                    onChange={(e) => onChange('textColor', e.target.value)}
                                    placeholder="#ffffff"
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Corner Radius & Pulse Animation */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Border Radius
                            </label>
                            <input
                                type="text"
                                value={p.borderRadius || ''}
                                onChange={(e) => onChange('borderRadius', e.target.value)}
                                placeholder="8px or 9999px"
                                className="w-full text-xs rounded-lg border-gray-300 p-2"
                            />
                        </div>

                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={p.pulseAnimation ?? true}
                                onChange={(e) => onChange('pulseAnimation', e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <span className="text-xs font-semibold text-gray-800 flex items-center">
                                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                                Elementor Pulse Animation
                            </span>
                        </label>
                    </div>
                </div>
            );
        }

        case 'IconListBlock': {
            const p = props as unknown as IconListBlockProps;
            const items = p.items || [];

            const handleUpdateItem = (index: number, key: keyof IconListItem, val: string) => {
                const next = [...items];
                next[index] = { ...next[index], [key]: val };
                onChange('items', next);
            };

            const handleAddItem = () => {
                onChange('items', [
                    ...items,
                    {
                        id: String(Date.now()),
                        text: 'New list item',
                    },
                ]);
            };

            const handleRemoveItem = (index: number) => {
                onChange(
                    'items',
                    items.filter((_, itemIndex) => itemIndex !== index)
                );
            };

            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Section Title
                        </label>
                        <textarea
                            rows={2}
                            value={p.title || ''}
                            onChange={(e) => onChange('title', e.target.value)}
                            placeholder="Title"
                            className="w-full text-xs rounded-lg border-gray-300 p-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            List Style
                        </label>
                        <select
                            value={p.listType || 'ul'}
                            onChange={(e) => onChange('listType', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                        >
                            <option value="ul">Bullet list (ul)</option>
                            <option value="ol">Numbered list (ol)</option>
                        </select>
                    </div>

                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={p.showMarkers !== false}
                            onChange={(e) => onChange('showMarkers', e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        />
                        <span className="text-xs font-semibold text-gray-700">
                            Show list markers
                        </span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={p.showDividers !== false}
                            onChange={(e) => onChange('showDividers', e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        />
                        <span className="text-xs font-semibold text-gray-700">
                            Show card borders
                        </span>
                    </label>

                    <div className="pt-2 border-t border-gray-200">
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-700">Item Spacing</label>
                            <span className="text-[11px] font-bold text-primary-600">
                                {p.itemSpacing ?? 12}px
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={48}
                            step={2}
                            value={p.itemSpacing ?? 12}
                            onChange={(e) => onChange('itemSpacing', Number(e.target.value))}
                            className="w-full accent-primary-600 cursor-pointer"
                        />
                        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                            <span>Compact</span>
                            <span>Spacious</span>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">List Items</span>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                            >
                                <Plus className="w-3.5 h-3.5 mr-0.5" />
                                <span>Add Item</span>
                            </button>
                        </div>

                        {items.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                className="p-2.5 rounded-lg border border-gray-200 space-y-1.5 bg-gray-50/50"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400">
                                        Item #{idx + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="text-gray-400 hover:text-rose-600"
                                        title="Remove item"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <textarea
                                    rows={2}
                                    value={item.text}
                                    placeholder="List item text"
                                    onChange={(e) => handleUpdateItem(idx, 'text', e.target.value)}
                                    className="w-full text-xs rounded border-gray-300 p-1.5"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        case 'ImageCarouselBlock': {
            const p = props as unknown as ImageCarouselBlockProps;
            const images = p.images || [];
            const activeItemsKey =
                viewport === 'mobile'
                    ? 'mobileItemsPerView'
                    : viewport === 'tablet'
                      ? 'tabletItemsPerView'
                      : 'desktopItemsPerView';
            const activeItemsValue =
                viewport === 'mobile'
                    ? (p.mobileItemsPerView ?? 1)
                    : viewport === 'tablet'
                      ? (p.tabletItemsPerView ?? p.desktopItemsPerView ?? 3)
                      : (p.desktopItemsPerView ?? 3);

            const handleUpdateImage = (
                index: number,
                key: keyof ImageCarouselItem,
                val: string
            ) => {
                const next = [...images];
                next[index] = { ...next[index], [key]: val };
                onChange('images', next);
            };

            const handleAddImage = () => {
                onChange('images', [
                    ...images,
                    {
                        id: String(Date.now()),
                        imageUrl: '',
                        altText: `Slide ${images.length + 1}`,
                    },
                ]);
            };

            const handleRemoveImage = (index: number) => {
                onChange(
                    'images',
                    images.filter((_, imageIndex) => imageIndex !== index)
                );
            };

            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Section Title (Optional)
                        </label>
                        <input
                            type="text"
                            value={p.title || ''}
                            onChange={(e) => onChange('title', e.target.value)}
                            placeholder="Product Gallery"
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Items Per View ({DEVICE_LABELS[viewport]})
                        </label>
                        <select
                            value={activeItemsValue}
                            onChange={(e) => onChange(activeItemsKey, Number(e.target.value))}
                            className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                        >
                            {[1, 2, 3, 4, 5, 6].map((count) => (
                                <option key={count} value={count}>
                                    {count} per row
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-[10px] text-gray-400">
                            One control switches with the active device. Inactive devices keep
                            their own saved value.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Gap Between Images
                            </label>
                            <input
                                type="text"
                                value={p.gap || ''}
                                onChange={(e) => onChange('gap', e.target.value)}
                                placeholder="16px"
                                className="w-full text-xs rounded-lg border-gray-300 p-2 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Aspect Ratio
                            </label>
                            <select
                                value={p.aspectRatio || '4 / 3'}
                                onChange={(e) => onChange('aspectRatio', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                            >
                                <option value="1 / 1">Square (1:1)</option>
                                <option value="4 / 3">Landscape (4:3)</option>
                                <option value="16 / 9">Widescreen (16:9)</option>
                                <option value="3 / 4">Portrait (3:4)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Image Fit
                        </label>
                        <select
                            value={p.imageFit || 'cover'}
                            onChange={(e) => onChange('imageFit', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                        >
                            <option value="cover">Cover</option>
                            <option value="contain">Contain</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={p.showArrows ?? true}
                                onChange={(e) => onChange('showArrows', e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <span className="text-xs font-semibold text-gray-700">Arrows</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={p.showDots ?? true}
                                onChange={(e) => onChange('showDots', e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <span className="text-xs font-semibold text-gray-700">Dots</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={p.autoplay ?? false}
                                onChange={(e) => onChange('autoplay', e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <span className="text-xs font-semibold text-gray-700">Autoplay</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={p.loop ?? true}
                                onChange={(e) => onChange('loop', e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <span className="text-xs font-semibold text-gray-700">Loop</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Autoplay Interval (seconds)
                        </label>
                        <input
                            type="number"
                            min={2}
                            max={15}
                            value={Math.round((p.autoplayInterval ?? 4000) / 1000)}
                            onChange={(e) =>
                                onChange(
                                    'autoplayInterval',
                                    Math.min(15000, Math.max(2000, Number(e.target.value) * 1000))
                                )
                            }
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">Images</span>
                            <div className="flex items-center gap-2">
                                <MediaLibraryAddButton
                                    onSelect={(selectedImages) => {
                                        onChange('images', [
                                            ...images,
                                            ...selectedImages.map((item, index) => ({
                                                id: `${Date.now()}_${index}`,
                                                imageUrl: item.url,
                                                altText: item.alt_text || item.name,
                                            })),
                                        ]);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddImage}
                                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-0.5" />
                                    <span>Add Image</span>
                                </button>
                            </div>
                        </div>

                        {images.map((image, idx) => (
                            <div
                                key={image.id || idx}
                                className="p-2.5 rounded-lg border border-gray-200 space-y-1.5 bg-gray-50/50"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400">
                                        Image #{idx + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(idx)}
                                        className="text-gray-400 hover:text-rose-600"
                                        title="Remove image"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <MediaField
                                    label="Image"
                                    value={image.imageUrl}
                                    onChange={(value) => handleUpdateImage(idx, 'imageUrl', value)}
                                    compact
                                    hint="Pick from the media library."
                                />
                                <input
                                    type="text"
                                    value={image.altText || ''}
                                    placeholder="Alt text (SEO / accessibility)"
                                    onChange={(e) =>
                                        handleUpdateImage(idx, 'altText', e.target.value)
                                    }
                                    className="w-full text-xs rounded border-gray-300 p-1.5"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        case 'GridBlock': {
            const p = props as unknown as GridBlockProps;
            const numberValue = (value: string, fallback: number) => {
                const parsed = Number.parseFloat(value);
                return Number.isFinite(parsed) ? parsed : fallback;
            };
            const alignOptions = [
                { label: 'Stretch', value: 'stretch' },
                { label: 'Start', value: 'start' },
                { label: 'Center', value: 'center' },
                { label: 'End', value: 'end' },
            ];
            const activeColumnsKey =
                viewport === 'mobile'
                    ? 'mobileColumns'
                    : viewport === 'tablet'
                      ? 'tabletColumns'
                      : 'columns';
            const activeColumnsValue =
                viewport === 'mobile'
                    ? (p.mobileColumns ?? 1)
                    : viewport === 'tablet'
                      ? (p.tabletColumns ?? Math.min(p.columns ?? 3, 2))
                      : (p.columns ?? 3);

            return (
                <div className="space-y-2">
                    <ControlSection title="Grid Layout" icon={LayoutGrid} defaultOpen>
                        <div className="grid grid-cols-2 gap-1.5">
                            <NumberUnitControl
                                label={`Columns (${DEVICE_LABELS[viewport]})`}
                                value={String(activeColumnsValue)}
                                unit={null}
                                min={1}
                                max={6}
                                step={1}
                                onChange={(value) =>
                                    onChange(activeColumnsKey, numberValue(value, activeColumnsValue))
                                }
                            />
                            <div />
                            <NumberUnitControl
                                label="Column Gap"
                                value={p.columnGap ?? '16px'}
                                unit="px"
                                min={0}
                                max={120}
                                onChange={(value) => onChange('columnGap', value)}
                            />
                            <NumberUnitControl
                                label="Row Gap"
                                value={p.rowGap ?? '16px'}
                                unit="px"
                                min={0}
                                max={120}
                                onChange={(value) => onChange('rowGap', value)}
                            />
                            <SelectControl
                                label="Align Items"
                                value={p.alignItems ?? 'stretch'}
                                options={alignOptions}
                                onChange={(value) => onChange('alignItems', value)}
                            />
                            <SelectControl
                                label="Justify Items"
                                value={p.justifyItems ?? 'stretch'}
                                options={alignOptions}
                                onChange={(value) => onChange('justifyItems', value)}
                            />
                        </div>
                    </ControlSection>
                    <p className="px-1 text-[9px] leading-relaxed text-gray-400">
                        Grid children flow into responsive columns based on the canvas or container
                        width. Use the Layers panel to nest blocks inside.
                    </p>
                </div>
            );
        }

        case 'TestimonialBlock': {
            const p = props as unknown as TestimonialBlockProps;
            const items = resolveTestimonialItems(p);

            const writeItems = (nextItems: TestimonialItem[]) => {
                onChange('items', nextItems);
            };

            const handleUpdateItem = (
                index: number,
                key: keyof TestimonialItem,
                value: unknown
            ) => {
                const next = items.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, [key]: value } : item
                );
                writeItems(next);
            };

            const handleAddItem = () => {
                writeItems([...items, createTestimonialItem()]);
            };

            const handleRemoveItem = (index: number) => {
                if (items.length <= 1) {
                    return;
                }

                writeItems(items.filter((_, itemIndex) => itemIndex !== index));
            };

            return (
                <div className="space-y-2">
                    <ControlSection title="Testimonials" icon={Quote} defaultOpen>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-500">
                                {items.length} testimonial{items.length === 1 ? '' : 's'}
                            </span>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Testimonial</span>
                            </button>
                        </div>

                        {items.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/60 p-2.5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400">
                                        Testimonial #{index + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        disabled={items.length <= 1}
                                        className="text-gray-400 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                                        title={
                                            items.length <= 1
                                                ? 'At least one testimonial is required'
                                                : 'Remove testimonial'
                                        }
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>

                                <TextareaControl
                                    label="Quote"
                                    value={item.quote || ''}
                                    placeholder="Share what the customer said..."
                                    rows={3}
                                    onChange={(value) => handleUpdateItem(index, 'quote', value)}
                                />

                                <div className="grid grid-cols-2 gap-1.5">
                                    <TextControl
                                        label="Author Name"
                                        value={item.authorName || ''}
                                        onChange={(value) =>
                                            handleUpdateItem(index, 'authorName', value)
                                        }
                                    />
                                    <TextControl
                                        label="Role / Label"
                                        value={item.authorRole || ''}
                                        placeholder="Verified Customer"
                                        onChange={(value) =>
                                            handleUpdateItem(index, 'authorRole', value)
                                        }
                                    />
                                    <TextControl
                                        label="Location"
                                        value={item.location || ''}
                                        placeholder="Dhaka"
                                        onChange={(value) =>
                                            handleUpdateItem(index, 'location', value)
                                        }
                                    />
                                    <SelectControl
                                        label="Rating"
                                        value={String(item.rating ?? 5)}
                                        options={[5, 4, 3, 2, 1].map((value) => ({
                                            label: `${value} Star${value === 1 ? '' : 's'}`,
                                            value: String(value),
                                        }))}
                                        onChange={(value) =>
                                            handleUpdateItem(index, 'rating', Number(value))
                                        }
                                    />
                                </div>

                                <MediaField
                                    label="Avatar"
                                    value={item.avatarUrl || ''}
                                    onChange={(value) =>
                                        handleUpdateItem(index, 'avatarUrl', value)
                                    }
                                    placeholder="https://example.com/avatar.jpg"
                                    compact
                                />

                                <ToggleControl
                                    label="Verified Purchase"
                                    checked={item.verifiedPurchase !== false}
                                    onChange={(checked) =>
                                        handleUpdateItem(index, 'verifiedPurchase', checked)
                                    }
                                />
                            </div>
                        ))}
                    </ControlSection>

                    <ControlSection title="Carousel Behavior" icon={Plus} defaultOpen>
                        <div className="grid grid-cols-2 gap-1.5">
                            <ToggleControl
                                label="Auto Scroll"
                                checked={p.autoplay !== false}
                                onChange={(checked) => onChange('autoplay', checked)}
                            />
                            <ToggleControl
                                label="Loop"
                                checked={p.loop !== false}
                                onChange={(checked) => onChange('loop', checked)}
                            />
                            <ToggleControl
                                label="Arrows"
                                checked={p.showArrows !== false}
                                onChange={(checked) => onChange('showArrows', checked)}
                            />
                            <ToggleControl
                                label="Dots"
                                checked={p.showDots !== false}
                                onChange={(checked) => onChange('showDots', checked)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
                                Auto Scroll Interval (seconds)
                            </label>
                            <input
                                type="number"
                                min={2}
                                max={15}
                                value={Math.round((p.autoplayInterval ?? 5000) / 1000)}
                                onChange={(e) =>
                                    onChange(
                                        'autoplayInterval',
                                        Math.min(
                                            15000,
                                            Math.max(2000, Number(e.target.value) * 1000)
                                        )
                                    )
                                }
                                className="w-full rounded-lg border-gray-300 p-2 text-xs"
                            />
                        </div>
                    </ControlSection>

                    <ControlSection title="Testimonial Design" icon={Palette} defaultOpen>
                        <div className="grid grid-cols-2 gap-1.5">
                            <SelectControl
                                label="Layout"
                                value={p.layout ?? 'card'}
                                options={[
                                    { label: 'Card', value: 'card' },
                                    { label: 'Minimal', value: 'minimal' },
                                ]}
                                onChange={(value) => onChange('layout', value)}
                            />
                            <SelectControl
                                label="Star Style"
                                value={p.starStyle ?? 'filled'}
                                options={[
                                    { label: 'Filled', value: 'filled' },
                                    { label: 'Outline', value: 'outline' },
                                ]}
                                onChange={(value) => onChange('starStyle', value)}
                            />
                            <ColorControl
                                label="Accent Color"
                                value={p.accentColor || ''}
                                fallback="#059669"
                                onChange={(value) => onChange('accentColor', value)}
                            />
                            <ColorControl
                                label="Star Color"
                                value={p.starColor || ''}
                                fallback="#059669"
                                onChange={(value) => onChange('starColor', value)}
                            />
                            <ColorControl
                                label="Card Background"
                                value={p.cardBgColor || ''}
                                fallback="#ffffff"
                                onChange={(value) => onChange('cardBgColor', value)}
                            />
                            <ColorControl
                                label="Quote Color"
                                value={p.quoteColor || ''}
                                fallback="#1e293b"
                                onChange={(value) => onChange('quoteColor', value)}
                            />
                            <ColorControl
                                label="Author Color"
                                value={p.authorColor || ''}
                                fallback="#0f172a"
                                onChange={(value) => onChange('authorColor', value)}
                            />
                            <NumberUnitControl
                                label="Star Size"
                                value={p.starSize ?? '16px'}
                                unit="px"
                                min={8}
                                max={48}
                                onChange={(value) => onChange('starSize', value)}
                            />
                            <NumberUnitControl
                                label="Quote Font Size"
                                value={p.quoteFontSize ?? '20px'}
                                unit="px"
                                min={10}
                                max={60}
                                onChange={(value) => onChange('quoteFontSize', value)}
                            />
                            <NumberUnitControl
                                label="Avatar Size"
                                value={p.avatarSize ?? '52px'}
                                unit="px"
                                min={24}
                                max={160}
                                onChange={(value) => onChange('avatarSize', value)}
                            />
                            <NumberUnitControl
                                label="Card Radius"
                                value={p.cardRadius ?? '20px'}
                                unit="px"
                                min={0}
                                max={80}
                                onChange={(value) => onChange('cardRadius', value)}
                            />
                            <NumberUnitControl
                                label="Card Padding"
                                value={p.cardPadding ?? '32px'}
                                unit="px"
                                min={0}
                                max={120}
                                onChange={(value) => onChange('cardPadding', value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            <ToggleControl
                                label="Show Quote Icon"
                                checked={p.showQuoteIcon !== false}
                                onChange={(checked) => onChange('showQuoteIcon', checked)}
                            />
                            <ToggleControl
                                label="Show Rating"
                                checked={p.showRating !== false}
                                onChange={(checked) => onChange('showRating', checked)}
                            />
                        </div>
                    </ControlSection>
                </div>
            );
        }

        default:
            return <div className="text-xs text-gray-400">No properties for this block.</div>;
    }
}

interface BlockStylesFormProps {
    styles: BlockStyles;
    onChange: (key: keyof BlockStyles, value: BlockStyles[keyof BlockStyles]) => void;
    onBatchChange?: (updates: Partial<BlockStyles>) => void;
}

function BlockStylesForm({ styles, onChange, onBatchChange }: BlockStylesFormProps) {
    const batch = (updates: Partial<BlockStyles>) => {
        if (onBatchChange) {
            onBatchChange(updates);
            return;
        }

        (Object.keys(updates) as Array<keyof BlockStyles>).forEach((key) => {
            onChange(key, updates[key]);
        });
    };

    const padding: [string, string, string, string] = [
        styles.paddingTop ?? '',
        styles.paddingRight ?? '',
        styles.paddingBottom ?? '',
        styles.paddingLeft ?? '',
    ];

    const margin: [string, string, string, string] = [
        styles.marginTop ?? '',
        styles.marginRight ?? '',
        styles.marginBottom ?? '',
        styles.marginLeft ?? '',
    ];

    const BACKGROUND_SWATCHES = [
        '#ffffff',
        '#f8fafc',
        '#f3f4f6',
        '#fffbeb',
        '#ecfdf5',
        '#fff1f2',
        '#0f172a',
    ];
    const TEXT_SWATCHES = ['#0f172a', '#475569', '#ffffff', '#059669', '#e11d48', '#d97706'];
    const BUTTON_SWATCHES = ['#059669', '#16a34a', '#2563eb', '#4f46e5', '#dc2626', '#0f172a'];

    const GRADIENT_PRESETS = [
        { name: 'None', gradient: '' },
        { name: 'Slate Dark', gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
        { name: 'Emerald', gradient: 'linear-gradient(135deg, #065f46 0%, #022c22 100%)' },
        { name: 'Sunset', gradient: 'linear-gradient(135deg, #fff1f2 0%, #fef3c7 100%)' },
        { name: 'Cool Ice', gradient: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)' },
        { name: 'Midnight', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' },
    ];

    const SHADOW_PRESETS = [
        { id: 'none', label: 'None', val: 'none' },
        {
            id: 'sm',
            label: 'Soft',
            val: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
        {
            id: 'md',
            label: 'Card',
            val: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
        {
            id: 'lg',
            label: 'Float',
            val: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        },
        {
            id: 'xl',
            label: 'Deep',
            val: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
        {
            id: 'emerald',
            label: 'Glow',
            val: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
        },
    ];

    const WIDTH_PRESETS = [
        { label: 'Full', val: '100%' },
        { label: '1280', val: '1280px' },
        { label: '1024', val: '1024px' },
        { label: '768', val: '768px' },
    ];

    return (
        <div className="space-y-2">
            <ControlSection
                title="Background & Colors"
                icon={Palette}
                description="Solid fill, gradient and text color"
                defaultOpen
            >
                <ColorControl
                    label="Solid Background"
                    value={styles.backgroundColor || ''}
                    fallback="#ffffff"
                    presets={BACKGROUND_SWATCHES}
                    onChange={(value) => batch({ backgroundColor: value, background: '' })}
                />

                <div>
                    <span className="mb-1 block text-[10px] font-semibold text-gray-600">
                        Gradient Presets
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                        {GRADIENT_PRESETS.map((preset) => {
                            const active = (styles.background || '') === preset.gradient;
                            return (
                                <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() =>
                                        batch({
                                            background: preset.gradient,
                                            backgroundColor: preset.gradient
                                                ? 'transparent'
                                                : '#ffffff',
                                        })
                                    }
                                    className={`h-7 truncate rounded-md border px-1 text-[9.5px] font-medium transition ${
                                        active
                                            ? 'border-primary-600 bg-primary-50 font-bold text-primary-900 ring-1 ring-primary-500'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    {preset.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <ColorControl
                    label="Text Color"
                    value={styles.color || ''}
                    fallback="#0f172a"
                    presets={TEXT_SWATCHES}
                    onChange={(value) => onChange('color', value)}
                />
            </ControlSection>

            <ControlSection
                title="Typography & Alignment"
                icon={Type}
                description="Alignment, size, weight and spacing"
                defaultOpen
            >
                <AlignmentControl
                    label="Content Alignment"
                    value={styles.textAlign || 'left'}
                    onChange={(value) => onChange('textAlign', value as BlockStyles['textAlign'])}
                />

                <div className="grid grid-cols-2 gap-1.5">
                    <NumberUnitControl
                        label="Font Size"
                        value={styles.fontSize || ''}
                        unit="px"
                        min={6}
                        max={120}
                        placeholder="Default"
                        onChange={(value) => onChange('fontSize', value)}
                    />
                    <SelectControl
                        label="Font Weight"
                        value={styles.fontWeight || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Regular (400)', value: '400' },
                            { label: 'Medium (500)', value: '500' },
                            { label: 'Semibold (600)', value: '600' },
                            { label: 'Bold (700)', value: '700' },
                            { label: 'Extra Bold (800)', value: '800' },
                        ]}
                        onChange={(value) => onChange('fontWeight', value)}
                    />
                    <NumberUnitControl
                        label="Line Height"
                        value={styles.lineHeight || ''}
                        unit={null}
                        min={0.8}
                        max={3}
                        step={0.05}
                        placeholder="Default"
                        onChange={(value) => onChange('lineHeight', value)}
                    />
                    <NumberUnitControl
                        label="Letter Spacing"
                        value={styles.letterSpacing || ''}
                        units={['px', 'em']}
                        step={0.01}
                        placeholder="0"
                        onChange={(value) => onChange('letterSpacing', value)}
                    />
                </div>
            </ControlSection>

            <ControlSection
                title="Spacing & Dimensions"
                icon={Maximize2}
                description="Width, height, padding and margin"
                defaultOpen
            >
                <div>
                    <span className="mb-1 block text-[10px] font-semibold text-gray-600">
                        Block Width
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                        {[
                            { label: 'Full', val: '100%' },
                            { label: '3/4', val: '75%' },
                            { label: '1/2', val: '50%' },
                            { label: '1/3', val: '33.333%' },
                        ].map((preset) => (
                            <button
                                key={preset.val}
                                type="button"
                                onClick={() => onChange('width', preset.val)}
                                className={`h-6 rounded-md border text-[10px] font-medium transition ${
                                    (styles.width || '100%') === preset.val
                                        ? 'border-primary-600 bg-primary-50 font-bold text-primary-950'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                    <NumberUnitControl
                        label="Custom Width"
                        value={styles.width || ''}
                        units={['px', '%']}
                        min={0}
                        max={2400}
                        placeholder="100%"
                        onChange={(value) => onChange('width', value)}
                    />
                    <div>
                        <span className="mb-1 block text-[10px] font-semibold text-gray-600">
                            Self Alignment
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                            {[
                                { mode: 'left', icon: AlignLeft, label: 'Left' },
                                { mode: 'center', icon: AlignCenter, label: 'Center' },
                                { mode: 'right', icon: AlignRight, label: 'Right' },
                            ].map((item) => {
                                const Icon = item.icon;
                                const selected = (styles.selfAlign || 'left') === item.mode;

                                return (
                                    <button
                                        key={item.mode}
                                        type="button"
                                        title={item.label}
                                        onClick={() =>
                                            onChange(
                                                'selfAlign',
                                                item.mode as BlockStyles['selfAlign']
                                            )
                                        }
                                        className={`flex h-7 items-center justify-center rounded-md border transition ${
                                            selected
                                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div>
                    <span className="mb-1 block text-[10px] font-semibold text-gray-600">
                        Content Max Width
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                        {WIDTH_PRESETS.map((preset) => (
                            <button
                                key={preset.val}
                                type="button"
                                onClick={() => onChange('maxWidth', preset.val)}
                                className={`h-6 rounded-md border text-[10px] font-medium transition ${
                                    (styles.maxWidth || '100%') === preset.val
                                        ? 'border-primary-600 bg-primary-50 font-bold text-primary-950'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                    <NumberUnitControl
                        label="Max Width"
                        value={styles.maxWidth || ''}
                        units={['px', '%']}
                        min={0}
                        max={2400}
                        placeholder="100%"
                        onChange={(value) => onChange('maxWidth', value)}
                    />
                    <NumberUnitControl
                        label="Min Height"
                        value={styles.minHeight || ''}
                        unit="px"
                        min={0}
                        max={2400}
                        placeholder="Optional"
                        onChange={(value) => onChange('minHeight', value)}
                    />
                </div>

                <SpacingControl
                    label="Padding"
                    values={padding}
                    onChange={(values) =>
                        batch({
                            padding: '',
                            paddingTop: values[0],
                            paddingRight: values[1],
                            paddingBottom: values[2],
                            paddingLeft: values[3],
                        })
                    }
                />

                <SpacingControl
                    label="Margin"
                    values={margin}
                    onChange={(values) =>
                        batch({
                            margin: '',
                            marginTop: values[0],
                            marginRight: values[1],
                            marginBottom: values[2],
                            marginLeft: values[3],
                        })
                    }
                />
            </ControlSection>

            <ControlSection
                title="Borders & Corners"
                icon={Square}
                description="Width, style, color and radius"
            >
                <div className="grid grid-cols-2 gap-1.5">
                    <NumberUnitControl
                        label="Border Width"
                        value={styles.borderWidth || ''}
                        unit="px"
                        min={0}
                        max={40}
                        step={0.5}
                        placeholder="0"
                        onChange={(value) => onChange('borderWidth', value)}
                    />
                    <SelectControl
                        label="Border Style"
                        value={styles.borderStyle || 'solid'}
                        options={[
                            { label: 'Solid', value: 'solid' },
                            { label: 'Dashed', value: 'dashed' },
                            { label: 'Dotted', value: 'dotted' },
                            { label: 'None', value: 'none' },
                        ]}
                        onChange={(value) =>
                            onChange('borderStyle', value as BlockStyles['borderStyle'])
                        }
                    />
                    <NumberUnitControl
                        label="Corner Radius"
                        value={styles.borderRadius || ''}
                        units={['px', '%']}
                        min={0}
                        max={9999}
                        placeholder="0"
                        onChange={(value) => onChange('borderRadius', value)}
                    />
                    <ColorControl
                        label="Border Color"
                        value={styles.borderColor || ''}
                        fallback="#e2e8f0"
                        onChange={(value) => onChange('borderColor', value)}
                    />
                </div>
            </ControlSection>

            <ControlSection
                title="Box Shadow & Depth"
                icon={Box}
                description="Elevation presets or a custom shadow"
            >
                <div className="grid grid-cols-3 gap-1">
                    {SHADOW_PRESETS.map((shadow) => {
                        const active = (styles.boxShadow || 'none') === shadow.val;
                        return (
                            <button
                                key={shadow.id}
                                type="button"
                                onClick={() => onChange('boxShadow', shadow.val)}
                                className={`h-7 rounded-md border text-[10px] font-medium transition ${
                                    active
                                        ? 'border-primary-600 bg-primary-50 font-bold text-primary-950 ring-1 ring-primary-500'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                {shadow.label}
                            </button>
                        );
                    })}
                </div>
                <TextControl
                    label="Custom Shadow"
                    value={styles.boxShadow || ''}
                    placeholder="0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                    onChange={(value) => onChange('boxShadow', value)}
                />
            </ControlSection>

            <ControlSection
                title="Action Button & CTA"
                icon={Zap}
                description="Button colors, radius and pulse effect"
                defaultOpen
            >
                <div className="grid grid-cols-2 gap-1.5">
                    <ColorControl
                        label="Button Background"
                        value={styles.buttonBgColor || ''}
                        fallback="#059669"
                        presets={BUTTON_SWATCHES}
                        onChange={(value) => onChange('buttonBgColor', value)}
                    />
                    <ColorControl
                        label="Button Text Color"
                        value={styles.buttonTextColor || ''}
                        fallback="#ffffff"
                        onChange={(value) => onChange('buttonTextColor', value)}
                    />
                    <NumberUnitControl
                        label="Button Radius"
                        value={styles.buttonBorderRadius || ''}
                        units={['px', '%']}
                        min={0}
                        max={9999}
                        placeholder="12"
                        onChange={(value) => onChange('buttonBorderRadius', value)}
                    />
                </div>
                <ToggleControl
                    label="Pulse Animation"
                    checked={Boolean(styles.buttonPulseAnimation)}
                    onChange={(checked) => onChange('buttonPulseAnimation', checked)}
                    hint="Adds a subtle attention animation to the button."
                />
            </ControlSection>
        </div>
    );
}

interface ElementStylesPanelProps {
    blockType: BlockType;
    styles: BlockStyles;
    viewport: ViewportMode;
    onChange: (element: string, key: keyof BlockStyles, value: BlockStyles[keyof BlockStyles]) => void;
    onBatchChange: (element: string, updates: Partial<BlockStyles>) => void;
}

const ADVANCED_CSS_PROPERTIES: Array<{ label: string; value: keyof BlockStyles }> = [
    { label: 'Width', value: 'width' },
    { label: 'Height', value: 'height' },
    { label: 'Min Width', value: 'minWidth' },
    { label: 'Max Width', value: 'maxWidth' },
    { label: 'Min Height', value: 'minHeight' },
    { label: 'Max Height', value: 'maxHeight' },
    { label: 'Display', value: 'display' },
    { label: 'Position', value: 'position' },
    { label: 'Overflow', value: 'overflow' },
    { label: 'Font Family', value: 'fontFamily' },
    { label: 'Font Size', value: 'fontSize' },
    { label: 'Font Weight', value: 'fontWeight' },
    { label: 'Font Style', value: 'fontStyle' },
    { label: 'Line Height', value: 'lineHeight' },
    { label: 'Letter Spacing', value: 'letterSpacing' },
    { label: 'Text Align', value: 'textAlign' },
    { label: 'Text Transform', value: 'textTransform' },
    { label: 'Text Decoration', value: 'textDecoration' },
    { label: 'Text Shadow', value: 'textShadow' },
    { label: 'Color', value: 'color' },
    { label: 'Background Color', value: 'backgroundColor' },
    { label: 'Background', value: 'background' },
    { label: 'Opacity', value: 'opacity' },
    { label: 'Box Shadow', value: 'boxShadow' },
    { label: 'Transform', value: 'transform' },
    { label: 'Filter', value: 'filter' },
    { label: 'Backdrop Filter', value: 'backdropFilter' },
    { label: 'Gap', value: 'gap' },
    { label: 'Row Gap', value: 'rowGap' },
    { label: 'Column Gap', value: 'columnGap' },
    { label: 'Flex Direction', value: 'flexDirection' },
    { label: 'Justify Content', value: 'justifyContent' },
    { label: 'Align Items', value: 'alignItems' },
    { label: 'Align Self', value: 'alignSelf' },
    { label: 'Justify Self', value: 'justifySelf' },
    { label: 'Border Width', value: 'borderWidth' },
    { label: 'Border Style', value: 'borderStyle' },
    { label: 'Border Color', value: 'borderColor' },
    { label: 'Border Radius', value: 'borderRadius' },
    { label: 'Padding Top', value: 'paddingTop' },
    { label: 'Padding Right', value: 'paddingRight' },
    { label: 'Padding Bottom', value: 'paddingBottom' },
    { label: 'Padding Left', value: 'paddingLeft' },
    { label: 'Margin Top', value: 'marginTop' },
    { label: 'Margin Right', value: 'marginRight' },
    { label: 'Margin Bottom', value: 'marginBottom' },
    { label: 'Margin Left', value: 'marginLeft' },
    { label: 'Object Fit', value: 'objectFit' },
    { label: 'Object Position', value: 'objectPosition' },
    { label: 'Aspect Ratio', value: 'aspectRatio' },
    { label: 'Cursor', value: 'cursor' },
    { label: 'List Style', value: 'listStyleType' },
];

function ElementStylesPanel({
    blockType,
    styles,
    viewport,
    onChange,
    onBatchChange,
}: ElementStylesPanelProps) {
    const options = BLOCK_ELEMENT_STYLE_OPTIONS[blockType] || [];
    const [selectedElement, setSelectedElement] = useState(options[0]?.key || '');
    const [customProperty, setCustomProperty] = useState<keyof BlockStyles>('fontSize');

    if (options.length === 0 || !selectedElement) {
        return null;
    }

    const elementStyles = resolveElementStyles(styles, selectedElement, viewport);
    const set = (key: keyof BlockStyles, value: BlockStyles[keyof BlockStyles]) =>
        onChange(selectedElement, key, value);
    const batch = (updates: Partial<BlockStyles>) => onBatchChange(selectedElement, updates);
    const padding: [string, string, string, string] = [
        elementStyles.paddingTop ?? '',
        elementStyles.paddingRight ?? '',
        elementStyles.paddingBottom ?? '',
        elementStyles.paddingLeft ?? '',
    ];
    const margin: [string, string, string, string] = [
        elementStyles.marginTop ?? '',
        elementStyles.marginRight ?? '',
        elementStyles.marginBottom ?? '',
        elementStyles.marginLeft ?? '',
    ];
    const customValue =
        customProperty === 'responsive' || customProperty === 'elements'
            ? ''
            : String(elementStyles[customProperty] ?? '');

    return (
        <ControlSection
            title="Inner Element Styles"
            icon={Type}
            description="Style each element inside this block"
            defaultOpen
        >
            <SelectControl
                label="Element"
                value={selectedElement}
                options={options.map((option) => ({
                    label: option.label,
                    value: option.key,
                }))}
                onChange={setSelectedElement}
                hint={`Editing ${DEVICE_LABELS[viewport].toLowerCase()} values.`}
            />

            <ControlSection title="Typography" icon={Type} defaultOpen>
                <div className="grid grid-cols-2 gap-1.5">
                    <ColorControl
                        label="Text Color"
                        value={elementStyles.color || ''}
                        fallback="#0f172a"
                        onChange={(value) => set('color', value)}
                    />
                    <NumberUnitControl
                        label="Font Size"
                        value={elementStyles.fontSize || ''}
                        units={['px', 'rem', 'em']}
                        placeholder="16"
                        onChange={(value) => set('fontSize', value)}
                    />
                    <NumberUnitControl
                        label="Font Weight"
                        value={elementStyles.fontWeight || ''}
                        unit={null}
                        min={100}
                        max={900}
                        step={100}
                        placeholder="400"
                        onChange={(value) => set('fontWeight', value)}
                    />
                    <NumberUnitControl
                        label="Line Height"
                        value={elementStyles.lineHeight || ''}
                        units={['', 'px', 'rem']}
                        step={0.05}
                        placeholder="1.5"
                        onChange={(value) => set('lineHeight', value)}
                    />
                    <NumberUnitControl
                        label="Letter Spacing"
                        value={elementStyles.letterSpacing || ''}
                        units={['px', 'em']}
                        step={0.01}
                        placeholder="0"
                        onChange={(value) => set('letterSpacing', value)}
                    />
                    <TextControl
                        label="Font Family"
                        value={elementStyles.fontFamily || ''}
                        placeholder="Inter, sans-serif"
                        onChange={(value) => set('fontFamily', value)}
                    />
                </div>
                <AlignmentControl
                    label="Text Align"
                    value={elementStyles.textAlign || 'left'}
                    onChange={(value) =>
                        set('textAlign', value as BlockStyles['textAlign'])
                    }
                />
                <div className="grid grid-cols-2 gap-1.5">
                    <SelectControl
                        label="Text Transform"
                        value={elementStyles.textTransform || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'None', value: 'none' },
                            { label: 'Uppercase', value: 'uppercase' },
                            { label: 'Lowercase', value: 'lowercase' },
                            { label: 'Capitalize', value: 'capitalize' },
                        ]}
                        onChange={(value) => set('textTransform', value)}
                    />
                    <SelectControl
                        label="Font Style"
                        value={elementStyles.fontStyle || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Normal', value: 'normal' },
                            { label: 'Italic', value: 'italic' },
                        ]}
                        onChange={(value) => set('fontStyle', value)}
                    />
                    <SelectControl
                        label="Decoration"
                        value={elementStyles.textDecoration || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'None', value: 'none' },
                            { label: 'Underline', value: 'underline' },
                            { label: 'Line Through', value: 'line-through' },
                        ]}
                        onChange={(value) => set('textDecoration', value)}
                    />
                    <ColorControl
                        label="Decoration Color"
                        value={elementStyles.textDecorationColor || ''}
                        fallback="#0f172a"
                        onChange={(value) => set('textDecorationColor', value)}
                    />
                </div>
            </ControlSection>

            <ControlSection title="Background & Effects" icon={Palette}>
                <div className="grid grid-cols-2 gap-1.5">
                    <ColorControl
                        label="Background Color"
                        value={elementStyles.backgroundColor || ''}
                        fallback="#ffffff"
                        onChange={(value) => set('backgroundColor', value)}
                    />
                    <TextControl
                        label="Background"
                        value={elementStyles.background || ''}
                        placeholder="linear-gradient(...)"
                        onChange={(value) => set('background', value)}
                    />
                    <NumberUnitControl
                        label="Opacity"
                        value={elementStyles.opacity || ''}
                        unit={null}
                        min={0}
                        max={1}
                        step={0.05}
                        placeholder="1"
                        onChange={(value) => set('opacity', value)}
                    />
                    <NumberUnitControl
                        label="Border Radius"
                        value={elementStyles.borderRadius || ''}
                        units={['px', '%']}
                        min={0}
                        max={999}
                        placeholder="12"
                        onChange={(value) => set('borderRadius', value)}
                    />
                </div>
                <TextControl
                    label="Box Shadow"
                    value={elementStyles.boxShadow || ''}
                    placeholder="0 10px 25px rgba(0,0,0,.15)"
                    onChange={(value) => set('boxShadow', value)}
                />
                <div className="grid grid-cols-2 gap-1.5">
                    <TextControl
                        label="Transform"
                        value={elementStyles.transform || ''}
                        placeholder="translateY(-2px)"
                        onChange={(value) => set('transform', value)}
                    />
                    <TextControl
                        label="Filter"
                        value={elementStyles.filter || ''}
                        placeholder="blur(4px)"
                        onChange={(value) => set('filter', value)}
                    />
                    <SelectControl
                        label="Object Fit"
                        value={elementStyles.objectFit || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Cover', value: 'cover' },
                            { label: 'Contain', value: 'contain' },
                            { label: 'Fill', value: 'fill' },
                            { label: 'None', value: 'none' },
                        ]}
                        onChange={(value) => set('objectFit', value)}
                    />
                    <TextControl
                        label="Object Position"
                        value={elementStyles.objectPosition || ''}
                        placeholder="center center"
                        onChange={(value) => set('objectPosition', value)}
                    />
                </div>
            </ControlSection>

            <ControlSection title="Spacing" icon={Maximize2}>
                <SpacingControl
                    label="Padding"
                    values={padding}
                    onChange={(values) =>
                        batch({
                            padding: '',
                            paddingTop: values[0],
                            paddingRight: values[1],
                            paddingBottom: values[2],
                            paddingLeft: values[3],
                        })
                    }
                />
                <SpacingControl
                    label="Margin"
                    values={margin}
                    onChange={(values) =>
                        batch({
                            margin: '',
                            marginTop: values[0],
                            marginRight: values[1],
                            marginBottom: values[2],
                            marginLeft: values[3],
                        })
                    }
                />
            </ControlSection>

            <ControlSection title="Size & Layout" icon={LayoutGrid}>
                <div className="grid grid-cols-2 gap-1.5">
                    <NumberUnitControl
                        label="Width"
                        value={elementStyles.width || ''}
                        units={['px', '%']}
                        placeholder="auto"
                        onChange={(value) => set('width', value)}
                    />
                    <NumberUnitControl
                        label="Height"
                        value={elementStyles.height || ''}
                        units={['px', '%']}
                        placeholder="auto"
                        onChange={(value) => set('height', value)}
                    />
                    <NumberUnitControl
                        label="Min Width"
                        value={elementStyles.minWidth || ''}
                        units={['px', '%']}
                        placeholder="0"
                        onChange={(value) => set('minWidth', value)}
                    />
                    <NumberUnitControl
                        label="Max Width"
                        value={elementStyles.maxWidth || ''}
                        units={['px', '%']}
                        placeholder="none"
                        onChange={(value) => set('maxWidth', value)}
                    />
                    <NumberUnitControl
                        label="Min Height"
                        value={elementStyles.minHeight || ''}
                        units={['px', '%']}
                        placeholder="0"
                        onChange={(value) => set('minHeight', value)}
                    />
                    <NumberUnitControl
                        label="Max Height"
                        value={elementStyles.maxHeight || ''}
                        units={['px', '%']}
                        placeholder="none"
                        onChange={(value) => set('maxHeight', value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    <SelectControl
                        label="Display"
                        value={elementStyles.display || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Block', value: 'block' },
                            { label: 'Inline Block', value: 'inline-block' },
                            { label: 'Flex', value: 'flex' },
                            { label: 'Inline Flex', value: 'inline-flex' },
                            { label: 'Grid', value: 'grid' },
                            { label: 'None', value: 'none' },
                        ]}
                        onChange={(value) => set('display', value)}
                    />
                    <SelectControl
                        label="Flex Direction"
                        value={elementStyles.flexDirection || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Row', value: 'row' },
                            { label: 'Column', value: 'column' },
                        ]}
                        onChange={(value) => set('flexDirection', value)}
                    />
                    <SelectControl
                        label="Justify Content"
                        value={elementStyles.justifyContent || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Start', value: 'flex-start' },
                            { label: 'Center', value: 'center' },
                            { label: 'End', value: 'flex-end' },
                            { label: 'Space Between', value: 'space-between' },
                        ]}
                        onChange={(value) => set('justifyContent', value)}
                    />
                    <SelectControl
                        label="Align Items"
                        value={elementStyles.alignItems || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Stretch', value: 'stretch' },
                            { label: 'Start', value: 'flex-start' },
                            { label: 'Center', value: 'center' },
                            { label: 'End', value: 'flex-end' },
                        ]}
                        onChange={(value) => set('alignItems', value)}
                    />
                    <SelectControl
                        label="Align Self"
                        value={elementStyles.alignSelf || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Auto', value: 'auto' },
                            { label: 'Start', value: 'flex-start' },
                            { label: 'Center', value: 'center' },
                            { label: 'End', value: 'flex-end' },
                            { label: 'Stretch', value: 'stretch' },
                        ]}
                        onChange={(value) => set('alignSelf', value)}
                    />
                    <SelectControl
                        label="Overflow"
                        value={elementStyles.overflow || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Visible', value: 'visible' },
                            { label: 'Hidden', value: 'hidden' },
                            { label: 'Auto', value: 'auto' },
                            { label: 'Scroll', value: 'scroll' },
                        ]}
                        onChange={(value) => set('overflow', value)}
                    />
                    <TextControl
                        label="Gap"
                        value={elementStyles.gap || ''}
                        placeholder="16px"
                        onChange={(value) => set('gap', value)}
                    />
                    <TextControl
                        label="Grid Column"
                        value={elementStyles.gridColumn || ''}
                        placeholder="span 2"
                        onChange={(value) => set('gridColumn', value)}
                    />
                </div>
            </ControlSection>

            <ControlSection title="Borders" icon={Square}>
                <div className="grid grid-cols-2 gap-1.5">
                    <NumberUnitControl
                        label="Border Width"
                        value={elementStyles.borderWidth || ''}
                        unit="px"
                        min={0}
                        max={40}
                        step={0.5}
                        placeholder="0"
                        onChange={(value) => set('borderWidth', value)}
                    />
                    <SelectControl
                        label="Border Style"
                        value={elementStyles.borderStyle || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Solid', value: 'solid' },
                            { label: 'Dashed', value: 'dashed' },
                            { label: 'Dotted', value: 'dotted' },
                            { label: 'None', value: 'none' },
                        ]}
                        onChange={(value) =>
                            set('borderStyle', value as BlockStyles['borderStyle'])
                        }
                    />
                    <ColorControl
                        label="Border Color"
                        value={elementStyles.borderColor || ''}
                        fallback="#e5e7eb"
                        onChange={(value) => set('borderColor', value)}
                    />
                </div>
            </ControlSection>

            <ControlSection
                title="Any CSS Property"
                icon={Code}
                description="Every allowlisted property for this element"
            >
                <SelectControl
                    label="Property"
                    value={String(customProperty)}
                    options={ADVANCED_CSS_PROPERTIES.map((property) => ({
                        label: property.label,
                        value: property.value,
                    }))}
                    onChange={(value) => setCustomProperty(value as keyof BlockStyles)}
                />
                <TextControl
                    label="Value"
                    value={customValue}
                    placeholder="e.g. 18px, #16a34a, 0 8px 24px rgba(0,0,0,.12)"
                    onChange={(value) => set(customProperty, value)}
                />
                <p className="text-[9px] leading-relaxed text-gray-400">
                    Unsafe values (url(), @import, expression(), JavaScript URLs) are rejected.
                </p>
            </ControlSection>
        </ControlSection>
    );
}

interface ProductPickerSectionProps {
    productIds?: number[];
    productId?: number;
    selectionMode?: 'single' | 'multiple';
    defaultSelection?: 'first' | 'all' | 'specific';
    defaultSelectedId?: number;
    showDiscountBadge?: boolean;
    badgeText?: string;
    productBadges?: Record<string | number, string>;
    products: Array<{ id: number; title: string }>;
    onChange: (key: string, value: unknown) => void;
}

function ProductPickerSection({
    productIds = [],
    productId,
    selectionMode = 'single',
    defaultSelection = 'first',
    defaultSelectedId = 0,
    showDiscountBadge = true,
    badgeText = '',
    productBadges = {},
    products,
    onChange,
}: ProductPickerSectionProps) {
    const [search, setSearch] = useState('');

    const selectedIds =
        Array.isArray(productIds) && productIds.length > 0
            ? productIds
            : productId
              ? [productId]
              : [];

    const handleToggleProduct = (id: number) => {
        let next: number[];
        if (selectedIds.includes(id)) {
            next = selectedIds.filter((p) => p !== id);
        } else {
            next = [...selectedIds, id];
        }
        onChange('productIds', next);
        onChange('productId', next[0] || 0);
    };

    const handleSelectAll = () => {
        const allIds = products.map((p) => p.id);
        onChange('productIds', allIds);
        onChange('productId', allIds[0] || 0);
    };

    const handleClearAll = () => {
        onChange('productIds', []);
        onChange('productId', 0);
    };

    const filtered = products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-4">
            {/* Customer Selection Mode Control (Radio vs Checkbox) */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Customer Selection Mode
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                        type="button"
                        onClick={() => onChange('selectionMode', 'single')}
                        className={`p-2 rounded-lg border text-left transition flex flex-col ${
                            selectionMode === 'single'
                                ? 'border-primary-600 bg-primary-50 text-primary-900 font-bold ring-1 ring-primary-500'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <span className="flex items-center">
                            <span className="w-3 h-3 rounded-full border border-primary-600 mr-1.5 flex items-center justify-center">
                                {selectionMode === 'single' && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                )}
                            </span>
                            Radio Style
                        </span>
                        <span className="text-[10px] text-gray-400 font-normal mt-0.5">
                            Customer picks 1 item
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onChange('selectionMode', 'multiple')}
                        className={`p-2 rounded-lg border text-left transition flex flex-col ${
                            selectionMode === 'multiple'
                                ? 'border-primary-600 bg-primary-50 text-primary-900 font-bold ring-1 ring-primary-500'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <span className="flex items-center">
                            <span className="w-3 h-3 rounded border border-primary-600 mr-1.5 flex items-center justify-center text-[10px] leading-none text-primary-600">
                                {selectionMode === 'multiple' && '✓'}
                            </span>
                            Checkbox Style
                        </span>
                        <span className="text-[10px] text-gray-400 font-normal mt-0.5">
                            Customer picks multiple
                        </span>
                    </button>
                </div>
            </div>

            {/* Default Pre-Selected State on Page Load */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-2">
                <label className="block text-xs font-bold text-gray-800">
                    Default Selected on Page Load
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                        type="button"
                        onClick={() => onChange('defaultSelection', 'first')}
                        className={`p-1.5 rounded-md border text-center transition font-medium ${
                            defaultSelection === 'first'
                                ? 'border-primary-600 bg-primary-50 text-primary-900 font-bold'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        First Item Only
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange('defaultSelection', 'all')}
                        className={`p-1.5 rounded-md border text-center transition font-medium ${
                            defaultSelection === 'all'
                                ? 'border-primary-600 bg-primary-50 text-primary-900 font-bold'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        All Items Checked
                    </button>
                </div>

                {selectedIds.length > 1 && (
                    <div className="pt-1">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Or pre-select specific product:
                        </label>
                        <select
                            value={defaultSelectedId || ''}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                onChange('defaultSelectedId', val);
                                if (val > 0) onChange('defaultSelection', 'specific');
                            }}
                            className="w-full text-xs rounded-lg border-gray-300 bg-white p-1.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        >
                            <option value={0}>-- Auto (First Product) --</option>
                            {products
                                .filter((p) => selectedIds.includes(p.id))
                                .map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.title}
                                    </option>
                                ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Product Card Badges & Discount Options */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-2.5">
                <label className="block text-xs font-bold text-gray-800">
                    Card Badges & Pricing Display
                </label>
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="show_discount_badge"
                        checked={showDiscountBadge !== false}
                        onChange={(e) => onChange('showDiscountBadge', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                    />
                    <label
                        htmlFor="show_discount_badge"
                        className="text-xs text-gray-700 cursor-pointer"
                    >
                        Show Discount % Badge (e.g. SAVE ৳...)
                    </label>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Default Highlight Badge
                    </label>
                    <input
                        type="text"
                        value={badgeText || ''}
                        onChange={(e) => onChange('badgeText', e.target.value)}
                        placeholder="e.g. 🔥 Most Popular"
                        className="w-full text-xs rounded-lg border-gray-300 bg-white p-1.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                </div>

                {/* Individual Product Badges */}
                {selectedIds.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 space-y-2">
                        <label className="block text-[11px] font-bold text-gray-700">
                            Custom Product Badges
                        </label>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {selectedIds.map((pid) => {
                                const prod = products.find((p) => p.id === pid);
                                const currentBadge = (productBadges || {})[pid] || '';
                                return (
                                    <div key={pid} className="flex items-center space-x-2 text-xs">
                                        <span
                                            className="w-28 truncate text-[11px] text-gray-600 shrink-0 font-medium"
                                            title={prod?.title}
                                        >
                                            {prod?.title || `Product #${pid}`}:
                                        </span>
                                        <input
                                            type="text"
                                            value={currentBadge}
                                            placeholder="e.g. 🔥 Hot Deal"
                                            onChange={(e) => {
                                                const next = {
                                                    ...(productBadges || {}),
                                                    [pid]: e.target.value,
                                                };
                                                onChange('productBadges', next);
                                            }}
                                            className="flex-1 text-xs rounded border-gray-300 bg-white p-1"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Product Checkbox Selection List */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                        Products ({selectedIds.length} selected for checkout)
                    </label>
                    <div className="space-x-2 text-[11px]">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-primary-600 hover:underline font-medium"
                        >
                            Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="text-gray-500 hover:underline"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {products.length > 5 && (
                    <input
                        type="text"
                        placeholder="Filter products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-1.5 mb-2"
                    />
                )}

                <div className="max-h-44 overflow-y-auto space-y-1 border border-gray-200 rounded-xl p-2 bg-white">
                    {filtered.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-400">
                            No products match search
                        </div>
                    ) : (
                        filtered.map((prod) => {
                            const isChecked = selectedIds.includes(prod.id);
                            return (
                                <label
                                    key={prod.id}
                                    className={`flex items-center space-x-2.5 p-1.5 rounded-lg cursor-pointer text-xs transition ${
                                        isChecked
                                            ? 'bg-primary-50 text-primary-900 font-medium'
                                            : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleProduct(prod.id)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5"
                                    />
                                    <span className="truncate flex-1">{prod.title}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        #{prod.id}
                                    </span>
                                </label>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
