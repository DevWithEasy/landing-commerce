import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    Loader2,
    Minus,
    Plus,
    ShieldCheck,
    ShoppingBag,
    Trash2,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import type { Category } from '@/types';
import type { CartItemData, CartSummary } from '@/types/cart';
import type { StorefrontTheme } from '@/types/storefront';

interface CartPageProps {
    theme: StorefrontTheme;
    categories?: Category[];
    cart: CartSummary;
}

function formatBdt(amount: number): string {
    return `৳${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
}

export default function CartPage({
    theme,
    categories = [],
    cart: initialCart,
}: CartPageProps) {
    const [cart, setCart] = useState<CartSummary>(initialCart);
    const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
    const [isClearing, setIsClearing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleQuantityChange = async (itemId: number, newQty: number) => {
        if (newQty < 1 || loadingItemId !== null) return;
        setLoadingItemId(itemId);
        setErrorMessage(null);

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const res = await fetch(`/cart/items/${itemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({ quantity: newQty }),
            });

            const data = await res.json();
            if (!res.ok) {
                setErrorMessage(data.message || 'কার্ট আপডেট করতে সমস্যা হয়েছে।');
            } else if (data.cart) {
                setCart(data.cart);
                router.reload({ only: ['cart'] });
            }
        } catch {
            setErrorMessage('সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।');
        } finally {
            setLoadingItemId(null);
        }
    };

    const handleRemoveItem = async (itemId: number) => {
        if (loadingItemId !== null) return;
        setLoadingItemId(itemId);
        setErrorMessage(null);

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const res = await fetch(`/cart/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
            });

            const data = await res.json();
            if (!res.ok) {
                setErrorMessage(data.message || 'পণ্যটি কার্ট থেকে সরাতে সমস্যা হয়েছে।');
            } else if (data.cart) {
                setCart(data.cart);
                router.reload({ only: ['cart'] });
            }
        } catch {
            setErrorMessage('সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।');
        } finally {
            setLoadingItemId(null);
        }
    };

    const handleClearCart = async () => {
        if (isClearing) return;
        setIsClearing(true);
        setErrorMessage(null);

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const res = await fetch('/cart', {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
            });

            const data = await res.json();
            if (data.cart) {
                setCart(data.cart);
                router.reload({ only: ['cart'] });
            }
        } catch {
            setErrorMessage('কার্ট খালি করতে সমস্যা হয়েছে।');
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <StorefrontLayout theme={theme} categories={categories}>
            <Head>
                <title>{`শপিং কার্ট - ${theme.store_name}`}</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200 py-3.5 px-4">
                <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-gray-500">
                    <Link href="/" className="hover:text-indigo-600 transition">
                        হোম
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-900">শপিং কার্ট</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                            শপিং কার্ট
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            আপনার কার্টে মোট {cart.total_items} টি পণ্য রয়েছে
                        </p>
                    </div>

                    {cart.items.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearCart}
                            disabled={isClearing}
                            className="text-xs font-semibold text-gray-400 hover:text-rose-600 transition flex items-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>কার্ট খালি করুন</span>
                        </button>
                    )}
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-sm text-rose-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {cart.items.length === 0 ? (
                    /* Empty Cart State */
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-16 text-center max-w-2xl mx-auto shadow-xs">
                        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-12 h-12" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                            আপনার কার্টটি সম্পূর্ণ খালি!
                        </h2>
                        <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                            আপনি এখনো কোন পণ্য কার্টে যোগ করেননি। আমাদের নতুন আকর্ষণীয় কালেকশন দেখতে শপে প্রবেশ করুন।
                        </p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-100 transition transform hover:-translate-y-0.5"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>কেনাকাটা শুরু করুন</span>
                        </Link>
                    </div>
                ) : (
                    /* Cart Content Grid */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left 2 Cols: Items List */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs divide-y divide-gray-100">
                                {cart.items.map((item: CartItemData) => {
                                    const isLoading = loadingItemId === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition relative ${
                                                isLoading ? 'opacity-50 pointer-events-none' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Image */}
                                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-2xl overflow-hidden border border-gray-200/70 flex-shrink-0">
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.product_title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                {/* Title & Info */}
                                                <div>
                                                    <Link
                                                        href={`/product/${item.product_slug}`}
                                                        className="font-bold text-gray-900 text-sm sm:text-base hover:text-indigo-600 line-clamp-2 transition"
                                                    >
                                                        {item.product_title}
                                                    </Link>

                                                    {item.variant_name && (
                                                        <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                                                            ভ্যারিয়েন্ট: {item.variant_name}
                                                        </span>
                                                    )}

                                                    <div className="flex items-baseline gap-2 mt-2">
                                                        <span className="text-sm sm:text-base font-black text-indigo-600">
                                                            {formatBdt(item.unit_price)}
                                                        </span>
                                                        {item.regular_price > item.unit_price && (
                                                            <span className="text-xs text-gray-400 line-through">
                                                                {formatBdt(item.regular_price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quantity Stepper & Subtotal */}
                                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                                {/* Stepper */}
                                                <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleQuantityChange(item.id, item.quantity - 1)
                                                        }
                                                        disabled={item.quantity <= 1 || isLoading}
                                                        className="p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="px-3 text-xs sm:text-sm font-bold text-gray-900 min-w-8 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleQuantityChange(item.id, item.quantity + 1)
                                                        }
                                                        disabled={
                                                            (item.manage_stock &&
                                                                item.quantity >= item.available_stock) ||
                                                            item.quantity >= 100 ||
                                                            isLoading
                                                        }
                                                        className="p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Line Total */}
                                                <div className="text-right min-w-20">
                                                    <span className="block text-sm sm:text-base font-black text-gray-900">
                                                        {formatBdt(item.line_total)}
                                                    </span>
                                                </div>

                                                {/* Remove */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                                    title="পণ্যটি সরান"
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Item Loading Spinner */}
                                            {isLoading && (
                                                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>আরও পণ্য কিনুন (Continue Shopping)</span>
                                </Link>
                            </div>
                        </div>

                        {/* Right Col: Order Summary Box */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs sticky top-24 space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">
                                    অর্ডার সামারি
                                </h3>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between text-gray-600">
                                        <span>পণ্যের উপমোট (Subtotal)</span>
                                        <span className="font-bold text-gray-900">
                                            {formatBdt(cart.subtotal)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-gray-600">
                                        <span>ডেলিভারি চার্জ</span>
                                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                            চেকআউটে নির্ধারিত হবে
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                                    <Truck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-gray-600 leading-relaxed">
                                        <strong className="text-gray-900 block font-bold mb-0.5">
                                            সারা দেশে হোম ডেলিভারি
                                        </strong>
                                        পরবর্তী ধাপে জেলা ও থানা নির্বাচন করলে সঠিক ডেলিভারি চার্জ যুক্ত হবে।
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-base font-bold text-gray-900">মোট মূল্য</span>
                                        <span className="text-2xl font-black text-indigo-600">
                                            {formatBdt(cart.subtotal)}
                                        </span>
                                    </div>

                                    <Link
                                        href="/checkout"
                                        className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 transition transform hover:-translate-y-0.5"
                                    >
                                        <span>চেকআউট করুন (Proceed to Checkout)</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2.5 px-3 rounded-xl border border-emerald-100">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    <span>ক্যাশ অন ডেলিভারি সুবিধা রয়েছে</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
