import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Clock,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Star,
    Truck,
} from 'lucide-react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import { HeroSlider } from '@/Shared/HeroSlider';
import { ProductCard } from '@/Shared/ProductCard';
import type { Product } from '@/types';
import type { StorefrontHomeProps } from '@/types/storefront';

export default function Home({
    sliders,
    categories,
    featuredProducts,
    newArrivals,
    bestSellers,
    categorySections,
    theme,
    sectionsConfig,
}: StorefrontHomeProps) {
    return (
        <StorefrontLayout theme={theme} categories={categories}>
            <Head title={`${theme.store_name} - অনলাইন শপ`} />

            {/* 1. Hero Slider Section */}
            {sectionsConfig.hero_slider_enabled && (
                <section>
                    <HeroSlider sliders={sliders} theme={theme} />
                </section>
            )}

            {/* 2. Trust & Value Proposition Badges */}
            <section className="bg-white border-y border-gray-200 py-6 px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">সারা দেশে ডেলিভারি</h4>
                            <p className="text-xs text-gray-500">৬৪ জেলায় দ্রুততম ক্যাশ অন ডেলিভারি</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">১০০% আসল পণ্য</h4>
                            <p className="text-xs text-gray-500">সেরা কোয়ালিটি ও অথেনটিক গ্যারান্টি</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">দ্রুত ডেলিভারি</h4>
                            <p className="text-xs text-gray-500">২৪ থেকে ৭২ ঘণ্টার মধ্যে পৌঁছাবে</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0 text-rose-600">
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">সহজ রিটার্ন</h4>
                            <p className="text-xs text-gray-500">৭ দিনের মধ্যে সহজ রিটার্ন সুবিধা</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Category Carousel / Grid */}
            {sectionsConfig.categories_enabled && categories.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                জনপ্রিয় ক্যাটাগরি
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                আপনার প্রয়োজনীয় পণ্যটি সহজেই খুঁজে পেতে ক্যাটাগরি নির্বাচন করুন
                            </p>
                        </div>
                        <Link
                            href="/shop"
                            className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                        >
                            <span>সব দেখুন</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/category/${cat.slug}`}
                                className="group bg-white rounded-2xl p-4 border border-gray-200/80 hover:border-indigo-200 hover:shadow-md transition text-center flex flex-col items-center justify-center"
                            >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-50/70 p-2 mb-3 flex items-center justify-center overflow-hidden group-hover:scale-105 transition duration-300">
                                    {cat.image_url ? (
                                        <img
                                            src={cat.image_url}
                                            alt={cat.name}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <span className="text-indigo-600 font-black text-xl">
                                            {cat.name.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition line-clamp-1">
                                    {cat.name}
                                </h3>
                                {cat.children && cat.children.length > 0 && (
                                    <span className="text-[11px] text-gray-400 mt-0.5">
                                        {cat.children.length} টি সাব-ক্যাটাগরি
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 4. New Arrivals Section */}
            {sectionsConfig.new_arrivals_enabled && newArrivals.length > 0 && (
                <section className="bg-white border-y border-gray-200/80 py-14">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                        নতুন কালেকশন
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                        সদ্য যুক্ত হওয়া ট্রেন্ডিং ও প্রিমিয়াম প্রডাক্ট
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/shop?sort=latest"
                                className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                            >
                                <span>সব নতুন পণ্য</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                            {newArrivals.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 5. Featured Products Section */}
            {sectionsConfig.featured_enabled && featuredProducts.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <Star className="w-5 h-5 fill-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                    সেরা আকর্ষণীয় পণ্য
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                    গ্রাহকদের পছন্দের সেরা তালিকায় থাকা পণ্যসমূহ
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                        >
                            <span>শপে যান</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* 6. Best Sellers Section */}
            {sectionsConfig.best_sellers_enabled && bestSellers.length > 0 && (
                <section className="bg-gray-100/70 border-y border-gray-200/80 py-14">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                    সর্বোচ্চ বিক্রিত পণ্য
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                    হট ডিলে সবচেয়ে বেশি অর্ডার হওয়া পণ্য
                                </p>
                            </div>
                            <Link
                                href="/shop?sort=popular"
                                className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                            >
                                <span>সব বেস্টসেলার</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                            {bestSellers.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 7. Category Product Collections */}
            {sectionsConfig.category_sections_enabled &&
                categorySections.map((catSection) => {
                    if (!catSection.products || catSection.products.length === 0) return null;

                    return (
                        <section key={catSection.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                                        {catSection.name}
                                    </h2>
                                    {catSection.description && (
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                            {catSection.description}
                                        </p>
                                    )}
                                </div>
                                <Link
                                    href={`/category/${catSection.slug}`}
                                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                    <span>আরও দেখুন</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                                {catSection.products.map((product: Product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </section>
                    );
                })}

            {/* 8. Call To Action Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                        <span className="inline-block px-3.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider">
                            ক্যাশ অন ডেলিভারি
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                            যেকোনো প্রয়োজনে আমাদের সাথে সরাসরি কথা বলুন
                        </h2>
                        <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
                            পণ্য নির্বাচন, অর্ডার বা ডেলিভারি সম্পর্কিত কোনো প্রশ্ন থাকলে আমাদের কাস্টমার কেয়ারে কল অথবা WhatsApp করুন।
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                            {theme.store_phone && (
                                <a
                                    href={`tel:${theme.store_phone}`}
                                    className="px-6 py-3 bg-white text-indigo-700 font-bold text-sm rounded-xl shadow-md hover:bg-gray-100 transition"
                                >
                                    কল করুন: {theme.store_phone}
                                </a>
                            )}
                            {theme.store_whatsapp && (
                                <a
                                    href={`https://wa.me/${theme.store_whatsapp.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-md transition"
                                >
                                    WhatsApp চ্যাট
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </StorefrontLayout>
    );
}
