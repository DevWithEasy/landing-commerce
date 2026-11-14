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
import { SafeImage } from '@/Shared/SafeImage';
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
            <div className="bg-surface border-b border-line/80 py-3.5 px-4">
                <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-muted">
                    <Link href="/" className="hover:text-heading transition">
                        হোম
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-semibold text-ink">শপিং কার্ট</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-line">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-heading tracking-tight">
                            শপিং কার্ট
                        </h1>
                        <p className="text-xs sm:text-sm text-muted mt-1">
                            আপনার কার্টে মোট {cart.total_items} টি পণ্য রয়েছে
                        </p>
                    </div>

                    {cart.items.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearCart}
                            disabled={isClearing}
                            className="text-xs font-semibold text-muted hover:text-rose-600 transition flex items-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>কার্ট খালি করুন</span>
                        </button>
                    )}
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm text-rose-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {cart.items.length === 0 ? (
                    /* Empty Cart State */
                    <div className="bg-surface rounded-xl border border-line/80 p-8 sm:p-16 text-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-page border border-line text-heading rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-heading mb-2">
                            আপনার কার্টটি সম্পূর্ণ খালি!
                        </h2>
                        <p className="text-sm text-muted mb-8 max-w-md mx-auto">
                            আপনি এখনো কোন পণ্য কার্টে যোগ করেননি। আমাদের নতুন আকর্ষণীয় কালেকশন দেখতে শপে প্রবেশ করুন।
                        </p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center justify-center gap-2 h-11 px-7 bg-cta hover:bg-cta-hover text-cta-text rounded-lg font-semibold text-sm transition"
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
                            <div className="bg-surface rounded-xl border border-line/80 overflow-hidden divide-y divide-stone-100">
                                {cart.items.map((item: CartItemData) => {
                                    const isLoading = loadingItemId === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition relative ${
                                                isLoading ? 'opacity-50 pointer-events-none' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* 4:5 Portrait Image */}
                                                <div className="w-20 h-24 sm:w-22 sm:h-28 bg-soft rounded-lg overflow-hidden border border-line/70 flex-shrink-0">
                                                    <SafeImage
                                                        src={item.image_url}
                                                        alt={item.product_title}
                                                        className="w-full h-full object-cover"
                                                        fallbackIconSize="w-8 h-8"
                                                        fallbackText=""
                                                    />
                                                </div>

                                                {/* Title & Info */}
                                                <div>
                                                    <Link
                                                        href={`/product/${item.product_slug}`}
                                                        className="font-semibold text-ink text-sm sm:text-base hover:text-heading line-clamp-2 transition"
                                                    >
                                                        {item.product_title}
                                                    </Link>

                                                    {item.variant_name && (
                                                        <span className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 bg-page border border-line text-stone-700 rounded-full">
                                                            ভ্যারিয়েন্ট: {item.variant_name}
                                                        </span>
                                                    )}

                                                    <div className="flex items-baseline gap-2 mt-2">
                                                        <span className="text-sm sm:text-base font-bold text-price">
                                                            {formatBdt(item.unit_price)}
                                                        </span>
                                                        {item.regular_price > item.unit_price && (
                                                            <span className="text-xs text-stone-400 line-through">
                                                                {formatBdt(item.regular_price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quantity Stepper & Subtotal */}
                                            <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                                                {/* Stepper */}
                                                <div className="flex items-center border border-line rounded-lg bg-surface overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleQuantityChange(item.id, item.quantity - 1)
                                                        }
                                                        disabled={item.quantity <= 1 || isLoading}
                                                        className="w-9 h-9 flex items-center justify-center text-body hover:bg-stone-100 disabled:opacity-30 transition"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="px-3 text-xs sm:text-sm font-semibold text-ink min-w-8 text-center">
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
                                                        className="w-9 h-9 flex items-center justify-center text-body hover:bg-stone-100 disabled:opacity-30 transition"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Line Total */}
                                                <div className="text-right min-w-20">
                                                    <span className="block text-sm sm:text-base font-bold text-ink">
                                                        {formatBdt(item.line_total)}
                                                    </span>
                                                </div>

                                                {/* Remove */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="পণ্যটি সরান"
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Item Loading Spinner */}
                                            {isLoading && (
                                                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 text-heading animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center gap-2 text-xs font-semibold text-heading hover:text-price transition"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>আরও পণ্য কিনুন (Continue Shopping)</span>
                                </Link>
                            </div>
                        </div>

                        {/* Right Col: Order Summary Box */}
                        <div className="lg:col-span-1">
                            <div className="bg-surface rounded-xl border border-line/80 p-6 sticky top-24 space-y-5">
                                <h3 className="text-lg font-serif font-bold text-heading border-b border-stone-100 pb-4">
                                    অর্ডার সামারি
                                </h3>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between text-body">
                                        <span>পণ্যের উপমোট (Subtotal)</span>
                                        <span className="font-bold text-ink">
                                            {formatBdt(cart.subtotal)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-body">
                                        <span>ডেলিভারি চার্জ</span>
                                        <span className="text-xs font-medium text-heading bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                                            চেকআউটে নির্ধারিত হবে
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-page rounded-lg border border-line/80 flex items-start gap-3">
                                    <Truck className="w-5 h-5 text-heading flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-body leading-relaxed">
                                        <strong className="text-ink block font-semibold mb-0.5">
                                            সারা দেশে হোম ডেলিভারি
                                        </strong>
                                        পরবর্তী ধাপে জেলা ও থানা নির্বাচন করলে সঠিক ডেলিভারি চার্জ যুক্ত হবে।
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-stone-100">
                                    <div className="flex items-center justify-between mb-5">
                                        <span className="text-base font-bold text-ink">মোট মূল্য</span>
                                        <span className="text-2xl font-bold text-price">
                                            {formatBdt(cart.subtotal)}
                                        </span>
                                    </div>

                                    <Link
                                        href="/checkout"
                                        className="w-full flex items-center justify-center gap-2 h-11 px-6 bg-cta hover:bg-cta-hover text-cta-text rounded-lg font-semibold text-sm transition"
                                    >
                                        <span>চেকআউট করুন (Proceed to Checkout)</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                <div className="pt-1 flex items-center justify-center gap-2 text-xs font-medium text-heading bg-emerald-50/70 py-2.5 px-3 rounded-lg border border-emerald-200/70">
                                    <ShieldCheck className="w-4 h-4 text-heading" />
                                    <span>ক্যাশ অন ডেলিভারি সুবিধা রয়েছে</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Sticky Checkout Bar */}
            {cart.items.length > 0 && (
                <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-xs border-t border-line px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm">
                    <div>
                        <p className="text-[10px] text-muted font-medium">মোট মূল্য ({cart.total_items} টি পণ্য)</p>
                        <p className="text-base font-bold text-price">{formatBdt(cart.subtotal)}</p>
                    </div>
                    <Link
                        href="/checkout"
                        className="inline-flex items-center justify-center gap-1.5 h-10 px-5 bg-cta hover:bg-cta-hover text-cta-text rounded-lg text-xs font-semibold transition"
                    >
                        <span>চেকআউট করুন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}
        </StorefrontLayout>
    );
}
