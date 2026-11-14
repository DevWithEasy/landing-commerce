import { Link, router, usePage } from '@inertiajs/react';
import {
    Heart,
    LayoutDashboard,
    LogOut,
    Package,
    Search,
    User as UserIcon,
} from 'lucide-react';
import React from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import type { Category } from '@/types';
import type { SharedProps } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface CustomerLayoutProps {
    children: React.ReactNode;
    title: string;
    theme: StorefrontTheme;
    categories: Category[];
}

export function CustomerLayout({
    children,
    title,
    theme,
    categories,
}: CustomerLayoutProps) {
    const page = usePage<SharedProps>();
    const { auth, flash } = page.props;
    const customer = auth?.customer;

    const navLinks = [
        {
            name: 'ড্যাশবোর্ড (Dashboard)',
            href: '/customer/dashboard',
            icon: LayoutDashboard,
            active: page.url.startsWith('/customer/dashboard'),
        },
        {
            name: 'আমার অর্ডারসমূহ (Orders)',
            href: '/customer/orders',
            icon: Package,
            active: page.url.startsWith('/customer/orders'),
        },
        {
            name: 'উইশলিস্ট (Wishlist)',
            href: '/customer/wishlist',
            icon: Heart,
            active: page.url.startsWith('/customer/wishlist'),
        },
        {
            name: 'অর্ডার ট্র্যাক করুন (Track)',
            href: '/track-order',
            icon: Search,
            active: page.url.startsWith('/track-order'),
        },
    ];

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/customer/logout');
    };

    return (
        <StorefrontLayout theme={theme} categories={categories} title={title}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between">
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center justify-between">
                        <span>{flash.error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    {/* Left Sidebar Navigation */}
                    <div className="bg-surface rounded-xl border border-line/80 p-6">
                        <div className="flex items-center gap-3.5 pb-6 border-b border-stone-100">
                            <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-serif font-bold text-lg shrink-0">
                                {customer?.name ? customer.name.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-serif font-bold text-heading truncate text-base">
                                    {customer?.name || 'গ্রাহক একাউন্ট'}
                                </h3>
                                <p className="text-xs text-muted truncate">
                                    {customer?.email || ''}
                                </p>
                            </div>
                        </div>

                        <nav className="mt-4 space-y-1">
                            {navLinks.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                                            item.active
                                                ? 'bg-page text-heading font-semibold border border-line/80'
                                                : 'text-body hover:bg-page/60 hover:text-ink'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${item.active ? 'text-highlight' : 'text-stone-400'}`} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition mt-2"
                            >
                                <LogOut className="w-4 h-4 text-rose-500" />
                                <span>লগআউট (Logout)</span>
                            </button>
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        {children}
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
