import { useState } from 'react';
import type { CodCheckoutBlockProps, ProductSelectorBlockProps } from '@/types';
import { CodCheckoutDesignSettings } from '../CodCheckoutDesignSettings';
import {
    ControlGrid,
    ControlSection,
    SelectControl,
    TextControl,
    ToggleControl,
} from '../controls';

export interface CommerceInspectorProps<TProps> {
    props: TProps;
    products: Array<{ id: number; title: string }>;
    onChange: (key: string, value: unknown) => void;
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
        const next = selectedIds.includes(id)
            ? selectedIds.filter((p) => p !== id)
            : [...selectedIds, id];
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
        <div className="space-y-3">
            <ControlSection title="Product Selection" defaultOpen>
                {/* Customer Selection Mode Control (Radio vs Checkbox) */}
                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-gray-700">
                        Customer Selection Mode
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <button
                            type="button"
                            onClick={() => onChange('selectionMode', 'single')}
                            className={`flex flex-col rounded-lg border p-2 text-left transition ${
                                selectionMode === 'single'
                                    ? 'border-primary-600 bg-primary-50 font-bold text-primary-900 ring-1 ring-primary-500'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex items-center">
                                <span className="mr-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-primary-600">
                                    {selectionMode === 'single' && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                                    )}
                                </span>
                                Radio Style
                            </span>
                            <span className="mt-0.5 text-[10px] font-normal text-gray-400">
                                Customer picks 1 item
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onChange('selectionMode', 'multiple')}
                            className={`flex flex-col rounded-lg border p-2 text-left transition ${
                                selectionMode === 'multiple'
                                    ? 'border-primary-600 bg-primary-50 font-bold text-primary-900 ring-1 ring-primary-500'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex items-center">
                                <span className="mr-1.5 flex h-3 w-3 items-center justify-center rounded border border-primary-600 text-[10px] leading-none text-primary-600">
                                    {selectionMode === 'multiple' && '✓'}
                                </span>
                                Checkbox Style
                            </span>
                            <span className="mt-0.5 text-[10px] font-normal text-gray-400">
                                Customer picks multiple
                            </span>
                        </button>
                    </div>
                </div>

                {/* Default Pre-Selected State on Page Load */}
                <div className="space-y-2 border-t border-gray-100 pt-2">
                    <label className="block text-[11px] font-semibold text-gray-700">
                        Default Selected on Page Load
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <button
                            type="button"
                            onClick={() => onChange('defaultSelection', 'first')}
                            className={`rounded-md border p-1.5 text-center font-medium transition ${
                                defaultSelection === 'first'
                                    ? 'border-primary-600 bg-primary-50 font-bold text-primary-900'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            First Item Only
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange('defaultSelection', 'all')}
                            className={`rounded-md border p-1.5 text-center font-medium transition ${
                                defaultSelection === 'all'
                                    ? 'border-primary-600 bg-primary-50 font-bold text-primary-900'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            All Items Checked
                        </button>
                    </div>

                    {selectedIds.length > 1 && (
                        <SelectControl
                            label="Or pre-select specific product"
                            value={String(defaultSelectedId || 0)}
                            options={[
                                { label: '-- Auto (First Product) --', value: '0' },
                                ...products
                                    .filter((p) => selectedIds.includes(p.id))
                                    .map((p) => ({
                                        label: p.title,
                                        value: String(p.id),
                                    })),
                            ]}
                            onChange={(val) => {
                                const num = Number(val);
                                onChange('defaultSelectedId', num);
                                if (num > 0) onChange('defaultSelection', 'specific');
                            }}
                        />
                    )}
                </div>

                {/* Product Checkbox Selection List */}
                <div className="border-t border-gray-100 pt-2">
                    <div className="mb-1.5 flex items-center justify-between">
                        <label className="block text-[11px] font-semibold text-gray-700">
                            Products ({selectedIds.length} selected)
                        </label>
                        <div className="space-x-2 text-[11px]">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="font-medium text-primary-600 hover:underline"
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
                            className="mb-2 w-full rounded-lg border border-gray-300 p-1.5 text-xs focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                    )}

                    <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2">
                        {filtered.length === 0 ? (
                            <div className="py-4 text-center text-xs text-gray-400">
                                No products match search
                            </div>
                        ) : (
                            filtered.map((prod) => {
                                const isChecked = selectedIds.includes(prod.id);
                                return (
                                    <label
                                        key={prod.id}
                                        className={`flex cursor-pointer items-center space-x-2.5 rounded-lg p-1.5 text-xs transition ${
                                            isChecked
                                                ? 'bg-primary-50 font-medium text-primary-900'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleToggleProduct(prod.id)}
                                            className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="flex-1 truncate">{prod.title}</span>
                                        <span className="font-mono text-[10px] text-gray-400">
                                            #{prod.id}
                                        </span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>
            </ControlSection>

            <ControlSection title="Badges & Pricing" defaultOpen={false}>
                <ToggleControl
                    label="Show Discount % Badge (e.g. SAVE ৳...)"
                    checked={showDiscountBadge !== false}
                    onChange={(val) => onChange('showDiscountBadge', val)}
                />

                <TextControl
                    label="Default Highlight Badge"
                    value={badgeText || ''}
                    placeholder="e.g. 🔥 Most Popular"
                    onChange={(val) => onChange('badgeText', val)}
                />

                {selectedIds.length > 0 && (
                    <div className="space-y-2 border-t border-gray-100 pt-2">
                        <label className="block text-[11px] font-semibold text-gray-700">
                            Custom Product Badges
                        </label>
                        <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                            {selectedIds.map((pid) => {
                                const prod = products.find((p) => p.id === pid);
                                const currentBadge = (productBadges || {})[pid] || '';
                                return (
                                    <div key={pid} className="flex items-center space-x-2 text-xs">
                                        <span
                                            className="w-28 shrink-0 truncate text-[11px] font-medium text-gray-600"
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
                                            className="flex-1 rounded border border-gray-300 bg-white p-1 text-xs"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </ControlSection>
        </div>
    );
}

export function ProductSelectorBlockInspector({
    props,
    products,
    onChange,
}: CommerceInspectorProps<ProductSelectorBlockProps>) {
    return (
        <div className="space-y-3">
            <ProductPickerSection
                productIds={props.productIds}
                productId={props.productId}
                selectionMode={props.selectionMode}
                defaultSelection={props.defaultSelection}
                defaultSelectedId={props.defaultSelectedId}
                showDiscountBadge={props.showDiscountBadge}
                badgeText={props.badgeText}
                productBadges={props.productBadges}
                products={products}
                onChange={onChange}
            />

            <ControlSection title="Display & Button" defaultOpen>
                <TextControl
                    label="Order Button Text"
                    value={props.orderButtonText || ''}
                    placeholder="অর্ডার করুন"
                    onChange={(val) => onChange('orderButtonText', val)}
                />
                <ToggleControl
                    label="Display Product Price"
                    checked={props.showPrice ?? true}
                    onChange={(val) => onChange('showPrice', val)}
                />
                <ToggleControl
                    label="Display Product Description"
                    checked={props.showDescription ?? true}
                    onChange={(val) => onChange('showDescription', val)}
                />
            </ControlSection>
        </div>
    );
}

export function CodCheckoutBlockInspector({
    props,
    products,
    onChange,
}: CommerceInspectorProps<CodCheckoutBlockProps>) {
    return (
        <div className="space-y-3">
            <ProductPickerSection
                productIds={props.productIds}
                productId={props.productId}
                selectionMode={props.selectionMode}
                defaultSelection={props.defaultSelection}
                defaultSelectedId={props.defaultSelectedId}
                showDiscountBadge={props.showDiscountBadge}
                badgeText={props.badgeText}
                productBadges={props.productBadges}
                products={products}
                onChange={onChange}
            />

            <ControlSection title="Form Fields & Labels" defaultOpen>
                <ControlGrid columns={2}>
                    <TextControl
                        label="Name Label"
                        value={props.nameLabel ?? ''}
                        placeholder="আপনার নাম (Your Name)"
                        onChange={(val) => onChange('nameLabel', val)}
                    />
                    <TextControl
                        label="Name Placeholder"
                        value={props.namePlaceholder ?? ''}
                        placeholder="আপনার পুরো নাম লিখুন..."
                        onChange={(val) => onChange('namePlaceholder', val)}
                    />
                </ControlGrid>

                <ControlGrid columns={2}>
                    <TextControl
                        label="Phone Label"
                        value={props.phoneLabel ?? ''}
                        placeholder="মোবাইল নাম্বার"
                        onChange={(val) => onChange('phoneLabel', val)}
                    />
                    <TextControl
                        label="Phone Placeholder"
                        value={props.phonePlaceholder ?? ''}
                        placeholder="01XXXXXXXXX"
                        onChange={(val) => onChange('phonePlaceholder', val)}
                    />
                </ControlGrid>

                <ControlGrid columns={2}>
                    <TextControl
                        label="Address Label"
                        value={props.addressLabel ?? ''}
                        placeholder="সম্পূর্ণ ডেলিভারি ঠিকানা"
                        onChange={(val) => onChange('addressLabel', val)}
                    />
                    <TextControl
                        label="Address Placeholder"
                        value={props.addressPlaceholder ?? ''}
                        placeholder="বাসা/রোড/এলাকা..."
                        onChange={(val) => onChange('addressPlaceholder', val)}
                    />
                </ControlGrid>

                <TextControl
                    label="Shipping Dropdown Label"
                    value={props.shippingLabel ?? ''}
                    placeholder="শিপিং মেথড (Shipping Method)"
                    onChange={(val) => onChange('shippingLabel', val)}
                />

                <TextControl
                    label="Submit Button Text"
                    value={props.buttonText || ''}
                    placeholder="অর্ডার কনফার্ম করুন — ক্যাশ অন ডেলিভারি"
                    onChange={(val) => onChange('buttonText', val)}
                />
            </ControlSection>

            <CodCheckoutDesignSettings mode="content" props={props} onChange={onChange} />
        </div>
    );
}
