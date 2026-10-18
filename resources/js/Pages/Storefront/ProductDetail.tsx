import { Head, Link } from '@inertiajs/react';
import {
    Check,
    CheckCircle2,
    ChevronRight,
    Minus,
    Plus,
    RefreshCw,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Truck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import { ProductCard, formatBdt } from '@/Shared/ProductCard';
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

    // 3. Active Image in Gallery
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
    const [cartToast, setCartToast] = useState(false);

    const handleAddToCart = () => {
        setCartToast(true);
        setTimeout(() => setCartToast(false), 3000);
    };

    const cleanWhatsapp = useMemo(() => {
        return theme.store_whatsapp ? theme.store_whatsapp.replace(/[^0-9]/g, '') : '';
    }, [theme.store_whatsapp]);

    const primaryCategory = product.categories?.[0];

    return (
        <StorefrontLayout theme={theme}>
            <Head title={`${product.title} - ${theme.store_name}`} />

            {/* Breadcrumb Navigation */}
            <div className="bg-white border-b border-gray-200 py-4 px-4">
                <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
                    <Link href="/" className="hover:text-indigo-600 transition">হোম</Link>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <Link href="/shop" className="hover:text-indigo-600 transition">শপ</Link>
                    {primaryCategory && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <Link href={`/category/${primaryCategory.slug}`} className="hover:text-indigo-600 transition">
                                {primaryCategory.name}
                            </Link>
                        </>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-gray-900 truncate max-w-xs">{product.title}</span>
                </div>
            </div>

            {/* Product Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
                    {/* Left Column: Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Featured Image with Zoom */}
                        <div className="relative aspect-square bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex items-center justify-center group">
                            <img
                                src={activeImageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />

                            {/* Discount Badge */}
                            {discountPercent > 0 && (
                                <div className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                                    {discountPercent}% ছাড়
                                </div>
                            )}

                            {/* Stock Badge */}
                            {!isCurrentInStock && (
                                <div className="absolute top-4 right-4 bg-gray-950/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                                    স্টক আউট
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Rail */}
                        {allImages.length > 1 && (
                            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                                {allImages.map((img) => {
                                    const isSelected = activeImageUrl === img.url;
                                    return (
                                        <button
                                            key={img.id}
                                            type="button"
                                            onClick={() => setActiveImageUrl(img.url)}
                                            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition ${
                                                isSelected
                                                    ? 'border-indigo-600 shadow-md ring-2 ring-indigo-100'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <img
                                                src={img.thumb_url || img.url}
                                                alt={img.alt_text || product.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details & Buying Actions */}
                    <div className="space-y-6">
                        <div>
                            {primaryCategory && (
                                <Link
                                    href={`/category/${primaryCategory.slug}`}
                                    className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:underline"
                                >
                                    {primaryCategory.name}
                                </Link>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1 leading-snug">
                                {product.title}
                            </h1>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-baseline gap-3 p-4 bg-indigo-50/50 border border-indigo-100/80 rounded-2xl">
                            <span className="text-3xl sm:text-4xl font-black text-indigo-600">
                                {formatBdt(currentPrice)}
                            </span>
                            {salePrice !== null && salePrice < regularPrice && (
                                <>
                                    <span className="text-base sm:text-lg text-gray-400 line-through">
                                        {formatBdt(regularPrice)}
                                    </span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                        সাশ্রয় {formatBdt(regularPrice - salePrice)}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Stock Availability Indicator */}
                        <div className="flex items-center gap-2 text-xs font-bold">
                            {isCurrentInStock ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    স্টকে উপলব্ধ আছে (ইন স্টক)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                                    বর্তমানে স্টক শেষ
                                </span>
                            )}
                        </div>

                        {/* Generic Variant Swatches */}
                        {product.variants && product.variants.length > 1 && (
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                                    ভেরিয়েন্ট নির্বাচন করুন: <span className="text-gray-900 font-semibold">{selectedVariant.name}</span>
                                </label>
                                <div className="flex flex-wrap gap-2.5">
                                    {product.variants.map((v) => {
                                        const isSelected = selectedVariant.id === v.id;
                                        const isOutOfStock = v.manage_stock && v.stock_quantity <= 0;

                                        return (
                                            <button
                                                key={v.id}
                                                type="button"
                                                disabled={isOutOfStock}
                                                onClick={() => handleVariantSelect(v)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                                                        : isOutOfStock
                                                        ? 'bg-gray-100 text-gray-400 border-gray-200 line-through cursor-not-allowed'
                                                        : 'bg-white text-gray-800 border-gray-300 hover:border-indigo-400'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                                <span>{v.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quantity Stepper */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                                পরিমাণ (Quantity)
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => handleQuantityChange(-1)}
                                        disabled={quantity <= 1 || !isCurrentInStock}
                                        className="p-2.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="px-4 py-2 text-sm font-bold text-gray-900 min-w-[48px] text-center">
                                        {quantity}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleQuantityChange(1)}
                                        disabled={quantity >= maxStock || !isCurrentInStock}
                                        className="p-2.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <span className="text-xs text-gray-500 font-medium">
                                    মোট: <strong className="text-indigo-600 font-black">{formatBdt(currentPrice * quantity)}</strong>
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons: Buy Now & Add to Cart */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                            <Link
                                href={buyNowUrl}
                                className={`flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition shadow-lg transform hover:-translate-y-0.5 ${
                                    isCurrentInStock
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                        : 'bg-gray-300 text-gray-500 pointer-events-none'
                                }`}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span>সরাসরি অর্ডার করুন (Buy Now)</span>
                            </Link>

                            <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={!isCurrentInStock}
                                className="flex items-center justify-center gap-2 py-4 px-6 bg-white hover:bg-gray-50 text-indigo-700 border-2 border-indigo-600 rounded-2xl font-black text-sm transition"
                            >
                                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                                <span>কার্টে যোগ করুন</span>
                            </button>
                        </div>

                        {/* Direct WhatsApp Order CTA */}
                        {theme.store_whatsapp && (
                            <a
                                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                                    `হ্যালো, আমি "${product.title}" পণ্যটি অর্ডার করতে চাই।`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-sm"
                            >
                                <span>WhatsApp-এ সরাসরি অর্ডার করুন</span>
                            </a>
                        )}

                        {/* Toast Alert */}
                        {cartToast && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    পণ্যটি কার্টে সফলভাবে যোগ হয়েছে!
                                </span>
                                <Link href={buyNowUrl} className="underline text-emerald-900 font-bold">
                                    চেকআউটে যান
                                </Link>
                            </div>
                        )}

                        {/* Delivery & Trust Highlights */}
                        <div className="p-5 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                ডেলিভারি ও পেমেন্ট তথ্য
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
                                <div className="flex items-start gap-2">
                                    <Truck className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">ঢাকা সিটি: ৳{deliveryInfo.inside_dhaka_fee}</p>
                                        <p className="text-gray-500 text-[11px]">২৪ থেকে ৪৮ ঘণ্টার মধ্যে</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Truck className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">ঢাকার বাইরে: ৳{deliveryInfo.outside_dhaka_fee}</p>
                                        <p className="text-gray-500 text-[11px]">৪৮ থেকে ৭২ ঘণ্টার মধ্যে</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">ক্যাশ অন ডেলিভারি</p>
                                        <p className="text-gray-500 text-[11px]">পণ্য দেখে টাকা দেওয়ার সুবিধা</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <RefreshCw className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">{deliveryInfo.return_policy_days} দিনের রিটার্ন</p>
                                        <p className="text-gray-500 text-[11px]">সহজ রিটার্ন ও রিপ্লেসমেন্ট</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabbed Content: Description, Specifications, Policies */}
                <div className="mt-14 pt-10 border-t border-gray-200">
                    <div className="flex items-center gap-4 border-b border-gray-200 text-sm font-bold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('desc')}
                            className={`pb-3 px-2 border-b-2 transition ${
                                activeTab === 'desc'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            বিবরণ (Description)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('specs')}
                            className={`pb-3 px-2 border-b-2 transition ${
                                activeTab === 'specs'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            স্পেসিফিকেশন (Specifications)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('delivery')}
                            className={`pb-3 px-2 border-b-2 transition ${
                                activeTab === 'delivery'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            ডেলিভারি পলিসি
                        </button>
                    </div>

                    <div className="py-6 text-sm text-gray-700 leading-relaxed max-w-4xl">
                        {activeTab === 'desc' && (
                            <div className="space-y-4">
                                {product.description ? (
                                    <p className="whitespace-pre-line">{product.description}</p>
                                ) : (
                                    <p className="text-gray-400 italic">কোনো অতিরিক্ত বিবরণ যোগ করা হয়নি।</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'specs' && (
                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200 text-left text-xs sm:text-sm">
                                    <tbody className="divide-y divide-gray-100">
                                        <tr className="bg-gray-50/60">
                                            <th className="px-5 py-3 font-semibold text-gray-500 w-1/3">পণ্য কোড (SKU)</th>
                                            <td className="px-5 py-3 text-gray-900 font-mono">{selectedVariant.sku || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th className="px-5 py-3 font-semibold text-gray-500">ক্যাটাগরি</th>
                                            <td className="px-5 py-3 text-gray-900">{primaryCategory?.name || 'সাধারণ'}</td>
                                        </tr>
                                        <tr className="bg-gray-50/60">
                                            <th className="px-5 py-3 font-semibold text-gray-500">স্টক অবস্থা</th>
                                            <td className="px-5 py-3 text-gray-900">
                                                {isCurrentInStock ? 'ইন স্টক (In Stock)' : 'স্টক আউট'}
                                            </td>
                                        </tr>
                                        {selectedVariant.attributes &&
                                            Object.entries(selectedVariant.attributes).map(([k, val]) => (
                                                <tr key={k}>
                                                    <th className="px-5 py-3 font-semibold text-gray-500">{k}</th>
                                                    <td className="px-5 py-3 text-gray-900">{val}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'delivery' && (
                            <div className="space-y-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-xs sm:text-sm text-gray-600">
                                <p className="font-bold text-gray-900">ডেলিভারি সংক্রান্ত নিয়মাবলী:</p>
                                <ul className="list-disc list-inside space-y-1.5 pl-2">
                                    <li>ঢাকা সিটির অভ্যন্তরে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়।</li>
                                    <li>ঢাকা সিটির বাইরে সমগ্র বাংলাদেশে ৪৮ থেকে ৭২ ঘণ্টার মধ্যে ডেলিভারি পৌঁছায়।</li>
                                    <li>ডেলিভারিম্যানের উপস্থিতিতে পণ্যটি চেক করে রিসিভ করুন।</li>
                                    <li>কোনো ত্রুটি বা অসঙ্গতি পরিলক্ষিত হলে সাথে সাথে আমাদের কাস্টমার সার্ভিসে জানান।</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products Grid */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="mt-16 pt-12 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                সম্পর্কিত অন্যান্য পণ্য
                            </h2>
                            <Link
                                href="/shop"
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                            >
                                আরও দেখুন &rarr;
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                            {relatedProducts.map((rel) => (
                                <ProductCard key={rel.id} product={rel} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
