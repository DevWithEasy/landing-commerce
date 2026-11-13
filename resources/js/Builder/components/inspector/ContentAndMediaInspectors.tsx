import {
    AlignLeft,
    ChevronDown,
    HelpCircle,
    Image as ImageIcon,
    Images,
    ListChecks,
    Plus,
    ShieldCheck,
    Sparkles,
    Trash2,
    Type,
    Video,
    Zap,
} from 'lucide-react';
import { DEVICE_LABELS } from '../../styleSystem';
import { MediaField, MediaLibraryAddButton } from '../MediaPickerModal';
import {
    AlignmentControl,
    ColorControl,
    ControlGrid,
    ControlSection,
    SelectControl,
    SliderControl,
    TextControl,
    TextareaControl,
    ToggleControl,
} from '../controls';
import type { BlockInspectorProps } from './LayoutAndBasicInspectors';
import type {
    AccordionBlockProps,
    AccordionItem,
    BenefitItem,
    BenefitsGridBlockProps,
    FaqBlockProps,
    FaqItem,
    HeroBlockProps,
    IconListBlockProps,
    IconListItem,
    ImageCarouselBlockProps,
    ImageCarouselItem,
    VideoBlockProps,
} from '@/types';

const HERO_BUTTON_SWATCHES = ['#16a34a', '#059669', '#2563eb', '#dc2626', '#0f172a'];

export function HeroBlockInspector({ props: p, onChange }: BlockInspectorProps<HeroBlockProps>) {
    return (
        <div className="space-y-2">
            <ControlSection title="Headline" icon={Type} defaultOpen>
                <TextareaControl
                    label="Text Content"
                    value={p.headline || ''}
                    rows={2}
                    placeholder="Main hero headline..."
                    onChange={(value) => onChange('headline', value)}
                />

                <ControlGrid>
                    <ColorControl
                        label="Text Color"
                        value={p.headlineColor || ''}
                        fallback="#0f172a"
                        onChange={(value) => onChange('headlineColor', value)}
                    />
                    <SelectControl
                        label="Font Size"
                        value={p.headlineFontSize || ''}
                        options={[
                            { label: 'Default (Responsive)', value: '' },
                            { label: 'Small (24px)', value: '24px' },
                            { label: 'Medium (32px)', value: '32px' },
                            { label: 'Large (40px)', value: '40px' },
                            { label: 'Extra Large (48px)', value: '48px' },
                            { label: 'Huge (56px)', value: '56px' },
                            { label: 'Display (64px)', value: '64px' },
                        ]}
                        onChange={(value) => onChange('headlineFontSize', value)}
                    />
                </ControlGrid>

                <SelectControl
                    label="Font Weight"
                    value={p.headlineFontWeight || ''}
                    options={[
                        { label: 'Default (Extrabold 800)', value: '' },
                        { label: 'Semibold (600)', value: '600' },
                        { label: 'Bold (700)', value: '700' },
                        { label: 'Extra Bold (800)', value: '800' },
                        { label: 'Black (900)', value: '900' },
                    ]}
                    onChange={(value) => onChange('headlineFontWeight', value)}
                />

                <AlignmentControl
                    label="Headline Alignment"
                    value={p.headlineAlign || 'left'}
                    onChange={(value) => onChange('headlineAlign', value)}
                />
            </ControlSection>

            <ControlSection title="Subheadline" icon={AlignLeft}>
                <TextareaControl
                    label="Text Content"
                    value={p.subheadline || ''}
                    rows={2}
                    placeholder="Supporting hero description..."
                    onChange={(value) => onChange('subheadline', value)}
                />

                <ControlGrid>
                    <ColorControl
                        label="Text Color"
                        value={p.subheadlineColor || ''}
                        fallback="#475569"
                        onChange={(value) => onChange('subheadlineColor', value)}
                    />
                    <SelectControl
                        label="Font Size"
                        value={p.subheadlineFontSize || ''}
                        options={[
                            { label: 'Default (16-18px)', value: '' },
                            { label: '14px', value: '14px' },
                            { label: '16px', value: '16px' },
                            { label: '18px', value: '18px' },
                            { label: '20px', value: '20px' },
                            { label: '22px', value: '22px' },
                        ]}
                        onChange={(value) => onChange('subheadlineFontSize', value)}
                    />
                </ControlGrid>
            </ControlSection>

            <ControlSection title="Badge Tag" icon={Sparkles}>
                <TextControl
                    label="Badge Text"
                    value={p.badgeText || ''}
                    placeholder="e.g. Limited Stock Offer"
                    onChange={(value) => onChange('badgeText', value)}
                />

                <ControlGrid>
                    <ColorControl
                        label="Text Color"
                        value={p.badgeTextColor || ''}
                        fallback="#1e40af"
                        onChange={(value) => onChange('badgeTextColor', value)}
                    />
                    <ColorControl
                        label="Background"
                        value={p.badgeBgColor || ''}
                        fallback="#dbeafe"
                        onChange={(value) => onChange('badgeBgColor', value)}
                    />
                </ControlGrid>
            </ControlSection>

            <ControlSection title="CTA Button" icon={Zap} defaultOpen>
                <ControlGrid>
                    <TextControl
                        label="Button Text"
                        value={p.ctaText || ''}
                        placeholder="Order Now"
                        onChange={(value) => onChange('ctaText', value)}
                    />
                    <TextControl
                        label="Action Target"
                        value={p.ctaTarget || ''}
                        placeholder="#cod-checkout"
                        onChange={(value) => onChange('ctaTarget', value)}
                    />
                    <SelectControl
                        label="Button Size"
                        value={p.buttonSize || 'lg'}
                        options={[
                            { label: 'Small', value: 'sm' },
                            { label: 'Medium', value: 'md' },
                            { label: 'Large', value: 'lg' },
                            { label: 'Extra Large', value: 'xl' },
                        ]}
                        onChange={(value) => onChange('buttonSize', value)}
                    />
                    <SelectControl
                        label="Button Width"
                        value={p.buttonWidth || 'auto'}
                        options={[
                            { label: 'Auto (Fit)', value: 'auto' },
                            { label: 'Full Width', value: 'full' },
                        ]}
                        onChange={(value) => onChange('buttonWidth', value)}
                    />
                    <ColorControl
                        label="Background"
                        value={p.buttonBgColor || ''}
                        fallback="#16a34a"
                        presets={HERO_BUTTON_SWATCHES}
                        onChange={(value) => onChange('buttonBgColor', value)}
                    />
                    <ColorControl
                        label="Text Color"
                        value={p.buttonTextColor || ''}
                        fallback="#ffffff"
                        onChange={(value) => onChange('buttonTextColor', value)}
                    />
                </ControlGrid>

                <SelectControl
                    label="Corner Radius"
                    value={p.buttonBorderRadius || '12px'}
                    options={[
                        { label: 'Square (0px)', value: '0px' },
                        { label: 'Small (6px)', value: '6px' },
                        { label: 'Rounded (12px)', value: '12px' },
                        { label: 'Large (16px)', value: '16px' },
                        { label: 'Pill (9999px)', value: '9999px' },
                    ]}
                    onChange={(value) => onChange('buttonBorderRadius', value)}
                />

                <ToggleControl
                    label="Pulse Animation"
                    checked={Boolean(p.buttonPulseAnimation)}
                    onChange={(checked) => onChange('buttonPulseAnimation', checked)}
                />
            </ControlSection>

            <ControlSection title="Showcase Image" icon={ImageIcon} defaultOpen>
                <MediaField
                    label="Image"
                    value={p.imageUrl || ''}
                    onChange={(value) => onChange('imageUrl', value)}
                    placeholder="https://..."
                    hint="Choose an uploaded image or paste a URL."
                />

                <SelectControl
                    label="Image Position"
                    value={p.imagePosition || 'right'}
                    options={[
                        { label: 'Right Side', value: 'right' },
                        { label: 'Left Side', value: 'left' },
                        { label: 'Background Overlay', value: 'background' },
                    ]}
                    onChange={(value) => onChange('imagePosition', value)}
                />
            </ControlSection>
        </div>
    );
}

export function BenefitsGridBlockInspector({
    props: p,
    onChange,
}: BlockInspectorProps<BenefitsGridBlockProps>) {
    const items = p.items || [];

    const handleUpdateItem = (index: number, key: keyof BenefitItem, val: string) => {
        const next = [...items];
        next[index] = { ...next[index], [key]: val };
        onChange('items', next);
    };

    const handleAddItem = () => {
        onChange('items', [
            ...items,
            {
                id: String(Date.now()),
                title: 'New Benefit',
                description: 'Benefit detail explanation.',
            },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        onChange(
            'items',
            items.filter((_, i) => i !== index)
        );
    };

    return (
        <div className="space-y-2">
            <ControlSection title="Grid Settings" icon={ShieldCheck} defaultOpen>
                <TextControl
                    label="Section Title"
                    value={p.title || ''}
                    placeholder="Why Choose Us?"
                    onChange={(value) => onChange('title', value)}
                />
                <SelectControl
                    label="Columns"
                    value={String(p.columns || 3)}
                    options={[
                        { label: '2 Columns', value: '2' },
                        { label: '3 Columns', value: '3' },
                        { label: '4 Columns', value: '4' },
                    ]}
                    onChange={(value) => onChange('columns', Number(value))}
                />
            </ControlSection>

            <ControlSection
                title={`Benefit Cards (${items.length})`}
                icon={Sparkles}
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
                    {items.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50/60 p-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400">
                                    Card #{idx + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="text-gray-400 transition hover:text-rose-600"
                                    title="Remove card"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                            <TextControl
                                value={item.title}
                                placeholder="Title"
                                onChange={(value) => handleUpdateItem(idx, 'title', value)}
                            />
                            <TextareaControl
                                rows={2}
                                value={item.description}
                                placeholder="Description"
                                onChange={(value) => handleUpdateItem(idx, 'description', value)}
                            />
                        </div>
                    ))}
                </div>
            </ControlSection>
        </div>
    );
}

export function IconListBlockInspector({
    props: p,
    onChange,
}: BlockInspectorProps<IconListBlockProps>) {
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
        <div className="space-y-2">
            <ControlSection title="List Settings" icon={ListChecks} defaultOpen>
                <TextareaControl
                    label="Section Title"
                    rows={2}
                    value={p.title || ''}
                    placeholder="Title"
                    onChange={(value) => onChange('title', value)}
                />

                <SelectControl
                    label="List Style"
                    value={p.listType || 'ul'}
                    options={[
                        { label: 'Bullet list (ul)', value: 'ul' },
                        { label: 'Numbered list (ol)', value: 'ol' },
                    ]}
                    onChange={(value) => onChange('listType', value)}
                />

                <ToggleControl
                    label="Show list markers"
                    checked={p.showMarkers !== false}
                    onChange={(checked) => onChange('showMarkers', checked)}
                />

                <ToggleControl
                    label="Show card borders"
                    checked={p.showDividers !== false}
                    onChange={(checked) => onChange('showDividers', checked)}
                />

                <SliderControl
                    label="Item Spacing"
                    value={String(p.itemSpacing ?? 12)}
                    unit="px"
                    min={0}
                    max={48}
                    step={2}
                    onChange={(value) => onChange('itemSpacing', Number.parseInt(value, 10) || 0)}
                />
            </ControlSection>

            <ControlSection
                title={`List Items (${items.length})`}
                icon={ListChecks}
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
                    {items.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50/60 p-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400">
                                    Item #{idx + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="text-gray-400 transition hover:text-rose-600"
                                    title="Remove item"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                            <TextareaControl
                                rows={2}
                                value={item.text}
                                placeholder="List item text"
                                onChange={(value) => handleUpdateItem(idx, 'text', value)}
                            />
                        </div>
                    ))}
                </div>
            </ControlSection>
        </div>
    );
}

export function AccordionBlockInspector({
    props: p,
    onChange,
}: BlockInspectorProps<AccordionBlockProps>) {
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
        <div className="space-y-2">
            <ControlSection title="Accordion Heading" icon={ChevronDown} defaultOpen>
                <TextControl
                    label="Section Title"
                    value={p.title || ''}
                    placeholder="Title"
                    onChange={(value) => onChange('title', value)}
                />
            </ControlSection>

            <ControlSection
                title={`Accordion Items (${items.length})`}
                icon={ChevronDown}
                defaultOpen
                action={
                    <button
                        type="button"
                        onClick={handleAddAccordionItem}
                        className="inline-flex items-center gap-0.5 rounded bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 hover:bg-primary-100"
                    >
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                    </button>
                }
            >
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50/60 p-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400">
                                    Item #{idx + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAccordionItem(idx)}
                                    className="text-gray-400 transition hover:text-rose-600"
                                    title="Remove item"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                            <TextControl
                                value={item.title}
                                placeholder="Accordion item title"
                                onChange={(value) => handleUpdateAccordionItem(idx, 'title', value)}
                            />
                            <TextareaControl
                                rows={2}
                                value={item.content}
                                placeholder="Accordion item content"
                                onChange={(value) =>
                                    handleUpdateAccordionItem(idx, 'content', value)
                                }
                            />
                        </div>
                    ))}
                </div>
            </ControlSection>
        </div>
    );
}

export function FaqBlockInspector({ props: p, onChange }: BlockInspectorProps<FaqBlockProps>) {
    const items = p.items || [];

    const handleUpdateFaq = (index: number, key: keyof FaqItem, val: string) => {
        const next = [...items];
        next[index] = { ...next[index], [key]: val };
        onChange('items', next);
    };

    const handleAddFaq = () => {
        onChange('items', [
            ...items,
            {
                id: String(Date.now()),
                question: 'Common Question?',
                answer: 'Helpful answer detail.',
            },
        ]);
    };

    const handleRemoveFaq = (index: number) => {
        onChange(
            'items',
            items.filter((_, i) => i !== index)
        );
    };

    return (
        <div className="space-y-2">
            <ControlSection title="FAQ Heading" icon={HelpCircle} defaultOpen>
                <TextControl
                    label="Section Title"
                    value={p.title || ''}
                    placeholder="Frequently Asked Questions"
                    onChange={(value) => onChange('title', value)}
                />
            </ControlSection>

            <ControlSection
                title={`FAQ Items (${items.length})`}
                icon={HelpCircle}
                defaultOpen
                action={
                    <button
                        type="button"
                        onClick={handleAddFaq}
                        className="inline-flex items-center gap-0.5 rounded bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 hover:bg-primary-100"
                    >
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                    </button>
                }
            >
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50/60 p-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400">
                                    Q#{idx + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFaq(idx)}
                                    className="text-gray-400 transition hover:text-rose-600"
                                    title="Remove question"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                            <TextControl
                                value={item.question}
                                placeholder="Question"
                                onChange={(value) => handleUpdateFaq(idx, 'question', value)}
                            />
                            <TextareaControl
                                rows={2}
                                value={item.answer}
                                placeholder="Answer"
                                onChange={(value) => handleUpdateFaq(idx, 'answer', value)}
                            />
                        </div>
                    ))}
                </div>
            </ControlSection>
        </div>
    );
}

export function VideoBlockInspector({ props: p, onChange }: BlockInspectorProps<VideoBlockProps>) {
    return (
        <div className="space-y-2">
            <ControlSection title="Video Source & Framing" icon={Video} defaultOpen>
                <TextControl
                    type="url"
                    label="YouTube or Vimeo URL"
                    value={p.videoUrl || ''}
                    placeholder="https://www.youtube.com/watch?v=..."
                    hint="Supports standard YouTube, youtu.be, Shorts, and Vimeo links."
                    onChange={(value) => onChange('videoUrl', value)}
                />

                <SelectControl
                    label="Aspect Ratio"
                    value={p.aspectRatio || '16:9'}
                    options={[
                        { label: '16:9 Widescreen', value: '16:9' },
                        { label: '4:3 Standard', value: '4:3' },
                        { label: '1:1 Square', value: '1:1' },
                    ]}
                    onChange={(value) => onChange('aspectRatio', value)}
                />
            </ControlSection>
        </div>
    );
}

export function ImageCarouselBlockInspector({
    props: p,
    viewport,
    onChange,
}: BlockInspectorProps<ImageCarouselBlockProps>) {
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
        <div className="space-y-2">
            <ControlSection title="Carousel Layout" icon={Images} defaultOpen>
                <TextControl
                    label="Section Title (Optional)"
                    value={p.title || ''}
                    placeholder="Product Gallery"
                    onChange={(value) => onChange('title', value)}
                />

                <SliderControl
                    label={`Items Per View (${DEVICE_LABELS[viewport]})`}
                    value={String(activeItemsValue)}
                    unit={null}
                    min={1}
                    max={6}
                    step={1}
                    hint="Switches per active device breakpoint."
                    onChange={(value) =>
                        onChange(activeItemsKey, Number.parseInt(value, 10) || 1)
                    }
                />

                <ControlGrid>
                    <TextControl
                        label="Gap Between Images"
                        value={p.gap || ''}
                        placeholder="16px"
                        onChange={(value) => onChange('gap', value)}
                    />
                    <SelectControl
                        label="Aspect Ratio"
                        value={p.aspectRatio || '4 / 3'}
                        options={[
                            { label: 'Square (1:1)', value: '1 / 1' },
                            { label: 'Landscape (4:3)', value: '4 / 3' },
                            { label: 'Widescreen (16:9)', value: '16 / 9' },
                            { label: 'Portrait (3:4)', value: '3 / 4' },
                        ]}
                        onChange={(value) => onChange('aspectRatio', value)}
                    />
                </ControlGrid>

                <SelectControl
                    label="Image Fit"
                    value={p.imageFit || 'cover'}
                    options={[
                        { label: 'Cover', value: 'cover' },
                        { label: 'Contain', value: 'contain' },
                    ]}
                    onChange={(value) => onChange('imageFit', value)}
                />
            </ControlSection>

            <ControlSection title="Navigation & Autoplay" icon={Zap}>
                <ControlGrid>
                    <ToggleControl
                        label="Show Arrows"
                        checked={p.showArrows ?? true}
                        onChange={(checked) => onChange('showArrows', checked)}
                    />
                    <ToggleControl
                        label="Show Dots"
                        checked={p.showDots ?? true}
                        onChange={(checked) => onChange('showDots', checked)}
                    />
                    <ToggleControl
                        label="Autoplay"
                        checked={p.autoplay ?? false}
                        onChange={(checked) => onChange('autoplay', checked)}
                    />
                    <ToggleControl
                        label="Infinite Loop"
                        checked={p.loop ?? true}
                        onChange={(checked) => onChange('loop', checked)}
                    />
                </ControlGrid>

                <SliderControl
                    label="Autoplay Interval (sec)"
                    value={String(Math.round((p.autoplayInterval ?? 4000) / 1000))}
                    unit="s"
                    min={2}
                    max={15}
                    step={1}
                    onChange={(value) => {
                        const secs = Number.parseInt(value, 10) || 4;
                        onChange(
                            'autoplayInterval',
                            Math.min(15000, Math.max(2000, secs * 1000))
                        );
                    }}
                />
            </ControlSection>

            <ControlSection
                title={`Slides (${images.length})`}
                icon={ImageIcon}
                defaultOpen
                action={
                    <div className="flex items-center gap-1">
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
                            className="inline-flex items-center gap-0.5 rounded bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 hover:bg-primary-100"
                        >
                            <Plus className="h-3 w-3" />
                            <span>Add</span>
                        </button>
                    </div>
                }
            >
                <div className="space-y-2">
                    {images.map((image, idx) => (
                        <div
                            key={image.id || idx}
                            className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50/60 p-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400">
                                    Slide #{idx + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(idx)}
                                    className="text-gray-400 transition hover:text-rose-600"
                                    title="Remove slide"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                            <MediaField
                                label="Image"
                                value={image.imageUrl}
                                onChange={(value) => handleUpdateImage(idx, 'imageUrl', value)}
                                compact
                                hint="Pick from the media library."
                            />
                            <TextControl
                                value={image.altText || ''}
                                placeholder="Alt text (SEO / accessibility)"
                                onChange={(value) => handleUpdateImage(idx, 'altText', value)}
                            />
                        </div>
                    ))}
                </div>
            </ControlSection>
        </div>
    );
}
