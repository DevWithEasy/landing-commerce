import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Heart, Package, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CustomerLayout } from '@/Layouts/CustomerLayout';
import { formatBdt } from '@/Shared/ProductCard';
import type { Category, PaginatedData, WishlistItem } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface WishlistProps {
    theme: StorefrontTheme;
    categories: Category[];
    wishlist: PaginatedData<WishlistItem>;
}

export default function CustomerWishlist({ theme, categories, wishlist }: WishlistProps) {
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [addingToCartId, setAddingToCartId] = useState<number | null>(null);

    const handleRemove = (id: number) => {
        setRemovingId(id);
        router.delete(`/customer/wishlist/${id}`, {
            preserveScroll: true,
            onFinish: () => setRemovingId(null),
        });
    };

    const handleAddToCart = (item: WishlistItem) => {
        setAddingToCartId(item.id);
        router.post(
            '/cart/items',
            {
                product_id: item.product_id,
                variant_id: item.variant_id ?? null,
                quantity: 1,
            },
            {
                preserveScroll: true,
                onFinish: () => setAddingToCartId(null),
            }
        );
    };

    return (
        <CustomerLayout theme={theme} categories={categories} title="আমার উইশলিস্ট | My Wishlist">
            <Head>
                <title>আমার উইশলিস্ট | My Wishlist</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                            <span>আমার সংরক্ষিত পণ্যসমূহ (Wishlist)</span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            মোট {wishlist.total} টি পছন্দের পণ্য সংরক্ষিত রয়েছে
                        </p>
                    </div>

                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition self-start sm:self-auto border border-gray-200"
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>আরও পণ্য ব্রাউজ করুন</span>
                    </Link>
                </div>

                {wishlist.data.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-400 mb-3">
                            <Heart className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm">আপনার উইশলিস্ট খালি</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            আপনি এখনও কোনো পছন্দের পণ্য উইশলিস্টে যুক্ত করেননি। স্টোর ভিজিট করে আপনার প্রিয় পণ্যগুলো সংরক্ষণ করুন।
                        </p>
                        <Link
                            href="/shop"
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>শপ পেজে যান</span>
                        </Link>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {wishlist.data.map((item) => {
                                const product = item.product;
                                if (!product) return null;

                                const primaryImg = product.primaryImage || product.images?.find((img) => img.is_primary) || product.images?.[0];
                                const imgUrl = primaryImg ? `/storage/${primaryImg.file_path}` : null;
                                const isUnavailable = product.status !== 'active';

                                const currentPrice = item.variant
                                    ? (item.variant.sale_price ?? item.variant.regular_price)
                                    : (product.sale_price ?? product.regular_price);

                                const regularPrice = item.variant
                                    ? item.variant.regular_price
                                    : product.regular_price;

                                const isSale = Number(regularPrice) > Number(currentPrice);

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group relative"
                                    >
                                        {/* Remove from wishlist button */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(item.id)}
                                            disabled={removingId === item.id}
                                            className="absolute top-2.5 right-2.5 z-10 p-2 bg-white/90 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-full shadow-xs transition disabled:opacity-50"
                                            title="উইশলিস্ট থেকে মুছুন"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        {/* Product Image Link */}
                                        <Link href={`/product/${product.slug}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
                                            {imgUrl ? (
                                                <img
                                                    src={imgUrl}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Package className="w-10 h-10" />
                                                </div>
                                            )}

                                            {isUnavailable && (
                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-2 text-center">
                                                    <span className="text-white text-xs font-bold px-2 py-1 bg-black/60 rounded">
                                                        বর্তমানে অনুপলব্ধ
                                                    </span>
                                                </div>
                                            )}
                                        </Link>

                                        {/* Content info */}
                                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                            <div className="space-y-1">
                                                <Link
                                                    href={`/product/${product.slug}`}
                                                    className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition line-clamp-2 block leading-snug"
                                                >
                                                    {product.title}
                                                </Link>

                                                {item.variant && (
                                                    <p className="text-[11px] text-indigo-600 font-semibold">
                                                        ভেরিয়েন্ট: {item.variant.name}
                                                    </p>
                                                )}

                                                <div className="flex items-baseline gap-2 pt-1">
                                                    <span className="font-black text-gray-900 text-base">
                                                        {formatBdt(currentPrice)}
                                                    </span>
                                                    {isSale && (
                                                        <span className="text-xs text-gray-400 line-through">
                                                            {formatBdt(regularPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action button */}
                                            <div className="pt-2">
                                                {product.has_variants && !item.variant ? (
                                                    <Link
                                                        href={`/product/${product.slug}`}
                                                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
                                                    >
                                                        <span>ভেরিয়েন্ট দেখুন</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddToCart(item)}
                                                        disabled={isUnavailable || addingToCartId === item.id}
                                                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                                                    >
                                                        <ShoppingBag className="w-3.5 h-3.5" />
                                                        <span>{addingToCartId === item.id ? 'যোগ হচ্ছে...' : 'কার্টে যোগ করুন'}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination if multiple pages */}
                        {wishlist.last_page > 1 && (
                            <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-4">
                                <div className="text-xs text-gray-500">
                                    পেজ {wishlist.current_page} এর {wishlist.last_page}
                                </div>
                                <div className="flex items-center gap-2">
                                    {wishlist.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : link.url
                                                    ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                    : 'text-gray-300 pointer-events-none'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
