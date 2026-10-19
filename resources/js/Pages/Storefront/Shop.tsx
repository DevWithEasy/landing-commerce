import { Link, router } from '@inertiajs/react';
import {
    ChevronRight,
    Filter,
    FolderTree,
    Search,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import { Pagination } from '@/Shared/Pagination';
import { ProductCard } from '@/Shared/ProductCard';
import { SeoHead } from '@/Shared/SeoHead';
import type { StorefrontShopProps } from '@/types/storefront';

export default function Shop({
    products,
    categories,
    selectedCategory,
    filters,
    theme,
}: StorefrontShopProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [sort, setSort] = useState(filters.sort || 'latest');
    const [inStock, setInStock] = useState(filters.in_stock || false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const applyFilters = (newFilters: Partial<typeof filters>) => {
        const merged = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            category: newFilters.category !== undefined ? newFilters.category : filters.category,
            sort: newFilters.sort !== undefined ? newFilters.sort : sort,
            in_stock: newFilters.in_stock !== undefined ? (newFilters.in_stock ? '1' : undefined) : (inStock ? '1' : undefined),
        };

        const cleanParams: Record<string, string> = {};
        if (merged.search) cleanParams.search = merged.search.trim();
        if (merged.category) cleanParams.category = merged.category;
        if (merged.sort && merged.sort !== 'latest') cleanParams.sort = merged.sort;
        if (merged.in_stock) cleanParams.in_stock = '1';

        router.get('/shop', cleanParams, { preserveState: true });
    };

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleSortChange = (newSort: string) => {
        setSort(newSort);
        applyFilters({ sort: newSort });
    };

    const handleStockChange = (newInStock: boolean) => {
        setInStock(newInStock);
        applyFilters({ in_stock: newInStock });
    };

    const clearAllFilters = () => {
        setSearch('');
        setSort('latest');
        setInStock(false);
        router.get('/shop');
    };

    const pageTitle = selectedCategory
        ? `${selectedCategory.name} - ${theme.store_name}`
        : `শপ ও পণ্য তালিকা - ${theme.store_name}`;

    const canonicalUrl = selectedCategory
        ? `/category/${selectedCategory.slug}`
        : '/shop';

    const pageDescription = selectedCategory?.description
        ? selectedCategory.description
        : `${theme.store_name} এর আকর্ষণীয় পণ্য সম্ভার ও এক্সক্লুসিভ অফারসমূহ ব্রাউজ করুন।`;

    const breadcrumbJsonLd = useMemo(() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const items: Array<Record<string, unknown>> = [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'হোম',
                item: `${origin}/`,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'শপ',
                item: `${origin}/shop`,
            },
        ];

        if (selectedCategory) {
            items.push({
                '@type': 'ListItem',
                position: 3,
                name: selectedCategory.name,
                item: `${origin}/category/${selectedCategory.slug}`,
            });
        }

        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: items,
        };
    }, [selectedCategory]);

    return (
        <StorefrontLayout theme={theme} categories={categories} currentSearch={search}>
            <SeoHead
                title={pageTitle}
                description={pageDescription}
                canonicalUrl={canonicalUrl}
                theme={theme}
                jsonLd={breadcrumbJsonLd}
            />

            {/* Breadcrumb & Header Banner */}
            <div className="bg-white border-b border-gray-200 py-6 px-4">
                <div className="max-w-7xl mx-auto">
                    <nav className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Link href="/" className="hover:text-indigo-600 transition">
                            হোম
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        <Link href="/shop" className="hover:text-indigo-600 transition">
                            শপ
                        </Link>
                        {selectedCategory && (
                            <>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-semibold text-gray-900">
                                    {selectedCategory.name}
                                </span>
                            </>
                        )}
                    </nav>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                {selectedCategory ? selectedCategory.name : 'সকল পণ্য'}
                            </h1>
                            {selectedCategory?.description ? (
                                <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                                    {selectedCategory.description}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500 mt-1">
                                    মোট {products.total} টি পণ্য পাওয়া গেছে
                                </p>
                            )}
                        </div>

                        {/* Top Sort & Filter Bar for Mobile */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsMobileFilterOpen(true)}
                                className="lg:hidden inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition"
                            >
                                <Filter className="w-4 h-4 text-gray-600" />
                                <span>ফিল্টার</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <label htmlFor="shop-sort" className="text-xs font-semibold text-gray-600 hidden sm:inline">
                                    সাজান:
                                </label>
                                <select
                                    id="shop-sort"
                                    value={sort}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="latest">নতুন পণ্য (Newest)</option>
                                    <option value="price_low_high">দাম: কম থেকে বেশি</option>
                                    <option value="price_high_low">দাম: বেশি থেকে কম</option>
                                    <option value="popular">জনপ্রিয় পণ্য (Popular)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Shop Body */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Desktop Sidebar Filters */}
                    <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6">
                        {/* Search in sidebar */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                                পণ্য খুঁজুন
                            </h3>
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <input
                                    type="text"
                                    placeholder="কী খুঁজছেন?..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </form>
                        </div>

                        {/* Category Tree Filter */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    ক্যাটাগরি
                                </h3>
                                {filters.category && (
                                    <Link
                                        href="/shop"
                                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                                    >
                                        সব দেখুন
                                    </Link>
                                )}
                            </div>

                            <div className="space-y-1.5 max-h-80 overflow-y-auto">
                                <Link
                                    href="/shop"
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                        !filters.category
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>সকল ক্যাটাগরি</span>
                                </Link>

                                {categories.map((cat) => {
                                    const isSelected = filters.category === cat.slug;

                                    return (
                                        <div key={cat.id} className="space-y-1">
                                            <Link
                                                href={`/category/${cat.slug}`}
                                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                                                    isSelected
                                                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                <span>{cat.name}</span>
                                                {cat.children && cat.children.length > 0 && (
                                                    <span className="text-[10px] text-gray-400">
                                                        ({cat.children.length})
                                                    </span>
                                                )}
                                            </Link>

                                            {/* Subcategories (Level 2) */}
                                            {cat.children && cat.children.length > 0 && (
                                                <div className="pl-3.5 space-y-1 border-l border-gray-200 ml-2">
                                                    {cat.children.map((sub) => {
                                                        const isSubSelected = filters.category === sub.slug;
                                                        return (
                                                            <Link
                                                                key={sub.id}
                                                                href={`/category/${sub.slug}`}
                                                                className={`block px-2 py-1 rounded text-[11px] transition ${
                                                                    isSubSelected
                                                                        ? 'text-indigo-600 font-bold bg-indigo-50'
                                                                        : 'text-gray-500 hover:text-gray-900'
                                                                }`}
                                                            >
                                                                {sub.name}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Availability Filter */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                                স্টক উপস্থিতি
                            </h3>
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={inStock}
                                    onChange={(e) => handleStockChange(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-semibold text-gray-700">
                                    শুধুমাত্র স্টকে আছে (In Stock)
                                </span>
                            </label>
                        </div>

                        {/* Reset button */}
                        {(filters.search || filters.category || filters.in_stock || filters.sort !== 'latest') && (
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>ফিল্টার মুছুন</span>
                            </button>
                        )}
                    </aside>

                    {/* Product Grid Area */}
                    <div className="flex-1">
                        {products.data.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                                <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-gray-900">
                                    কোন পণ্য পাওয়া যায়নি
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                                    আপনার খোঁজা ফিল্টারের সাথে মিলে এমন কোনো পণ্য মেলেনি। অন্য ক্যাটাগরি বা কিওয়ার্ড দিয়ে চেষ্টা করুন।
                                </p>
                                <div className="mt-5">
                                    <button
                                        type="button"
                                        onClick={clearAllFilters}
                                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                                    >
                                        সকল পণ্য দেখুন
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                    {products.data.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {products.links && products.links.length > 3 && (
                                    <div className="mt-8 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                                        <Pagination
                                            links={products.links}
                                            from={products.from}
                                            to={products.to}
                                            total={products.total}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Slide-over Drawer */}
            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
                        onClick={() => setIsMobileFilterOpen(false)}
                    />
                    <div className="relative ml-auto w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 z-10 overflow-y-auto space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <span className="font-bold text-gray-900 text-base">ফিল্টার</span>
                            <button
                                type="button"
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                সার্চ
                            </label>
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <input
                                    type="text"
                                    placeholder="পণ্য খুঁজুন..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </form>
                        </div>

                        {/* Categories */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                ক্যাটাগরি
                            </label>
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                                <Link
                                    href="/shop"
                                    onClick={() => setIsMobileFilterOpen(false)}
                                    className={`block px-3 py-2 rounded-lg text-xs font-medium ${
                                        !filters.category ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700'
                                    }`}
                                >
                                    সব ক্যাটাগরি
                                </Link>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/category/${cat.slug}`}
                                        onClick={() => setIsMobileFilterOpen(false)}
                                        className={`block px-3 py-2 rounded-lg text-xs font-medium ${
                                            filters.category === cat.slug
                                                ? 'bg-indigo-50 text-indigo-700 font-bold'
                                                : 'text-gray-700'
                                        }`}
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* In Stock Toggle */}
                        <div>
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={inStock}
                                    onChange={(e) => {
                                        handleStockChange(e.target.checked);
                                        setIsMobileFilterOpen(false);
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-semibold text-gray-700">
                                    শুধুমাত্র স্টকে আছে
                                </span>
                            </label>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex gap-3">
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
                            >
                                ক্লিয়ার
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    applyFilters({ search, in_stock: inStock });
                                    setIsMobileFilterOpen(false);
                                }}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs"
                            >
                                প্রয়োগ করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </StorefrontLayout>
    );
}
