import { Link, router } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Filter,
    FolderTree,
    LayoutGrid,
    List,
    Search,
    ShoppingCart,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import { Pagination } from '@/Shared/Pagination';
import { formatBdt, ProductCard } from '@/Shared/ProductCard';
import { SafeImage } from '@/Shared/SafeImage';
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
    const [minPrice, setMinPrice] = useState(filters.min_price || '');
    const [maxPrice, setMaxPrice] = useState(filters.max_price || '');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Collapsible filter sections
    const [openSections, setOpenSections] = useState({
        categories: true,
        price: true,
        availability: true,
    });

    const toggleSection = (key: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const applyFilters = (
        newFilters: Partial<{
            search: string;
            category: string;
            sort: string;
            in_stock: boolean;
            min_price: string;
            max_price: string;
        }>
    ) => {
        const merged = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            category: newFilters.category !== undefined ? newFilters.category : filters.category,
            sort: newFilters.sort !== undefined ? newFilters.sort : sort,
            in_stock: newFilters.in_stock !== undefined ? newFilters.in_stock : inStock,
            min_price: newFilters.min_price !== undefined ? newFilters.min_price : minPrice,
            max_price: newFilters.max_price !== undefined ? newFilters.max_price : maxPrice,
        };

        const cleanParams: Record<string, string> = {};
        if (merged.search.trim()) cleanParams.search = merged.search.trim();
        if (merged.category) cleanParams.category = merged.category;
        if (merged.sort && merged.sort !== 'latest') cleanParams.sort = merged.sort;
        if (merged.in_stock) cleanParams.in_stock = '1';
        if (merged.min_price.trim()) cleanParams.min_price = merged.min_price.trim();
        if (merged.max_price.trim()) cleanParams.max_price = merged.max_price.trim();

        router.get('/shop', cleanParams, { preserveState: true });
    };

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handlePriceSubmit = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ min_price: minPrice, max_price: maxPrice });
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
        setMinPrice('');
        setMaxPrice('');
        router.get('/shop');
    };

    const hasActiveFilters = Boolean(
        filters.search ||
            filters.category ||
            filters.in_stock ||
            filters.min_price ||
            filters.max_price ||
            (filters.sort && filters.sort !== 'latest')
    );

    const pageTitle = selectedCategory
        ? `${selectedCategory.name} - ${theme.store_name}`
        : `Shop Collection - ${theme.store_name}`;

    const canonicalUrl = selectedCategory
        ? `/category/${selectedCategory.slug}`
        : '/shop';

    const pageDescription = selectedCategory?.description
        ? selectedCategory.description
        : `Explore premium products and curated collections at ${theme.store_name}.`;

    const breadcrumbJsonLd = useMemo(() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const items: Array<Record<string, unknown>> = [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${origin}/`,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Shop',
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

    const renderFilterContent = (closeDrawer?: () => void) => (
        <div className="space-y-5">
            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-stone-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3B2E]/20 focus:border-[#0B3B2E]"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            {/* Categories Section */}
            <div className="border-t border-stone-100 pt-4">
                <button
                    type="button"
                    onClick={() => toggleSection('categories')}
                    className="w-full flex items-center justify-between text-sm font-bold text-gray-900 mb-3"
                >
                    <span>Categories</span>
                    {openSections.categories ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>

                {openSections.categories && (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        <Link
                            href="/shop"
                            onClick={closeDrawer}
                            className="flex items-center gap-2.5 py-1 text-xs group"
                        >
                            <span
                                className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                    !filters.category
                                        ? 'bg-[#F96D16] border-[#F96D16] text-white'
                                        : 'border-stone-300 bg-white group-hover:border-[#F96D16]'
                                }`}
                            >
                                {!filters.category && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span
                                className={`flex-1 ${
                                    !filters.category ? 'font-bold text-gray-900' : 'text-gray-600 group-hover:text-gray-900'
                                }`}
                            >
                                All Products
                            </span>
                        </Link>

                        {categories.map((cat) => {
                            const isSelected = filters.category === cat.slug;
                            return (
                                <div key={cat.id} className="space-y-1">
                                    <Link
                                        href={`/category/${cat.slug}`}
                                        onClick={closeDrawer}
                                        className="flex items-center gap-2.5 py-1 text-xs group"
                                    >
                                        <span
                                            className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                                isSelected
                                                    ? 'bg-[#F96D16] border-[#F96D16] text-white'
                                                    : 'border-stone-300 bg-white group-hover:border-[#F96D16]'
                                            }`}
                                        >
                                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                        </span>
                                        <span
                                            className={`flex-1 truncate ${
                                                isSelected
                                                    ? 'font-bold text-gray-900'
                                                    : 'text-gray-600 group-hover:text-gray-900'
                                            }`}
                                        >
                                            {cat.name}
                                        </span>
                                        {cat.children && cat.children.length > 0 && (
                                            <span className="text-[11px] text-gray-400">({cat.children.length})</span>
                                        )}
                                    </Link>

                                    {cat.children && cat.children.length > 0 && (
                                        <div className="pl-6 space-y-1">
                                            {cat.children.map((sub) => {
                                                const isSubSelected = filters.category === sub.slug;
                                                return (
                                                    <Link
                                                        key={sub.id}
                                                        href={`/category/${sub.slug}`}
                                                        onClick={closeDrawer}
                                                        className="flex items-center gap-2 py-0.5 text-[11px] group"
                                                    >
                                                        <span
                                                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition ${
                                                                isSubSelected
                                                                    ? 'bg-[#F96D16] border-[#F96D16] text-white'
                                                                    : 'border-stone-300 bg-white group-hover:border-[#F96D16]'
                                                            }`}
                                                        >
                                                            {isSubSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                                        </span>
                                                        <span
                                                            className={`truncate ${
                                                                isSubSelected
                                                                    ? 'font-semibold text-gray-900'
                                                                    : 'text-gray-500 group-hover:text-gray-900'
                                                            }`}
                                                        >
                                                            {sub.name}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Price Range Section */}
            <div className="border-t border-stone-100 pt-4">
                <button
                    type="button"
                    onClick={() => toggleSection('price')}
                    className="w-full flex items-center justify-between text-sm font-bold text-gray-900 mb-3"
                >
                    <span>Price Range</span>
                    {openSections.price ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>

                {openSections.price && (
                    <form onSubmit={handlePriceSubmit} className="space-y-3">
                        <input
                            type="range"
                            min={0}
                            max={10000}
                            step={100}
                            value={Number(maxPrice) || 5000}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="w-full accent-[#F96D16] cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                        />
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">৳</span>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-[#F96D16]"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">৳</span>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="5,000"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-[#F96D16]"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            onClick={closeDrawer}
                            className="w-full py-1.5 bg-[#0B3B2E] hover:bg-[#092E24] text-white text-xs font-semibold rounded-lg transition"
                        >
                            Apply Price
                        </button>
                    </form>
                )}
            </div>

            {/* Availability Section */}
            <div className="border-t border-stone-100 pt-4">
                <button
                    type="button"
                    onClick={() => toggleSection('availability')}
                    className="w-full flex items-center justify-between text-sm font-bold text-gray-900 mb-3"
                >
                    <span>Availability</span>
                    {openSections.availability ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>

                {openSections.availability && (
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={inStock}
                            onChange={(e) => {
                                handleStockChange(e.target.checked);
                                if (closeDrawer) closeDrawer();
                            }}
                            className="h-4 w-4 rounded border-stone-300 text-[#F96D16] focus:ring-[#F96D16] accent-[#F96D16]"
                        />
                        <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                            In Stock Only
                        </span>
                    </label>
                )}
            </div>

            {hasActiveFilters && (
                <div className="border-t border-stone-100 pt-4">
                    <button
                        type="button"
                        onClick={() => {
                            clearAllFilters();
                            if (closeDrawer) closeDrawer();
                        }}
                        className="w-full py-2 px-3 bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-200 text-gray-700 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                        <X className="w-3.5 h-3.5" />
                        <span>Reset All Filters</span>
                    </button>
                </div>
            )}
        </div>
    );

    const activeParentCategory = useMemo(() => {
        if (!selectedCategory) return null;
        const asParent = categories.find((c) => c.id === selectedCategory.id);
        if (asParent) return asParent;
        const parentOfChild = categories.find((c) =>
            c.children?.some((sub) => sub.id === selectedCategory.id)
        );
        return parentOfChild || null;
    }, [categories, selectedCategory]);

    return (
        <StorefrontLayout theme={theme} categories={categories} currentSearch={search}>
            <SeoHead
                title={pageTitle}
                description={pageDescription}
                canonicalUrl={canonicalUrl}
                theme={theme}
                jsonLd={breadcrumbJsonLd}
            />

            {/* Top Collection Banner matching Velure Shop & Category Reference */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="relative rounded-2xl overflow-hidden bg-[#0B3B2E] min-h-[155px] sm:min-h-[185px] flex items-center">
                    {/* Right warm cream decorative split */}
                    <div
                        className="hidden md:block absolute right-0 top-0 bottom-0 w-[44%] bg-[#F5EFE6]"
                        style={{ clipPath: 'ellipse(95% 120% at 95% 50%)' }}
                    />
                    <div className="relative z-10 w-full px-6 sm:px-10 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="max-w-xl">
                            {/* Breadcrumb inside Hero Banner */}
                            <nav className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-100/80 mb-2">
                                <Link href="/" className="hover:text-white transition">
                                    Home
                                </Link>
                                <ChevronRight className="w-3 h-3 text-emerald-200/60" />
                                <Link
                                    href="/shop"
                                    className={!selectedCategory ? 'text-white font-semibold' : 'hover:text-white transition'}
                                >
                                    Shop
                                </Link>
                                {activeParentCategory &&
                                    selectedCategory &&
                                    activeParentCategory.id !== selectedCategory.id && (
                                        <>
                                            <ChevronRight className="w-3 h-3 text-emerald-200/60" />
                                            <Link
                                                href={`/category/${activeParentCategory.slug}`}
                                                className="hover:text-white transition"
                                            >
                                                {activeParentCategory.name}
                                            </Link>
                                        </>
                                    )}
                                {selectedCategory && (
                                    <>
                                        <ChevronRight className="w-3 h-3 text-emerald-200/60" />
                                        <span className="font-semibold text-white">{selectedCategory.name}</span>
                                    </>
                                )}
                            </nav>

                            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                {selectedCategory ? selectedCategory.name : 'Shop Collection'}
                            </h1>
                            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 max-w-lg">
                                {selectedCategory?.description ||
                                    'Explore premium products crafted for everyday style, quality, and comfort.'}
                            </p>
                        </div>

                        {selectedCategory?.image_url && (
                            <div className="hidden md:flex items-center justify-center w-36 h-28 rounded-xl overflow-hidden bg-white shadow-sm border border-stone-200/70 shrink-0 mr-4">
                                <SafeImage
                                    src={selectedCategory.image_url}
                                    alt={selectedCategory.name}
                                    className="w-full h-full object-cover"
                                    fallbackText={selectedCategory.name}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Horizontal Sub-Category / Quick Category Pills Strip */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {activeParentCategory && activeParentCategory.children && activeParentCategory.children.length > 0 ? (
                        <>
                            <Link
                                href={`/category/${activeParentCategory.slug}`}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                                    selectedCategory?.id === activeParentCategory.id
                                        ? 'bg-[#F96D16] text-white border-[#F96D16] shadow-xs'
                                        : 'bg-white text-gray-700 border-stone-200 hover:border-[#F96D16]'
                                }`}
                            >
                                All {activeParentCategory.name}
                            </Link>
                            {activeParentCategory.children.map((sub) => (
                                <Link
                                    key={sub.id}
                                    href={`/category/${sub.slug}`}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                                        selectedCategory?.id === sub.id
                                            ? 'bg-[#F96D16] text-white border-[#F96D16] shadow-xs'
                                            : 'bg-white text-gray-700 border-stone-200 hover:border-[#F96D16]'
                                    }`}
                                >
                                    {sub.name}
                                </Link>
                            ))}
                        </>
                    ) : (
                        <>
                            <Link
                                href="/shop"
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                                    !selectedCategory
                                        ? 'bg-[#F96D16] text-white border-[#F96D16] shadow-xs'
                                        : 'bg-white text-gray-700 border-stone-200 hover:border-[#F96D16]'
                                }`}
                            >
                                All Products
                            </Link>
                            {categories.slice(0, 8).map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.slug}`}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                                        selectedCategory?.id === cat.id
                                            ? 'bg-[#F96D16] text-white border-[#F96D16] shadow-xs'
                                            : 'bg-white text-gray-700 border-stone-200 hover:border-[#F96D16]'
                                    }`}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Main 2-Column Shop Body */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-14">
                <div className="flex flex-col lg:flex-row gap-7 items-start">
                    {/* Left Filter Sidebar (Desktop) */}
                    <aside className="hidden lg:block w-64 xl:w-68 shrink-0 bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
                        {renderFilterContent()}
                    </aside>

                    {/* Right Product Listing Area */}
                    <div className="flex-1 w-full">
                        {/* Top Header Bar: Category Title + Count + Sort + Grid/List */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                            <div className="flex items-baseline gap-2.5">
                                <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
                                    {selectedCategory ? selectedCategory.name : 'All Products'}
                                </h2>
                                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                                    ({products.total} Products)
                                </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsMobileFilterOpen(true)}
                                    className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-gray-800 rounded-xl text-xs font-semibold transition"
                                >
                                    <Filter className="w-3.5 h-3.5 text-gray-600" />
                                    <span>Filters</span>
                                </button>

                                <div className="flex items-center gap-2">
                                    <label htmlFor="shop-sort" className="text-xs text-gray-500 hidden sm:inline">
                                        Sort by:
                                    </label>
                                    <select
                                        id="shop-sort"
                                        value={sort}
                                        onChange={(e) => handleSortChange(e.target.value)}
                                        className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96D16]/20 focus:border-[#F96D16]"
                                    >
                                        <option value="popular">Popular</option>
                                        <option value="latest">Newest</option>
                                        <option value="price_low_high">Price: Low to High</option>
                                        <option value="price_high_low">Price: High to Low</option>
                                    </select>
                                </div>

                                <div className="hidden sm:flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        aria-label="Grid view"
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                                            viewMode === 'grid'
                                                ? 'bg-[#F96D16] text-white shadow-xs'
                                                : 'bg-white border border-stone-200 text-gray-600 hover:bg-stone-50'
                                        }`}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        aria-label="List view"
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                                            viewMode === 'list'
                                                ? 'bg-[#F96D16] text-white shadow-xs'
                                                : 'bg-white border border-stone-200 text-gray-600 hover:bg-stone-50'
                                        }`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Product Results */}
                        {products.data.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center">
                                <FolderTree className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-gray-900">No products found</h3>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                                    No products matched your selected filters. Try clearing filters or browsing another category.
                                </p>
                                <div className="mt-5">
                                    <button
                                        type="button"
                                        onClick={clearAllFilters}
                                        className="px-5 py-2.5 bg-[#F96D16] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold transition"
                                    >
                                        View All Products
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {products.data.map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {products.data.map((product) => {
                                            const activePrice = product.sale_price ?? product.regular_price;
                                            const hasDiscount =
                                                product.sale_price !== null &&
                                                Number(product.sale_price) < Number(product.regular_price);

                                            return (
                                                <div
                                                    key={product.id}
                                                    className="bg-white rounded-2xl border border-stone-200/80 p-3.5 flex items-center gap-4 hover:shadow-md transition"
                                                >
                                                    <Link
                                                        href={`/product/${product.slug}`}
                                                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#F6F3EE] overflow-hidden shrink-0"
                                                    >
                                                        <SafeImage
                                                            src={product.primaryImage?.url || product.primary_image?.url}
                                                            alt={product.title}
                                                            className="w-full h-full object-contain p-2"
                                                            fallbackText={product.title}
                                                        />
                                                    </Link>
                                                    <div className="flex-1 min-w-0">
                                                        <Link href={`/product/${product.slug}`}>
                                                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 hover:text-[#0B3B2E] truncate">
                                                                {product.title}
                                                            </h3>
                                                        </Link>
                                                        {product.categories && product.categories.length > 0 && (
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {product.categories[0].name}
                                                            </p>
                                                        )}
                                                        <div className="flex items-baseline gap-2 mt-2">
                                                            <span className="text-base font-bold text-[#EA580C]">
                                                                {formatBdt(activePrice)}
                                                            </span>
                                                            {hasDiscount && (
                                                                <span className="text-xs text-gray-400 line-through">
                                                                    {formatBdt(product.regular_price)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Link
                                                        href={`/product/${product.slug}`}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F96D16] hover:bg-[#EA580C] text-white text-xs font-bold transition shrink-0"
                                                    >
                                                        <ShoppingCart className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">View</span>
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Bottom Pagination */}
                                {products.links && products.links.length > 3 && (
                                    <div className="mt-8 pt-4 border-t border-stone-200/80">
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
                    <div className="relative ml-auto w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 z-10 overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
                            <span className="font-bold text-gray-900 text-base">Filters</span>
                            <button
                                type="button"
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {renderFilterContent(() => setIsMobileFilterOpen(false))}
                    </div>
                </div>
            )}
        </StorefrontLayout>
    );
}
