import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    Heart,
    Package,
    Search,
    ShoppingBag,
    Truck,
} from 'lucide-react';
import { CustomerLayout } from '@/Layouts/CustomerLayout';
import { formatBdt } from '@/Shared/ProductCard';
import type { Category, Order } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface DashboardProps {
    theme: StorefrontTheme;
    categories: Category[];
    customer: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        address: string | null;
        district: string | null;
        upazila: string | null;
        created_at: string | null;
    };
    stats: {
        total_orders: number;
        pending_orders: number;
        delivered_orders: number;
        wishlist_count: number;
    };
    recent_orders: Order[];
}

export default function CustomerDashboard({
    theme,
    categories,
    customer,
    stats,
    recent_orders,
}: DashboardProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">অপেক্ষারত (Pending)</span>;
            case 'confirmed':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">নিশ্চিত (Confirmed)</span>;
            case 'processing':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">প্রস্তুত হচ্ছে (Processing)</span>;
            case 'handed_to_courier':
            case 'in_transit':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">ডেলিভারির পথে (In Transit)</span>;
            case 'delivered':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ডেলিভারি সম্পন্ন (Delivered)</span>;
            case 'cancelled':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">বাতিল (Cancelled)</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <CustomerLayout theme={theme} categories={categories} title="কাস্টমার ড্যাশবোর্ড | Account Dashboard">
            <Head>
                <title>কাস্টমার ড্যাশবোর্ড | Account Dashboard</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="space-y-6">
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold">
                            স্বাগতম, {customer.name}!
                        </h2>
                        <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                            আপনার একাউন্ট থেকে সহজেই অর্ডার হিস্ট্রি, ডেলিভারি ট্র্যাকিং এবং পছন্দের পণ্য পরিচালনা করুন।
                        </p>
                    </div>
                    <Link
                        href="/shop"
                        className="px-5 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition shrink-0 flex items-center gap-2"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>শপিং শুরু করুন</span>
                    </Link>
                </div>

                {/* Metrics Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-gray-900">{stats.total_orders}</div>
                            <div className="text-xs text-gray-500 font-medium">মোট অর্ডার</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-gray-900">{stats.pending_orders}</div>
                            <div className="text-xs text-gray-500 font-medium">প্রক্রিয়াধীন</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-gray-900">{stats.delivered_orders}</div>
                            <div className="text-xs text-gray-500 font-medium">ডেলিভারি সম্পন্ন</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <Heart className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-gray-900">{stats.wishlist_count}</div>
                            <div className="text-xs text-gray-500 font-medium">পছন্দের পণ্য</div>
                        </div>
                    </div>
                </div>

                {/* Recent Orders Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">সাম্প্রতিক অর্ডারসমূহ (Recent Orders)</h3>
                            <p className="text-xs text-gray-500 mt-0.5">আপনার সাম্প্রতিক ৫টি অর্ডারের বিবরণ</p>
                        </div>
                        <Link
                            href="/customer/orders"
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                            <span>সবগুলো দেখুন</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {recent_orders.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-3">
                                <Package className="w-8 h-8" />
                            </div>
                            <h4 className="font-bold text-gray-800 text-sm">কোনো অর্ডার পাওয়া যায়নি</h4>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                আপনি এখনও কোনো অর্ডার করেননি। এখনই আমাদের পণ্য সম্ভার দেখুন।
                            </p>
                            <Link
                                href="/shop"
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>শপ ব্রাউজ করুন</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {recent_orders.map((order) => (
                                <div key={order.id} className="p-5 hover:bg-gray-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-900 text-sm">{order.order_number}</span>
                                            {getStatusBadge(order.status)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            <span>{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span className="mx-2">•</span>
                                            <span>আইটেম: {order.items ? order.items.length : 0} টি</span>
                                            <span className="mx-2">•</span>
                                            <span className="font-bold text-gray-800">{formatBdt(order.total)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <Link
                                            href={`/customer/orders/${order.order_number}`}
                                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
                                        >
                                            বিস্তারিত
                                        </Link>
                                        <Link
                                            href={`/track-order?order_number=${order.order_number}`}
                                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                                        >
                                            <Truck className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>ট্র্যাক</span>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Account Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                        <h4 className="font-bold text-gray-900 text-sm">ডেলিভারি তথ্য (Delivery Info)</h4>
                        <div className="text-xs text-gray-600 space-y-1.5">
                            <div><span className="text-gray-400">নাম:</span> {customer.name}</div>
                            <div><span className="text-gray-400">ইমেইল:</span> {customer.email}</div>
                            <div><span className="text-gray-400">ফোন:</span> {customer.phone || 'যুক্ত করা হয়নি'}</div>
                            <div><span className="text-gray-400">জেলা/ঠিকানা:</span> {customer.district ? `${customer.address || ''}, ${customer.district}` : 'অর্ডারের সময় স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে'}</div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                        <h4 className="font-bold text-gray-900 text-sm">সহায়তা ও ট্র্যাকিং (Help & Tracking)</h4>
                        <p className="text-xs text-gray-500">
                            যেকোনো পার্সেলের বর্তমান অবস্থান জানতে ট্র্যাকিং নম্বার বা আপনার অর্ডার নম্বর ব্যবহার করুন।
                        </p>
                        <div className="pt-2">
                            <Link
                                href="/track-order"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
                            >
                                <Search className="w-3.5 h-3.5 text-gray-600" />
                                <span>অর্ডার ট্র্যাকিং পেজ</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
