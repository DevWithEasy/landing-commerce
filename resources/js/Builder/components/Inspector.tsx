import { AlignLeft, Palette, Plus, Sliders, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useBuilderStore } from '../stores/useBuilderStore';
import type {
    BenefitItem,
    BenefitsGridBlockProps,
    Block,
    BlockDefinition,
    BlockStyles,
    BlockType,
    CodCheckoutBlockProps,
    CountdownTimerBlockProps,
    FaqBlockProps,
    FaqItem,
    HeroBlockProps,
    ProductSelectorBlockProps,
    ReviewItem,
    ReviewsBlockProps,
    StickyBarBlockProps,
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
}

export function Inspector({ blockDefinitions, products }: InspectorProps) {
    const { ast, selectedBlockId, setSelectedBlockId, updateBlockProps, updateBlockStyles } =
        useBuilderStore();

    const [activeTab, setActiveTab] = useState<'content' | 'styles'>('content');

    const selectedBlock = ast.blocks.find((b) => b.id === selectedBlockId);

    if (!selectedBlock) {
        return (
            <aside className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col items-center justify-center text-center text-gray-400 select-none">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                    <Sliders className="w-6 h-6 text-gray-300" />
                </div>
                <h4 className="text-sm font-bold text-gray-700">No Block Selected</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                    Click any block on the canvas or layers tree to configure its properties and
                    styles.
                </p>
            </aside>
        );
    }

    const def = blockDefinitions[selectedBlock.type];
    const styles = selectedBlock.styles || {};

    const handlePropChange = (key: string, value: unknown) => {
        updateBlockProps(selectedBlock.id, { [key]: value });
    };

    const handleStyleChange = (key: keyof BlockStyles, value: string) => {
        updateBlockStyles(selectedBlock.id, { [key]: value });
    };

    return (
        <aside className="w-80 sm:w-88 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-4rem)] select-none">
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

                <button
                    type="button"
                    onClick={() => setSelectedBlockId(null)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/50"
                    title="Close Inspector"
                >
                    <X className="w-4 h-4" />
                </button>
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
                    <BlockStylesForm styles={styles} onChange={handleStyleChange} />
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
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Headline
                        </label>
                        <textarea
                            rows={2}
                            value={p.headline || ''}
                            onChange={(e) => onChange('headline', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Subheadline
                        </label>
                        <textarea
                            rows={2}
                            value={p.subheadline || ''}
                            onChange={(e) => onChange('subheadline', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Badge Text
                        </label>
                        <input
                            type="text"
                            value={p.badgeText || ''}
                            onChange={(e) => onChange('badgeText', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                CTA Button
                            </label>
                            <input
                                type="text"
                                value={p.ctaText || ''}
                                onChange={(e) => onChange('ctaText', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                CTA Target
                            </label>
                            <input
                                type="text"
                                value={p.ctaTarget || ''}
                                onChange={(e) => onChange('ctaTarget', e.target.value)}
                                className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Image URL
                        </label>
                        <input
                            type="url"
                            value={p.imageUrl || ''}
                            onChange={(e) => onChange('imageUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Image Position
                        </label>
                        <select
                            value={p.imagePosition || 'right'}
                            onChange={(e) => onChange('imagePosition', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        >
                            <option value="right">Right</option>
                            <option value="left">Left</option>
                            <option value="background">Background Overlay</option>
                        </select>
                    </div>
                </div>
            );
        }

        case 'ProductSelectorBlock': {
            const p = props as unknown as ProductSelectorBlockProps;
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Product
                        </label>
                        <select
                            value={p.productId || ''}
                            onChange={(e) => onChange('productId', Number(e.target.value))}
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        >
                            <option value={0}>-- Select Product --</option>
                            {products.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                    {prod.title} (ID: {prod.id})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
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
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Target Product
                        </label>
                        <select
                            value={p.productId || ''}
                            onChange={(e) => onChange('productId', Number(e.target.value))}
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        >
                            <option value={0}>-- Select Product --</option>
                            {products.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                    {prod.title} (ID: {prod.id})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Submit Button Text
                        </label>
                        <input
                            type="text"
                            value={p.buttonText || ''}
                            onChange={(e) => onChange('buttonText', e.target.value)}
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-2"
                        />
                    </div>
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

        default:
            return <div className="text-xs text-gray-400">No properties for this block.</div>;
    }
}

interface BlockStylesFormProps {
    styles: BlockStyles;
    onChange: (key: keyof BlockStyles, value: string) => void;
}

function BlockStylesForm({ styles, onChange }: BlockStylesFormProps) {
    return (
        <div className="space-y-4 text-xs">
            <div>
                <label className="block font-bold text-gray-700 mb-1">Background Color</label>
                <div className="flex items-center space-x-2">
                    <input
                        type="color"
                        value={styles.backgroundColor || '#ffffff'}
                        onChange={(e) => onChange('backgroundColor', e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                        type="text"
                        value={styles.backgroundColor || ''}
                        onChange={(e) => onChange('backgroundColor', e.target.value)}
                        placeholder="#ffffff"
                        className="w-full text-xs rounded border-gray-300 p-1.5 font-mono"
                    />
                </div>
            </div>

            <div>
                <label className="block font-bold text-gray-700 mb-1">Text Color</label>
                <div className="flex items-center space-x-2">
                    <input
                        type="color"
                        value={styles.color || '#000000'}
                        onChange={(e) => onChange('color', e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                        type="text"
                        value={styles.color || ''}
                        onChange={(e) => onChange('color', e.target.value)}
                        placeholder="#000000"
                        className="w-full text-xs rounded border-gray-300 p-1.5 font-mono"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                <div>
                    <label className="block font-bold text-gray-700 mb-1">Padding Top</label>
                    <input
                        type="text"
                        value={styles.paddingTop || ''}
                        onChange={(e) => onChange('paddingTop', e.target.value)}
                        placeholder="40px"
                        className="w-full text-xs rounded border-gray-300 p-1.5"
                    />
                </div>
                <div>
                    <label className="block font-bold text-gray-700 mb-1">Padding Bottom</label>
                    <input
                        type="text"
                        value={styles.paddingBottom || ''}
                        onChange={(e) => onChange('paddingBottom', e.target.value)}
                        placeholder="40px"
                        className="w-full text-xs rounded border-gray-300 p-1.5"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block font-bold text-gray-700 mb-1">Margin Top</label>
                    <input
                        type="text"
                        value={styles.marginTop || ''}
                        onChange={(e) => onChange('marginTop', e.target.value)}
                        placeholder="0px"
                        className="w-full text-xs rounded border-gray-300 p-1.5"
                    />
                </div>
                <div>
                    <label className="block font-bold text-gray-700 mb-1">Margin Bottom</label>
                    <input
                        type="text"
                        value={styles.marginBottom || ''}
                        onChange={(e) => onChange('marginBottom', e.target.value)}
                        placeholder="0px"
                        className="w-full text-xs rounded border-gray-300 p-1.5"
                    />
                </div>
            </div>

            <div>
                <label className="block font-bold text-gray-700 mb-1">Border Radius</label>
                <input
                    type="text"
                    value={styles.borderRadius || ''}
                    onChange={(e) => onChange('borderRadius', e.target.value)}
                    placeholder="12px"
                    className="w-full text-xs rounded border-gray-300 p-1.5"
                />
            </div>
        </div>
    );
}
