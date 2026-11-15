import { Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Heart,
    Maximize2,
    Minus,
    Plus,
    RefreshCw,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Sparkles,
    Truck,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import { ProductCard, formatBdt } from '@/Shared/ProductCard';
import { SafeImage } from '@/Shared/SafeImage';
import { SeoHead } from '@/Shared/SeoHead';
import type { ProductImage, ProductVariant } from '@/types';
import type { StorefrontProductProps } from '@/types/storefront';

interface ColorOptionItem {
    name: string;
    imageUrl: string;
    variantIds: number[];
}

export default function ProductDetail({
    product,
    relatedProducts,
    deliveryInfo,
    theme,
}: StorefrontProductProps) {
    // 1. Available Variants & Combo Pack Setup
    const comboPackSize = Math.max(1, Number(product.combo_pack_size || 1));
    const isComboProduct = comboPackSize > 1;

    const availableVariants = useMemo(() => {
        return product.variants.filter((v) => !v.manage_stock || v.stock_quantity > 0);
    }, [product.variants]);

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(() => {
        return availableVariants[0] || product.variants[0];
    });

    // 2. Quantity
    const [quantity, setQuantity] = useState(1);

    // 3. Active Image in Gallery & Lightbox (Primary + Gallery + Combo Color Images)
    const allImages = useMemo<ProductImage[]>(() => {
        const ordered: ProductImage[] = [];
        const seenUrls = new Set<string>();

        const pushUnique = (img: ProductImage | null | undefined) => {
            if (!img || !img.url || seenUrls.has(img.url)) {
                return;
            }
            seenUrls.add(img.url);
            ordered.push(img);
        };

        pushUnique(product.primaryImage || product.primary_image);

        const rawImages = [...(product.images || [])].sort(
            (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
        );
        rawImages.forEach((img) => pushUnique(img));

        if (Array.isArray(product.combo_colors)) {
            product.combo_colors.forEach((c, idx) => {
                if (c && c.image_url) {
                    pushUnique({
                        id: -1000 - idx,
                        product_id: product.id,
                        variant_id: null,
                        file_path: c.image_url,
                        sort_order: 1000 + idx,
                        is_primary: false,
                        alt_text: `${product.title} - ${c.name || `Option ${idx + 1}`}`,
                        url: c.image_url,
                        thumb_url: c.image_url,
                    });
                }
            });
        }

        return ordered;
    }, [
        product.id,
        product.title,
        product.images,
        product.primaryImage,
        product.primary_image,
        product.combo_colors,
    ]);

    // Extract Color & Size options from product.combo_colors / product.combo_sizes OR variants
    const { colorOptions, sizeOptions } = useMemo(() => {
        const fallbackImg =
            product.primaryImage?.url || allImages[0]?.url || '/placeholder.png';

        if (isComboProduct) {
            const directColors: ColorOptionItem[] = Array.isArray(product.combo_colors)
                ? product.combo_colors
                      .filter((c) => c && c.name && c.name.trim())
                      .map((c) => ({
                          name: c.name.trim(),
                          imageUrl: c.image_url || fallbackImg,
                          variantIds: [],
                      }))
                : [];

            const directSizes: string[] = Array.isArray(product.combo_sizes)
                ? product.combo_sizes.map((s) => String(s || '').trim()).filter(Boolean)
                : [];

            if (directColors.length > 0 || directSizes.length > 0) {
                return {
                    colorOptions: directColors,
                    sizeOptions: directSizes,
                };
            }
        }

        const colorsMap = new Map<string, ColorOptionItem>();
        const sizesSet = new Set<string>();

        product.variants.forEach((v) => {
            let colorName = '';
            let sizeName = '';

            if (v.attributes && typeof v.attributes === 'object') {
                Object.entries(v.attributes).forEach(([key, val]) => {
                    const cleanKey = key.trim();
                    const cleanVal = String(val || '').trim();
                    if (!cleanVal) return;
                    if (/^(color|colour|রঙ|কালার)$/i.test(cleanKey)) {
                        colorName = cleanVal;
                    } else if (/^(size|সাইজ)$/i.test(cleanKey)) {
                        sizeName = cleanVal;
                    }
                });
            }

            // Fallback to parsing variant name like "Black / M" or "Black - L"
            if (!colorName && !sizeName && v.name && v.name.toLowerCase() !== 'default') {
                if (v.name.includes('/')) {
                    const parts = v.name.split('/').map((s) => s.trim());
                    if (parts[0]) colorName = parts[0];
                    if (parts[1]) sizeName = parts[1];
                } else if (v.name.includes(' - ')) {
                    const parts = v.name.split(' - ').map((s) => s.trim());
                    if (parts[0]) colorName = parts[0];
                    if (parts[1]) sizeName = parts[1];
                } else if (isComboProduct) {
                    colorName = v.name.trim();
                }
            }

            if (colorName) {
                const variantImg =
                    v.images?.[0]?.url ||
                    product.images?.find((img) => img.variant_id === v.id)?.url ||
                    fallbackImg;
                const existing = colorsMap.get(colorName);
                if (!existing) {
                    colorsMap.set(colorName, {
                        name: colorName,
                        imageUrl: variantImg,
                        variantIds: [v.id],
                    });
                } else {
                    existing.variantIds.push(v.id);
                    if (existing.imageUrl === fallbackImg && variantImg !== fallbackImg) {
                        existing.imageUrl = variantImg;
                    }
                }
            }

            if (sizeName) {
                sizesSet.add(sizeName);
            }
        });

        return {
            colorOptions: Array.from(colorsMap.values()),
            sizeOptions: Array.from(sizesSet.values()),
        };
    }, [
        product.combo_colors,
        product.combo_sizes,
        product.variants,
        product.images,
        product.primaryImage,
        allImages,
        isComboProduct,
    ]);

    // Combo slot state: array of length comboPackSize containing selected ColorOptionItem | null
    const [comboSlots, setComboSlots] = useState<Array<ColorOptionItem | null>>(() =>
        Array.from({ length: comboPackSize }, () => null)
    );
    const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
    const [isComboModalOpen, setIsComboModalOpen] = useState<boolean>(false);
    const [selectedSize, setSelectedSize] = useState<string>(() => sizeOptions[0] || '');
    const [selectedSingleColor, setSelectedSingleColor] = useState<string>(
        () => colorOptions[0]?.name || ''
    );

    const [activeImageUrl, setActiveImageUrl] = useState<string>(() => {
        return (
            selectedVariant?.images?.[0]?.url ||
            product.primaryImage?.url ||
            allImages[0]?.url ||
            '/placeholder.png'
        );
    });
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Helper to match a variant by color and/or size
    const findMatchingVariant = (colorName: string, sizeName: string): ProductVariant | undefined => {
        return (
            product.variants.find((v) => {
                const attrs = v.attributes || {};
                const vColor =
                    Object.entries(attrs).find(([k]) => /^(color|colour|রঙ|কালার)$/i.test(k.trim()))?.[1] || '';
                const vSize =
                    Object.entries(attrs).find(([k]) => /^(size|সাইজ)$/i.test(k.trim()))?.[1] || '';

                if (vColor && vSize) {
                    return (
                        vColor.toLowerCase() === colorName.toLowerCase() &&
                        vSize.toLowerCase() === sizeName.toLowerCase()
                    );
                }
                if (vColor && !sizeName) {
                    return vColor.toLowerCase() === colorName.toLowerCase();
                }
                if (vSize && !colorName) {
                    return vSize.toLowerCase() === sizeName.toLowerCase();
                }
                const titleLower = v.name.toLowerCase();
                const matchesColor = !colorName || titleLower.includes(colorName.toLowerCase());
                const matchesSize = !sizeName || titleLower.includes(sizeName.toLowerCase());
                return matchesColor && matchesSize;
            }) || product.variants[0]
        );
    };

    // Handle picking a color for the active `[ + ]` slot in Combo Mode
    const handlePickComboColor = (colorItem: ColorOptionItem) => {
        setCartError(null);
        const targetIndex =
            activeSlotIndex >= 0 && activeSlotIndex < comboPackSize ? activeSlotIndex : 0;
        const updatedSlots = [...comboSlots];
        updatedSlots[targetIndex] = colorItem;
        setComboSlots(updatedSlots);

        if (colorItem.imageUrl) {
            setActiveImageUrl(colorItem.imageUrl);
        }

        const matched = findMatchingVariant(colorItem.name, selectedSize);
        if (matched) {
            setSelectedVariant(matched);
        }

        // Close modal after adding color into the clicked `[ + ]` box
        setIsComboModalOpen(false);

        // Advance active slot cursor to next empty `[ + ]` slot if one exists
        const nextEmptyIndex = updatedSlots.findIndex((slot, idx) => idx > targetIndex && slot === null);
        if (nextEmptyIndex !== -1) {
            setActiveSlotIndex(nextEmptyIndex);
        } else {
            const firstEmptyIndex = updatedSlots.findIndex((slot) => slot === null);
            if (firstEmptyIndex !== -1) {
                setActiveSlotIndex(firstEmptyIndex);
            }
        }
    };

    const handleOpenComboSlotModal = (idx: number) => {
        setActiveSlotIndex(idx);
        setIsComboModalOpen(true);
    };

    const handleClearComboSlot = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = [...comboSlots];
        updated[idx] = null;
        setComboSlots(updated);
        setActiveSlotIndex(idx);
    };

    const handleSelectSize = (size: string) => {
        setCartError(null);
        setSelectedSize(size);
        const refColor = isComboProduct
            ? comboSlots.find((s) => s !== null)?.name || colorOptions[0]?.name || ''
            : selectedSingleColor;
        const matched = findMatchingVariant(refColor, size);
        if (matched) {
            setSelectedVariant(matched);
        }
    };

    const handleSelectSingleColor = (colorItem: ColorOptionItem) => {
        setCartError(null);
        setSelectedSingleColor(colorItem.name);
        if (colorItem.imageUrl) {
            setActiveImageUrl(colorItem.imageUrl);
        }
        const matched = findMatchingVariant(colorItem.name, selectedSize);
        if (matched) {
            setSelectedVariant(matched);
        }
    };

    // When variant changes directly (fallback standard selector), update image
    const handleVariantSelect = (variant: ProductVariant) => {
        setCartError(null);
        setSelectedVariant(variant);
        setQuantity(1);
        if (variant.images && variant.images.length > 0) {
            setActiveImageUrl(variant.images[0].url);
        }
    };

    // 4. Price & Discount calculation for selected variant or product
    const regularPrice = useMemo(() => {
        const price = selectedVariant?.regular_price ?? product.regular_price;
        return typeof price === 'string' ? parseFloat(price) : price;
    }, [selectedVariant, product.regular_price]);

    const salePrice = useMemo(() => {
        const price = selectedVariant?.sale_price ?? product.sale_price;
        if (price === null || price === undefined) return null;
        return typeof price === 'string' ? parseFloat(price) : price;
    }, [selectedVariant, product.sale_price]);

    const currentPrice = salePrice !== null && salePrice < regularPrice ? salePrice : regularPrice;

    const discountPercent = useMemo(() => {
        if (salePrice !== null && regularPrice > 0 && salePrice < regularPrice) {
            return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
        }
        return 0;
    }, [regularPrice, salePrice]);

    // 5. Stock status
    const isCurrentInStock = useMemo(() => {
        if (!selectedVariant) return true;
        if (!selectedVariant.manage_stock) return true;
        return selectedVariant.stock_quantity > 0;
    }, [selectedVariant]);

    const maxStock = selectedVariant?.manage_stock ? selectedVariant.stock_quantity : 99;

    const handleQuantityChange = (delta: number) => {
        const next = quantity + delta;
        if (next >= 1 && next <= maxStock) {
            setQuantity(next);
        }
    };

    // Build Combo Summary string for Cart, Checkout & Order Item
    const comboSummary = useMemo<string | null>(() => {
        if (!isComboProduct) return null;
        const filledColors = comboSlots
            .map((slot, idx) => (slot ? `[${idx + 1}] ${slot.name}` : null))
            .filter(Boolean);
        if (filledColors.length === 0) return null;
        const sizePart = selectedSize ? ` | Size: ${selectedSize}` : '';
        return `${comboPackSize} Pcs Combo — Colors: ${filledColors.join(', ')}${sizePart}`;
    }, [isComboProduct, comboSlots, comboPackSize, selectedSize]);

    const isComboComplete = useMemo(() => {
        if (!isComboProduct) return true;
        const allBoxesFilled = comboSlots.every((slot) => slot !== null);
        const sizeOk = sizeOptions.length === 0 || Boolean(selectedSize);
        return allBoxesFilled && sizeOk;
    }, [isComboProduct, comboSlots, sizeOptions.length, selectedSize]);

    // 6. Direct Order URL into Unified Checkout
    const buyNowUrl = useMemo(() => {
        const base = selectedVariant
            ? `/checkout/${product.slug}?variant=${selectedVariant.id}&quantity=${quantity}`
            : `/checkout/${product.slug}?quantity=${quantity}`;
        if (isComboProduct && comboSummary) {
            return `${base}&combo=${encodeURIComponent(comboSummary)}`;
        }
        return base;
    }, [selectedVariant, product.slug, quantity, isComboProduct, comboSummary]);

    const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'delivery'>('desc');
    const [isDetailsOpen, setIsDetailsOpen] = useState(true);
    const [cartToast, setCartToast] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [cartError, setCartError] = useState<string | null>(null);
    const [wishlistAdded, setWishlistAdded] = useState(false);

    const validateComboBeforeAction = (): boolean => {
        if (!isComboProduct) return true;
        const emptyIndex = comboSlots.findIndex((s) => s === null);
        if (emptyIndex !== -1) {
            setActiveSlotIndex(emptyIndex);
            setCartError(
                `অনুগ্রহ করে কম্বো প্যাকের সবগুলো (${comboPackSize}টি) বক্সে পছন্দের কালার সিলেক্ট করুন। (বক্স #${emptyIndex + 1} খালি আছে)`
            );
            return false;
        }
        if (sizeOptions.length > 0 && !selectedSize) {
            setCartError('অনুগ্রহ করে নিচের অপশন থেকে আপনার সাইজ (Size) সিলেক্ট করুন।');
            return false;
        }
        return true;
    };

    const handleOrderNow = (e: React.MouseEvent) => {
        if (!validateComboBeforeAction()) {
            e.preventDefault();
        }
    };

    const handleAddToCart = async () => {
        if (!selectedVariant || isAddingToCart) return;
        if (!validateComboBeforeAction()) return;

        setIsAddingToCart(true);
        setCartError(null);

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const res = await fetch('/cart/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({
                    product_id: product.id,
                    variant_id: selectedVariant.id,
                    quantity,
                    ...(isComboProduct && comboSummary ? { combo_summary: comboSummary } : {}),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setCartError(data.message || 'Could not add item to cart.');
            } else {
                setCartToast(true);
                setTimeout(() => setCartToast(false), 3000);
                window.dispatchEvent(new CustomEvent('open-mini-cart', { detail: data.cart }));
                router.reload({ only: ['cart'] });
            }
        } catch {
            setCartError('Could not connect to server.');
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleWishlistToggle = () => {
        setWishlistAdded((prev) => !prev);
        router.post(
            '/wishlist/toggle',
            { product_id: product.id },
            { preserveScroll: true, preserveState: true }
        );
    };

    const cleanWhatsapp = useMemo(() => {
        return theme.store_whatsapp ? theme.store_whatsapp.replace(/[^0-9]/g, '') : '';
    }, [theme.store_whatsapp]);

    const primaryCategory = product.categories?.[0];

    const shortSummary = useMemo(() => {
        if (!product.description) return '';
        const plain = product.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return plain.length > 180 ? `${plain.slice(0, 177)}...` : plain;
    }, [product.description]);

    const productSchema = useMemo(() => {
        return {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.description || product.title,
            image: allImages.map((img) => img.url),
            sku: selectedVariant?.sku || undefined,
            offers: {
                '@type': 'Offer',
                priceCurrency: 'BDT',
                price: currentPrice,
                availability: isCurrentInStock
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                itemCondition: 'https://schema.org/NewCondition',
            },
        };
    }, [product, allImages, selectedVariant, currentPrice, isCurrentInStock]);

    const breadcrumbSchema = useMemo(() => {
        const items = [
            { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
            { '@type': 'ListItem', position: 2, name: 'Shop', item: '/shop' },
        ];

        if (primaryCategory) {
            items.push({
                '@type': 'ListItem',
                position: 3,
                name: primaryCategory.name,
                item: `/category/${primaryCategory.slug}`,
            });
            items.push({
                '@type': 'ListItem',
                position: 4,
                name: product.title,
                item: `/product/${product.slug}`,
            });
        } else {
            items.push({
                '@type': 'ListItem',
                position: 3,
                name: product.title,
                item: `/product/${product.slug}`,
            });
        }

        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: items,
        };
    }, [primaryCategory, product]);

    return (
        <StorefrontLayout theme={theme}>
            <SeoHead
                title={product.title}
                description={product.description?.slice(0, 160) || `Buy ${product.title} at ${theme.store_name}.`}
                canonicalUrl={`/product/${product.slug}`}
                ogType="product"
                ogImage={activeImageUrl || allImages[0]?.url || product.primaryImage?.url}
                productPrice={currentPrice}
                theme={theme}
                jsonLd={[productSchema, breadcrumbSchema]}
            />

            {/* Breadcrumb Navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
                <nav className="flex items-center gap-1.5 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
                    <Link href="/" className="hover:text-heading transition">
                        Home
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <Link href="/shop" className="hover:text-heading transition">
                        Shop
                    </Link>
                    {primaryCategory && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <Link href={`/category/${primaryCategory.slug}`} className="hover:text-heading transition">
                                {primaryCategory.name}
                            </Link>
                        </>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-800 truncate max-w-xs">{product.title}</span>
                </nav>
            </div>

            {/* Product Hero 3-Column Section matching Velure Reference */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
                    {/* Column 1: Vertical Thumbnails + Main Image (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col-reverse sm:flex-row gap-3">
                        {/* Vertical Thumbnail Rail */}
                        {allImages.length > 1 && (
                            <div className="flex sm:flex-col gap-2.5 sm:w-18 shrink-0 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
                                {allImages.map((img) => {
                                    const isSelected = activeImageUrl === img.url;
                                    return (
                                        <button
                                            key={img.id}
                                            type="button"
                                            onClick={() => setActiveImageUrl(img.url)}
                                            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-soft border-2 shrink-0 transition ${
                                                isSelected
                                                    ? 'border-highlight ring-2 ring-highlight/20'
                                                    : 'border-line/80 hover:border-stone-300'
                                            }`}
                                        >
                                            <SafeImage
                                                src={img.thumb_url || img.url}
                                                alt={img.alt_text || product.title}
                                                className="w-full h-full object-cover"
                                                fallbackIconSize="w-4 h-4"
                                                fallbackText=""
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Main Featured Image */}
                        <div className="flex-1 relative aspect-[4/5] bg-soft border border-line/80 rounded-xl overflow-hidden flex items-center justify-center group">
                            <SafeImage
                                src={activeImageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                                fallbackIconSize="w-16 h-16"
                                fallbackText="No Image Available"
                            />

                            {/* Top-right Discount Badge */}
                            {discountPercent > 0 && (
                                <div className="absolute top-3.5 right-3.5 bg-sale text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                    -{discountPercent}%
                                </div>
                            )}

                            {/* Stock Out Badge */}
                            {!isCurrentInStock && (
                                <div className="absolute top-3.5 left-3.5 bg-stone-900/85 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                    Out of Stock
                                </div>
                            )}

                            {/* Bottom-right Expand Button */}
                            <button
                                type="button"
                                onClick={() => setIsLightboxOpen(true)}
                                aria-label="Zoom image"
                                className="absolute bottom-3.5 right-3.5 w-9 h-9 rounded-lg bg-white/90 hover:bg-surface text-stone-700 border border-line/80 flex items-center justify-center transition"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Column 2: Product Info & Actions (4 cols) */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Category / Bestseller Pill */}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-heading text-[11px] font-semibold">
                                <Sparkles className="w-3 h-3" />
                                <span>{primaryCategory ? primaryCategory.name : 'Featured Item'}</span>
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-tight">
                            {product.title}
                        </h1>

                        {/* Short Summary */}
                        {shortSummary && (
                            <p className="text-xs sm:text-sm text-body leading-relaxed">
                                {shortSummary}
                            </p>
                        )}

                        {/* Pricing Row */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            <span className="text-3xl font-bold text-price">
                                {formatBdt(currentPrice)}
                            </span>
                            {salePrice !== null && salePrice < regularPrice && (
                                <>
                                    <span className="text-base text-stone-400 line-through">
                                        {formatBdt(regularPrice)}
                                    </span>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-price border border-orange-200/70">
                                        Save {formatBdt(regularPrice - salePrice)} ({discountPercent}%)
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Combo Pack Mode (`combo_pack_size > 1`) OR Standard Variants Selector */}
                        {isComboProduct ? (
                            <div className="space-y-4 pt-3 border-t border-line/70">
                                {/* 1. `[ + ]` Slot Boxes under Price */}
                                <div className="bg-surface border border-stone-200 rounded-xl p-3.5 space-y-3 shadow-xs">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold text-ink">
                                            পছন্দের {comboPackSize}টি কালার সিলেক্ট করুন (
                                            {comboSlots.filter(Boolean).length}/{comboPackSize})
                                        </span>
                                        {isComboComplete && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> কমপ্লিট
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2.5">
                                        {comboSlots.map((slot, idx) => {
                                            const isActive = activeSlotIndex === idx;
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleOpenComboSlotModal(idx)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            handleOpenComboSlotModal(idx);
                                                        }
                                                    }}
                                                    className={`relative w-18 h-20 sm:w-20 sm:h-22 rounded-xl border-2 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden select-none ${
                                                        slot
                                                            ? 'border-brand/80 bg-white hover:border-brand shadow-2xs'
                                                            : isActive
                                                            ? 'border-dashed border-highlight bg-amber-100/70 hover:bg-amber-100 ring-2 ring-highlight/20'
                                                            : 'border-dashed border-amber-400 bg-amber-100/50 hover:bg-amber-100/80'
                                                    }`}
                                                >
                                                    <span className="absolute top-1 left-1 z-10 w-4 h-4 rounded-full bg-stone-900/75 text-white text-[9px] font-bold flex items-center justify-center">
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
                                                            <span className="w-full px-1 py-0.5 text-[10px] font-bold text-ink text-center truncate bg-white/95 border-t border-stone-100">
                                                                {slot.name}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleClearComboSlot(idx, e)}
                                                                title="Remove color"
                                                                className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700"
                                                            >
                                                                <X className="w-2.5 h-2.5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center gap-1 text-amber-900">
                                                            <div className="w-7 h-7 rounded-full bg-amber-300/60 flex items-center justify-center">
                                                                <Plus className="w-4 h-4 text-amber-950" />
                                                            </div>
                                                            <span className="text-[10px] font-bold">
                                                                + কালার দিন
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[11px] text-stone-500">
                                        উপরের যেকোনো <span className="font-bold text-amber-800">[ + ]</span> বক্সে ক্লিক করে পপআপ থেকে ছবি দেখে পছন্দের কালার সিলেক্ট করুন।
                                    </p>
                                </div>

                                {/* 2. Common Size Selector directly below the `[ + ]` boxes */}
                                {sizeOptions.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-stone-700">
                                            কমন সাইজ সিলেক্ট করুন (Size):{' '}
                                            <span className="font-bold text-ink">
                                                {selectedSize || 'সিলেক্ট করুন'}
                                            </span>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {sizeOptions.map((sz) => {
                                                const isSelected = selectedSize === sz;
                                                return (
                                                    <button
                                                        key={sz}
                                                        type="button"
                                                        onClick={() => handleSelectSize(sz)}
                                                        className={`min-w-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                                                            isSelected
                                                                ? 'bg-brand text-white border-brand shadow-xs'
                                                                : 'bg-surface text-stone-800 border-line hover:border-brand'
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
                        ) : colorOptions.length > 0 && sizeOptions.length > 0 ? (
                            /* 1-Piece Product with Visual Color Swatches + Size Buttons */
                            <div className="space-y-3.5 pt-2 border-t border-line/70">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-stone-700">
                                        Select Color:{' '}
                                        <span className="font-bold text-ink">{selectedSingleColor}</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {colorOptions.map((c) => {
                                            const isSelected = selectedSingleColor === c.name;
                                            return (
                                                <button
                                                    key={c.name}
                                                    type="button"
                                                    onClick={() => handleSelectSingleColor(c)}
                                                    className={`flex items-center gap-2 pr-3 pl-1.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                                                        isSelected
                                                            ? 'border-brand bg-emerald-50/60 text-ink ring-1 ring-brand'
                                                            : 'border-line bg-surface text-stone-800 hover:border-brand'
                                                    }`}
                                                >
                                                    <span className="w-7 h-7 rounded-md overflow-hidden bg-soft border border-stone-200 shrink-0">
                                                        <SafeImage
                                                            src={c.imageUrl}
                                                            alt={c.name}
                                                            className="w-full h-full object-cover"
                                                            fallbackIconSize="w-3 h-3"
                                                            fallbackText=""
                                                        />
                                                    </span>
                                                    <span>{c.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-stone-700">
                                        Select Size:{' '}
                                        <span className="font-bold text-ink">{selectedSize}</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {sizeOptions.map((sz) => {
                                            const isSelected = selectedSize === sz;
                                            return (
                                                <button
                                                    key={sz}
                                                    type="button"
                                                    onClick={() => handleSelectSize(sz)}
                                                    className={`min-w-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                                                        isSelected
                                                            ? 'bg-brand text-white border-brand'
                                                            : 'bg-surface text-stone-800 border-line hover:border-brand'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                    <span>{sz}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            product.variants &&
                            product.variants.length > 1 && (
                                <div className="space-y-2.5 pt-2 border-t border-line/70">
                                    <label className="block text-xs font-semibold text-stone-700">
                                        Select Option:{' '}
                                        <span className="font-bold text-ink">{selectedVariant.name}</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants.map((v) => {
                                            const isSelected = selectedVariant.id === v.id;
                                            const isOutOfStock = v.manage_stock && v.stock_quantity <= 0;

                                            return (
                                                <button
                                                    key={v.id}
                                                    type="button"
                                                    disabled={isOutOfStock}
                                                    onClick={() => handleVariantSelect(v)}
                                                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border ${
                                                        isSelected
                                                            ? 'bg-brand text-white border-brand'
                                                            : isOutOfStock
                                                            ? 'bg-stone-100 text-stone-400 border-line line-through cursor-not-allowed'
                                                            : 'bg-surface text-stone-800 border-line hover:border-brand'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                    <span>{v.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        )}

                        {/* Quantity & Stock Row */}
                        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-line/70">
                            <span className="text-xs font-semibold text-stone-700">Quantity:</span>
                            <div className="inline-flex items-center border border-line rounded-lg bg-surface overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange(-1)}
                                    disabled={quantity <= 1 || !isCurrentInStock}
                                    className="w-9 h-9 flex items-center justify-center text-body hover:bg-stone-100 disabled:opacity-40 transition"
                                    aria-label="Decrease quantity"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-4 text-xs font-bold text-ink min-w-[40px] text-center">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange(1)}
                                    disabled={quantity >= maxStock || !isCurrentInStock}
                                    className="w-9 h-9 flex items-center justify-center text-body hover:bg-stone-100 disabled:opacity-40 transition"
                                    aria-label="Increase quantity"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {isCurrentInStock ? (
                                <span className="text-xs font-semibold text-heading">
                                    In Stock
                                    {selectedVariant?.manage_stock
                                        ? ` (${selectedVariant.stock_quantity} pcs)`
                                        : ''}
                                </span>
                            ) : (
                                <span className="text-xs font-semibold text-rose-600">Out of Stock</span>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2.5 pt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={!isCurrentInStock || isAddingToCart}
                                    className="flex items-center justify-center gap-2 h-11 px-4 bg-cta hover:bg-cta-hover text-cta-text rounded-lg font-semibold text-xs sm:text-sm transition disabled:opacity-60"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleWishlistToggle}
                                    className={`flex items-center justify-center gap-2 h-11 px-4 rounded-lg font-semibold text-xs sm:text-sm border transition ${
                                        wishlistAdded
                                            ? 'bg-orange-50 border-highlight text-price'
                                            : 'bg-surface hover:bg-page border-stone-300 text-stone-800 hover:border-brand'
                                    }`}
                                >
                                    <Heart className={`w-4 h-4 ${wishlistAdded ? 'fill-highlight text-highlight' : ''}`} />
                                    <span>Add to Wishlist</span>
                                </button>
                            </div>

                            {/* Direct COD Order Button */}
                            <Link
                                href={buyNowUrl}
                                onClick={handleOrderNow}
                                className={`flex items-center justify-center gap-2 w-full h-11 px-4 rounded-lg font-semibold text-xs sm:text-sm transition ${
                                    isCurrentInStock
                                        ? 'bg-brand hover:bg-brand-hover text-white'
                                        : 'bg-stone-200 text-stone-400 pointer-events-none'
                                }`}
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span>Order Now — Cash on Delivery ({formatBdt(currentPrice * quantity)})</span>
                            </Link>

                            {theme.store_whatsapp && (
                                <a
                                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                                        `Hello, I would like to order "${product.title}".`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-2 h-10 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition"
                                >
                                    <span>Order via WhatsApp</span>
                                </a>
                            )}
                        </div>

                        {/* Cart Error / Toast */}
                        {cartError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                                <span>{cartError}</span>
                            </div>
                        )}

                        {cartToast && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Added to cart!
                                </span>
                                <Link href={buyNowUrl} className="underline text-emerald-900 font-bold">
                                    Checkout →
                                </Link>
                            </div>
                        )}

                        {/* Compact 3-Column Trust Strip */}
                        <div className="bg-surface border border-line/80 rounded-xl p-3 grid grid-cols-3 gap-2 text-[11px]">
                            <div className="flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-highlight shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">Fast Delivery</p>
                                    <p className="text-[10px] text-gray-500 truncate">All over BD</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <RefreshCw className="w-4 h-4 text-highlight shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">Easy Return</p>
                                    <p className="text-[10px] text-gray-500 truncate">
                                        {deliveryInfo.return_policy_days} days return
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-highlight shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">Secure Pay</p>
                                    <p className="text-[10px] text-gray-500 truncate">100% secure</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Why Shop + Product Details Sidebar (3 cols) */}
                    <div className="lg:col-span-3 space-y-5">
                        {/* Why Shop Card */}
                        <div className="bg-surface rounded-2xl border border-line/80 p-5 space-y-4">
                            <h3 className="font-serif text-base font-bold text-gray-900 border-b border-stone-100 pb-2.5">
                                Why Shop at {theme.store_name}?
                            </h3>

                            <div className="space-y-3.5 text-xs">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-heading flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">100% Authentic Product</p>
                                        <p className="text-gray-500 text-[11px]">Genuine &amp; high-quality items</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-heading flex items-center justify-center shrink-0">
                                        <Truck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Fast Delivery</p>
                                        <p className="text-gray-500 text-[11px]">
                                            Inside Dhaka ৳{deliveryInfo.inside_dhaka_fee} • Outside ৳
                                            {deliveryInfo.outside_dhaka_fee}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-heading flex items-center justify-center shrink-0">
                                        <RefreshCw className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Easy Return</p>
                                        <p className="text-gray-500 text-[11px]">
                                            {deliveryInfo.return_policy_days} days hassle-free return
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-heading flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Cash on Delivery</p>
                                        <p className="text-gray-500 text-[11px]">Inspect before paying</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Product Details Card */}
                        <div className="bg-surface rounded-2xl border border-line/80 p-5">
                            <button
                                type="button"
                                onClick={() => setIsDetailsOpen((prev) => !prev)}
                                className="w-full flex items-center justify-between font-serif text-base font-bold text-gray-900"
                            >
                                <span>Product Details</span>
                                {isDetailsOpen ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                            </button>

                            {isDetailsOpen && (
                                <dl className="mt-3 pt-3 border-t border-stone-100 space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-gray-500">SKU</dt>
                                        <dd className="font-medium text-gray-900 font-mono">
                                            {selectedVariant?.sku || 'N/A'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-gray-500">Category</dt>
                                        <dd className="font-medium text-gray-900">
                                            {primaryCategory?.name || 'General'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-gray-500">Status</dt>
                                        <dd className="font-medium text-heading">
                                            {isCurrentInStock ? 'In Stock' : 'Out of Stock'}
                                        </dd>
                                    </div>
                                    {selectedVariant?.attributes &&
                                        Object.entries(selectedVariant.attributes).map(([k, val]) => (
                                            <div key={k} className="flex items-center justify-between gap-3">
                                                <dt className="text-gray-500 capitalize">{k}</dt>
                                                <dd className="font-medium text-gray-900">{val}</dd>
                                            </div>
                                        ))}
                                </dl>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Tabs: Description, Specifications, Delivery Policy */}
                <div className="mt-12 bg-surface rounded-2xl border border-line/80 p-6 sm:p-8">
                    <div className="flex items-center gap-6 border-b border-line text-xs sm:text-sm font-semibold overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('desc')}
                            className={`pb-3 border-b-2 transition whitespace-nowrap ${
                                activeTab === 'desc'
                                    ? 'border-highlight text-price'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Description
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('specs')}
                            className={`pb-3 border-b-2 transition whitespace-nowrap ${
                                activeTab === 'specs'
                                    ? 'border-highlight text-price'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Specifications
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('delivery')}
                            className={`pb-3 border-b-2 transition whitespace-nowrap ${
                                activeTab === 'delivery'
                                    ? 'border-highlight text-price'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Delivery &amp; Return Policy
                        </button>
                    </div>

                    <div className="pt-6 text-xs sm:text-sm text-gray-700 leading-relaxed max-w-4xl">
                        {activeTab === 'desc' && (
                            <div>
                                {product.description ? (
                                    /<[a-z][\s\S]*>/i.test(product.description) ? (
                                        <div
                                            className="prose prose-stone max-w-none text-gray-700 leading-relaxed prose-p:my-2 prose-headings:text-gray-900 prose-ul:my-2 prose-ol:my-2"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    ) : (
                                        <p className="whitespace-pre-line">{product.description}</p>
                                    )
                                ) : (
                                    <p className="text-gray-400 italic">No additional description provided.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'specs' && (
                            <div className="border border-line rounded-xl overflow-hidden">
                                <table className="min-w-full divide-y divide-line text-left text-xs sm:text-sm">
                                    <tbody className="divide-y divide-stone-100">
                                        <tr className="bg-page">
                                            <th className="px-5 py-3 font-semibold text-gray-600 w-1/3">SKU</th>
                                            <td className="px-5 py-3 text-gray-900 font-mono">
                                                {selectedVariant?.sku || 'N/A'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className="px-5 py-3 font-semibold text-gray-600">Category</th>
                                            <td className="px-5 py-3 text-gray-900">
                                                {primaryCategory?.name || 'General'}
                                            </td>
                                        </tr>
                                        <tr className="bg-page">
                                            <th className="px-5 py-3 font-semibold text-gray-600">Availability</th>
                                            <td className="px-5 py-3 text-gray-900">
                                                {isCurrentInStock ? 'In Stock' : 'Out of Stock'}
                                            </td>
                                        </tr>
                                        {selectedVariant?.attributes &&
                                            Object.entries(selectedVariant.attributes).map(([k, val]) => (
                                                <tr key={k}>
                                                    <th className="px-5 py-3 font-semibold text-gray-600 capitalize">
                                                        {k}
                                                    </th>
                                                    <td className="px-5 py-3 text-gray-900">{val}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'delivery' && (
                            <div className="space-y-2.5 text-xs sm:text-sm text-gray-600">
                                <p className="font-bold text-gray-900">Delivery &amp; Return Guidelines:</p>
                                <ul className="list-disc list-inside space-y-1.5 pl-1">
                                    <li>
                                        Inside Dhaka delivery within 24–48 hours (Fee: ৳
                                        {deliveryInfo.inside_dhaka_fee}).
                                    </li>
                                    <li>
                                        Outside Dhaka nationwide delivery within 48–72 hours (Fee: ৳
                                        {deliveryInfo.outside_dhaka_fee}).
                                    </li>
                                    <li>Cash on Delivery available — inspect your parcel before payment.</li>
                                    <li>
                                        {deliveryInfo.return_policy_days}-day hassle-free return and replacement on
                                        eligible items.
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* You Might Also Like */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="mt-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
                                You Might Also Like
                            </h2>
                            <Link
                                href="/shop"
                                className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-highlight transition"
                            >
                                View All →
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                            {relatedProducts.slice(0, 4).map((rel) => (
                                <ProductCard key={rel.id} product={rel} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Sticky Add-to-Cart & Order Bar */}
            <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-xs border-t border-line px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-sm">
                <div className="min-w-0">
                    <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Total Price</p>
                    <p className="text-base font-bold text-price truncate">
                        {formatBdt(currentPrice * quantity)}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!isCurrentInStock || isAddingToCart}
                        className="h-10 px-3.5 rounded-lg bg-cta hover:bg-cta-hover text-cta-text text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
                    </button>
                    <Link
                        href={buyNowUrl}
                        onClick={handleOrderNow}
                        className={`h-10 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            isCurrentInStock
                                ? 'bg-brand hover:bg-brand-hover text-white'
                                : 'bg-stone-200 text-stone-400 pointer-events-none'
                        }`}
                    >
                        <span>Order Now</span>
                    </Link>
                </div>
            </div>

            {/* Combo Slot Color Picker Popup Modal */}
            {isComboProduct && isComboModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setIsComboModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-surface shrink-0 shadow-2xs">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-ink">
                                    বক্স #{activeSlotIndex + 1}-এর জন্য কালার সিলেক্ট করুন
                                </h3>
                                <p className="text-xs text-stone-500 mt-0.5">
                                    যেকোনো ছবির উপর ক্লিক করলে বক্স #{activeSlotIndex + 1}-এ অ্যাড হয়ে যাবে
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsComboModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body: Grid of Color Images & Names */}
                        <div className="relative z-10 p-5 max-h-[70vh] overflow-y-auto isolate">
                            {colorOptions.length === 0 ? (
                                <div className="text-center py-8 text-xs text-stone-500">
                                    কোনো কালার অপশন পাওয়া যায়নি।
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                                    {colorOptions.map((c) => {
                                        const isPickedInActiveSlot =
                                            comboSlots[activeSlotIndex]?.name === c.name;
                                        return (
                                            <button
                                                key={c.name}
                                                type="button"
                                                onClick={() => handlePickComboColor(c)}
                                                className={`group relative flex flex-col items-center rounded-xl border-2 p-2 transition text-left cursor-pointer ${
                                                    isPickedInActiveSlot
                                                        ? 'border-brand bg-emerald-50/50 ring-2 ring-brand/20'
                                                        : 'border-stone-200 bg-white hover:border-highlight hover:shadow-md'
                                                }`}
                                            >
                                                <div className="w-full aspect-square rounded-lg overflow-hidden bg-soft mb-2 border border-stone-100">
                                                    <SafeImage
                                                        src={c.imageUrl}
                                                        alt={c.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                        fallbackIconSize="w-6 h-6"
                                                        fallbackText=""
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-ink truncate w-full text-center">
                                                    {c.name}
                                                </span>
                                                <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-brand">
                                                    <Plus className="w-3 h-3" /> সিলেক্ট করুন
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Zoom Lightbox */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsLightboxOpen(false)}
                        aria-label="Close zoom"
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <img
                        src={activeImageUrl}
                        alt={product.title}
                        className="max-w-full max-h-[88vh] rounded-xl object-contain shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </StorefrontLayout>
    );
}
