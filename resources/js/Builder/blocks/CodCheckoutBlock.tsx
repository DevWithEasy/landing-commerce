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
                                    <span>Included Products:</span>
                                    <span className="text-emerald-700 font-semibold">
                                        {props.selectionMode === 'multiple' ? 'Checkbox Selection' : 'Radio Selection'}
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    {props.productIds!.map((pid) => (
                                        <div key={pid} className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 text-xs">
                                            <div className="flex items-center space-x-2">
                                                <span className={`w-3.5 h-3.5 ${props.selectionMode === 'multiple' ? 'rounded' : 'rounded-full'} border border-emerald-600 bg-emerald-600 flex items-center justify-center text-white text-[9px]`}>
                                                    ✓
                                                </span>
                                                <span className="font-semibold text-gray-800">Product #{pid}</span>
                                            </div>
                                            <span className="font-extrabold text-emerald-600">৳1,250.00</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Customer Name */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Your Full Name <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    disabled={isEditor}
                                    placeholder="e.g. Tanvir Hasan"
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                />
                            </div>
                        </div>

                        {/* Customer Phone */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Mobile Number (Bangladeshi 11-digit){' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="tel"
                                    disabled={isEditor}
                                    placeholder="01712-345678"
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-white font-mono"
                                />
                            </div>
                        </div>

                        {/* District Selector */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Delivery District <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <select
                                    disabled={isEditor}
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                    <option>Dhaka (Inside Dhaka - ৳70)</option>
                                    <option>Gazipur (Suburbs - ৳100)</option>
                                    <option>Chittagong (Outside Dhaka - ৳130)</option>
                                    <option>Sylhet (Outside Dhaka - ৳130)</option>
                                </select>
                            </div>
                        </div>

                        {/* Full Address */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Detailed Delivery Address <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={2}
                                disabled={isEditor}
                                placeholder="House / Flat #, Road #, Area..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                            />
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
                                    {props.buttonText || 'Confirm Order - Cash on Delivery'}
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center justify-center space-x-4 pt-2 text-xs text-gray-500 text-center">
                            <span className="inline-flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                100% Risk Free
                            </span>
                            <span className="inline-flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                Inspect Upon Arrival
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
