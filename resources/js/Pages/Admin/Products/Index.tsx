import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Edit3,
    Filter,
    Package,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    XCircle,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Badge } from '@/Shared/Badge';
import { Button } from '@/Shared/Button';
import { Card } from '@/Shared/Card';
import { Pagination } from '@/Shared/Pagination';
import { SafeImage } from '@/Shared/SafeImage';
import type { Product, ProductIndexProps } from '@/types';

export default function Index({ products, filters, stats }: ProductIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [stockLevel, setStockLevel] = useState(filters.stock_level || '');
    const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleFilterSubmit = (e?: FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/admin/products',
            {
                search: search || undefined,
                status: status || undefined,
                stock_level: stockLevel || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setStatus('');
        setStockLevel('');
        router.get('/admin/products', {}, { preserveState: true, preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!deleteModalProduct) return;
        setIsDeleting(true);
        router.delete(`/admin/products/${deleteModalProduct.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalProduct(null);
            },
        });
    };

    const calculateTotalStock = (product: Product): number => {
        if (!product.variants || product.variants.length === 0) {
            return 0;
        }
        return product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
    };

    const formatMoney = (amount: string | number | null | undefined): string => {
        if (amount === null || amount === undefined || amount === '') return '৳0.00';
        const num = typeof amount === 'number' ? amount : parseFloat(amount);
        return isNaN(num) ? '৳0.00' : `৳${num.toFixed(2)}`;
    };

    return (
        <AdminLayout
            title="Products & Inventory"
            subtitle="Manage your catalog items, multi-variant options, stock quantities, and product pricing."
            actions={
                <Link href="/admin/products/create">
                    <Button variant="primary" size="md">
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add New Product
                    </Button>
                </Link>
            }
        >
            <Head title="Products & Inventory - Admin" />

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card padding="sm" className="flex items-center space-x-3.5">
                    <div className="p-3 bg-blue-50 text-primary-600 rounded-xl">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Products
                        </p>
                        <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                </Card>

                <Card padding="sm" className="flex items-center space-x-3.5">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Active Catalog
                        </p>
                        <p className="text-xl font-bold text-gray-900">{stats.active}</p>
                    </div>
                </Card>

                <Card padding="sm" className="flex items-center space-x-3.5">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Low Stock (≤5)
                        </p>
                        <p className="text-xl font-bold text-gray-900">{stats.low_stock}</p>
                    </div>
                </Card>

                <Card padding="sm" className="flex items-center space-x-3.5">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                        <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Out of Stock
                        </p>
                        <p className="text-xl font-bold text-gray-900">{stats.out_of_stock}</p>
                    </div>
                </Card>
            </div>

            {/* Filters Bar */}
            <Card padding="sm" className="mb-6">
                <form
                    onSubmit={handleFilterSubmit}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by title, slug, or variant SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                        />
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                router.get(
                                    '/admin/products',
                                    {
                                        search: search || undefined,
                                        status: e.target.value || undefined,
                                        stock_level: stockLevel || undefined,
                                    },
                                    { preserveState: true }
                                );
                            }}
                            className="text-sm rounded-lg border-gray-300 py-2 focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>

                        <select
                            value={stockLevel}
                            onChange={(e) => {
                                setStockLevel(e.target.value);
                                router.get(
                                    '/admin/products',
                                    {
                                        search: search || undefined,
                                        status: status || undefined,
                                        stock_level: e.target.value || undefined,
                                    },
                                    { preserveState: true }
                                );
                            }}
                            className="text-sm rounded-lg border-gray-300 py-2 focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="">All Stock Levels</option>
                            <option value="in_stock">In Stock</option>
                            <option value="low_stock">Low Stock (≤5)</option>
                            <option value="out_of_stock">Out of Stock</option>
                        </select>

                        <Button type="submit" variant="secondary" size="md">
                            <Filter className="w-4 h-4 mr-1.5" />
                            Filter
                        </Button>

                        {(search || status || stockLevel) && (
                            <Button
                                type="button"
                                variant="outline"
                                size="md"
                                onClick={handleResetFilters}
                                title="Reset filters"
                            >
                                <RotateCcw className="w-4 h-4 text-gray-500" />
                            </Button>
                        )}
                    </div>
                </form>
            </Card>

            {/* Products Data Table */}
            <Card padding="none" className="overflow-hidden">
                {products.data.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                            <Package className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">No products found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
                            {search || status || stockLevel
                                ? 'No products matched your active filters. Try clearing your search parameters.'
                                : 'Get started by creating your first product with variants and pricing.'}
                        </p>
                        {search || status || stockLevel ? (
                            <Button variant="outline" size="sm" onClick={handleResetFilters}>
                                Clear Filters
                            </Button>
                        ) : (
                            <Link href="/admin/products/create">
                                <Button variant="primary" size="sm">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Create Product
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm divide-y divide-gray-200">
                            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">
                                <tr>
                                    <th className="py-3 px-4">Product</th>
                                    <th className="py-3 px-4">Pricing</th>
                                    <th className="py-3 px-4">Variants</th>
                                    <th className="py-3 px-4">Inventory</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {products.data.map((product) => {
                                    const primaryImage =
                                        product.images?.find((img) => img.is_primary) ||
                                        product.images?.[0];
                                    const totalStock = calculateTotalStock(product);

                                    return (
                                        <tr
                                            key={product.id}
                                            className="hover:bg-gray-50/75 transition-colors"
                                        >
                                            {/* Product title & thumbnail */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-11 h-11 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                        <SafeImage
                                                            src={primaryImage ? (primaryImage.thumb_url || primaryImage.url) : null}
                                                            alt={product.title}
                                                            className="w-full h-full object-cover"
                                                            fallbackIconSize="w-5 h-5"
                                                            fallbackText=""
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/admin/products/${product.id}/edit`}
                                                            className="font-medium text-gray-900 hover:text-primary-600 truncate block text-sm"
                                                        >
                                                            {product.title}
                                                        </Link>
                                                        <span className="text-xs text-gray-400 font-mono">
                                                            /{product.slug}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Pricing */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">
                                                        {formatMoney(
                                                            product.sale_price ??
                                                                product.regular_price
                                                        )}
                                                    </span>
                                                    {product.sale_price && (
                                                        <span className="text-xs text-gray-400 line-through">
                                                            {formatMoney(product.regular_price)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Variants */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {product.has_variants ? (
                                                    <Badge variant="info">
                                                        {product.variants?.length || 0} Variants
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-gray-500">
                                                        Single / Standard
                                                    </span>
                                                )}
                                            </td>

                                            {/* Inventory */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {totalStock <= 0 ? (
                                                    <Badge variant="danger">Out of Stock</Badge>
                                                ) : totalStock <= 5 ? (
                                                    <Badge variant="warning">
                                                        Low Stock ({totalStock})
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="success">
                                                        In Stock ({totalStock})
                                                    </Badge>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {product.status === 'active' && (
                                                    <Badge variant="success">Active</Badge>
                                                )}
                                                {product.status === 'draft' && (
                                                    <Badge variant="neutral">Draft</Badge>
                                                )}
                                                {product.status === 'archived' && (
                                                    <Badge variant="warning">Archived</Badge>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                <div className="inline-flex items-center space-x-1.5">
                                                    <Link
                                                        href={`/admin/products/${product.id}/edit`}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="px-2.5 py-1 text-xs"
                                                            title="Edit product"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="px-2 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                                        onClick={() =>
                                                            setDeleteModalProduct(product)
                                                        }
                                                        title="Delete product"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {products.data.length > 0 && (
                    <div className="px-4">
                        <Pagination
                            links={products.links}
                            from={products.from}
                            to={products.to}
                            total={products.total}
                        />
                    </div>
                )}
            </Card>

            {/* Delete Confirmation Modal */}
            {deleteModalProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
                    <Card padding="md" className="max-w-md w-full shadow-xl">
                        <div className="flex items-start space-x-3.5">
                            <div className="p-2.5 rounded-full bg-rose-50 text-rose-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-gray-900">
                                    Delete &ldquo;{deleteModalProduct.title}&rdquo;?
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
                                onClick={() => setDeleteModalProduct(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                isLoading={isDeleting}
                                onClick={confirmDelete}
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
