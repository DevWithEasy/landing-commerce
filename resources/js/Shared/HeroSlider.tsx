import { Link } from '@inertiajs/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { DefaultHeroConfig, Slider } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface HeroSliderProps {
    sliders: Slider[];
    theme: StorefrontTheme;
    defaultHero?: DefaultHeroConfig;
}

export function HeroSlider({ sliders, theme, defaultHero }: HeroSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const activeSlides = sliders.filter((s) => s.is_active);

    const nextSlide = useCallback(() => {
        if (activeSlides.length <= 1) return;
        setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, [activeSlides.length]);

    const prevSlide = useCallback(() => {
        if (activeSlides.length <= 1) return;
        setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
    }, [activeSlides.length]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    // Autoplay Timer (checks reduced motion)
    useEffect(() => {
        if (activeSlides.length <= 1 || isPaused) return;

        const prefersReducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) return;

        const timer = setInterval(() => {
            nextSlide();
        }, 5000);

        return () => clearInterval(timer);
    }, [activeSlides.length, isPaused, nextSlide]);

    // Fallback hero if no slides are uploaded or active
    if (activeSlides.length === 0) {
        const badgeText = defaultHero ? defaultHero.badge_text : 'NEW COLLECTION';
        const heroTitle = defaultHero?.title || 'Modern Fashion for Everyday Life';
        const heroDescription =
            defaultHero !== undefined
                ? defaultHero.description
                : `Discover premium clothing, shoes, watches and accessories curated by ${theme.store_name} for a stylish lifestyle.`;
        const primaryBtnText = defaultHero ? defaultHero.primary_button_text : 'Shop Now';
        const primaryBtnUrl = defaultHero?.primary_button_url || '/shop';
        const secondaryBtnText = defaultHero ? defaultHero.secondary_button_text : 'Explore Collection';
        const secondaryBtnUrl = defaultHero?.secondary_button_url || '/shop?sort=latest';
        const cardTitle = defaultHero?.card_title || 'Curated Essentials';
        const cardSubtitle = defaultHero?.card_subtitle || '100% Authentic · Fast Cash on Delivery';
        const heroImageUrl = defaultHero?.image_url || '';

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="relative rounded-xl overflow-hidden bg-[#0B3B2E] text-white border border-stone-200/20">
                    <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[340px] sm:min-h-[390px]">
                        <div className="md:col-span-7 p-8 sm:p-12 lg:p-14 relative z-10">
                            {badgeText && (
                                <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/85 mb-3">
                                    {badgeText}
                                </span>
                            )}
                            <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight leading-[1.12] mb-4 text-white">
                                {heroTitle}
                            </h1>
                            {heroDescription && (
                                <p className="text-sm sm:text-base text-emerald-100/85 max-w-md mb-7 leading-relaxed">
                                    {heroDescription}
                                </p>
                            )}
                            {(primaryBtnText || secondaryBtnText) && (
                                <div className="flex flex-wrap items-center gap-3">
                                    {primaryBtnText && (
                                        <Link
                                            href={primaryBtnUrl}
                                            className="inline-flex items-center gap-2 h-11 px-6 bg-[#F96D16] hover:bg-[#EA580C] text-white font-semibold rounded-lg transition text-sm"
                                        >
                                            <span>{primaryBtnText}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    )}
                                    {secondaryBtnText && (
                                        <Link
                                            href={secondaryBtnUrl}
                                            className="inline-flex items-center h-11 px-6 border border-white/40 hover:bg-white/10 text-white font-medium rounded-lg transition text-sm"
                                        >
                                            {secondaryBtnText}
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="hidden md:flex md:col-span-5 h-full items-end justify-center relative pr-6 pt-6">
                            {heroImageUrl ? (
                                <div className="w-full max-w-[360px] h-[320px] rounded-t-full bg-[#F3EDE4] border border-white/20 overflow-hidden">
                                    <img
                                        src={heroImageUrl}
                                        alt={heroTitle}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-full max-w-[360px] h-[320px] rounded-t-full bg-[#F3EDE4] border border-white/20 flex flex-col items-center justify-center text-center p-8">
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#0B3B2E]/70 mb-2">
                                        {theme.store_name}
                                    </span>
                                    <p className="font-serif text-2xl font-bold text-[#0B3B2E] leading-snug">
                                        {cardTitle}
                                    </p>
                                    {cardSubtitle && (
                                        <p className="text-xs text-stone-600 mt-2">
                                            {cardSubtitle}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div
                className="relative w-full overflow-hidden rounded-xl bg-[#0B3B2E] group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                aria-roledescription="carousel"
                aria-label="Homepage Banners"
            >
                {/* Slide Track */}
                <div className="relative aspect-[16/8] sm:aspect-[21/8] md:aspect-[24/8.5] w-full max-h-[430px] min-h-[280px]">
                    {activeSlides.map((slide, index) => {
                        const isActive = index === currentIndex;

                        return (
                            <div
                                key={slide.id}
                                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                                }`}
                                aria-hidden={!isActive}
                            >
                                <picture>
                                    {slide.mobile_image_url && (
                                        <source media="(max-width: 640px)" srcSet={slide.mobile_image_url} />
                                    )}
                                    <img
                                        src={slide.image_url}
                                        alt={slide.title}
                                        className="w-full h-full object-cover"
                                    />
                                </picture>

                                {/* Deep Forest Green Overlay & Text Content */}
                                {(slide.title || slide.subtitle) && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#0B3B2E]/95 via-[#0B3B2E]/75 to-transparent flex items-center">
                                        <div className="px-7 sm:px-12 lg:px-14 w-full">
                                            <div className="max-w-lg text-white space-y-3">
                                                {slide.subtitle && (
                                                    <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/90">
                                                        {slide.subtitle}
                                                    </p>
                                                )}
                                                <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight leading-[1.12]">
                                                    {slide.title}
                                                </h2>
                                                <div className="pt-2 flex flex-wrap items-center gap-3">
                                                    <Link
                                                        href={slide.link_url || '/shop'}
                                                        className="inline-flex items-center gap-2 h-11 px-6 bg-[#F96D16] hover:bg-[#EA580C] text-white font-semibold text-xs sm:text-sm rounded-lg transition"
                                                    >
                                                        <span>{slide.button_text || 'Shop Now'}</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href="/shop?sort=latest"
                                                        className="inline-flex items-center h-11 px-5 border border-white/40 hover:bg-white/10 text-white font-medium text-xs sm:text-sm rounded-lg transition"
                                                    >
                                                        Explore Collection
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Carousel Arrow Controls (touch-visible on mobile, hover on desktop) */}
                {activeSlides.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={prevSlide}
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-stone-900/45 hover:bg-stone-900/70 text-white transition backdrop-blur-xs opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={nextSlide}
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-stone-900/45 hover:bg-stone-900/70 text-white transition backdrop-blur-xs opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Bottom-left Dots Indicators (matching mockup) */}
                        <div className="absolute bottom-4 left-7 sm:left-12 z-20 flex items-center gap-1.5">
                            {activeSlides.map((_, dotIdx) => (
                                <button
                                    key={dotIdx}
                                    type="button"
                                    onClick={() => setCurrentIndex(dotIdx)}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        dotIdx === currentIndex
                                            ? 'w-5 bg-[#F96D16]'
                                            : 'w-2 bg-white/50 hover:bg-white/80'
                                    }`}
                                    aria-label={`Go to slide ${dotIdx + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
