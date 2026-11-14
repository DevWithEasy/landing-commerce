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
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">অপেক্ষারত (Pending)</span>;
            case 'confirmed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#0B3B2E] border border-emerald-200">নিশ্চিত (Confirmed)</span>;
            case 'processing':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">প্রস্তুত হচ্ছে (Processing)</span>;
            case 'handed_to_courier':
            case 'in_transit':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#EA580C] border border-orange-200">ডেলিভারির পথে (In Transit)</span>;
            case 'delivered':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#0B3B2E] border border-emerald-200">ডেলিভারি সম্পন্ন (Delivered)</span>;
            case 'cancelled':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">বাতিল (Cancelled)</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">{status}</span>;
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
                <div className="bg-[#0B3B2E] rounded-xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-serif font-bold">
                            স্বাগতম, {customer.name}!
                        </h2>
                        <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
                            আপনার একাউন্ট থেকে সহজেই অর্ডার হিস্ট্রি, ডেলিভারি ট্র্যাকিং এবং পছন্দের পণ্য পরিচালনা করুন।
                        </p>
                    </div>
                    <Link
                        href="/shop"
                        className="h-10 px-5 bg-[#F96D16] hover:bg-[#EA580C] text-white font-semibold text-xs sm:text-sm rounded-lg transition shrink-0 flex items-center gap-2"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>শপিং শুরু করুন</span>
                    </Link>
                </div>

                {/* Metrics Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-stone-200/80 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-lg bg-emerald-50 text-[#0B3B2E] flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-stone-900">{stats.total_orders}</div>
                            <div className="text-xs text-stone-500 font-medium">মোট অর্ডার</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-stone-200/80 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-stone-900">{stats.pending_orders}</div>
                            <div className="text-xs text-stone-500 font-medium">প্রক্রিয়াধীন</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-stone-200/80 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-stone-900">{stats.delivered_orders}</div>
                            <div className="text-xs text-stone-500 font-medium">ডেলিভারি সম্পন্ন</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-stone-200/80 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-lg bg-orange-50 text-[#EA580C] flex items-center justify-center shrink-0">
                            <Heart className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-stone-900">{stats.wishlist_count}</div>
                            <div className="text-xs text-stone-500 font-medium">পছন্দের পণ্য</div>
                        </div>
                    </div>
                </div>

                {/* Recent Orders Section */}
                <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-serif font-bold text-[#0B3B2E] text-base">সাম্প্রতিক অর্ডারসমূহ (Recent Orders)</h3>
                            <p className="text-xs text-stone-500 mt-0.5">আপনার সাম্প্রতিক ৫টি অর্ডারের বিবরণ</p>
                        </div>
                        <Link
                            href="/customer/orders"
                            className="text-xs font-semibold text-[#0B3B2E] hover:text-[#EA580C] flex items-center gap-1 transition"
                        >
                            <span>সবগুলো দেখুন</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {recent_orders.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-[#FAF7F2] border border-stone-200 rounded-full flex items-center justify-center mx-auto text-stone-400 mb-3">
                                <Package className="w-8 h-8" />
                            </div>
                            <h4 className="font-serif font-bold text-[#0B3B2E] text-sm">কোনো অর্ডার পাওয়া যায়নি</h4>
                            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                                আপনি এখনও কোনো অর্ডার করেননি। এখনই আমাদের পণ্য সম্ভার দেখুন।
                            </p>
                            <Link
                                href="/shop"
                                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#F96D16] hover:bg-[#EA580C] text-white rounded-lg text-xs font-semibold transition"
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>শপ ব্রাউজ করুন</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {recent_orders.map((order) => (
                                <div key={order.id} className="p-5 hover:bg-[#FAF7F2]/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-stone-900 text-sm">{order.order_number}</span>
                                            {getStatusBadge(order.status)}
                                        </div>
                                        <div className="text-xs text-stone-500">
                                            <span>{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span className="mx-2">•</span>
                                            <span>আইটেম: {order.items ? order.items.length : 0} টি</span>
                                            <span className="mx-2">•</span>
                                            <span className="font-bold text-[#EA580C]">{formatBdt(order.total)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <Link
                                            href={`/customer/orders/${order.order_number}`}
                                            className="px-3.5 py-1.5 bg-white border border-stone-200 hover:border-[#0B3B2E] text-stone-800 rounded-lg text-xs font-semibold transition"
                                        >
                                            বিস্তারিত
                                        </Link>
                                        <Link
                                            href={`/track-order?order_number=${order.order_number}`}
                                            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-[#0B3B2E] border border-emerald-200/70 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                                        >
                                            <Truck className="w-3.5 h-3.5 text-[#0B3B2E]" />
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
                    <div className="bg-white p-6 rounded-xl border border-stone-200/80 space-y-3">
                        <h4 className="font-serif font-bold text-[#0B3B2E] text-sm">ডেলিভারি তথ্য (Delivery Info)</h4>
                        <div className="text-xs text-stone-600 space-y-1.5">
                            <div><span className="text-stone-400">নাম:</span> {customer.name}</div>
                            <div><span className="text-stone-400">ইমেইল:</span> {customer.email}</div>
                            <div><span className="text-stone-400">ফোন:</span> {customer.phone || 'যুক্ত করা হয়নি'}</div>
                            <div><span className="text-stone-400">জেলা/ঠিকানা:</span> {customer.district ? `${customer.address || ''}, ${customer.district}` : 'অর্ডারের সময় স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে'}</div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-stone-200/80 space-y-3">
                        <h4 className="font-serif font-bold text-[#0B3B2E] text-sm">সহায়তা ও ট্র্যাকিং (Help & Tracking)</h4>
                        <p className="text-xs text-stone-500">
                            যেকোনো পার্সেলের বর্তমান অবস্থান জানতে ট্র্যাকিং নম্বার বা আপনার অর্ডার নম্বর ব্যবহার করুন।
                        </p>
                        <div className="pt-2">
                            <Link
                                href="/track-order"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF7F2] hover:bg-stone-100 border border-stone-200 text-[#0B3B2E] rounded-lg text-xs font-semibold transition"
                            >
                                <Search className="w-3.5 h-3.5 text-[#0B3B2E]" />
                                <span>অর্ডার ট্র্যাকিং পেজ</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
