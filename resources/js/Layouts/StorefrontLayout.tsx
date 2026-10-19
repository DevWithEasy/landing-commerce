import { Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Heart,
    HelpCircle,
    Home,
    Layers,
    Menu,
    Phone,
    Search,
    ShieldCheck,
    ShoppingBag,
    Store,
    Truck,
    User as UserIcon,
    X,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { MiniCartDrawer } from '@/Shared/MiniCartDrawer';
import type { Category, SharedProps } from '@/types';
import type { CartSummary } from '@/types/cart';
import type { StorefrontTheme } from '@/types/storefront';

interface StorefrontLayoutProps {
    children: ReactNode;
    theme: StorefrontTheme;
    categories?: Category[];
    currentSearch?: string;
    title?: string;
}

export function StorefrontLayout({
    children,
    theme,
    categories = [],
    currentSearch = '',
}: StorefrontLayoutProps) {
    const page = usePage<SharedProps>();
    const pageCart = (page.props.cart as CartSummary) || {
        id: null,
        total_items: 0,
        subtotal: 0,
        formatted_subtotal: '৳0',
        items: [],
        is_empty: true,
    };

    const [activeCart, setActiveCart] = useState<CartSummary>(pageCart);
    const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(currentSearch);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [expandedMobileCategories, setExpandedMobileCategories] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (page.props.cart) {
            setActiveCart(page.props.cart as CartSummary);
        }
    }, [page.props.cart]);

    const customer = page.props.auth?.customer;
    const accountUrl = customer ? '/customer/dashboard' : '/customer/login';

    // Listen for custom open-mini-cart events across the storefront
    useEffect(() => {
        const handleOpenCart = (e: Event) => {
            const customEvent = e as CustomEvent<CartSummary | undefined>;
            if (customEvent.detail) {
                setActiveCart(customEvent.detail);
            }
            setIsMiniCartOpen(true);
        };
        window.addEventListener('open-mini-cart', handleOpenCart);
        return () => window.removeEventListener('open-mini-cart', handleOpenCart);
    }, []);

    useEffect(() => {
        setSearchQuery(currentSearch);
    }, [currentSearch]);

    // Close dropdowns on route changes / ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
                setIsCategoryDropdownOpen(false);
                setIsMobileSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        const term = searchQuery.trim();
        router.get('/shop', term ? { search: term } : {}, { preserveState: true });
        setIsMobileSearchOpen(false);
    };

    const toggleMobileCategory = (catId: number) => {
        setExpandedMobileCategories((prev) => ({
            ...prev,
            [catId]: !prev[catId],
        }));
    };

    const cleanWhatsapp = useMemo(() => {
        return theme.store_whatsapp ? theme.store_whatsapp.replace(/[^0-9]/g, '') : '';
    }, [theme.store_whatsapp]);

    return (
        <div
            className="min-h-screen flex flex-col bg-gray-50 text-gray-900"
            style={
                {
                    '--primary-color': theme.primary_color || '#4f46e5',
                    fontFamily: theme.font_family || 'Hind Siliguri, Inter, sans-serif',
                } as React.CSSProperties
            }
        >
            {/* Optional Custom CSS injection */}
            {theme.custom_css && (
                <style dangerouslySetInnerHTML={{ __html: theme.custom_css }} />
            )}

            {/* Top Announcement Bar */}
            <div className="bg-gray-900 text-gray-200 text-xs py-2 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            সারা বাংলাদেশে দ্রুত ক্যাশ অন ডেলিভারি
                        </span>
                        <span className="hidden md:inline-block text-gray-500">|</span>
                        <span className="hidden md:flex items-center gap-1.5 text-gray-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            ১০০% আসল পণ্যের নিশ্চয়তা
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/track-order"
                            className="hidden sm:inline-flex items-center gap-1 text-gray-300 hover:text-white transition"
                        >
                            <Truck className="w-3 h-3 text-indigo-400" />
                            <span>অর্ডার ট্র্যাকিং</span>
                        </Link>
                        {theme.store_phone && (
                            <a
                                href={`tel:${theme.store_phone}`}
                                className="flex items-center gap-1 text-gray-300 hover:text-white transition"
                            >
                                <Phone className="w-3 h-3 text-indigo-400" />
                                <span>{theme.store_phone}</span>
                            </a>
                        )}
                        {theme.store_whatsapp && (
                            <a
                                href={`https://wa.me/${cleanWhatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden sm:inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition"
                            >
                                <span>WhatsApp অর্ডার</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Header (Row 1) */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
                    {/* Mobile Menu Button & Brand */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            aria-label="Open navigation menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <Link href="/" className="flex items-center gap-2.5">
                            {theme.logo_url ? (
                                <img
                                    src={theme.logo_url}
                                    alt={theme.store_name}
                                    className="h-10 sm:h-12 w-auto object-contain max-w-[180px]"
                                />
                            ) : (
                                <span className="text-xl sm:text-2xl font-black tracking-tight text-indigo-600">
                                    {theme.store_name}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Central Search Bar (Desktop) */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-4">
                        <form onSubmit={handleSearchSubmit} className="relative w-full">
                            <input
                                type="text"
                                aria-label="পণ্য বা মডেলের নাম দিয়ে খুঁজুন"
                                placeholder="পণ্য বা মডেলের নাম দিয়ে খুঁজুন..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-24 py-2.5 bg-gray-50 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold shadow-sm transition"
                            >
                                খুঁজুন
                            </button>
                        </form>
                    </div>

                    {/* Right Action Icons & Badges */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Mobile Search Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
                            aria-label="Toggle search"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Customer Account Entry */}
                        <Link
                            href={accountUrl}
                            className="p-2 text-gray-700 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition"
                            title={customer ? `আমার অ্যাকাউন্ট (${customer.name})` : 'লগইন / রেজিস্টার'}
                            aria-label="Account"
                        >
                            <UserIcon className="w-5 h-5" />
                        </Link>

                        {/* Wishlist Entry */}
                        <Link
                            href="/customer/wishlist"
                            className="p-2 text-gray-700 hover:text-rose-600 rounded-full hover:bg-gray-100 transition relative"
                            title="উইশলিস্ট | My Wishlist"
                            aria-label="Wishlist"
                        >
                            <Heart className="w-5 h-5" />
                        </Link>

                        {/* Cart Trigger Button (Opens Mini-Cart Drawer) */}
                        <button
                            type="button"
                            onClick={() => setIsMiniCartOpen(true)}
                            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold transition"
                            title="Shopping Cart"
                            aria-label="Open Shopping Cart"
                        >
                            <div className="relative">
                                <ShoppingBag className="w-5 h-5" />
                                {activeCart.total_items > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                                        {activeCart.total_items > 99 ? '99+' : activeCart.total_items}
                                    </span>
                                )}
                            </div>
                            <span className="hidden sm:inline">কার্ট</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar Dropdown */}
                {isMobileSearchOpen && (
                    <div className="md:hidden border-t border-gray-200 p-3 bg-gray-50">
                        <form onSubmit={handleSearchSubmit} className="relative w-full">
                            <input
                                type="text"
                                placeholder="পণ্য খুঁজুন..."
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <button
                                type="submit"
                                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-semibold"
                            >
                                খুঁজুন
                            </button>
                        </form>
                    </div>
                )}

                {/* Desktop 2-Row Navigation Bar (Row 2) */}
                <div className="hidden md:block bg-gray-100 border-t border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                        {/* All Categories Dropdown Menu */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                className="flex items-center gap-2.5 px-5 py-3 bg-indigo-600 text-white font-bold text-sm tracking-wide transition hover:bg-indigo-700"
                            >
                                <Menu className="w-4 h-4" />
                                <span>সকল ক্যাটাগরি</span>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 ${
                                        isCategoryDropdownOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            {/* Mega Dropdown Menu */}
                            {isCategoryDropdownOpen && (
                                <div className="absolute top-full left-0 w-64 bg-white border border-gray-200 shadow-xl rounded-b-xl z-50 py-2 max-h-96 overflow-y-auto">
                                    {categories.length === 0 ? (
                                        <div className="px-4 py-3 text-xs text-gray-400">কোন ক্যাটাগরি নেই</div>
                                    ) : (
                                        categories.map((cat) => (
                                            <div key={cat.id} className="group relative">
                                                <Link
                                                    href={`/category/${cat.slug}`}
                                                    onClick={() => setIsCategoryDropdownOpen(false)}
                                                    className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                                                >
                                                    <span className="font-medium">{cat.name}</span>
                                                    {cat.children && cat.children.length > 0 && (
                                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                                                    )}
                                                </Link>

                                                {/* Subcategory Flyout (Level 2) */}
                                                {cat.children && cat.children.length > 0 && (
                                                    <div className="hidden group-hover:block absolute top-0 left-full w-56 bg-white border border-gray-200 shadow-xl rounded-r-xl py-2 z-50">
                                                        {cat.children.map((sub) => (
                                                            <Link
                                                                key={sub.id}
                                                                href={`/category/${sub.slug}`}
                                                                onClick={() => setIsCategoryDropdownOpen(false)}
                                                                className="block px-4 py-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                                                            >
                                                                {sub.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Primary Store Links */}
                        <nav className="flex items-center space-x-8 text-sm font-semibold text-gray-700">
                            <Link href="/" className="hover:text-indigo-600 transition py-3">
                                হোম
                            </Link>
                            <Link href="/shop" className="hover:text-indigo-600 transition py-3">
                                শপ / সকল পণ্য
                            </Link>
                            {categories.slice(0, 5).map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.slug}`}
                                    className="hover:text-indigo-600 transition py-3"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                            <Link href="/pages/about" className="hover:text-indigo-600 transition py-3">
                                আমাদের সম্পর্কে
                            </Link>
                            <Link href="/pages/contact" className="hover:text-indigo-600 transition py-3">
                                যোগাযোগ
                            </Link>
                        </nav>

                        {/* Hotline Right pill */}
                        {theme.store_phone && (
                            <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                                <span>হটলাইন: {theme.store_phone}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 flex md:hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-label="মোবাইল নেভিগেশন মেনু"
                >
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <span className="font-bold text-gray-900 text-base">মেনু ও ক্যাটাগরি</span>
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg"
                                aria-label="Close menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search inside drawer */}
                        <div className="p-4 border-b border-gray-100">
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <input
                                    type="text"
                                    aria-label="পণ্য খুঁজুন"
                                    placeholder="পণ্য খুঁজুন..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </form>
                        </div>

                        {/* Category Accordion */}
                        <div className="flex-1 p-4 space-y-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">ক্যাটাগরি সমূহ</p>
                            {categories.map((cat) => {
                                const hasChildren = cat.children && cat.children.length > 0;
                                const isExpanded = !!expandedMobileCategories[cat.id];

                                return (
                                    <div key={cat.id} className="border-b border-gray-100 pb-1">
                                        <div className="flex items-center justify-between py-2">
                                            <Link
                                                href={`/category/${cat.slug}`}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="text-sm font-medium text-gray-800 hover:text-indigo-600 transition"
                                            >
                                                {cat.name}
                                            </Link>
                                            {hasChildren && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleMobileCategory(cat.id)}
                                                    className="p-1 text-gray-400 hover:text-gray-700"
                                                    aria-label={`${cat.name} সাব-ক্যাটাগরি টগল করুন`}
                                                >
                                                    <ChevronDown
                                                        className={`w-4 h-4 transition-transform duration-200 ${
                                                            isExpanded ? 'rotate-180' : ''
                                                        }`}
                                                    />
                                                </button>
                                            )}
                                        </div>

                                        {hasChildren && isExpanded && (
                                            <div className="pl-4 pb-2 space-y-1.5 border-l-2 border-indigo-100 ml-2">
                                                {cat.children!.map((sub) => (
                                                    <Link
                                                        key={sub.id}
                                                        href={`/category/${sub.slug}`}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="block text-xs text-gray-600 hover:text-indigo-600 py-1"
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="pt-4 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">গুরুত্বপূর্ণ পেইজ</p>
                                <Link
                                    href="/"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm font-semibold text-gray-700 hover:text-indigo-600 py-1.5"
                                >
                                    হোম পেইজ
                                </Link>
                                <Link
                                    href="/shop"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm font-semibold text-gray-700 hover:text-indigo-600 py-1.5"
                                >
                                    শপ / সব পণ্য
                                </Link>
                                <Link
                                    href="/track-order"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-1.5"
                                >
                                    অর্ডার ট্র্যাকিং
                                </Link>
                                <Link
                                    href="/customer/wishlist"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm font-semibold text-rose-600 hover:text-rose-700 py-1.5"
                                >
                                    আমার উইশলিস্ট
                                </Link>
                                <Link
                                    href={accountUrl}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm font-semibold text-gray-700 hover:text-indigo-600 py-1.5"
                                >
                                    {customer ? 'আমার একাউন্ট' : 'লগইন / রেজিস্টার'}
                                </Link>
                                <Link
                                    href="/pages/about"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm text-gray-600 hover:text-indigo-600 py-1.5"
                                >
                                    আমাদের সম্পর্কে
                                </Link>
                                <Link
                                    href="/pages/privacy-policy"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm text-gray-600 hover:text-indigo-600 py-1.5"
                                >
                                    গোপনীয়তা নীতি
                                </Link>
                                <Link
                                    href="/pages/terms"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm text-gray-600 hover:text-indigo-600 py-1.5"
                                >
                                    শর্তাবলী
                                </Link>
                                <Link
                                    href="/pages/refund-policy"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm text-gray-600 hover:text-indigo-600 py-1.5"
                                >
                                    রিটার্ন ও রিফান্ড নীতি
                                </Link>
                            </div>
                        </div>

                        {/* Customer support in mobile drawer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
                            {theme.store_phone && (
                                <a
                                    href={`tel:${theme.store_phone}`}
                                    className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                                >
                                    <Phone className="w-4 h-4 text-indigo-600" />
                                    <span>হটলাইন: {theme.store_phone}</span>
                                </a>
                            )}
                            {theme.store_whatsapp && (
                                <a
                                    href={`https://wa.me/${cleanWhatsapp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm"
                                >
                                    <span>WhatsApp অর্ডার</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Page Content */}
            <main className="flex-1 pb-16 md:pb-0">{children}</main>

            {/* Sticky Mobile Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 py-2 px-3 shadow-lg">
                <div className="flex items-center justify-around text-center">
                    <Link
                        href="/"
                        className="flex flex-col items-center text-gray-600 hover:text-indigo-600 py-1 text-xs"
                    >
                        <Home className="w-5 h-5 mb-0.5" />
                        <span>হোম</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="flex flex-col items-center text-gray-600 hover:text-indigo-600 py-1 text-xs"
                    >
                        <Layers className="w-5 h-5 mb-0.5" />
                        <span>ক্যাটাগরি</span>
                    </button>

                    <Link
                        href="/shop"
                        className="flex flex-col items-center text-gray-600 hover:text-indigo-600 py-1 text-xs"
                    >
                        <Store className="w-5 h-5 mb-0.5" />
                        <span>শপ</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsMiniCartOpen(true)}
                        className="flex flex-col items-center text-gray-600 hover:text-indigo-600 py-1 text-xs relative"
                        aria-label="Open Shopping Cart"
                    >
                        <ShoppingBag className="w-5 h-5 mb-0.5" />
                        <span>কার্ট</span>
                        {activeCart.total_items > 0 && (
                            <span className="absolute top-0 right-3 w-3.5 h-3.5 bg-indigo-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                                {activeCart.total_items > 99 ? '99+' : activeCart.total_items}
                            </span>
                        )}
                    </button>

                    <Link
                        href={accountUrl}
                        className="flex flex-col items-center text-gray-600 hover:text-indigo-600 py-1 text-xs"
                    >
                        <UserIcon className="w-5 h-5 mb-0.5" />
                        <span>{customer ? 'একাউন্ট' : 'লগইন'}</span>
                    </Link>
                </div>
            </div>

            {/* Storefront Footer */}
            <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 pt-16 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                        {/* Column 1: Store info */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                {theme.logo_url ? (
                                    <img
                                        src={theme.logo_url}
                                        alt={theme.store_name}
                                        className="h-10 w-auto brightness-200"
                                    />
                                ) : (
                                    <span className="text-2xl font-black text-white">{theme.store_name}</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed mb-4">
                                দেশজুড়ে বিশ্বস্ত গ্রাহকসেবা ও ক্যাশ অন ডেলিভারি সুবিধা নিয়ে আপনার সেরা কেনাকাটার নির্ভরযোগ্য ঠিকানা।
                            </p>
                            {theme.store_phone && (
                                <p className="text-sm text-gray-300 font-semibold mb-1">
                                    হটলাইন: <span className="text-indigo-400">{theme.store_phone}</span>
                                </p>
                            )}
                            <p className="text-xs text-gray-500">প্রতিদিন সকাল ৯টা - রাত ১১টা</p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
                                প্রয়োজনীয় লিংক
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <Link href="/" className="hover:text-white transition">হোম পেইজ</Link>
                                </li>
                                <li>
                                    <Link href="/shop" className="hover:text-white transition">সকল পণ্য</Link>
                                </li>
                                <li>
                                    <Link href="/track-order" className="hover:text-white transition">অর্ডার ট্র্যাক করুন</Link>
                                </li>
                                <li>
                                    <Link href={accountUrl} className="hover:text-white transition">{customer ? 'আমার একাউন্ট' : 'লগইন / রেজিস্টার'}</Link>
                                </li>
                                <li>
                                    <Link href="/customer/wishlist" className="hover:text-white transition">আমার উইশলিস্ট</Link>
                                </li>
                                <li>
                                    <Link href="/pages/about" className="hover:text-white transition">আমাদের সম্পর্কে</Link>
                                </li>
                                <li>
                                    <Link href="/pages/contact" className="hover:text-white transition">যোগাযোগ</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Customer Care & Policies */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
                                গ্রাহক সেবা ও পলিসি
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <Link href="/pages/privacy-policy" className="hover:text-white transition">গোপনীয়তা নীতি</Link>
                                </li>
                                <li>
                                    <Link href="/pages/terms" className="hover:text-white transition">ব্যবহারের শর্তাবলী</Link>
                                </li>
                                <li>
                                    <Link href="/pages/refund-policy" className="hover:text-white transition">রিটার্ন ও রিফান্ড নীতি</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 4: Delivery & Trust badges */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
                                ডেলিভারি ও পেমেন্ট
                            </h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-800 rounded-xl border border-gray-700/60 flex items-center gap-3">
                                    <Truck className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold text-white">৬৪ জেলায় হোম ডেলিভারি</p>
                                        <p className="text-[11px] text-gray-400">ঢাকা সিটিতে ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ৪৮-৭২ ঘণ্টা</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-800 rounded-xl border border-gray-700/60 flex items-center gap-3">
                                    <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold text-white">নিরাপদ ক্যাশ অন ডেলিভারি</p>
                                        <p className="text-[11px] text-gray-400">পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Copyright */}
                    <div className="pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
                        <p>&copy; {new Date().getFullYear()} {theme.store_name}. সর্বস্বত্ব সংরক্ষিত।</p>
                    </div>
                </div>
            </footer>

            {/* Slide-over Mini-Cart Drawer */}
            <MiniCartDrawer
                isOpen={isMiniCartOpen}
                onClose={() => setIsMiniCartOpen(false)}
                cart={activeCart}
                onCartChange={setActiveCart}
            />
        </div>
    );
}
