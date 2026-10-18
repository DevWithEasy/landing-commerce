import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Slider } from '@/types';
import type { StorefrontTheme } from '@/types/storefront';

interface HeroSliderProps {
    sliders: Slider[];
    theme: StorefrontTheme;
}

export function HeroSlider({ sliders, theme }: HeroSliderProps) {
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
        return (
            <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white py-16 sm:py-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                <div className="relative max-w-4xl mx-auto text-center">
                    <span className="inline-block px-3 py-1 bg-indigo-500/30 text-indigo-200 text-xs font-semibold rounded-full mb-4 border border-indigo-400/30">
                        প্রিমিয়াম অনলাইন শপিং
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
                        {theme.store_name}
                    </h1>
                    <p className="text-base sm:text-lg text-indigo-200 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
                        সেরা দামে আসল পণ্য, আকর্ষণীয় ডিসকাউন্ট ও সারা বাংলাদেশে দ্রুততম ক্যাশ অন ডেলিভারি সেবা।
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/shop"
                            className="px-8 py-3.5 bg-white text-indigo-900 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition transform hover:-translate-y-0.5 text-sm"
                        >
                            কেনাকাটা শুরু করুন
                        </Link>
                        {theme.store_whatsapp && (
                            <a
                                href={`https://wa.me/${theme.store_whatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition text-sm"
                            >
                                WhatsApp অর্ডার
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative w-full overflow-hidden bg-gray-900 group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            aria-roledescription="carousel"
            aria-label="Homepage Banners"
        >
            {/* Slide Track */}
            <div className="relative aspect-[16/7] sm:aspect-[21/8] md:aspect-[24/9] w-full max-h-[520px]">
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
                            {/* Responsive Images: Mobile image with Desktop picture element */}
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

                            {/* Gradient Overlay & Text Content */}
                            {(slide.title || slide.subtitle) && (
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-950/40 to-transparent flex items-center">
                                    <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full">
                                        <div className="max-w-xl text-white space-y-3">
                                            {slide.subtitle && (
                                                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-indigo-300 drop-shadow">
                                                    {slide.subtitle}
                                                </p>
                                            )}
                                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
                                                {slide.title}
                                            </h2>
                                            {slide.button_text && (
                                                <div className="pt-2">
                                                    <Link
                                                        href={slide.link_url || '/shop'}
                                                        className="inline-flex items-center px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
                                                    >
                                                        {slide.button_text}
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Carousel Arrow Controls */}
            {activeSlides.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={prevSlide}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button
                        type="button"
                        onClick={nextSlide}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    {/* Dots Indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                        {activeSlides.map((_, dotIdx) => (
                            <button
                                key={dotIdx}
                                type="button"
                                onClick={() => setCurrentIndex(dotIdx)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    dotIdx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                                }`}
                                aria-label={`Go to slide ${dotIdx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
