import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Lock, LogIn, Mail, ShieldCheck } from 'lucide-react';
import React from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import type { Category } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface LoginProps {
    theme: StorefrontTheme;
    categories: Category[];
}

export default function CustomerLogin({ theme, categories }: LoginProps) {
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
        <StorefrontLayout theme={theme} categories={categories} title="গ্রাহক লগইন | Customer Login">
            <Head title="গ্রাহক লগইন | Customer Login" />

            <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 mb-4">
                            <LogIn className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            গ্রাহক লগইন
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            আপনার একাউন্টে প্রবেশ করে অর্ডার ও উইশলিস্ট দেখুন
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                ইমেইল এড্রেস (Email Address)
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    placeholder="your@email.com"
                                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                                        errors.email ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:bg-white'
                                    }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-red-500 font-medium mt-1.5">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                পাসওয়ার্ড (Password)
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                                        errors.password ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:bg-white'
                                    }`}
                                />
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500 font-medium mt-1.5">{errors.password}</p>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>আমাকে মনে রাখুন</span>
                            </label>
                            <Link
                                href="/track-order"
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                অর্ডার ট্র্যাক করুন
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                            {processing ? (
                                <span>লগইন হচ্ছে...</span>
                            ) : (
                                <>
                                    <span>লগইন করুন</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        {/* Register Link */}
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-500">
                                একাউন্ট নেই?{' '}
                                <Link
                                    href="/customer/register"
                                    className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                                >
                                    নতুন একাউন্ট খুলুন (Register)
                                </Link>
                            </p>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>আপনার তথ্য সম্পূর্ণ নিরাপদ ও গোপন রাখা হবে</span>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
