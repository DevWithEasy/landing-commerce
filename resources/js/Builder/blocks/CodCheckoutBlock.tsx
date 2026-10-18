import { CheckCircle2, MapPin, Phone, ShieldCheck, ShoppingCart, User } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { BlockStyles, CodCheckoutBlockProps } from '@/types/builder';

export interface CodCheckoutBlockComponentProps {
    props: CodCheckoutBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function CodCheckoutBlock({
    props,
    styles = {},
    isEditor = false,
}: CodCheckoutBlockComponentProps) {
    const inlineStyles: CSSProperties = {
        backgroundColor: styles.backgroundColor,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        borderRadius: styles.borderRadius,
        borderColor: styles.borderColor,
        borderWidth: styles.borderWidth,
        borderStyle: styles.borderStyle,
    };

    return (
        <section id="cod-checkout" style={inlineStyles} className="w-full py-10 bg-slate-50">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-2xl p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center pb-6 border-b border-gray-100">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Cash on Delivery Form</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                            Fast 1-Step Checkout
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Fill in your delivery address below. Pay in cash when the rider arrives!
                        </p>
                    </div>

                    {/* Preview Form Controls */}
                    <div className="pt-6 space-y-4">
                        {Boolean(props.productIds && props.productIds.length > 1) && (
                            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                                    <span>Selected Products:</span>
                                    <span className="text-emerald-700 font-semibold">
                                        {props.selectionMode === 'multiple' ? 'Multiple Selection (Checkbox)' : 'Single Selection (Radio)'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {props.productIds!.map((pid, idx) => {
                                        const isSelected = props.defaultSelection === 'all'
                                            ? true
                                            : props.defaultSelection === 'specific'
                                                ? props.defaultSelectedId === pid
                                                : idx === 0;

                                        return (
                                            <div
                                                key={pid}
                                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                                                    isSelected
                                                        ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                                                        : 'bg-white border-gray-200 opacity-80'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2.5">
                                                    <span className={`w-4 h-4 ${props.selectionMode === 'multiple' ? 'rounded' : 'rounded-full'} border ${
                                                        isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                                                    } flex items-center justify-center text-[10px] font-bold`}>
                                                        {isSelected ? '✓' : ''}
                                                    </span>
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                                        <span className="text-[10px] font-bold text-gray-400">IMG</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <span className="font-bold text-gray-900">Product #{pid}</span>
                                                            {props.badgeText && idx === 0 && (
                                                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                                                    {props.badgeText}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 block">In Stock & Verified</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-extrabold text-emerald-600 text-sm">৳1,250.00</div>
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <span className="text-[10px] text-gray-400 line-through">৳1,500.00</span>
                                                        {props.showDiscountBadge !== false && (
                                                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">17% OFF</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 1. Customer Name */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                আপনার নাম (Your Name) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    disabled={isEditor}
                                    placeholder="আপনার পুরো নাম লিখুন..."
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                />
                            </div>
                        </div>

                        {/* 2. Customer Phone */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                মোবাইল নাম্বার (Mobile Number) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="tel"
                                    disabled={isEditor}
                                    placeholder="01XXXXXXXXX (১১ ডিজিট)"
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-white font-mono"
                                />
                            </div>
                        </div>

                        {/* 3. Detailed Address */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                সম্পূর্ণ ঠিকানা (Full Delivery Address) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <textarea
                                    rows={2}
                                    disabled={isEditor}
                                    placeholder="বাসা নং, রোড নং, থানা, জেলা সহ বিস্তারিত ঠিকানা..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                />
                            </div>
                        </div>

                        {/* 4. Shipping Method Dropdown */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                শিপিং মেথড (Shipping Method) <span className="text-rose-500">*</span>
                            </label>
                            <select
                                disabled={isEditor}
                                className="w-full px-3 py-2.5 text-sm font-semibold border-2 border-emerald-500 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50/30 text-gray-900"
                            >
                                <option>ঢাকার ভিতরে (Inside Dhaka) — ৳70.00</option>
                                <option>ঢাকার বাইরে (Outside Dhaka) — ৳130.00</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="button"
                                disabled={isEditor}
                                className="w-full py-4 px-6 text-base sm:text-lg font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span>
                                    {props.buttonText || 'অর্ডার কনফার্ম করুন — ক্যাশ অন ডেলিভারি'}
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center justify-center space-x-4 pt-2 text-xs text-gray-500 text-center">
                            <span className="inline-flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                ১০০% ক্যাশ অন ডেলিভারি
                            </span>
                            <span className="inline-flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                প্রোডাক্ট দেখে মূল্য পরিশোধ
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
