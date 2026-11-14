import {
    Check,
    CheckCircle2,
    Layers,
    MapPin,
    Minus,
    Phone,
    Plus,
    ShieldCheck,
    ShoppingCart,
    User,
    X,
} from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { SafeImage } from '@/Shared/SafeImage';
import { resolveBlockStyles } from '../styleSystem';
import { useBuilderStore } from '../stores/useBuilderStore';
import type { Product } from '@/types';
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

interface ComboColorOption {
    name: string;
    imageUrl: string;
}

export function CodCheckoutBlock({
    props,
    styles: rawStyles = {},
    isEditor = false,
}: CodCheckoutBlockComponentProps) {
    const availableProducts = useBuilderStore((state) => state.availableProducts);
    const viewport = useBuilderStore((state) => state.viewport);
    const styles = resolveBlockStyles(rawStyles, viewport);
    const [selectedVariantMap, setSelectedVariantMap] = useState<Record<number, number>>({});
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [selectedShipping, setSelectedShipping] = useState<'inside' | 'outside'>('inside');
    const [comboSlotsMap, setComboSlotsMap] = useState<Record<number, Array<ComboColorOption | null>>>({});
    const [comboSizeMap, setComboSizeMap] = useState<Record<number, string>>({});
    const [comboColorModal, setComboColorModal] = useState<{ product: Product; slotIndex: number } | null>(null);

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

    // Combo Helpers
    const getComboPackSize = (prod?: Product | null): number =>
        Math.max(1, Number(prod?.combo_pack_size || 1));

    const isComboProduct = (prod?: Product | null): boolean => getComboPackSize(prod) > 1;

    const getProductFallbackImage = (prod?: Product | null): string =>
        prod?.primaryImage?.url ||
        prod?.primary_image?.url ||
        prod?.images?.[0]?.url ||
        (Array.isArray(prod?.combo_colors) ? prod?.combo_colors.find((c) => c?.image_url)?.image_url || '' : '') ||
        '';

    const getComboColors = (prod?: Product | null): ComboColorOption[] => {
        if (!prod || !Array.isArray(prod.combo_colors)) return [];
        const fallbackImg = getProductFallbackImage(prod);
        return prod.combo_colors
            .filter((c) => c && c.name && c.name.trim().length > 0)
            .map((c) => ({
                name: c.name.trim(),
                imageUrl: c.image_url || fallbackImg,
            }));
    };

    const getComboSizes = (prod?: Product | null): string[] => {
        if (!prod || !Array.isArray(prod.combo_sizes)) return [];
        return prod.combo_sizes.map((s) => String(s || '').trim()).filter(Boolean);
    };

    const getSlotsForProduct = (prod: Product): Array<ComboColorOption | null> => {
        const size = getComboPackSize(prod);
        const existing = comboSlotsMap[prod.id];
        if (!existing) {
            return Array.from({ length: size }, () => null);
        }
        return Array.from({ length: size }, (_, idx) => existing[idx] ?? null);
    };

    const getSizeForProduct = (prod: Product): string => {
        if (comboSizeMap[prod.id] !== undefined) {
            return comboSizeMap[prod.id];
        }
        return getComboSizes(prod)[0] || '';
    };

    const buildComboSummary = (prod: Product): string | null => {
        if (!isComboProduct(prod)) return null;
        const packSize = getComboPackSize(prod);
        const slots = getSlotsForProduct(prod);
        const filled = slots.map((s, idx) => (s ? `[${idx + 1}] ${s.name}` : null)).filter(Boolean);
        if (filled.length === 0) return null;
        const sizeVal = getSizeForProduct(prod);
        const sizePart = sizeVal ? ` | Size: ${sizeVal}` : '';
        return `${packSize} Pcs Combo — Colors: ${filled.join(', ')}${sizePart}`;
    };

    const handlePickComboSlotColor = (prod: Product, slotIndex: number, color: ComboColorOption) => {
        const packSize = getComboPackSize(prod);
        const current = getSlotsForProduct(prod);
        const updated = [...current];
        updated[slotIndex] = color;

        setComboSlotsMap((prev) => ({
            ...prev,
            [prod.id]: updated,
        }));

        const nextEmpty = updated.findIndex((s, i) => i > slotIndex && s === null);
        const firstEmpty = updated.findIndex((s) => s === null);
        const targetNext = nextEmpty !== -1 ? nextEmpty : firstEmpty;

        if (targetNext !== -1 && targetNext < packSize) {
            setComboColorModal({ product: prod, slotIndex: targetNext });
        } else {
            setComboColorModal(null);
        }
    };

    const handleClearComboSlot = (prod: Product, slotIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const current = getSlotsForProduct(prod);
        const updated = [...current];
        updated[slotIndex] = null;
        setComboSlotsMap((prev) => ({
            ...prev,
            [prod.id]: updated,
        }));
    };

    useEffect(() => {
        const handleExternalSelection = (event: Event) => {
            const customEvent = event as CustomEvent<{
                productId?: number;
                variantId?: number;
                comboSlots?: Array<ComboColorOption | null>;
                comboSize?: string;
            }>;
            const detail = customEvent.detail;
            if (!detail?.productId) return;
            const pid = detail.productId;

            if (props.selectionMode === 'multiple') {
                setSelectedProductIds((prev) => (prev.includes(pid) ? prev : [...prev, pid]));
            } else {
                setSelectedProductIds([pid]);
            }

            if (detail.variantId) {
                setSelectedVariantMap((prev) => ({ ...prev, [pid]: detail.variantId as number }));
            }

            const realProd = availableProducts.find((p) => p.id === pid);
            if (Array.isArray(detail.comboSlots)) {
                setComboSlotsMap((prev) => ({ ...prev, [pid]: detail.comboSlots || [] }));
            }
            if (typeof detail.comboSize === 'string') {
                setComboSizeMap((prev) => ({ ...prev, [pid]: detail.comboSize as string }));
            }

            if (realProd && isComboProduct(realProd)) {
                const slotsToCheck = Array.isArray(detail.comboSlots)
                    ? detail.comboSlots
                    : getSlotsForProduct(realProd);
                const firstEmpty = slotsToCheck.findIndex((s) => !s);
                if (firstEmpty !== -1) {
                    setComboColorModal({ product: realProd, slotIndex: firstEmpty });
                }
            }
        };

        window.addEventListener('landing-selection-updated', handleExternalSelection);
        return () => window.removeEventListener('landing-selection-updated', handleExternalSelection);
    }, [availableProducts, props.selectionMode, comboSlotsMap]);

    const handleToggleProduct = (pid: number) => {
        const isCurrentlySelected = selectedProductIds.includes(pid);
        const willBeSelected = props.selectionMode === 'multiple' ? !isCurrentlySelected : true;

        if (props.selectionMode === 'multiple') {
            setSelectedProductIds((prev) =>
                prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
            );
        } else {
            setSelectedProductIds([pid]);
        }

        if (willBeSelected) {
            const realProd = availableProducts.find((p) => p.id === pid);
            if (realProd && isComboProduct(realProd)) {
                const slots = getSlotsForProduct(realProd);
                const firstEmpty = slots.findIndex((s) => s === null);
                if (firstEmpty !== -1) {
                    setComboColorModal({ product: realProd, slotIndex: firstEmpty });
                }
            }
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
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        marginLeft: styles.marginLeft,
        marginRight: styles.marginRight,
        maxWidth: styles.maxWidth,
        minHeight: styles.minHeight,
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
    const explicitContainerPad =
        safeCheckoutCss(props.containerPaddingX) !== '16px'
            ? safeCheckoutCss(props.containerPaddingX)
            : undefined;
    const containerStyle: CSSProperties = {
        maxWidth:
            rawContainerMaxWidth &&
            rawContainerMaxWidth !== '672px' &&
            rawContainerMaxWidth !== '1080px'
                ? rawContainerMaxWidth
                : '1280px',
        paddingTop:
            safeCheckoutCss(styles.paddingTop ?? styles.padding) ??
            explicitContainerPad ??
            '16px',
        paddingBottom:
            safeCheckoutCss(styles.paddingBottom ?? styles.padding) ??
            explicitContainerPad ??
            '16px',
        paddingLeft: safeCheckoutCss(styles.paddingLeft ?? styles.padding) ?? explicitContainerPad,
        paddingRight: safeCheckoutCss(styles.paddingRight ?? styles.padding) ?? explicitContainerPad,
    };

    const pickCardToken = (
        propVal: string | number | undefined,
        defaultVal: string,
        styleVal?: string | number
    ): string => {
        const safeProp = safeCheckoutCss(propVal);
        const safeStyle = safeCheckoutCss(styleVal);
        if (safeProp && safeProp !== defaultVal) {
            return safeProp;
        }
        return safeStyle ?? safeProp ?? defaultVal;
    };

    const resolvedCardBorderWidth = pickCardToken(props.cardBorderWidth, '2px', styles.borderWidth);
    const resolvedCardBorderStyle =
        props.cardBorderStyle && props.cardBorderStyle !== 'solid'
            ? props.cardBorderStyle
            : styles.borderStyle || props.cardBorderStyle || 'solid';
    const isCardBorderless =
        resolvedCardBorderStyle === 'none' || /^0(?:\.0+)?(?:[a-z%]+)?$/i.test(resolvedCardBorderWidth);

    const cardStyle: CSSProperties = {
        backgroundColor: safeCheckoutCss(props.cardBgColor) || '#ffffff',
        borderColor: pickCardToken(props.cardBorderColor, '#10b981', styles.borderColor),
        borderWidth: isCardBorderless ? '0px' : resolvedCardBorderWidth,
        borderStyle: isCardBorderless ? 'none' : resolvedCardBorderStyle,
        borderRadius: pickCardToken(props.cardBorderRadius, '24px', styles.borderRadius),
        minHeight: safeCheckoutCss(props.cardMinHeight),
        paddingTop: safeCheckoutCss(props.cardPaddingTop) ?? '32px',
        paddingBottom: safeCheckoutCss(props.cardPaddingBottom) ?? '32px',
        paddingLeft: safeCheckoutCss(props.cardPaddingLeft) ?? '32px',
        paddingRight: safeCheckoutCss(props.cardPaddingRight) ?? '32px',
        boxShadow: pickCardToken(
            props.cardShadow,
            '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            styles.boxShadow
        ),
    };

    const headerStyle: CSSProperties = {
        textAlign: props.headerAlign || 'center',
        paddingTop: safeCheckoutCss(props.headerPaddingTop) ?? '0px',
        paddingBottom: safeCheckoutCss(props.headerPaddingBottom) ?? '24px',
        borderBottomWidth: safeCheckoutCss(props.headerBorderWidth) ?? '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: safeCheckoutCss(props.headerBorderColor) || '#f1f5f9',
    };

    const badgeStyle: CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: `${safeCheckoutCss(props.badgePaddingY) ?? '4px'} ${safeCheckoutCss(props.badgePaddingX) ?? '12px'}`,
        borderRadius: safeCheckoutCss(props.badgeBorderRadius) ?? '9999px',
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
        marginBottom: safeCheckoutCss(props.titleMarginBottom) ?? '4px',
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
        borderRadius: safeCheckoutCss(props.productPanelBorderRadius) ?? '12px',
        padding: safeCheckoutCss(props.productPanelPadding) ?? '12px',
    };

    const productCardStyle: CSSProperties = {
        backgroundColor: safeCheckoutCss(props.productCardBgColor) || '#ffffff',
        borderColor: safeCheckoutCss(props.productCardBorderColor) || '#e2e8f0',
        borderWidth: safeCheckoutCss(props.productCardBorderWidth) ?? '1px',
        borderStyle: 'solid',
        borderRadius: safeCheckoutCss(props.productCardBorderRadius) ?? '12px',
        padding: safeCheckoutCss(props.productCardPadding) ?? '10px',
    };

    const productThumbStyle: CSSProperties = {
        width: safeCheckoutCss(props.productImageSize) || '40px',
        height: safeCheckoutCss(props.productImageSize) || '40px',
        borderRadius: safeCheckoutCss(props.productImageRadius) ?? '8px',
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
        borderRadius: safeCheckoutCss(props.productBadgeBorderRadius) ?? '9999px',
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
        marginBottom: safeCheckoutCss(props.labelMarginBottom) ?? '4px',
    };

    const inputHorizontalPadding = safeCheckoutCss(props.inputPaddingX) ?? '12px';
    const inputStyle: CSSProperties = {
        width: '100%',
        backgroundColor: safeCheckoutCss(props.inputBgColor) || '#ffffff',
        color: safeCheckoutCss(props.inputTextColor) || '#0f172a',
        borderColor: safeCheckoutCss(props.inputBorderColor) || '#cbd5e1',
        borderWidth: safeCheckoutCss(props.inputBorderWidth) ?? '1px',
        borderStyle: 'solid',
        borderRadius: safeCheckoutCss(props.inputBorderRadius) ?? '12px',
        paddingTop: safeCheckoutCss(props.inputPaddingY) ?? '10px',
        paddingBottom: safeCheckoutCss(props.inputPaddingY) ?? '10px',
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
        borderWidth: safeCheckoutCss(props.shippingBorderWidth) ?? '2px',
        borderStyle: 'solid',
        borderRadius: safeCheckoutCss(props.shippingBorderRadius) ?? '12px',
        padding: safeCheckoutCss(props.shippingPadding) ?? '10px',
        fontSize: safeCheckoutCss(props.shippingFontSize) || '14px',
        fontWeight: safeCheckoutCss(props.shippingFontWeight) || '600',
        fontFamily: 'inherit',
    };

    const summaryStyle: CSSProperties = {
        backgroundColor: safeCheckoutCss(props.summaryBgColor) || '#f8fafc',
        borderColor: safeCheckoutCss(props.summaryBorderColor) || '#e2e8f0',
        borderWidth: safeCheckoutCss(props.summaryBorderWidth) ?? '1px',
        borderStyle: 'solid',
        borderRadius: safeCheckoutCss(props.summaryBorderRadius) ?? '12px',
        padding: safeCheckoutCss(props.summaryPadding) ?? '16px',
        color: safeCheckoutCss(props.summaryTextColor) || '#475569',
        fontSize: safeCheckoutCss(props.summaryFontSize) || '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: safeCheckoutCss(props.summaryRowGap) ?? '8px',
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
        borderRadius: safeCheckoutCss(props.buttonBorderRadius) ?? '12px',
        borderWidth: safeCheckoutCss(props.buttonBorderWidth) ?? '0px',
        borderStyle: 'solid',
        borderColor: safeCheckoutCss(props.buttonBorderColor) || safeCheckoutCss(props.buttonBgColor) || '#059669',
        minHeight: safeCheckoutCss(props.buttonMinHeight),
        paddingTop: safeCheckoutCss(props.buttonPaddingY) ?? '16px',
        paddingBottom: safeCheckoutCss(props.buttonPaddingY) ?? '16px',
        paddingLeft: safeCheckoutCss(props.buttonPaddingX) ?? '24px',
        paddingRight: safeCheckoutCss(props.buttonPaddingX) ?? '24px',
        fontSize: safeCheckoutCss(props.buttonFontSize) || '16px',
        fontWeight: safeCheckoutCss(props.buttonFontWeight) || '800',
        boxShadow:
            safeCheckoutCss(props.buttonShadow) ||
            '0 20px 25px -5px rgb(5 150 105 / 0.3)',
        textTransform: props.buttonTextTransform || 'none',
        letterSpacing: safeCheckoutCss(props.buttonLetterSpacing) ?? '0px',
        transition: 'background-color 0.15s ease, transform 0.15s ease',
    };
    const buttonPulseClass = styles.buttonPulseAnimation ? 'animate-pulse' : '';

    const trustRowStyle: CSSProperties = {
        paddingTop: safeCheckoutCss(props.trustPaddingTop) ?? '8px',
        color: safeCheckoutCss(props.trustTextColor) || '#64748b',
        fontSize: safeCheckoutCss(props.trustFontSize) || '11px',
        fontWeight: safeCheckoutCss(props.trustFontWeight) || '400',
        gap: safeCheckoutCss(props.trustGap) ?? '16px',
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
              : realProd
                ? null
                : 1250;
        const effPrice = salePrice || regPrice;
        const imgUrl =
            activeVariant?.images?.[0]?.url ||
            getProductFallbackImage(realProd) ||
            undefined;
        const qty = getQty(pid);
        const comboSummary = realProd ? buildComboSummary(realProd) : null;

        return {
            pid,
            title: realProd?.title || `Product #${pid}`,
            imgUrl,
            unitPrice: effPrice,
            qty,
            lineTotal: effPrice * qty,
            comboSummary,
        };
    });

    const selectedComboProducts = selectedProductIds
        .map((pid) => availableProducts.find((p) => p.id === pid))
        .filter((p): p is Product => Boolean(p && isComboProduct(p)));

    const renderComboConfiguratorForProduct = (prod: Product, standalone = false) => {
        const packSize = getComboPackSize(prod);
        const slots = getSlotsForProduct(prod);
        const sizes = getComboSizes(prod);
        const selectedSize = getSizeForProduct(prod);
        const filledCount = slots.filter(Boolean).length;
        const isComplete = filledCount === packSize && (sizes.length === 0 || Boolean(selectedSize));

        return (
            <div
                onClick={(e) => e.stopPropagation()}
                className={
                    standalone
                        ? 'rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 space-y-3'
                        : 'mt-2.5 border-t border-slate-200/80 pt-2.5 space-y-2.5'
                }
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-800 inline-flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                            {standalone ? `${prod.title} — ` : ''}
                            পছন্দের {packSize}টি কালার সিলেক্ট করুন ({filledCount}/{packSize})
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            const firstEmpty = slots.findIndex((s) => s === null);
                            setComboColorModal({
                                product: prod,
                                slotIndex: firstEmpty !== -1 ? firstEmpty : 0,
                            });
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                            isComplete
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                        }`}
                    >
                        {isComplete ? '✓ কালার কমপ্লিট (পরিবর্তন করুন)' : 'কালার বাছাই করুন'}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {slots.map((slot, sIdx) => (
                        <div
                            key={sIdx}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation();
                                setComboColorModal({ product: prod, slotIndex: sIdx });
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setComboColorModal({ product: prod, slotIndex: sIdx });
                                }
                            }}
                            className={`relative w-14 h-16 rounded-lg border-2 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden select-none ${
                                slot
                                    ? 'border-emerald-500 bg-white shadow-2xs'
                                    : 'border-dashed border-amber-400 bg-amber-100/60 hover:bg-amber-100'
                            }`}
                        >
                            <span className="absolute top-0.5 left-0.5 z-10 w-3.5 h-3.5 rounded-full bg-slate-900/75 text-white text-[8px] font-bold flex items-center justify-center">
                                {sIdx + 1}
                            </span>
                            {slot ? (
                                <>
                                    <SafeImage
                                        src={slot.imageUrl}
                                        alt={slot.name}
                                        className="w-full h-10 object-cover"
                                        fallbackIconSize="w-3.5 h-3.5"
                                        fallbackText=""
                                    />
                                    <span className="w-full px-0.5 py-0.5 text-[8px] font-bold text-slate-800 text-center truncate bg-white/95 border-t border-slate-100">
                                        {slot.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => handleClearComboSlot(prod, sIdx, e)}
                                        title="Remove color"
                                        className="absolute top-0.5 right-0.5 z-10 w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700"
                                    >
                                        <X className="w-2 h-2" />
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-0.5 text-amber-900">
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="text-[8px] font-bold">+ কালার</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {sizes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-600 mr-1">সাইজ (Size):</span>
                        {sizes.map((sz) => {
                            const isSizeSelected = selectedSize === sz;
                            return (
                                <button
                                    key={sz}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setComboSizeMap((prev) => ({ ...prev, [prod.id]: sz }));
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                                        isSizeSelected
                                            ? 'bg-emerald-600 border-emerald-600 text-white'
                                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500'
                                    }`}
                                >
                                    {sz}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const itemsSubtotal = selectedOrderItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingFee = selectedShipping === 'inside' ? 70 : 130;
    const grandTotal = itemsSubtotal + shippingFee;

    return (
        <section id="cod-checkout" style={sectionStyle} data-lc-el="section" className="w-full">
            <style>{COD_CHECKOUT_STATIC_CSS}</style>
            <div
                style={containerStyle}
                data-lc-el="container"
                className="w-full max-w-7xl mx-auto px-4 @min-[640px]:px-6 @min-[1024px]:px-8 [.lc-container_&]:max-w-none [.lc-container_&]:px-0 [.lc-grid_&]:max-w-none [.lc-grid_&]:px-0"
            >
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
                                              : realProd
                                                ? null
                                                : 1250;
                                        const effPrice = salePrice || regPrice;
                                        const hasDiscount = salePrice && salePrice < regPrice;
                                        const discountPct =
                                            hasDiscount && regPrice > 0
                                                ? Math.round(((regPrice - salePrice) / regPrice) * 100)
                                                : 0;

                                        const imgUrl =
                                            activeVariant?.images?.[0]?.url ||
                                            getProductFallbackImage(realProd) ||
                                            undefined;
                                        const isCombo = isComboProduct(realProd);
                                        const packSize = getComboPackSize(realProd);
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
                                                <div className="flex flex-wrap items-center justify-between gap-2.5">
                                                    <div className="flex min-w-[160px] flex-1 items-center space-x-2.5">
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
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <span
                                                                    className="truncate font-bold"
                                                                    style={productTitleStyle}
                                                                >
                                                                    {realProd?.title || `Product #${pid}`}
                                                                </span>
                                                                {isCombo && (
                                                                    <span className="shrink-0 rounded-full bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-900">
                                                                        {packSize} Pcs Combo
                                                                    </span>
                                                                )}
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
                                                                className="block truncate"
                                                                style={productInfoStyle}
                                                            >
                                                                {realProd
                                                                    ? 'In Stock & Verified'
                                                                    : 'Placeholder Preview'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Quantity Stepper + Price */}
                                                    <div className="ml-auto flex shrink-0 items-center gap-2.5">
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

                                                        <div className="shrink-0 text-right min-w-[68px]">
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
                                                </div>

                                                {/* Variants are shown only for the selected product (or Combo Boxes if Combo Pack). */}
                                                {isSelected && isCombo && realProd
                                                    ? renderComboConfiguratorForProduct(realProd, false)
                                                    : isSelected &&
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

                        {/* Standalone Combo Configurator when Top Product Selector is hidden */}
                        {(productIds.length === 0 || props.showProductSelector === false) &&
                            selectedComboProducts.length > 0 && (
                                <div className="space-y-3">
                                    {selectedComboProducts.map((comboProd) => (
                                        <div key={comboProd.id}>
                                            {renderComboConfiguratorForProduct(comboProd, true)}
                                        </div>
                                    ))}
                                </div>
                            )}

                        {/* Bottom 2-Column Layout on PC (Mobile/Tablet stays single-column) */}
                        <div
                            className={`grid grid-cols-1 ${
                                isEditor && viewport !== 'desktop'
                                    ? 'gap-6'
                                    : 'lg:grid-cols-12 gap-6 lg:gap-8'
                            } items-start`}
                        >
                            {/* Left Column: Billing Details & Shipping */}
                            <div
                                className={`${
                                    isEditor && viewport !== 'desktop' ? '' : 'lg:col-span-6'
                                } space-y-4`}
                            >
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
                            <div
                                className={`${
                                    isEditor && viewport !== 'desktop' ? '' : 'lg:col-span-6'
                                } space-y-4`}
                            >
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
                                                            <div className="min-w-0">
                                                                <span className="truncate block font-medium text-slate-700">
                                                                    {item.title}
                                                                </span>
                                                                {item.comboSummary && (
                                                                    <span className="block text-[10px] font-semibold text-emerald-700 truncate">
                                                                        {item.comboSummary}
                                                                    </span>
                                                                )}
                                                            </div>
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

            {/* Combo Color Selection Modal */}
            {comboColorModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150"
                    onClick={() => setComboColorModal(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(() => {
                            const modalProd = comboColorModal.product;
                            const packSize = getComboPackSize(modalProd);
                            const slots = getSlotsForProduct(modalProd);
                            const colors = getComboColors(modalProd);
                            const sizes = getComboSizes(modalProd);
                            const selectedSize = getSizeForProduct(modalProd);
                            const activeIdx =
                                comboColorModal.slotIndex >= 0 && comboColorModal.slotIndex < packSize
                                    ? comboColorModal.slotIndex
                                    : 0;
                            const filledCount = slots.filter(Boolean).length;

                            return (
                                <>
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                                                {packSize} Pcs Combo ({filledCount}/{packSize} সিলেক্টেড)
                                            </span>
                                            <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                                বক্স #{activeIdx + 1}-এর জন্য কালার সিলেক্ট করুন
                                            </h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setComboColorModal(null)}
                                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                                        {/* Slot Tabs Preview */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            {slots.map((slot, sIdx) => {
                                                const isActive = activeIdx === sIdx;
                                                return (
                                                    <div
                                                        key={sIdx}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() =>
                                                            setComboColorModal({ product: modalProd, slotIndex: sIdx })
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                setComboColorModal({
                                                                    product: modalProd,
                                                                    slotIndex: sIdx,
                                                                });
                                                            }
                                                        }}
                                                        className={`relative w-14 h-16 rounded-xl border-2 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden select-none ${
                                                            isActive
                                                                ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/40'
                                                                : slot
                                                                  ? 'border-slate-300 bg-white'
                                                                  : 'border-dashed border-amber-400 bg-amber-100/60'
                                                        }`}
                                                    >
                                                        <span className="absolute top-0.5 left-0.5 z-10 w-3.5 h-3.5 rounded-full bg-slate-900/75 text-white text-[8px] font-bold flex items-center justify-center">
                                                            {sIdx + 1}
                                                        </span>
                                                        {slot ? (
                                                            <>
                                                                <SafeImage
                                                                    src={slot.imageUrl}
                                                                    alt={slot.name}
                                                                    className="w-full h-10 object-cover"
                                                                    fallbackIconSize="w-3.5 h-3.5"
                                                                    fallbackText=""
                                                                />
                                                                <span className="w-full px-0.5 py-0.5 text-[8px] font-bold text-slate-800 text-center truncate bg-white/95 border-t border-slate-100">
                                                                    {slot.name}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center gap-0.5 text-amber-900">
                                                                <Plus className="w-3.5 h-3.5" />
                                                                <span className="text-[8px] font-bold">বক্স #{sIdx + 1}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Color Grid */}
                                        {colors.length === 0 ? (
                                            <div className="text-center py-6 text-xs text-slate-500">
                                                কোনো কালার অপশন পাওয়া যায়নি।
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {colors.map((c) => {
                                                    const isPickedHere = slots[activeIdx]?.name === c.name;
                                                    return (
                                                        <button
                                                            key={c.name}
                                                            type="button"
                                                            onClick={() =>
                                                                handlePickComboSlotColor(modalProd, activeIdx, c)
                                                            }
                                                            className={`group flex flex-col items-center rounded-xl border-2 p-2 transition text-left cursor-pointer ${
                                                                isPickedHere
                                                                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                                    : 'border-slate-200 bg-white hover:border-amber-400 hover:shadow-sm'
                                                            }`}
                                                        >
                                                            <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-50 mb-1.5 border border-slate-100">
                                                                <SafeImage
                                                                    src={c.imageUrl}
                                                                    alt={c.name}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                                    fallbackIconSize="w-6 h-6"
                                                                    fallbackText=""
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-900 truncate w-full text-center">
                                                                {c.name}
                                                            </span>
                                                            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                                                <Plus className="w-3 h-3" /> সিলেক্ট করুন
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Common Size Picker inside modal */}
                                        {sizes.length > 0 && (
                                            <div className="pt-3 border-t border-slate-100">
                                                <div className="text-xs font-bold text-slate-700 mb-2">
                                                    কমন সাইজ সিলেক্ট করুন (Size):{' '}
                                                    <span className="text-emerald-700">{selectedSize}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {sizes.map((sz) => {
                                                        const isSelected = selectedSize === sz;
                                                        return (
                                                            <button
                                                                key={sz}
                                                                type="button"
                                                                onClick={() =>
                                                                    setComboSizeMap((prev) => ({
                                                                        ...prev,
                                                                        [modalProd.id]: sz,
                                                                    }))
                                                                }
                                                                className={`min-w-[40px] px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                                                                    isSelected
                                                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                                                        : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500'
                                                                }`}
                                                            >
                                                                {isSelected && <Check className="w-3 h-3" />}
                                                                <span>{sz}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </section>
    );
}
