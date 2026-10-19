import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Package, Search, ShoppingBag, Truck } from 'lucide-react';
import { CustomerLayout } from '@/Layouts/CustomerLayout';
import { formatBdt } from '@/Shared/ProductCard';
import type { Category, Order } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface PaginatedOrders {
    data: Order[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface OrdersProps {
    theme: StorefrontTheme;
    categories: Category[];
    orders: PaginatedOrders;
}

export default function CustomerOrders({ theme, categories, orders }: OrdersProps) {
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
        <CustomerLayout theme={theme} categories={categories} title="আমার অর্ডারসমূহ | Order History">
            <Head>
                <title>আমার অর্ডারসমূহ | Order History</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            আমার অর্ডারসমূহ (Order History)
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            আপনার সর্বমোট {orders.total} টি অর্ডার রেকর্ড রয়েছে
                        </p>
                    </div>

                    <Link
                        href="/track-order"
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition self-start sm:self-auto"
                    >
                        <Search className="w-3.5 h-3.5 text-indigo-600" />
                        <span>অর্ডার ট্র্যাক করুন</span>
                    </Link>
                </div>

                {orders.data.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-3">
                            <Package className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm">কোনো অর্ডার পাওয়া যায়নি</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            আপনি এখনও কোনো অর্ডার করেননি। পণ্য নির্বাচন করে অর্ডার সম্পন্ন করুন।
                        </p>
                        <Link
                            href="/shop"
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>কেনাকাটা করুন</span>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {orders.data.map((order) => (
                            <div key={order.id} className="p-6 hover:bg-gray-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-5">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="font-extrabold text-gray-900 text-base">{order.order_number}</span>
                                        {getStatusBadge(order.status)}
                                    </div>

                                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-y-1 gap-x-3">
                                        <span>অর্ডার তারিখ: <strong className="text-gray-700">{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                                        <span>•</span>
                                        <span>পেমেন্ট: <strong className="uppercase text-gray-700">{order.payment_method}</strong> ({order.payment_status === 'paid' ? 'পরিশোধিত' : 'অপরিশোধিত'})</span>
                                        <span>•</span>
                                        <span>ডেলিভারি এলাকা: <strong className="text-gray-700">{order.district}</strong></span>
                                    </div>

                                    {/* Items Preview */}
                                    {order.items && order.items.length > 0 && (
                                        <div className="text-xs text-gray-600 pt-1">
                                            আইটেম ({order.items.length}):{' '}
                                            <span className="text-gray-800 font-medium">
                                                {order.items.map((i) => `${i.product_title} (${i.quantity}টি)`).join(', ')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                                    <div className="text-base sm:text-lg font-black text-gray-900">
                                        {formatBdt(order.total)}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/customer/orders/${order.order_number}`}
                                            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition"
                                        >
                                            অর্ডার বিবরণ
                                        </Link>
                                        <Link
                                            href={`/track-order?order_number=${order.order_number}`}
                                            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                                        >
                                            <Truck className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>ট্র্যাক</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {orders.last_page > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <div>
                            পৃষ্ঠা {orders.current_page} / {orders.last_page}
                        </div>
                        <div className="flex items-center gap-2">
                            {orders.prev_page_url ? (
                                <Link
                                    href={orders.prev_page_url}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Link>
                            ) : (
                                <span className="p-2 border border-gray-100 rounded-lg opacity-40 cursor-not-allowed">
                                    <ChevronLeft className="w-4 h-4" />
                                </span>
                            )}
                            {orders.next_page_url ? (
                                <Link
                                    href={orders.next_page_url}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <span className="p-2 border border-gray-100 rounded-lg opacity-40 cursor-not-allowed">
                                    <ChevronRight className="w-4 h-4" />
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
