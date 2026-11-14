import { Check, CheckCircle2, Eye, Layers, Plus, ShoppingBag, Tag, X } from 'lucide-react';
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

interface ComboColorOption {
    name: string;
    imageUrl: string;
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

    // Combo pack state per product
    const [comboSlotsMap, setComboSlotsMap] = useState<Record<number, Array<ComboColorOption | null>>>({});
    const [comboSizeMap, setComboSizeMap] = useState<Record<number, string>>({});
    const [comboModalActiveSlot, setComboModalActiveSlot] = useState<number>(0);
    const [comboValidationError, setComboValidationError] = useState<string | null>(null);
    const [colorPickerModal, setColorPickerModal] = useState<{ product: Product; slotIndex: number } | null>(null);

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
        minHeight: styles.minHeight,
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

    const productIds =
        props.productIds && props.productIds.length > 0
            ? props.productIds
            : props.productId
              ? [props.productId]
              : [];

    const isMultiple = Boolean(productIds.length > 1);
    const orderButtonText = props.orderButtonText || 'অর্ডার করুন';
    const productBadges = props.productBadges || {};

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

    const buildComboSummary = (
        prod: Product,
        slotsOverride?: Array<ComboColorOption | null>,
        sizeOverride?: string
    ): string | null => {
        if (!isComboProduct(prod)) return null;
        const packSize = getComboPackSize(prod);
        const slots = slotsOverride ?? getSlotsForProduct(prod);
        const filled = slots
            .map((s, idx) => (s ? `[${idx + 1}] ${s.name}` : null))
            .filter(Boolean);
        if (filled.length === 0) return null;
        const sizeVal = sizeOverride !== undefined ? sizeOverride : getSizeForProduct(prod);
        const sizePart = sizeVal ? ` | Size: ${sizeVal}` : '';
        return `${packSize} Pcs Combo — Colors: ${filled.join(', ')}${sizePart}`;
    };

    const handlePickSlotColor = (prod: Product, slotIndex: number, color: ComboColorOption, keepModalOpen = false) => {
        setComboValidationError(null);
        const current = getSlotsForProduct(prod);
        const updated = [...current];
        updated[slotIndex] = color;
        setComboSlotsMap((prev) => ({
            ...prev,
            [prod.id]: updated,
        }));

        const nextEmpty = updated.findIndex((s, i) => i > slotIndex && s === null);
        const firstEmpty = updated.findIndex((s) => s === null);
        const nextSlot = nextEmpty !== -1 ? nextEmpty : firstEmpty !== -1 ? firstEmpty : slotIndex;
        setComboModalActiveSlot(nextSlot);

        if (!keepModalOpen) {
            setColorPickerModal(null);
        }
    };

    const handleClearSlot = (prod: Product, slotIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setComboValidationError(null);
        const current = getSlotsForProduct(prod);
        const updated = [...current];
        updated[slotIndex] = null;
        setComboSlotsMap((prev) => ({
            ...prev,
            [prod.id]: updated,
        }));
        setComboModalActiveSlot(slotIndex);
    };

    const dispatchSelectionToCheckout = (
        prod: Product,
        slotsOverride?: Array<ComboColorOption | null>,
        sizeOverride?: string
    ) => {
        if (isEditor) return;
        const variantId = selectedVariantMap[prod.id] || prod.variants?.[0]?.id || 0;
        const slots = isComboProduct(prod) ? (slotsOverride ?? getSlotsForProduct(prod)) : undefined;
        const sizeVal = isComboProduct(prod) ? (sizeOverride ?? getSizeForProduct(prod)) : undefined;
        const comboSummary = isComboProduct(prod) ? buildComboSummary(prod, slots, sizeVal) : null;

        window.dispatchEvent(
            new CustomEvent('landing-selection-updated', {
                detail: {
                    productId: prod.id,
                    variantId,
                    ...(isComboProduct(prod)
                        ? {
                              comboSlots: slots,
                              comboSize: sizeVal,
                              comboSummary,
                          }
                        : {}),
                },
            })
        );

        const checkoutEl = document.getElementById('cod-checkout');
        if (checkoutEl) {
            checkoutEl.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleOrderClick = (prod: Product | undefined) => {
        if (!prod) return;
        setComboValidationError(null);

        if (isComboProduct(prod)) {
            if (isMultiple) {
                const slots = getSlotsForProduct(prod);
                const firstEmpty = slots.findIndex((s) => s === null);
                setComboModalActiveSlot(firstEmpty !== -1 ? firstEmpty : 0);
                setVariantModalProduct(prod);
                return;
            }

            // Single product showcase: verify combo slots & size
            const slots = getSlotsForProduct(prod);
            const firstEmpty = slots.findIndex((s) => s === null);
            if (firstEmpty !== -1) {
                setColorPickerModal({ product: prod, slotIndex: firstEmpty });
                return;
            }
            const sizes = getComboSizes(prod);
            const sizeVal = getSizeForProduct(prod);
            if (sizes.length > 0 && !sizeVal) {
                setComboValidationError('অনুগ্রহ করে নিচের অপশন থেকে সাইজ সিলেক্ট করুন।');
                return;
            }

            dispatchSelectionToCheckout(prod, slots, sizeVal);
            return;
        }

        // Non-combo product with multiple variants
        if (prod.variants && prod.variants.length > 1) {
            setVariantModalProduct(prod);
            return;
        }

        // Direct action for single/non-variant product
        dispatchSelectionToCheckout(prod);
    };

    const confirmModalOrder = (prod: Product) => {
        if (isComboProduct(prod)) {
            const slots = getSlotsForProduct(prod);
            const firstEmpty = slots.findIndex((s) => s === null);
            if (firstEmpty !== -1) {
                setComboModalActiveSlot(firstEmpty);
                setComboValidationError(
                    `অনুগ্রহ করে কম্বো প্যাকের সবগুলো (${getComboPackSize(prod)}টি) বক্সে কালার সিলেক্ট করুন। (বক্স #${firstEmpty + 1} খালি আছে)`
                );
                return;
            }
            const sizes = getComboSizes(prod);
            const sizeVal = getSizeForProduct(prod);
            if (sizes.length > 0 && !sizeVal) {
                setComboValidationError('অনুগ্রহ করে আপনার পছন্দের সাইজ সিলেক্ট করুন।');
                return;
            }
        }

        setComboValidationError(null);
        setVariantModalProduct(null);
        setQuickViewProduct(null);
        dispatchSelectionToCheckout(prod);
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

        if (Array.isArray(prod.combo_colors)) {
            prod.combo_colors.forEach((c) => {
                if (c?.image_url && !urls.includes(c.image_url)) urls.push(c.image_url);
            });
        }

        return urls;
    };

    // Reusable Combo Slots + Size Box Renderer
    const renderComboBoxesSection = (prod: Product, compact = false) => {
        if (!isComboProduct(prod)) return null;
        const packSize = getComboPackSize(prod);
        const slots = getSlotsForProduct(prod);
        const sizes = getComboSizes(prod);
        const selectedSize = getSizeForProduct(prod);
        const filledCount = slots.filter(Boolean).length;
        const isComplete = filledCount === packSize && (sizes.length === 0 || Boolean(selectedSize));

        return (
            <div className={`space-y-3 ${compact ? '' : 'pt-3 border-t border-gray-100'}`}>
                <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-800">
                            পছন্দের {packSize}টি কালার সিলেক্ট করুন ({filledCount}/{packSize})
                        </span>
                        {isComplete && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> কমপ্লিট
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {slots.map((slot, idx) => (
                            <div
                                key={idx}
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setComboValidationError(null);
                                    setColorPickerModal({ product: prod, slotIndex: idx });
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setColorPickerModal({ product: prod, slotIndex: idx });
                                    }
                                }}
                                className={`relative w-16 h-20 rounded-xl border-2 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden select-none ${
                                    slot
                                        ? 'border-emerald-500 bg-white shadow-2xs'
                                        : 'border-dashed border-amber-400 bg-amber-100/60 hover:bg-amber-100'
                                }`}
                            >
                                <span className="absolute top-1 left-1 z-[2] w-4 h-4 rounded-full bg-slate-900/75 text-white text-[9px] font-bold flex items-center justify-center">
                                    {idx + 1}
                                </span>

                                {slot ? (
                                    <>
                                        <SafeImage
                                            src={slot.imageUrl}
                                            alt={slot.name}
                                            className="w-full h-14 object-cover"
                                            fallbackIconSize="w-4 h-4"
                                            fallbackText=""
                                        />
                                        <span className="w-full px-1 py-0.5 text-[9px] font-bold text-gray-800 text-center truncate bg-white/95 border-t border-gray-100">
                                            {slot.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => handleClearSlot(prod, idx, e)}
                                            title="Remove color"
                                            className="absolute top-1 right-1 z-[2] w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-1 text-amber-900 px-1 text-center">
                                        <div className="w-6 h-6 rounded-full bg-amber-300/70 flex items-center justify-center">
                                            <Plus className="w-3.5 h-3.5 text-amber-950" />
                                        </div>
                                        <span className="text-[9px] font-bold leading-tight">কালার দিন</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="text-[11px] text-gray-500">
                        যেকোনো <span className="font-bold text-amber-800">[ + ]</span> বক্সে ক্লিক করে পপআপ থেকে ছবি দেখে কালার সিলেক্ট করুন।
                    </p>
                </div>

                {sizes.length > 0 && (
                    <div className="space-y-1.5">
                        <div className="text-xs font-bold text-gray-700">
                            কমন সাইজ সিলেক্ট করুন (Size):{' '}
                            <span className="text-emerald-700">{selectedSize || 'সিলেক্ট করুন'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {sizes.map((sz) => {
                                const isActive = selectedSize === sz;
                                return (
                                    <button
                                        key={sz}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setComboValidationError(null);
                                            setComboSizeMap((prev) => ({ ...prev, [prod.id]: sz }));
                                        }}
                                        className={`min-w-[40px] px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                                            isActive
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-500'
                                        }`}
                                    >
                                        {isActive && <Check className="w-3 h-3" />}
                                        <span>{sz}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {comboValidationError && (
                    <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                        {comboValidationError}
                    </div>
                )}
            </div>
        );
    };

    // Render all shared modals (Variant/Combo Modal, Quick-View Modal, Standalone Combo Color Picker Modal)
    const renderModals = () => (
        <>
            {/* 1. Variant / Combo Configuration Modal */}
            {variantModalProduct && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
                    onClick={() => {
                        setVariantModalProduct(null);
                        setComboValidationError(null);
                    }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="relative z-30 p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                                    {isComboProduct(variantModalProduct)
                                        ? `${getComboPackSize(variantModalProduct)} Pcs Combo Pack Selection`
                                        : 'Select Variation'}
                                </span>
                                <h4 className="text-sm font-bold text-gray-900 truncate max-w-[320px]">
                                    {variantModalProduct.title}
                                </h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setVariantModalProduct(null);
                                    setComboValidationError(null);
                                }}
                                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="relative z-10 p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
                            {isComboProduct(variantModalProduct)
                                ? (() => {
                                      const packSize = getComboPackSize(variantModalProduct);
                                      const slots = getSlotsForProduct(variantModalProduct);
                                      const comboColors = getComboColors(variantModalProduct);
                                      const comboSizes = getComboSizes(variantModalProduct);
                                      const selectedSize = getSizeForProduct(variantModalProduct);
                                      const activeIdx =
                                          comboModalActiveSlot >= 0 && comboModalActiveSlot < packSize
                                              ? comboModalActiveSlot
                                              : 0;

                                      const regP = Number(variantModalProduct.regular_price);
                                      const saleP = variantModalProduct.sale_price
                                          ? Number(variantModalProduct.sale_price)
                                          : null;
                                      const effP = saleP || regP;
                                      const hasDisc = Boolean(saleP && saleP < regP);

                                      return (
                                          <>
                                              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                  <div>
                                                      <span className="text-xs font-bold text-gray-800 block">
                                                          পছন্দের {packSize}টি কালার সিলেক্ট করুন (
                                                          {slots.filter(Boolean).length}/{packSize})
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
                                                      </div>
                                                  </div>
                                                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                                                      বক্স #{activeIdx + 1} অ্যাক্টিভ
                                                  </span>
                                              </div>

                                              {/* [ + ] Slot Boxes inside Modal */}
                                              <div className="flex flex-wrap items-center gap-2.5">
                                                  {slots.map((slot, idx) => {
                                                      const isActive = activeIdx === idx;
                                                      return (
                                                          <div
                                                              key={idx}
                                                              role="button"
                                                              tabIndex={0}
                                                              onClick={() => setComboModalActiveSlot(idx)}
                                                              onKeyDown={(e) => {
                                                                  if (e.key === 'Enter' || e.key === ' ') {
                                                                      setComboModalActiveSlot(idx);
                                                                  }
                                                              }}
                                                              className={`relative w-18 h-22 rounded-xl border-2 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden select-none ${
                                                                  isActive
                                                                      ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/40'
                                                                      : slot
                                                                        ? 'border-gray-300 bg-white'
                                                                        : 'border-dashed border-amber-400 bg-amber-100/60'
                                                              }`}
                                                          >
                                                              <span className="absolute top-1 left-1 z-[2] w-4 h-4 rounded-full bg-slate-900/75 text-white text-[9px] font-bold flex items-center justify-center">
                                                                  {idx + 1}
                                                              </span>
                                                              {slot ? (
                                                                  <>
                                                                      <SafeImage
                                                                          src={slot.imageUrl}
                                                                          alt={slot.name}
                                                                          className="w-full h-14 object-cover"
                                                                          fallbackIconSize="w-4 h-4"
                                                                          fallbackText=""
                                                                      />
                                                                      <span className="w-full px-1 py-0.5 text-[9px] font-bold text-gray-800 text-center truncate bg-white/95 border-t border-gray-100">
                                                                          {slot.name}
                                                                      </span>
                                                                      <button
                                                                          type="button"
                                                                          onClick={(e) =>
                                                                              handleClearSlot(variantModalProduct, idx, e)
                                                                          }
                                                                          className="absolute top-1 right-1 z-[2] w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700"
                                                                      >
                                                                          <X className="w-2.5 h-2.5" />
                                                                      </button>
                                                                  </>
                                                              ) : (
                                                                  <div className="flex flex-col items-center justify-center gap-1 text-amber-900">
                                                                      <Plus className="w-4 h-4" />
                                                                      <span className="text-[9px] font-bold">
                                                                          কালার দিন
                                                                      </span>
                                                                  </div>
                                                              )}
                                                          </div>
                                                      );
                                                  })}
                                              </div>

                                              {/* Clickable Color Grid */}
                                              <div>
                                                  <div className="text-xs font-bold text-gray-700 mb-2">
                                                      বক্স #{activeIdx + 1}-এর জন্য নিচের ছবি থেকে কালার সিলেক্ট করুন:
                                                  </div>
                                                  {comboColors.length === 0 ? (
                                                      <div className="text-xs text-gray-500 py-4 text-center border border-dashed rounded-xl">
                                                          কোনো কালার কনফিগার করা নেই।
                                                      </div>
                                                  ) : (
                                                      <div className="grid grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                                                          {comboColors.map((c) => {
                                                              const isPickedHere = slots[activeIdx]?.name === c.name;
                                                              return (
                                                                  <button
                                                                      key={c.name}
                                                                      type="button"
                                                                      onClick={() =>
                                                                          handlePickSlotColor(
                                                                              variantModalProduct,
                                                                              activeIdx,
                                                                              c,
                                                                              true
                                                                          )
                                                                      }
                                                                      className={`flex flex-col items-center rounded-xl border-2 p-1.5 transition text-left cursor-pointer ${
                                                                          isPickedHere
                                                                              ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500/30'
                                                                              : 'border-gray-200 hover:border-amber-400 bg-white'
                                                                      }`}
                                                                  >
                                                                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-50 mb-1.5 border border-gray-100">
                                                                          <SafeImage
                                                                              src={c.imageUrl}
                                                                              alt={c.name}
                                                                              className="w-full h-full object-cover"
                                                                              fallbackIconSize="w-5 h-5"
                                                                              fallbackText=""
                                                                          />
                                                                      </div>
                                                                      <span className="text-[11px] font-bold text-gray-800 truncate w-full text-center">
                                                                          {c.name}
                                                                      </span>
                                                                  </button>
                                                              );
                                                          })}
                                                      </div>
                                                  )}
                                              </div>

                                              {/* Common Size Selector */}
                                              {comboSizes.length > 0 && (
                                                  <div className="pt-2 border-t border-gray-100">
                                                      <div className="text-xs font-bold text-gray-700 mb-2">
                                                          কমন সাইজ (Size):{' '}
                                                          <span className="text-emerald-700">{selectedSize}</span>
                                                      </div>
                                                      <div className="flex flex-wrap gap-1.5">
                                                          {comboSizes.map((sz) => {
                                                              const isSelected = selectedSize === sz;
                                                              return (
                                                                  <button
                                                                      key={sz}
                                                                      type="button"
                                                                      onClick={() => {
                                                                          setComboValidationError(null);
                                                                          setComboSizeMap((prev) => ({
                                                                              ...prev,
                                                                              [variantModalProduct.id]: sz,
                                                                          }));
                                                                      }}
                                                                      className={`min-w-[40px] px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                                                          isSelected
                                                                              ? 'bg-emerald-600 border-emerald-600 text-white'
                                                                              : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-500'
                                                                      }`}
                                                                  >
                                                                      {sz}
                                                                  </button>
                                                              );
                                                          })}
                                                      </div>
                                                  </div>
                                              )}

                                              {comboValidationError && (
                                                  <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                                                      {comboValidationError}
                                                  </div>
                                              )}

                                              <div className="pt-1">
                                                  <button
                                                      type="button"
                                                      onClick={() => confirmModalOrder(variantModalProduct)}
                                                      style={buttonCustomStyle}
                                                      className={`w-full py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer ${buttonPulseClass}`}
                                                  >
                                                      <ShoppingBag className="w-4 h-4" />
                                                      <span>{orderButtonText}</span>
                                                  </button>
                                              </div>
                                          </>
                                      );
                                  })()
                                : (() => {
                                      const activeVarId =
                                          selectedVariantMap[variantModalProduct.id] ||
                                          variantModalProduct.variants?.[0]?.id ||
                                          0;
                                      const activeVar =
                                          variantModalProduct.variants?.find((v) => v.id === activeVarId) ||
                                          variantModalProduct.variants?.[0];

                                      const regP = activeVar
                                          ? Number(activeVar.regular_price)
                                          : Number(variantModalProduct.regular_price);
                                      const saleP = activeVar?.sale_price
                                          ? Number(activeVar.sale_price)
                                          : Number(variantModalProduct.sale_price);
                                      const effP = saleP || regP;
                                      const hasDisc = Boolean(saleP && saleP < regP);
                                      const discPct =
                                          hasDisc && regP > 0 && saleP
                                              ? Math.round(((regP - saleP) / regP) * 100)
                                              : 0;
                                      const varImg =
                                          activeVar?.images?.[0]?.url || getProductFallbackImage(variantModalProduct);

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
                                                          <span
                                                              data-lc-el="price"
                                                              className="text-base font-extrabold text-emerald-600"
                                                          >
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

                                              <div>
                                                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                                      ভ্যারিয়েন্ট বাছাই করুন (Choose Option):
                                                  </label>
                                                  <div className="grid grid-cols-2 gap-2">
                                                      {variantModalProduct.variants.map((v) => {
                                                          const isSelected = activeVarId === v.id;
                                                          const vPrice = v.sale_price
                                                              ? Number(v.sale_price)
                                                              : Number(v.regular_price);
                                                          return (
                                                              <button
                                                                  key={v.id}
                                                                  type="button"
                                                                  onClick={() =>
                                                                      setSelectedVariantMap((prev) => ({
                                                                          ...prev,
                                                                          [variantModalProduct.id]: v.id,
                                                                      }))
                                                                  }
                                                                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                                                                      isSelected
                                                                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                                                                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                                                                  }`}
                                                              >
                                                                  <span className="text-xs truncate">{v.name}</span>
                                                                  <span className="text-[11px] font-semibold text-emerald-700">
                                                                      ৳{vPrice.toLocaleString()}
                                                                  </span>
                                                              </button>
                                                          );
                                                      })}
                                                  </div>
                                              </div>

                                              <div className="pt-2">
                                                  <button
                                                      type="button"
                                                      onClick={() => confirmModalOrder(variantModalProduct)}
                                                      style={buttonCustomStyle}
                                                      className={`w-full py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer ${buttonPulseClass}`}
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
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
                    onClick={() => setQuickViewProduct(null)}
                >
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
                            const activeVarId =
                                selectedVariantMap[quickViewProduct.id] || quickViewProduct.variants?.[0]?.id || 0;
                            const activeVar =
                                quickViewProduct.variants?.find((v) => v.id === activeVarId) ||
                                quickViewProduct.variants?.[0];

                            const regP = activeVar
                                ? Number(activeVar.regular_price)
                                : Number(quickViewProduct.regular_price);
                            const saleP = activeVar?.sale_price
                                ? Number(activeVar.sale_price)
                                : Number(quickViewProduct.sale_price);
                            const effP = saleP || regP;
                            const hasDisc = Boolean(saleP && saleP < regP);
                            const discPct =
                                hasDisc && regP > 0 && saleP ? Math.round(((regP - saleP) / regP) * 100) : 0;

                            const currentMainImg =
                                quickViewSelectedImage || activeVar?.images?.[0]?.url || galleryImages[0];

                            return (
                                <div className="grid grid-cols-1 @min-[768px]:grid-cols-2 gap-6 items-start">
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

                                        {/* Combo Pack Boxes OR Standard Variations */}
                                        {isComboProduct(quickViewProduct) ? (
                                            renderComboBoxesSection(quickViewProduct, true)
                                        ) : (
                                            quickViewProduct.variants &&
                                            quickViewProduct.variants.length > 1 && (
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
                                                                    setSelectedVariantMap((prev) => ({
                                                                        ...prev,
                                                                        [quickViewProduct.id]: v.id,
                                                                    }));
                                                                    if (v.images?.[0]?.url) {
                                                                        setQuickViewSelectedImage(v.images[0].url);
                                                                    } else {
                                                                        setQuickViewSelectedImage(
                                                                            getProductFallbackImage(quickViewProduct) ||
                                                                                null
                                                                        );
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
                                            )
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
                                                onClick={() => confirmModalOrder(quickViewProduct)}
                                                style={buttonCustomStyle}
                                                className={`w-full py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer ${buttonPulseClass}`}
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

            {/* 3. Standalone Color Selection Modal (for clicking `[ + ]` boxes on Single Product or Quick View) */}
            {colorPickerModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150"
                    onClick={() => setColorPickerModal(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative z-30 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                                    বক্স #{colorPickerModal.slotIndex + 1}-এর জন্য কালার সিলেক্ট করুন
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    যেকোনো ছবির উপর ক্লিক করলে বক্স #{colorPickerModal.slotIndex + 1}-এ অ্যাড হয়ে যাবে
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setColorPickerModal(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="relative z-10 p-5 overflow-y-auto flex-1 min-h-0">
                            {(() => {
                                const comboColors = getComboColors(colorPickerModal.product);
                                const currentSlots = getSlotsForProduct(colorPickerModal.product);
                                if (comboColors.length === 0) {
                                    return (
                                        <div className="text-center py-8 text-xs text-gray-500">
                                            কোনো কালার অপশন পাওয়া যায়নি।
                                        </div>
                                    );
                                }
                                return (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                                        {comboColors.map((c) => {
                                            const isPickedInActiveSlot =
                                                currentSlots[colorPickerModal.slotIndex]?.name === c.name;
                                            return (
                                                <button
                                                    key={c.name}
                                                    type="button"
                                                    onClick={() =>
                                                        handlePickSlotColor(
                                                            colorPickerModal.product,
                                                            colorPickerModal.slotIndex,
                                                            c,
                                                            false
                                                        )
                                                    }
                                                    className={`group flex flex-col items-center rounded-xl border-2 p-2 transition text-left cursor-pointer ${
                                                        isPickedInActiveSlot
                                                            ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                            : 'border-gray-200 bg-white hover:border-amber-400 hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2 border border-gray-100">
                                                        <SafeImage
                                                            src={c.imageUrl}
                                                            alt={c.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                            fallbackIconSize="w-6 h-6"
                                                            fallbackText=""
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-900 truncate w-full text-center">
                                                        {c.name}
                                                    </span>
                                                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                                        <Plus className="w-3 h-3" /> সিলেক্ট করুন
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    if (isMultiple) {
        return (
            <section style={inlineStyles} data-lc-el="section" className="w-full py-8">
                <div className="w-full max-w-7xl mx-auto px-4 @min-[640px]:px-6 @min-[1024px]:px-8 [.lc-container_&]:max-w-none [.lc-container_&]:px-0 [.lc-grid_&]:max-w-none [.lc-grid_&]:px-0">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
                            Featured Products
                        </span>
                        <h2
                            data-lc-el="title"
                            className="text-2xl @min-[640px]:text-3xl font-extrabold text-gray-900"
                        >
                            Select Your Preferred Product
                        </h2>
                    </div>

                    {/* Products Grid with Guaranteed Equal Height */}
                    <div className="grid grid-cols-1 @min-[640px]:grid-cols-2 @min-[800px]:grid-cols-3 gap-6 items-stretch">
                        {productIds.map((pid, idx) => {
                            const realProd = availableProducts.find((p) => p.id === pid);
                            const isCombo = isComboProduct(realProd);
                            const packSize = getComboPackSize(realProd);
                            const hasVariants = Boolean(!isCombo && realProd?.variants && realProd.variants.length > 1);

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
                            const hasDiscount = Boolean(salePrice && salePrice < regPrice);
                            const discountPct =
                                hasDiscount && regPrice > 0 && salePrice
                                    ? Math.round(((regPrice - salePrice) / regPrice) * 100)
                                    : 0;

                            const imgUrl = activeVariant?.images?.[0]?.url || getProductFallbackImage(realProd);
                            const cardBadge = productBadges[pid] || (idx === 0 ? props.badgeText : '');

                            return (
                                <div
                                    key={pid}
                                    data-lc-el="card"
                                    className="group/card relative rounded-2xl border border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 bg-white p-4 flex flex-col justify-between h-full"
                                >
                                    <div className="flex-1 flex flex-col">
                                        {/* Badges */}
                                        <div className="flex items-center justify-between pointer-events-none z-10 mb-2 min-h-[22px]">
                                            {cardBadge ? (
                                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-xs">
                                                    🔥 {cardBadge}
                                                </span>
                                            ) : (
                                                <span />
                                            )}

                                            {props.showDiscountBadge !== false && hasDiscount ? (
                                                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-extrabold">
                                                    {discountPct}% OFF
                                                </span>
                                            ) : null}
                                        </div>

                                        {/* Product Thumbnail with Blur Hover & Eye Quick-View Icon */}
                                        <div
                                            data-lc-el="image"
                                            className="relative aspect-square w-full rounded-xl bg-gray-50 border border-gray-100 overflow-hidden mb-3.5 flex items-center justify-center group/img"
                                        >
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

                                            {/* Combo badge or Variant indicator badge */}
                                            {isCombo ? (
                                                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-amber-500/95 text-white text-[9px] font-extrabold backdrop-blur-xs flex items-center space-x-1 shadow-xs">
                                                    <Layers className="w-3 h-3" />
                                                    <span>{packSize} Pcs Combo</span>
                                                </div>
                                            ) : (
                                                hasVariants && (
                                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/75 text-white text-[9px] font-bold backdrop-blur-xs flex items-center space-x-1">
                                                        <Layers className="w-3 h-3 text-emerald-400" />
                                                        <span>{realProd?.variants?.length} Options</span>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        {/* Title (Guaranteed consistent height) */}
                                        <h3
                                            data-lc-el="product-title"
                                            className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 min-h-[2.5rem] leading-snug"
                                            title={realProd?.title || `Product Item #${pid}`}
                                        >
                                            {realProd?.title || `Product Item #${pid}`}
                                        </h3>

                                        {/* Price */}
                                        {props.showPrice !== false && (
                                            <div className="flex items-baseline space-x-2 mb-2">
                                                <span
                                                    data-lc-el="price"
                                                    className="text-base font-extrabold text-emerald-600"
                                                >
                                                    ৳{effPrice.toLocaleString()}
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        ৳{regPrice.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Combo Summary Preview if already chosen */}
                                        {isCombo && realProd && buildComboSummary(realProd) && (
                                            <div className="mb-2 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800 line-clamp-2">
                                                ✓ {buildComboSummary(realProd)}
                                            </div>
                                        )}

                                        {/* Optional Description */}
                                        {props.showDescription && realProd?.description && (
                                            <p
                                                data-lc-el="description"
                                                className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed"
                                            >
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
                                                handleOrderClick(realProd);
                                            }}
                                            style={buttonCustomStyle}
                                            data-lc-el="button"
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

                {renderModals()}
            </section>
        );
    }

    // Single Product Showcase
    const singleProd = availableProducts.find((p) => p.id === props.productId) || availableProducts[0];
    const singleFirstVar = singleProd?.variants?.[0];
    const singleEff = singleFirstVar?.sale_price
        ? Number(singleFirstVar.sale_price)
        : singleProd?.sale_price
          ? Number(singleProd.sale_price)
          : singleFirstVar?.regular_price
            ? Number(singleFirstVar.regular_price)
            : singleProd?.regular_price
              ? Number(singleProd.regular_price)
              : 1450;
    const singleReg = singleFirstVar?.regular_price
        ? Number(singleFirstVar.regular_price)
        : singleProd?.regular_price
          ? Number(singleProd.regular_price)
          : 1850;
    const singleImg = singleFirstVar?.images?.[0]?.url || getProductFallbackImage(singleProd);
    const singleIsCombo = isComboProduct(singleProd);

    return (
        <section style={inlineStyles} data-lc-el="section" className="w-full py-8">
            <div className="w-full max-w-7xl mx-auto px-4 @min-[640px]:px-6 @min-[1024px]:px-8 [.lc-container_&]:max-w-none [.lc-container_&]:px-0 [.lc-grid_&]:max-w-none [.lc-grid_&]:px-0">
                <div
                    data-lc-el="card"
                    className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden p-6 @min-[640px]:p-8"
                >
                    <div className="flex flex-col @min-[768px]:flex-row gap-8 items-center">
                        {/* Product Visual Container with Hover Quick View */}
                        <div
                            data-lc-el="image"
                            className="w-full @min-[768px]:w-1/2 aspect-square bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-4 text-center overflow-hidden relative group/single"
                        >
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
                        <div className="w-full @min-[768px]:w-1/2 space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                                    <Tag className="w-3.5 h-3.5" />
                                    <span>Verified Authentic - In Stock</span>
                                </div>
                                {singleIsCombo && (
                                    <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>{getComboPackSize(singleProd)} Pcs Combo Pack</span>
                                    </div>
                                )}
                            </div>

                            <h2
                                data-lc-el="title"
                                className="text-2xl @min-[640px]:text-3xl font-extrabold text-gray-900 leading-tight"
                            >
                                {singleProd?.title || 'Premium Product Selection'}
                            </h2>

                            {props.showDescription !== false && (
                                <p data-lc-el="description" className="text-sm text-gray-600 leading-relaxed">
                                    {singleProd?.description ||
                                        'Select your preferred variants and proceed to our fast, 1-step Cash on Delivery checkout.'}
                                </p>
                            )}

                            {props.showPrice !== false && (
                                <div className="flex items-baseline space-x-3 pt-2">
                                    <span data-lc-el="price" className="text-3xl font-extrabold text-emerald-600">
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

                            {/* Combo `[ + ]` Boxes OR Variants selector */}
                            {singleIsCombo && singleProd
                                ? renderComboBoxesSection(singleProd)
                                : singleProd?.variants &&
                                  singleProd.variants.length > 1 && (
                                      <div className="pt-2">
                                          <div className="text-xs font-bold text-gray-700 mb-1.5">
                                              ভ্যারিয়েন্ট নির্বাচন করুন:
                                          </div>
                                          <div className="flex flex-wrap gap-1.5">
                                              {singleProd.variants.map((v) => {
                                                  const activeVarId =
                                                      selectedVariantMap[singleProd.id] || singleProd.variants[0]?.id;
                                                  const isActive = activeVarId === v.id;
                                                  return (
                                                      <button
                                                          key={v.id}
                                                          type="button"
                                                          onClick={() =>
                                                              setSelectedVariantMap((prev) => ({
                                                                  ...prev,
                                                                  [singleProd.id]: v.id,
                                                              }))
                                                          }
                                                          className={`px-2.5 py-1 text-xs rounded-lg border font-medium cursor-pointer transition ${
                                                              isActive
                                                                  ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                                                                  : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-400'
                                                          }`}
                                                      >
                                                          {v.name}
                                                      </button>
                                                  );
                                              })}
                                          </div>
                                      </div>
                                  )}

                            <div className="pt-4">
                                <button
                                    type="button"
                                    onClick={() => handleOrderClick(singleProd)}
                                    style={buttonCustomStyle}
                                    data-lc-el="button"
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

            {renderModals()}
        </section>
    );
}
