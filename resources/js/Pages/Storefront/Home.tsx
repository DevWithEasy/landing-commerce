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
    promoBanners,
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
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
                    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-3">
                        {categories.slice(0, 10).map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/category/${cat.slug}`}
                                className="group bg-[#F3EDE4] hover:bg-[#EAE1D3] border border-stone-200/60 rounded-xl p-2.5 transition-all text-center flex flex-col items-center justify-between"
                            >
                                <div className="w-full aspect-square mb-1.5 flex items-center justify-center overflow-hidden">
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
                                <span className="text-xs font-semibold text-stone-900 group-hover:text-[#0B3B2E] transition line-clamp-1">
                                    {cat.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 3. New Arrivals Section */}
            {sectionsConfig.new_arrivals_enabled && newArrivals.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl sm:text-[28px] font-serif font-bold text-stone-900 tracking-tight">
                            New Arrivals
                        </h2>
                        <Link
                            href="/shop?sort=latest"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-stone-700 hover:text-[#EA580C] transition"
                        >
                            <span>View All</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {newArrivals.slice(0, 8).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* 4. Category Collection Horizontal Showcase Rows (matching mockup) */}
            {sectionsConfig.category_sections_enabled && categorySections.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
                    {categorySections.map((catSection) => {
                        if (!catSection.products || catSection.products.length === 0) return null;

                        return (
                            <div
                                key={catSection.id}
                                className="bg-white rounded-xl border border-stone-200/80 p-4 sm:p-6"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                                    {/* Left Category Feature Card */}
                                    <div className="lg:col-span-4 flex items-center gap-4">
                                        <div className="w-24 h-30 sm:w-28 sm:h-34 shrink-0 rounded-lg overflow-hidden bg-[#F3EDE4] border border-stone-200/60">
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
                                            <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 leading-snug">
                                                {catSection.name}
                                            </h3>
                                            <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                                                {catSection.description ||
                                                    `Explore our curated ${catSection.name.toLowerCase()} collection for everyday style.`}
                                            </p>
                                            <Link
                                                href={`/category/${catSection.slug}`}
                                                className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-800 hover:bg-[#0B3B2E] hover:text-white hover:border-[#0B3B2E] transition"
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
                                                    <div className="w-full aspect-[4/5] rounded-lg bg-[#F3EDE4] overflow-hidden mb-2">
                                                        <SafeImage
                                                            src={imgUrl}
                                                            alt={product.title}
                                                            className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-medium text-stone-800 group-hover:text-[#0B3B2E] line-clamp-1">
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
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl sm:text-[28px] font-serif font-bold text-stone-900 tracking-tight">
                            Featured Collection
                        </h2>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-stone-700 hover:text-[#EA580C] transition"
                        >
                            <span>View All</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {featuredProducts.slice(0, 8).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* 6. Best Sellers (when enabled) */}
            {sectionsConfig.best_sellers_enabled && bestSellers.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl sm:text-[28px] font-serif font-bold text-stone-900 tracking-tight">
                            Best Sellers
                        </h2>
                        <Link
                            href="/shop?sort=popular"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-stone-700 hover:text-[#EA580C] transition"
                        >
                            <span>View All</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {bestSellers.slice(0, 8).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* 7. Dual Promo Banners (Seasonal Sale + Combo Deals) */}
            {(promoBanners?.enabled ?? true) && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Left: Deep Forest Green Seasonal Sale (no gradient) */}
                        <div className="rounded-xl bg-[#0B3B2E] text-white p-7 sm:p-9 flex items-center justify-between gap-4 min-h-[190px] relative overflow-hidden">
                            <div className="relative z-10 max-w-xs">
                                {(promoBanners?.seasonal.badge ?? 'SEASONAL SALE') && (
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/85">
                                        {promoBanners?.seasonal.badge ?? 'SEASONAL SALE'}
                                    </span>
                                )}
                                <h3 className="text-2xl sm:text-3xl font-serif font-bold mt-1 leading-tight">
                                    {promoBanners?.seasonal.title || 'Up to 50% OFF'}
                                </h3>
                                {(promoBanners?.seasonal.subtitle ?? 'On Selected Items') && (
                                    <p className="text-xs text-emerald-100/80 mt-1">
                                        {promoBanners?.seasonal.subtitle ?? 'On Selected Items'}
                                    </p>
                                )}
                                {(promoBanners?.seasonal.button_text ?? 'Shop the Sale') && (
                                    <Link
                                        href={promoBanners?.seasonal.button_url || '/shop'}
                                        className="mt-5 inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-[#F96D16] hover:bg-[#EA580C] text-white text-xs font-semibold transition"
                                    >
                                        <span>{promoBanners?.seasonal.button_text ?? 'Shop the Sale'}</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                )}
                            </div>

                            {promoBanners?.seasonal.image_url && (
                                <div className="relative z-10 w-24 h-28 sm:w-32 sm:h-36 rounded-xl overflow-hidden border border-white/15 shrink-0">
                                    <img
                                        src={promoBanners.seasonal.image_url}
                                        alt={promoBanners.seasonal.title || 'Seasonal Sale'}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right: Warm Sand Combo Deals */}
                        <div className="rounded-xl bg-[#F3EDE4] border border-stone-200/80 p-7 sm:p-9 flex items-center justify-between gap-4 min-h-[190px] relative overflow-hidden">
                            <div className="relative z-10 max-w-xs">
                                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
                                    {promoBanners?.combo.title || 'Combo Deals'}
                                </h3>
                                {(promoBanners?.combo.subtitle ?? 'Buy More, Save More') && (
                                    <p className="text-xs text-stone-600 mt-1">
                                        {promoBanners?.combo.subtitle ?? 'Buy More, Save More'}
                                    </p>
                                )}
                                {(promoBanners?.combo.button_text ?? 'Shop Combo') && (
                                    <Link
                                        href={promoBanners?.combo.button_url || '/shop'}
                                        className="mt-5 inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-[#F96D16] hover:bg-[#EA580C] text-white text-xs font-semibold transition"
                                    >
                                        <span>{promoBanners?.combo.button_text ?? 'Shop Combo'}</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                )}
                            </div>

                            <div className="relative z-10 flex items-center gap-3 shrink-0">
                                {promoBanners?.combo.image_url && (
                                    <div className="w-20 h-24 sm:w-28 sm:h-32 rounded-xl overflow-hidden border border-stone-300/70">
                                        <img
                                            src={promoBanners.combo.image_url}
                                            alt={promoBanners.combo.title || 'Combo Deals'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                {(promoBanners?.combo.badge_label || promoBanners?.combo.badge_value || !promoBanners) && (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F96D16] text-white flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider leading-none">
                                            {promoBanners?.combo.badge_label ?? 'SAVE'}
                                        </span>
                                        <span className="text-xl sm:text-2xl font-bold leading-tight">
                                            {promoBanners?.combo.badge_value ?? '30%'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 8. 4-Column Trust & Value Proposition Badges */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-2">
                <div className="bg-white rounded-xl border border-stone-200/80 px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0 text-[#EA580C]">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-serif font-bold text-stone-900">Fast Delivery</h4>
                            <p className="text-[11px] text-stone-500">All over Bangladesh</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0 text-[#EA580C]">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-serif font-bold text-stone-900">Easy Return</h4>
                            <p className="text-[11px] text-stone-500">7 days hassle-free return</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0 text-[#EA580C]">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-serif font-bold text-stone-900">Secure Payment</h4>
                            <p className="text-[11px] text-stone-500">100% secure &amp; COD options</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0 text-[#EA580C]">
                            <Headphones className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-serif font-bold text-stone-900">Customer Support</h4>
                            <p className="text-[11px] text-stone-500">Dedicated support anytime</p>
                        </div>
                    </div>
                </div>
            </section>
        </StorefrontLayout>
    );
}
