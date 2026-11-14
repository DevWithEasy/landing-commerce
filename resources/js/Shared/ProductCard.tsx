import { Link, router } from '@inertiajs/react';
import { Heart, ShoppingCart } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Product } from '@/types';
import { SafeImage } from './SafeImage';

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
    const [isAdding, setIsAdding] = useState(false);

    const handleQuickAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isInStock || isAdding) return;

        if (product.variants && product.variants.length > 1) {
            // Multi-variant products require choosing a variant on the product page
            router.visit(`/product/${product.slug}`);
            return;
        }

        setIsAdding(true);
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const res = await fetch('/cart/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({
                    product_id: product.id,
                    variant_id: primaryVariant?.id,
                    quantity: 1,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                window.dispatchEvent(new CustomEvent('open-mini-cart', { detail: data.cart }));
                router.reload({ only: ['cart'] });
            }
        } catch {
            // Silently handle
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="group relative bg-white rounded-xl overflow-hidden border border-stone-200/80 hover:border-stone-300 transition-colors duration-200 flex flex-col justify-between">
            {/* Flush 4:5 Portrait Image & Badges */}
            <div className="relative aspect-[4/5] bg-[#F3EDE4] overflow-hidden">
                <Link href={`/product/${product.slug}`} className="block w-full h-full">
                    <SafeImage
                        src={imageUrl}
                        alt={product.title}
                        width={400}
                        height={500}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-103 transition duration-500 ease-out"
                    />
                </Link>

                {/* Discount Badge */}
                {discountPercent > 0 && (
                    <div className="absolute top-2.5 left-2.5 bg-[#F96D16] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                        -{discountPercent}%
                    </div>
                )}

                {/* Wishlist Heart Icon (Top Right, 36px touch target) */}
                <Link
                    href="/customer/wishlist"
                    title="Add to Wishlist"
                    aria-label="Add to Wishlist"
                    className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/85 backdrop-blur-2xs text-stone-700 hover:text-[#F96D16] hover:bg-white flex items-center justify-center transition"
                >
                    <Heart className="w-4 h-4 stroke-[1.8]" />
                </Link>

                {/* Stock Badge */}
                {!isInStock && (
                    <div className="absolute bottom-2.5 left-2.5 bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                        Stock Out
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between bg-white">
                <Link
                    href={`/product/${product.slug}`}
                    className="block font-medium text-stone-900 text-xs sm:text-sm hover:text-[#0B3B2E] transition line-clamp-1 mb-2"
                    title={product.title}
                >
                    {product.title}
                </Link>

                {/* Price + Add-to-Cart Button Row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-sm sm:text-base font-bold text-[#EA580C] truncate">
                            {formatBdt(currentPrice)}
                        </span>
                        {sale !== null && sale < regular && (
                            <span className="text-xs text-stone-400 line-through truncate">
                                {formatBdt(regular)}
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleQuickAddToCart}
                        disabled={!isInStock || isAdding}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition ${
                            isInStock
                                ? 'bg-[#F96D16] hover:bg-[#EA580C] text-white cursor-pointer'
                                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        }`}
                        title="Add to Cart"
                        aria-label={`Add ${product.title} to cart`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
