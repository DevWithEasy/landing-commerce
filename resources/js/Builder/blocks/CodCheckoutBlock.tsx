import { CheckCircle2, MapPin, Minus, Phone, Plus, ShieldCheck, ShoppingCart, User } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { SafeImage } from '@/Shared/SafeImage';
import { useBuilderStore } from '../stores/useBuilderStore';
import type { BlockStyles, CodCheckoutBlockProps } from '@/types/builder';
import {
    COD_CHECKOUT_STATIC_CSS,
    buildCheckoutCssVariables,
    safeCheckoutCss,
} from './codCheckoutDesign';

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
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [selectedShipping, setSelectedShipping] = useState<'inside' | 'outside'>('inside');

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

    const getQty = (pid: number) => quantities[pid] ?? 1;
    const updateQty = (pid: number, delta: number) => {
        setQuantities((prev) => ({
            ...prev,
            [pid]: Math.max(1, (prev[pid] ?? 1) + delta),
        }));
    };

    const accentColor = safeCheckoutCss(props.accentColor || props.highlightColor) || '#059669';
    const requiredMarkColor = safeCheckoutCss(props.requiredMarkColor) || '#f43f5e';

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
        minHeight: styles.minHeight,
        boxShadow: styles.boxShadow,
        borderWidth: styles.borderWidth,
        borderStyle: styles.borderStyle,
        borderColor: styles.borderColor,
        textAlign: styles.textAlign,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
    };

    const sectionStyle: CSSProperties = {
        ...inlineStyles,
        fontFamily: safeCheckoutCss(props.fontFamily),
        ...buildCheckoutCssVariables(props),
    };

    const rawContainerMaxWidth = safeCheckoutCss(props.containerMaxWidth);
    const containerStyle: CSSProperties = {
        maxWidth:
            rawContainerMaxWidth && rawContainerMaxWidth !== '672px'
                ? rawContainerMaxWidth
                : '1080px',
        paddingTop: safeCheckoutCss(props.containerPaddingX) || '16px',
        paddingBottom: safeCheckoutCss(props.containerPaddingX) || '16px',
        paddingLeft: safeCheckoutCss(props.containerPaddingX) || '16px',
        paddingRight: safeCheckoutCss(props.containerPaddingX) || '16px',
    };

    const cardStyle: CSSProperties = {
        backgroundColor: safeCheckoutCss(props.cardBgColor) || '#ffffff',
        borderColor: safeCheckoutCss(props.cardBorderColor) || '#10b981',
        borderWidth: safeCheckoutCss(props.cardBorderWidth) || '2px',
        borderStyle: props.cardBorderStyle || 'solid',
        borderRadius: safeCheckoutCss(props.cardBorderRadius) || '24px',
        minHeight: safeCheckoutCss(props.cardMinHeight),
        paddingTop: safeCheckoutCss(props.cardPaddingTop) || '32px',
        paddingBottom: safeCheckoutCss(props.cardPaddingBottom) || '32px',
        paddingLeft: safeCheckoutCss(props.cardPaddingLeft) || '32px',
        paddingRight: safeCheckoutCss(props.cardPaddingRight) || '32px',
        boxShadow: safeCheckoutCss(props.cardShadow) || '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    };

    const headerStyle: CSSProperties = {
        textAlign: props.headerAlign || 'center',
        paddingTop: safeCheckoutCss(props.headerPaddingTop) || '0px',
        paddingBottom: safeCheckoutCss(props.headerPaddingBottom) || '24px',
        borderBottomWidth: safeCheckoutCss(props.headerBorderWidth) || '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: safeCheckoutCss(props.headerBorderColor) || '#f1f5f9',
    };

    const badgeStyle: CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: `${safeCheckoutCss(props.badgePaddingY) || '4px'} ${safeCheckoutCss(props.badgePaddingX) || '12px'}`,
        borderRadius: safeCheckoutCss(props.badgeBorderRadius) || '9999px',
        backgroundColor: safeCheckoutCss(props.badgeBgColor) || '#d1fae5',
        color: safeCheckoutCss(props.badgeTextColor) || '#065f46',
        fontSize: safeCheckoutCss(props.badgeFontSize) || '11px',
        fontWeight: safeCheckoutCss(props.badgeFontWeight) || '700',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        marginBottom: '8px',
    };

    const titleStyle: CSSProperties = {
        color: safeCheckoutCss(props.titleColor) || '#0f172a',
        fontSize: safeCheckoutCss(props.titleFontSize) || '30px',
        fontWeight: safeCheckoutCss(props.titleFontWeight) || '800',
        lineHeight: safeCheckoutCss(props.titleLineHeight) || '1.2',
        letterSpacing: safeCheckoutCss(props.titleLetterSpacing),
        margin: 0,
        marginBottom: safeCheckoutCss(props.titleMarginBottom) || '4px',
    };

    const subtitleStyle: CSSProperties = {
        color: safeCheckoutCss(props.subtitleColor) || '#64748b',
        fontSize: safeCheckoutCss(props.subtitleFontSize) || '13px',
        lineHeight: safeCheckoutCss(props.subtitleLineHeight) || '1.5',
        letterSpacing: safeCheckoutCss(props.subtitleLetterSpacing),
        margin: 0,
    };

    const productPanelStyle: CSSProperties = {
        backgroundColor: safeCheckoutCss(props.productPanelBgColor) || '#f8fafc',
        borderColor: safeCheckoutCss(props.productPanelBorderColor) || '#e2e8f0',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: safeCheckoutCss(props.productPanelBorderRadius) || '12px',
        padding: safeCheckoutCss(props.productPanelPadding) || '12px',
    };

    const productCardStyle: CSSProperties = {
        backgroundColor: safeCheckoutCss(props.productCardBgColor) || '#ffffff',
        borderColor: safeCheckoutCss(props.productCardBorderColor) || '#e2e8f0',
        borderWidth: safeCheckoutCss(props.productCardBorderWidth) || '1px',
        borderStyle: 'solid',
        borderRadius: safeCheckoutCss(props.productCardBorderRadius) || '12px',
        padding: safeCheckoutCss(props.productCardPadding) || '10px',
    };

    const productThumbStyle: CSSProperties = {
        width: safeCheckoutCss(props.productImageSize) || '40px',
        height: safeCheckoutCss(props.productImageSize) || '40px',
        borderRadius: safeCheckoutCss(props.productImageRadius) || '8px',
    };

    const productTitleStyle: CSSProperties = {
        color: safeCheckoutCss(props.productTitleColor) || '#0f172a',
        fontSize: safeCheckoutCss(props.productTitleFontSize) || '12px',
        fontWeight: safeCheckoutCss(props.productTitleFontWeight) || '700',
    };

    const productInfoStyle: CSSProperties = {
        color: safeCheckoutCss(props.productInfoTextColor) || '#64748b',
        fontSize: safeCheckoutCss(props.productInfoFontSize) || '10px',
    };

    const productPriceStyle: CSSProperties = {
        color: safeCheckoutCss(props.productPriceColor) || accentColor,
        fontSize: safeCheckoutCss(props.productPriceFontSize) || '14px',
    };

    const productBadgeStyle: CSSProperties = {
        backgroundColor: safeCheckoutCss(props.productBadgeBgColor) || '#fef3c7',
        color: safeCheckoutCss(props.productBadgeTextColor) || '#92400e',
        borderRadius: safeCheckoutCss(props.productBadgeBorderRadius) || '9999px',
        fontSize: safeCheckoutCss(props.productBadgeFontSize) || '9px',
    };

    const labelStyle: CSSProperties = {
        display: 'block',
        color: safeCheckoutCss(props.labelColor) || '#334155',
        fontSize: safeCheckoutCss(props.labelFontSize) || '11px',
        fontWeight: safeCheckoutCss(props.labelFontWeight) || '700',
        lineHeight: safeCheckoutCss(props.labelLineHeight) || '1.35',
        letterSpacing: safeCheckoutCss(props.labelLetterSpacing) || '0.05em',
        textTransform: props.labelTextTransform || 'uppercase',
        marginBottom: safeCheckoutCss(props.labelMarginBottom) || '4px',
    };

    const inputHorizontalPadding = safeCheckoutCss(props.inputPaddingX) || '12px';
    const inputStyle: CSSProperties = {
        width: '100%',
        backgroundColor: safeCheckoutCss(props.inputBgColor) || '#ffffff',
        color: safeCheckoutCss(props.inputTextColor) || '#0f172a',
        borderColor: safeCheckoutCss(props.inputBorderColor) || '#cbd5e1',
        borderWidth: safeCheckoutCss(props.inputBorderWidth) || '1px',
        borderStyle: 'solid',
        borderRadius: safeCheckoutCss(props.inputBorderRadius) || '12px',
        paddingTop: safeCheckoutCss(props.inputPaddingY) || '10px',
        paddingBottom: safeCheckoutCss(props.inputPaddingY) || '10px',
        paddingLeft: `calc(${inputHorizontalPadding} + 24px)`,
        paddingRight: inputHorizontalPadding,
        fontSize: safeCheckoutCss(props.inputFontSize) || '14px',
        fontWeight: safeCheckoutCss(props.inputFontWeight) || '400',
        minHeight: safeCheckoutCss(props.inputMinHeight),
        fontFamily: 'inherit',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    };

    const inputIconStyle: CSSProperties = {
        color: safeCheckoutCss(props.inputIconColor) || '#94a3b8',
    };

    const shippingStyle: CSSProperties = {
        width: '100%',
        backgroundColor: safeCheckoutCss(props.shippingBgColor) || '#ecfdf5',
        color: safeCheckoutCss(props.shippingTextColor) || '#0f172a',
        borderColor: safeCheckoutCss(props.shippingBorderColor) || '#10b981',
        borderWidth: safeCheckoutCss(props.shippingBorderWidth) || '2px',
        borderStyle: 'solid',
        borderRadius: safeCheckoutCss(props.shippingBorderRadius) || '12px',
        padding: safeCheckoutCss(props.shippingPadding) || '10px',
        fontSize: safeCheckoutCss(props.shippingFontSize) || '14px',
        fontWeight: safeCheckoutCss(props.shippingFontWeight) || '600',
        fontFamily: 'inherit',
    };

    const summaryStyle: CSSProperties = {
        backgroundColor: safeCheckoutCss(props.summaryBgColor) || '#f8fafc',
        borderColor: safeCheckoutCss(props.summaryBorderColor) || '#e2e8f0',
        borderWidth: safeCheckoutCss(props.summaryBorderWidth) || '1px',
        borderStyle: 'solid',
        borderRadius: safeCheckoutCss(props.summaryBorderRadius) || '12px',
        padding: safeCheckoutCss(props.summaryPadding) || '16px',
        color: safeCheckoutCss(props.summaryTextColor) || '#475569',
        fontSize: safeCheckoutCss(props.summaryFontSize) || '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: safeCheckoutCss(props.summaryRowGap) || '8px',
    };

    const summaryValueStyle: CSSProperties = {
        color: safeCheckoutCss(props.summaryValueColor) || '#1e293b',
    };

    const summaryTotalStyle: CSSProperties = {
        color: safeCheckoutCss(props.summaryTotalColor) || accentColor,
        fontSize: safeCheckoutCss(props.summaryTotalFontSize) || '18px',
    };

    const buttonStyle: CSSProperties = {
        width: props.buttonWidth === 'auto' ? 'auto' : '100%',
        backgroundColor:
            safeCheckoutCss(props.buttonBgColor) ||
            safeCheckoutCss(styles.buttonBgColor) ||
            '#059669',
        color:
            safeCheckoutCss(props.buttonTextColor) ||
            safeCheckoutCss(styles.buttonTextColor) ||
            '#ffffff',
        borderRadius: safeCheckoutCss(props.buttonBorderRadius) || '12px',
        borderWidth: safeCheckoutCss(props.buttonBorderWidth) || '0px',
        borderStyle: 'solid',
        borderColor: safeCheckoutCss(props.buttonBorderColor) || safeCheckoutCss(props.buttonBgColor) || '#059669',
        minHeight: safeCheckoutCss(props.buttonMinHeight),
        paddingTop: safeCheckoutCss(props.buttonPaddingY) || '16px',
        paddingBottom: safeCheckoutCss(props.buttonPaddingY) || '16px',
        paddingLeft: safeCheckoutCss(props.buttonPaddingX) || '24px',
        paddingRight: safeCheckoutCss(props.buttonPaddingX) || '24px',
        fontSize: safeCheckoutCss(props.buttonFontSize) || '16px',
        fontWeight: safeCheckoutCss(props.buttonFontWeight) || '800',
        boxShadow:
            safeCheckoutCss(props.buttonShadow) ||
            '0 20px 25px -5px rgb(5 150 105 / 0.3)',
        textTransform: props.buttonTextTransform || 'none',
        letterSpacing: safeCheckoutCss(props.buttonLetterSpacing) || '0px',
        transition: 'background-color 0.15s ease, transform 0.15s ease',
    };
    const buttonPulseClass = styles.buttonPulseAnimation ? 'animate-pulse' : '';

    const trustRowStyle: CSSProperties = {
        paddingTop: safeCheckoutCss(props.trustPaddingTop) || '8px',
        color: safeCheckoutCss(props.trustTextColor) || '#64748b',
        fontSize: safeCheckoutCss(props.trustFontSize) || '11px',
        fontWeight: safeCheckoutCss(props.trustFontWeight) || '400',
        gap: safeCheckoutCss(props.trustGap) || '16px',
    };

    const trustIconStyle: CSSProperties = {
        width: safeCheckoutCss(props.trustIconSize) || '14px',
        height: safeCheckoutCss(props.trustIconSize) || '14px',
        marginRight: '4px',
        color: safeCheckoutCss(props.trustIconColor) || accentColor,
    };

    const nameLabel = props.nameLabel || 'আপনার নাম (Your Name)';
    const namePlaceholder = props.namePlaceholder || 'আপনার পুরো নাম লিখুন...';
    const phoneLabel = props.phoneLabel || 'মোবাইল নাম্বার (Mobile Number)';
    const phonePlaceholder = props.phonePlaceholder || '01XXXXXXXXX (১১ ডিজিট)';
    const addressLabel = props.addressLabel || 'সম্পূর্ণ ডেলিভারি ঠিকানা (Full Address)';
    const addressPlaceholder = props.addressPlaceholder || 'বাসা/হোল্ডিং নং, রোড নং, এলাকা, থানা ও জেলা...';
    const shippingLabel = props.shippingLabel || 'শিপিং মেথড (Shipping Method)';
    const buttonText = props.buttonText || 'অর্ডার কনফার্ম করুন — ক্যাশ অন ডেলিভারি';
    const headerBadgeText = props.headerBadgeText || 'Fast & Secure Checkout';
    const headerTitle = props.headerTitle || 'Cash On Delivery Available Nationwide';
    const headerSubtitle =
        props.headerSubtitle || 'Pay in cash only after receiving and inspecting your parcel.';
    const trustText1 = props.trustText1 || '১০০% ক্যাশ অন ডেলিভারি';
    const trustText2 = props.trustText2 || 'প্রোডাক্ট দেখে মূল্য পরিশোধ';
    const productBadges = props.productBadges || {};
    const showRequiredMark = props.showRequiredMark !== false;

    const selectedOrderItems = selectedProductIds.map((pid) => {
        const realProd = availableProducts.find((p) => p.id === pid);
        const activeVariantId = selectedVariantMap[pid] || realProd?.variants?.[0]?.id || 0;
        const activeVariant =
            realProd?.variants?.find((v) => v.id === activeVariantId) || realProd?.variants?.[0];
        const regPrice = activeVariant
            ? Number(activeVariant.regular_price)
            : realProd
              ? Number(realProd.regular_price)
              : 1500;
        const salePrice = activeVariant?.sale_price
            ? Number(activeVariant.sale_price)
            : realProd?.sale_price
              ? Number(realProd.sale_price)
              : 1250;
        const effPrice = salePrice || regPrice;
        const imgUrl =
            activeVariant?.images?.[0]?.url ||
            realProd?.primaryImage?.url ||
            realProd?.images?.[0]?.url;
        const qty = getQty(pid);

        return {
            pid,
            title: realProd?.title || `Product #${pid}`,
            imgUrl,
            unitPrice: effPrice,
            qty,
            lineTotal: effPrice * qty,
        };
    });

    const itemsSubtotal = selectedOrderItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingFee = selectedShipping === 'inside' ? 70 : 130;
    const grandTotal = itemsSubtotal + shippingFee;

    return (
        <section id="cod-checkout" style={sectionStyle} data-lc-el="section" className="w-full">
            <style>{COD_CHECKOUT_STATIC_CSS}</style>
            <div style={containerStyle} className="mx-auto">
                <div style={cardStyle} data-lc-el="card">
                    {(props.showHeader !== false) && (
                        <div style={headerStyle} data-lc-el="header">
                            {(props.showHeaderBadge !== false) && (
                                <div style={badgeStyle}>
                                    <ShieldCheck className="w-4 h-4" style={{ color: accentColor }} />
                                    <span>{headerBadgeText}</span>
                                </div>
                            )}
                            {(props.showHeaderTitle !== false) && (
                                <h2 style={titleStyle} data-lc-el="title">
                                    {headerTitle}
                                </h2>
                            )}
                            {(props.showHeaderSubtitle !== false) && (
                                <p style={subtitleStyle} data-lc-el="subtitle">
                                    {headerSubtitle}
                                </p>
                            )}
                        </div>
                    )}

                    <div
                        style={{
                            paddingTop: safeCheckoutCss(props.bodyPaddingTop) || '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: safeCheckoutCss(props.fieldGap) || '24px',
                        }}
                    >
                        {/* Top Full-Width Products Selector */}
                        {productIds.length > 0 && props.showProductSelector !== false && (
                            <div style={productPanelStyle}>
                                <div
                                    className="flex items-center justify-between"
                                    style={{
                                        marginBottom: '10px',
                                        color: safeCheckoutCss(props.productPanelTitleColor) || '#0f172a',
                                        fontSize: '15px',
                                        fontWeight: 700,
                                    }}
                                >
                                    <span>Your Products</span>
                                    <span className="text-xs font-semibold" style={{ color: accentColor }}>
                                        {props.selectionMode === 'multiple'
                                            ? 'Multiple Selection'
                                            : 'Select Product'}
                                    </span>
                                </div>
                                <div
                                    className="flex flex-col"
                                    style={{
                                        gap: safeCheckoutCss(props.productCardGap) || '8px',
                                    }}
                                >
                                    {productIds.map((pid, idx) => {
                                        const realProd = availableProducts.find((p) => p.id === pid);
                                        const isSelected = selectedProductIds.includes(pid);
                                        const qty = getQty(pid);

                                        const activeVariantId =
                                            selectedVariantMap[pid] || realProd?.variants?.[0]?.id || 0;
                                        const activeVariant =
                                            realProd?.variants?.find((v) => v.id === activeVariantId) ||
                                            realProd?.variants?.[0];

                                        const regPrice = activeVariant
                                            ? Number(activeVariant.regular_price)
                                            : realProd
                                              ? Number(realProd.regular_price)
                                              : 1500;
                                        const salePrice = activeVariant?.sale_price
                                            ? Number(activeVariant.sale_price)
                                            : realProd?.sale_price
                                              ? Number(realProd.sale_price)
                                              : 1250;
                                        const effPrice = salePrice || regPrice;
                                        const hasDiscount = salePrice && salePrice < regPrice;
                                        const discountPct =
                                            hasDiscount && regPrice > 0
                                                ? Math.round(((regPrice - salePrice) / regPrice) * 100)
                                                : 0;

                                        const imgUrl =
                                            activeVariant?.images?.[0]?.url ||
                                            realProd?.primaryImage?.url ||
                                            realProd?.images?.[0]?.url;
                                        const customBadge =
                                            productBadges[pid] || (idx === 0 ? props.badgeText : '');

                                        return (
                                            <div
                                                key={pid}
                                                onClick={() => handleToggleProduct(pid)}
                                                data-lc-el="product-card"
                                                style={{
                                                    ...productCardStyle,
                                                    ...(isSelected
                                                        ? {
                                                              backgroundColor:
                                                                  safeCheckoutCss(
                                                                      props.productCardSelectedBgColor
                                                                  ) || '#ecfdf5',
                                                              borderColor:
                                                                  safeCheckoutCss(
                                                                      props.productCardSelectedBorderColor
                                                                  ) || accentColor,
                                                              borderWidth:
                                                                  safeCheckoutCss(
                                                                      props.productCardSelectedBorderWidth
                                                                  ) || '2px',
                                                          }
                                                        : {}),
                                                }}
                                                className={`cod-product-card ${
                                                    isSelected ? 'cod-card-selected' : ''
                                                } flex cursor-pointer select-none flex-col`}
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div className="flex min-w-0 flex-1 items-center space-x-2.5">
                                                        <span
                                                            className={`flex ${
                                                                props.selectionMode === 'multiple'
                                                                    ? 'rounded'
                                                                    : 'rounded-full'
                                                            } h-4 w-4 shrink-0 items-center justify-center border text-[10px] font-bold`}
                                                            style={{
                                                                backgroundColor: isSelected
                                                                    ? accentColor
                                                                    : '#ffffff',
                                                                borderColor: isSelected
                                                                    ? accentColor
                                                                    : '#cbd5e1',
                                                                color: '#ffffff',
                                                            }}
                                                        >
                                                            {isSelected ? '✓' : ''}
                                                        </span>
                                                        <div
                                                            className="flex shrink-0 items-center justify-center overflow-hidden border border-gray-200 bg-gray-100"
                                                            style={productThumbStyle}
                                                        >
                                                            <SafeImage
                                                                src={imgUrl}
                                                                alt={realProd?.title || `Product #${pid}`}
                                                                className="h-full w-full"
                                                                style={{
                                                                    objectFit:
                                                                        props.productImageFit ===
                                                                        'contain'
                                                                            ? 'contain'
                                                                            : 'cover',
                                                                }}
                                                                fallbackIconSize="w-5 h-5"
                                                                fallbackText=""
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center space-x-1.5">
                                                                <span
                                                                    className="truncate font-bold"
                                                                    style={productTitleStyle}
                                                                >
                                                                    {realProd?.title || `Product #${pid}`}
                                                                </span>
                                                                {customBadge && (
                                                                    <span
                                                                        className="shrink-0 border px-1.5 py-0.5 font-extrabold"
                                                                        style={productBadgeStyle}
                                                                    >
                                                                        {customBadge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span
                                                                className="block"
                                                                style={productInfoStyle}
                                                            >
                                                                {realProd
                                                                    ? 'In Stock & Verified'
                                                                    : 'Placeholder Preview'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Quantity Stepper (desktop inline, compact on mobile) */}
                                                    <div
                                                        className="flex items-center rounded-md border border-slate-200 bg-white"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQty(pid, -1)}
                                                            className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                                                            aria-label="Decrease quantity"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="min-w-[26px] text-center text-xs font-bold text-slate-800">
                                                            {qty}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQty(pid, 1)}
                                                            className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                                                            aria-label="Increase quantity"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>

                                                    <div className="shrink-0 pl-2 text-right min-w-[74px]">
                                                        <div
                                                            className="font-extrabold"
                                                            style={productPriceStyle}
                                                        >
                                                            ৳{(effPrice * qty).toLocaleString()}
                                                        </div>
                                                        <div className="flex items-center justify-end space-x-1">
                                                            {hasDiscount && (
                                                                <span
                                                                    className="text-[10px] line-through"
                                                                    style={{
                                                                        color:
                                                                            safeCheckoutCss(
                                                                                props.productOldPriceColor
                                                                            ) || '#94a3b8',
                                                                    }}
                                                                >
                                                                    ৳{regPrice.toLocaleString()}
                                                                </span>
                                                            )}
                                                            {props.showDiscountBadge !== false &&
                                                                hasDiscount && (
                                                                    <span className="rounded bg-rose-50 px-1 text-[9px] font-bold text-rose-600">
                                                                        {discountPct}% OFF
                                                                    </span>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Variants are shown only for the selected product. */}
                                                {isSelected &&
                                                    props.showVariants !== false &&
                                                    realProd?.variants &&
                                                    realProd.variants.length > 1 && (
                                                        <div
                                                            className="mt-2 flex flex-wrap items-center gap-1 border-t border-gray-100 pt-1.5"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <span
                                                                className="text-[9px] font-bold uppercase"
                                                                style={{
                                                                    color:
                                                                        safeCheckoutCss(
                                                                            props.variantTextColor
                                                                        ) || '#64748b',
                                                                }}
                                                            >
                                                                Variant:
                                                            </span>
                                                            {realProd.variants.map((v) => {
                                                                const isActive =
                                                                    activeVariantId === v.id;
                                                                return (
                                                                    <button
                                                                        key={v.id}
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedVariantMap(
                                                                                (prev) => ({
                                                                                    ...prev,
                                                                                    [pid]: v.id,
                                                                                })
                                                                            );
                                                                        }}
                                                                        className="border font-medium transition"
                                                                        style={{
                                                                            backgroundColor: isActive
                                                                                ? safeCheckoutCss(
                                                                                      props.variantSelectedBgColor
                                                                                  ) || accentColor
                                                                                : safeCheckoutCss(
                                                                                      props.variantBgColor
                                                                                  ) || '#ffffff',
                                                                            color: isActive
                                                                                ? safeCheckoutCss(
                                                                                      props.variantSelectedTextColor
                                                                                  ) || '#ffffff'
                                                                                : safeCheckoutCss(
                                                                                      props.variantTextColor
                                                                                  ) || '#334155',
                                                                            borderColor: isActive
                                                                                ? safeCheckoutCss(
                                                                                      props.variantSelectedBorderColor
                                                                                  ) || accentColor
                                                                                : safeCheckoutCss(
                                                                                      props.variantBorderColor
                                                                                  ) || '#e2e8f0',
                                                                            borderRadius:
                                                                                safeCheckoutCss(
                                                                                    props.variantBorderRadius
                                                                                ) || '6px',
                                                                            fontSize:
                                                                                safeCheckoutCss(
                                                                                    props.variantFontSize
                                                                                ) || '10px',
                                                                            padding: '2px 8px',
                                                                            fontWeight: isActive
                                                                                ? 700
                                                                                : 500,
                                                                        }}
                                                                    >
                                                                        {v.name}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Bottom 2-Column Layout on PC (Mobile stays single-column) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                            {/* Left Column: Billing Details & Shipping */}
                            <div className="lg:col-span-6 space-y-4">
                                <h3 className="text-base font-bold text-slate-900">
                                    Billing details
                                </h3>

                                {/* 1. Customer Name */}
                                <div>
                                    <label style={labelStyle} data-lc-el="label">
                                        {nameLabel}{' '}
                                        {showRequiredMark && (
                                            <span style={{ color: requiredMarkColor }}>*</span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <User
                                            className="absolute left-3 top-3 h-4 w-4"
                                            style={inputIconStyle}
                                        />
                                        <input
                                            type="text"
                                            disabled={isEditor}
                                            placeholder={namePlaceholder}
                                            data-lc-el="input"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                {/* 2. Detailed Address */}
                                <div>
                                    <label style={labelStyle} data-lc-el="label">
                                        {addressLabel}{' '}
                                        {showRequiredMark && (
                                            <span style={{ color: requiredMarkColor }}>*</span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <MapPin
                                            className="absolute left-3 top-3 h-4 w-4"
                                            style={inputIconStyle}
                                        />
                                        <textarea
                                            rows={2}
                                            disabled={isEditor}
                                            placeholder={addressPlaceholder}
                                            data-lc-el="input"
                                            style={{
                                                ...inputStyle,
                                                paddingTop: '8px',
                                                paddingBottom: '8px',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* 3. Customer Phone */}
                                <div>
                                    <label style={labelStyle} data-lc-el="label">
                                        {phoneLabel}{' '}
                                        {showRequiredMark && (
                                            <span style={{ color: requiredMarkColor }}>*</span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <Phone
                                            className="absolute left-3 top-3 h-4 w-4"
                                            style={inputIconStyle}
                                        />
                                        <input
                                            type="tel"
                                            disabled={isEditor}
                                            placeholder={phonePlaceholder}
                                            data-lc-el="input"
                                            style={{ ...inputStyle, fontFamily: 'monospace' }}
                                        />
                                    </div>
                                </div>

                                {/* 4. Shipping Method */}
                                <div className="pt-2">
                                    <h3 className="text-base font-bold text-slate-900 mb-2.5">
                                        {shippingLabel}
                                    </h3>
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedShipping('inside')}
                                            style={
                                                selectedShipping === 'inside'
                                                    ? shippingStyle
                                                    : {
                                                          ...shippingStyle,
                                                          backgroundColor: '#ffffff',
                                                          borderColor: '#e2e8f0',
                                                          borderWidth: '1px',
                                                      }
                                            }
                                            className="flex w-full items-center justify-between text-left transition"
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <span
                                                    className="h-4 w-4 rounded-full border-2 flex items-center justify-center"
                                                    style={{
                                                        borderColor:
                                                            selectedShipping === 'inside'
                                                                ? accentColor
                                                                : '#cbd5e1',
                                                    }}
                                                >
                                                    {selectedShipping === 'inside' && (
                                                        <span
                                                            className="h-2 w-2 rounded-full"
                                                            style={{ backgroundColor: accentColor }}
                                                        />
                                                    )}
                                                </span>
                                                <span>ঢাকার ভিতরে (Inside Dhaka)</span>
                                            </span>
                                            <span className="font-bold">৳70</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSelectedShipping('outside')}
                                            style={
                                                selectedShipping === 'outside'
                                                    ? shippingStyle
                                                    : {
                                                          ...shippingStyle,
                                                          backgroundColor: '#ffffff',
                                                          borderColor: '#e2e8f0',
                                                          borderWidth: '1px',
                                                      }
                                            }
                                            className="flex w-full items-center justify-between text-left transition"
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <span
                                                    className="h-4 w-4 rounded-full border-2 flex items-center justify-center"
                                                    style={{
                                                        borderColor:
                                                            selectedShipping === 'outside'
                                                                ? accentColor
                                                                : '#cbd5e1',
                                                    }}
                                                >
                                                    {selectedShipping === 'outside' && (
                                                        <span
                                                            className="h-2 w-2 rounded-full"
                                                            style={{ backgroundColor: accentColor }}
                                                        />
                                                    )}
                                                </span>
                                                <span>ঢাকার বাইরে (Outside Dhaka)</span>
                                            </span>
                                            <span className="font-bold">৳130</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Your Order Summary, Payment Method & Submit */}
                            <div className="lg:col-span-6 space-y-4">
                                <h3 className="text-base font-bold text-slate-900">
                                    Your order
                                </h3>

                                {/* Live Summary */}
                                {props.showSummary !== false && (
                                    <div style={summaryStyle} data-lc-el="summary">
                                        <div className="flex justify-between pb-2 border-b border-slate-200 font-bold text-slate-700">
                                            <span>Product</span>
                                            <span>Subtotal</span>
                                        </div>

                                        {selectedOrderItems.length > 0 ? (
                                            <div className="space-y-2 py-1 border-b border-slate-200">
                                                {selectedOrderItems.map((item) => (
                                                    <div
                                                        key={item.pid}
                                                        className="flex items-center justify-between gap-2"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="h-8 w-8 rounded border border-slate-200 bg-white overflow-hidden shrink-0">
                                                                <SafeImage
                                                                    src={item.imgUrl}
                                                                    alt={item.title}
                                                                    className="h-full w-full object-cover"
                                                                    fallbackIconSize="w-4 h-4"
                                                                    fallbackText=""
                                                                />
                                                            </div>
                                                            <span className="truncate font-medium text-slate-700">
                                                                {item.title}
                                                            </span>
                                                        </div>
                                                        <div className="shrink-0 flex items-center gap-3">
                                                            <span className="text-slate-500">
                                                                × {item.qty}
                                                            </span>
                                                            <span
                                                                className="font-bold"
                                                                style={summaryValueStyle}
                                                            >
                                                                ৳{item.lineTotal.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}

                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span className="font-bold" style={summaryValueStyle}>
                                                ৳{itemsSubtotal.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Shipment</span>
                                            <span className="font-bold" style={{ color: accentColor }}>
                                                ৳{shippingFee.toLocaleString()}
                                            </span>
                                        </div>
                                        <div
                                            className="flex justify-between border-t pt-2 font-extrabold"
                                            style={{
                                                borderColor:
                                                    safeCheckoutCss(props.summaryBorderColor) ||
                                                    '#e2e8f0',
                                            }}
                                        >
                                            <span>Total</span>
                                            <span className="font-black" style={summaryTotalStyle}>
                                                ৳{grandTotal.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Method Box */}
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                                    <div className="text-sm font-bold text-slate-800">
                                        Cash on delivery
                                    </div>
                                    <div className="rounded-lg bg-slate-200/70 px-3.5 py-2.5 text-xs text-slate-600">
                                        Pay with cash upon delivery.
                                    </div>
                                </div>

                                <p className="text-[11px] leading-relaxed text-slate-500">
                                    Your personal data will be used to process your order, support your
                                    experience throughout this website, and for other purposes described in
                                    our privacy policy.
                                </p>

                                {/* Submit Button */}
                                <div>
                                    <button
                                        type="button"
                                        disabled={isEditor}
                                        style={buttonStyle}
                                        data-lc-el="button"
                                        className={`cod-submit-btn flex cursor-pointer items-center justify-center space-x-2 disabled:cursor-not-allowed disabled:opacity-60 ${buttonPulseClass}`}
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        <span>
                                            {buttonText} — ৳{grandTotal.toLocaleString()}
                                        </span>
                                    </button>
                                </div>

                                {props.showTrustBadges !== false && (
                                    <div
                                        data-lc-el="trust"
                                        className="flex flex-wrap items-center justify-center text-center"
                                        style={trustRowStyle}
                                    >
                                        <span className="inline-flex items-center">
                                            <CheckCircle2 style={trustIconStyle} />
                                            {trustText1}
                                        </span>
                                        <span className="inline-flex items-center">
                                            <CheckCircle2 style={trustIconStyle} />
                                            {trustText2}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
