import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, FolderTree, Package, Tag, Trash2, UploadCloud } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import { Card } from '@/Shared/Card';
import { ImageUploader } from '@/Shared/ImageUploader';
import { RichTextEditor } from '@/Shared/RichTextEditor';
import { VariantGenerator, type VariantRowItem } from '@/Shared/VariantGenerator';
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
    category_ids: number[];
    variants: VariantRowItem[];
    images: File[];
    variant_images?: Record<number, File>;
    remove_variant_images?: number[];
}

export default function Edit({
    product,
    categories = [],
}: ProductEditProps & {
    categories?: Array<{ id: number; name: string; parent_id: number | null }>;
}) {
    const initialVariants: VariantRowItem[] = (product.variants || []).map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        attributes: v.attributes,
        regular_price: v.regular_price,
        sale_price: v.sale_price,
        stock_quantity: v.stock_quantity,
        manage_stock: Boolean(v.manage_stock),
        image_url: v.images?.[0]?.thumb_url || v.images?.[0]?.url || null,
        image_file: null,
    }));

    const { data, setData, post, processing, errors, transform } = useForm<EditProductFormData>({
        _method: 'put',
        title: product.title || '',
        slug: product.slug || '',
        description: product.description || '',
        regular_price: product.regular_price !== null ? String(product.regular_price) : '',
        sale_price: product.sale_price !== null ? String(product.sale_price) : '',
        has_variants: Boolean(product.has_variants),
        status: product.status || 'draft',
        category_ids: (product.categories || []).map((c) => c.id),
        variants: initialVariants,
        images: [],
        variant_images: {},
        remove_variant_images: [],
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

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const variantImagesMap: Record<number, File> = {};
        const removeVariantIds: number[] = [];

        data.variants.forEach((v, idx) => {
            if (v.image_file) {
                const key = v.id ?? idx;
                variantImagesMap[key] = v.image_file;
            }
            if (v.remove_image && v.id) {
                removeVariantIds.push(v.id);
            }
        });

        transform((currentData) => ({
            ...currentData,
            variant_images: variantImagesMap,
            remove_variant_images: removeVariantIds,
        }));

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
                            <RichTextEditor
                                label="Description"
                                placeholder="Write key marketing highlights, materials, specifications, and warranty info..."
                                value={data.description}
                                onChange={(content) => setData('description', content)}
                                error={errors.description}
                                minHeight="200px"
                            />
                        </div>
                    </div>
                </Card>

                {/* Categories */}
                {categories && categories.length > 0 && (
                    <Card padding="md" className="space-y-4">
                        <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                            <FolderTree className="w-5 h-5 text-primary-600" />
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Categories</h3>
                                <p className="text-xs text-gray-500">
                                    Assign this product to one or more storefront categories.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {categories.map((cat) => {
                                const isChecked = data.category_ids.includes(cat.id);
                                return (
                                    <label
                                        key={cat.id}
                                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-sm transition ${
                                            isChecked
                                                ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 font-semibold'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setData('category_ids', [...data.category_ids, cat.id]);
                                                } else {
                                                    setData(
                                                        'category_ids',
                                                        data.category_ids.filter((id) => id !== cat.id)
                                                    );
                                                }
                                            }}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="truncate">
                                            {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </Card>
                )}

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
