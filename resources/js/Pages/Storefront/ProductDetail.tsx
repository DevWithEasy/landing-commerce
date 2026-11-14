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

export default function ProductDetail({
    product,
    relatedProducts,
    deliveryInfo,
    theme,
}: StorefrontProductProps) {
    // 1. Available Variants
    const availableVariants = useMemo(() => {
        return product.variants.filter((v) => !v.manage_stock || v.stock_quantity > 0);
    }, [product.variants]);

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(() => {
        return availableVariants[0] || product.variants[0];
    });

    // 2. Quantity
    const [quantity, setQuantity] = useState(1);

    // 3. Active Image in Gallery & Lightbox
    const allImages = useMemo<ProductImage[]>(() => {
        const list = [...(product.images || [])];
        if (list.length === 0 && product.primaryImage) {
            list.push(product.primaryImage);
        }
        return list;
    }, [product.images, product.primaryImage]);

    const [activeImageUrl, setActiveImageUrl] = useState<string>(() => {
        return (
            selectedVariant?.images?.[0]?.url ||
            product.primaryImage?.url ||
            allImages[0]?.url ||
            '/placeholder.png'
        );
    });
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // When variant changes, update image if that variant has an assigned image
    const handleVariantSelect = (variant: ProductVariant) => {
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

    // 6. Direct Order URL into Unified Checkout
    const buyNowUrl = selectedVariant
        ? `/checkout/${product.slug}?variant=${selectedVariant.id}&quantity=${quantity}`
        : `/checkout/${product.slug}?quantity=${quantity}`;

    const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'delivery'>('desc');
    const [isDetailsOpen, setIsDetailsOpen] = useState(true);
    const [cartToast, setCartToast] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [cartError, setCartError] = useState<string | null>(null);
    const [wishlistAdded, setWishlistAdded] = useState(false);

    const handleAddToCart = async () => {
        if (!selectedVariant || isAddingToCart) return;
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
                    <Link href="/" className="hover:text-[#0B3B2E] transition">
                        Home
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <Link href="/shop" className="hover:text-[#0B3B2E] transition">
                        Shop
                    </Link>
                    {primaryCategory && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <Link href={`/category/${primaryCategory.slug}`} className="hover:text-[#0B3B2E] transition">
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
                                            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-[#F6F3EE] border-2 shrink-0 transition ${
                                                isSelected
                                                    ? 'border-[#F96D16] ring-2 ring-[#F96D16]/20'
                                                    : 'border-stone-200/80 hover:border-stone-300'
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
                        <div className="flex-1 relative aspect-[4/5] bg-[#F3EDE4] border border-stone-200/80 rounded-xl overflow-hidden flex items-center justify-center group">
                            <SafeImage
                                src={activeImageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                                fallbackIconSize="w-16 h-16"
                                fallbackText="No Image Available"
                            />

                            {/* Top-right Discount Badge */}
                            {discountPercent > 0 && (
                                <div className="absolute top-3.5 right-3.5 bg-[#F96D16] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
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
                                className="absolute bottom-3.5 right-3.5 w-9 h-9 rounded-lg bg-white/90 hover:bg-white text-stone-700 border border-stone-200/80 flex items-center justify-center transition"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Column 2: Product Info & Actions (4 cols) */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Category / Bestseller Pill */}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#0B3B2E] text-[11px] font-semibold">
                                <Sparkles className="w-3 h-3" />
                                <span>{primaryCategory ? primaryCategory.name : 'Featured Item'}</span>
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                            {product.title}
                        </h1>

                        {/* Short Summary */}
                        {shortSummary && (
                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                                {shortSummary}
                            </p>
                        )}

                        {/* Pricing Row */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            <span className="text-3xl font-bold text-[#EA580C]">
                                {formatBdt(currentPrice)}
                            </span>
                            {salePrice !== null && salePrice < regularPrice && (
                                <>
                                    <span className="text-base text-stone-400 line-through">
                                        {formatBdt(regularPrice)}
                                    </span>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-[#EA580C] border border-orange-200/70">
                                        Save {formatBdt(regularPrice - salePrice)} ({discountPercent}%)
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Variants Selector */}
                        {product.variants && product.variants.length > 1 && (
                            <div className="space-y-2.5 pt-2 border-t border-stone-200/70">
                                <label className="block text-xs font-semibold text-stone-700">
                                    Select Option:{' '}
                                    <span className="font-bold text-stone-900">{selectedVariant.name}</span>
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
                                                        ? 'bg-[#0B3B2E] text-white border-[#0B3B2E]'
                                                        : isOutOfStock
                                                        ? 'bg-stone-100 text-stone-400 border-stone-200 line-through cursor-not-allowed'
                                                        : 'bg-white text-stone-800 border-stone-200 hover:border-[#0B3B2E]'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3" />}
                                                <span>{v.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quantity & Stock Row */}
                        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-stone-200/70">
                            <span className="text-xs font-semibold text-stone-700">Quantity:</span>
                            <div className="inline-flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange(-1)}
                                    disabled={quantity <= 1 || !isCurrentInStock}
                                    className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition"
                                    aria-label="Decrease quantity"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-4 text-xs font-bold text-stone-900 min-w-[40px] text-center">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange(1)}
                                    disabled={quantity >= maxStock || !isCurrentInStock}
                                    className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition"
                                    aria-label="Increase quantity"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {isCurrentInStock ? (
                                <span className="text-xs font-semibold text-[#0B3B2E]">
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
                                    className="flex items-center justify-center gap-2 h-11 px-4 bg-[#F96D16] hover:bg-[#EA580C] text-white rounded-lg font-semibold text-xs sm:text-sm transition disabled:opacity-60"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleWishlistToggle}
                                    className={`flex items-center justify-center gap-2 h-11 px-4 rounded-lg font-semibold text-xs sm:text-sm border transition ${
                                        wishlistAdded
                                            ? 'bg-orange-50 border-[#F96D16] text-[#EA580C]'
                                            : 'bg-white hover:bg-[#FAF7F2] border-stone-300 text-stone-800 hover:border-[#0B3B2E]'
                                    }`}
                                >
                                    <Heart className={`w-4 h-4 ${wishlistAdded ? 'fill-[#F96D16] text-[#F96D16]' : ''}`} />
                                    <span>Add to Wishlist</span>
                                </button>
                            </div>

                            {/* Direct COD Order Button */}
                            <Link
                                href={buyNowUrl}
                                className={`flex items-center justify-center gap-2 w-full h-11 px-4 rounded-lg font-semibold text-xs sm:text-sm transition ${
                                    isCurrentInStock
                                        ? 'bg-[#0B3B2E] hover:bg-[#082B21] text-white'
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
                        <div className="bg-white border border-stone-200/80 rounded-xl p-3 grid grid-cols-3 gap-2 text-[11px]">
                            <div className="flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-[#F96D16] shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">Fast Delivery</p>
                                    <p className="text-[10px] text-gray-500 truncate">All over BD</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <RefreshCw className="w-4 h-4 text-[#F96D16] shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">Easy Return</p>
                                    <p className="text-[10px] text-gray-500 truncate">
                                        {deliveryInfo.return_policy_days} days return
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-[#F96D16] shrink-0" />
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
                        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-4">
                            <h3 className="font-serif text-base font-bold text-gray-900 border-b border-stone-100 pb-2.5">
                                Why Shop at {theme.store_name}?
                            </h3>

                            <div className="space-y-3.5 text-xs">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0B3B2E] flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">100% Authentic Product</p>
                                        <p className="text-gray-500 text-[11px]">Genuine &amp; high-quality items</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0B3B2E] flex items-center justify-center shrink-0">
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
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0B3B2E] flex items-center justify-center shrink-0">
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
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0B3B2E] flex items-center justify-center shrink-0">
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
                        <div className="bg-white rounded-2xl border border-stone-200/80 p-5">
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
                                        <dd className="font-medium text-[#0B3B2E]">
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
                <div className="mt-12 bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8">
                    <div className="flex items-center gap-6 border-b border-stone-200 text-xs sm:text-sm font-semibold overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('desc')}
                            className={`pb-3 border-b-2 transition whitespace-nowrap ${
                                activeTab === 'desc'
                                    ? 'border-[#F96D16] text-[#EA580C]'
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
                                    ? 'border-[#F96D16] text-[#EA580C]'
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
                                    ? 'border-[#F96D16] text-[#EA580C]'
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
                            <div className="border border-stone-200 rounded-xl overflow-hidden">
                                <table className="min-w-full divide-y divide-stone-200 text-left text-xs sm:text-sm">
                                    <tbody className="divide-y divide-stone-100">
                                        <tr className="bg-[#FAF7F2]">
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
                                        <tr className="bg-[#FAF7F2]">
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
                            <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
                                You Might Also Like
                            </h2>
                            <Link
                                href="/shop"
                                className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-[#F96D16] transition"
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
            <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-xs border-t border-stone-200 px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-sm">
                <div className="min-w-0">
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">Total Price</p>
                    <p className="text-base font-bold text-[#EA580C] truncate">
                        {formatBdt(currentPrice * quantity)}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!isCurrentInStock || isAddingToCart}
                        className="h-10 px-3.5 rounded-lg bg-[#F96D16] hover:bg-[#EA580C] text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
                    </button>
                    <Link
                        href={buyNowUrl}
                        className={`h-10 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            isCurrentInStock
                                ? 'bg-[#0B3B2E] hover:bg-[#082B21] text-white'
                                : 'bg-stone-200 text-stone-400 pointer-events-none'
                        }`}
                    >
                        <span>Order Now</span>
                    </Link>
                </div>
            </div>

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
