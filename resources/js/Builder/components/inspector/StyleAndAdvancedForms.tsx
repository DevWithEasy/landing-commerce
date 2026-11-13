import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Box,
    Code,
    LayoutGrid,
    Maximize2,
    Palette,
    SlidersHorizontal,
    Square,
    Type,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import type { BlockStyles, BlockType, ViewportMode } from '@/types';
import {
    BLOCK_ELEMENT_STYLE_OPTIONS,
    DEVICE_LABELS,
    resolveElementStyles,
} from '../../styleSystem';
import {
    AlignmentControl,
    BorderRadiusControl,
    ColorControl,
    ControlSection,
    NumberUnitControl,
    SelectControl,
    SliderControl,
    SpacingControl,
    TextControl,
    ToggleControl,
} from '../controls';

export interface BlockStylesFormProps {
    styles: BlockStyles;
    onChange: (key: keyof BlockStyles, value: BlockStyles[keyof BlockStyles]) => void;
    onBatchChange?: (updates: Partial<BlockStyles>) => void;
}

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

export function BlockStylesForm({ styles, onChange, onBatchChange }: BlockStylesFormProps) {
    const batch = (updates: Partial<BlockStyles>) => {
        if (onBatchChange) {
            onBatchChange(updates);
            return;
        }

        (Object.keys(updates) as Array<keyof BlockStyles>).forEach((key) => {
            onChange(key, updates[key]);
        });
    };

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

                <SliderControl
                    label="Font Size"
                    value={styles.fontSize || ''}
                    unit="px"
                    min={10}
                    max={96}
                    placeholder="Default"
                    onChange={(value) => onChange('fontSize', value)}
                />

                <div className="grid grid-cols-2 gap-1.5">
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
                </div>

                <ColorControl
                    label="Border Color"
                    value={styles.borderColor || ''}
                    fallback="#e2e8f0"
                    onChange={(value) => onChange('borderColor', value)}
                />

                <BorderRadiusControl
                    label="Border Radius"
                    value={styles.borderRadius || ''}
                    onChange={(value) => onChange('borderRadius', value)}
                />
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

export function BlockAdvancedForm({ styles, onChange, onBatchChange }: BlockStylesFormProps) {
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

    const WIDTH_PRESETS = [
        { label: 'Full', val: '100%' },
        { label: '1280', val: '1280px' },
        { label: '1024', val: '1024px' },
        { label: '768', val: '768px' },
    ];

    return (
        <div className="space-y-2">
            <ControlSection
                title="Margin & Padding"
                icon={Maximize2}
                description="Outer margin and inner padding"
                defaultOpen
            >
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
            </ControlSection>

            <ControlSection
                title="Size & Alignment"
                icon={Box}
                description="Block width, max width and height"
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
            </ControlSection>

            <ControlSection
                title="Effects & Visibility"
                icon={SlidersHorizontal}
                description="Opacity, overflow, layer order and device visibility"
            >
                <SliderControl
                    label="Opacity"
                    value={styles.opacity !== undefined ? String(styles.opacity) : ''}
                    unit={null}
                    min={0}
                    max={1}
                    step={0.05}
                    placeholder="1"
                    onChange={(value) => onChange('opacity', value)}
                />

                <div className="grid grid-cols-2 gap-1.5">
                    <SelectControl
                        label="Overflow"
                        value={styles.overflow || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Visible', value: 'visible' },
                            { label: 'Hidden', value: 'hidden' },
                            { label: 'Auto', value: 'auto' },
                        ]}
                        onChange={(value) => onChange('overflow', value)}
                    />
                    <NumberUnitControl
                        label="Z-Index (0–50)"
                        value={styles.zIndex !== undefined ? String(styles.zIndex) : ''}
                        unit={null}
                        min={0}
                        max={50}
                        step={1}
                        placeholder="0"
                        onChange={(value) => {
                            const parsed = Number.parseInt(value, 10);
                            if (value === '' || !Number.isFinite(parsed)) {
                                onChange('zIndex', undefined);
                                return;
                            }
                            onChange('zIndex', Math.max(0, Math.min(50, parsed)));
                        }}
                    />
                </div>

                <ToggleControl
                    label="Hide on current device"
                    checked={styles.display === 'none'}
                    onChange={(checked) => onChange('display', checked ? 'none' : '')}
                    hint="Use the device switcher above to hide on Mobile, Tablet, or Desktop."
                />
            </ControlSection>
        </div>
    );
}

export interface ElementStylesPanelProps {
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

export function ElementStylesPanel({
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
                    <SelectControl
                        label="Font Weight"
                        value={elementStyles.fontWeight || ''}
                        options={[
                            { label: 'Default', value: '' },
                            { label: 'Thin (100)', value: '100' },
                            { label: 'Extra Light (200)', value: '200' },
                            { label: 'Light (300)', value: '300' },
                            { label: 'Regular (400)', value: '400' },
                            { label: 'Medium (500)', value: '500' },
                            { label: 'Semibold (600)', value: '600' },
                            { label: 'Bold (700)', value: '700' },
                            { label: 'Extra Bold (800)', value: '800' },
                            { label: 'Black (900)', value: '900' },
                        ]}
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
                </div>
                <BorderRadiusControl
                    label="Border Radius"
                    value={elementStyles.borderRadius || ''}
                    onChange={(value) => set('borderRadius', value)}
                />
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
