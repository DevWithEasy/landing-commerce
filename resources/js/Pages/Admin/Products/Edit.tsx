import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Layers, Package, Plus, Tag, Trash2, UploadCloud } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import { Card } from '@/Shared/Card';
import { ImageUploader } from '@/Shared/ImageUploader';
import type { VariantRowItem } from '@/Shared/VariantGenerator';
import type { ProductEditProps, ProductImage } from '@/types';

interface EditProductFormData {
    _method: string;
    title: string;
    slug: string;
    description: string;
    regular_price: string;
    sale_price: string;
    has_variants: boolean;
    status: 'draft' | 'active' | 'archived';
    variants: VariantRowItem[];
    images: File[];
}

export default function Edit({ product }: ProductEditProps) {
    const initialVariants: VariantRowItem[] = (product.variants || []).map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        attributes: v.attributes,
        regular_price: v.regular_price,
        sale_price: v.sale_price,
        stock_quantity: v.stock_quantity,
        manage_stock: Boolean(v.manage_stock),
    }));

    const { data, setData, post, processing, errors } = useForm<EditProductFormData>({
        _method: 'put',
        title: product.title || '',
        slug: product.slug || '',
        description: product.description || '',
        regular_price: product.regular_price !== null ? String(product.regular_price) : '',
        sale_price: product.sale_price !== null ? String(product.sale_price) : '',
        has_variants: Boolean(product.has_variants),
        status: product.status || 'draft',
        variants: initialVariants,
        images: [],
    });

    const [isDeletingProduct, setIsDeletingProduct] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleFilesSelected = (incomingFiles: File[]) => {
        setData('images', [...data.images, ...incomingFiles]);
    };

    const handleRemoveNewFile = (index: number) => {
        setData(
            'images',
            data.images.filter((_, i) => i !== index)
        );
    };

    const handleSetPrimaryImage = (img: ProductImage) => {
        router.post(
            `/admin/products/${product.id}/images/${img.id}/primary`,
            {},
            { preserveScroll: true }
        );
    };

    const handleDeleteExistingImage = (img: ProductImage) => {
        if (confirm('Are you sure you want to delete this image?')) {
            router.delete(`/admin/products/${product.id}/images/${img.id}`, {
                preserveScroll: true,
            });
        }
    };

    const handleAddVariant = () => {
        const nextIdx = data.variants.length + 1;
        const prefix = product.slug.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const newVar: VariantRowItem = {
            name: `Variant ${nextIdx}`,
            sku: `${prefix}-VAR-${nextIdx}`,
            attributes: null,
            regular_price: data.regular_price || '0.00',
            sale_price: data.sale_price || null,
            stock_quantity: 0,
            manage_stock: true,
        };
        setData('variants', [...data.variants, newVar]);
    };

    const handleUpdateVariant = (
        index: number,
        field: keyof VariantRowItem,
        value: string | number | boolean | null
    ) => {
        const updated = data.variants.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setData('variants', updated);
    };

    const handleRemoveVariant = (index: number) => {
        setData(
            'variants',
            data.variants.filter((_, i) => i !== index)
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(`/admin/products/${product.id}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const handleDeleteProduct = () => {
        setIsDeletingProduct(true);
        router.delete(`/admin/products/${product.id}`, {
            onFinish: () => {
                setIsDeletingProduct(false);
                setShowDeleteModal(false);
            },
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
            title={`Edit: ${product.title}`}
            subtitle="Modify product specifications, variant pricing, inventory stock, and media gallery."
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
                        Save Changes
                    </Button>
                </div>
            }
        >
            <Head title={`Edit ${product.title} - Admin`} />

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
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
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
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                URL Slug
                            </label>
                            <div className="flex rounded-lg shadow-2xs">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-400 text-xs font-mono">
                                    /
                                </span>
                                <input
                                    type="text"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    className="w-full text-sm rounded-r-lg border-gray-300 font-mono text-xs focus:border-primary-500 focus:ring-primary-500"
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
                                <option value="active">Active (Visible)</option>
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
                                Regular Base Price (BDT ৳) <span className="text-rose-600">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-2xs">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-medium">
                                    ৳
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
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
                                    Sale Promotional Price (BDT ৳)
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
                                    placeholder="Optional"
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

                {/* Variants & Inventory */}
                <Card padding="md" className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center space-x-2">
                            <Layers className="w-5 h-5 text-primary-600" />
                            <div>
                                <h3 className="text-base font-bold text-gray-900">
                                    Product Variants & Inventory
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Manage individual SKUs, stock levels, and distinct pricing.
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddVariant}
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Variant
                        </Button>
                    </div>

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
                                {data.variants.map((v, idx) => (
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
                                            {data.variants.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveVariant(idx)}
                                                    className="text-gray-400 hover:text-rose-600 p-1"
                                                    title="Remove variant"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                                Manage existing product photos or attach new ones. Star icon marks
                                the primary thumbnail.
                            </p>
                        </div>
                    </div>

                    <ImageUploader
                        existingImages={product.images}
                        newFiles={data.images}
                        onFilesSelected={handleFilesSelected}
                        onRemoveNewFile={handleRemoveNewFile}
                        onSetPrimaryExistingImage={handleSetPrimaryImage}
                        onDeleteExistingImage={handleDeleteExistingImage}
                        error={errors.images}
                    />
                </Card>

                {/* Danger Zone: Delete Product */}
                <Card padding="md" className="border-rose-200 bg-rose-50/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h4 className="text-sm font-bold text-rose-900">Danger Zone</h4>
                            <p className="text-xs text-rose-600">
                                Permanently delete this product along with all variants and images.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete Product
                        </Button>
                    </div>
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
                        Update Product
                    </Button>
                </div>
            </form>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
                    <Card padding="md" className="max-w-md w-full shadow-xl">
                        <div className="flex items-start space-x-3.5">
                            <div className="p-2.5 rounded-full bg-rose-50 text-rose-600">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-gray-900">
                                    Delete &ldquo;{product.title}&rdquo;?
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Are you sure you want to delete this product? All attached
                                    variants, SKUs, and media images will be permanently removed.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2.5 mt-6 pt-4 border-t border-gray-100">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeletingProduct}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                isLoading={isDeletingProduct}
                                onClick={handleDeleteProduct}
                            >
                                Delete Product
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </AdminLayout>
    );
}
