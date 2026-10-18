import { Check, CheckSquare, CircleDot, Package, ShoppingBag, Tag } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { useBuilderStore } from '../stores/useBuilderStore';
import type { BlockStyles, ProductSelectorBlockProps } from '@/types/builder';

export interface ProductSelectorBlockComponentProps {
    props: ProductSelectorBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function ProductSelectorBlock({
    props,
    styles = {},
    isEditor = false,
}: ProductSelectorBlockComponentProps) {
    const availableProducts = useBuilderStore((state) => state.availableProducts);
    const [selectedVariantMap, setSelectedVariantMap] = useState<Record<number, number>>({});

    const inlineStyles: CSSProperties = {
        backgroundColor: styles.backgroundColor,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        borderRadius: styles.borderRadius,
        maxWidth: styles.maxWidth,
    };

    const productIds = props.productIds && props.productIds.length > 0
        ? props.productIds
        : (props.productId ? [props.productId] : []);

    const count = productIds.length;
    const isMultiple = Boolean(productIds.length > 1);
    const mode = props.selectionMode || 'single';
    const orderButtonText = props.orderButtonText || 'অর্ডার করুন — ক্যাশ অন ডেলিভারি';
    const productBadges = props.productBadges || {};

    if (isMultiple) {
        return (
            <section style={inlineStyles} className="w-full py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
                            {mode === 'multiple' ? 'Multiple Selection (Checkbox)' : 'Single Selection (Radio)'}
                        </span>
                        <h2 className="text-2xl font-extrabold text-gray-900">
                            {mode === 'multiple' ? 'Select Products to Order Together' : 'Choose 1 Product Option'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {productIds.map((pid, idx) => {
                            const realProd = availableProducts.find((p) => p.id === pid);
                            const isSelected = props.defaultSelection === 'all'
                                ? true
                                : props.defaultSelection === 'specific'
                                    ? props.defaultSelectedId === pid
                                    : idx === 0;

                            const activeVariantId = selectedVariantMap[pid] || realProd?.variants?.[0]?.id || 0;
                            const activeVariant = realProd?.variants?.find((v) => v.id === activeVariantId) || realProd?.variants?.[0];

                            const regPrice = activeVariant ? Number(activeVariant.regular_price) : (realProd ? Number(realProd.regular_price) : 1500);
                            const salePrice = activeVariant?.sale_price ? Number(activeVariant.sale_price) : (realProd?.sale_price ? Number(realProd.sale_price) : 1250);
                            const effPrice = salePrice || regPrice;
                            const hasDiscount = salePrice && salePrice < regPrice;
                            const discountPct = hasDiscount && regPrice > 0 ? Math.round(((regPrice - salePrice) / regPrice) * 100) : 0;

                            const imgUrl = activeVariant?.images?.[0]?.url || realProd?.primaryImage?.url || realProd?.images?.[0]?.url;
                            const cardBadge = productBadges[pid] || (idx === 0 ? props.badgeText : '');

                            return (
                                <div
                                    key={pid}
                                    className={`relative rounded-2xl border-2 p-4 transition-all bg-white shadow-xs flex flex-col justify-between ${
                                        isSelected
                                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <div>
                                        {cardBadge && (
                                            <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-sm">
                                                🔥 {cardBadge}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mb-3 mt-1">
                                            <div className="flex items-center space-x-2 text-xs font-bold text-gray-700">
                                                {mode === 'multiple' ? (
                                                    <CheckSquare className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                ) : (
                                                    <CircleDot className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                )}
                                                <span className="truncate max-w-[130px]">{realProd?.title || `Product #${pid}`}</span>
                                            </div>
                                            {props.showDiscountBadge !== false && hasDiscount && (
                                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                                                    {discountPct}% OFF
                                                </span>
                                            )}
                                        </div>

                                        <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center mb-3 border border-gray-100 overflow-hidden">
                                            {imgUrl ? (
                                                <img src={imgUrl} alt={realProd?.title || `Product #${pid}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-10 h-10 text-gray-400" />
                                            )}
                                        </div>

                                        <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">
                                            {realProd?.title || `Product Item #${pid}`}
                                        </h3>
                                        {props.showPrice !== false && (
                                            <div className="flex items-baseline space-x-2">
                                                <span className="text-base font-extrabold text-emerald-600">
                                                    ৳{effPrice.toLocaleString()}
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        ৳{regPrice.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Variants Pill Buttons */}
                                        {realProd?.variants && realProd.variants.length > 1 && (
                                            <div className="mt-2.5 pt-2 border-t border-gray-100">
                                                <div className="text-[10px] font-semibold text-gray-500 mb-1">ভ্যারিয়েন্ট:</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {realProd.variants.map((v) => (
                                                        <button
                                                            key={v.id}
                                                            type="button"
                                                            onClick={() => setSelectedVariantMap((prev) => ({ ...prev, [pid]: v.id }))}
                                                            className={`px-2 py-0.5 text-[10px] rounded border transition ${
                                                                activeVariantId === v.id
                                                                    ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {v.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Order Button */}
                                    <div className="mt-3.5 pt-2 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={(e) => isEditor && e.preventDefault()}
                                            className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            <span>{orderButtonText}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-gray-600">
                            <span className="font-bold text-gray-900">{count} products</span> included in this selector.
                        </div>
                        <a
                            href="#cod-checkout"
                            onClick={(e) => isEditor && e.preventDefault()}
                            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
                        >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            <span>Proceed to Checkout</span>
                        </a>
                    </div>
                </div>
            </section>
        );
    }

    const singleProd = availableProducts.find((p) => p.id === props.productId) || availableProducts[0];
    const singleFirstVar = singleProd?.variants?.[0];
    const singleEff = singleFirstVar?.sale_price ? Number(singleFirstVar.sale_price) : (singleProd?.sale_price ? Number(singleProd.sale_price) : 1450);
    const singleReg = singleFirstVar?.regular_price ? Number(singleFirstVar.regular_price) : (singleProd?.regular_price ? Number(singleProd.regular_price) : 1850);
    const singleImg = singleFirstVar?.images?.[0]?.url || singleProd?.primaryImage?.url || singleProd?.images?.[0]?.url;

    return (
        <section style={inlineStyles} className="w-full py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="bg-white rounded-2xl border-2 border-primary-500 shadow-xl overflow-hidden p-6 sm:p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        {/* Product Visual Container */}
                        <div className="w-full md:w-1/2 aspect-square bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-6 text-center overflow-hidden">
                            {singleImg ? (
                                <img src={singleImg} alt={singleProd?.title || 'Product'} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <div>
                                    <Package className="w-16 h-16 text-primary-400 mx-auto mb-3" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Product ID: #{props.productId || 'Active Product'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Product Meta */}
                        <div className="w-full md:w-1/2 space-y-4">
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                                <Tag className="w-3.5 h-3.5" />
                                <span>Verified Authentic - In Stock</span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                {singleProd?.title || 'Premium Product Selection'}
                            </h2>

                            {props.showDescription !== false && (
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {singleProd?.description || 'Select your preferred variants and proceed to our fast, 1-step Cash on Delivery checkout.'}
                                </p>
                            )}

                            {props.showPrice !== false && (
                                <div className="flex items-baseline space-x-3 pt-2">
                                    <span className="text-3xl font-extrabold text-primary-600">
                                        ৳{singleEff.toLocaleString()}
                                    </span>
                                    <span className="text-lg text-gray-400 line-through">
                                        ৳{singleReg.toLocaleString()}
                                    </span>
                                    {singleReg > singleEff && (
                                        <span className="text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md">
                                            SAVE ৳{(singleReg - singleEff).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Variants preview if any */}
                            {singleProd?.variants && singleProd.variants.length > 1 && (
                                <div className="pt-2">
                                    <div className="text-xs font-bold text-gray-700 mb-1.5">ভ্যারিয়েন্ট নির্বাচন করুন:</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {singleProd.variants.map((v, i) => (
                                            <span key={v.id} className={`px-2.5 py-1 text-xs rounded-lg border font-medium ${i === 0 ? 'bg-primary-50 border-primary-600 text-primary-900 font-bold' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                {v.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="button"
                                    onClick={(e) => isEditor && e.preventDefault()}
                                    className="w-full inline-flex items-center justify-center px-6 py-3.5 text-base font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-600/20 transition-all text-center"
                                >
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    <span>{orderButtonText}</span>
                                </button>
                            </div>

                            <div className="flex items-center space-x-4 pt-2 text-xs text-gray-500">
                                <span className="flex items-center">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                    Cash on Delivery
                                </span>
                                <span className="flex items-center">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                    Inspect Before Paying
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
