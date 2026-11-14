import { Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Loader2,
    Minus,
    Plus,
    ShoppingBag,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CartItemData, CartSummary } from '@/types/cart';
import { SafeImage } from './SafeImage';

interface MiniCartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartSummary;
    onCartChange?: (newCart: CartSummary) => void;
}

function formatBdt(amount: number): string {
    return `৳${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
}

export function MiniCartDrawer({
    isOpen,
    onClose,
    cart,
    onCartChange,
}: MiniCartDrawerProps) {
    const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
    const [isClearing, setIsClearing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

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
                if (onCartChange) onCartChange(data.cart);
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
                setErrorMessage(data.message || 'পণ্য সরাতে সমস্যা হয়েছে।');
            } else if (data.cart) {
                if (onCartChange) onCartChange(data.cart);
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
                if (onCartChange) onCartChange(data.cart);
                router.reload({ only: ['cart'] });
            }
        } catch {
            setErrorMessage('কার্ট খালি করতে সমস্যা হয়েছে।');
        } finally {
            setIsClearing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-white shadow-xl flex flex-col justify-between transform transition duration-300 ease-in-out">
                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-[#FAF7F2] z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-[#0B3B2E] text-white flex items-center justify-center">
                                <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-serif font-bold text-[#0B3B2E]">আপনার শপিং কার্ট</h2>
                                <p className="text-xs text-stone-500 font-medium">
                                    মোট {cart.total_items} টি পণ্য যুক্ত আছে
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition"
                            aria-label="Close cart drawer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="p-3 mx-4 mt-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                        {cart.items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                <div className="w-16 h-16 bg-[#FAF7F2] border border-stone-200 rounded-full flex items-center justify-center text-stone-400 mb-4">
                                    <ShoppingBag className="w-8 h-8" />
                                </div>
                                <h3 className="text-base font-serif font-bold text-[#0B3B2E] mb-1">কার্টটি বর্তমানে খালি</h3>
                                <p className="text-xs text-stone-500 max-w-xs mb-6">
                                    আপনার পছন্দের পণ্য বাছাই করে কার্টে যোগ করুন এবং কেনাকাটা শুরু করুন।
                                </p>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-[#F96D16] hover:bg-[#EA580C] text-white rounded-lg text-xs font-semibold transition"
                                >
                                    শপিং শুরু করুন
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.items.map((item: CartItemData) => {
                                    const isLoading = loadingItemId === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`relative p-3 bg-[#FAF7F2]/60 border border-stone-200/80 rounded-xl flex gap-3 transition ${
                                                isLoading ? 'opacity-50 pointer-events-none' : ''
                                            }`}
                                        >
                                            {/* Thumbnail */}
                                            <div className="w-18 h-22 sm:w-20 sm:h-24 bg-[#F3EDE4] rounded-lg overflow-hidden border border-stone-200/60 flex-shrink-0">
                                                <SafeImage
                                                    src={item.image_url}
                                                    alt={item.product_title}
                                                    className="w-full h-full object-cover"
                                                    fallbackIconSize="w-6 h-6"
                                                    fallbackText=""
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-start justify-between gap-1">
                                                        <Link
                                                            href={`/product/${item.product_slug}`}
                                                            onClick={onClose}
                                                            className="text-xs font-semibold text-stone-900 hover:text-[#0B3B2E] line-clamp-1 transition"
                                                            title={item.product_title}
                                                        >
                                                            {item.product_title}
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(item.id)}
                                                            className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition"
                                                            title="পণ্যটি মুছে ফেলুন"
                                                            aria-label="Remove item"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    {item.variant_name && (
                                                        <p className="text-[11px] text-stone-500 font-medium">
                                                            ভ্যারিয়েন্ট: {item.variant_name}
                                                        </p>
                                                    )}

                                                    <div className="flex items-baseline gap-1.5 mt-0.5">
                                                        <span className="text-xs font-bold text-[#EA580C]">
                                                            {formatBdt(item.unit_price)}
                                                        </span>
                                                        {item.regular_price > item.unit_price && (
                                                            <span className="text-[10px] text-stone-400 line-through">
                                                                {formatBdt(item.regular_price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Stepper & Line Total */}
                                                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-200/60">
                                                    <div className="inline-flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleQuantityChange(item.id, item.quantity - 1)
                                                            }
                                                            disabled={item.quantity <= 1 || isLoading}
                                                            className="p-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30 transition"
                                                            aria-label="Decrease quantity"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="px-2.5 text-xs font-semibold text-stone-800 min-w-6 text-center">
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
                                                            className="p-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30 transition"
                                                            aria-label="Increase quantity"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <span className="text-xs font-bold text-stone-900">
                                                        {formatBdt(item.line_total)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Item Loading Spinner Overlay */}
                                            {isLoading && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs rounded-xl flex items-center justify-center">
                                                    <Loader2 className="w-5 h-5 text-[#0B3B2E] animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {cart.items.length > 0 && (
                        <div className="p-4 sm:p-5 border-t border-stone-200 bg-white space-y-3 z-10">
                            {/* Subtotal */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-stone-600">সাবটোটাল</span>
                                <span className="text-lg font-bold text-[#EA580C]">
                                    {formatBdt(cart.subtotal)}
                                </span>
                            </div>

                            <p className="text-[11px] text-stone-400">
                                * ডেলিভারি চার্জ চেকআউটের সময় আপনার ঠিকানার উপর ভিত্তি করে নির্ধারিত হবে।
                            </p>

                            {/* Buttons */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <Link
                                    href="/cart"
                                    onClick={onClose}
                                    className="flex items-center justify-center gap-1.5 h-10 px-4 bg-white border border-stone-300 hover:border-[#0B3B2E] hover:bg-[#FAF7F2] text-[#0B3B2E] rounded-lg text-xs font-semibold transition"
                                >
                                    <span>কার্ট পেইজ</span>
                                </Link>

                                <Link
                                    href="/checkout"
                                    onClick={onClose}
                                    className="flex items-center justify-center gap-1.5 h-10 px-4 bg-[#F96D16] hover:bg-[#EA580C] text-white rounded-lg text-xs font-semibold transition"
                                >
                                    <span>অর্ডার করুন</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            <button
                                type="button"
                                onClick={handleClearCart}
                                disabled={isClearing}
                                className="w-full text-center text-[11px] text-stone-400 hover:text-rose-600 transition font-medium"
                            >
                                কার্ট খালি করুন
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
