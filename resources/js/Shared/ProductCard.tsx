import { Link } from '@inertiajs/react';
import { Eye, ShoppingCart } from 'lucide-react';
import { useMemo } from 'react';
import type { Product } from '@/types';

interface ProductCardProps {
    product: Product;
}

export function formatBdt(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `৳${(isNaN(num) ? 0 : num).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
}

export function ProductCard({ product }: ProductCardProps) {
    const regular = typeof product.regular_price === 'string' ? parseFloat(product.regular_price) : product.regular_price;
    const sale = product.sale_price ? (typeof product.sale_price === 'string' ? parseFloat(product.sale_price) : product.sale_price) : null;
    const currentPrice = sale !== null && sale < regular ? sale : regular;

    const discountPercent = useMemo(() => {
        if (sale !== null && regular > 0 && sale < regular) {
            return Math.round(((regular - sale) / regular) * 100);
        }
        return 0;
    }, [regular, sale]);

    const imageUrl = product.primaryImage?.url || product.primary_image?.url || product.images?.[0]?.url || '/placeholder.png';

    // Calculate in-stock status
    const isInStock = useMemo(() => {
        if (!product.variants || product.variants.length === 0) return true;
        return product.variants.some((v) => !v.manage_stock || v.stock_quantity > 0);
    }, [product.variants]);

    const primaryVariant = product.variants?.[0];
    const quickOrderUrl = primaryVariant
        ? `/checkout/${product.slug}?variant=${primaryVariant.id}&quantity=1`
        : `/checkout/${product.slug}`;

    return (
        <div className="group relative bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
            {/* Image & Badges */}
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <Link href={`/product/${product.slug}`} className="block w-full h-full">
                    <img
                        src={imageUrl}
                        alt={product.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                </Link>

                {/* Discount Badge */}
                {discountPercent > 0 && (
                    <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                        {discountPercent}% ছাড়
                    </div>
                )}

                {/* Stock Badge */}
                {!isInStock && (
                    <div className="absolute top-2.5 right-2.5 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        স্টক আউট
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                    <Link
                        href={`/product/${product.slug}`}
                        className="block font-semibold text-gray-900 text-sm hover:text-indigo-600 transition line-clamp-2 mb-2"
                        title={product.title}
                    >
                        {product.title}
                    </Link>

                    {/* Price Block */}
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-base sm:text-lg font-black text-indigo-600">
                            {formatBdt(currentPrice)}
                        </span>
                        {sale !== null && sale < regular && (
                            <span className="text-xs text-gray-400 line-through">
                                {formatBdt(regular)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Quick Order / View Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <Link
                        href={quickOrderUrl}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition shadow-sm ${
                            isInStock
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-gray-200 text-gray-500 pointer-events-none'
                        }`}
                        title="সরাসরি অর্ডার করুন"
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>অর্ডার</span>
                    </Link>

                    <Link
                        href={`/product/${product.slug}`}
                        className="flex items-center justify-center gap-1 py-2 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold border border-gray-200 transition"
                        title="বিস্তারিত দেখুন"
                    >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                        <span>বিস্তারিত</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
