import { RotateCcw, Store } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { StorefrontColorKey, StorefrontColors } from '@/types';

interface ColorField {
    key: StorefrontColorKey;
    label: string;
    hint: string;
}

interface ColorGroup {
    title: string;
    fields: ColorField[];
}

const COLOR_GROUPS: ColorGroup[] = [
    {
        title: 'Page & Cards',
        fields: [
            { key: 'page', label: 'Page Background', hint: 'Main background of every shop page' },
            { key: 'surface', label: 'Card Background', hint: 'Product cards, panels, forms' },
            { key: 'soft', label: 'Soft Background', hint: 'Image placeholders & soft sections' },
            { key: 'line', label: 'Card Border', hint: 'Borders & dividers' },
        ],
    },
    {
        title: 'Brand & Text',
        fields: [
            { key: 'brand', label: 'Brand Color', hint: 'Top bar, badges, active states' },
            { key: 'brand-hover', label: 'Brand Hover', hint: 'Hover state of brand buttons' },
            { key: 'heading', label: 'Heading Text', hint: 'Page & section titles' },
            { key: 'ink', label: 'Primary Text', hint: 'Product names, strong text' },
            { key: 'body', label: 'Body Text', hint: 'Descriptions & paragraphs' },
            { key: 'muted', label: 'Muted Text', hint: 'Hints, meta info' },
        ],
    },
    {
        title: 'Buttons & Links',
        fields: [
            { key: 'cta', label: 'Button Background', hint: 'Add to cart, Order now, Checkout' },
            { key: 'cta-hover', label: 'Button Hover', hint: 'Button hover background' },
            { key: 'cta-text', label: 'Button Text', hint: 'Text on primary buttons' },
            { key: 'highlight', label: 'Highlight / Links', hint: 'Icons, links, focus rings' },
        ],
    },
    {
        title: 'Price & Badges',
        fields: [
            { key: 'price', label: 'Price', hint: 'Product & cart prices' },
            { key: 'sale', label: 'Sale Badge', hint: 'Discount / sale labels' },
        ],
    },
    {
        title: 'Header & Footer',
        fields: [
            { key: 'header', label: 'Header Background', hint: 'Main navigation bar' },
            { key: 'footer', label: 'Footer Background', hint: 'Site footer' },
            { key: 'footer-text', label: 'Footer Text', hint: 'Footer links & text' },
        ],
    },
];

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface StorefrontColorsEditorProps {
    colors: StorefrontColors;
    defaults: StorefrontColors;
    errors?: Record<string, string>;
    onChange: (key: StorefrontColorKey, value: string) => void;
    onResetAll: () => void;
}

export function StorefrontColorsEditor({
    colors,
    defaults,
    errors = {},
    onChange,
    onResetAll,
}: StorefrontColorsEditorProps) {
    const safe = (key: StorefrontColorKey): string =>
        HEX_PATTERN.test(colors[key]) ? colors[key] : defaults[key];

    const previewStyle: CSSProperties = { backgroundColor: safe('page') };
    const isCustomized = (Object.keys(defaults) as StorefrontColorKey[]).some(
        (key) => colors[key].toLowerCase() !== defaults[key].toLowerCase()
    );

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                        <Store className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Storefront Colors</h3>
                        <p className="text-xs text-gray-500">
                            Customer-facing shop pages: Home, Shop, Product, Cart, Checkout, Account. Defaults keep the current design.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onResetAll}
                    disabled={!isCustomized}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset all to default
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                <div className="space-y-6">
                    {COLOR_GROUPS.map((group) => (
                        <div key={group.title}>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{group.title}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {group.fields.map((field) => {
                                    const value = colors[field.key];
                                    const isDefault = value.toLowerCase() === defaults[field.key].toLowerCase();
                                    const error = errors[`storefront_colors.${field.key}`];
                                    return (
                                        <div key={field.key}>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs font-semibold text-gray-700">{field.label}</label>
                                                {!isDefault && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onChange(field.key, defaults[field.key])}
                                                        className="text-[11px] font-medium text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
                                                        title={`Reset to ${defaults[field.key]}`}
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        Reset
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={safe(field.key)}
                                                    onChange={(e) => onChange(field.key, e.target.value)}
                                                    className="w-9 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0"
                                                    aria-label={field.label}
                                                />
                                                <input
                                                    type="text"
                                                    value={value}
                                                    maxLength={7}
                                                    onChange={(e) => onChange(field.key, e.target.value.trim())}
                                                    className={`w-full px-2 py-1.5 text-xs font-mono border rounded-lg ${
                                                        HEX_PATTERN.test(value) ? 'border-gray-300' : 'border-red-400'
                                                    }`}
                                                />
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-1">{field.hint}</p>
                                            {error && <p className="text-[11px] text-red-600 mt-0.5">{error}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Live preview */}
                <div className="lg:sticky lg:top-24 self-start">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Live Preview</h4>
                    <div className="rounded-xl overflow-hidden border border-gray-200 text-left">
                        <div className="px-3 py-1.5 text-[10px] text-white/90" style={{ backgroundColor: safe('brand') }}>
                            Free delivery over ৳2000
                        </div>
                        <div
                            className="px-3 py-2.5 flex items-center justify-between border-b"
                            style={{ backgroundColor: safe('header'), borderColor: safe('line') }}
                        >
                            <span className="font-serif font-bold text-sm" style={{ color: safe('heading') }}>
                                Store
                            </span>
                            <span className="text-[10px]" style={{ color: safe('body') }}>
                                Shop · Track
                            </span>
                        </div>
                        <div className="p-3" style={previewStyle}>
                            <p className="font-serif font-bold text-sm mb-2" style={{ color: safe('heading') }}>
                                New Arrivals
                            </p>
                            <div
                                className="rounded-lg border overflow-hidden"
                                style={{ backgroundColor: safe('surface'), borderColor: safe('line') }}
                            >
                                <div className="aspect-[4/3] relative" style={{ backgroundColor: safe('soft') }}>
                                    <span
                                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold text-white"
                                        style={{ backgroundColor: safe('sale') }}
                                    >
                                        -20%
                                    </span>
                                </div>
                                <div className="p-2.5 space-y-1">
                                    <p className="text-xs font-semibold" style={{ color: safe('ink') }}>
                                        Leather Tote Bag
                                    </p>
                                    <p className="text-[10px]" style={{ color: safe('muted') }}>
                                        Bags · In stock
                                    </p>
                                    <p className="text-sm font-bold" style={{ color: safe('price') }}>
                                        ৳2,500
                                    </p>
                                    <div
                                        className="mt-1.5 h-8 rounded-md flex items-center justify-center text-[11px] font-semibold"
                                        style={{ backgroundColor: safe('cta'), color: safe('cta-text') }}
                                    >
                                        Add to Cart
                                    </div>
                                    <p className="text-[10px] text-center pt-0.5" style={{ color: safe('highlight') }}>
                                        View details →
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="px-3 py-2.5 text-[10px]" style={{ backgroundColor: safe('footer'), color: safe('footer-text') }}>
                            © Store · Policies · Contact
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
