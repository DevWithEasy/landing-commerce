import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, CreditCard, ExternalLink, MapPin, Package, Phone, Search, Truck, User } from 'lucide-react';
import { CustomerLayout } from '@/Layouts/CustomerLayout';
import { formatBdt } from '@/Shared/ProductCard';
import type { Category, Order, OrderItem, ProductImage } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface OrderDetailProps {
    theme: StorefrontTheme;
    categories: Category[];
    order: Order;
}

export default function CustomerOrderDetail({ theme, categories, order }: OrderDetailProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">অপেক্ষারত (Pending)</span>;
            case 'confirmed':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">নিশ্চিত (Confirmed)</span>;
            case 'processing':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">প্রস্তুত হচ্ছে (Processing)</span>;
            case 'handed_to_courier':
            case 'in_transit':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">ডেলিভারির পথে (In Transit)</span>;
            case 'delivered':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ডেলিভারি সম্পন্ন (Delivered)</span>;
            case 'cancelled':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">বাতিল (Cancelled)</span>;
            default:
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <CustomerLayout theme={theme} categories={categories} title={`অর্ডার #${order.order_number} বিবরণ`}>
            <Head>
                <title>{`অর্ডার #${order.order_number} বিবরণ`}</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/customer/orders"
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition"
                                title="অর্ডার তালিকায় ফিরে যান"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">
                                অর্ডার #{order.order_number}
                            </h2>
                            {getStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 pl-8">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                                অর্ডার সম্পন্ন হয়েছে: {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pl-8 sm:pl-0">
                        <Link
                            href={`/track-order?order_number=${order.order_number}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                            <Search className="w-3.5 h-3.5" />
                            <span>লাইভ ট্র্যাকিং</span>
                        </Link>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Order Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <Package className="w-4 h-4 text-indigo-600" />
                                    <span>অর্ডারকৃত পণ্যসমূহ ({order.items.length})</span>
                                </h3>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {order.items.map((item: OrderItem) => {
                                    const primaryImg = item.product?.images?.find((img: ProductImage) => img.is_primary) || item.product?.images?.[0];
                                    const imgUrl = primaryImg ? `/storage/${primaryImg.file_path}` : null;

                                    return (
                                        <div key={item.id} className="p-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                    {imgUrl ? (
                                                        <img src={imgUrl} alt={item.product_title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-gray-900 text-sm truncate">
                                                        {item.product_title}
                                                    </h4>
                                                    {item.variant_name && (
                                                        <p className="text-xs text-indigo-600 font-medium mt-0.5">
                                                            ভেরিয়েন্ট: {item.variant_name}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatBdt(item.unit_price)} × {item.quantity} টি
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right flex-shrink-0">
                                                <div className="font-extrabold text-gray-900 text-sm">
                                                    {formatBdt(item.total_price)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Summary Calculation */}
                            <div className="p-5 bg-gray-50/70 border-t border-gray-100 space-y-2.5">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>সাবটোটাল (Subtotal):</span>
                                    <span className="font-semibold text-gray-900">{formatBdt(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>ডেলিভারি চার্জ (Delivery Fee):</span>
                                    <span className="font-semibold text-gray-900">+{formatBdt(order.shipping_fee)}</span>
                                </div>
                                {Number(order.discount) > 0 && (
                                    <div className="flex justify-between text-xs text-emerald-600">
                                        <span>ছাড় (Discount):</span>
                                        <span className="font-semibold">-{formatBdt(order.discount)}</span>
                                    </div>
                                )}
                                <div className="pt-2.5 border-t border-gray-200 flex justify-between text-sm font-extrabold text-gray-900">
                                    <span>সর্বমোট প্রদেয় (Grand Total):</span>
                                    <span className="text-indigo-600 text-base">{formatBdt(order.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Notes if present */}
                        {order.notes && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
                                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-500">
                                    অর্ডারের বিশেষ নির্দেশনা (Customer Note)
                                </h4>
                                <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    {order.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right 1 Col: Delivery, Payment & Courier Info */}
                    <div className="space-y-6">
                        {/* Delivery Info */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
                                <MapPin className="w-4 h-4 text-indigo-600" />
                                <span>ডেলিভারি ঠিকানা</span>
                            </h3>

                            <div className="space-y-2.5 text-xs">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span className="font-bold text-gray-900">{order.customer_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span>{order.customer_phone}</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-700">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p>{order.delivery_address}</p>
                                        <p className="text-gray-500 font-medium mt-0.5">
                                            {[order.upazila, order.district].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
                                <CreditCard className="w-4 h-4 text-indigo-600" />
                                <span>পেমেন্ট তথ্য</span>
                            </h3>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">পদ্ধতি (Method):</span>
                                    <span className="font-bold uppercase text-gray-800">{order.payment_method}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">স্ট্যাটাস (Status):</span>
                                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                                        order.payment_status === 'paid'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                        {order.payment_status === 'paid' ? 'পরিশোধিত (Paid)' : 'ক্যাশ অন ডেলিভারি (Unpaid)'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Courier Consignment info if assigned */}
                        {(order.courier_name || order.courier_tracking_id) && (
                            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-3">
                                <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2 border-b border-indigo-100 pb-2">
                                    <Truck className="w-4 h-4 text-indigo-600" />
                                    <span>কুরিয়ার শিপমেন্ট তথ্য</span>
                                </h3>

                                <div className="space-y-2 text-xs">
                                    {order.courier_name && (
                                        <div className="flex justify-between">
                                            <span className="text-indigo-700">কুরিয়ার:</span>
                                            <span className="font-bold text-indigo-950 uppercase">{order.courier_name}</span>
                                        </div>
                                    )}
                                    {order.courier_tracking_id && (
                                        <div className="flex justify-between">
                                            <span className="text-indigo-700">ট্র্যাকিং কোড:</span>
                                            <span className="font-mono font-bold text-indigo-950">{order.courier_tracking_id}</span>
                                        </div>
                                    )}

                                    {order.courier_tracking_url && (
                                        <div className="pt-2">
                                            <a
                                                href={order.courier_tracking_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold underline"
                                            >
                                                <span>কুরিয়ার ওয়েবসাইটে সরাসরি ট্র্যাক করুন</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
