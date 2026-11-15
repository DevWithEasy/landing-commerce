import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Headphones,
    RefreshCw,
    ShieldCheck,
    Truck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import { HeroSlider } from '@/Shared/HeroSlider';
import { ProductCard } from '@/Shared/ProductCard';
import { SafeImage } from '@/Shared/SafeImage';
import { SeoHead } from '@/Shared/SeoHead';
import type { Category } from '@/types';
import type { StorefrontHomeProps } from '@/types/storefront';

function CategorySectionSkeleton() {
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="flex items-center justify-between mb-6">
                <div className="h-8 w-44 bg-stone-200/80 rounded-lg" />
                <div className="h-4 w-20 bg-stone-200/80 rounded" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-stone-200/80 bg-white p-3 space-y-3 shadow-2xs"
                    >
                        <div className="w-full aspect-[4/5] bg-stone-100 rounded-xl" />
                        <div className="h-4 bg-stone-100 rounded w-3/4" />
                        <div className="h-4 bg-stone-100 rounded w-1/3" />
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function Home({
    sliders,
    defaultHero,
    promoBanners,
    categories,
    newArrivals,
    categorySections,
    remainingCategoryIds = [],
    otherProducts = [],
    theme,
    sectionsConfig,
}: StorefrontHomeProps) {
    const [loadedCategorySections, setLoadedCategorySections] = useState<Category[]>(categorySections);
    const [pendingCategoryIds, setPendingCategoryIds] = useState<number[]>(remainingCategoryIds);
    const [isLoadingNextCategory, setIsLoadingNextCategory] = useState<boolean>(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setLoadedCategorySections(categorySections);
    }, [categorySections]);

    useEffect(() => {
        setPendingCategoryIds(remainingCategoryIds);
    }, [remainingCategoryIds]);

    useEffect(() => {
        if (!sectionsConfig.category_sections_enabled || pendingCategoryIds.length === 0) {
            return;
        }

        const currentSentinel = sentinelRef.current;
        if (!currentSentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (target?.isIntersecting && !isLoadingNextCategory && pendingCategoryIds.length > 0) {
                    const nextId = pendingCategoryIds[0];
                    setIsLoadingNextCategory(true);

                    fetch(`/storefront/home/category-section/${nextId}`, {
                        headers: {
                            Accept: 'application/json',
                        },
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.status === 'ok' && data.category) {
                                setLoadedCategorySections((prev) => [...prev, data.category]);
                            }
                            setPendingCategoryIds((prev) => prev.filter((id) => id !== nextId));
                        })
                        .catch(() => {
                            setPendingCategoryIds((prev) => prev.filter((id) => id !== nextId));
                        })
                        .finally(() => {
                            setIsLoadingNextCategory(false);
                        });
                }
            },
            {
                rootMargin: '350px 0px',
                threshold: 0.05,
            }
        );

        observer.observe(currentSentinel);

        return () => {
            observer.disconnect();
        };
    }, [pendingCategoryIds, isLoadingNextCategory, sectionsConfig.category_sections_enabled]);
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
                                className="group bg-soft hover:brightness-95 border border-line/60 rounded-xl p-2.5 transition-all text-center flex flex-col items-center justify-between"
                            >
                                <div className="w-full aspect-square mb-1.5 flex items-center justify-center overflow-hidden">
                                    <SafeImage
                                        src={cat.image_url}
                                        alt={cat.name}
                                        className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                                        fallbackText=""
                                        fallbackIcon={
                                            <span className="text-heading font-serif font-bold text-xl">
                                                {cat.name.charAt(0)}
                                            </span>
                                        }
                                    />
                                </div>
                                <span className="text-xs font-semibold text-ink group-hover:text-heading transition line-clamp-1">
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
                        <h2 className="text-2xl sm:text-[28px] font-serif font-bold text-ink tracking-tight">
                            New Arrivals
                        </h2>
                        <Link
                            href="/shop?sort=latest"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-stone-700 hover:text-price transition"
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

            {/* 4. Category Collection Product Showcases (with Lazy Infinite Scroll) */}
            {sectionsConfig.category_sections_enabled && loadedCategorySections.length > 0 && (
                <div className="space-y-4">
                    {loadedCategorySections.map((catSection) => {
                        if (!catSection.products || catSection.products.length === 0) return null;

                        return (
                            <section
                                key={catSection.id}
                                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl sm:text-[28px] font-serif font-bold text-ink tracking-tight">
                                            {catSection.name}
                                        </h2>
                                        {catSection.description && (
                                            <p className="text-xs text-muted mt-1 max-w-xl line-clamp-1">
                                                {catSection.description}
                                            </p>
                                        )}
                                    </div>
                                    <Link
                                        href={`/category/${catSection.slug}`}
                                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-stone-700 hover:text-price transition shrink-0"
                                    >
                                        <span>View All</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                                    {catSection.products.slice(0, 8).map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            </section>
                        );
                    })}

                    {/* Shimmer Skeleton Loader when fetching next category */}
                    {isLoadingNextCategory && <CategorySectionSkeleton />}

                    {/* Sentinel target for IntersectionObserver */}
                    {pendingCategoryIds.length > 0 && (
                        <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />
                    )}

                    {/* 4.b Others Product Section (renders at the very end of category streams) */}
                    {pendingCategoryIds.length === 0 && otherProducts.length > 0 && (
                        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl sm:text-[28px] font-serif font-bold text-ink tracking-tight">
                                    Others Product
                                </h2>
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-stone-700 hover:text-price transition"
                                >
                                    <span>View All</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                                {otherProducts.slice(0, 8).map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* If category sections disabled but uncategorized products exist */}
            {!sectionsConfig.category_sections_enabled && otherProducts.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl sm:text-[28px] font-serif font-bold text-ink tracking-tight">
                            Others Product
                        </h2>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-stone-700 hover:text-price transition"
                        >
                            <span>View All</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {otherProducts.slice(0, 8).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* 5. Dual Promo Banners (Seasonal Sale + Combo Deals) */}
            {(promoBanners?.enabled ?? true) && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Left: Deep Forest Green Seasonal Sale (no gradient) */}
                        <div className="rounded-xl bg-brand text-white p-7 sm:p-9 flex items-center justify-between gap-4 min-h-[190px] relative overflow-hidden">
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
                                        className="mt-5 inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-cta hover:bg-cta-hover text-cta-text text-xs font-semibold transition"
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
                        <div className="rounded-xl bg-soft border border-line/80 p-7 sm:p-9 flex items-center justify-between gap-4 min-h-[190px] relative overflow-hidden">
                            <div className="relative z-10 max-w-xs">
                                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-ink leading-tight">
                                    {promoBanners?.combo.title || 'Combo Deals'}
                                </h3>
                                {(promoBanners?.combo.subtitle ?? 'Buy More, Save More') && (
                                    <p className="text-xs text-body mt-1">
                                        {promoBanners?.combo.subtitle ?? 'Buy More, Save More'}
                                    </p>
                                )}
                                {(promoBanners?.combo.button_text ?? 'Shop Combo') && (
                                    <Link
                                        href={promoBanners?.combo.button_url || '/shop'}
                                        className="mt-5 inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-cta hover:bg-cta-hover text-cta-text text-xs font-semibold transition"
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
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sale text-white flex flex-col items-center justify-center shrink-0">
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

            {/* 6. 4-Column Trust & Value Proposition Badges */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-2">
                <div className="bg-surface rounded-xl border border-line/80 px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cta/10 flex items-center justify-center shrink-0 text-price">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-serif font-bold text-ink">Fast Delivery</h4>
                            <p className="text-[11px] text-muted">All over Bangladesh</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cta/10 flex items-center justify-center shrink-0 text-price">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-serif font-bold text-ink">Easy Return</h4>
                            <p className="text-[11px] text-muted">7 days hassle-free return</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cta/10 flex items-center justify-center shrink-0 text-price">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-serif font-bold text-ink">Secure Payment</h4>
                            <p className="text-[11px] text-muted">100% secure &amp; COD options</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cta/10 flex items-center justify-center shrink-0 text-price">
                            <Headphones className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-serif font-bold text-ink">Customer Support</h4>
                            <p className="text-[11px] text-muted">Dedicated support anytime</p>
                        </div>
                    </div>
                </div>
            </section>
        </StorefrontLayout>
    );
}
