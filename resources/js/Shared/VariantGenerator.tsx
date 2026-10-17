import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';

export interface VariantRowItem {
    id?: number;
    name: string;
    sku: string;
    attributes: Record<string, string> | null;
    regular_price: string | number;
    sale_price: string | number | null;
    stock_quantity: number;
    manage_stock: boolean;
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

export function VariantGenerator({
    variants,
    onChangeVariants,
    basePrice,
    baseSalePrice,
    productSlug,
}: VariantGeneratorProps) {
    const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([
        { name: 'Size', values: ['M', 'L', 'XL'], currentInput: '' },
    ]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [matrixError, setMatrixError] = useState<string | null>(null);

    const handleAddAttribute = () => {
        setAttributeOptions((prev) => [...prev, { name: '', values: [], currentInput: '' }]);
    };

    const handleRemoveAttribute = (index: number) => {
        setAttributeOptions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAttributeNameChange = (index: number, name: string) => {
        setAttributeOptions((prev) =>
            prev.map((attr, i) => (i === index ? { ...attr, name } : attr))
        );
    };

    const handleAddValue = (index: number) => {
        const attr = attributeOptions[index];
        const val = attr.currentInput.trim();
        if (val && !attr.values.includes(val)) {
            setAttributeOptions((prev) =>
                prev.map((item, i) =>
                    i === index
                        ? {
                              ...item,
                              values: [...item.values, val],
                              currentInput: '',
                          }
                        : item
                )
            );
        }
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

    const handleGenerateMatrix = async () => {
        setMatrixError(null);

        // Filter valid attributes
        const payload: Record<string, string[]> = {};
        for (const attr of attributeOptions) {
            const name = attr.name.trim();
            if (name && attr.values.length > 0) {
                payload[name] = attr.values;
            }
        }

        if (Object.keys(payload).length === 0) {
            setMatrixError('Please define at least one attribute with at least one value.');
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/admin/products/matrix-preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                            ?.content || '',
                },
                body: JSON.stringify({ attributes: payload }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate variant combinations');
            }

            const data = (await response.json()) as {
                combinations: Array<{
                    name: string;
                    sku_suffix: string;
                    attributes: Record<string, string>;
                }>;
            };

            const prefix = productSlug
                ? productSlug.toUpperCase().replace(/[^A-Z0-9]/g, '')
                : 'PROD';

            const newVariants: VariantRowItem[] = data.combinations.map((c) => ({
                name: c.name,
                sku: `${prefix}-${c.sku_suffix}`,
                attributes: c.attributes,
                regular_price: basePrice || '0.00',
                sale_price: baseSalePrice || null,
                stock_quantity: 10,
                manage_stock: true,
            }));

            onChangeVariants(newVariants);
        } catch (err: unknown) {
            setMatrixError(
                err instanceof Error ? err.message : 'Unable to generate variants matrix'
            );
        } finally {
            setIsGenerating(false);
        }
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
            stock_quantity: 0,
            manage_stock: true,
        };
        onChangeVariants([...variants, newVar]);
    };

    const handleUpdateVariant = (
        index: number,
        field: keyof VariantRowItem,
        value: string | number | boolean | null
    ) => {
        const updated = variants.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        onChangeVariants(updated);
    };

    const handleRemoveVariant = (index: number) => {
        onChangeVariants(variants.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            {/* Attribute builder section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800">
                            Variant Attributes Generator
                        </h4>
                        <p className="text-xs text-slate-500">
                            Add attributes (e.g., Size, Color) and values to calculate Cartesian
                            product matrix.
                        </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddAttribute}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Attribute
                    </Button>
                </div>

                {attributeOptions.map((attr, attrIdx) => (
                    <div
                        key={attrIdx}
                        className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3"
                    >
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Attribute name (e.g. Size, Color)"
                                value={attr.name}
                                onChange={(e) => handleAttributeNameChange(attrIdx, e.target.value)}
                                className="w-48 text-sm rounded-md border-gray-300 shadow-2xs focus:border-primary-500 focus:ring-primary-500"
                            />
                            <div className="flex-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Add value (e.g. Red) & press Enter"
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
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddValue(attrIdx);
                                        }
                                    }}
                                    className="flex-1 text-sm rounded-md border-gray-300 shadow-2xs focus:border-primary-500 focus:ring-primary-500"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleAddValue(attrIdx)}
                                >
                                    Add
                                </Button>
                            </div>
                            {attributeOptions.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAttribute(attrIdx)}
                                    className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                                    title="Remove attribute"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Attribute tags */}
                        {attr.values.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {attr.values.map((val, valIdx) => (
                                    <span
                                        key={valIdx}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                    >
                                        <span>{val}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveValue(attrIdx, valIdx)}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {matrixError && <p className="text-xs text-rose-600 font-medium">{matrixError}</p>}

                <div className="flex items-center justify-between pt-2">
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        isLoading={isGenerating}
                        onClick={handleGenerateMatrix}
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Generate Combinations Matrix
                    </Button>
                    <span className="text-xs text-slate-500">
                        {variants.length} combinations active
                    </span>
                </div>
            </div>

            {/* Variants table */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                        Product Variants ({variants.length})
                    </h4>
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

                {variants.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-xl bg-gray-50 text-gray-400 text-xs">
                        No variants generated yet. Click &quot;Generate Combinations Matrix&quot;
                        above or add one manually.
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-2xs">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3">Variant Name</th>
                                    <th className="py-2.5 px-3">SKU</th>
                                    <th className="py-2.5 px-3">Regular (৳)</th>
                                    <th className="py-2.5 px-3">Sale (৳)</th>
                                    <th className="py-2.5 px-3">Stock</th>
                                    <th className="py-2.5 px-3 text-center">Manage</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {variants.map((v, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="py-2 px-3">
                                            <input
                                                type="text"
                                                value={v.name}
                                                onChange={(e) =>
                                                    handleUpdateVariant(idx, 'name', e.target.value)
                                                }
                                                className="w-full text-xs rounded border-gray-300 py-1 px-2 focus:border-primary-500 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
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
                                                className="w-full text-xs font-mono uppercase rounded border-gray-300 py-1 px-2 focus:border-primary-500 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="py-2 px-3 w-28">
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
                                                className="w-full text-xs rounded border-gray-300 py-1 px-2 focus:border-primary-500 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="py-2 px-3 w-28">
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
                                                className="w-full text-xs rounded border-gray-300 py-1 px-2 focus:border-primary-500 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="py-2 px-3 w-24">
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
                                                className="w-full text-xs rounded border-gray-300 py-1 px-2 disabled:bg-gray-100 focus:border-primary-500 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-center w-20">
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
                                        <td className="py-2 px-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVariant(idx)}
                                                className="text-gray-400 hover:text-rose-600 p-1"
                                                title="Remove variant"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
