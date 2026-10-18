import { CheckCircle2, MapPin, Phone, ShieldCheck, ShoppingCart, User } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { useBuilderStore } from '../stores/useBuilderStore';
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
    const availableProducts = useBuilderStore((state) => state.availableProducts);
    const [selectedVariantMap, setSelectedVariantMap] = useState<Record<number, number>>({});

    const productIds = props.productIds && props.productIds.length > 0
        ? props.productIds
        : (props.productId ? [props.productId] : []);

    const [selectedProductIds, setSelectedProductIds] = useState<number[]>(() => {
        if (props.defaultSelection === 'all') {
            return productIds;
        }
        if (props.defaultSelection === 'specific' && props.defaultSelectedId) {
            return [props.defaultSelectedId];
        }
        return productIds.length > 0 ? [productIds[0]] : [];
    });

    useEffect(() => {
        if (props.defaultSelection === 'all') {
            setSelectedProductIds(productIds);
        } else if (props.defaultSelection === 'specific' && props.defaultSelectedId) {
            setSelectedProductIds([props.defaultSelectedId]);
        } else {
            setSelectedProductIds(productIds.length > 0 ? [productIds[0]] : []);
        }
    }, [props.defaultSelection, props.defaultSelectedId, JSON.stringify(productIds)]);

    const handleToggleProduct = (pid: number) => {
        if (props.selectionMode === 'multiple') {
            setSelectedProductIds((prev) =>
                prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
            );
        } else {
            setSelectedProductIds([pid]);
        }
    };

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

    const nameLabel = props.nameLabel || 'আপনার নাম (Your Name)';
    const namePlaceholder = props.namePlaceholder || 'আপনার পুরো নাম লিখুন...';
    const phoneLabel = props.phoneLabel || 'মোবাইল নাম্বার (Mobile Number)';
    const phonePlaceholder = props.phonePlaceholder || '01XXXXXXXXX (১১ ডিজিট)';
    const addressLabel = props.addressLabel || 'সম্পূর্ণ ডেলিভারি ঠিকানা (Full Address)';
    const addressPlaceholder = props.addressPlaceholder || 'বাসা/হোল্ডিং নং, রোড নং, এলাকা, থানা ও জেলা...';
    const shippingLabel = props.shippingLabel || 'শিপিং মেথড (Shipping Method)';
    const buttonText = props.buttonText || 'অর্ডার কনফার্ম করুন — ক্যাশ অন ডেলিভারি';
    const productBadges = props.productBadges || {};

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
                        {productIds.length > 0 && (
                            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                                    <span>Selected Products:</span>
                                    <span className="text-emerald-700 font-semibold">
                                        {props.selectionMode === 'multiple' ? 'Multiple Selection (Checkbox)' : 'Single Selection (Radio)'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {productIds.map((pid, idx) => {
                                        const realProd = availableProducts.find((p) => p.id === pid);
                                        const isSelected = selectedProductIds.includes(pid);

                                        const activeVariantId = selectedVariantMap[pid] || realProd?.variants?.[0]?.id || 0;
                                        const activeVariant = realProd?.variants?.find((v) => v.id === activeVariantId) || realProd?.variants?.[0];

                                        const regPrice = activeVariant ? Number(activeVariant.regular_price) : (realProd ? Number(realProd.regular_price) : 1500);
                                        const salePrice = activeVariant?.sale_price ? Number(activeVariant.sale_price) : (realProd?.sale_price ? Number(realProd.sale_price) : 1250);
                                        const effPrice = salePrice || regPrice;
                                        const hasDiscount = salePrice && salePrice < regPrice;
                                        const discountPct = hasDiscount && regPrice > 0 ? Math.round(((regPrice - salePrice) / regPrice) * 100) : 0;

                                        const imgUrl = activeVariant?.images?.[0]?.url || realProd?.primaryImage?.url || realProd?.images?.[0]?.url;
                                        const customBadge = productBadges[pid] || (idx === 0 ? props.badgeText : '');

                                        return (
                                            <div
                                                key={pid}
                                                onClick={() => handleToggleProduct(pid)}
                                                className={`flex flex-col p-2.5 rounded-xl border text-xs transition cursor-pointer select-none ${
                                                    isSelected
                                                        ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                                                        : 'bg-white border-gray-200 opacity-80 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2.5 min-w-0">
                                                        <span className={`w-4 h-4 shrink-0 ${props.selectionMode === 'multiple' ? 'rounded' : 'rounded-full'} border ${
                                                            isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                                                        } flex items-center justify-center text-[10px] font-bold`}>
                                                            {isSelected ? '✓' : ''}
                                                        </span>
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                                            {imgUrl ? (
                                                                 <img src={imgUrl} alt={realProd?.title || `Product #${pid}`} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-gray-400">IMG</span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center space-x-1.5">
                                                                <span className="font-bold text-gray-900 truncate">
                                                                    {realProd?.title || `Product #${pid}`}
                                                                </span>
                                                                {customBadge && (
                                                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                                                                        {customBadge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-gray-500 block">
                                                                {realProd ? 'In Stock & Verified' : 'Placeholder Preview'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 pl-2">
                                                        <div className="font-extrabold text-emerald-600 text-sm">৳{effPrice.toLocaleString()}</div>
                                                        <div className="flex items-center justify-end space-x-1">
                                                            {hasDiscount && (
                                                                <span className="text-[10px] text-gray-400 line-through">৳{regPrice.toLocaleString()}</span>
                                                            )}
                                                            {props.showDiscountBadge !== false && hasDiscount && (
                                                                <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">{discountPct}% OFF</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Variants Selector - Only show when product is selected */}
                                                {isSelected && realProd?.variants && realProd.variants.length > 1 && (
                                                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <span className="text-[9px] font-bold text-gray-500 uppercase">Variant:</span>
                                                        {realProd.variants.map((v) => (
                                                            <button
                                                                key={v.id}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedVariantMap((prev) => ({ ...prev, [pid]: v.id }));
                                                                }}
                                                                className={`px-2 py-0.5 text-[10px] rounded-md border font-medium transition ${
                                                                    activeVariantId === v.id
                                                                        ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                                                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {v.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 1. Customer Name */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                {nameLabel} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    disabled={isEditor}
                                    placeholder={namePlaceholder}
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                />
                            </div>
                        </div>

                        {/* 2. Customer Phone */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                {phoneLabel} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="tel"
                                    disabled={isEditor}
                                    placeholder={phonePlaceholder}
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-white font-mono"
                                />
                            </div>
                        </div>

                        {/* 3. Detailed Address */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                {addressLabel} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <textarea
                                    rows={2}
                                    disabled={isEditor}
                                    placeholder={addressPlaceholder}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                />
                            </div>
                        </div>

                        {/* 4. Shipping Method Dropdown */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                {shippingLabel} <span className="text-rose-500">*</span>
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
                                <span>{buttonText}</span>
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
