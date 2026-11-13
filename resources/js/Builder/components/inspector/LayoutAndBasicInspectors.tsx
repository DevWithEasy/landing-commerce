import {
    AlignLeft,
    Box,
    Image as ImageIcon,
    LayoutGrid,
    MousePointerClick,
    Palette,
    Sparkles,
    Type,
} from 'lucide-react';
import { DEVICE_LABELS } from '../../styleSystem';
import { MediaField } from '../MediaPickerModal';
import {
    AlignmentControl,
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
import type {
    Block,
    ButtonBlockProps,
    ContainerBlockProps,
    GridBlockProps,
    HeadingBlockProps,
    ImageBlockProps,
    TextBlockProps,
    ViewportMode,
} from '@/types';

export interface BlockInspectorProps<TProps> {
    block: Block;
    props: TProps;
    viewport: ViewportMode;
    onChange: (key: string, value: unknown) => void;
}

const HEADING_COLOR_SWATCHES = ['#0f172a', '#1e293b', '#475569', '#059669', '#dc2626', '#ffffff'];
const TEXT_COLOR_SWATCHES = ['#334155', '#0f172a', '#64748b', '#059669', '#ffffff'];
const BUTTON_BG_SWATCHES = ['#059669', '#16a34a', '#2563eb', '#4f46e5', '#dc2626', '#0f172a'];

export function ContainerBlockInspector({
    block,
    props: p,
    onChange,
}: BlockInspectorProps<ContainerBlockProps>) {
    const childCount = block.children?.length ?? 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50/70 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-primary-600" />
                    <span className="font-bold text-primary-900">Container Layout</span>
                </div>
                <span className="rounded-full bg-primary-200/60 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-primary-800">
                    {childCount} {childCount === 1 ? 'child' : 'children'}
                </span>
            </div>

            <ControlSection title="Flex Direction & Wrap" icon={Box} defaultOpen>
                <div>
                    <span className="mb-1 block text-[10px] font-semibold text-gray-600">
                        Direction
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                        {[
                            { value: 'column', label: 'Vertical (Column)' },
                            { value: 'row', label: 'Horizontal (Row)' },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onChange('direction', opt.value)}
                                className={`h-7 rounded-md border px-2 text-[10.5px] font-medium transition ${
                                    (p.direction || 'column') === opt.value
                                        ? 'border-primary-600 bg-primary-50 font-bold text-primary-900 ring-1 ring-primary-500'
                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <span className="mb-1 block text-[10px] font-semibold text-gray-600">
                        Flex Wrap
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                        {[
                            { value: 'nowrap', label: 'No Wrap' },
                            { value: 'wrap', label: 'Wrap' },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onChange('wrap', opt.value)}
                                className={`h-7 rounded-md border px-2 text-[10.5px] font-medium transition ${
                                    (p.wrap || 'nowrap') === opt.value
                                        ? 'border-primary-600 bg-primary-50 font-bold text-primary-900 ring-1 ring-primary-500'
                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </ControlSection>

            <ControlSection title="Alignment & Gap" icon={LayoutGrid} defaultOpen>
                <ControlGrid>
                    <SelectControl
                        label="Justify Content"
                        value={p.justifyContent || 'flex-start'}
                        options={[
                            { label: 'Start', value: 'flex-start' },
                            { label: 'Center', value: 'center' },
                            { label: 'End', value: 'flex-end' },
                            { label: 'Space Between', value: 'space-between' },
                            { label: 'Space Around', value: 'space-around' },
                            { label: 'Space Evenly', value: 'space-evenly' },
                        ]}
                        onChange={(value) => onChange('justifyContent', value)}
                    />
                    <SelectControl
                        label="Align Items"
                        value={p.alignItems || 'stretch'}
                        options={[
                            { label: 'Stretch', value: 'stretch' },
                            { label: 'Start', value: 'flex-start' },
                            { label: 'Center', value: 'center' },
                            { label: 'End', value: 'flex-end' },
                        ]}
                        onChange={(value) => onChange('alignItems', value)}
                    />
                </ControlGrid>

                <SliderControl
                    label="Items Gap"
                    value={p.gap || '16px'}
                    unit="px"
                    min={0}
                    max={96}
                    step={2}
                    placeholder="16px"
                    onChange={(value) => onChange('gap', value)}
                />
            </ControlSection>
        </div>
    );
}

export function GridBlockInspector({
    props: p,
    viewport,
    onChange,
}: BlockInspectorProps<GridBlockProps>) {
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
                <SliderControl
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

                <ControlGrid>
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
                </ControlGrid>
            </ControlSection>

            <SettingsNotice>
                Grid children flow into responsive columns based on the active device breakpoint.
                Use the Navigator to nest or reorder blocks inside.
            </SettingsNotice>
        </div>
    );
}

export function HeadingBlockInspector({
    props: p,
    onChange,
}: BlockInspectorProps<HeadingBlockProps>) {
    return (
        <div className="space-y-2">
            <ControlSection title="Heading Content" icon={Type} defaultOpen>
                <TextareaControl
                    label="Title"
                    value={p.text || ''}
                    rows={3}
                    placeholder="Enter headline..."
                    onChange={(value) => onChange('text', value)}
                />

                <div>
                    <span className="mb-1 block text-[10px] font-semibold text-gray-600">
                        HTML Tag
                    </span>
                    <div className="grid grid-cols-6 gap-1">
                        {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => onChange('tag', tag)}
                                className={`h-7 rounded-md border text-[10.5px] font-bold uppercase transition ${
                                    (p.tag || 'h2') === tag
                                        ? 'border-primary-600 bg-primary-50 text-primary-900 ring-1 ring-primary-500'
                                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <AlignmentControl
                    label="Alignment"
                    value={p.align || 'left'}
                    onChange={(value) => onChange('align', value)}
                />
            </ControlSection>

            <ControlSection title="Heading Typography" icon={Palette} defaultOpen>
                <ColorControl
                    label="Text Color"
                    value={p.color || ''}
                    fallback="#0f172a"
                    presets={HEADING_COLOR_SWATCHES}
                    onChange={(value) => onChange('color', value)}
                />

                <SliderControl
                    label="Font Size"
                    value={p.fontSize || ''}
                    unit="px"
                    min={12}
                    max={96}
                    placeholder="32px"
                    onChange={(value) => onChange('fontSize', value)}
                />

                <SelectControl
                    label="Font Weight"
                    value={p.fontWeight || '700'}
                    options={[
                        { label: 'Regular (400)', value: '400' },
                        { label: 'Medium (500)', value: '500' },
                        { label: 'SemiBold (600)', value: '600' },
                        { label: 'Bold (700)', value: '700' },
                        { label: 'Extra Bold (800)', value: '800' },
                        { label: 'Black (900)', value: '900' },
                    ]}
                    onChange={(value) => onChange('fontWeight', value)}
                />
            </ControlSection>
        </div>
    );
}

export function TextBlockInspector({ props: p, onChange }: BlockInspectorProps<TextBlockProps>) {
    return (
        <div className="space-y-2">
            <ControlSection title="Text Content" icon={AlignLeft} defaultOpen>
                <TextareaControl
                    label="Paragraph"
                    value={p.content || ''}
                    rows={5}
                    placeholder="Enter paragraph text..."
                    onChange={(value) => onChange('content', value)}
                />

                <AlignmentControl
                    label="Alignment"
                    value={p.align || 'left'}
                    onChange={(value) => onChange('align', value)}
                />
            </ControlSection>

            <ControlSection title="Typography" icon={Palette} defaultOpen>
                <ColorControl
                    label="Text Color"
                    value={p.color || ''}
                    fallback="#334155"
                    presets={TEXT_COLOR_SWATCHES}
                    onChange={(value) => onChange('color', value)}
                />

                <SliderControl
                    label="Font Size"
                    value={p.fontSize || ''}
                    unit="px"
                    min={10}
                    max={48}
                    placeholder="16px"
                    onChange={(value) => onChange('fontSize', value)}
                />

                <NumberUnitControl
                    label="Line Height"
                    value={p.lineHeight || ''}
                    unit={null}
                    min={0.8}
                    max={3}
                    step={0.05}
                    placeholder="1.6"
                    onChange={(value) => onChange('lineHeight', value)}
                />
            </ControlSection>
        </div>
    );
}

export function ImageBlockInspector({ props: p, onChange }: BlockInspectorProps<ImageBlockProps>) {
    return (
        <div className="space-y-2">
            <ControlSection title="Image Source" icon={ImageIcon} defaultOpen>
                <MediaField
                    label="Choose Image"
                    value={p.imageUrl || ''}
                    onChange={(value) => onChange('imageUrl', value)}
                    placeholder="https://images.unsplash.com/..."
                />

                <TextControl
                    label="Alt Text"
                    value={p.altText || ''}
                    placeholder="Image description for SEO"
                    onChange={(value) => onChange('altText', value)}
                />

                <TextControl
                    label="Caption"
                    value={p.caption || ''}
                    placeholder="Optional caption below image"
                    onChange={(value) => onChange('caption', value)}
                />
            </ControlSection>

            <ControlSection title="Framing & Link" icon={LayoutGrid} defaultOpen>
                <AlignmentControl
                    label="Image Alignment"
                    value={p.align || 'center'}
                    onChange={(value) => onChange('align', value)}
                />

                <SelectControl
                    label="Aspect Ratio"
                    value={p.aspectRatio || 'auto'}
                    options={[
                        { label: 'Auto (Original)', value: 'auto' },
                        { label: 'Square (1:1)', value: '1/1' },
                        { label: 'Landscape (4:3)', value: '4/3' },
                        { label: 'Widescreen (16:9)', value: '16/9' },
                    ]}
                    onChange={(value) => onChange('aspectRatio', value)}
                />

                <TextControl
                    label="Click Link URL"
                    value={p.linkUrl || ''}
                    placeholder="https://... or #cod-checkout"
                    onChange={(value) => onChange('linkUrl', value)}
                />
            </ControlSection>
        </div>
    );
}

export function ButtonBlockInspector({
    props: p,
    onChange,
}: BlockInspectorProps<ButtonBlockProps>) {
    return (
        <div className="space-y-2">
            <ControlSection title="Button Content & Action" icon={MousePointerClick} defaultOpen>
                <TextControl
                    label="Button Text"
                    value={p.text || ''}
                    placeholder="অর্ডার করতে ক্লিক করুন"
                    onChange={(value) => onChange('text', value)}
                />

                <TextControl
                    label="Link / Target"
                    value={p.target || ''}
                    placeholder="#cod-checkout or https://..."
                    hint="Use #cod-checkout to scroll to the order form, or enter a full URL."
                    onChange={(value) => onChange('target', value)}
                />

                <div className="flex flex-wrap gap-1">
                    {[
                        { label: 'Scroll to Checkout', value: '#cod-checkout' },
                        { label: 'Scroll to Top', value: '#top' },
                    ].map((preset) => (
                        <button
                            key={preset.value}
                            type="button"
                            onClick={() => onChange('target', preset.value)}
                            className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9.5px] font-medium text-gray-600 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                <ControlGrid>
                    <SelectControl
                        label="Size"
                        value={p.size || 'md'}
                        options={[
                            { label: 'Small', value: 'sm' },
                            { label: 'Medium', value: 'md' },
                            { label: 'Large', value: 'lg' },
                            { label: 'Extra Large', value: 'xl' },
                        ]}
                        onChange={(value) => onChange('size', value)}
                    />
                    <SelectControl
                        label="Width"
                        value={p.width || 'auto'}
                        options={[
                            { label: 'Auto (Fit)', value: 'auto' },
                            { label: 'Full Width', value: 'full' },
                        ]}
                        onChange={(value) => onChange('width', value)}
                    />
                </ControlGrid>

                <AlignmentControl
                    label="Alignment"
                    value={p.align || 'center'}
                    onChange={(value) => onChange('align', value)}
                />
            </ControlSection>

            <ControlSection title="Button Appearance" icon={Sparkles} defaultOpen>
                <ControlGrid>
                    <ColorControl
                        label="Background"
                        value={p.backgroundColor || ''}
                        fallback="#059669"
                        presets={BUTTON_BG_SWATCHES}
                        onChange={(value) => onChange('backgroundColor', value)}
                    />
                    <ColorControl
                        label="Text Color"
                        value={p.textColor || ''}
                        fallback="#ffffff"
                        onChange={(value) => onChange('textColor', value)}
                    />
                </ControlGrid>

                <SliderControl
                    label="Border Radius"
                    value={p.borderRadius || ''}
                    unit="px"
                    min={0}
                    max={60}
                    placeholder="8px"
                    onChange={(value) => onChange('borderRadius', value)}
                />

                <ToggleControl
                    label="Pulse Animation"
                    checked={p.pulseAnimation ?? true}
                    onChange={(checked) => onChange('pulseAnimation', checked)}
                    hint="Adds an attention-grabbing pulse effect to the CTA button."
                />
            </ControlSection>
        </div>
    );
}
