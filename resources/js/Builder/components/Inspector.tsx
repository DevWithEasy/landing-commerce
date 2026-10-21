import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Box,
    ChevronDown,
    ChevronUp,
    Code,
    Maximize2,
    Palette,
    Plus,
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
import { findBlockInTree, useBuilderStore } from '../stores/useBuilderStore';
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
    TextBlockProps,
    VideoBlockProps,
} from '@/types';

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
    const { ast, selectedBlockId, setSelectedBlockId, updateBlockProps, updateBlockStyles } =
        useBuilderStore();

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
    const styles = selectedBlock.styles || {};

    const handlePropChange = (key: string, value: unknown) => {
        updateBlockProps(selectedBlock.id, { [key]: value });
    };

    const handleStyleChange = (
        key: keyof BlockStyles,
        value: BlockStyles[keyof BlockStyles]
    ) => {
        updateBlockStyles(selectedBlock.id, { [key]: value } as Partial<BlockStyles>);
    };

    const handleBatchStyleChange = (updates: Partial<BlockStyles>) => {
        updateBlockStyles(selectedBlock.id, updates);
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
                        title="পেজ সেটিংস (Page Settings)"
                    >
                        <Palette className="w-3.5 h-3.5" />
                        <span>পেজ সেটিংস</span>
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
                        onChange={handlePropChange}
                    />
                ) : (
                    <div className="space-y-3">
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
                    </div>
                )}
            </div>
        </aside>
    );
}

interface BlockPropsFormProps {
    block: Block;
    products: Array<{ id: number; title: string }>;
    onChange: (key: string, value: unknown) => void;
}

function BlockPropsForm({ block, products, onChange }: BlockPropsFormProps) {
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
                                Headline (হেডলাইন ডিজাইন)
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
                                Subheadline (সাব-হেডলাইন ডিজাইন)
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
                                        onChange={(e) => onChange('subheadlineColor', e.target.value)}
                                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={p.subheadlineColor || ''}
                                        onChange={(e) => onChange('subheadlineColor', e.target.value)}
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
                                    onChange={(e) => onChange('subheadlineFontSize', e.target.value)}
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
                                Badge Tag (টপ ব্যাজ ডিজাইন)
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
                                CTA Button (বাটন ডিজাইন)
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
                                    <option value="sm">Small (ছোট)</option>
                                    <option value="md">Medium (মাঝারি)</option>
                                    <option value="lg">Large (বড়)</option>
                                    <option value="xl">Extra Large (বিশাল)</option>
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
                                    <option value="auto">Auto (ফিট কনটেন্ট)</option>
                                    <option value="full">Full Width (সম্পূর্ণ চওড়া)</option>
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
                                        onChange={(e) => onChange('buttonTextColor', e.target.value)}
                                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={p.buttonTextColor || ''}
                                        onChange={(e) => onChange('buttonTextColor', e.target.value)}
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
                                    <option value="9999px">Pill (সম্পূর্ণ গোল)</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-2 pt-4">
                                <input
                                    type="checkbox"
                                    id="hero_btn_pulse"
                                    checked={Boolean(p.buttonPulseAnimation)}
                                    onChange={(e) => onChange('buttonPulseAnimation', e.target.checked)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="hero_btn_pulse" className="text-xs text-gray-700 font-semibold cursor-pointer">
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
                                Showcase Image (ইমেজ সেটিংস)
                            </span>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Image URL
                            </label>
                            <input
                                type="url"
                                value={p.imageUrl || ''}
                                onChange={(e) => onChange('imageUrl', e.target.value)}
                                placeholder="https://..."
                                className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                Image Position
                            </label>
                            <select
                                value={p.imagePosition || 'right'}
                                onChange={(e) => onChange('imagePosition', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2 bg-white"
                            >
                                <option value="right">Right Side (ডানে)</option>
                                <option value="left">Left Side (বামে)</option>
                                <option value="background">Background Overlay (ব্যাকগ্রাউন্ডে)</option>
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
                            Order Button Text (প্রতিটি কার্ডের বাটন টেক্সট)
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
                            <span>Form Fields (লেবেল ও প্লেসহোল্ডার)</span>
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
                                Submit Button Text (অর্ডার বাটন):
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
                            <span>কাস্টম HTML ও CSS এডিটর</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                            এখানে আপনার ইচ্ছামতো যেকোনো HTML কোড ও কাস্টম CSS ক্লাস লিখুন। কোড লেখার সাথে সাথে বামপাশের ক্যানভাসে তা লাইভ প্রিভিউ হবে।
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
                            placeholder={"<div class='my-card'>\n  <h2>Special Title</h2>\n  <p>Your description...</p>\n</div>"}
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
                            placeholder={'.my-card {\n  background: #ffffff;\n  border-radius: 12px;\n  padding: 20px;\n}'}
                        />
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 leading-normal">
                        <strong className="block font-semibold mb-0.5">নিরাপত্তা নীতিমালা:</strong>
                        নিরাপত্তাজনিত কারণে &lt;script&gt; ট্যাগ বা ইনলাইন ইভেন্ট হ্যান্ডলার (যেমন onclick, onerror) ব্লক করা থাকবে। আপনি সকল বৈধ HTML এলিমেন্ট এবং TailwindCSS ক্লাস ব্যবহার করতে পারবেন।
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
                            Direction (দিক নির্দেশনা)
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
                            Flex Wrap (র‌্যাপ মোড)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'nowrap', label: 'No Wrap' },
                                { value: 'wrap', label: 'Wrap (নতুন লাইনে)' },
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
                            Justify Content (প্রধান অক্ষ বরাবর সাজানো)
                        </label>
                        <select
                            value={p.justifyContent || 'flex-start'}
                            onChange={(e) => onChange('justifyContent', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                        >
                            <option value="flex-start">Start (শুরুতে)</option>
                            <option value="center">Center (মাঝখানে)</option>
                            <option value="flex-end">End (শেষে)</option>
                            <option value="space-between">Space Between (মাঝখানে সমান ফাঁকা)</option>
                            <option value="space-around">Space Around (চারপাশে সমান ফাঁকা)</option>
                            <option value="space-evenly">Space Evenly (সমান দূরত্ব)</option>
                        </select>
                    </div>

                    {/* Align Items */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Align Items (লম্বালম্বি প্রান্তিককরণ)
                        </label>
                        <select
                            value={p.alignItems || 'stretch'}
                            onChange={(e) => onChange('alignItems', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                        >
                            <option value="stretch">Stretch (পুরো দৈর্ঘ্য)</option>
                            <option value="flex-start">Start (শুরুতে)</option>
                            <option value="center">Center (মাঝখানে)</option>
                            <option value="flex-end">End (শেষে)</option>
                        </select>
                    </div>

                    {/* Gap */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Items Gap (উপাদানগুলোর ব্যবধান)
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
                            HTML Tag (হেডিং লেভেল)
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
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Image URL (ছবির লিংক)
                        </label>
                        <input
                            type="url"
                            value={p.imageUrl || ''}
                            onChange={(e) => onChange('imageUrl', e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full text-xs rounded-lg border-gray-300 p-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                    </div>

                    {/* Alt Text */}
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            Alt Text (ছবির বিবরণ / SEO)
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
                            Caption (ক্যাপশন)
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
                            Click Link URL (ক্লিক করলে যে লিংকে যাবে)
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
                            Aspect Ratio (অনুপাত)
                        </label>
                        <select
                            value={p.aspectRatio || 'auto'}
                            onChange={(e) => onChange('aspectRatio', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                        >
                            <option value="auto">Auto (স্বাভাবিক মাপ)</option>
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
                            Button Text (বাটনের লেখা)
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
                            Target / Link URL (টার্গেট বা লিংক)
                        </label>
                        <input
                            type="text"
                            value={p.target || ''}
                            onChange={(e) => onChange('target', e.target.value)}
                            placeholder="#cod_order_form or https://..."
                            className="w-full text-xs rounded-lg border-gray-300 p-2 font-mono"
                        />
                        <span className="text-[10px] text-gray-400 mt-1 block">
                            যেমন #cod_checkout_form দিলে স্ক্রোল করে ফর্ম দেখাবে, বা পূর্ণ URL দিলে সেই পেজে যাবে।
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
                                <option value="auto">Auto (লেখার মাপ অনুযায়ী)</option>
                                <option value="full">Full Width (পুরো প্রস্থ)</option>
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
                            Section Title (শিরোনাম)
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
                            List Style (তালিকার ধরন)
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
                            Show list markers (বুলেট/নম্বর)
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
                            <label className="text-xs font-bold text-gray-700">
                                Item Spacing
                            </label>
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
                                    onChange={(e) =>
                                        handleUpdateItem(idx, 'text', e.target.value)
                                    }
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
                            Section Title (ঐচ্ছিক)
                        </label>
                        <input
                            type="text"
                            value={p.title || ''}
                            onChange={(e) => onChange('title', e.target.value)}
                            placeholder="Product Gallery"
                            className="w-full text-xs rounded-lg border-gray-300 p-2"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Desktop Items
                            </label>
                            <select
                                value={p.desktopItemsPerView ?? 3}
                                onChange={(e) =>
                                    onChange('desktopItemsPerView', Number(e.target.value))
                                }
                                className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                            >
                                {[1, 2, 3, 4, 5, 6].map((count) => (
                                    <option key={count} value={count}>
                                        {count} per row
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Mobile Items
                            </label>
                            <select
                                value={p.mobileItemsPerView ?? 1}
                                onChange={(e) =>
                                    onChange('mobileItemsPerView', Number(e.target.value))
                                }
                                className="w-full text-xs rounded-lg border-gray-300 p-2 bg-white cursor-pointer"
                            >
                                {[1, 2, 3, 4].map((count) => (
                                    <option key={count} value={count}>
                                        {count} per row
                                    </option>
                                ))}
                            </select>
                        </div>
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
                            <option value="cover">Cover (সব জায়গা ভরবে)</option>
                            <option value="contain">Contain (পুরো ছবি দেখা যাবে)</option>
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
                            <button
                                type="button"
                                onClick={handleAddImage}
                                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                            >
                                <Plus className="w-3.5 h-3.5 mr-0.5" />
                                <span>Add Image</span>
                            </button>
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
                                <input
                                    type="url"
                                    value={image.imageUrl}
                                    placeholder="https://example.com/image.jpg"
                                    onChange={(e) =>
                                        handleUpdateImage(idx, 'imageUrl', e.target.value)
                                    }
                                    className="w-full text-xs rounded border-gray-300 p-1.5"
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
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        background: true,
        typography: true,
        spacing: true,
        borders: false,
        shadows: false,
        button: true,
    });

    const toggleSection = (sec: string) => {
        setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
    };

    const BG_SWATCHES = [
        { name: 'White', color: '#ffffff' },
        { name: 'Slate Light', color: '#f8fafc' },
        { name: 'Gray', color: '#f3f4f6' },
        { name: 'Cream', color: '#fffbeb' },
        { name: 'Emerald Soft', color: '#ecfdf5' },
        { name: 'Rose Soft', color: '#fff1f2' },
        { name: 'Slate Dark', color: '#0f172a' },
    ];

    const GRADIENT_PRESETS = [
        { name: 'None', gradient: '' },
        { name: 'Slate Dark', gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
        { name: 'Emerald Luxury', gradient: 'linear-gradient(135deg, #065f46 0%, #022c22 100%)' },
        { name: 'Sunset Warm', gradient: 'linear-gradient(135deg, #fff1f2 0%, #fef3c7 100%)' },
        { name: 'Cool Ice', gradient: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)' },
        { name: 'Midnight', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' },
    ];

    const TEXT_SWATCHES = [
        { name: 'Dark Slate', color: '#0f172a' },
        { name: 'Muted', color: '#475569' },
        { name: 'Pure White', color: '#ffffff' },
        { name: 'Emerald Brand', color: '#059669' },
        { name: 'Crimson', color: '#e11d48' },
        { name: 'Amber', color: '#d97706' },
    ];

    const SHADOW_PRESETS = [
        { id: 'none', label: 'None', val: 'none' },
        { id: 'sm', label: 'Soft', val: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
        { id: 'md', label: 'Card', val: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
        { id: 'lg', label: 'Float', val: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
        { id: 'xl', label: 'Deep Glow', val: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
        { id: 'emerald', label: 'Brand Glow', val: '0 10px 25px -5px rgba(16, 185, 129, 0.3)' },
    ];

    return (
        <div className="space-y-3 text-xs">
            {/* 1. Background & Colors */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                    type="button"
                    onClick={() => toggleSection('background')}
                    className="w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-gray-100/70 flex items-center justify-between text-left font-bold text-gray-800 transition cursor-pointer"
                >
                    <div className="flex items-center space-x-2">
                        <Palette className="w-3.5 h-3.5 text-primary-600" />
                        <span>Background & Colors</span>
                    </div>
                    {openSections.background ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {openSections.background && (
                    <div className="p-3.5 space-y-3.5">
                        {/* Background Color with Swatches */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="font-semibold text-gray-700">Solid Background</label>
                                <span className="font-mono text-[10px] text-gray-400">{styles.backgroundColor || '#ffffff'}</span>
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                                <input
                                    type="color"
                                    value={styles.backgroundColor || '#ffffff'}
                                    onChange={(e) => {
                                        if (onBatchChange) {
                                            onBatchChange({ backgroundColor: e.target.value, background: '' });
                                        } else {
                                            onChange('backgroundColor', e.target.value);
                                        }
                                    }}
                                    className="w-8 h-8 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
                                />
                                <input
                                    type="text"
                                    value={styles.backgroundColor || ''}
                                    onChange={(e) => onChange('backgroundColor', e.target.value)}
                                    placeholder="#ffffff"
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5 font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                            </div>

                            {/* Quick Swatches */}
                            <div className="flex items-center gap-1.5 pt-1">
                                {BG_SWATCHES.map((sw, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        title={sw.name}
                                        onClick={() => {
                                            if (onBatchChange) {
                                                onBatchChange({ backgroundColor: sw.color, background: '' });
                                            } else {
                                                onChange('backgroundColor', sw.color);
                                            }
                                        }}
                                        style={{ backgroundColor: sw.color }}
                                        className={`w-6 h-6 rounded-full border border-gray-300 shadow-2xs transition hover:scale-110 cursor-pointer ${
                                            styles.backgroundColor === sw.color ? 'ring-2 ring-primary-500 ring-offset-1' : ''
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Gradient Presets */}
                        <div className="pt-2 border-t border-gray-100">
                            <label className="block font-semibold text-gray-700 mb-1.5">Gradient Presets</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {GRADIENT_PRESETS.map((gp, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            if (onBatchChange) {
                                                onBatchChange({
                                                    background: gp.gradient,
                                                    backgroundColor: gp.gradient ? 'transparent' : '#ffffff',
                                                });
                                            } else {
                                                onChange('background', gp.gradient);
                                            }
                                        }}
                                        className={`p-1.5 rounded-lg border text-[10px] font-medium text-center truncate transition cursor-pointer ${
                                            (styles.background || '') === gp.gradient
                                                ? 'border-primary-600 bg-primary-50 text-primary-900 font-bold ring-1 ring-primary-500'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                                        }`}
                                    >
                                        {gp.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Typography & Alignment */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                    type="button"
                    onClick={() => toggleSection('typography')}
                    className="w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-gray-100/70 flex items-center justify-between text-left font-bold text-gray-800 transition cursor-pointer"
                >
                    <div className="flex items-center space-x-2">
                        <Type className="w-3.5 h-3.5 text-primary-600" />
                        <span>Typography & Alignment</span>
                    </div>
                    {openSections.typography ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {openSections.typography && (
                    <div className="p-3.5 space-y-3.5">
                        {/* Text Alignment */}
                        <div>
                            <label className="block font-semibold text-gray-700 mb-1.5">Content Alignment</label>
                            <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-lg">
                                {[
                                    { mode: 'left', icon: AlignLeft, label: 'Left' },
                                    { mode: 'center', icon: AlignCenter, label: 'Center' },
                                    { mode: 'right', icon: AlignRight, label: 'Right' },
                                    { mode: 'justify', icon: AlignJustify, label: 'Justify' },
                                ].map((item) => {
                                    const IconComponent = item.icon;
                                    const isSel = (styles.textAlign || 'left') === item.mode;
                                    return (
                                        <button
                                            key={item.mode}
                                            type="button"
                                            onClick={() => onChange('textAlign', item.mode)}
                                            className={`py-1.5 flex flex-col items-center justify-center rounded-md transition cursor-pointer ${
                                                isSel ? 'bg-white shadow-xs text-primary-700 font-bold' : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                        >
                                            <IconComponent className="w-4 h-4" />
                                            <span className="text-[9px] mt-0.5">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Text Color */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="font-semibold text-gray-700">Text Color</label>
                                <span className="font-mono text-[10px] text-gray-400">{styles.color || '#000000'}</span>
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                                <input
                                    type="color"
                                    value={styles.color || '#000000'}
                                    onChange={(e) => onChange('color', e.target.value)}
                                    className="w-8 h-8 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
                                />
                                <input
                                    type="text"
                                    value={styles.color || ''}
                                    onChange={(e) => onChange('color', e.target.value)}
                                    placeholder="#000000"
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5 font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                            </div>

                            <div className="flex items-center gap-1.5">
                                {TEXT_SWATCHES.map((sw, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        title={sw.name}
                                        onClick={() => onChange('color', sw.color)}
                                        style={{ backgroundColor: sw.color }}
                                        className={`w-5 h-5 rounded-full border border-gray-300 shadow-2xs transition hover:scale-110 cursor-pointer ${
                                            styles.color === sw.color ? 'ring-2 ring-primary-500 ring-offset-1' : ''
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Font Size & Weight */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Font Size</label>
                                <select
                                    value={styles.fontSize || ''}
                                    onChange={(e) => onChange('fontSize', e.target.value)}
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5 bg-white cursor-pointer"
                                >
                                    <option value="">Default</option>
                                    <option value="14px">Small (14px)</option>
                                    <option value="16px">Medium (16px)</option>
                                    <option value="18px">Large (18px)</option>
                                    <option value="20px">XL (20px)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Font Weight</label>
                                <select
                                    value={styles.fontWeight || ''}
                                    onChange={(e) => onChange('fontWeight', e.target.value)}
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5 bg-white cursor-pointer"
                                >
                                    <option value="">Default</option>
                                    <option value="400">Regular (400)</option>
                                    <option value="500">Medium (500)</option>
                                    <option value="600">SemiBold (600)</option>
                                    <option value="700">Bold (700)</option>
                                    <option value="800">Extra Bold (800)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Spacing & Dimensions */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                    type="button"
                    onClick={() => toggleSection('spacing')}
                    className="w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-gray-100/70 flex items-center justify-between text-left font-bold text-gray-800 transition cursor-pointer"
                >
                    <div className="flex items-center space-x-2">
                        <Maximize2 className="w-3.5 h-3.5 text-primary-600" />
                        <span>Spacing & Dimensions</span>
                    </div>
                    {openSections.spacing ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {openSections.spacing && (
                    <div className="p-3.5 space-y-3.5">
                        {/* Container Max Width */}
                        <div>
                            <label className="block font-semibold text-gray-700 mb-1.5">Section Width</label>
                            <div className="grid grid-cols-4 gap-1">
                                {[
                                    { label: 'Full', val: '100%' },
                                    { label: '1280px', val: '1280px' },
                                    { label: '1024px', val: '1024px' },
                                    { label: '768px', val: '768px' },
                                ].map((item) => (
                                    <button
                                        key={item.val}
                                        type="button"
                                        onClick={() => onChange('maxWidth', item.val)}
                                        className={`py-1 rounded-md border text-[11px] font-medium transition cursor-pointer ${
                                            (styles.maxWidth || '100%') === item.val
                                                ? 'bg-primary-50 border-primary-600 text-primary-950 font-bold'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section Min Height */}
                        <div>
                            <label className="block text-[11px] text-gray-500 mb-0.5">Section Min Height</label>
                            <input
                                type="text"
                                value={styles.minHeight || ''}
                                onChange={(e) => onChange('minHeight', e.target.value)}
                                placeholder="e.g. 480px (optional)"
                                className="w-full text-xs rounded-lg border-gray-300 p-1.5"
                            />
                        </div>

                        {/* Vertical Padding Presets */}
                        <div>
                            <label className="block font-semibold text-gray-700 mb-1.5">Vertical Padding Presets</label>
                            <div className="grid grid-cols-4 gap-1 mb-2">
                                {[
                                    { label: 'None', val: '0px' },
                                    { label: 'Compact', val: '24px' },
                                    { label: 'Standard', val: '48px' },
                                    { label: 'Spacious', val: '80px' },
                                ].map((pad) => (
                                    <button
                                        key={pad.val}
                                        type="button"
                                        onClick={() => {
                                            if (onBatchChange) {
                                                onBatchChange({ paddingTop: pad.val, paddingBottom: pad.val });
                                            } else {
                                                onChange('paddingTop', pad.val);
                                                onChange('paddingBottom', pad.val);
                                            }
                                        }}
                                        className={`py-1 rounded-md border text-[11px] font-medium transition cursor-pointer ${
                                            styles.paddingTop === pad.val && styles.paddingBottom === pad.val
                                                ? 'bg-primary-50 border-primary-600 text-primary-950 font-bold'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                    >
                                        {pad.label}
                                    </button>
                                ))}
                            </div>

                            {/* Fine tuning */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] text-gray-500 mb-0.5">Top Padding</label>
                                    <input
                                        type="text"
                                        value={styles.paddingTop || ''}
                                        onChange={(e) => onChange('paddingTop', e.target.value)}
                                        placeholder="e.g. 48px"
                                        className="w-full text-xs rounded-lg border-gray-300 p-1.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-gray-500 mb-0.5">Bottom Padding</label>
                                    <input
                                        type="text"
                                        value={styles.paddingBottom || ''}
                                        onChange={(e) => onChange('paddingBottom', e.target.value)}
                                        placeholder="e.g. 48px"
                                        className="w-full text-xs rounded-lg border-gray-300 p-1.5"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Margins */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-0.5">Top Margin</label>
                                <input
                                    type="text"
                                    value={styles.marginTop || ''}
                                    onChange={(e) => onChange('marginTop', e.target.value)}
                                    placeholder="0px"
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-0.5">Bottom Margin</label>
                                <input
                                    type="text"
                                    value={styles.marginBottom || ''}
                                    onChange={(e) => onChange('marginBottom', e.target.value)}
                                    placeholder="0px"
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Borders & Corners */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                    type="button"
                    onClick={() => toggleSection('borders')}
                    className="w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-gray-100/70 flex items-center justify-between text-left font-bold text-gray-800 transition cursor-pointer"
                >
                    <div className="flex items-center space-x-2">
                        <Square className="w-3.5 h-3.5 text-primary-600" />
                        <span>Borders & Corners</span>
                    </div>
                    {openSections.borders ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {openSections.borders && (
                    <div className="p-3.5 space-y-3">
                        {/* Border Radius Presets */}
                        <div>
                            <label className="block font-semibold text-gray-700 mb-1.5">Corner Radius</label>
                            <div className="grid grid-cols-5 gap-1 mb-2">
                                {[
                                    { label: '0px', val: '0px' },
                                    { label: '8px', val: '8px' },
                                    { label: '16px', val: '16px' },
                                    { label: '24px', val: '24px' },
                                    { label: 'Pill', val: '9999px' },
                                ].map((item) => (
                                    <button
                                        key={item.val}
                                        type="button"
                                        onClick={() => onChange('borderRadius', item.val)}
                                        className={`py-1 rounded-md border text-[10px] font-medium transition cursor-pointer ${
                                            styles.borderRadius === item.val
                                                ? 'bg-primary-50 border-primary-600 text-primary-950 font-bold'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={styles.borderRadius || ''}
                                onChange={(e) => onChange('borderRadius', e.target.value)}
                                placeholder="Custom radius e.g. 16px"
                                className="w-full text-xs rounded-lg border-gray-300 p-1.5"
                            />
                        </div>

                        {/* Border Width & Style */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                            <div>
                                <label className="block text-[11px] text-gray-600 mb-1">Border Width</label>
                                <select
                                    value={styles.borderWidth || ''}
                                    onChange={(e) => onChange('borderWidth', e.target.value)}
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5 bg-white cursor-pointer"
                                >
                                    <option value="">None (0px)</option>
                                    <option value="1px">1px</option>
                                    <option value="2px">2px</option>
                                    <option value="4px">4px</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-600 mb-1">Border Style</label>
                                <select
                                    value={styles.borderStyle || 'solid'}
                                    onChange={(e) => onChange('borderStyle', e.target.value)}
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5 bg-white cursor-pointer"
                                >
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>
                                    <option value="none">None</option>
                                </select>
                            </div>
                        </div>

                        {/* Border Color */}
                        {Boolean(styles.borderWidth && styles.borderWidth !== '0px') && (
                            <div>
                                <label className="block text-[11px] text-gray-600 mb-1">Border Color</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={styles.borderColor || '#e2e8f0'}
                                        onChange={(e) => onChange('borderColor', e.target.value)}
                                        className="w-7 h-7 rounded border border-gray-300 p-0.5 cursor-pointer shrink-0"
                                    />
                                    <input
                                        type="text"
                                        value={styles.borderColor || ''}
                                        onChange={(e) => onChange('borderColor', e.target.value)}
                                        placeholder="#e2e8f0"
                                        className="w-full text-xs rounded-lg border-gray-300 p-1.5 font-mono"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 5. Box Shadow & Depth */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                    type="button"
                    onClick={() => toggleSection('shadows')}
                    className="w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-gray-100/70 flex items-center justify-between text-left font-bold text-gray-800 transition cursor-pointer"
                >
                    <div className="flex items-center space-x-2">
                        <Box className="w-3.5 h-3.5 text-primary-600" />
                        <span>Box Shadow & Depth</span>
                    </div>
                    {openSections.shadows ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {openSections.shadows && (
                    <div className="p-3.5 space-y-2">
                        <div className="grid grid-cols-3 gap-1.5">
                            {SHADOW_PRESETS.map((sh) => (
                                <button
                                    key={sh.id}
                                    type="button"
                                    onClick={() => onChange('boxShadow', sh.val)}
                                    className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                                        (styles.boxShadow || 'none') === sh.val
                                            ? 'border-primary-600 bg-primary-50 text-primary-950 font-bold ring-1 ring-primary-500'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                                    }`}
                                >
                                    <span className="text-[11px] block">{sh.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 6. Button & CTA Styling */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                    type="button"
                    onClick={() => toggleSection('button')}
                    className="w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-gray-100/70 flex items-center justify-between text-left font-bold text-gray-800 transition cursor-pointer"
                >
                    <div className="flex items-center space-x-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Action Button & CTA</span>
                    </div>
                    {openSections.button ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {openSections.button && (
                    <div className="p-3.5 space-y-3.5">
                        {/* Button Color */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="font-semibold text-gray-700">Button Background</label>
                                <span className="font-mono text-[10px] text-gray-400">{styles.buttonBgColor || '#059669'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={styles.buttonBgColor || '#059669'}
                                    onChange={(e) => onChange('buttonBgColor', e.target.value)}
                                    className="w-8 h-8 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
                                />
                                <input
                                    type="text"
                                    value={styles.buttonBgColor || ''}
                                    onChange={(e) => onChange('buttonBgColor', e.target.value)}
                                    placeholder="#059669 (Emerald)"
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5 font-mono"
                                />
                            </div>
                        </div>

                        {/* Button Text Color */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="font-semibold text-gray-700">Button Text Color</label>
                                <span className="font-mono text-[10px] text-gray-400">{styles.buttonTextColor || '#ffffff'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={styles.buttonTextColor || '#ffffff'}
                                    onChange={(e) => onChange('buttonTextColor', e.target.value)}
                                    className="w-8 h-8 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
                                />
                                <input
                                    type="text"
                                    value={styles.buttonTextColor || ''}
                                    onChange={(e) => onChange('buttonTextColor', e.target.value)}
                                    placeholder="#ffffff"
                                    className="w-full text-xs rounded-lg border-gray-300 p-1.5 font-mono"
                                />
                            </div>
                        </div>

                        {/* Elementor Pulse Animation Switch */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <div>
                                <label htmlFor="btn-pulse-toggle" className="font-bold text-gray-800 text-xs flex items-center space-x-1 cursor-pointer">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Elementor Pulse Effect</span>
                                </label>
                                <p className="text-[10px] text-gray-400"> বাউন্স/পালস অ্যানিমেশন দিয়ে কাস্টমারের দৃষ্টি আকর্ষণ করুন</p>
                            </div>
                            <input
                                type="checkbox"
                                id="btn-pulse-toggle"
                                checked={Boolean(styles.buttonPulseAnimation)}
                                onChange={(e) => onChange('buttonPulseAnimation', e.target.checked)}
                                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
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

    const filtered = products.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
    );

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
                    <label htmlFor="show_discount_badge" className="text-xs text-gray-700 cursor-pointer">
                        Show Discount % Badge (e.g. SAVE ৳...)
                    </label>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Default Highlight Badge (ডিফল্ট ব্যাজ টেক্সট)
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
                            Custom Product Badges (আলাদা আলাদা প্রোডাক্টের ব্যাজ):
                        </label>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {selectedIds.map((pid) => {
                                const prod = products.find((p) => p.id === pid);
                                const currentBadge = (productBadges || {})[pid] || '';
                                return (
                                    <div key={pid} className="flex items-center space-x-2 text-xs">
                                        <span className="w-28 truncate text-[11px] text-gray-600 shrink-0 font-medium" title={prod?.title}>
                                            {prod?.title || `Product #${pid}`}:
                                        </span>
                                        <input
                                            type="text"
                                            value={currentBadge}
                                            placeholder="যেমন: 🔥 Hot Deal"
                                            onChange={(e) => {
                                                const next = { ...(productBadges || {}), [pid]: e.target.value };
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

