import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Lock, Mail, Phone, ShieldCheck, User as UserIcon, UserPlus } from 'lucide-react';
import React from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import type { Category } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface RegisterProps {
    theme: StorefrontTheme;
    categories: Category[];
}

export default function CustomerRegister({ theme, categories }: RegisterProps) {
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
        <StorefrontLayout theme={theme} categories={categories} title="নতুন গ্রাহক নিবন্ধন | Register">
            <Head>
                <title>নতুন গ্রাহক নিবন্ধন | Register</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 mb-4">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            নতুন একাউন্ট খুলুন
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            এক ক্লিকে অর্ডার হিস্ট্রি এবং পছন্দের উইশলিস্ট সংরক্ষণ করুন
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Input */}
                        <div>
                            <label htmlFor="customer_reg_name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                আপনার নাম (Full Name) *
                            </label>
                            <div className="relative">
                                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                                <input
                                    id="customer_reg_name"
                                    type="text"
                                    aria-required="true"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    placeholder="আপনার নাম লিখুন"
                                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                                        errors.name ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:bg-white'
                                    }`}
                                />
                            </div>
                            {errors.name && (
                                <p className="text-xs text-red-500 font-medium mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Email Input */}
                        <div>
                            <label htmlFor="customer_reg_email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                ইমেইল এড্রেস (Email Address) *
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                                <input
                                    id="customer_reg_email"
                                    type="email"
                                    aria-required="true"
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
                                <p className="text-xs text-red-500 font-medium mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Phone Input (Optional) */}
                        <div>
                            <label htmlFor="customer_reg_phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                মোবাইল নম্বর (Phone Number)
                            </label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                                <input
                                    id="customer_reg_phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="017XXXXXXXX"
                                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                                        errors.phone ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:bg-white'
                                    }`}
                                />
                            </div>
                            {errors.phone && (
                                <p className="text-xs text-red-500 font-medium mt-1">{errors.phone}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="customer_reg_password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                পাসওয়ার্ড (Password) *
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                                <input
                                    id="customer_reg_password"
                                    type="password"
                                    aria-required="true"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    placeholder="কমপক্ষে ৮ অক্ষর"
                                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                                        errors.password ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:bg-white'
                                    }`}
                                />
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500 font-medium mt-1">{errors.password}</p>
                            )}
                        </div>

                        {/* Password Confirmation */}
                        <div>
                            <label htmlFor="customer_reg_password_confirmation" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                পাসওয়ার্ড নিশ্চিত করুন (Confirm Password) *
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                                <input
                                    id="customer_reg_password_confirmation"
                                    type="password"
                                    aria-required="true"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                    placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                                {processing ? (
                                    <span>নিবন্ধন হচ্ছে...</span>
                                ) : (
                                    <>
                                        <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-500">
                                ইতিমধ্যে একাউন্ট আছে?{' '}
                                <Link
                                    href="/customer/login"
                                    className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                                >
                                    লগইন করুন (Login)
                                </Link>
                            </p>
                        </div>
                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>১০০% নিরাপদ শপিং এবং দ্রুত ডেলিভারি নিশ্চয়তা</span>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
