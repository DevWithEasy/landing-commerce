import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Check,
    Clock,
    CreditCard,
    Lock,
    MapPin,
    MessageSquare,
    Minus,
    Phone,
    Plus,
    RefreshCw,
    ShieldCheck,
    ShoppingCart,
    Truck,
    User,
    Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import { SafeImage } from '@/Shared/SafeImage';
import { trackAddPaymentInfo, trackInitiateCheckout } from '@/Shared/Tracking';
import type { CheckoutShowProps, PaymentMethod, ProductVariant, ShippingMethod } from '@/types';

function generateUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function formatBdt(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `৳${(isNaN(num) ? 0 : num).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}

export default function CheckoutShow({
    mode = 'direct',
    cart = null,
    product,
    shippingMethods = [],
    defaultShippingFee,
    defaultZoneName,
    paymentMethods = [],
    theme,
    categories = [],
}: CheckoutShowProps) {
    const isCartMode = mode === 'cart' && !!cart && cart.items.length > 0;

    // 1. Variant & Quantity selection (for direct mode)
    const availableVariants = useMemo(() => {
        if (!product?.variants) return [];
        return product.variants.filter((v) => !v.manage_stock || v.stock_quantity > 0);
    }, [product?.variants]);

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(() => {
        if (!product?.variants || product.variants.length === 0) return undefined;
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const variantId = params.get('variant');
            if (variantId) {
                const match = product.variants.find((v) => String(v.id) === variantId);
                if (match) return match;
            }
        }
        return availableVariants[0] || product.variants[0];
    });

    const [quantity, setQuantity] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const qty = parseInt(params.get('quantity') || '1', 10);
            if (!isNaN(qty) && qty > 0) return qty;
        }
        return 1;
    });

    // 2. Client-side Idempotency Key (preserved across retries)
    const [idempotencyKey] = useState<string>(() => generateUuid());

    // 3. Customer & Delivery Form State
    const [customerName, setCustomerName] = useState<string>('');
    const [customerPhone, setCustomerPhone] = useState<string>('');
    const [deliveryAddress, setDeliveryAddress] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [honeypot, setHoneypot] = useState<string>('');

    // 4. Delivery methods are managed in the database (admin panel) and are
    // rendered here without any hardcoded option list.
    const defaultShippingMethod = useMemo<ShippingMethod | null>(() => {
        return shippingMethods.find((method) => method.is_default) ?? shippingMethods[0] ?? null;
    }, [shippingMethods]);

    const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<number | null>(
        () => defaultShippingMethod?.id ?? null
    );

    const selectedShippingMethod = useMemo<ShippingMethod | null>(() => {
        return shippingMethods.find((method) => method.id === selectedShippingMethodId) ?? null;
    }, [shippingMethods, selectedShippingMethodId]);

    // The selected method's rate is authoritative for display; the server
    // recalculates the final fee from shipping_method_id during checkout.
    const shippingFee = selectedShippingMethod
        ? parseFloat(String(selectedShippingMethod.rate)) || 0
        : defaultShippingFee || 0;
    const selectedMethodName = selectedShippingMethod?.name ?? defaultZoneName;
    const deliveryTime = selectedShippingMethod?.delivery_time ?? '24-48 hours';

    // 5. Payment Methods State (only methods activated in the admin panel)
    const activePaymentMethods = useMemo<PaymentMethod[]>(() => {
        return (paymentMethods ?? []).filter((method) => method.is_active);
    }, [paymentMethods]);

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(() => {
        return activePaymentMethods[0]?.code ?? 'cod';
    });
    const [transactionId, setTransactionId] = useState<string>('');

    // 6. Submission & Error States
    const [agreedTerms, setAgreedTerms] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

    // Unit price and totals calculation
    const unitPrice = useMemo(() => {
        if (!selectedVariant) return 0;
        const sale = selectedVariant.sale_price;
        if (sale !== null && sale !== undefined && parseFloat(String(sale)) > 0) {
            return parseFloat(String(sale));
        }
        return parseFloat(String(selectedVariant.regular_price)) || 0;
    }, [selectedVariant]);

    const subtotal = useMemo(() => {
        if (isCartMode && cart) {
            return cart.subtotal;
        }
        return unitPrice * quantity;
    }, [isCartMode, cart, unitPrice, quantity]);

    const grandTotal = useMemo(() => {
        return subtotal + shippingFee;
    }, [subtotal, shippingFee]);

    // Track InitiateCheckout on page view
    useEffect(() => {
        trackInitiateCheckout({
            value: grandTotal,
            contentIds: isCartMode && cart
                ? cart.items.map((i) => String(i.variant_id))
                : [String(selectedVariant?.id || product?.id || '')],
            numItems: isCartMode && cart ? cart.total_items : quantity,
        });
    }, []);

    // Primary image resolution
    const primaryImage = useMemo(() => {
        if (!product) return null;
        if (selectedVariant?.id) {
            const variantImg = product.images.find((img) => img.variant_id === selectedVariant.id);
            if (variantImg) return variantImg;
        }
        return product.images.find((img) => img.is_primary) || product.images[0];
    }, [product, selectedVariant]);

    // Handle checkout submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setRateLimitMessage(null);

        if (!isCartMode && !selectedVariant) {
            setErrors({ variant: 'অনুগ্রহ করে একটি ভ্যারিয়েন্ট নির্বাচন করুন।' });
            return;
        }

        if (isCartMode && (!cart || cart.items.length === 0)) {
            setErrors({ general: 'আপনার কার্ট খালি। অর্ডার করার পূর্বে কার্টে পণ্য যোগ করুন।' });
            return;
        }

        setIsSubmitting(true);

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        const payload = {
            checkout_source: isCartMode ? 'cart' : 'direct',
            customer_name: customerName,
            customer_phone: customerPhone,
            delivery_address: deliveryAddress,
            notes: notes || null,
            shipping_method_id: selectedShippingMethodId || undefined,
            payment_method: selectedPaymentMethod,
            payment_transaction_id: transactionId || undefined,
            idempotency_key: idempotencyKey,
            items: isCartMode && cart
                ? cart.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity }))
                : [
                    {
                        variant_id: selectedVariant!.id,
                        quantity,
                    },
                ],
            _hp_trap: honeypot || undefined,
        };

        try {
            const response = await fetch('/checkout/cod', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.status === 201 || response.status === 200) {
                // Successful order placement or idempotent replay
                const orderNumber = data.order?.order_number;
                if (orderNumber) {
                    router.visit(`/checkout/thank-you/${orderNumber}`);
                }
                return;
            }

            if (response.status === 422) {
                if (data.error === 'out_of_stock') {
                    setErrors({
                        general:
                            data.message ||
                            'দুঃখিত, স্টক শেষ হয়ে গেছে। অন্য ভ্যারিয়েন্ট নির্বাচন করুন।',
                    });
                } else if (data.errors) {
                    const formattedErrors: Record<string, string> = {};
                    for (const [key, val] of Object.entries(data.errors)) {
                        formattedErrors[key] = Array.isArray(val) ? val[0] : String(val);
                    }
                    setErrors(formattedErrors);
                } else {
                    setErrors({ general: data.message || 'ভ্যালিডেশন ত্রুটি ঘটেছে।' });
                }
                return;
            }

            if (response.status === 429) {
                const retryAfter =
                    data.retry_after || response.headers.get('Retry-After') || 'কিছুক্ষণ';
                setRateLimitMessage(
                    data.message ||
                        `আপনি অতি দ্রুত একাধিক অনুরোধ করেছেন। অনুগ্রহ করে ${retryAfter} সেকেন্ড পর আবার চেষ্টা করুন।`
                );
                return;
            }

            setErrors({ general: data.message || 'অর্ডার প্রক্রিয়া করতে সমস্যা হয়েছে।' });
        } catch {
            setErrors({
                general: 'ইন্টারনেট সংযোগ সমস্যা। অনুগ্রহ করে আবার চেষ্টা করুন।',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <StorefrontLayout theme={theme} categories={categories}>
            <Head>
                <title>{`অর্ডার কনফার্ম করুন - ${isCartMode ? 'কার্ট আইটেমস' : product?.title || 'চেকআউট'}`}</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="bg-[#FAF7F2] py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                {/* Top Header & 3-Step Progress Stepper matching Velure Reference */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-7">
                    <div>
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                            Checkout
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Complete your order in a few simple steps.
                        </p>
                    </div>

                    {/* 3-Step Progress Stepper */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-[#0B3B2E] text-white flex items-center justify-center shadow-xs">
                                <ShoppingCart className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-semibold text-[#0B3B2E] mt-1">Cart</span>
                        </div>
                        <div className="w-12 sm:w-20 h-0.5 bg-[#0B3B2E] -mt-4" />
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-[#F96D16] text-white flex items-center justify-center shadow-xs ring-4 ring-[#F96D16]/20">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-[#EA580C] mt-1">Checkout</span>
                        </div>
                        <div className="w-12 sm:w-20 h-0.5 bg-stone-300 -mt-4" />
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-stone-300 text-white flex items-center justify-center">
                                <Check className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-medium text-gray-400 mt-1 whitespace-nowrap">
                                Order Complete
                            </span>
                        </div>
                    </div>
                </div>

                {/* Rate Limit Alert Banner */}
                {rateLimitMessage && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-amber-800">
                                সাময়িক অনুরোধ সীমাবদ্ধতা
                            </h4>
                            <p className="text-sm text-amber-700 mt-0.5">{rateLimitMessage}</p>
                        </div>
                    </div>
                )}

                {/* General Error Banner */}
                {errors.general && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-red-800">ত্রুটি</h4>
                            <p className="text-sm text-red-700 mt-0.5">{errors.general}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
                    {/* Left Column: Unified 4-Step Checkout Form Card */}
                    <div className="lg:col-span-8 bg-white rounded-3xl shadow-[0_2px_14px_rgba(15,23,42,0.04)] border border-stone-200/80 p-6 sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-7">
                            {/* Invisible Honeypot Field */}
                            <input
                                type="text"
                                name="_hp_trap"
                                value={honeypot}
                                onChange={(e) => setHoneypot(e.target.value)}
                                tabIndex={-1}
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    left: '-9999px',
                                    opacity: 0,
                                    pointerEvents: 'none',
                                }}
                            />

                            {/* Step 1: Contact Information */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <span className="w-6 h-6 rounded-full bg-[#0B3B2E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        1
                                    </span>
                                    <h2 className="font-serif text-lg font-bold text-gray-900">
                                        Contact Information
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="checkout_customer_name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Full Name <span className="text-[#F96D16]">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                id="checkout_customer_name"
                                                type="text"
                                                required
                                                aria-required="true"
                                                aria-invalid={!!(errors.customer_name || errors.name)}
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                                                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-[#FAF7F2]/50 ${
                                                    errors.customer_name || errors.name
                                                        ? 'border-rose-400 bg-rose-50/30'
                                                        : 'border-stone-200'
                                                } focus:ring-2 focus:ring-[#F96D16]/20 focus:border-[#F96D16] focus:bg-white text-sm transition`}
                                            />
                                        </div>
                                        {(errors.customer_name || errors.name) && (
                                            <p className="text-xs text-rose-600 mt-1">
                                                {errors.customer_name || errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="checkout_customer_phone" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Phone Number <span className="text-[#F96D16]">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                id="checkout_customer_phone"
                                                type="tel"
                                                required
                                                aria-required="true"
                                                aria-invalid={!!(errors.customer_phone || errors.phone)}
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                placeholder="+880 17XXXXXXXX"
                                                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-[#FAF7F2]/50 ${
                                                    errors.customer_phone || errors.phone
                                                        ? 'border-rose-400 bg-rose-50/30'
                                                        : 'border-stone-200'
                                                } focus:ring-2 focus:ring-[#F96D16]/20 focus:border-[#F96D16] focus:bg-white text-sm transition`}
                                            />
                                        </div>
                                        {(errors.customer_phone || errors.phone) && (
                                            <p className="text-xs text-rose-600 mt-1">
                                                {errors.customer_phone || errors.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Delivery Address */}
                            <div className="pt-2 border-t border-stone-100">
                                <div className="flex items-center gap-2.5 mb-4 pt-3">
                                    <span className="w-6 h-6 rounded-full bg-[#0B3B2E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        2
                                    </span>
                                    <h2 className="font-serif text-lg font-bold text-gray-900">
                                        Delivery Address
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="checkout_delivery_address" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Address <span className="text-[#F96D16]">*</span>
                                        </label>
                                        <div className="relative">
                                            <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
                                            <input
                                                id="checkout_delivery_address"
                                                type="text"
                                                required
                                                aria-required="true"
                                                aria-invalid={!!(errors.delivery_address || errors.address)}
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                                placeholder="বাসা নং, রোড নং, এলাকা/থানা, জেলা"
                                                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-[#FAF7F2]/50 ${
                                                    errors.delivery_address || errors.address
                                                        ? 'border-rose-400 bg-rose-50/30'
                                                        : 'border-stone-200'
                                                } focus:ring-2 focus:ring-[#F96D16]/20 focus:border-[#F96D16] focus:bg-white text-sm transition`}
                                            />
                                        </div>
                                        {(errors.delivery_address || errors.address) && (
                                            <p className="text-xs text-rose-600 mt-1">
                                                {errors.delivery_address || errors.address}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="checkout_notes" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Delivery Note <span className="text-gray-400 font-normal">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
                                            <input
                                                id="checkout_notes"
                                                type="text"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="E.g. Call before delivery"
                                                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#FAF7F2]/50 focus:ring-2 focus:ring-[#F96D16]/20 focus:border-[#F96D16] focus:bg-white text-sm transition"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Delivery Method */}
                            {shippingMethods.length > 0 && (
                                <div className="pt-2 border-t border-stone-100">
                                    <div className="flex items-center gap-2.5 mb-4 pt-3">
                                        <span className="w-6 h-6 rounded-full bg-[#0B3B2E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                            3
                                        </span>
                                        <h2 className="font-serif text-lg font-bold text-gray-900">
                                            Delivery Method
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {shippingMethods.map((method: ShippingMethod) => {
                                            const isSelected = selectedShippingMethodId === method.id;
                                            return (
                                                <div
                                                    key={method.id}
                                                    onClick={() => setSelectedShippingMethodId(method.id)}
                                                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                                        isSelected
                                                            ? 'border-[#F96D16] bg-orange-50/30 ring-1 ring-[#F96D16]'
                                                            : 'border-stone-200 hover:border-stone-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div
                                                            className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${
                                                                isSelected
                                                                    ? 'border-[#F96D16] bg-[#F96D16]'
                                                                    : 'border-stone-300 bg-white'
                                                            }`}
                                                        >
                                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <Truck className="w-5 h-5 text-gray-600 shrink-0" />
                                                        <div className="min-w-0">
                                                            <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                                                {method.name}
                                                            </div>
                                                            <div className="text-[11px] text-gray-500 truncate">
                                                                {method.delivery_time || method.description || 'Standard delivery'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs sm:text-sm font-bold text-[#0B3B2E] shrink-0">
                                                        {Number(method.rate) === 0 ? 'Free' : formatBdt(method.rate)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.shipping_method_id && (
                                        <p className="text-xs text-rose-600 mt-1">{errors.shipping_method_id}</p>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Payment Method */}
                            <div className="pt-2 border-t border-stone-100">
                                <div className="flex items-center gap-2.5 mb-4 pt-3">
                                    <span className="w-6 h-6 rounded-full bg-[#0B3B2E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {shippingMethods.length > 0 ? '4' : '3'}
                                    </span>
                                    <h2 className="font-serif text-lg font-bold text-gray-900">
                                        Payment Method
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {activePaymentMethods.map((pm: PaymentMethod) => {
                                        const isSelected = selectedPaymentMethod === pm.code;
                                        return (
                                            <div
                                                key={pm.id}
                                                onClick={() => {
                                                    setSelectedPaymentMethod(pm.code);
                                                    trackAddPaymentInfo(pm.code, grandTotal);
                                                }}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                                                    isSelected
                                                        ? 'border-[#F96D16] bg-orange-50/30 ring-1 ring-[#F96D16]'
                                                        : 'border-stone-200 hover:border-stone-300 bg-white'
                                                }`}
                                            >
                                                <div
                                                    className={`w-4 h-4 mt-0.5 shrink-0 rounded-full border flex items-center justify-center ${
                                                        isSelected
                                                            ? 'border-[#F96D16] bg-[#F96D16]'
                                                            : 'border-stone-300 bg-white'
                                                    }`}
                                                >
                                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        {pm.code === 'cod' ? (
                                                            <Wallet className="w-4 h-4 text-[#0B3B2E] shrink-0" />
                                                        ) : (
                                                            <CreditCard className="w-4 h-4 text-[#F96D16] shrink-0" />
                                                        )}
                                                        <span className="text-xs font-bold text-gray-900 truncate">
                                                            {pm.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                                                        {pm.description || (pm.code === 'cod' ? 'Pay when you receive your order' : 'Manual mobile/online payment')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Transaction ID Details if Selected Method Requires It */}
                                {activePaymentMethods.map((pm: PaymentMethod) => {
                                    if (selectedPaymentMethod !== pm.code || !pm.requires_transaction_id) return null;
                                    return (
                                        <div
                                            key={`trx-${pm.id}`}
                                            className="mt-3 p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 space-y-2"
                                        >
                                            {pm.account_number && (
                                                <div className="text-xs font-semibold text-gray-800">
                                                    Account Number:{' '}
                                                    <span className="font-mono text-[#0B3B2E] font-bold">{pm.account_number}</span>
                                                </div>
                                            )}
                                            {pm.instructions && (
                                                <div className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-stone-200">
                                                    {pm.instructions}
                                                </div>
                                            )}
                                            <div>
                                                <label htmlFor="checkout_transaction_id" className="block text-xs font-semibold text-gray-700 mb-1">
                                                    Transaction ID (TrxID) <span className="text-[#F96D16]">*</span>
                                                </label>
                                                <input
                                                    id="checkout_transaction_id"
                                                    type="text"
                                                    aria-required="true"
                                                    value={transactionId}
                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                    placeholder="e.g. 8N7A6D..."
                                                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#F96D16]/20 focus:border-[#F96D16] text-sm font-mono uppercase bg-white"
                                                />
                                                {errors.payment_transaction_id && (
                                                    <p className="text-xs text-rose-600 mt-1">
                                                        {errors.payment_transaction_id}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {activePaymentMethods.length === 0 && (
                                    <p className="text-xs text-rose-600 mt-2">
                                        কোনো পেমেন্ট পদ্ধতি সক্রিয় নেই। অ্যাডমিন প্যানেল থেকে পেমেন্ট পদ্ধতি সক্রিয় করুন।
                                    </p>
                                )}
                                {errors.payment_method && (
                                    <p className="text-xs text-rose-600 mt-1">{errors.payment_method}</p>
                                )}
                            </div>

                            {/* Bottom Terms & Place Order Row */}
                            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <label className="flex items-center gap-2.5 text-xs text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreedTerms}
                                        onChange={(e) => setAgreedTerms(e.target.checked)}
                                        className="rounded border-stone-300 text-[#F96D16] focus:ring-[#F96D16] accent-[#F96D16]"
                                    />
                                    <span>
                                        I agree to the{' '}
                                        <Link href="/page/terms-conditions" className="text-[#0B3B2E] font-semibold underline">
                                            Terms &amp; Conditions
                                        </Link>{' '}
                                        and{' '}
                                        <Link href="/page/privacy-policy" className="text-[#0B3B2E] font-semibold underline">
                                            Privacy Policy
                                        </Link>
                                        .
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || activePaymentMethods.length === 0 || !agreedTerms}
                                    className="inline-flex items-center justify-center gap-2 py-3 px-7 bg-[#F96D16] hover:bg-[#EA580C] text-white font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Place Order ({formatBdt(grandTotal)})</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Order Summary & Trust Card (4 cols) */}
                    <div className="lg:col-span-4 space-y-5">
                        {/* Unified Order Summary Card */}
                        <div className="bg-white rounded-3xl shadow-[0_2px_14px_rgba(15,23,42,0.04)] border border-stone-200/80 p-6">
                            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-stone-100">
                                <h3 className="font-serif text-lg font-bold text-gray-900">Order Summary</h3>
                                <span className="text-xs font-medium text-gray-500">
                                    {isCartMode && cart ? `${cart.total_items} Items` : `${quantity} Item${quantity > 1 ? 's' : ''}`}
                                </span>
                            </div>

                            {isCartMode && cart ? (
                                <div className="space-y-3.5 divide-y divide-stone-100">
                                    {cart.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="pt-3.5 first:pt-0 flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-14 h-14 rounded-xl bg-[#F6EDE3] overflow-hidden shrink-0">
                                                    <SafeImage
                                                        src={item.image_url}
                                                        alt={item.product_title}
                                                        className="w-full h-full object-cover"
                                                        fallbackIconSize="w-5 h-5"
                                                        fallbackText=""
                                                        fallbackClassName="w-14 h-14 rounded-xl shrink-0"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-bold text-gray-900 truncate">
                                                        {item.product_title}
                                                    </h4>
                                                    {item.variant_name && (
                                                        <p className="text-[11px] text-gray-500">
                                                            {item.variant_name}
                                                        </p>
                                                    )}
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        Qty: {item.quantity} × {formatBdt(item.unit_price)}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs sm:text-sm font-bold text-gray-900 shrink-0">
                                                {formatBdt(item.line_total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : product ? (
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-16 h-16 rounded-xl bg-[#F6EDE3] overflow-hidden shrink-0">
                                                <SafeImage
                                                    src={primaryImage ? (primaryImage.thumb_url || primaryImage.url) : null}
                                                    alt={primaryImage?.alt_text || product.title}
                                                    className="w-full h-full object-cover"
                                                    fallbackIconSize="w-6 h-6"
                                                    fallbackText=""
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                                    {product.title}
                                                </h4>
                                                {selectedVariant && (
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {selectedVariant.name}
                                                    </p>
                                                )}

                                                {/* Inline Quantity Stepper */}
                                                <div className="inline-flex items-center border border-stone-200 rounded-full bg-[#FAF7F2] px-1 py-0.5 mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                                        disabled={quantity <= 1}
                                                        aria-label="Decrease quantity"
                                                        className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-40"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-7 text-center text-xs font-bold text-gray-900">
                                                        {quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuantity((q) => q + 1)}
                                                        disabled={
                                                            selectedVariant?.manage_stock
                                                                ? quantity >= selectedVariant.stock_quantity
                                                                : false
                                                        }
                                                        aria-label="Increase quantity"
                                                        className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-40"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 shrink-0">
                                            {formatBdt(unitPrice * quantity)}
                                        </span>
                                    </div>

                                    {/* Multi-Variant Selector */}
                                    {product.has_variants && product.variants.length > 1 && (
                                        <div className="pt-3 border-t border-stone-100">
                                            <label className="block text-[11px] font-semibold text-gray-500 mb-2">
                                                Select Variant:
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {product.variants.map((v) => {
                                                    const isSelected = selectedVariant?.id === v.id;
                                                    const isOutOfStock = v.manage_stock && v.stock_quantity <= 0;
                                                    return (
                                                        <button
                                                            key={v.id}
                                                            type="button"
                                                            disabled={isOutOfStock}
                                                            onClick={() => setSelectedVariant(v)}
                                                            className={`p-2 text-left rounded-xl border text-xs transition-all ${
                                                                isSelected
                                                                    ? 'border-[#F96D16] bg-orange-50/40 text-[#EA580C] font-bold'
                                                                    : 'border-stone-200 hover:border-stone-300 text-gray-700'
                                                            } ${isOutOfStock ? 'opacity-40 cursor-not-allowed bg-stone-50' : 'cursor-pointer'}`}
                                                        >
                                                            <div className="truncate font-semibold">{v.name}</div>
                                                            <div className="text-[11px] text-gray-500 mt-0.5">
                                                                {formatBdt(v.sale_price ?? v.regular_price)}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {/* Totals Breakdown */}
                            <div className="mt-5 pt-4 border-t border-stone-100 space-y-2.5 text-xs sm:text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-gray-900">{formatBdt(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 items-center">
                                    <span className="truncate pr-2">
                                        Delivery Charge ({selectedMethodName})
                                    </span>
                                    <span className="font-semibold text-gray-900 shrink-0">
                                        {shippingFee === 0 ? 'Free' : formatBdt(shippingFee)}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline">
                                    <span className="text-sm sm:text-base font-bold text-gray-900">
                                        Total Payable
                                    </span>
                                    <span className="text-xl font-extrabold text-[#EA580C]">
                                        {formatBdt(grandTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Soft Green Trust Card matching Velure Reference */}
                        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-5 space-y-3.5">
                            <div className="flex items-start gap-3">
                                <Truck className="w-5 h-5 text-[#0B3B2E] shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Fast Delivery</p>
                                    <p className="text-[11px] text-gray-600">
                                        Estimated: {deliveryTime}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <RefreshCw className="w-5 h-5 text-[#0B3B2E] shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Easy Return</p>
                                    <p className="text-[11px] text-gray-600">
                                        7 days hassle-free return
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-[#0B3B2E] shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Secure Payment</p>
                                    <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                        <Lock className="w-3 h-3 text-[#0B3B2E]" />
                                        <span>100% secure &amp; multiple payment options</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
