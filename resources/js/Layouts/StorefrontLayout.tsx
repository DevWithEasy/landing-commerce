import { Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    Heart,
    Home,
    Layers,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Phone,
    Search,
    Settings,
    ShieldCheck,
    ShoppingBag,
    Store,
    Truck,
    User as UserIcon,
    X,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MiniCartDrawer } from '@/Shared/MiniCartDrawer';
import { SafeImage } from '@/Shared/SafeImage';
import type { Category, SharedProps } from '@/types';
import type { CartSummary } from '@/types/cart';
import type { StorefrontTheme } from '@/types/storefront';

interface StorefrontLayoutProps {
    children: ReactNode;
    theme?: StorefrontTheme;
    categories?: Category[];
    currentSearch?: string;
    title?: string;
}

export function StorefrontLayout({
    children,
    theme: themeProp,
    categories = [],
    currentSearch = '',
}: StorefrontLayoutProps) {
    const page = usePage<SharedProps>();
    const sharedTheme = page.props.storefrontTheme;
    const theme: StorefrontTheme = {
        store_name: themeProp?.store_name || sharedTheme?.store_name || 'Velure',
        store_phone: themeProp?.store_phone ?? sharedTheme?.store_phone ?? '',
        store_whatsapp: themeProp?.store_whatsapp ?? sharedTheme?.store_whatsapp ?? '',
        logo_url: themeProp?.logo_url || sharedTheme?.logo_url || '',
        favicon_url: themeProp?.favicon_url || sharedTheme?.favicon_url || '',
        primary_color: themeProp?.primary_color || sharedTheme?.primary_color || '#0B3B2E',
        secondary_color: themeProp?.secondary_color || sharedTheme?.secondary_color,
        accent_color: themeProp?.accent_color || sharedTheme?.accent_color,
        font_family: themeProp?.font_family || sharedTheme?.font_family,
        custom_css: themeProp?.custom_css ?? sharedTheme?.custom_css,
    };
    const sharedCategories = page.props.navCategories ?? [];
    const resolvedCategories =
        sharedCategories.length > 0 ? sharedCategories : categories;
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
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const [expandedMobileCategories, setExpandedMobileCategories] = useState<Record<number, boolean>>({});

    const accountMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (page.props.cart) {
            setActiveCart(page.props.cart as CartSummary);
        }
    }, [page.props.cart]);

    const adminUser = page.props.auth?.user;
    const customer = page.props.auth?.customer;

    let accountUrl = '/customer/login';

    if (adminUser) {
        accountUrl = '/admin';
    } else if (customer) {
        accountUrl = '/customer/dashboard';
    }

    const adminRoleLabel =
        adminUser?.role === 'super_admin'
            ? 'সুপার অ্যাডমিন'
            : adminUser?.role === 'store_manager'
            ? 'স্টোর ম্যানেজার'
            : adminUser?.role === 'fulfillment_agent'
            ? 'ফুলফিলমেন্ট এজেন্ট'
            : 'অ্যাডমিন মোড';

    // Close account dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
                setIsAccountDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                setIsMobileSearchOpen(false);
                setIsAccountDropdownOpen(false);
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
            className="min-h-screen flex flex-col bg-page text-gray-900"
            style={
                {
                    '--primary-color': theme.primary_color || '#0B3B2E',
                } as React.CSSProperties
            }
        >
            {/* Optional Custom CSS injection */}
            {theme.custom_css && (
                <style dangerouslySetInnerHTML={{ __html: theme.custom_css }} />
            )}

            {/* Top Announcement Bar (#0B3B2E Deep Forest Green) */}
            <div className="bg-brand text-white/90 text-[11px] sm:text-xs py-2 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Truck className="w-3.5 h-3.5 text-emerald-300" />
                            Free Delivery Over ৳2,000
                        </span>
                        <span className="hidden sm:flex items-center gap-1.5 text-white/80">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                            100% Authentic Products
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {adminUser && (
                            <Link
                                href="/admin"
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-400 text-gray-950 font-bold rounded-full text-[11px] hover:bg-amber-300 transition shadow-xs"
                                title="অ্যাডমিন প্যানেল খুলুন"
                            >
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-900" />
                                <span>Admin</span>
                            </Link>
                        )}
                        <Link
                            href="/track-order"
                            className="hidden sm:inline-flex items-center gap-1 text-white/80 hover:text-white transition"
                        >
                            <span>Track Order</span>
                        </Link>
                        {theme.store_phone && (
                            <a
                                href={`tel:${theme.store_phone}`}
                                className="flex items-center gap-1 text-white/90 hover:text-white font-medium transition"
                            >
                                <Phone className="w-3 h-3 text-emerald-300" />
                                <span>{theme.store_phone}</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Header (Single Clean Row matching mockup) */}
            <header className="bg-header border-b border-line/80 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
                    {/* Mobile Menu Button & Brand */}
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-brand"
                            aria-label="Open navigation menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <Link href="/" className="flex items-center gap-2.5">
                            <SafeImage
                                src={theme.logo_url}
                                alt={theme.store_name}
                                className="h-9 sm:h-10 w-auto object-contain max-w-[160px]"
                                fallbackText=""
                                fallbackIcon={
                                    <span className="text-2xl font-serif font-bold tracking-tight text-heading">
                                        {theme.store_name}
                                    </span>
                                }
                            />
                        </Link>
                    </div>

                    {/* Center Navigation Links (Desktop) */}
                    <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-gray-700">
                        <Link
                            href="/"
                            className={`py-2 transition whitespace-nowrap ${
                                page.url === '/'
                                    ? 'text-gray-900 font-semibold border-b-2 border-highlight'
                                    : 'hover:text-heading'
                            }`}
                        >
                            Home
                        </Link>
                        {resolvedCategories.slice(0, 4).map((cat) => {
                            const hasChildren = Boolean(cat.children && cat.children.length > 0);
                            return (
                                <div key={cat.id} className="relative group">
                                    <Link
                                        href={`/category/${cat.slug}`}
                                        className={`inline-flex items-center gap-1 py-2 transition whitespace-nowrap ${
                                            page.url.startsWith(`/category/${cat.slug}`)
                                                ? 'text-gray-900 font-semibold border-b-2 border-highlight'
                                                : 'hover:text-heading'
                                        }`}
                                    >
                                        <span>{cat.name}</span>
                                        {hasChildren && (
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-heading transition-transform duration-200 group-hover:rotate-180" />
                                        )}
                                    </Link>

                                    {hasChildren && (
                                        <div className="absolute left-0 top-full pt-1.5 w-52 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-150 z-50">
                                            <div className="bg-surface rounded-xl shadow-xl border border-line/90 py-1.5 overflow-hidden">
                                                {cat.children!.map((sub) => (
                                                    <Link
                                                        key={sub.id}
                                                        href={`/category/${sub.slug}`}
                                                        className="flex items-center justify-between px-4 py-2 text-[13px] text-gray-700 hover:bg-page hover:text-heading font-medium transition"
                                                    >
                                                        <span>{sub.name}</span>
                                                    </Link>
                                                ))}
                                                <div className="border-t border-stone-100 mt-1 pt-1">
                                                    <Link
                                                        href={`/category/${cat.slug}`}
                                                        className="block px-4 py-1.5 text-xs font-semibold text-highlight hover:bg-page transition"
                                                    >
                                                        View All {cat.name} →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <Link
                            href="/shop?sort=latest"
                            className={`py-2 transition whitespace-nowrap ${
                                page.url.includes('sort=latest')
                                    ? 'text-gray-900 font-semibold border-b-2 border-highlight'
                                    : 'hover:text-heading'
                            }`}
                        >
                            New Arrivals
                        </Link>
                        <Link
                            href="/shop"
                            className="px-3.5 py-1.5 rounded-lg bg-cta hover:bg-cta-hover text-cta-text text-xs font-bold transition shadow-xs"
                        >
                            Sale
                        </Link>
                    </nav>

                    {/* Right Search Bar & Action Icons */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <form onSubmit={handleSearchSubmit} className="hidden md:block relative w-52 xl:w-64">
                            <input
                                type="text"
                                aria-label="Search for products"
                                placeholder="Search for products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 bg-page border border-line rounded-full text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface transition"
                            />
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </form>
                        {/* Mobile Search Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
                            aria-label="Toggle search"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Account Navigation & Dropdown */}
                        <div className="relative" ref={accountMenuRef}>
                            {adminUser ? (
                                <div className="flex items-center bg-amber-50 hover:bg-amber-100/90 border border-amber-300/80 rounded-full pl-1.5 pr-1.5 py-1 transition shadow-xs">
                                    <Link
                                        href="/admin"
                                        className="flex items-center gap-1.5 text-xs font-bold text-amber-900"
                                        title={`অ্যাডমিন প্যানেল (${adminUser.name})`}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="hidden sm:inline-block max-w-[90px] truncate">{adminUser.name.split(' ')[0]}</span>
                                        <span className="bg-amber-500 text-white text-[10px] uppercase font-black px-1.5 py-0.5 rounded-full tracking-wide">
                                            Admin
                                        </span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                                        className="p-1 ml-0.5 text-amber-800 hover:text-amber-950 rounded-full hover:bg-amber-200/60 transition"
                                        aria-label="অ্যাডমিন মেনু খুলুন"
                                        title="অ্যাডমিন মেনু"
                                    >
                                        <ChevronDown
                                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                                isAccountDropdownOpen ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>
                                </div>
                            ) : customer ? (
                                <div className="flex items-center bg-page hover:bg-stone-100 border border-line rounded-full pl-1.5 pr-1.5 py-1 transition">
                                    <Link
                                        href="/customer/dashboard"
                                        className="flex items-center gap-1.5 text-xs font-semibold text-heading"
                                        title={`আমার প্রোফাইল (${customer.name})`}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center font-bold text-[11px]">
                                            {customer.name ? customer.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                                        </div>
                                        <span className="hidden sm:inline-block max-w-[90px] truncate">{customer.name.split(' ')[0]}</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                                        className="p-1 ml-0.5 text-body hover:text-heading rounded-full hover:bg-stone-200/60 transition"
                                        aria-label="কাস্টমার মেনু খুলুন"
                                        title="একাউন্ট মেনু"
                                    >
                                        <ChevronDown
                                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                                isAccountDropdownOpen ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/customer/login"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-stone-700 hover:text-heading hover:bg-page border border-transparent hover:border-line rounded-full text-xs font-semibold transition"
                                    title="লগইন / রেজিস্টার"
                                    aria-label="লগইন / রেজিস্টার"
                                >
                                    <UserIcon className="w-4 h-4 text-body" />
                                    <span className="hidden sm:inline font-medium">লগইন</span>
                                </Link>
                            )}

                            {/* Dropdown Menu */}
                            {isAccountDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl shadow-lg border border-line/80 py-2.5 z-50">
                                    {adminUser && (
                                        <>
                                            <div className="px-4 py-2 border-b border-stone-100">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                                                        {adminRoleLabel}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-ink text-sm mt-1 truncate">{adminUser.name}</p>
                                                <p className="text-xs text-muted truncate">{adminUser.email}</p>
                                            </div>

                                            <div className="py-1">
                                                <Link
                                                    href="/admin"
                                                    onClick={() => setIsAccountDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:text-amber-900 transition"
                                                >
                                                    <LayoutDashboard className="w-4 h-4 text-amber-600" />
                                                    <span>অ্যাডমিন ড্যাশবোর্ড</span>
                                                </Link>
                                                <Link
                                                    href="/admin/products"
                                                    onClick={() => setIsAccountDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-page hover:text-heading transition"
                                                >
                                                    <Package className="w-4 h-4 text-muted" />
                                                    <span>পণ্য তালিকা ও স্টক</span>
                                                </Link>
                                                <Link
                                                    href="/admin/orders"
                                                    onClick={() => setIsAccountDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-page hover:text-heading transition"
                                                >
                                                    <Truck className="w-4 h-4 text-muted" />
                                                    <span>অর্ডার ব্যবস্থাপনা</span>
                                                </Link>
                                                <Link
                                                    href="/admin/appearance"
                                                    onClick={() => setIsAccountDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-page hover:text-heading transition"
                                                >
                                                    <Settings className="w-4 h-4 text-muted" />
                                                    <span>স্টোর ও থিম সেটিংস</span>
                                                </Link>
                                                {customer && (
                                                    <Link
                                                        href="/customer/dashboard"
                                                        onClick={() => setIsAccountDropdownOpen(false)}
                                                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-heading hover:bg-emerald-50/70 transition border-t border-stone-100"
                                                    >
                                                        <UserIcon className="w-4 h-4 text-heading" />
                                                        <span>কাস্টমার একাউন্ট</span>
                                                    </Link>
                                                )}
                                            </div>

                                            <div className="pt-1 mt-1 border-t border-stone-100 px-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAccountDropdownOpen(false);
                                                        router.post('/admin/logout');
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>অ্যাডমিন লগআউট</span>
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {!adminUser && customer && (
                                        <>
                                            <div className="px-4 py-2 border-b border-stone-100">
                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-heading rounded-full">
                                                    কাস্টমার একাউন্ট
                                                </span>
                                                <p className="font-bold text-ink text-sm mt-1 truncate">{customer.name}</p>
                                                <p className="text-xs text-muted truncate">{customer.phone || customer.email}</p>
                                            </div>

                                            <div className="py-1">
                                                <Link
                                                    href="/customer/dashboard"
                                                    onClick={() => setIsAccountDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-page hover:text-heading transition"
                                                >
                                                    <LayoutDashboard className="w-4 h-4 text-heading" />
                                                    <span>আমার ড্যাশবোর্ড</span>
                                                </Link>
                                                <Link
                                                    href="/customer/orders"
                                                    onClick={() => setIsAccountDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-page hover:text-heading transition"
                                                >
                                                    <Truck className="w-4 h-4 text-muted" />
                                                    <span>আমার অর্ডারসমূহ</span>
                                                </Link>
                                                <Link
                                                    href="/customer/wishlist"
                                                    onClick={() => setIsAccountDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-page hover:text-heading transition"
                                                >
                                                    <Heart className="w-4 h-4 text-rose-500" />
                                                    <span>আমার উইশলিস্ট</span>
                                                </Link>
                                                <Link
                                                    href="/track-order"
                                                    onClick={() => setIsAccountDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-page hover:text-heading transition"
                                                >
                                                    <Search className="w-4 h-4 text-muted" />
                                                    <span>অর্ডার ট্র্যাক করুন</span>
                                                </Link>
                                            </div>

                                            <div className="pt-1 mt-1 border-t border-stone-100 px-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAccountDropdownOpen(false);
                                                        router.post('/customer/logout');
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>লগআউট</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

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
                            className="p-2 text-gray-700 hover:text-heading rounded-full hover:bg-stone-100 transition relative"
                            title="Shopping Cart"
                            aria-label="Open Shopping Cart"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {activeCart.total_items > 0 && (
                                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-cta text-cta-text rounded-full text-[10px] font-bold flex items-center justify-center">
                                    {activeCart.total_items > 99 ? '99+' : activeCart.total_items}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar Dropdown */}
                {isMobileSearchOpen && (
                    <div className="md:hidden border-t border-line p-3 bg-page">
                        <form onSubmit={handleSearchSubmit} className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search for products..."
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-20 py-2 border border-line rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                            />
                            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-cta hover:bg-cta-hover text-cta-text rounded-md text-xs font-semibold transition"
                            >
                                Search
                            </button>
                        </form>
                    </div>
                )}
            </header>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 flex lg:hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-label="মোবাইল নেভিগেশন মেনু"
                >
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="relative w-4/5 max-w-sm bg-surface h-full shadow-xl flex flex-col z-10 overflow-y-auto">
                        <div className="p-4 border-b border-line flex items-center justify-between bg-page">
                            <span className="font-serif font-bold text-heading text-base">মেনু ও ক্যাটাগরি</span>
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 text-muted hover:text-stone-800 rounded-lg"
                                aria-label="Close menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mobile Account Status Card */}
                        <div className="p-3 border-b border-stone-100 bg-page/50">
                            {adminUser ? (
                                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl">
                                    <div className="flex items-center gap-2.5 mb-2.5">
                                        <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-bold text-amber-950 truncate">{adminUser.name}</p>
                                                <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold uppercase">
                                                    Admin
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-amber-800 truncate">{adminUser.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link
                                            href="/admin"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="px-2.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold text-center transition"
                                        >
                                            অ্যাডমিন প্যানেল
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                router.post('/admin/logout');
                                            }}
                                            className="px-2.5 py-2 bg-surface text-rose-600 hover:bg-rose-50 border border-amber-200 rounded-lg text-xs font-semibold text-center transition"
                                        >
                                            লগআউট
                                        </button>
                                    </div>
                                </div>
                            ) : customer ? (
                                <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                                    <div className="flex items-center gap-2.5 mb-2.5">
                                        <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {customer.name ? customer.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-heading truncate">{customer.name}</p>
                                            <p className="text-[11px] text-emerald-800 truncate">{customer.phone || customer.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link
                                            href="/customer/dashboard"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="px-2.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold text-center transition"
                                        >
                                            ড্যাশবোর্ড
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                router.post('/customer/logout');
                                            }}
                                            className="px-2.5 py-2 bg-surface text-rose-600 hover:bg-rose-50 border border-emerald-200 rounded-lg text-xs font-semibold text-center transition"
                                        >
                                            লগআউট
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href="/customer/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg text-xs transition"
                                >
                                    <UserIcon className="w-4 h-4" />
                                    <span>লগইন / একাউন্ট তৈরি করুন</span>
                                </Link>
                            )}
                        </div>

                        {/* Search inside drawer */}
                        <div className="p-4 border-b border-stone-100">
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <input
                                    type="text"
                                    aria-label="পণ্য খুঁজুন"
                                    placeholder="পণ্য খুঁজুন..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-line bg-page rounded-lg text-sm focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                                />
                                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </form>
                        </div>

                        {/* Category Accordion */}
                        <div className="flex-1 p-4 space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">ক্যাটাগরি সমূহ</p>
                            {resolvedCategories.map((cat) => {
                                const hasChildren = cat.children && cat.children.length > 0;
                                const isExpanded = !!expandedMobileCategories[cat.id];

                                return (
                                    <div key={cat.id} className="border-b border-stone-100 pb-1">
                                        <div className="flex items-center justify-between py-2">
                                            <Link
                                                href={`/category/${cat.slug}`}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="text-sm font-medium text-stone-800 hover:text-heading transition"
                                            >
                                                {cat.name}
                                            </Link>
                                            {hasChildren && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleMobileCategory(cat.id)}
                                                    className="p-1.5 text-stone-400 hover:text-heading"
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
                                            <div className="pl-4 pb-2 space-y-1.5 border-l-2 border-emerald-200 ml-2">
                                                {cat.children!.map((sub) => (
                                                    <Link
                                                        key={sub.id}
                                                        href={`/category/${sub.slug}`}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="block text-xs text-body hover:text-heading py-1"
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
                                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">গুরুত্বপূর্ণ পেইজ</p>
                                <Link
                                    href="/"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm font-semibold text-stone-700 hover:text-heading py-1.5"
                                >
                                    হোম পেইজ
                                </Link>
                                <Link
                                    href="/shop"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm font-semibold text-stone-700 hover:text-heading py-1.5"
                                >
                                    শপ / সব পণ্য
                                </Link>
                                <Link
                                    href="/track-order"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm font-semibold text-heading hover:text-price py-1.5"
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
                                    className="block text-sm font-semibold text-stone-700 hover:text-heading py-1.5"
                                >
                                    {adminUser ? 'অ্যাডমিন প্যানেল' : customer ? 'আমার একাউন্ট' : 'লগইন / রেজিস্টার'}
                                </Link>
                                <Link
                                    href="/pages/about"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm text-body hover:text-heading py-1.5"
                                >
                                    আমাদের সম্পর্কে
                                </Link>
                                <Link
                                    href="/pages/contact"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm text-body hover:text-heading py-1.5"
                                >
                                    যোগাযোগ
                                </Link>
                                <Link
                                    href="/pages/privacy-policy"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm text-body hover:text-heading py-1.5"
                                >
                                    গোপনীয়তা নীতি
                                </Link>
                                <Link
                                    href="/pages/terms"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm text-body hover:text-heading py-1.5"
                                >
                                    ব্যবহারের শর্তাবলী
                                </Link>
                                <Link
                                    href="/pages/refund-policy"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block text-sm text-body hover:text-heading py-1.5"
                                >
                                    রিটার্ন ও রিফান্ড নীতি
                                </Link>
                            </div>
                        </div>

                        {/* Customer support in mobile drawer */}
                        <div className="p-4 border-t border-line bg-page space-y-2.5">
                            {theme.store_phone && (
                                <a
                                    href={`tel:${theme.store_phone}`}
                                    className="flex items-center gap-2 text-sm font-semibold text-stone-800"
                                >
                                    <Phone className="w-4 h-4 text-heading" />
                                    <span>হটলাইন: {theme.store_phone}</span>
                                </a>
                            )}
                            {theme.store_whatsapp && (
                                <a
                                    href={`https://wa.me/${cleanWhatsapp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold transition"
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
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-line py-2 px-3 shadow-xs">
                <div className="flex items-center justify-around text-center">
                    <Link
                        href="/"
                        className="flex flex-col items-center text-body hover:text-heading py-1 text-xs"
                    >
                        <Home className="w-5 h-5 mb-0.5" />
                        <span>হোম</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="flex flex-col items-center text-body hover:text-heading py-1 text-xs"
                    >
                        <Layers className="w-5 h-5 mb-0.5" />
                        <span>ক্যাটাগরি</span>
                    </button>

                    <Link
                        href="/shop"
                        className="flex flex-col items-center text-body hover:text-heading py-1 text-xs"
                    >
                        <Store className="w-5 h-5 mb-0.5" />
                        <span>শপ</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsMiniCartOpen(true)}
                        className="flex flex-col items-center text-body hover:text-heading py-1 text-xs relative"
                        aria-label="Open Shopping Cart"
                    >
                        <ShoppingBag className="w-5 h-5 mb-0.5" />
                        <span>কার্ট</span>
                        {activeCart.total_items > 0 && (
                            <span className="absolute top-0 right-3 w-3.5 h-3.5 bg-cta text-cta-text rounded-full text-[9px] font-bold flex items-center justify-center">
                                {activeCart.total_items > 99 ? '99+' : activeCart.total_items}
                            </span>
                        )}
                    </button>

                    <Link
                        href={accountUrl}
                        className="flex flex-col items-center text-body hover:text-heading py-1 text-xs"
                    >
                        <UserIcon className="w-5 h-5 mb-0.5" />
                        <span>{customer ? 'একাউন্ট' : 'লগইন'}</span>
                    </Link>
                </div>
            </div>

            {/* Storefront Footer (#0B3B2E Deep Forest Green matching mockup) */}
            <footer className="bg-footer text-footer-text/80 pt-14 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-white/10">
                        {/* Column 1: Store info */}
                        <div className="lg:col-span-3">
                            <div className="flex items-center gap-2 mb-3">
                                <SafeImage
                                    src={theme.logo_url}
                                    alt={theme.store_name}
                                    className="h-9 w-auto brightness-200"
                                    fallbackText=""
                                    fallbackIcon={
                                        <span className="text-2xl font-serif font-bold text-footer-text">
                                            {theme.store_name}
                                        </span>
                                    }
                                />
                            </div>
                            <p className="text-xs sm:text-sm text-footer-text/75 leading-relaxed mb-4">
                                Your trusted destination for modern fashion, footwear, and lifestyle
                                accessories with fast Cash on Delivery across Bangladesh.
                            </p>
                            {theme.store_phone && (
                                <p className="text-xs text-footer-text/90 font-semibold">
                                    Hotline: {theme.store_phone}
                                </p>
                            )}
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="lg:col-span-2">
                            <h4 className="text-footer-text font-semibold text-sm mb-3">Quick Links</h4>
                            <ul className="space-y-2 text-xs text-footer-text/75">
                                <li>
                                    <Link href="/pages/about" className="hover:text-footer-text transition">About Us</Link>
                                </li>
                                <li>
                                    <Link href="/pages/contact" className="hover:text-footer-text transition">Contact Us</Link>
                                </li>
                                <li>
                                    <Link href="/shop" className="hover:text-footer-text transition">All Products</Link>
                                </li>
                                <li>
                                    <Link href="/track-order" className="hover:text-footer-text transition">Track Order</Link>
                                </li>
                                <li>
                                    <Link href={accountUrl} className="hover:text-footer-text transition">{customer ? 'My Account' : 'Login / Register'}</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Shop */}
                        <div className="lg:col-span-2">
                            <h4 className="text-footer-text font-semibold text-sm mb-3">Shop</h4>
                            <ul className="space-y-2 text-xs text-footer-text/75">
                                {resolvedCategories.slice(0, 5).map((cat) => (
                                    <li key={cat.id}>
                                        <Link href={`/category/${cat.slug}`} className="hover:text-footer-text transition">
                                            {cat.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 4: Customer Care */}
                        <div className="lg:col-span-2">
                            <h4 className="text-footer-text font-semibold text-sm mb-3">Customer Care</h4>
                            <ul className="space-y-2 text-xs text-footer-text/75">
                                <li>
                                    <Link href="/pages/refund-policy" className="hover:text-footer-text transition">Return &amp; Refund</Link>
                                </li>
                                <li>
                                    <Link href="/customer/wishlist" className="hover:text-footer-text transition">My Wishlist</Link>
                                </li>
                                <li>
                                    <Link href="/pages/terms" className="hover:text-footer-text transition">Terms &amp; Conditions</Link>
                                </li>
                                <li>
                                    <Link href="/pages/privacy-policy" className="hover:text-footer-text transition">Privacy Policy</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 5: Subscribe & Get Offers */}
                        <div className="lg:col-span-3">
                            <h4 className="text-footer-text font-semibold text-sm mb-3">
                                Subscribe &amp; Get Offers
                            </h4>
                            <p className="text-xs text-footer-text/75 leading-relaxed mb-3">
                                Get the latest updates, new arrivals, and exclusive offers straight
                                to your inbox.
                            </p>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    router.visit('/shop');
                                }}
                                className="flex items-stretch overflow-hidden rounded-full bg-surface p-1"
                            >
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="min-w-0 flex-1 border-0 bg-transparent px-3 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 rounded-full bg-cta hover:bg-cta-hover text-cta-text text-xs font-bold transition shrink-0"
                                    aria-label="Subscribe"
                                >
                                    &rarr;
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Bottom Copyright & Payment Badges */}
                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-footer-text/70">
                        <p>&copy; {new Date().getFullYear()} {theme.store_name}. All Rights Reserved.</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                            <span className="px-2.5 py-1 rounded bg-surface text-[#1A1F71]">VISA</span>
                            <span className="px-2.5 py-1 rounded bg-surface text-[#EB001B]">Mastercard</span>
                            <span className="px-2.5 py-1 rounded bg-[#E2136E] text-white">bKash</span>
                            <span className="px-2.5 py-1 rounded bg-[#F7941D] text-white">Nagad</span>
                            <span className="px-2.5 py-1 rounded bg-[#8C3494] text-white">Rocket</span>
                        </div>
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
