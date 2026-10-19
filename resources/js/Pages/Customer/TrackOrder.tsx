import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ExternalLink,
    Hash,
    MapPin,
    Package,
    Phone,
    Search,
    ShieldCheck,
    Truck,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import { formatBdt } from '@/Shared/ProductCard';
import type { Category, OrderTrackingData } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface TrackOrderProps {
    theme: StorefrontTheme;
    categories: Category[];
    initialTracking: OrderTrackingData | null;
    queryParams: {
        token: string;
        order_number: string;
        phone: string;
    };
}

export default function TrackOrder({
    theme,
    categories,
    initialTracking,
    queryParams,
}: TrackOrderProps) {
    const [orderNumber, setOrderNumber] = useState(queryParams.order_number || '');
    const [phone, setPhone] = useState(queryParams.phone || '');
    const [token, setToken] = useState(queryParams.token || '');
    const [trackingMode, setTrackingMode] = useState<'standard' | 'token'>(
        queryParams.token ? 'token' : 'standard'
    );

    const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(initialTracking);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSearch = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

        try {
            const body =
                trackingMode === 'token'
                    ? { token: token.trim() }
                    : {
                          order_number: orderNumber.trim(),
                          phone: phone.trim(),
                      };

            const response = await fetch('/track-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok && data.order) {
                setTrackingData(data.order);
                setErrorMessage(null);
            } else {
                setTrackingData(null);
                setErrorMessage(data.message || 'আপনার প্রদত্ত তথ্যের সাথে কোনো অর্ডার মেলেনি। অনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।');
            }
        } catch {
            setTrackingData(null);
            setErrorMessage('সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusStepIndex = (status: string): number => {
        switch (status) {
            case 'pending':
                return 0;
            case 'confirmed':
                return 1;
            case 'processing':
                return 2;
            case 'handed_to_courier':
            case 'in_transit':
                return 3;
            case 'delivered':
                return 4;
            default:
                return -1;
        }
    };

    const steps = [
        { key: 'pending', title: 'অর্ডার গৃহীত হয়েছে', desc: 'Order Placed' },
        { key: 'confirmed', title: 'কনফার্ম করা হয়েছে', desc: 'Confirmed' },
        { key: 'processing', title: 'প্যাকেজিং ও প্রস্তুতি', desc: 'Processing' },
        { key: 'in_transit', title: 'ডেলিভারির পথে', desc: 'In Transit' },
        { key: 'delivered', title: 'ডেলিভারি সম্পন্ন', desc: 'Delivered' },
    ];

    const currentStepIndex = trackingData ? getStatusStepIndex(trackingData.status) : -1;
    const isCancelled = trackingData?.status === 'cancelled' || trackingData?.status === 'returned';

    return (
        <StorefrontLayout theme={theme} categories={categories}>
            <Head title="অর্ডার ট্র্যাকিং | Track Order" />

            <div className="bg-gradient-to-b from-indigo-50/50 via-white to-gray-50 py-10 md:py-16 min-h-[calc(100vh-280px)]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    {/* Header Banner */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-bold">
                            <Truck className="w-3.5 h-3.5" />
                            <span>লাইভ ডেলিভারি ট্র্যাকিং</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                            আপনার অর্ডার ট্র্যাক করুন
                        </h1>
                        <p className="text-sm text-gray-500 max-w-lg mx-auto">
                            অর্ডার নম্বর এবং মোবাইল নম্বর প্রদান করে আপনার অর্ডারের বর্তমান অবস্থা জেনে নিন।
                        </p>
                    </div>

                    {/* Search Form Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
                        <div className="flex border-b border-gray-100 pb-4 mb-6 gap-6 text-sm">
                            <button
                                type="button"
                                onClick={() => setTrackingMode('standard')}
                                className={`font-bold transition pb-2 -mb-4 border-b-2 ${
                                    trackingMode === 'standard'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-400 hover:text-gray-700'
                                }`}
                            >
                                অর্ডার নম্বর ও মোবাইল নম্বর দিয়ে খুঁজুন
                            </button>
                            <button
                                type="button"
                                onClick={() => setTrackingMode('token')}
                                className={`font-bold transition pb-2 -mb-4 border-b-2 ${
                                    trackingMode === 'token'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-400 hover:text-gray-700'
                                }`}
                            >
                                ট্র্যাকিং লিংক / টোকেন দিয়ে খুঁজুন
                            </button>
                        </div>

                        <form onSubmit={handleSearch} className="space-y-4">
                            {trackingMode === 'standard' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                            অর্ডার নম্বর (Order Number)
                                        </label>
                                        <div className="relative">
                                            <Hash className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                required
                                                placeholder="উদা: ORD-20261019-XXXX"
                                                value={orderNumber}
                                                onChange={(e) => setOrderNumber(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                            মোবাইল নম্বর (Customer Phone)
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                required
                                                placeholder="উদা: 01700000000"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                        নিরাপদ ট্র্যাকিং টোকেন (Security Token)
                                    </label>
                                    <div className="relative">
                                        <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="আপনার অর্ডার কনফার্মেশন লিংকের টোকেন প্রদান করুন"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-mono text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Search className="w-4 h-4" />
                                    <span>{isLoading ? 'অনুসন্ধান করা হচ্ছে...' : 'অর্ডার ট্র্যাক করুন'}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Tracking Results View */}
                    {trackingData && (
                        <div className="space-y-6">
                            {/* Order Status Banner */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-extrabold text-gray-900">
                                                অর্ডার #{trackingData.order_number}
                                            </h2>
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                {trackingData.status_label.bn}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            <span>তারিখ: {trackingData.created_at_human}</span>
                                            <span>•</span>
                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                            <span>জেলা: {trackingData.district}</span>
                                        </p>
                                    </div>

                                    <div className="text-right sm:self-center">
                                        <p className="text-xs text-gray-500">সর্বমোট প্রদেয়</p>
                                        <p className="text-lg font-black text-indigo-600">
                                            {formatBdt(trackingData.total)}
                                        </p>
                                    </div>
                                </div>

                                {/* Step Progress Bar (If not cancelled) */}
                                {!isCancelled ? (
                                    <div className="space-y-4">
                                        <div className="relative">
                                            {/* Progress Background Line */}
                                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 -z-0" />
                                            <div
                                                className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 transition-all duration-500 -z-0"
                                                style={{
                                                    width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%`,
                                                }}
                                            />

                                            <div className="relative z-10 flex justify-between">
                                                {steps.map((step, idx) => {
                                                    const isCompleted = currentStepIndex >= idx;
                                                    const isCurrent = currentStepIndex === idx;

                                                    return (
                                                        <div key={step.key} className="flex flex-col items-center text-center">
                                                            <div
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition duration-300 ${
                                                                    isCurrent
                                                                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow'
                                                                        : isCompleted
                                                                        ? 'bg-indigo-600 text-white'
                                                                        : 'bg-white text-gray-400 border-2 border-gray-200'
                                                                }`}
                                                            >
                                                                {isCompleted ? (
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                ) : (
                                                                    <span>{idx + 1}</span>
                                                                )}
                                                            </div>
                                                            <span
                                                                className={`mt-2 text-xs font-bold max-w-[80px] sm:max-w-none ${
                                                                    isCurrent
                                                                        ? 'text-indigo-600'
                                                                        : isCompleted
                                                                        ? 'text-gray-800'
                                                                        : 'text-gray-400'
                                                                }`}
                                                            >
                                                                {step.title}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <div className="text-xs">
                                            <p className="font-bold">অর্ডারটি বাতিল বা ফেরত সম্পন্ন হয়েছে</p>
                                            <p className="text-rose-600 mt-0.5">
                                                প্রয়োজনে যেকোনো তথ্যের জন্য আমাদের কাস্টমার সার্ভিসের সাথে যোগাযোগ করুন।
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Courier Shipment Info */}
                                {trackingData.courier_name && (
                                    <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                                                <Truck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-indigo-950">
                                                    শিপমেন্ট কুরিয়ার: {trackingData.courier_name.toUpperCase()}
                                                </p>
                                                {trackingData.courier_tracking_id && (
                                                    <p className="text-xs text-indigo-700 font-mono mt-0.5">
                                                        ট্র্যাকিং আইডি: {trackingData.courier_tracking_id}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {trackingData.courier_tracking_url && (
                                            <a
                                                href={trackingData.courier_tracking_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition self-start sm:self-auto shadow-xs"
                                            >
                                                <span>কুরিয়ার ওয়েবসাইটে সরাসরি দেখুন</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Order Items & Summary */}
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                        <Package className="w-4 h-4 text-indigo-600" />
                                        <span>অর্ডারকৃত পণ্যের বিবরণ</span>
                                    </h3>
                                    <span className="text-xs text-gray-500">ফোন: {trackingData.masked_phone}</span>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {trackingData.items.map((item) => (
                                        <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">
                                                    {item.product_title}
                                                </h4>
                                                {item.variant_name && (
                                                    <p className="text-xs text-indigo-600 font-medium">
                                                        ভেরিয়েন্ট: {item.variant_name}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {formatBdt(item.unit_price)} × {item.quantity} টি
                                                </p>
                                            </div>
                                            <div className="font-extrabold text-gray-900 text-sm">
                                                {formatBdt(item.total_price)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-5 bg-gray-50/70 border-t border-gray-100 space-y-2 text-xs">
                                    <div className="flex justify-between text-gray-600">
                                        <span>সাবটোটাল:</span>
                                        <span className="font-semibold text-gray-900">{formatBdt(trackingData.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>ডেলিভারি চার্জ:</span>
                                        <span className="font-semibold text-gray-900">+{formatBdt(trackingData.shipping_fee)}</span>
                                    </div>
                                    {Number(trackingData.discount) > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>ছাড়:</span>
                                            <span className="font-semibold">-{formatBdt(trackingData.discount)}</span>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-extrabold text-gray-900">
                                        <span>সর্বমোট প্রদেয়:</span>
                                        <span className="text-indigo-600 text-base">{formatBdt(trackingData.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </StorefrontLayout>
    );
}
