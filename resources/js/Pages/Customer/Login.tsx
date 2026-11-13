import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Gift, Heart, Lock, Mail, ShoppingBag } from 'lucide-react';
import React, { useState } from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import type { Category } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface LoginProps {
    theme: StorefrontTheme;
    categories: Category[];
}

export default function CustomerLogin({ theme, categories }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/customer/login');
    };

    return (
        <StorefrontLayout theme={theme} categories={categories} title={`Login - ${theme.store_name}`}>
            <Head>
                <title>{`Login - ${theme.store_name}`}</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="min-h-[calc(100vh-140px)] flex flex-col lg:flex-row">
                {/* Left Brand Panel (Deep Forest Green) */}
                <div className="lg:w-1/2 bg-[#0B3B2E] text-white relative overflow-hidden flex items-center py-12 px-6 sm:px-12 lg:px-16">
                    {/* Right warm cream curved arch accent */}
                    <div
                        className="hidden lg:block absolute right-0 top-0 bottom-0 w-24 bg-[#FAF7F2]"
                        style={{ clipPath: 'ellipse(100% 70% at 100% 50%)' }}
                    />

                    <div className="relative z-10 max-w-md mx-auto lg:mx-0 space-y-8">
                        <div>
                            <p className="font-serif text-3xl font-bold tracking-tight text-white">
                                {theme.store_name}
                            </p>
                            <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-200/80 mt-0.5">
                                Online Store
                            </p>
                        </div>

                        <div>
                            <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight text-white">
                                Welcome Back
                            </h1>
                            <p className="text-sm text-emerald-100/85 mt-3 leading-relaxed">
                                Login to your {theme.store_name} account and enjoy a seamless shopping experience.
                            </p>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-emerald-200/30 bg-white/5 flex items-center justify-center shrink-0">
                                    <ShoppingBag className="w-4 h-4 text-emerald-100" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Track Your Orders</p>
                                    <p className="text-xs text-emerald-100/75">Check order status anytime</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-emerald-200/30 bg-white/5 flex items-center justify-center shrink-0">
                                    <Heart className="w-4 h-4 text-emerald-100" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Save Your Favorites</p>
                                    <p className="text-xs text-emerald-100/75">Create your personal wishlist</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-emerald-200/30 bg-white/5 flex items-center justify-center shrink-0">
                                    <Gift className="w-4 h-4 text-emerald-100" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Exclusive Offers</p>
                                    <p className="text-xs text-emerald-100/75">Get special deals &amp; early access</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Form Panel (Warm Cream + White Card) */}
                <div className="lg:w-1/2 bg-[#FAF7F2] flex items-center justify-center py-12 px-4 sm:px-8">
                    <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_32px_rgba(15,23,42,0.06)] border border-stone-200/70 p-8 sm:p-10">
                        <div className="text-center mb-7">
                            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
                                Login to Your Account
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
                                Access your orders, wishlist and exclusive offers.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email Input */}
                            <div>
                                <div className="relative">
                                    <Mail
                                        className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="customer_login_email"
                                        type="email"
                                        aria-label="Email address"
                                        aria-required="true"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        placeholder="Email address"
                                        className={`w-full pl-10 pr-4 py-3 bg-[#FAF7F2]/70 border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F96D16]/20 focus:border-[#F96D16] focus:bg-white transition ${
                                            errors.email ? 'border-rose-400 bg-rose-50/40' : 'border-stone-200'
                                        }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.email}</p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="relative">
                                    <Lock
                                        className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="customer_login_password"
                                        type={showPassword ? 'text' : 'password'}
                                        aria-label="Password"
                                        aria-required="true"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        placeholder="Password"
                                        className={`w-full pl-10 pr-10 py-3 bg-[#FAF7F2]/70 border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F96D16]/20 focus:border-[#F96D16] focus:bg-white transition ${
                                            errors.password ? 'border-rose-400 bg-rose-50/40' : 'border-stone-200'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.password}</p>
                                )}
                            </div>

                            {/* Remember Me & Track Order */}
                            <div className="flex items-center justify-between text-xs pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-stone-300 text-[#F96D16] focus:ring-[#F96D16] accent-[#F96D16]"
                                    />
                                    <span>Remember me</span>
                                </label>
                                <Link
                                    href="/track-order"
                                    className="font-semibold text-[#EA580C] hover:underline"
                                >
                                    Track Order?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 px-4 bg-[#F96D16] hover:bg-[#EA580C] text-white rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50 mt-2"
                            >
                                {processing ? 'Logging in...' : 'Login'}
                            </button>

                            {/* Register Link */}
                            <div className="text-center pt-4 border-t border-stone-100">
                                <p className="text-xs sm:text-sm text-gray-500">
                                    Don&apos;t have an account?{' '}
                                    <Link
                                        href="/customer/register"
                                        className="font-bold text-[#EA580C] hover:underline"
                                    >
                                        Sign Up
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
