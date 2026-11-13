import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    CheckCircle,
    CreditCard,
    ExternalLink,
    FileText,
    FolderTree,
    Image as ImageIcon,
    Images,
    Layers,
    LogOut,
    Menu,
    Package,
    Palette,
    Settings,
    Shield,
    ShoppingCart,
    Store,
    Truck,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { SharedProps } from '@/types';

interface NavigationItem {
    name: string;
    href: string;
    icon: LucideIcon;
    current: boolean;
    badge?: string;
}

export interface AdminLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
    const { auth, flash } = usePage<SharedProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dismissFlash, setDismissFlash] = useState(false);

    const user = auth.user;

    const navigation: NavigationItem[] = [
        ...(user?.role !== 'fulfillment_agent'
            ? [
                  {
                      name: 'Products & Inventory',
                      href: '/admin/products',
                      icon: Package,
                      current:
                          window.location.pathname.startsWith('/admin/products') ||
                          window.location.pathname === '/admin',
                  },
                  {
                      name: 'Categories',
                      href: '/admin/categories',
                      icon: FolderTree,
                      current: window.location.pathname.startsWith('/admin/categories'),
                  },
                  {
                      name: 'Landing Pages',
                      href: '/admin/landing-pages',
                      icon: Layers,
                      current: window.location.pathname.startsWith('/admin/landing-pages'),
                  },
                  {
                      name: 'Media Library',
                      href: '/admin/media',
                      icon: ImageIcon,
                      current: window.location.pathname.startsWith('/admin/media'),
                  },
                  {
                      name: 'Policy Pages',
                      href: '/admin/pages',
                      icon: FileText,
                      current: window.location.pathname.startsWith('/admin/pages'),
                  },
              ]
            : []),
        {
            name: 'Orders & COD',
            href: '/admin/orders',
            icon: ShoppingCart,
            current: window.location.pathname.startsWith('/admin/orders'),
        },
        ...(user?.role !== 'fulfillment_agent'
            ? [
                  {
                      name: 'Shipping Methods',
                      href: '/admin/shipping-methods',
                      icon: Truck,
                      current: window.location.pathname.startsWith('/admin/shipping-methods'),
                  },
                  {
                      name: 'Payment Methods',
                      href: '/admin/payment-methods',
                      icon: CreditCard,
                      current: window.location.pathname.startsWith('/admin/payment-methods'),
                  },
                  {
                      name: 'Appearance & Theme',
                      href: '/admin/appearance/theme',
                      icon: Palette,
                      current: window.location.pathname.startsWith('/admin/appearance'),
                  },
                  {
                      name: 'Hero Sliders',
                      href: '/admin/sliders',
                      icon: Images,
                      current: window.location.pathname.startsWith('/admin/sliders'),
                  },
              ]
            : []),
        ...(user?.role === 'super_admin'
            ? [
                  {
                      name: 'Tracking & Pixels',
                      href: '/admin/tracking',
                      icon: Activity,
                      current: window.location.pathname.startsWith('/admin/tracking'),
                  },
                  {
                      name: 'Settings & Integrations',
                      href: '/admin/settings',
                      icon: Settings,
                      current: window.location.pathname.startsWith('/admin/settings'),
                  },
              ]
            : []),
    ];

    const roleName = user?.role
        ? user.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Administrator';

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col md:flex-row">
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Velure Deep Forest Green) */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B3B2E] text-emerald-50 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Brand header */}
                    <div className="flex items-center justify-between px-6 h-16 border-b border-[#145240]">
                        <Link href="/admin/products" className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#F96D16] flex items-center justify-center text-white shadow-xs font-bold text-lg">
                                <Store className="w-4 h-4" />
                            </div>
                            <span className="font-serif font-bold text-base tracking-tight text-white">
                                Landing Commerce
                            </span>
                        </Link>
                        <button
                            type="button"
                            className="md:hidden text-emerald-200 hover:text-white"
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Close sidebar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-200/70 mb-2">
                            Commerce Core
                        </div>
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                        item.current
                                            ? 'bg-[#F96D16] text-white shadow-xs'
                                            : 'text-emerald-100/85 hover:bg-[#124D3C] hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                                        <span>{item.name}</span>
                                    </div>
                                    {item.badge && (
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#082B21] text-emerald-200 border border-[#145240]">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* User profile footer */}
                    <div className="p-4 border-t border-[#145240] bg-[#082B21]">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-[#124D3C] border border-[#1B6B54] flex items-center justify-center text-emerald-100">
                                <Shield className="w-4 h-4 text-[#F96D16]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {user?.name || 'Store Admin'}
                                </p>
                                <p className="text-xs text-emerald-200/70 truncate">{roleName}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="p-1.5 text-emerald-200/70 hover:text-rose-300 hover:bg-[#124D3C] rounded-lg transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top header */}
                <header className="bg-white border-b border-stone-200/80 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            className="md:hidden text-gray-500 hover:text-[#0B3B2E] focus:outline-none"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open sidebar"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            {title && (
                                <h1 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-[#0B3B2E] text-xs font-semibold text-[#0B3B2E] hover:bg-[#FAF7F2] transition"
                        >
                            <span>View Store</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {actions}
                    </div>
                </header>

                {/* Flash Messages */}
                {!dismissFlash && flash?.success && (
                    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs">
                        <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <p className="text-sm font-medium">{flash.success}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDismissFlash(true)}
                            className="text-emerald-600 hover:text-emerald-800"
                            aria-label="Dismiss alert"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {!dismissFlash && flash?.error && (
                    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between shadow-xs">
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                            <p className="text-sm font-medium">{flash.error}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDismissFlash(true)}
                            className="text-rose-600 hover:text-rose-800"
                            aria-label="Dismiss alert"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Page body */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
