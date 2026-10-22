import {
    Box,
    LayoutTemplate,
    ListChecks,
    Sparkles,
    Square,
    Truck,
    Type,
    Zap,
    type LucideIcon,
} from 'lucide-react';
import {
    ColorControl,
    ControlGrid,
    ControlSection,
    NumberUnitControl,
    SelectControl,
    SettingsNotice,
    SpacingControl,
    TextControl,
    TextareaControl,
    ToggleControl,
} from './controls';
import type { CodCheckoutBlockProps } from '@/types';

type CheckoutPropKey = Extract<keyof CodCheckoutBlockProps, string>;

type CheckoutFieldKind =
    | 'text'
    | 'textarea'
    | 'color'
    | 'select'
    | 'toggle'
    | 'number'
    | 'spacing';

interface CheckoutField {
    id?: string;
    key: CheckoutPropKey;
    label: string;
    kind?: CheckoutFieldKind;
    /** Additional keys written together by a spacing (four-side) control. */
    keys?: CheckoutPropKey[];
    placeholder?: string;
    hint?: string;
    fallback?: string;
    options?: Array<{ label: string; value: string }>;
    unit?: string | null;
    units?: string[];
    min?: number;
    max?: number;
    step?: number;
    width?: 'full' | 'half';
}

type CheckoutSectionGroup = 'content' | 'styles';

interface CheckoutSection {
    id: string;
    group: CheckoutSectionGroup;
    title: string;
    description: string;
    icon: LucideIcon;
    fields: CheckoutField[];
}

const ALIGN_OPTIONS = [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
];

const TEXT_TRANSFORM_OPTIONS = [
    { label: 'Normal', value: 'none' },
    { label: 'Uppercase', value: 'uppercase' },
    { label: 'Lowercase', value: 'lowercase' },
    { label: 'Capitalize', value: 'capitalize' },
];

const BORDER_STYLE_OPTIONS = [
    { label: 'Solid', value: 'solid' },
    { label: 'Dashed', value: 'dashed' },
    { label: 'Dotted', value: 'dotted' },
    { label: 'None', value: 'none' },
];

const FONT_WEIGHT_OPTIONS = [
    { label: 'Light (300)', value: '300' },
    { label: 'Regular (400)', value: '400' },
    { label: 'Medium (500)', value: '500' },
    { label: 'Semibold (600)', value: '600' },
    { label: 'Bold (700)', value: '700' },
    { label: 'Extra Bold (800)', value: '800' },
    { label: 'Black (900)', value: '900' },
];

const IMAGE_FIT_OPTIONS = [
    { label: 'Cover (Crop)', value: 'cover' },
    { label: 'Contain (Fit)', value: 'contain' },
];

const SECTIONS: CheckoutSection[] = [
    {
        id: 'content',
        group: 'content',
        title: 'Header & Content',
        description: 'Control checkout copy and which sections are visible.',
        icon: LayoutTemplate,
        fields: [
            { key: 'showHeader', label: 'Show Header', kind: 'toggle' },
            { key: 'showHeaderBadge', label: 'Show Header Badge', kind: 'toggle' },
            { key: 'showHeaderTitle', label: 'Show Header Title', kind: 'toggle' },
            { key: 'showHeaderSubtitle', label: 'Show Header Subtitle', kind: 'toggle' },
            {
                key: 'headerBadgeText',
                label: 'Badge Text',
                placeholder: 'Fast & Secure Checkout',
            },
            {
                key: 'headerTitle',
                label: 'Header Title',
                placeholder: 'Cash On Delivery Available Nationwide',
            },
            {
                key: 'headerSubtitle',
                label: 'Header Subtitle',
                kind: 'textarea',
                placeholder: 'Pay in cash only after receiving and inspecting your parcel.',
            },
            {
                key: 'headerAlign',
                label: 'Header Alignment',
                kind: 'select',
                options: ALIGN_OPTIONS,
            },
            {
                key: 'showProductSelector',
                label: 'Show Product Selection Cards',
                kind: 'toggle',
            },
            { key: 'showVariants', label: 'Show Variant Buttons', kind: 'toggle' },
            { key: 'showSummary', label: 'Show Order Summary', kind: 'toggle' },
            { key: 'showTrustBadges', label: 'Show Trust Row', kind: 'toggle' },
            { key: 'showRequiredMark', label: 'Show Required (*) Mark', kind: 'toggle' },
            { key: 'trustText1', label: 'Trust Text 1', placeholder: '১০০% ক্যাশ অন ডেলিভারি' },
            {
                key: 'trustText2',
                label: 'Trust Text 2',
                placeholder: 'প্রোডাক্ট দেখে মূল্য পরিশোধ',
            },
        ],
    },
    {
        id: 'layout',
        group: 'styles',
        title: 'Layout & Accent',
        description: 'Container width, spacing, font and primary accent color.',
        icon: Box,
        fields: [
            {
                key: 'fontFamily',
                label: 'Font Family',
                placeholder: "e.g. 'Hind Siliguri', sans-serif",
                hint: 'Leave empty to inherit the page font.',
            },
            {
                key: 'accentColor',
                label: 'Accent Color',
                kind: 'color',
                fallback: '#059669',
                width: 'half',
            },
            {
                key: 'containerMaxWidth',
                label: 'Content Max Width',
                kind: 'number',
                unit: 'px',
                min: 240,
                max: 1600,
                step: 8,
                placeholder: '672',
                width: 'half',
            },
            {
                id: 'containerPadding',
                key: 'containerPaddingX',
                label: 'Content Padding (All Sides)',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 120,
                placeholder: '16',
                hint: 'Applied equally to top, bottom, left and right.',
                width: 'half',
            },
            {
                key: 'fieldGap',
                label: 'Gap Between Fields',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 80,
                placeholder: '16',
                width: 'half',
            },
        ],
    },
    {
        id: 'card',
        group: 'styles',
        title: 'Card & Header Design',
        description: 'Card surface, header, badge and heading typography.',
        icon: Square,
        fields: [
            {
                key: 'cardBgColor',
                label: 'Card Background',
                kind: 'color',
                fallback: '#ffffff',
                width: 'half',
            },
            {
                key: 'cardBorderColor',
                label: 'Card Border Color',
                kind: 'color',
                fallback: '#10b981',
                width: 'half',
            },
            {
                key: 'cardBorderWidth',
                label: 'Card Border Width',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 20,
                placeholder: '2',
                width: 'half',
            },
            {
                key: 'cardBorderStyle',
                label: 'Card Border Style',
                kind: 'select',
                options: BORDER_STYLE_OPTIONS,
                width: 'half',
            },
            {
                key: 'cardBorderRadius',
                label: 'Card Border Radius',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 80,
                placeholder: '24',
                width: 'half',
            },
            {
                key: 'cardMinHeight',
                label: 'Card Min Height',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 2000,
                placeholder: 'Optional',
                width: 'half',
            },
            {
                id: 'cardPadding',
                key: 'cardPaddingTop',
                keys: [
                    'cardPaddingTop',
                    'cardPaddingRight',
                    'cardPaddingBottom',
                    'cardPaddingLeft',
                ],
                label: 'Card Padding',
                kind: 'spacing',
                unit: 'px',
                step: 1,
            },
            {
                key: 'cardShadow',
                label: 'Card Shadow',
                placeholder: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                hint: 'Accepts a CSS box-shadow value, or "none".',
            },
            {
                key: 'headerPaddingTop',
                label: 'Header Top Padding',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 160,
                placeholder: '0',
                width: 'half',
            },
            {
                key: 'headerPaddingBottom',
                label: 'Header Bottom Padding',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 160,
                placeholder: '24',
                width: 'half',
            },
            {
                key: 'headerBorderColor',
                label: 'Header Divider Color',
                kind: 'color',
                fallback: '#f1f5f9',
                width: 'half',
            },
            {
                key: 'headerBorderWidth',
                label: 'Header Divider Width',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 20,
                placeholder: '1',
                width: 'half',
            },
            {
                key: 'bodyPaddingTop',
                label: 'Body Top Padding',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 160,
                placeholder: '24',
                width: 'half',
            },
            {
                key: 'badgeBgColor',
                label: 'Badge Background',
                kind: 'color',
                fallback: '#d1fae5',
                width: 'half',
            },
            {
                key: 'badgeTextColor',
                label: 'Badge Text Color',
                kind: 'color',
                fallback: '#065f46',
                width: 'half',
            },
            {
                key: 'badgeBorderRadius',
                label: 'Badge Radius',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 100,
                placeholder: '9999',
                width: 'half',
            },
            {
                key: 'badgeFontSize',
                label: 'Badge Font Size',
                kind: 'number',
                unit: 'px',
                min: 6,
                max: 40,
                placeholder: '11',
                width: 'half',
            },
            {
                key: 'badgeFontWeight',
                label: 'Badge Font Weight',
                kind: 'select',
                options: FONT_WEIGHT_OPTIONS,
                width: 'half',
            },
            {
                key: 'badgePaddingX',
                label: 'Badge Padding X',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 80,
                placeholder: '12',
                width: 'half',
            },
            {
                key: 'badgePaddingY',
                label: 'Badge Padding Y',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 80,
                placeholder: '4',
                width: 'half',
            },
            {
                key: 'titleColor',
                label: 'Title Color',
                kind: 'color',
                fallback: '#0f172a',
                width: 'half',
            },
            {
                key: 'titleFontSize',
                label: 'Title Font Size',
                kind: 'number',
                unit: 'px',
                min: 10,
                max: 90,
                placeholder: '30',
                width: 'half',
            },
            {
                key: 'titleFontWeight',
                label: 'Title Font Weight',
                kind: 'select',
                options: FONT_WEIGHT_OPTIONS,
                width: 'half',
            },
            {
                key: 'titleLineHeight',
                label: 'Title Line Height',
                kind: 'number',
                unit: null,
                min: 0.8,
                max: 3,
                step: 0.05,
                placeholder: '1.2',
                width: 'half',
            },
            {
                key: 'titleLetterSpacing',
                label: 'Title Letter Spacing',
                kind: 'number',
                units: ['px', 'em'],
                min: -10,
                max: 20,
                step: 0.01,
                placeholder: '0',
                width: 'half',
            },
            {
                key: 'titleMarginBottom',
                label: 'Title Bottom Margin',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 120,
                placeholder: '4',
                width: 'half',
            },
            {
                key: 'subtitleColor',
                label: 'Subtitle Color',
                kind: 'color',
                fallback: '#64748b',
                width: 'half',
            },
            {
                key: 'subtitleFontSize',
                label: 'Subtitle Font Size',
                kind: 'number',
                unit: 'px',
                min: 8,
                max: 50,
                placeholder: '13',
                width: 'half',
            },
            {
                key: 'subtitleLineHeight',
                label: 'Subtitle Line Height',
                kind: 'number',
                unit: null,
                min: 0.8,
                max: 3,
                step: 0.05,
                placeholder: '1.5',
                width: 'half',
            },
            {
                key: 'subtitleLetterSpacing',
                label: 'Subtitle Letter Spacing',
                kind: 'number',
                units: ['px', 'em'],
                min: -10,
                max: 20,
                step: 0.01,
                placeholder: '0',
                width: 'half',
            },
        ],
    },
    {
        id: 'form',
        group: 'styles',
        title: 'Labels & Inputs',
        description: 'Field labels, inputs, placeholders, focus ring and required mark.',
        icon: Type,
        fields: [
            {
                key: 'labelColor',
                label: 'Label Color',
                kind: 'color',
                fallback: '#334155',
                width: 'half',
            },
            {
                key: 'labelFontSize',
                label: 'Label Font Size',
                kind: 'number',
                unit: 'px',
                min: 6,
                max: 30,
                placeholder: '11',
                width: 'half',
            },
            {
                key: 'labelFontWeight',
                label: 'Label Font Weight',
                kind: 'select',
                options: FONT_WEIGHT_OPTIONS,
                width: 'half',
            },
            {
                key: 'labelLineHeight',
                label: 'Label Line Height',
                kind: 'number',
                unit: null,
                min: 0.8,
                max: 3,
                step: 0.05,
                placeholder: '1.35',
                width: 'half',
            },
            {
                key: 'labelLetterSpacing',
                label: 'Label Letter Spacing',
                kind: 'number',
                units: ['px', 'em'],
                min: -10,
                max: 20,
                step: 0.01,
                placeholder: '0.05',
                width: 'half',
            },
            {
                key: 'labelTextTransform',
                label: 'Label Text Transform',
                kind: 'select',
                options: TEXT_TRANSFORM_OPTIONS,
                width: 'half',
            },
            {
                key: 'labelMarginBottom',
                label: 'Label Bottom Margin',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 40,
                placeholder: '4',
                width: 'half',
            },
            {
                key: 'requiredMarkColor',
                label: 'Required Mark Color',
                kind: 'color',
                fallback: '#f43f5e',
                width: 'half',
            },
            {
                key: 'inputBgColor',
                label: 'Input Background',
                kind: 'color',
                fallback: '#ffffff',
                width: 'half',
            },
            {
                key: 'inputTextColor',
                label: 'Input Text Color',
                kind: 'color',
                fallback: '#0f172a',
                width: 'half',
            },
            {
                key: 'inputBorderColor',
                label: 'Input Border Color',
                kind: 'color',
                fallback: '#cbd5e1',
                width: 'half',
            },
            {
                key: 'inputBorderWidth',
                label: 'Input Border Width',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 10,
                step: 0.5,
                placeholder: '1',
                width: 'half',
            },
            {
                key: 'inputBorderRadius',
                label: 'Input Border Radius',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '12',
                width: 'half',
            },
            {
                key: 'inputPaddingX',
                label: 'Input Padding X',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '12',
                width: 'half',
            },
            {
                key: 'inputPaddingY',
                label: 'Input Padding Y',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '10',
                width: 'half',
            },
            {
                key: 'inputFontSize',
                label: 'Input Font Size',
                kind: 'number',
                unit: 'px',
                min: 8,
                max: 36,
                placeholder: '14',
                width: 'half',
            },
            {
                key: 'inputFontWeight',
                label: 'Input Font Weight',
                kind: 'select',
                options: FONT_WEIGHT_OPTIONS,
                width: 'half',
            },
            {
                key: 'inputMinHeight',
                label: 'Input Min Height',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 140,
                placeholder: '44',
                width: 'half',
            },
            {
                key: 'inputIconColor',
                label: 'Input Icon Color',
                kind: 'color',
                fallback: '#94a3b8',
                width: 'half',
            },
            {
                key: 'inputPlaceholderColor',
                label: 'Placeholder Color',
                kind: 'color',
                fallback: '#94a3b8',
                width: 'half',
            },
            {
                key: 'inputFocusColor',
                label: 'Focus Border Color',
                kind: 'color',
                fallback: '#10b981',
                width: 'half',
            },
            {
                key: 'inputFocusRingColor',
                label: 'Focus Ring Color',
                placeholder: 'rgba(16, 185, 129, 0.18)',
                hint: 'Accepts rgba() or hex colors.',
            },
            {
                key: 'inputFocusRingWidth',
                label: 'Focus Ring Width',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 20,
                step: 0.5,
                placeholder: '3',
                width: 'half',
            },
        ],
    },
    {
        id: 'products',
        group: 'styles',
        title: 'Product Cards',
        description: 'Product panel, card, price, image, badge and variant styling.',
        icon: ListChecks,
        fields: [
            {
                key: 'productPanelBgColor',
                label: 'Panel Background',
                kind: 'color',
                fallback: '#f8fafc',
                width: 'half',
            },
            {
                key: 'productPanelBorderColor',
                label: 'Panel Border Color',
                kind: 'color',
                fallback: '#e2e8f0',
                width: 'half',
            },
            {
                key: 'productPanelBorderRadius',
                label: 'Panel Radius',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '12',
                width: 'half',
            },
            {
                key: 'productPanelPadding',
                label: 'Panel Padding',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '12',
                width: 'half',
            },
            {
                key: 'productPanelTitleColor',
                label: 'Panel Title Color',
                kind: 'color',
                fallback: '#334155',
                width: 'half',
            },
            {
                key: 'productCardGap',
                label: 'Gap Between Cards',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '8',
                width: 'half',
            },
            {
                key: 'productCardBgColor',
                label: 'Card Background',
                kind: 'color',
                fallback: '#ffffff',
                width: 'half',
            },
            {
                key: 'productCardSelectedBgColor',
                label: 'Selected Card Background',
                kind: 'color',
                fallback: '#ecfdf5',
                width: 'half',
            },
            {
                key: 'productCardBorderColor',
                label: 'Card Border Color',
                kind: 'color',
                fallback: '#e2e8f0',
                width: 'half',
            },
            {
                key: 'productCardSelectedBorderColor',
                label: 'Selected Card Border',
                kind: 'color',
                fallback: '#10b981',
                width: 'half',
            },
            {
                key: 'productCardBorderWidth',
                label: 'Card Border Width',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 10,
                step: 0.5,
                placeholder: '1',
                width: 'half',
            },
            {
                key: 'productCardSelectedBorderWidth',
                label: 'Selected Border Width',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 10,
                step: 0.5,
                placeholder: '2',
                width: 'half',
            },
            {
                key: 'productCardBorderRadius',
                label: 'Card Radius',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '12',
                width: 'half',
            },
            {
                key: 'productCardPadding',
                label: 'Card Padding',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '10',
                width: 'half',
            },
            {
                key: 'productTitleColor',
                label: 'Product Title Color',
                kind: 'color',
                fallback: '#0f172a',
                width: 'half',
            },
            {
                key: 'productTitleFontSize',
                label: 'Product Title Size',
                kind: 'number',
                unit: 'px',
                min: 6,
                max: 32,
                placeholder: '12',
                width: 'half',
            },
            {
                key: 'productTitleFontWeight',
                label: 'Product Title Weight',
                kind: 'select',
                options: FONT_WEIGHT_OPTIONS,
                width: 'half',
            },
            {
                key: 'productPriceColor',
                label: 'Price Color',
                kind: 'color',
                fallback: '#059669',
                width: 'half',
            },
            {
                key: 'productPriceFontSize',
                label: 'Price Font Size',
                kind: 'number',
                unit: 'px',
                min: 6,
                max: 32,
                placeholder: '14',
                width: 'half',
            },
            {
                key: 'productOldPriceColor',
                label: 'Old Price Color',
                kind: 'color',
                fallback: '#94a3b8',
                width: 'half',
            },
            {
                key: 'productInfoTextColor',
                label: 'Product Info Color',
                kind: 'color',
                fallback: '#64748b',
                width: 'half',
            },
            {
                key: 'productInfoFontSize',
                label: 'Product Info Size',
                kind: 'number',
                unit: 'px',
                min: 6,
                max: 24,
                placeholder: '10',
                width: 'half',
            },
            {
                key: 'productImageSize',
                label: 'Image Size',
                kind: 'number',
                unit: 'px',
                min: 16,
                max: 240,
                placeholder: '40',
                width: 'half',
            },
            {
                key: 'productImageRadius',
                label: 'Image Radius',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 80,
                placeholder: '8',
                width: 'half',
            },
            {
                key: 'productImageFit',
                label: 'Image Fit',
                kind: 'select',
                options: IMAGE_FIT_OPTIONS,
                width: 'half',
            },
            {
                key: 'productBadgeBgColor',
                label: 'Product Badge Background',
                kind: 'color',
                fallback: '#fef3c7',
                width: 'half',
            },
            {
                key: 'productBadgeTextColor',
                label: 'Product Badge Text',
                kind: 'color',
                fallback: '#92400e',
                width: 'half',
            },
            {
                key: 'productBadgeBorderRadius',
                label: 'Product Badge Radius',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 100,
                placeholder: '9999',
                width: 'half',
            },
            {
                key: 'productBadgeFontSize',
                label: 'Product Badge Size',
                kind: 'number',
                unit: 'px',
                min: 6,
                max: 24,
                placeholder: '9',
                width: 'half',
            },
            {
                key: 'variantBgColor',
                label: 'Variant Background',
                kind: 'color',
                fallback: '#ffffff',
                width: 'half',
            },
            {
                key: 'variantTextColor',
                label: 'Variant Text Color',
                kind: 'color',
                fallback: '#334155',
                width: 'half',
            },
            {
                key: 'variantBorderColor',
                label: 'Variant Border Color',
                kind: 'color',
                fallback: '#e2e8f0',
                width: 'half',
            },
            {
                key: 'variantSelectedBgColor',
                label: 'Selected Variant Background',
                kind: 'color',
                fallback: '#059669',
                width: 'half',
            },
            {
                key: 'variantSelectedTextColor',
                label: 'Selected Variant Text',
                kind: 'color',
                fallback: '#ffffff',
                width: 'half',
            },
            {
                key: 'variantSelectedBorderColor',
                label: 'Selected Variant Border',
                kind: 'color',
                fallback: '#059669',
                width: 'half',
            },
            {
                key: 'variantBorderRadius',
                label: 'Variant Radius',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '6',
                width: 'half',
            },
            {
                key: 'variantFontSize',
                label: 'Variant Font Size',
                kind: 'number',
                unit: 'px',
                min: 6,
                max: 24,
                placeholder: '10',
                width: 'half',
            },
        ],
    },
    {
        id: 'shipping',
        group: 'styles',
        title: 'Shipping & Summary',
        description: 'Shipping selector and order summary box styling.',
        icon: Truck,
        fields: [
            {
                key: 'shippingBgColor',
                label: 'Shipping Background',
                kind: 'color',
                fallback: '#ecfdf5',
                width: 'half',
            },
            {
                key: 'shippingTextColor',
                label: 'Shipping Text Color',
                kind: 'color',
                fallback: '#0f172a',
                width: 'half',
            },
            {
                key: 'shippingBorderColor',
                label: 'Shipping Border Color',
                kind: 'color',
                fallback: '#10b981',
                width: 'half',
            },
            {
                key: 'shippingBorderWidth',
                label: 'Shipping Border Width',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 10,
                step: 0.5,
                placeholder: '2',
                width: 'half',
            },
            {
                key: 'shippingBorderRadius',
                label: 'Shipping Radius',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '12',
                width: 'half',
            },
            {
                key: 'shippingPadding',
                label: 'Shipping Padding',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '10',
                width: 'half',
            },
            {
                key: 'shippingFontSize',
                label: 'Shipping Font Size',
                kind: 'number',
                unit: 'px',
                min: 8,
                max: 32,
                placeholder: '14',
                width: 'half',
            },
            {
                key: 'shippingFontWeight',
                label: 'Shipping Font Weight',
                kind: 'select',
                options: FONT_WEIGHT_OPTIONS,
                width: 'half',
            },
            {
                key: 'summaryBgColor',
                label: 'Summary Background',
                kind: 'color',
                fallback: '#f8fafc',
                width: 'half',
            },
            {
                key: 'summaryBorderColor',
                label: 'Summary Border Color',
                kind: 'color',
                fallback: '#e2e8f0',
                width: 'half',
            },
            {
                key: 'summaryBorderWidth',
                label: 'Summary Border Width',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 10,
                step: 0.5,
                placeholder: '1',
                width: 'half',
            },
            {
                key: 'summaryBorderRadius',
                label: 'Summary Radius',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '12',
                width: 'half',
            },
            {
                key: 'summaryPadding',
                label: 'Summary Padding',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 80,
                placeholder: '16',
                width: 'half',
            },
            {
                key: 'summaryRowGap',
                label: 'Summary Row Gap',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 60,
                placeholder: '8',
                width: 'half',
            },
            {
                key: 'summaryTextColor',
                label: 'Summary Text Color',
                kind: 'color',
                fallback: '#475569',
                width: 'half',
            },
            {
                key: 'summaryValueColor',
                label: 'Summary Value Color',
                kind: 'color',
                fallback: '#1e293b',
                width: 'half',
            },
            {
                key: 'summaryTotalColor',
                label: 'Total Amount Color',
                kind: 'color',
                fallback: '#059669',
                width: 'half',
            },
            {
                key: 'summaryTotalFontSize',
                label: 'Total Amount Size',
                kind: 'number',
                unit: 'px',
                min: 8,
                max: 48,
                placeholder: '18',
                width: 'half',
            },
            {
                key: 'summaryFontSize',
                label: 'Summary Font Size',
                kind: 'number',
                unit: 'px',
                min: 8,
                max: 32,
                placeholder: '12',
                width: 'half',
            },
        ],
    },
    {
        id: 'button',
        group: 'styles',
        title: 'Button & Trust Row',
        description: 'Submit button and trust badge styling.',
        icon: Zap,
        fields: [
            {
                key: 'buttonBgColor',
                label: 'Button Background',
                kind: 'color',
                fallback: '#059669',
                width: 'half',
            },
            {
                key: 'buttonTextColor',
                label: 'Button Text Color',
                kind: 'color',
                fallback: '#ffffff',
                width: 'half',
            },
            {
                key: 'buttonHoverBgColor',
                label: 'Button Hover Background',
                kind: 'color',
                fallback: '#047857',
                width: 'half',
            },
            {
                key: 'buttonBorderColor',
                label: 'Button Border Color',
                kind: 'color',
                fallback: '#059669',
                width: 'half',
            },
            {
                key: 'buttonBorderWidth',
                label: 'Button Border Width',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 20,
                step: 0.5,
                placeholder: '0',
                width: 'half',
            },
            {
                key: 'buttonBorderRadius',
                label: 'Button Radius',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 80,
                placeholder: '12',
                width: 'half',
            },
            {
                key: 'buttonMinHeight',
                label: 'Button Min Height',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 200,
                placeholder: 'Optional',
                width: 'half',
            },
            {
                key: 'buttonPaddingY',
                label: 'Button Padding Y',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 80,
                placeholder: '16',
                width: 'half',
            },
            {
                key: 'buttonPaddingX',
                label: 'Button Padding X',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 120,
                placeholder: '24',
                width: 'half',
            },
            {
                key: 'buttonFontSize',
                label: 'Button Font Size',
                kind: 'number',
                unit: 'px',
                min: 8,
                max: 40,
                placeholder: '16',
                width: 'half',
            },
            {
                key: 'buttonFontWeight',
                label: 'Button Font Weight',
                kind: 'select',
                options: FONT_WEIGHT_OPTIONS,
                width: 'half',
            },
            {
                key: 'buttonLetterSpacing',
                label: 'Button Letter Spacing',
                kind: 'number',
                units: ['px', 'em'],
                min: -10,
                max: 20,
                step: 0.01,
                placeholder: '0',
                width: 'half',
            },
            {
                key: 'buttonWidth',
                label: 'Button Width',
                kind: 'select',
                options: [
                    { label: 'Full Width', value: 'full' },
                    { label: 'Auto', value: 'auto' },
                ],
                width: 'half',
            },
            {
                key: 'buttonTextTransform',
                label: 'Button Text Transform',
                kind: 'select',
                options: TEXT_TRANSFORM_OPTIONS,
                width: 'half',
            },
            {
                key: 'buttonShadow',
                label: 'Button Shadow',
                placeholder: '0 20px 25px -5px rgb(5 150 105 / 0.3)',
            },
            {
                key: 'trustTextColor',
                label: 'Trust Text Color',
                kind: 'color',
                fallback: '#64748b',
                width: 'half',
            },
            {
                key: 'trustFontSize',
                label: 'Trust Font Size',
                kind: 'number',
                unit: 'px',
                min: 6,
                max: 24,
                placeholder: '11',
                width: 'half',
            },
            {
                key: 'trustFontWeight',
                label: 'Trust Font Weight',
                kind: 'select',
                options: FONT_WEIGHT_OPTIONS,
                width: 'half',
            },
            {
                key: 'trustIconColor',
                label: 'Trust Icon Color',
                kind: 'color',
                fallback: '#059669',
                width: 'half',
            },
            {
                key: 'trustIconSize',
                label: 'Trust Icon Size',
                kind: 'number',
                unit: 'px',
                min: 8,
                max: 40,
                placeholder: '14',
                width: 'half',
            },
            {
                key: 'trustGap',
                label: 'Trust Item Gap',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 80,
                placeholder: '16',
                width: 'half',
            },
            {
                key: 'trustPaddingTop',
                label: 'Trust Row Top Padding',
                kind: 'number',
                unit: 'px',
                min: 0,
                max: 80,
                placeholder: '8',
                width: 'half',
            },
        ],
    },
];

export interface CodCheckoutDesignSettingsProps {
    props: CodCheckoutBlockProps;
    onChange: (key: string, value: unknown) => void;
    mode?: CheckoutSectionGroup;
}

function toText(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
}

export function CodCheckoutDesignSettings({
    props,
    onChange,
    mode = 'styles',
}: CodCheckoutDesignSettingsProps) {
    const visibleSections = SECTIONS.filter((section) => section.group === mode);
    const isStylesMode = mode === 'styles';

    const renderField = (field: CheckoutField) => {
        const rawValue = props[field.key];
        const value = toText(rawValue);

        switch (field.kind) {
            case 'toggle':
                return (
                    <ToggleControl
                        label={field.label}
                        checked={rawValue === undefined ? true : Boolean(rawValue)}
                        onChange={(checked) => onChange(field.key, checked)}
                        hint={field.hint}
                    />
                );

            case 'color':
                return (
                    <ColorControl
                        label={field.label}
                        value={value}
                        fallback={field.fallback}
                        onChange={(next) => onChange(field.key, next)}
                        hint={field.hint}
                    />
                );

            case 'select':
                return (
                    <SelectControl
                        label={field.label}
                        value={value}
                        options={field.options || []}
                        onChange={(next) => onChange(field.key, next)}
                        hint={field.hint}
                    />
                );

            case 'textarea':
                return (
                    <TextareaControl
                        label={field.label}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(next) => onChange(field.key, next)}
                        hint={field.hint}
                    />
                );

            case 'number':
                return (
                    <NumberUnitControl
                        label={field.label}
                        value={value}
                        onChange={(next) => onChange(field.key, next)}
                        unit={field.unit === undefined ? 'px' : field.unit}
                        units={field.units}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        placeholder={field.placeholder}
                        hint={field.hint}
                    />
                );

            case 'spacing': {
                const keys = field.keys || [];
                const rawValues = keys.map((key) => toText(props[key]));
                const values: [string, string, string, string] = [
                    rawValues[0] ?? '',
                    rawValues[1] ?? '',
                    rawValues[2] ?? '',
                    rawValues[3] ?? '',
                ];

                return (
                    <SpacingControl
                        label={field.label}
                        values={values}
                        onChange={(nextValues) => {
                            keys.forEach((key, index) => {
                                onChange(key, nextValues[index]);
                            });
                        }}
                        unit={field.unit === null ? '' : field.unit || 'px'}
                        step={field.step}
                        hint={field.hint}
                    />
                );
            }

            default:
                return (
                    <TextControl
                        label={field.label}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(next) => onChange(field.key, next)}
                        hint={field.hint}
                    />
                );
        }
    };

    return (
        <div className="space-y-2">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-2">
                <div className="flex items-center space-x-1.5 text-[10.5px] font-bold text-indigo-900">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{isStylesMode ? 'Checkout Designer' : 'Checkout Content'}</span>
                </div>
                <p className="mt-0.5 text-[9.5px] leading-relaxed text-indigo-700">
                    {isStylesMode
                        ? 'Fine-tune every card, input, product, shipping, summary and button token. Outer background, spacing and width live in the Background and Spacing sections below.'
                        : 'Edit checkout copy, visible sections and form labels or placeholders. Colors, spacing, borders and typography are available in the Styles tab.'}
                </p>
            </div>

            {visibleSections.map((section) => (
                <ControlSection
                    key={section.id}
                    title={section.title}
                    description={section.description}
                    icon={section.icon}
                    defaultOpen={section.id === 'content' || section.id === 'layout'}
                >
                    <ControlGrid>
                        {section.fields.map((field) => (
                            <div
                                key={field.id || field.key}
                                className={field.width === 'half' ? '' : 'col-span-2'}
                            >
                                {renderField(field)}
                            </div>
                        ))}
                    </ControlGrid>
                </ControlSection>
            ))}

            {isStylesMode && (
                <SettingsNotice tone="warning">
                    For security, values containing{' '}
                    <code className="font-mono">url()</code>,{' '}
                    <code className="font-mono">@import</code>,{' '}
                    <code className="font-mono">expression()</code> or{' '}
                    <code className="font-mono">;</code> are rejected.
                </SettingsNotice>
            )}
        </div>
    );
}
