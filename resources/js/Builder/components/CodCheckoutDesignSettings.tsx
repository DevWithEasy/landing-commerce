import {
    Box,
    ChevronDown,
    ChevronUp,
    LayoutTemplate,
    ListChecks,
    Receipt,
    Sparkles,
    Square,
    Truck,
    Type,
    Zap,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import type { CodCheckoutBlockProps } from '@/types';

type CheckoutPropKey = Extract<keyof CodCheckoutBlockProps, string>;

interface CheckoutField {
    key: CheckoutPropKey;
    label: string;
    kind?: 'text' | 'textarea' | 'color' | 'select' | 'toggle';
    placeholder?: string;
    hint?: string;
    fallback?: string;
    options?: Array<{ label: string; value: string }>;
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
    { label: 'UPPERCASE', value: 'uppercase' },
    { label: 'lowercase', value: 'lowercase' },
    { label: 'Capitalize', value: 'capitalize' },
];

const BORDER_STYLE_OPTIONS = [
    { label: 'Solid', value: 'solid' },
    { label: 'Dashed', value: 'dashed' },
    { label: 'Dotted', value: 'dotted' },
    { label: 'None', value: 'none' },
];

const SECTIONS: CheckoutSection[] = [
    {
        id: 'content',
        group: 'content',
        title: 'Header & Content',
        description: 'শেকআউটের টেক্সট ও কোন অংশ দেখাবে তা নিয়ন্ত্রণ করুন।',
        icon: LayoutTemplate,
        fields: [
            { key: 'showHeader', label: 'Show Header', kind: 'toggle' },
            { key: 'showHeaderBadge', label: 'Show Header Badge', kind: 'toggle' },
            { key: 'showHeaderTitle', label: 'Show Header Title', kind: 'toggle' },
            { key: 'showHeaderSubtitle', label: 'Show Header Subtitle', kind: 'toggle' },
            { key: 'headerBadgeText', label: 'Badge Text', placeholder: 'Fast & Secure Checkout' },
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
            { key: 'showProductSelector', label: 'Show Product Selection Cards', kind: 'toggle' },
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
        description: 'কনটেইনার প্রস্থ, প্যাডিং, ফন্ট ও অ্যাকসেন্ট কালার।',
        icon: Box,
        fields: [
            {
                key: 'fontFamily',
                label: 'Font Family',
                placeholder: "e.g. 'Hind Siliguri', sans-serif",
                hint: 'খালি রাখলে পেজের ফন্ট inherit হবে।',
            },
            { key: 'accentColor', label: 'Accent Color', kind: 'color', fallback: '#059669' },
            { key: 'containerMaxWidth', label: 'Content Max Width', placeholder: '672px' },
            { key: 'containerPaddingX', label: 'Content Side Padding', placeholder: '16px' },
            { key: 'fieldGap', label: 'Gap Between Fields', placeholder: '16px' },
        ],
    },
    {
        id: 'card',
        group: 'styles',
        title: 'Card & Header Design',
        description: 'কার্ড, হেডার, ব্যাজ, টাইটেল ও সাবটাইটেলের প্রতিটি স্টাইল।',
        icon: Square,
        fields: [
            { key: 'cardBgColor', label: 'Card Background', kind: 'color', fallback: '#ffffff' },
            {
                key: 'cardBorderColor',
                label: 'Card Border Color',
                kind: 'color',
                fallback: '#10b981',
            },
            { key: 'cardBorderWidth', label: 'Card Border Width', placeholder: '2px' },
            {
                key: 'cardBorderStyle',
                label: 'Card Border Style',
                kind: 'select',
                options: BORDER_STYLE_OPTIONS,
            },
            { key: 'cardBorderRadius', label: 'Card Border Radius', placeholder: '24px' },
            {
                key: 'cardMinHeight',
                label: 'Card Min Height',
                placeholder: 'e.g. 480px (optional)',
            },
            { key: 'cardPaddingTop', label: 'Card Padding Top', placeholder: '32px' },
            { key: 'cardPaddingBottom', label: 'Card Padding Bottom', placeholder: '32px' },
            { key: 'cardPaddingLeft', label: 'Card Padding Left', placeholder: '32px' },
            { key: 'cardPaddingRight', label: 'Card Padding Right', placeholder: '32px' },
            {
                key: 'cardShadow',
                label: 'Card Shadow',
                placeholder: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                hint: 'CSS box-shadow value দিন, অথবা none লিখুন।',
            },
            { key: 'headerPaddingBottom', label: 'Header Bottom Padding', placeholder: '24px' },
            {
                key: 'headerBorderColor',
                label: 'Header Divider Color',
                kind: 'color',
                fallback: '#f1f5f9',
            },
            { key: 'headerBorderWidth', label: 'Header Divider Width', placeholder: '1px' },
            { key: 'bodyPaddingTop', label: 'Body Top Padding', placeholder: '24px' },
            { key: 'badgeBgColor', label: 'Badge Background', kind: 'color', fallback: '#d1fae5' },
            {
                key: 'badgeTextColor',
                label: 'Badge Text Color',
                kind: 'color',
                fallback: '#065f46',
            },
            { key: 'badgeBorderRadius', label: 'Badge Radius', placeholder: '9999px' },
            { key: 'badgeFontSize', label: 'Badge Font Size', placeholder: '11px' },
            { key: 'badgePaddingX', label: 'Badge Padding X', placeholder: '12px' },
            { key: 'badgePaddingY', label: 'Badge Padding Y', placeholder: '4px' },
            { key: 'titleColor', label: 'Title Color', kind: 'color', fallback: '#0f172a' },
            { key: 'titleFontSize', label: 'Title Font Size', placeholder: '30px' },
            { key: 'titleFontWeight', label: 'Title Font Weight', placeholder: '800' },
            { key: 'titleLineHeight', label: 'Title Line Height', placeholder: '1.2' },
            { key: 'titleMarginBottom', label: 'Title Bottom Margin', placeholder: '4px' },
            { key: 'subtitleColor', label: 'Subtitle Color', kind: 'color', fallback: '#64748b' },
            { key: 'subtitleFontSize', label: 'Subtitle Font Size', placeholder: '13px' },
            { key: 'subtitleLineHeight', label: 'Subtitle Line Height', placeholder: '1.5' },
        ],
    },
    {
        id: 'form',
        group: 'styles',
        title: 'Labels & Inputs',
        description: 'লেবেল, ইনপুট, প্লেসহোল্ডার, ফোকাস রিং ও রিকোয়ার্ড মার্ক।',
        icon: Type,
        fields: [
            { key: 'labelColor', label: 'Label Color', kind: 'color', fallback: '#334155' },
            { key: 'labelFontSize', label: 'Label Font Size', placeholder: '11px' },
            { key: 'labelFontWeight', label: 'Label Font Weight', placeholder: '700' },
            { key: 'labelLetterSpacing', label: 'Label Letter Spacing', placeholder: '0.05em' },
            {
                key: 'labelTextTransform',
                label: 'Label Text Transform',
                kind: 'select',
                options: TEXT_TRANSFORM_OPTIONS,
            },
            { key: 'labelMarginBottom', label: 'Label Bottom Margin', placeholder: '4px' },
            {
                key: 'requiredMarkColor',
                label: 'Required Mark Color',
                kind: 'color',
                fallback: '#f43f5e',
            },
            { key: 'inputBgColor', label: 'Input Background', kind: 'color', fallback: '#ffffff' },
            {
                key: 'inputTextColor',
                label: 'Input Text Color',
                kind: 'color',
                fallback: '#0f172a',
            },
            {
                key: 'inputBorderColor',
                label: 'Input Border Color',
                kind: 'color',
                fallback: '#cbd5e1',
            },
            { key: 'inputBorderWidth', label: 'Input Border Width', placeholder: '1px' },
            { key: 'inputBorderRadius', label: 'Input Border Radius', placeholder: '12px' },
            { key: 'inputPaddingX', label: 'Input Padding X', placeholder: '12px' },
            { key: 'inputPaddingY', label: 'Input Padding Y', placeholder: '10px' },
            { key: 'inputFontSize', label: 'Input Font Size', placeholder: '14px' },
            {
                key: 'inputIconColor',
                label: 'Input Icon Color',
                kind: 'color',
                fallback: '#94a3b8',
            },
            {
                key: 'inputPlaceholderColor',
                label: 'Placeholder Color',
                kind: 'color',
                fallback: '#94a3b8',
            },
            {
                key: 'inputFocusColor',
                label: 'Focus Border Color',
                kind: 'color',
                fallback: '#10b981',
            },
            {
                key: 'inputFocusRingColor',
                label: 'Focus Ring Color',
                placeholder: 'rgba(16, 185, 129, 0.18)',
                hint: 'rgba() বা hex কালার ব্যবহার করতে পারেন।',
            },
        ],
    },
    {
        id: 'products',
        group: 'styles',
        title: 'Product Cards',
        description: 'প্রোডাক্ট প্যানেল, কার্ড, প্রাইস, ইমেজ, ব্যাজ ও ভ্যারিয়েন্ট।',
        icon: ListChecks,
        fields: [
            {
                key: 'productPanelBgColor',
                label: 'Panel Background',
                kind: 'color',
                fallback: '#f8fafc',
            },
            {
                key: 'productPanelBorderColor',
                label: 'Panel Border Color',
                kind: 'color',
                fallback: '#e2e8f0',
            },
            { key: 'productPanelBorderRadius', label: 'Panel Radius', placeholder: '12px' },
            { key: 'productPanelPadding', label: 'Panel Padding', placeholder: '12px' },
            {
                key: 'productPanelTitleColor',
                label: 'Panel Title Color',
                kind: 'color',
                fallback: '#334155',
            },
            {
                key: 'productCardBgColor',
                label: 'Card Background',
                kind: 'color',
                fallback: '#ffffff',
            },
            {
                key: 'productCardSelectedBgColor',
                label: 'Selected Card Background',
                kind: 'color',
                fallback: '#ecfdf5',
            },
            {
                key: 'productCardBorderColor',
                label: 'Card Border Color',
                kind: 'color',
                fallback: '#e2e8f0',
            },
            {
                key: 'productCardSelectedBorderColor',
                label: 'Selected Card Border',
                kind: 'color',
                fallback: '#10b981',
            },
            { key: 'productCardBorderWidth', label: 'Card Border Width', placeholder: '1px' },
            {
                key: 'productCardSelectedBorderWidth',
                label: 'Selected Border Width',
                placeholder: '2px',
            },
            { key: 'productCardBorderRadius', label: 'Card Radius', placeholder: '12px' },
            { key: 'productCardPadding', label: 'Card Padding', placeholder: '10px' },
            {
                key: 'productTitleColor',
                label: 'Product Title Color',
                kind: 'color',
                fallback: '#0f172a',
            },
            { key: 'productTitleFontSize', label: 'Product Title Size', placeholder: '12px' },
            { key: 'productPriceColor', label: 'Price Color', kind: 'color', fallback: '#059669' },
            { key: 'productPriceFontSize', label: 'Price Font Size', placeholder: '14px' },
            {
                key: 'productOldPriceColor',
                label: 'Old Price Color',
                kind: 'color',
                fallback: '#94a3b8',
            },
            {
                key: 'productInfoTextColor',
                label: 'Product Info Color',
                kind: 'color',
                fallback: '#64748b',
            },
            { key: 'productInfoFontSize', label: 'Product Info Size', placeholder: '10px' },
            { key: 'productImageSize', label: 'Image Size', placeholder: '40px' },
            { key: 'productImageRadius', label: 'Image Radius', placeholder: '8px' },
            {
                key: 'productBadgeBgColor',
                label: 'Product Badge Background',
                kind: 'color',
                fallback: '#fef3c7',
            },
            {
                key: 'productBadgeTextColor',
                label: 'Product Badge Text',
                kind: 'color',
                fallback: '#92400e',
            },
            {
                key: 'productBadgeBorderRadius',
                label: 'Product Badge Radius',
                placeholder: '9999px',
            },
            { key: 'productBadgeFontSize', label: 'Product Badge Size', placeholder: '9px' },
            {
                key: 'variantBgColor',
                label: 'Variant Background',
                kind: 'color',
                fallback: '#ffffff',
            },
            {
                key: 'variantTextColor',
                label: 'Variant Text Color',
                kind: 'color',
                fallback: '#334155',
            },
            {
                key: 'variantBorderColor',
                label: 'Variant Border Color',
                kind: 'color',
                fallback: '#e2e8f0',
            },
            {
                key: 'variantSelectedBgColor',
                label: 'Selected Variant Background',
                kind: 'color',
                fallback: '#059669',
            },
            {
                key: 'variantSelectedTextColor',
                label: 'Selected Variant Text',
                kind: 'color',
                fallback: '#ffffff',
            },
            {
                key: 'variantSelectedBorderColor',
                label: 'Selected Variant Border',
                kind: 'color',
                fallback: '#059669',
            },
            { key: 'variantBorderRadius', label: 'Variant Radius', placeholder: '6px' },
            { key: 'variantFontSize', label: 'Variant Font Size', placeholder: '10px' },
        ],
    },
    {
        id: 'shipping',
        group: 'styles',
        title: 'Shipping & Summary',
        description: 'শিপিং ড্রপডাউন এবং অর্ডার সামারি বক্সের স্টাইল।',
        icon: Truck,
        fields: [
            {
                key: 'shippingBgColor',
                label: 'Shipping Background',
                kind: 'color',
                fallback: '#ecfdf5',
            },
            {
                key: 'shippingTextColor',
                label: 'Shipping Text Color',
                kind: 'color',
                fallback: '#0f172a',
            },
            {
                key: 'shippingBorderColor',
                label: 'Shipping Border Color',
                kind: 'color',
                fallback: '#10b981',
            },
            { key: 'shippingBorderWidth', label: 'Shipping Border Width', placeholder: '2px' },
            { key: 'shippingBorderRadius', label: 'Shipping Radius', placeholder: '12px' },
            { key: 'shippingPadding', label: 'Shipping Padding', placeholder: '10px' },
            { key: 'shippingFontSize', label: 'Shipping Font Size', placeholder: '14px' },
            { key: 'shippingFontWeight', label: 'Shipping Font Weight', placeholder: '600' },
            {
                key: 'summaryBgColor',
                label: 'Summary Background',
                kind: 'color',
                fallback: '#f8fafc',
            },
            {
                key: 'summaryBorderColor',
                label: 'Summary Border Color',
                kind: 'color',
                fallback: '#e2e8f0',
            },
            { key: 'summaryBorderWidth', label: 'Summary Border Width', placeholder: '1px' },
            { key: 'summaryBorderRadius', label: 'Summary Radius', placeholder: '12px' },
            { key: 'summaryPadding', label: 'Summary Padding', placeholder: '16px' },
            {
                key: 'summaryTextColor',
                label: 'Summary Text Color',
                kind: 'color',
                fallback: '#475569',
            },
            {
                key: 'summaryValueColor',
                label: 'Summary Value Color',
                kind: 'color',
                fallback: '#1e293b',
            },
            {
                key: 'summaryTotalColor',
                label: 'Total Amount Color',
                kind: 'color',
                fallback: '#059669',
            },
            { key: 'summaryTotalFontSize', label: 'Total Amount Size', placeholder: '18px' },
            { key: 'summaryFontSize', label: 'Summary Font Size', placeholder: '12px' },
        ],
    },
    {
        id: 'button',
        group: 'styles',
        title: 'Button & Trust Row',
        description: 'সাবমিট বাটন ও ট্রাস্ট ব্যাজের সব স্টাইল।',
        icon: Zap,
        fields: [
            {
                key: 'buttonBgColor',
                label: 'Button Background',
                kind: 'color',
                fallback: '#059669',
            },
            {
                key: 'buttonTextColor',
                label: 'Button Text Color',
                kind: 'color',
                fallback: '#ffffff',
            },
            {
                key: 'buttonHoverBgColor',
                label: 'Button Hover Background',
                kind: 'color',
                fallback: '#047857',
            },
            { key: 'buttonBorderRadius', label: 'Button Radius', placeholder: '12px' },
            {
                key: 'buttonMinHeight',
                label: 'Button Min Height',
                placeholder: 'e.g. 56px (optional)',
            },
            { key: 'buttonPaddingY', label: 'Button Padding Y', placeholder: '16px' },
            { key: 'buttonPaddingX', label: 'Button Padding X', placeholder: '24px' },
            { key: 'buttonFontSize', label: 'Button Font Size', placeholder: '16px' },
            { key: 'buttonFontWeight', label: 'Button Font Weight', placeholder: '800' },
            {
                key: 'buttonShadow',
                label: 'Button Shadow',
                placeholder: '0 20px 25px -5px rgb(5 150 105 / 0.3)',
            },
            {
                key: 'buttonWidth',
                label: 'Button Width',
                kind: 'select',
                options: [
                    { label: 'Full Width', value: 'full' },
                    { label: 'Auto', value: 'auto' },
                ],
            },
            {
                key: 'buttonTextTransform',
                label: 'Button Text Transform',
                kind: 'select',
                options: TEXT_TRANSFORM_OPTIONS,
            },
            { key: 'buttonLetterSpacing', label: 'Button Letter Spacing', placeholder: '0px' },
            {
                key: 'trustTextColor',
                label: 'Trust Text Color',
                kind: 'color',
                fallback: '#64748b',
            },
            { key: 'trustFontSize', label: 'Trust Font Size', placeholder: '11px' },
            {
                key: 'trustIconColor',
                label: 'Trust Icon Color',
                kind: 'color',
                fallback: '#059669',
            },
            { key: 'trustPaddingTop', label: 'Trust Row Top Padding', placeholder: '8px' },
        ],
    },
];

export interface CodCheckoutDesignSettingsProps {
    props: CodCheckoutBlockProps;
    onChange: (key: string, value: unknown) => void;
    mode?: CheckoutSectionGroup;
}

export function CodCheckoutDesignSettings({
    props,
    onChange,
    mode = 'styles',
}: CodCheckoutDesignSettingsProps) {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        content: true,
        layout: true,
        card: false,
        form: false,
        products: false,
        shipping: false,
        button: true,
    });

    const visibleSections = SECTIONS.filter((section) => section.group === mode);
    const isStylesMode = mode === 'styles';

    const toggleSection = (id: string) => {
        setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const renderField = (field: CheckoutField) => {
        const rawValue = props[field.key];
        const value = rawValue === undefined || rawValue === null ? '' : String(rawValue);

        if (field.kind === 'toggle') {
            const checked = rawValue === undefined ? true : Boolean(rawValue);

            return (
                <label
                    key={field.key}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 py-2"
                >
                    <span className="text-[11px] font-semibold text-gray-700">{field.label}</span>
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => onChange(field.key, event.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                </label>
            );
        }

        return (
            <div key={field.key}>
                <label className="mb-1 block text-[11px] font-semibold text-gray-700">
                    {field.label}
                </label>

                {field.kind === 'color' ? (
                    <div className="flex items-center space-x-1.5">
                        <input
                            type="color"
                            value={
                                /^#[0-9a-fA-F]{6}$/.test(value)
                                    ? value
                                    : field.fallback || '#000000'
                            }
                            onChange={(event) => onChange(field.key, event.target.value)}
                            className="h-7 w-7 shrink-0 cursor-pointer rounded border border-gray-300 p-0.5"
                        />
                        <input
                            type="text"
                            value={value}
                            placeholder={field.placeholder || field.fallback || '#000000'}
                            onChange={(event) => onChange(field.key, event.target.value)}
                            className="w-full rounded-lg border-gray-300 p-1.5 font-mono text-[11px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                    </div>
                ) : field.kind === 'select' ? (
                    <select
                        value={value}
                        onChange={(event) => onChange(field.key, event.target.value)}
                        className="w-full cursor-pointer rounded-lg border-gray-300 bg-white p-1.5 text-xs focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    >
                        {(field.options || []).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                ) : field.kind === 'textarea' ? (
                    <textarea
                        rows={2}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(event) => onChange(field.key, event.target.value)}
                        className="w-full rounded-lg border-gray-300 p-1.5 text-xs focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                ) : (
                    <input
                        type="text"
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(event) => onChange(field.key, event.target.value)}
                        className="w-full rounded-lg border-gray-300 p-1.5 text-xs focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                )}

                {field.hint && <p className="mt-0.5 text-[10px] text-gray-400">{field.hint}</p>}
            </div>
        );
    };

    return (
        <div className="space-y-2.5">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-indigo-900">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{isStylesMode ? 'Checkout Designer' : 'Checkout Content'}</span>
                </div>
                <p className="mt-0.5 text-[10px] leading-relaxed text-indigo-700">
                    {isStylesMode ? (
                        <>
                            কার্ড, ইনপুট, প্রোডাক্ট কার্ড, শিপিং, সামারি ও বাটনের প্রতিটি স্টাইল
                            এখান থেকে কাস্টমাইজ করুন। সেকশনের বাইরের background, padding, margin ও
                            width নিচের <span className="font-bold">Background</span>,{' '}
                            <span className="font-bold">Spacing</span> অপশন থেকে নিয়ন্ত্রণ করুন।
                        </>
                    ) : (
                        <>
                            শেকআউটের টেক্সট, কোন অংশ দেখাবে এবং ফর্মের লেবেল/প্লেসহোল্ডার এখানে
                            সম্পাদনা করুন। রঙ, প্যাডিং, বর্ডার ও টাইপোগ্রাফি{' '}
                            <span className="font-bold">Styles</span> ট্যাবে পাবেন।
                        </>
                    )}
                </p>
            </div>

            {visibleSections.map((section) => {
                const Icon = section.icon;
                const isOpen = Boolean(openSections[section.id]);

                return (
                    <div
                        key={section.id}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs"
                    >
                        <button
                            type="button"
                            onClick={() => toggleSection(section.id)}
                            className="flex w-full cursor-pointer items-center justify-between bg-gray-50/80 px-3 py-2.5 text-left transition hover:bg-gray-100/70"
                        >
                            <div className="flex min-w-0 items-center space-x-2">
                                <Icon className="h-3.5 w-3.5 shrink-0 text-primary-600" />
                                <span className="min-w-0">
                                    <span className="block truncate text-[11px] font-bold text-gray-800">
                                        {section.title}
                                    </span>
                                    <span className="block truncate text-[9px] text-gray-400">
                                        {section.description}
                                    </span>
                                </span>
                            </div>
                            {isOpen ? (
                                <ChevronUp className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            )}
                        </button>

                        {isOpen && (
                            <div className="space-y-2.5 p-3">
                                {section.fields.map((field) => renderField(field))}
                            </div>
                        )}
                    </div>
                );
            })}

            {isStylesMode && (
                <div className="flex items-start space-x-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] leading-relaxed text-amber-800">
                    <Receipt className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>
                        সিকিউরিটির জন্য <code className="font-mono">url()</code>,{' '}
                        <code className="font-mono">@import</code>,
                        <code className="font-mono"> expression()</code> এবং{' '}
                        <code className="font-mono">;</code> যুক্ত ভ্যালু গ্রহণ করা হয় না।
                    </span>
                </div>
            )}
        </div>
    );
}
