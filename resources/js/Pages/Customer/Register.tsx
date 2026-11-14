import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Gift, Heart, Lock, Mail, Phone, ShoppingBag, User as UserIcon } from 'lucide-react';
import React, { useState } from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import type { Category } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface RegisterProps {
    theme: StorefrontTheme;
    categories: Category[];
}

export default function CustomerRegister({ theme, categories }: RegisterProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/customer/register');
    };

    return (
        <StorefrontLayout theme={theme} categories={categories} title={`Sign Up - ${theme.store_name}`}>
            <Head>
                <title>{`Sign Up - ${theme.store_name}`}</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="min-h-[calc(100vh-140px)] flex flex-col lg:flex-row">
                {/* Left Brand Panel (Deep Forest Green) */}
                <div className="lg:w-1/2 bg-brand text-white relative overflow-hidden flex items-center py-12 px-6 sm:px-12 lg:px-16">
                    {/* Right warm cream curved arch accent */}
                    <div
                        className="hidden lg:block absolute right-0 top-0 bottom-0 w-24 bg-page"
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
                                Join Us Today
                            </h1>
                            <p className="text-sm text-emerald-100/85 mt-3 leading-relaxed">
                                Create your {theme.store_name} account for faster checkout, order tracking, and exclusive member offers.
                            </p>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-emerald-200/30 bg-white/5 flex items-center justify-center shrink-0">
                                    <ShoppingBag className="w-4 h-4 text-emerald-100" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Track Your Orders</p>
                                    <p className="text-xs text-emerald-100/75">Real-time order updates anytime</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-emerald-200/30 bg-white/5 flex items-center justify-center shrink-0">
                                    <Heart className="w-4 h-4 text-emerald-100" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Save Your Favorites</p>
                                    <p className="text-xs text-emerald-100/75">Keep your wishlist synced</p>
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
                <div className="lg:w-1/2 bg-page flex items-center justify-center py-12 px-4 sm:px-8">
                    <div className="max-w-md w-full bg-surface rounded-xl border border-line/80 p-8 sm:p-10">
                        <div className="text-center mb-6">
                            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-heading">
                                Create Your Account
                            </h2>
                            <p className="text-xs sm:text-sm text-muted mt-1.5">
                                Sign up to track orders and save your favorite items.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            {/* Name Input */}
                            <div>
                                <div className="relative">
                                    <UserIcon
                                        className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="customer_reg_name"
                                        type="text"
                                        aria-label="Full Name"
                                        aria-required="true"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        placeholder="Full Name"
                                        className={`w-full h-11 pl-10 pr-4 bg-page/70 border rounded-lg text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand focus:bg-surface transition ${
                                            errors.name ? 'border-rose-400 bg-rose-50/40' : 'border-line'
                                        }`}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-xs text-rose-600 font-medium mt-1">{errors.name}</p>
                                )}
                            </div>

                            {/* Email Input */}
                            <div>
                                <div className="relative">
                                    <Mail
                                        className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="customer_reg_email"
                                        type="email"
                                        aria-label="Email address"
                                        aria-required="true"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        placeholder="Email address"
                                        className={`w-full h-11 pl-10 pr-4 bg-page/70 border rounded-lg text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand focus:bg-surface transition ${
                                            errors.email ? 'border-rose-400 bg-rose-50/40' : 'border-line'
                                        }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-rose-600 font-medium mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone Input */}
                            <div>
                                <div className="relative">
                                    <Phone
                                        className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="customer_reg_phone"
                                        type="tel"
                                        aria-label="Phone Number"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="Phone Number (Optional)"
                                        className={`w-full h-11 pl-10 pr-4 bg-page/70 border rounded-lg text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand focus:bg-surface transition ${
                                            errors.phone ? 'border-rose-400 bg-rose-50/40' : 'border-line'
                                        }`}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-xs text-rose-600 font-medium mt-1">{errors.phone}</p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="relative">
                                    <Lock
                                        className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="customer_reg_password"
                                        type={showPassword ? 'text' : 'password'}
                                        aria-label="Password"
                                        aria-required="true"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        placeholder="Password (min. 8 characters)"
                                        className={`w-full h-11 pl-10 pr-10 bg-page/70 border rounded-lg text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand focus:bg-surface transition ${
                                            errors.password ? 'border-rose-400 bg-rose-50/40' : 'border-line'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-body"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-rose-600 font-medium mt-1">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password Input */}
                            <div>
                                <div className="relative">
                                    <Lock
                                        className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="customer_reg_password_confirmation"
                                        type={showPassword ? 'text' : 'password'}
                                        aria-label="Confirm Password"
                                        aria-required="true"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                        placeholder="Confirm Password"
                                        className="w-full h-11 pl-10 pr-4 bg-page/70 border border-line rounded-lg text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand focus:bg-surface transition"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-11 px-4 bg-cta hover:bg-cta-hover text-cta-text rounded-lg text-sm font-semibold transition disabled:opacity-50"
                                >
                                    {processing ? 'Creating account...' : 'Create Account'}
                                </button>
                            </div>

                            {/* Login Link */}
                            <div className="text-center pt-4 border-t border-stone-100">
                                <p className="text-xs sm:text-sm text-gray-500">
                                    Already have an account?{' '}
                                    <Link
                                        href="/customer/login"
                                        className="font-bold text-price hover:underline"
                                    >
                                        Login
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
