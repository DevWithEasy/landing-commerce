import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Headphones,
    RefreshCw,
    ShieldCheck,
    Truck,
} from 'lucide-react';
import { useMemo } from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import { HeroSlider } from '@/Shared/HeroSlider';
import { ProductCard, formatBdt } from '@/Shared/ProductCard';
import { SafeImage } from '@/Shared/SafeImage';
import { SeoHead } from '@/Shared/SeoHead';
import type { Product } from '@/types';
import type { StorefrontHomeProps } from '@/types/storefront';

export default function Home({
    sliders,
    defaultHero,
    categories,
    featuredProducts,
    newArrivals,
    bestSellers,
    categorySections,
    theme,
    sectionsConfig,
}: StorefrontHomeProps) {
    const homeJsonLd = useMemo(() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return [
            {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: theme.store_name,
                url: origin,
                potentialAction: {
                    '@type': 'SearchAction',
                    target: `${origin}/shop?search={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                },
            },
            {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: theme.store_name,
                url: origin,
                logo: theme.logo_url || undefined,
                contactPoint: theme.store_phone
                    ? {
                          '@type': 'ContactPoint',
                          telephone: theme.store_phone,
                          contactType: 'customer service',
                          areaServed: 'BD',
                      }
                    : undefined,
            },
        ];
    }, [theme]);

    return (
        <StorefrontLayout theme={theme} categories={categories}>
            <SeoHead
                title={`${theme.store_name} - Modern Online Shopping`}
                description={`${theme.store_name} - Authentic products, attractive discounts & fast Cash on Delivery across Bangladesh.`}
                canonicalUrl="/"
                theme={theme}
                jsonLd={homeJsonLd}
            />

            {/* 1. Hero Slider Section */}
            {sectionsConfig.hero_slider_enabled && (
                <section>
                    <HeroSlider sliders={sliders} theme={theme} defaultHero={defaultHero} />
                </section>
            )}

            {/* 2. Compact Category Strip (matching mockup) */}
            {sectionsConfig.categories_enabled && categories.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-4">
                    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-3">
                        {categories.slice(0, 10).map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/category/${cat.slug}`}
                                className="group bg-[#F6EDE3] hover:bg-[#EFE2D3] rounded-2xl px-2.5 pt-2.5 pb-2.5 transition-all text-center flex flex-col items-center justify-between"
                            >
                                <div className="w-full aspect-[4/3.6] mb-1.5 flex items-center justify-center overflow-hidden">
                                    <SafeImage
                                        src={cat.image_url}
                                        alt={cat.name}
                                        className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                                        fallbackText=""
                                        fallbackIcon={
                                            <span className="text-[#0B3B2E] font-serif font-bold text-xl">
                                                {cat.name.charAt(0)}
                                            </span>
                                        }
                                    />
                                </div>
                                <span className="text-xs font-semibold text-gray-900 group-hover:text-[#0B3B2E] transition line-clamp-1">
                                    {cat.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 3. New Arrivals Section */}
            {sectionsConfig.new_arrivals_enabled && newArrivals.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-2xl sm:text-[26px] font-serif font-bold text-gray-900 tracking-tight">
                            New Arrivals
                        </h2>
                        <Link
                            href="/shop?sort=latest"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#EA580C] transition"
                        >
                            <span>View All</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                        {newArrivals.slice(0, 6).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* 4. Category Collection Horizontal Showcase Rows (matching mockup) */}
            {sectionsConfig.category_sections_enabled && categorySections.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-5">
                    {categorySections.map((catSection) => {
                        if (!catSection.products || catSection.products.length === 0) return null;

                        return (
                            <div
                                key={catSection.id}
                                className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                                    {/* Left Category Feature Card */}
                                    <div className="lg:col-span-4 flex items-center gap-4">
                                        <div className="w-24 h-28 sm:w-28 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-[#F6F3EE] border border-stone-200/60">
                                            <SafeImage
                                                src={catSection.image_url || catSection.products[0]?.primary_image?.url}
                                                alt={catSection.name}
                                                className="w-full h-full object-cover"
                                                fallbackText=""
                                                fallbackIcon={
                                                    <span className="text-[#0B3B2E] font-serif font-bold text-2xl">
                                                        {catSection.name.charAt(0)}
                                                    </span>
                                                }
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg sm:text-xl font-serif font-bold text-gray-900 leading-snug">
                                                {catSection.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                                {catSection.description ||
                                                    `Explore our curated ${catSection.name.toLowerCase()} collection for everyday style.`}
                                            </p>
                                            <Link
                                                href={`/category/${catSection.slug}`}
                                                className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-stone-300 text-xs font-semibold text-gray-800 hover:bg-[#0B3B2E] hover:text-white hover:border-[#0B3B2E] transition"
                                            >
                                                <span>View All</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Right 6-Product Mini Grid */}
                                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                        {catSection.products.slice(0, 6).map((product: Product) => {
                                            const regular =
                                                typeof product.regular_price === 'string'
                                                    ? parseFloat(product.regular_price)
                                                    : product.regular_price;
                                            const sale = product.sale_price
                                                ? typeof product.sale_price === 'string'
                                                    ? parseFloat(product.sale_price)
                                                    : product.sale_price
                                                : null;
                                            const currentPrice =
                                                sale !== null && sale < regular ? sale : regular;
                                            const imgUrl =
                                                product.primaryImage?.url ||
                                                product.primary_image?.url ||
                                                product.images?.[0]?.url ||
                                                '/placeholder.png';

                                            return (
                                                <Link
                                                    key={product.id}
                                                    href={`/product/${product.slug}`}
                                                    className="group text-center flex flex-col items-center"
                                                >
                                                    <div className="w-full aspect-square rounded-xl bg-[#F6EDE3] overflow-hidden p-1.5 mb-2">
                                                        <SafeImage
                                                            src={imgUrl}
                                                            alt={product.title}
                                                            className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-medium text-gray-800 group-hover:text-[#0B3B2E] line-clamp-1">
                                                        {product.title}
                                                    </span>
                                                    <span className="text-xs font-bold text-[#EA580C] mt-0.5">
                                                        {formatBdt(currentPrice)}
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}

            {/* 5. Featured Products (when enabled) */}
            {sectionsConfig.featured_enabled && featuredProducts.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-2xl sm:text-[26px] font-serif font-bold text-gray-900 tracking-tight">
                            Featured Collection
                        </h2>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#EA580C] transition"
                        >
                            <span>View All</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                        {featuredProducts.slice(0, 6).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* 6. Best Sellers (when enabled) */}
            {sectionsConfig.best_sellers_enabled && bestSellers.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-2xl sm:text-[26px] font-serif font-bold text-gray-900 tracking-tight">
                            Best Sellers
                        </h2>
                        <Link
                            href="/shop?sort=popular"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#EA580C] transition"
                        >
                            <span>View All</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                        {bestSellers.slice(0, 6).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* 7. Dual Promo Banners (Seasonal Sale + Combo Deals matching mockup) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left: Deep Forest Green Seasonal Sale */}
                    <div className="rounded-2xl bg-gradient-to-r from-[#0B3B2E] to-[#125140] text-white p-7 sm:p-9 flex flex-col justify-between min-h-[190px] shadow-md relative overflow-hidden">
                        <div className="relative z-10 max-w-xs">
                            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200/80">
                                SEASONAL SALE
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-serif font-bold mt-1 leading-tight">
                                Up to 50% OFF
                            </h3>
                            <p className="text-xs text-emerald-100/80 mt-1">On Selected Items</p>
                            <Link
                                href="/shop"
                                className="mt-5 inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#F96D16] hover:bg-[#EA580C] text-white text-xs font-bold shadow-sm transition"
                            >
                                <span>Shop the Sale</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* Right: Warm Cream Combo Deals with Save 30% Badge */}
                    <div className="rounded-2xl bg-[#F2ECE1] border border-stone-200/80 p-7 sm:p-9 flex items-center justify-between min-h-[190px] shadow-xs relative overflow-hidden">
                        <div className="max-w-xs">
                            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 leading-tight">
                                Combo Deals
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">Buy More, Save More</p>
                            <Link
                                href="/shop"
                                className="mt-5 inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#F96D16] hover:bg-[#EA580C] text-white text-xs font-bold shadow-sm transition"
                            >
                                <span>Shop Combo</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F96D16] text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                            <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                                SAVE
                            </span>
                            <span className="text-xl sm:text-2xl font-extrabold leading-tight">
                                30%
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. 4-Column Trust & Value Proposition Badges (matching mockup) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-2">
                <div className="bg-white rounded-2xl border border-stone-200/80 px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-5 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0 text-[#EA580C]">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Fast Delivery</h4>
                            <p className="text-[11px] text-gray-500">All over Bangladesh</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0 text-[#EA580C]">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Easy Return</h4>
                            <p className="text-[11px] text-gray-500">7 days hassle-free return</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0 text-[#EA580C]">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Secure Payment</h4>
                            <p className="text-[11px] text-gray-500">100% secure &amp; COD options</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0 text-[#EA580C]">
                            <Headphones className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Customer Support</h4>
                            <p className="text-[11px] text-gray-500">Dedicated support anytime</p>
                        </div>
                    </div>
                </div>
            </section>
        </StorefrontLayout>
    );
}
