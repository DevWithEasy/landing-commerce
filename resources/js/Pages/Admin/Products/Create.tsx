import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Layers, Package, Tag, UploadCloud } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import { Card } from '@/Shared/Card';
import { ImageUploader } from '@/Shared/ImageUploader';
import type { VariantRowItem } from '@/Shared/VariantGenerator';
import { VariantGenerator } from '@/Shared/VariantGenerator';

interface CreateProductFormData {
    title: string;
    slug: string;
    description: string;
    regular_price: string;
    sale_price: string;
    has_variants: boolean;
    status: 'draft' | 'active' | 'archived';
    stock_quantity: number;
    manage_stock: boolean;
    variants: VariantRowItem[];
    images: File[];
}

export default function Create() {
    const { data, setData, post, processing, errors } = useForm<CreateProductFormData>({
        title: '',
        slug: '',
        description: '',
        regular_price: '',
        sale_price: '',
        has_variants: false,
        status: 'active',
        stock_quantity: 10,
        manage_stock: true,
        variants: [],
        images: [],
    });

    const [autoSlug, setAutoSlug] = useState(true);

    const handleTitleChange = (title: string) => {
        setData((prev) => ({
            ...prev,
            title,
            slug: autoSlug
                ? title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '')
                : prev.slug,
        }));
    };

    const handleFilesSelected = (incomingFiles: File[]) => {
        setData('images', [...data.images, ...incomingFiles]);
    };

    const handleRemoveFile = (index: number) => {
        setData(
            'images',
            data.images.filter((_, i) => i !== index)
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/products', {
            forceFormData: true,
        });
    };

    const calculateDiscountPercent = (): number | null => {
        const reg = parseFloat(data.regular_price);
        const sale = parseFloat(data.sale_price);
        if (!isNaN(reg) && !isNaN(sale) && reg > 0 && sale < reg) {
            return Math.round(((reg - sale) / reg) * 100);
        }
        return null;
    };

    const discountPercent = calculateDiscountPercent();

    return (
        <AdminLayout
            title="Create New Product"
            subtitle="Add a standalone or multi-variant product to your landing commerce catalog."
            actions={
                <div className="flex items-center space-x-2.5">
                    <Link href="/admin/products">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-1.5" />
                            Back to Products
                        </Button>
                    </Link>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        isLoading={processing}
                        onClick={handleSubmit}
                    >
                        <Check className="w-4 h-4 mr-1.5" />
                        Save Product
                    </Button>
                </div>
            }
        >
            <Head title="Create Product - Admin" />

            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
                {/* General Information */}
                <Card padding="md" className="space-y-4">
                    <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                        <Package className="w-5 h-5 text-primary-600" />
                        <h3 className="text-base font-bold text-gray-900">General Information</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                Product Title <span className="text-rose-600">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Premium Leather Minimalist Wallet"
                                value={data.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                className="w-full text-sm rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                            {errors.title && (
                                <p className="text-xs text-rose-600 mt-1 font-medium">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    URL Slug
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setAutoSlug(!autoSlug)}
                                    className="text-[11px] text-primary-600 hover:text-primary-700"
                                >
                                    {autoSlug ? 'Manual Edit' : 'Auto Generate'}
                                </button>
                            </div>
                            <div className="flex rounded-lg shadow-2xs">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-400 text-xs font-mono">
                                    /
                                </span>
                                <input
                                    type="text"
                                    placeholder="product-slug"
                                    value={data.slug}
                                    readOnly={autoSlug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    className={`w-full text-sm rounded-r-lg border-gray-300 font-mono text-xs focus:border-primary-500 focus:ring-primary-500 ${
                                        autoSlug ? 'bg-gray-50 text-gray-500' : 'bg-white'
                                    }`}
                                />
                            </div>
                            {errors.slug && (
                                <p className="text-xs text-rose-600 mt-1 font-medium">
                                    {errors.slug}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                Status
                            </label>
                            <select
                                value={data.status}
                                onChange={(e) =>
                                    setData(
                                        'status',
                                        e.target.value as 'draft' | 'active' | 'archived'
                                    )
                                }
                                className="w-full text-sm rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="active">Active (Visible on Storefront)</option>
                                <option value="draft">Draft (Unpublished)</option>
                                <option value="archived">Archived</option>
                            </select>
                            {errors.status && (
                                <p className="text-xs text-rose-600 mt-1 font-medium">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                Description
                            </label>
                            <textarea
                                rows={4}
                                placeholder="Write key marketing highlights, materials, specifications, and warranty info..."
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full text-sm rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                            />
                            {errors.description && (
                                <p className="text-xs text-rose-600 mt-1 font-medium">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Pricing Structure */}
                <Card padding="md" className="space-y-4">
                    <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                        <Tag className="w-5 h-5 text-primary-600" />
                        <h3 className="text-base font-bold text-gray-900">Pricing & Discounts</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                Regular Price (BDT ৳) <span className="text-rose-600">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-2xs">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-medium">
                                    ৳
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="1200.00"
                                    value={data.regular_price}
                                    onChange={(e) => setData('regular_price', e.target.value)}
                                    className="w-full pl-8 text-sm rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            {errors.regular_price && (
                                <p className="text-xs text-rose-600 mt-1 font-medium">
                                    {errors.regular_price}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Sale Price (BDT ৳)
                                </label>
                                {discountPercent !== null && (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Save {discountPercent}%
                                    </span>
                                )}
                            </div>
                            <div className="relative rounded-lg shadow-2xs">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-medium">
                                    ৳
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="950.00 (optional promotional price)"
                                    value={data.sale_price}
                                    onChange={(e) => setData('sale_price', e.target.value)}
                                    className="w-full pl-8 text-sm rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            {errors.sale_price && (
                                <p className="text-xs text-rose-600 mt-1 font-medium">
                                    {errors.sale_price}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Variants & Stock Matrix */}
                <Card padding="md" className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center space-x-2">
                            <Layers className="w-5 h-5 text-primary-600" />
                            <div>
                                <h3 className="text-base font-bold text-gray-900">
                                    Product Variants & Inventory
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Choose whether this item is single stock or comes in multiple
                                    options.
                                </p>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.has_variants}
                                onChange={(e) => setData('has_variants', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            <span className="ml-2 text-xs font-semibold text-gray-700">
                                Has Multiple Variants
                            </span>
                        </label>
                    </div>

                    {!data.has_variants ? (
                        /* Standalone Inventory Settings */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Available Stock Quantity
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.stock_quantity}
                                    disabled={!data.manage_stock}
                                    onChange={(e) =>
                                        setData('stock_quantity', parseInt(e.target.value) || 0)
                                    }
                                    className="w-full text-sm rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
                                />
                                {errors.stock_quantity && (
                                    <p className="text-xs text-rose-600 mt-1 font-medium">
                                        {errors.stock_quantity}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center pt-6">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.manage_stock}
                                        onChange={(e) => setData('manage_stock', e.target.checked)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                                    />
                                    <span className="text-xs font-medium text-gray-700">
                                        Track inventory for this product automatically
                                    </span>
                                </label>
                            </div>
                        </div>
                    ) : (
                        /* Multi-Variant Matrix Generator */
                        <div className="pt-2">
                            <VariantGenerator
                                variants={data.variants}
                                onChangeVariants={(newVariants) => setData('variants', newVariants)}
                                basePrice={data.regular_price}
                                baseSalePrice={data.sale_price}
                                productSlug={data.slug}
                            />
                            {errors.variants && (
                                <p className="text-xs text-rose-600 mt-2 font-medium">
                                    {errors.variants}
                                </p>
                            )}
                        </div>
                    )}
                </Card>

                {/* Media & Gallery Images */}
                <Card padding="md" className="space-y-4">
                    <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                        <UploadCloud className="w-5 h-5 text-primary-600" />
                        <div>
                            <h3 className="text-base font-bold text-gray-900">
                                Media & Gallery Images
                            </h3>
                            <p className="text-xs text-gray-500">
                                Upload product photos. High-resolution images will be automatically
                                optimized to responsive WebP.
                            </p>
                        </div>
                    </div>

                    <ImageUploader
                        newFiles={data.images}
                        onFilesSelected={handleFilesSelected}
                        onRemoveNewFile={handleRemoveFile}
                        error={errors.images}
                    />
                </Card>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Link href="/admin/products">
                        <Button variant="outline" size="md">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" variant="primary" size="md" isLoading={processing}>
                        <Check className="w-4 h-4 mr-1.5" />
                        Create & Publish Product
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
