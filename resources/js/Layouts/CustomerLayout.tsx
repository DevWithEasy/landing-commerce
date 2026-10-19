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
    const { auth, flash } = usePage<SharedProps>().props;
    const customer = auth?.customer;

    const navLinks = [
        {
            name: 'ড্যাশবোর্ড (Dashboard)',
            href: '/customer/dashboard',
            icon: LayoutDashboard,
            active: typeof window !== 'undefined' && window.location.pathname === '/customer/dashboard',
        },
        {
            name: 'আমার অর্ডারসমূহ (Orders)',
            href: '/customer/orders',
            icon: Package,
            active: typeof window !== 'undefined' && window.location.pathname.startsWith('/customer/orders'),
        },
        {
            name: 'উইশলিস্ট (Wishlist)',
            href: '/customer/wishlist',
            icon: Heart,
            active: typeof window !== 'undefined' && window.location.pathname === '/customer/wishlist',
        },
        {
            name: 'অর্ডার ট্র্যাক করুন (Track)',
            href: '/track-order',
            icon: Search,
            active: typeof window !== 'undefined' && window.location.pathname === '/track-order',
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
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center justify-between">
                        <span>{flash.error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    {/* Left Sidebar Navigation */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3.5 pb-6 border-b border-gray-100">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                {customer?.name ? customer.name.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-gray-900 truncate text-base">
                                    {customer?.name || 'গ্রাহক একাউন্ট'}
                                </h3>
                                <p className="text-xs text-gray-500 truncate">
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
                                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                                            item.active
                                                ? 'bg-indigo-50 text-indigo-700 font-bold'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${item.active ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition mt-2"
                            >
                                <LogOut className="w-4 h-4 text-red-500" />
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
