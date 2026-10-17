import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    FileText,
    Home,
    MapPin,
    MessageCircle,
    PackageCheck,
    Phone,
    ShieldCheck,
    User,
} from 'lucide-react';
import { useMemo } from 'react';
import type { ThankYouProps } from '@/types';

function formatBdt(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `৳${(isNaN(num) ? 0 : num).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}

export default function ThankYou({ order, merchantWhatsapp }: ThankYouProps) {
    // Generate sanitized WhatsApp URL
    const whatsappUrl = useMemo(() => {
        if (!merchantWhatsapp) return null;

        // Clean phone number: remove non-digits
        let cleanNumber = merchantWhatsapp.replace(/\D/g, '');
        // If 11-digit BD number starts with 01, prepend 88
        if (cleanNumber.length === 11 && cleanNumber.startsWith('01')) {
            cleanNumber = `88${cleanNumber}`;
        }

        const message = encodeURIComponent(
            `আসসালামু আলাইকুম, আমি আমার অর্ডার #${order.order_number} সম্পর্কে জানতে চাই। মোট টাকা: ৳${order.total}`
        );

        return `https://wa.me/${cleanNumber}?text=${message}`;
    }, [merchantWhatsapp, order.order_number, order.total]);

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <Head title={`অর্ডার সফল হয়েছে - #${order.order_number}`} />

            <div className="max-w-2xl mx-auto">
                {/* Celebratory Hero Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden text-center p-6 sm:p-8 mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>

                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-2 border border-emerald-200">
                        অর্ডার সফলভাবে গ্রহণ করা হয়েছে
                    </span>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        ধন্যবাদ, {order.customer_name}!
                    </h1>

                    <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                        আপনার অর্ডারটি প্রক্রিয়াধীন রয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে ফোনে
                        যোগাযোগ করে অর্ডারটি কনফার্ম করবেন।
                    </p>

                    <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 inline-flex items-center gap-3">
                        <div className="text-left">
                            <span className="text-xs text-slate-500 font-medium block">
                                অর্ডার ট্র্যাকিং নম্বর
                            </span>
                            <span className="text-base sm:text-lg font-mono font-bold text-slate-900 tracking-wider">
                                #{order.order_number}
                            </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            <span>পেন্ডিং (Pending)</span>
                        </span>
                    </div>

                    {/* WhatsApp Inquiry Button */}
                    {whatsappUrl && (
                        <div className="mt-6">
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                            >
                                <MessageCircle className="w-5 h-5 fill-current" />
                                <span>হোয়াটসঅ্যাপে অর্ডার সম্পর্কে জানুন</span>
                            </a>
                        </div>
                    )}
                </div>

                {/* Order Details & Summary Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
                    {/* Items Snapshot */}
                    <div>
                        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <PackageCheck className="w-5 h-5 text-primary-600" />
                            <span>অর্ডারকৃত পণ্যসমূহ</span>
                        </h2>

                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                            {order.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-3.5 sm:p-4 flex items-center justify-between text-sm bg-white"
                                >
                                    <div className="min-w-0 pr-4">
                                        <h4 className="font-bold text-slate-900 truncate">
                                            {item.product_title}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            ভ্যারিয়েন্ট: {item.variant_name} | পরিমাণ:{' '}
                                            {item.quantity} টি
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="font-extrabold text-slate-900">
                                            {formatBdt(item.total_price)}
                                        </span>
                                        <span className="block text-[11px] text-slate-400">
                                            {formatBdt(item.unit_price)} প্রতি পিস
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Calculation Breakdown */}
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 text-sm">
                        <div className="flex justify-between text-slate-600">
                            <span>সাবটোটাল</span>
                            <span className="font-semibold text-slate-900">
                                {formatBdt(order.subtotal)}
                            </span>
                        </div>

                        <div className="flex justify-between text-slate-600">
                            <span>ডেলিভারি চার্জ</span>
                            <span className="font-semibold text-slate-900">
                                {formatBdt(order.shipping_fee)}
                            </span>
                        </div>

                        {parseFloat(String(order.discount)) > 0 && (
                            <div className="flex justify-between text-emerald-600">
                                <span>ডিসকাউন্ট</span>
                                <span className="font-semibold">-{formatBdt(order.discount)}</span>
                            </div>
                        )}

                        <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
                            <div>
                                <span className="text-base font-bold text-slate-900 block">
                                    সর্বমোট প্রদেয়
                                </span>
                                <span className="text-[11px] text-emerald-700 font-medium">
                                    ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা দিন)
                                </span>
                            </div>
                            <span className="text-xl font-extrabold text-emerald-600">
                                {formatBdt(order.total)}
                            </span>
                        </div>
                    </div>

                    {/* Customer & Delivery Address Snapshot */}
                    <div>
                        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary-600" />
                            <span>ডেলিভারি ঠিকানা ও গ্রাহক তথ্য</span>
                        </h2>

                        <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-sm text-slate-700">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-900">
                                    {order.customer_name}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>{order.customer_phone}</span>
                            </div>

                            <div className="flex items-start gap-2 pt-1">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-slate-900">
                                        {order.delivery_address}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {order.upazila ? `${order.upazila}, ` : ''}
                                        {order.district}
                                    </p>
                                </div>
                            </div>

                            {order.notes && (
                                <div className="flex items-start gap-2 pt-2 border-t border-slate-200/60 mt-2 text-xs">
                                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold text-slate-700">
                                            বিশেষ নির্দেশনা:
                                        </span>{' '}
                                        <span className="text-slate-600">{order.notes}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trust Footnote */}
                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                            পণ্য রিসিভ করার সময় ভালো করে দেখে বুঝে নিন। কোনো সমস্যা হলে আমাদের সাথে
                            যোগাযোগ করুন।
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            <span>হোম পেইজে ফিরে যান</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
