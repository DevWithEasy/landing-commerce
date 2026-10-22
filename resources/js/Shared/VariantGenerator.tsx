import { Camera, Check, Layers, Palette, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from './Button';
import { SafeImage } from './SafeImage';

export interface VariantRowItem {
    id?: number;
    name: string;
    sku: string;
    attributes: Record<string, string> | null;
    regular_price: string | number;
    sale_price: string | number | null;
    stock_quantity: number;
    manage_stock: boolean;
    image_file?: File | null;
    image_url?: string | null;
    remove_image?: boolean;
}

export interface AttributeOption {
    name: string;
    values: string[];
    currentInput: string;
}

export interface VariantGeneratorProps {
    variants: VariantRowItem[];
    onChangeVariants: (variants: VariantRowItem[]) => void;
    basePrice: string | number;
    baseSalePrice: string | number | null;
    productSlug: string;
}

const COMMON_PRESETS: Record<string, string[]> = {
    Color: ['Black', 'White', 'Red', 'Blue', 'Green', 'Navy', 'Maroon'],
    Size: ['S', 'M', 'L', 'XL', 'XXL'],
    Material: ['Cotton', 'Leather', 'Silk', 'Denim'],
};

export function VariantGenerator({
    variants,
    onChangeVariants,
    basePrice,
    baseSalePrice,
    productSlug,
}: VariantGeneratorProps) {
    const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([
        { name: 'Color', values: ['Black', 'White'], currentInput: '' },
        { name: 'Size', values: ['M', 'L'], currentInput: '' },
    ]);
    const [matrixMessage, setMatrixMessage] = useState<string | null>(null);
    const [matrixError, setMatrixError] = useState<string | null>(null);

    // Bulk action states
    const [bulkPrice, setBulkPrice] = useState('');
    const [bulkStock, setBulkStock] = useState('');

    const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const handleAddAttribute = (defaultName = '', defaultValues: string[] = []) => {
        setAttributeOptions((prev) => [
            ...prev,
            { name: defaultName, values: defaultValues, currentInput: '' },
        ]);
    };

    const handleRemoveAttribute = (index: number) => {
        setAttributeOptions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAttributeNameChange = (index: number, name: string) => {
        setAttributeOptions((prev) =>
            prev.map((attr, i) => (i === index ? { ...attr, name } : attr))
        );
    };

    const addValuesToAttr = (index: number, rawInput: string) => {
        if (!rawInput.trim()) return;

        // Split by comma or newline if user entered multiple values at once
        const items = rawInput
            .split(/[,|\n]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        if (items.length === 0) return;

        setAttributeOptions((prev) =>
            prev.map((attr, i) => {
                if (i !== index) return attr;
                const newValues = [...attr.values];
                for (const val of items) {
                    if (!newValues.includes(val)) {
                        newValues.push(val);
                    }
                }
                return {
                    ...attr,
                    values: newValues,
                    currentInput: '',
                };
            })
        );
    };

    const handleRemoveValue = (attrIndex: number, valIndex: number) => {
        setAttributeOptions((prev) =>
            prev.map((item, i) =>
                i === attrIndex
                    ? {
                          ...item,
                          values: item.values.filter((_, vi) => vi !== valIndex),
                      }
                    : item
            )
        );
    };

    // Client-side Cartesian Product Generator (WooCommerce Style)
    const handleGenerateMatrix = () => {
        setMatrixError(null);
        setMatrixMessage(null);

        // First flush any remaining currentInput across all attributes
        const preparedAttrs = attributeOptions.map((attr) => {
            const values = [...attr.values];
            if (attr.currentInput.trim()) {
                const items = attr.currentInput
                    .split(/[,|\n]+/)
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                for (const item of items) {
                    if (!values.includes(item)) {
                        values.push(item);
                    }
                }
            }
            return {
                name: attr.name.trim(),
                values,
            };
        });

        // Filter valid attributes and guarantee unique names
        const validAttrs: Array<{ name: string; values: string[] }> = [];
        const seenNames = new Map<string, number>();

        preparedAttrs.forEach((attr, idx) => {
            if (attr.values.length > 0) {
                let attrName = attr.name || `Attribute ${idx + 1}`;
                if (seenNames.has(attrName)) {
                    const count = seenNames.get(attrName)! + 1;
                    seenNames.set(attrName, count);
                    attrName = `${attrName} ${count}`;
                } else {
                    seenNames.set(attrName, 1);
                }
                validAttrs.push({ name: attrName, values: attr.values });
            }
        });

        if (validAttrs.length === 0) {
            setMatrixError('Please add at least one attribute (e.g. Color or Size) with values.');
            return;
        }

        // Compute Cartesian Product
        let combos: Array<{ nameParts: string[]; skuParts: string[]; attrs: Record<string, string> }> = [
            { nameParts: [], skuParts: [], attrs: {} },
        ];

        for (const attr of validAttrs) {
            const nextCombos: typeof combos = [];
            for (const current of combos) {
                for (const val of attr.values) {
                    nextCombos.push({
                        nameParts: [...current.nameParts, val],
                        skuParts: [
                            ...current.skuParts,
                            val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'V',
                        ],
                        attrs: { ...current.attrs, [attr.name]: val },
                    });
                }
            }
            combos = nextCombos;
        }

        const prefix = productSlug
            ? productSlug.toUpperCase().replace(/[^A-Z0-9]/g, '')
            : 'PROD';

        const newVariants: VariantRowItem[] = combos.map((c, i) => ({
            name: c.nameParts.join(' / '),
            sku: `${prefix}-${c.skuParts.join('-') || `VAR-${i + 1}`}`,
            attributes: c.attrs,
            regular_price: basePrice || '0.00',
            sale_price: baseSalePrice || null,
            stock_quantity: 10,
            manage_stock: true,
            image_file: null,
            image_url: null,
        }));

        onChangeVariants(newVariants);
        setMatrixMessage(`Successfully generated ${newVariants.length} variant combinations!`);
    };

    const handleAddManualVariant = () => {
        const prefix = productSlug ? productSlug.toUpperCase().replace(/[^A-Z0-9]/g, '') : 'PROD';
        const nextNum = variants.length + 1;
        const newVar: VariantRowItem = {
            name: `Variant ${nextNum}`,
            sku: `${prefix}-VAR-${nextNum}`,
            attributes: null,
            regular_price: basePrice || '0.00',
            sale_price: baseSalePrice || null,
            stock_quantity: 10,
            manage_stock: true,
            image_file: null,
            image_url: null,
        };
        onChangeVariants([...variants, newVar]);
    };

    const handleUpdateVariant = (
        index: number,
        field: keyof VariantRowItem,
        value: string | number | boolean | File | null
    ) => {
        const updated = variants.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        onChangeVariants(updated);
    };

    const handleVariantImageSelected = (index: number, file: File) => {
        const previewUrl = URL.createObjectURL(file);
        const updated = variants.map((item, i) => {
            if (i === index) {
                return {
                    ...item,
                    image_file: file,
                    image_url: previewUrl,
                    remove_image: false,
                };
            }
            return item;
        });
        onChangeVariants(updated);
    };

    const handleRemoveVariantImage = (index: number) => {
        const updated = variants.map((item, i) => {
            if (i === index) {
                return {
                    ...item,
                    image_file: null,
                    image_url: null,
                    remove_image: true,
                };
            }
            return item;
        });
        onChangeVariants(updated);
    };

    const handleRemoveVariant = (index: number) => {
        onChangeVariants(variants.filter((_, i) => i !== index));
    };

    const handleApplyBulkPrice = () => {
        if (!bulkPrice || isNaN(Number(bulkPrice))) return;
        const updated = variants.map((v) => ({
            ...v,
            regular_price: bulkPrice,
        }));
        onChangeVariants(updated);
        setBulkPrice('');
    };

    const handleApplyBulkStock = () => {
        if (!bulkStock || isNaN(Number(bulkStock))) return;
        const stockNum = parseInt(bulkStock) || 0;
        const updated = variants.map((v) => ({
            ...v,
            stock_quantity: stockNum,
        }));
        onChangeVariants(updated);
        setBulkStock('');
    };

    return (
        <div className="space-y-6">
            {/* Attribute builder section (WooCommerce Style) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                        <div className="flex items-center space-x-2">
                            <Palette className="w-4 h-4 text-primary-600" />
                            <h4 className="text-sm font-bold text-slate-900">
                                Variant Attributes Generator (WooCommerce Style)
                            </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Add attributes (e.g., Color, Size) and values to automatically generate the variant combinations matrix.
                        </p>
                    </div>

                    {/* Quick Add Presets */}
                    <div className="flex items-center flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={() => handleAddAttribute('Color', ['Black', 'White', 'Red'])}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-primary-500 hover:text-primary-600 shadow-2xs transition"
                        >
                            + Color
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAddAttribute('Size', ['M', 'L', 'XL'])}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-primary-500 hover:text-primary-600 shadow-2xs transition"
                        >
                            + Size
                        </button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddAttribute('')}
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Custom
                        </Button>
                    </div>
                </div>

                {/* Attribute Rows */}
                <div className="space-y-3">
                    {attributeOptions.map((attr, attrIdx) => (
                        <div
                            key={attrIdx}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="w-full sm:w-52">
                                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                                        Attribute Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Color, Size, Material"
                                        value={attr.name}
                                        onChange={(e) =>
                                            handleAttributeNameChange(attrIdx, e.target.value)
                                        }
                                        className="w-full text-sm font-medium rounded-lg border-gray-300 shadow-2xs focus:border-primary-500 focus:ring-primary-500"
                                    />
                                </div>

                                <div className="flex-1">
                                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                                        Attribute Values (Type values and press Enter or comma)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="e.g. Red, Blue, Green (Press Enter)"
                                            value={attr.currentInput}
                                            onChange={(e) =>
                                                setAttributeOptions((prev) =>
                                                    prev.map((item, i) =>
                                                        i === attrIdx
                                                            ? { ...item, currentInput: e.target.value }
                                                            : item
                                                    )
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ',') {
                                                    e.preventDefault();
                                                    addValuesToAttr(attrIdx, attr.currentInput);
                                                }
                                            }}
                                            className="flex-1 text-sm rounded-lg border-gray-300 shadow-2xs focus:border-primary-500 focus:ring-primary-500"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => addValuesToAttr(attrIdx, attr.currentInput)}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>

                                {attributeOptions.length > 1 && (
                                    <div className="sm:pt-5">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAttribute(attrIdx)}
                                            className="text-gray-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
                                            title="Remove attribute"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Preset suggestions for this attribute */}
                            {COMMON_PRESETS[attr.name] && (
                                <div className="flex items-center flex-wrap gap-1 text-[11px] text-slate-500 pt-1">
                                    <span className="font-semibold text-slate-600 mr-1">Quick Suggestions:</span>
                                    {COMMON_PRESETS[attr.name].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => addValuesToAttr(attrIdx, suggestion)}
                                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-600 border border-slate-200 transition"
                                        >
                                            + {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Attribute tags badge list */}
                            {attr.values.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                                    {attr.values.map((val, valIdx) => (
                                        <span
                                            key={valIdx}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-800 border border-primary-200 shadow-2xs"
                                        >
                                            <span>{val}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveValue(attrIdx, valIdx)}
                                                className="text-primary-500 hover:text-rose-600 font-bold"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {matrixError && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                        {matrixError}
                    </div>
                )}

                {matrixMessage && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{matrixMessage}</span>
                    </div>
                )}

                {/* Generate Button Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={handleGenerateMatrix}
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Combinations Matrix
                    </Button>
                    <span className="text-xs font-semibold text-slate-600">
                        {variants.length} combinations active
                    </span>
                </div>
            </div>

            {/* Variants table with WooCommerce style image upload */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-primary-600" />
                        <h4 className="text-sm font-bold text-gray-900">
                            Product Variants & Gallery ({variants.length})
                        </h4>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                        {/* Bulk Pricing */}
                        {variants.length > 0 && (
                            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                                <input
                                    type="number"
                                    placeholder="Bulk ৳"
                                    value={bulkPrice}
                                    onChange={(e) => setBulkPrice(e.target.value)}
                                    className="w-20 text-xs rounded border-gray-300 py-1 px-1.5 focus:border-primary-500 focus:ring-primary-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyBulkPrice}
                                    className="text-[11px] font-semibold px-2 py-1 bg-white hover:bg-primary-50 text-slate-700 hover:text-primary-700 rounded border border-slate-200"
                                >
                                    Set Price
                                </button>
                            </div>
                        )}

                        {/* Bulk Stock */}
                        {variants.length > 0 && (
                            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                                <input
                                    type="number"
                                    placeholder="Bulk Stock"
                                    value={bulkStock}
                                    onChange={(e) => setBulkStock(e.target.value)}
                                    className="w-20 text-xs rounded border-gray-300 py-1 px-1.5 focus:border-primary-500 focus:ring-primary-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyBulkStock}
                                    className="text-[11px] font-semibold px-2 py-1 bg-white hover:bg-primary-50 text-slate-700 hover:text-primary-700 rounded border border-slate-200"
                                >
                                    Set Stock
                                </button>
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddManualVariant}
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Single Variant
                        </Button>
                    </div>
                </div>

                {variants.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-xs space-y-2">
                        <Sparkles className="w-8 h-8 mx-auto text-slate-400" />
                        <p className="font-semibold text-slate-700">No variants generated yet.</p>
                        <p>
                            Add attributes above and click &quot;Generate Combinations Matrix&quot; or add single variants manually.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-2xs">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="py-3 px-3 w-16 text-center">Image</th>
                                    <th className="py-3 px-3">Variant Name</th>
                                    <th className="py-3 px-3">SKU</th>
                                    <th className="py-3 px-3 w-28">Regular (৳)</th>
                                    <th className="py-3 px-3 w-28">Sale (৳)</th>
                                    <th className="py-3 px-3 w-24">Stock</th>
                                    <th className="py-3 px-3 text-center w-20">Manage</th>
                                    <th className="py-3 px-3 text-right w-12">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {variants.map((v, idx) => {
                                    const previewImage = v.image_url || null;

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                                            {/* WooCommerce-Style Variant Image Box */}
                                            <td className="py-2.5 px-3 text-center align-middle">
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    ref={(el) => {
                                                        fileInputRefs.current[idx] = el;
                                                    }}
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            handleVariantImageSelected(
                                                                idx,
                                                                e.target.files[0]
                                                            );
                                                        }
                                                    }}
                                                />

                                                {previewImage ? (
                                                    <div className="relative group w-12 h-12 mx-auto rounded-lg border border-slate-300 overflow-hidden shadow-2xs">
                                                        <SafeImage
                                                            src={previewImage}
                                                            alt={v.name}
                                                            className="w-full h-full object-cover"
                                                            fallbackIconSize="w-5 h-5"
                                                            fallbackText=""
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveVariantImage(idx)
                                                            }
                                                            className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow-md hover:bg-rose-700 transition"
                                                            title="Remove Image"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                fileInputRefs.current[idx]?.click()
                                                            }
                                                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[9px] font-semibold"
                                                        >
                                                            Change
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            fileInputRefs.current[idx]?.click()
                                                        }
                                                        className="w-12 h-12 mx-auto rounded-lg border-2 border-dashed border-slate-300 hover:border-primary-500 bg-slate-50 hover:bg-primary-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-primary-600 transition"
                                                        title="Upload variant specific image"
                                                    >
                                                        <Camera className="w-4 h-4" />
                                                        <span className="text-[8px] font-bold mt-0.5">
                                                            + Photo
                                                        </span>
                                                    </button>
                                                )}
                                            </td>

                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="text"
                                                    value={v.name}
                                                    onChange={(e) =>
                                                        handleUpdateVariant(idx, 'name', e.target.value)
                                                    }
                                                    className="w-full text-xs font-medium rounded-lg border-gray-300 py-1.5 px-2.5 focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </td>

                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="text"
                                                    value={v.sku}
                                                    onChange={(e) =>
                                                        handleUpdateVariant(
                                                            idx,
                                                            'sku',
                                                            e.target.value.toUpperCase()
                                                        )
                                                    }
                                                    className="w-full text-xs font-mono uppercase rounded-lg border-gray-300 py-1.5 px-2.5 focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </td>

                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={v.regular_price}
                                                    onChange={(e) =>
                                                        handleUpdateVariant(
                                                            idx,
                                                            'regular_price',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full text-xs font-semibold rounded-lg border-gray-300 py-1.5 px-2.5 focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </td>

                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="Optional"
                                                    value={v.sale_price ?? ''}
                                                    onChange={(e) =>
                                                        handleUpdateVariant(
                                                            idx,
                                                            'sale_price',
                                                            e.target.value || null
                                                        )
                                                    }
                                                    className="w-full text-xs rounded-lg border-gray-300 py-1.5 px-2.5 focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </td>

                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={v.stock_quantity}
                                                    disabled={!v.manage_stock}
                                                    onChange={(e) =>
                                                        handleUpdateVariant(
                                                            idx,
                                                            'stock_quantity',
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                    className="w-full text-xs rounded-lg border-gray-300 py-1.5 px-2.5 disabled:bg-gray-100 focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </td>

                                            <td className="py-2.5 px-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={v.manage_stock}
                                                    onChange={(e) =>
                                                        handleUpdateVariant(
                                                            idx,
                                                            'manage_stock',
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                                                />
                                            </td>

                                            <td className="py-2.5 px-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveVariant(idx)}
                                                    className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                                                    title="Remove variant"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
