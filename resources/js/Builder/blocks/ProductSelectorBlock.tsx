import { Check, Eye, Layers, ShoppingBag, Tag, X } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { SafeImage } from '@/Shared/SafeImage';
import { useBuilderStore } from '../stores/useBuilderStore';
import type { Product } from '@/types';
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
    const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [quickViewSelectedImage, setQuickViewSelectedImage] = useState<string | null>(null);

    const inlineStyles: CSSProperties = {
        backgroundColor: styles.backgroundColor,
        background: styles.background,
        color: styles.color,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        borderRadius: styles.borderRadius,
        maxWidth: styles.maxWidth,
        boxShadow: styles.boxShadow,
        borderWidth: styles.borderWidth,
        borderStyle: styles.borderStyle,
        borderColor: styles.borderColor,
        textAlign: styles.textAlign,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
    };

    const buttonCustomStyle: CSSProperties = {
        backgroundColor: styles.buttonBgColor || undefined,
        color: styles.buttonTextColor || undefined,
    };
    const buttonPulseClass = styles.buttonPulseAnimation ? 'animate-pulse' : '';

    const productIds = props.productIds && props.productIds.length > 0
        ? props.productIds
        : (props.productId ? [props.productId] : []);

    const isMultiple = Boolean(productIds.length > 1);
    const orderButtonText = props.orderButtonText || 'অর্ডার করুন';
    const productBadges = props.productBadges || {};

    const handleOrderClick = (prod: Product | undefined, _pid?: number) => {
        if (!prod) return;

        // If product has multiple variants, open variant selection modal
        if (prod.variants && prod.variants.length > 1) {
            setVariantModalProduct(prod);
            return;
        }

        // Direct action for single/non-variant product
        if (!isEditor) {
            const checkoutEl = document.getElementById('cod-checkout');
            if (checkoutEl) {
                checkoutEl.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const confirmVariantOrder = (_prod?: Product) => {
        setVariantModalProduct(null);
        if (!isEditor) {
            const checkoutEl = document.getElementById('cod-checkout');
            if (checkoutEl) {
                checkoutEl.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    // Helper to collect all unique images for quick-view gallery
    const getProductGalleryImages = (prod: Product): string[] => {
        const urls: string[] = [];
        if (prod.primaryImage?.url) urls.push(prod.primaryImage.url);
        if (prod.primary_image?.url && !urls.includes(prod.primary_image.url)) urls.push(prod.primary_image.url);

        if (Array.isArray(prod.images)) {
            prod.images.forEach((img) => {
                if (img.url && !urls.includes(img.url)) urls.push(img.url);
            });
        }

        if (Array.isArray(prod.variants)) {
            prod.variants.forEach((v) => {
                if (Array.isArray(v.images)) {
                    v.images.forEach((img) => {
                        if (img.url && !urls.includes(img.url)) urls.push(img.url);
                    });
                }
            });
        }
        return urls;
    };

    if (isMultiple) {
        return (
            <section style={inlineStyles} className="w-full py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
                            Featured Products
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                            Select Your Preferred Product
                        </h2>
                    </div>

                    {/* Products Grid with Guaranteed Equal Height */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                        {productIds.map((pid, idx) => {
                            const realProd = availableProducts.find((p) => p.id === pid);
                            const hasVariants = Boolean(realProd?.variants && realProd.variants.length > 1);

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
                                    className="group/card relative rounded-2xl border border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 bg-white p-4 flex flex-col justify-between h-full"
                                >
                                    <div className="flex-1 flex flex-col">
                                        {/* Badges */}
                                        <div className="flex items-center justify-between pointer-events-none z-10 mb-2 min-h-[22px]">
                                            {cardBadge ? (
                                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-xs">
                                                    🔥 {cardBadge}
                                                </span>
                                            ) : <span />}

                                            {props.showDiscountBadge !== false && hasDiscount ? (
                                                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-extrabold">
                                                    {discountPct}% OFF
                                                </span>
                                            ) : null}
                                        </div>

                                        {/* Product Thumbnail with Blur Hover & Eye Quick-View Icon */}
                                        <div className="relative aspect-square w-full rounded-xl bg-gray-50 border border-gray-100 overflow-hidden mb-3.5 flex items-center justify-center group/img">
                                            <SafeImage
                                                src={imgUrl}
                                                alt={realProd?.title || `Product #${pid}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                                                fallbackIconSize="w-10 h-10"
                                                fallbackText="No Image"
                                            />

                                            {/* Translucent / Blurry hover overlay with Quick View button */}
                                            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (realProd) {
                                                            setQuickViewProduct(realProd);
                                                            setQuickViewSelectedImage(null);
                                                        }
                                                    }}
                                                    className="px-3.5 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-full shadow-md text-xs font-bold flex items-center space-x-1.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                                                >
                                                    <Eye className="w-4 h-4 text-emerald-600" />
                                                    <span>Quick View</span>
                                                </button>
                                            </div>

                                            {/* Variant indicator badge if product has variations */}
                                            {hasVariants && (
                                                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/75 text-white text-[9px] font-bold backdrop-blur-xs flex items-center space-x-1">
                                                    <Layers className="w-3 h-3 text-emerald-400" />
                                                    <span>{realProd?.variants?.length} Options</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Title (Guaranteed consistent height) */}
                                        <h3
                                            className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 min-h-[2.5rem] leading-snug"
                                            title={realProd?.title || `Product Item #${pid}`}
                                        >
                                            {realProd?.title || `Product Item #${pid}`}
                                        </h3>

                                        {/* Price */}
                                        {props.showPrice !== false && (
                                            <div className="flex items-baseline space-x-2 mb-2">
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

                                        {/* Optional Description */}
                                        {props.showDescription && realProd?.description && (
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                                                {realProd.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Order Button (Fixed at bottom) */}
                                    <div className="mt-auto pt-3 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOrderClick(realProd, pid);
                                            }}
                                            style={buttonCustomStyle}
                                            className={`w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${buttonPulseClass}`}
                                        >
                                            <ShoppingBag className="w-4 h-4" />
                                            <span>{orderButtonText}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 1. Variant Selection Modal */}
                {variantModalProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                        <div
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                                        Select Variation
                                    </span>
                                    <h4 className="text-sm font-bold text-gray-900 truncate max-w-[280px]">
                                        {variantModalProduct.title}
                                    </h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setVariantModalProduct(null)}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 space-y-4">
                                {(() => {
                                    const activeVarId = selectedVariantMap[variantModalProduct.id] || variantModalProduct.variants?.[0]?.id || 0;
                                    const activeVar = variantModalProduct.variants?.find((v) => v.id === activeVarId) || variantModalProduct.variants?.[0];

                                    const regP = activeVar ? Number(activeVar.regular_price) : Number(variantModalProduct.regular_price);
                                    const saleP = activeVar?.sale_price ? Number(activeVar.sale_price) : Number(variantModalProduct.sale_price);
                                    const effP = saleP || regP;
                                    const hasDisc = saleP && saleP < regP;
                                    const discPct = hasDisc && regP > 0 ? Math.round(((regP - saleP) / regP) * 100) : 0;
                                    const varImg = activeVar?.images?.[0]?.url || variantModalProduct.primaryImage?.url || variantModalProduct.images?.[0]?.url;

                                    return (
                                        <>
                                            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                                    <SafeImage
                                                        src={varImg}
                                                        alt={activeVar?.name || 'Variant'}
                                                        className="w-full h-full object-cover"
                                                        fallbackIconSize="w-6 h-6"
                                                        fallbackText="No Image"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-xs font-bold text-gray-900 block truncate">
                                                        Selected: {activeVar?.name}
                                                    </span>
                                                    <div className="flex items-baseline space-x-2 mt-0.5">
                                                        <span className="text-base font-extrabold text-emerald-600">
                                                            ৳{effP.toLocaleString()}
                                                        </span>
                                                        {hasDisc && (
                                                            <span className="text-xs text-gray-400 line-through">
                                                                ৳{regP.toLocaleString()}
                                                            </span>
                                                        )}
                                                        {hasDisc && (
                                                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                                                {discPct}% OFF
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Variant Options Swatches */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                                    ভ্যারিয়েন্ট বাছাই করুন (Choose Option):
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {variantModalProduct.variants.map((v) => {
                                                        const isSelected = activeVarId === v.id;
                                                        const vPrice = v.sale_price ? Number(v.sale_price) : Number(v.regular_price);
                                                        return (
                                                            <button
                                                                key={v.id}
                                                                type="button"
                                                                onClick={() => setSelectedVariantMap((prev) => ({ ...prev, [variantModalProduct.id]: v.id }))}
                                                                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                                                                    isSelected
                                                                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                                                                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                                                                }`}
                                                            >
                                                                <span className="text-xs truncate">{v.name}</span>
                                                                <span className="text-[11px] font-semibold text-emerald-700">৳{vPrice.toLocaleString()}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Confirm Button */}
                                            <div className="pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => confirmVariantOrder(variantModalProduct)}
                                                    style={buttonCustomStyle}
                                                    className={`w-full py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md transition flex items-center justify-center space-x-2 ${buttonPulseClass}`}
                                                >
                                                    <ShoppingBag className="w-4 h-4" />
                                                    <span>{orderButtonText}</span>
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Product Details & Image Gallery Quick-View Modal */}
                {quickViewProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                        <div
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 animate-in zoom-in-95 duration-200 p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => setQuickViewProduct(null)}
                                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {(() => {
                                const galleryImages = getProductGalleryImages(quickViewProduct);
                                const activeVarId = selectedVariantMap[quickViewProduct.id] || quickViewProduct.variants?.[0]?.id || 0;
                                const activeVar = quickViewProduct.variants?.find((v) => v.id === activeVarId) || quickViewProduct.variants?.[0];

                                const regP = activeVar ? Number(activeVar.regular_price) : Number(quickViewProduct.regular_price);
                                const saleP = activeVar?.sale_price ? Number(activeVar.sale_price) : Number(quickViewProduct.sale_price);
                                const effP = saleP || regP;
                                const hasDisc = saleP && saleP < regP;
                                const discPct = hasDisc && regP > 0 ? Math.round(((regP - saleP) / regP) * 100) : 0;

                                const currentMainImg = quickViewSelectedImage || activeVar?.images?.[0]?.url || galleryImages[0];

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        {/* Gallery View */}
                                        <div>
                                            <div className="aspect-square rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center mb-3">
                                                <SafeImage
                                                    src={currentMainImg}
                                                    alt={quickViewProduct.title}
                                                    className="w-full h-full object-cover"
                                                    fallbackIconSize="w-16 h-16"
                                                    fallbackText="No Image"
                                                />
                                            </div>

                                            {/* Thumbnail Strip */}
                                            {galleryImages.length > 1 && (
                                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                                    {galleryImages.map((img, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => setQuickViewSelectedImage(img)}
                                                            className={`w-14 h-14 rounded-lg overflow-hidden border shrink-0 transition cursor-pointer ${
                                                                currentMainImg === img
                                                                    ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                                                                    : 'border-gray-200 hover:border-gray-400 opacity-80'
                                                            }`}
                                                        >
                                                            <SafeImage
                                                                src={img}
                                                                alt={`Gallery ${i}`}
                                                                className="w-full h-full object-cover"
                                                                fallbackIconSize="w-5 h-5"
                                                                fallbackText=""
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details Meta */}
                                        <div className="space-y-4">
                                            <div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-1">
                                                    <Check className="w-3.5 h-3.5 mr-1" /> In Stock & Fast Shipping
                                                </span>
                                                <h3 className="text-xl font-bold text-gray-900 leading-snug">
                                                    {quickViewProduct.title}
                                                </h3>
                                            </div>

                                            {/* Pricing */}
                                            <div className="flex items-baseline space-x-3 pt-1">
                                                <span className="text-2xl font-black text-emerald-600">
                                                    ৳{effP.toLocaleString()}
                                                </span>
                                                {hasDisc && (
                                                    <span className="text-sm text-gray-400 line-through">
                                                        ৳{regP.toLocaleString()}
                                                    </span>
                                                )}
                                                {hasDisc && (
                                                    <span className="text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md">
                                                        SAVE {discPct}%
                                                    </span>
                                                )}
                                            </div>

                                            {/* Variations */}
                                            {quickViewProduct.variants && quickViewProduct.variants.length > 1 && (
                                                <div className="pt-2 border-t border-gray-100">
                                                    <span className="text-xs font-bold text-gray-700 block mb-2">
                                                        Available Variations:
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {quickViewProduct.variants.map((v) => (
                                                            <button
                                                                key={v.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedVariantMap((prev) => ({ ...prev, [quickViewProduct.id]: v.id }));
                                                                    if (v.images?.[0]?.url) {
                                                                        setQuickViewSelectedImage(v.images[0].url);
                                                                    } else {
                                                                        setQuickViewSelectedImage(quickViewProduct.primaryImage?.url || quickViewProduct.images?.[0]?.url || null);
                                                                    }
                                                                }}
                                                                className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition ${
                                                                    activeVarId === v.id
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

                                            {/* Description */}
                                            {quickViewProduct.description && (
                                                <div className="pt-2 border-t border-gray-100">
                                                    <span className="text-xs font-bold text-gray-700 block mb-1">
                                                        Product Description:
                                                    </span>
                                                    <p className="text-xs text-gray-600 leading-relaxed max-h-36 overflow-y-auto pr-1">
                                                        {quickViewProduct.description}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Action Button */}
                                            <div className="pt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setQuickViewProduct(null);
                                                        confirmVariantOrder(quickViewProduct);
                                                    }}
                                                    style={buttonCustomStyle}
                                                    className={`w-full py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center justify-center space-x-2 ${buttonPulseClass}`}
                                                >
                                                    <ShoppingBag className="w-4 h-4" />
                                                    <span>{orderButtonText}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </section>
        );
    }

    // Single Product Showcase
    const singleProd = availableProducts.find((p) => p.id === props.productId) || availableProducts[0];
    const singleFirstVar = singleProd?.variants?.[0];
    const singleEff = singleFirstVar?.sale_price ? Number(singleFirstVar.sale_price) : (singleProd?.sale_price ? Number(singleProd.sale_price) : 1450);
    const singleReg = singleFirstVar?.regular_price ? Number(singleFirstVar.regular_price) : (singleProd?.regular_price ? Number(singleProd.regular_price) : 1850);
    const singleImg = singleFirstVar?.images?.[0]?.url || singleProd?.primaryImage?.url || singleProd?.images?.[0]?.url;

    return (
        <section style={inlineStyles} className="w-full py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden p-6 sm:p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        {/* Product Visual Container with Hover Quick View */}
                        <div className="w-full md:w-1/2 aspect-square bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-4 text-center overflow-hidden relative group/single">
                            <SafeImage
                                src={singleImg}
                                alt={singleProd?.title || 'Product'}
                                className="w-full h-full object-cover rounded-lg"
                                fallbackIconSize="w-16 h-16"
                                fallbackText="No Image Available"
                            />

                            {singleProd && (
                                <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] opacity-0 group-hover/single:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setQuickViewProduct(singleProd);
                                            setQuickViewSelectedImage(null);
                                        }}
                                        className="px-3.5 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-full shadow-md text-xs font-bold flex items-center space-x-1.5 transition-transform hover:scale-105 active:scale-95"
                                    >
                                        <Eye className="w-4 h-4 text-emerald-600" />
                                        <span>Quick View</span>
                                    </button>
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
                                    <span className="text-3xl font-extrabold text-emerald-600">
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
                                            <span key={v.id} className={`px-2.5 py-1 text-xs rounded-lg border font-medium ${i === 0 ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                {v.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="button"
                                    onClick={() => handleOrderClick(singleProd, singleProd?.id || 0)}
                                    style={buttonCustomStyle}
                                    className={`w-full inline-flex items-center justify-center px-6 py-3.5 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all text-center cursor-pointer ${buttonPulseClass}`}
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
