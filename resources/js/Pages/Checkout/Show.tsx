import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Lock,
    Minus,
    Package,
    Plus,
    ShieldCheck,
    Truck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { trackAddPaymentInfo, trackInitiateCheckout } from '@/Shared/Tracking';
import type { CheckoutShowProps, District, ProductVariant } from '@/types';

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
    product,
    districts,
    defaultShippingFee,
    defaultZoneName,
    defaultShippingMethods = [],
    paymentMethods = [],
}: CheckoutShowProps) {
    // 1. Variant & Quantity selection
    const availableVariants = useMemo(() => {
        return product.variants.filter((v) => !v.manage_stock || v.stock_quantity > 0);
    }, [product.variants]);

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(() => {
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
    const [district, setDistrict] = useState<string>('Dhaka');
    const [upazila, setUpazila] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [honeypot, setHoneypot] = useState<string>('');

    // 4. Dynamic Shipping Methods State
    const [availableShippingMethods, setAvailableShippingMethods] = useState<any[]>(defaultShippingMethods || []);
    const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<number | null>(() => {
        if (defaultShippingMethods && defaultShippingMethods.length > 0) {
            const def = defaultShippingMethods.find((m) => m.is_default);
            return def ? def.id : defaultShippingMethods[0].id;
        }
        return null;
    });
    const [shippingFee, setShippingFee] = useState<number>(defaultShippingFee || 70);
    const [zoneName, setZoneName] = useState<string>(defaultZoneName || 'Inside Dhaka');
    const [selectedMethodName, setSelectedMethodName] = useState<string>('');
    const [deliveryTime, setDeliveryTime] = useState<string>('24-48 hours');
    const [isCalculatingShipping, setIsCalculatingShipping] = useState<boolean>(false);

    // 5. Payment Methods State
    const activePaymentMethods = useMemo(() => {
        if (paymentMethods && paymentMethods.length > 0) {
            return paymentMethods.filter((p) => p.is_active);
        }
        return [
            {
                id: 1,
                name: 'Cash on Delivery',
                code: 'cod',
                description: 'Pay cash upon delivery at your doorstep.',
                instructions: 'Keep the exact cash amount ready for the delivery courier.',
                account_number: null,
                is_active: true,
                is_online: false,
                requires_transaction_id: false,
                sort_order: 1,
            },
        ];
    }, [paymentMethods]);

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(() => {
        return activePaymentMethods[0]?.code || 'cod';
    });
    const [transactionId, setTransactionId] = useState<string>('');

    // 6. Submission & Error States
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

    // Filtered upazilas based on selected district
    const selectedDistrictObj = useMemo<District | undefined>(() => {
        return districts.find((d) => d.name.toLowerCase() === district.toLowerCase());
    }, [districts, district]);

    const upazilaOptions = useMemo(() => {
        return selectedDistrictObj?.upazilas || [];
    }, [selectedDistrictObj]);

    // Recalculate shipping fee whenever district, upazila, or selectedShippingMethodId changes
    useEffect(() => {
        if (!district) return;

        let isCurrent = true;
        setIsCalculatingShipping(true);

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        fetch('/checkout/shipping-fee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({
                district,
                upazila: upazila || null,
                shipping_method_id: selectedShippingMethodId || null,
            }),
        })
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to calculate shipping');
                return res.json();
            })
            .then((data) => {
                if (isCurrent) {
                    setShippingFee(parseFloat(data.shipping_fee) || 70);
                    setZoneName(data.zone_name || '');
                    setDeliveryTime(data.delivery_time || '24-48 hours');
                    if (data.available_methods && Array.isArray(data.available_methods)) {
                        setAvailableShippingMethods(data.available_methods);
                        if (data.shipping_method_id) {
                            setSelectedShippingMethodId(data.shipping_method_id);
                        } else if (data.available_methods.length > 0 && !selectedShippingMethodId) {
                            setSelectedShippingMethodId(data.available_methods[0].id);
                        }
                    }
                    if (data.shipping_method_name) {
                        setSelectedMethodName(data.shipping_method_name);
                    }
                }
            })
            .catch(() => {
                if (isCurrent) {
                    const dLower = district.toLowerCase();
                    const uLower = upazila.toLowerCase();
                    if (dLower === 'dhaka' && (uLower === 'savar' || uLower === 'keraniganj')) {
                        setShippingFee(100);
                        setZoneName('Dhaka Suburbs (Sub-Dhaka)');
                    } else if (dLower === 'dhaka') {
                        setShippingFee(70);
                        setZoneName('Inside Dhaka');
                    } else if (dLower === 'gazipur' || dLower === 'narayanganj') {
                        setShippingFee(100);
                        setZoneName('Dhaka Suburbs (Sub-Dhaka)');
                    } else {
                        setShippingFee(130);
                        setZoneName('Outside Dhaka');
                    }
                }
            })
            .finally(() => {
                if (isCurrent) {
                    setIsCalculatingShipping(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [district, upazila, selectedShippingMethodId]);

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
        return unitPrice * quantity;
    }, [unitPrice, quantity]);

    const grandTotal = useMemo(() => {
        return subtotal + shippingFee;
    }, [subtotal, shippingFee]);

    // Track InitiateCheckout on page view
    useEffect(() => {
        trackInitiateCheckout({
            value: grandTotal,
            contentIds: [String(selectedVariant?.id || product.id)],
            numItems: quantity,
        });
    }, []);

    // Primary image resolution
    const primaryImage = useMemo(() => {
        if (selectedVariant?.id) {
            const variantImg = product.images.find((img) => img.variant_id === selectedVariant.id);
            if (variantImg) return variantImg;
        }
        return product.images.find((img) => img.is_primary) || product.images[0];
    }, [product.images, selectedVariant]);

    // Handle checkout submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setRateLimitMessage(null);

        if (!selectedVariant) {
            setErrors({ variant: 'অনুগ্রহ করে একটি ভ্যারিয়েন্ট নির্বাচন করুন।' });
            return;
        }

        setIsSubmitting(true);

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        const payload = {
            customer_name: customerName,
            customer_phone: customerPhone,
            delivery_address: deliveryAddress,
            district,
            upazila: upazila || null,
            notes: notes || null,
            shipping_method_id: selectedShippingMethodId || undefined,
            payment_method: selectedPaymentMethod,
            payment_transaction_id: transactionId || undefined,
            idempotency_key: idempotencyKey,
            items: [
                {
                    variant_id: selectedVariant.id,
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
        <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
            <Head title={`অর্ডার কনফার্ম করুন - ${product.title}`} />

            <div className="max-w-4xl mx-auto">
                {/* Header Brand & Trust Badges */}
                <header className="mb-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold mb-2 border border-emerald-200">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>১০০% বিশ্বস্ত ক্যাশ অন ডেলিভারি সার্ভিস</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        অর্ডার সম্পূর্ণ করতে নিচের ফর্মটি পূরণ করুন
                    </h1>
                </header>

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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Checkout Form */}
                    <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
                        <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
                            <Truck className="w-5 h-5 text-primary-600" />
                            <h2 className="text-lg font-bold text-slate-800">ডেলিভারি তথ্য দিন</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            {/* Customer Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    আপনার নাম <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border ${
                                        errors.customer_name || errors.name
                                            ? 'border-red-400 bg-red-50/30'
                                            : 'border-slate-300'
                                    } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm`}
                                />
                                {(errors.customer_name || errors.name) && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.customer_name || errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Customer Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    মোবাইল নম্বর <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-medium">
                                        +88
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="017XXXXXXXX"
                                        className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl border ${
                                            errors.customer_phone || errors.phone
                                                ? 'border-red-400 bg-red-50/30'
                                                : 'border-slate-300'
                                        } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm`}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    ১১ ডিজিটের সচল মোবাইল নম্বর দিন (যেমন: 01712345678)
                                </p>
                                {(errors.customer_phone || errors.phone) && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.customer_phone || errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* Delivery Address */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    placeholder="বাসা নং, রোড নং, এলাকা/গ্রাম এর নাম লিখুন"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border ${
                                        errors.delivery_address || errors.address
                                            ? 'border-red-400 bg-red-50/30'
                                            : 'border-slate-300'
                                    } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm`}
                                />
                                {(errors.delivery_address || errors.address) && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.delivery_address || errors.address}
                                    </p>
                                )}
                            </div>

                            {/* District & Upazila Selection Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        জেলা <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={district}
                                        onChange={(e) => {
                                            setDistrict(e.target.value);
                                            setUpazila('');
                                        }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                                    >
                                        {districts.map((d) => (
                                            <option key={d.id} value={d.name}>
                                                {d.name} {d.bn_name ? `(${d.bn_name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.district && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {errors.district}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        থানা / উপজেলা{' '}
                                        <span className="text-xs text-slate-400 font-normal">
                                            (ঐচ্ছিক)
                                        </span>
                                    </label>
                                    <select
                                        value={upazila}
                                        onChange={(e) => setUpazila(e.target.value)}
                                        disabled={upazilaOptions.length === 0}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400"
                                    >
                                        <option value="">থানা নির্বাচন করুন</option>
                                        {upazilaOptions.map((u) => (
                                            <option key={u.id} value={u.name}>
                                                {u.name} {u.bn_name ? `(${u.bn_name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Shipping Method Options */}
                            {availableShippingMethods.length > 0 && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        ডেলিভারি মেথড নির্বাচন করুন
                                    </label>
                                    <div className="space-y-2">
                                        {availableShippingMethods.map((method: any) => {
                                            const isSelected = selectedShippingMethodId === method.id;
                                            return (
                                                <div
                                                    key={method.id}
                                                    onClick={() => setSelectedShippingMethodId(method.id)}
                                                    className={`p-3 rounded-xl border text-sm cursor-pointer transition-all flex items-center justify-between ${
                                                        isSelected
                                                            ? 'border-primary-600 bg-primary-50/40 ring-1 ring-primary-500'
                                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                                isSelected
                                                                    ? 'border-primary-600 bg-primary-600'
                                                                    : 'border-slate-300 bg-white'
                                                            }`}
                                                        >
                                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900">{method.name}</div>
                                                            {method.description && (
                                                                <div className="text-xs text-slate-500">{method.description}</div>
                                                            )}
                                                            {method.delivery_time && (
                                                                <div className="text-[11px] text-slate-400">
                                                                    আনুমানিক সময়: {method.delivery_time}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-bold text-slate-900">
                                                        {formatBdt(method.rate)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.shipping_method_id && (
                                        <p className="text-xs text-red-600 mt-1">{errors.shipping_method_id}</p>
                                    )}
                                </div>
                            )}

                            {/* Order Notes (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    বিশেষ নির্দেশনা{' '}
                                    <span className="text-xs text-slate-400 font-normal">
                                        (ঐচ্ছিক)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="ডেলিভারি সম্পর্কিত কোনো বিশেষ নির্দেশনা থাকলে লিখুন"
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                />
                            </div>

                            {/* Payment Method Selection */}
                            <div className="pt-2 space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    পেমেন্ট পদ্ধতি নির্বাচন করুন
                                </label>
                                <div className="space-y-2">
                                    {activePaymentMethods.map((pm: any) => {
                                        const isSelected = selectedPaymentMethod === pm.code;
                                        return (
                                            <div
                                                key={pm.id}
                                                onClick={() => {
                                                    setSelectedPaymentMethod(pm.code);
                                                    trackAddPaymentInfo(pm.code, grandTotal);
                                                }}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-500'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                                isSelected
                                                                    ? 'border-emerald-600 bg-emerald-600'
                                                                    : 'border-slate-300 bg-white'
                                                            }`}
                                                        >
                                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-900">
                                                            {pm.name}
                                                        </span>
                                                    </div>
                                                    {pm.code === 'cod' ? (
                                                        <span className="text-xs bg-emerald-200/60 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                                                            হাতে পেয়ে টাকা দিন
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-md">
                                                            ম্যানুয়াল পেমেন্ট
                                                        </span>
                                                    )}
                                                </div>

                                                {pm.description && (
                                                    <p className="text-xs text-slate-500 mt-1.5 ml-6.5">
                                                        {pm.description}
                                                    </p>
                                                )}

                                                {isSelected && pm.requires_transaction_id && (
                                                    <div className="mt-3 pt-3 border-t border-emerald-200/60 ml-6.5 space-y-2">
                                                        {pm.account_number && (
                                                            <div className="text-xs font-semibold text-slate-800">
                                                                একাউন্ট নাম্বার: <span className="font-mono text-emerald-700 font-bold">{pm.account_number}</span>
                                                            </div>
                                                        )}
                                                        {pm.instructions && (
                                                            <div className="text-xs text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200">
                                                                {pm.instructions}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                                                ট্রানজেকশন আইডি (TrxID) <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={transactionId}
                                                                onChange={(e) => setTransactionId(e.target.value)}
                                                                placeholder="যেমন: 8N7A6D..."
                                                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-mono uppercase bg-white"
                                                            />
                                                            {errors.payment_transaction_id && (
                                                                <p className="text-xs text-red-600 mt-1">
                                                                    {errors.payment_transaction_id}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.payment_method && (
                                    <p className="text-xs text-red-600 mt-1">{errors.payment_method}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-4 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base sm:text-lg rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        <span>অর্ডার প্রসেস হচ্ছে...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span>অর্ডার কনফার্ম করুন — {formatBdt(grandTotal)}</span>
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 mt-2">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span>আপনার তথ্য সম্পূর্ণ নিরাপদ ও গোপন রাখা হবে</span>
                            </p>
                        </form>
                    </div>

                    {/* Right Column: Product Card & Order Summary */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Product & Variant Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4 text-primary-600" />
                                <span>পণ্য বিবরণ</span>
                            </h3>

                            <div className="flex gap-3.5 items-start">
                                {primaryImage ? (
                                    <img
                                        src={primaryImage.thumb_url || primaryImage.url}
                                        alt={primaryImage.alt_text || product.title}
                                        className="w-20 h-20 object-cover rounded-xl border border-slate-100 shrink-0"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                        <Package className="w-8 h-8" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                                        {product.title}
                                    </h4>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-base font-extrabold text-emerald-600">
                                            {formatBdt(unitPrice)}
                                        </span>
                                        {selectedVariant?.sale_price && (
                                            <span className="text-xs text-slate-400 line-through">
                                                {formatBdt(selectedVariant.regular_price)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1">
                                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-md">
                                            স্টকে আছে
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Multi-Variant Selector */}
                            {product.has_variants && product.variants.length > 1 && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                                        ভ্যারিয়েন্ট নির্বাচন করুন:
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {product.variants.map((v) => {
                                            const isSelected = selectedVariant.id === v.id;
                                            const isOutOfStock =
                                                v.manage_stock && v.stock_quantity <= 0;

                                            return (
                                                <button
                                                    key={v.id}
                                                    type="button"
                                                    disabled={isOutOfStock}
                                                    onClick={() => setSelectedVariant(v)}
                                                    className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                                                        isSelected
                                                            ? 'border-emerald-600 bg-emerald-50/40 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                                                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                                    } ${isOutOfStock ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
                                                >
                                                    <div className="truncate font-semibold">
                                                        {v.name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                                        {formatBdt(v.sale_price ?? v.regular_price)}
                                                    </div>
                                                    {isOutOfStock && (
                                                        <div className="text-[10px] text-red-500 font-bold mt-0.5">
                                                            স্টক শেষ
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quantity Control */}
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">পরিমাণ:</span>
                                <div className="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        disabled={quantity <= 1}
                                        className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-10 text-center font-bold text-sm text-slate-800">
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
                                        className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Order Calculation Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                            <h3 className="text-base font-bold text-slate-800 mb-3">
                                অর্ডারের হিসাব
                            </h3>

                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between text-slate-600">
                                    <span>সাবটোটাল ({quantity} টি)</span>
                                    <span className="font-semibold text-slate-900">
                                        {formatBdt(subtotal)}
                                    </span>
                                </div>

                                <div className="flex justify-between text-slate-600 items-center">
                                    <div className="flex items-center gap-1.5">
                                        <span>ডেলিভারি চার্জ</span>
                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                            {selectedMethodName || zoneName}
                                        </span>
                                    </div>
                                    <span className="font-semibold text-slate-900">
                                        {isCalculatingShipping ? (
                                            <span className="text-xs text-slate-400">
                                                হিসাব হচ্ছে...
                                            </span>
                                        ) : (
                                            formatBdt(shippingFee)
                                        )}
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                                    <span className="text-base font-bold text-slate-900">
                                        মোট প্রদেয় টাকা
                                    </span>
                                    <span className="text-xl font-extrabold text-emerald-600">
                                        {formatBdt(grandTotal)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>
                                    ডেলিভারি সময়: <strong>{deliveryTime}</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
