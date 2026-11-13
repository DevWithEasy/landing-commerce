import {
    Clock,
    Code,
    Palette,
    Plus,
    Quote,
    Star,
    Trash2,
    Zap,
} from 'lucide-react';
import { createTestimonialItem, resolveTestimonialItems } from '../../blocks/testimonialItems';
import { CodeEditor } from '../CodeEditor';
import { MediaField } from '../MediaPickerModal';
import {
    ColorControl,
    ControlGrid,
    ControlSection,
    NumberUnitControl,
    SelectControl,
    SettingsNotice,
    SliderControl,
    TextControl,
    TextareaControl,
    ToggleControl,
} from '../controls';
import type { BlockInspectorProps } from './LayoutAndBasicInspectors';
import type {
    CountdownTimerBlockProps,
    HtmlBlockProps,
    ReviewItem,
    ReviewsBlockProps,
    StickyBarBlockProps,
    TestimonialBlockProps,
    TestimonialItem,
} from '@/types';

export function ReviewsBlockInspector({
    props: p,
    onChange,
}: BlockInspectorProps<ReviewsBlockProps>) {
    const items = p.items || [];

    const handleUpdateReview = (index: number, key: keyof ReviewItem, val: unknown) => {
        const next = [...items];
        next[index] = { ...next[index], [key]: val };
        onChange('items', next);
    };

    const handleAddReview = () => {
        onChange('items', [
            ...items,
            {
                id: String(Date.now()),
                authorName: 'Customer Name',
                location: 'Dhaka',
                rating: 5,
                comment: 'Very pleased with my purchase!',
                verifiedPurchase: true,
            },
        ]);
    };

    const handleRemoveReview = (index: number) => {
        onChange(
            'items',
            items.filter((_, i) => i !== index)
        );
    };

    return (
        <div className="space-y-2">
            <ControlSection title="Reviews Header" icon={Star} defaultOpen>
                <TextControl
                    label="Section Title"
                    value={p.title || ''}
                    placeholder="Verified Customer Reviews"
                    onChange={(value) => onChange('title', value)}
                />
            </ControlSection>

            <ControlSection title="Star Rating Design" icon={Palette} defaultOpen>
                <ControlGrid>
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
                </ControlGrid>
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

            <ControlSection
                title={`Reviews (${items.length})`}
                icon={Star}
                defaultOpen
                action={
                    <button
                        type="button"
                        onClick={handleAddReview}
                        className="inline-flex items-center gap-0.5 rounded bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 hover:bg-primary-100"
                    >
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                    </button>
                }
            >
                <div className="space-y-2">
                    {items.map((rev, idx) => (
                        <div
                            key={rev.id || idx}
                            className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50/60 p-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400">
                                    Review #{idx + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveReview(idx)}
                                    className="text-gray-400 transition hover:text-rose-600"
                                    title="Remove review"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                            <ControlGrid>
                                <TextControl
                                    value={rev.authorName}
                                    placeholder="Name"
                                    onChange={(value) =>
                                        handleUpdateReview(idx, 'authorName', value)
                                    }
                                />
                                <TextControl
                                    value={rev.location || ''}
                                    placeholder="City/District"
                                    onChange={(value) =>
                                        handleUpdateReview(idx, 'location', value)
                                    }
                                />
                            </ControlGrid>
                            <TextareaControl
                                rows={2}
                                value={rev.comment}
                                placeholder="Review comment"
                                onChange={(value) => handleUpdateReview(idx, 'comment', value)}
                            />
                        </div>
                    ))}
                </div>
            </ControlSection>
        </div>
    );
}

export function TestimonialBlockInspector({
    props: p,
    onChange,
}: BlockInspectorProps<TestimonialBlockProps>) {
    const items = resolveTestimonialItems(p);

    const writeItems = (nextItems: TestimonialItem[]) => {
        onChange('items', nextItems);
    };

    const handleUpdateItem = (index: number, key: keyof TestimonialItem, value: unknown) => {
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
            <ControlSection
                title={`Testimonials (${items.length})`}
                icon={Quote}
                defaultOpen
                action={
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="inline-flex items-center gap-0.5 rounded bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 hover:bg-primary-100"
                    >
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                    </button>
                }
            >
                <div className="space-y-2">
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

                            <ControlGrid>
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
                            </ControlGrid>

                            <MediaField
                                label="Avatar"
                                value={item.avatarUrl || ''}
                                onChange={(value) => handleUpdateItem(index, 'avatarUrl', value)}
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
                </div>
            </ControlSection>

            <ControlSection title="Carousel Behavior" icon={Zap} defaultOpen>
                <ControlGrid>
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
                </ControlGrid>
                <SliderControl
                    label="Auto Scroll Interval (sec)"
                    value={String(Math.round((p.autoplayInterval ?? 5000) / 1000))}
                    unit="s"
                    min={2}
                    max={15}
                    step={1}
                    onChange={(value) => {
                        const secs = Number.parseInt(value, 10) || 5;
                        onChange(
                            'autoplayInterval',
                            Math.min(15000, Math.max(2000, secs * 1000))
                        );
                    }}
                />
            </ControlSection>

            <ControlSection title="Testimonial Design" icon={Palette}>
                <ControlGrid>
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
                </ControlGrid>
                <ControlGrid>
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
                </ControlGrid>
            </ControlSection>
        </div>
    );
}

export function CountdownTimerBlockInspector({
    props: p,
    onChange,
}: BlockInspectorProps<CountdownTimerBlockProps>) {
    return (
        <div className="space-y-2">
            <ControlSection title="Timer & Urgency" icon={Clock} defaultOpen>
                <div>
                    <span className="mb-0.5 block text-[10px] font-semibold text-gray-600">
                        Target End Date & Time
                    </span>
                    <input
                        type="datetime-local"
                        value={p.targetDate ? p.targetDate.slice(0, 16) : ''}
                        onChange={(e) => {
                            if (!e.target.value) {
                                onChange('targetDate', '');
                                return;
                            }
                            onChange('targetDate', new Date(e.target.value).toISOString());
                        }}
                        className="h-7 w-full rounded-md border border-gray-300 bg-white px-2 text-[11px] text-gray-800 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                </div>

                <TextControl
                    label="Headline"
                    value={p.headline || ''}
                    placeholder="Limited Time Offer Ends In:"
                    onChange={(value) => onChange('headline', value)}
                />

                <TextControl
                    label="Urgency Note"
                    value={p.urgencyText || ''}
                    placeholder="Hurry! Only a few items left at this price."
                    onChange={(value) => onChange('urgencyText', value)}
                />

                <TextControl
                    label="Expiration Message"
                    value={p.expiryMessage || ''}
                    placeholder="Offer has expired."
                    onChange={(value) => onChange('expiryMessage', value)}
                />
            </ControlSection>
        </div>
    );
}

export function StickyBarBlockInspector({
    props: p,
    onChange,
}: BlockInspectorProps<StickyBarBlockProps>) {
    return (
        <div className="space-y-2">
            <ControlSection title="Sticky Bar Content" icon={Zap} defaultOpen>
                <TextControl
                    label="Message Text"
                    value={p.message || ''}
                    placeholder="Special Offer — Order Now & Save 20%!"
                    onChange={(value) => onChange('message', value)}
                />

                <TextControl
                    label="Button Text"
                    value={p.buttonText || ''}
                    placeholder="Order Now"
                    onChange={(value) => onChange('buttonText', value)}
                />

                <TextControl
                    label="Button Target"
                    value={p.buttonTarget || ''}
                    placeholder="#cod-checkout"
                    onChange={(value) => onChange('buttonTarget', value)}
                />

                <SelectControl
                    label="Screen Placement"
                    value={p.placement || 'bottom'}
                    options={[
                        { label: 'Bottom of Screen', value: 'bottom' },
                        { label: 'Top of Screen', value: 'top' },
                    ]}
                    onChange={(value) => onChange('placement', value)}
                />
            </ControlSection>
        </div>
    );
}

export function HtmlBlockInspector({
    block,
    props: p,
    onChange,
}: BlockInspectorProps<HtmlBlockProps>) {
    return (
        <div className="space-y-3">
            <SettingsNotice>
                Write valid HTML markup and scoped CSS classes. The canvas previews changes live as
                you type.
            </SettingsNotice>

            <div>
                <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10.5px] font-bold text-gray-800">
                        <Code className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Custom HTML Code</span>
                    </span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[9.5px] text-gray-500">
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
                <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-gray-800">
                        Custom Scoped CSS
                    </span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[9.5px] text-emerald-700">
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

            <SettingsNotice tone="warning">
                For security, &lt;script&gt; tags and inline event handlers (onclick, onerror) are
                blocked by the AST validator.
            </SettingsNotice>
        </div>
    );
}
