import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type TouchEvent,
} from 'react';
import { SafeImage } from '@/Shared/SafeImage';
import type { BlockStyles, ImageCarouselBlockProps } from '@/types/builder';

export interface ImageCarouselBlockComponentProps {
    props: ImageCarouselBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

const ASPECT_RATIOS: Record<string, string> = {
    '1 / 1': '1 / 1',
    '4 / 3': '4 / 3',
    '16 / 9': '16 / 9',
    '3 / 4': '3 / 4',
};

const SAFE_GAP_PATTERN = /^\d+(?:\.\d+)?(?:px|rem|em|%)$/;

function clampPerView(value: number | undefined, fallback: number, max: number): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(max, Math.max(1, Math.round(parsed)));
}

export function ImageCarouselBlock({
    props,
    styles = {},
    isEditor = false,
}: ImageCarouselBlockComponentProps) {
    const images = Array.isArray(props.images) ? props.images : [];
    const desktopPerView = clampPerView(props.desktopItemsPerView, 3, 6);
    const mobilePerView = clampPerView(props.mobileItemsPerView, 1, 4);

    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }

        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const syncViewport = () => setIsMobileViewport(mediaQuery.matches);

        syncViewport();
        mediaQuery.addEventListener('change', syncViewport);

        return () => mediaQuery.removeEventListener('change', syncViewport);
    }, []);

    const requestedPerView = isMobileViewport ? mobilePerView : desktopPerView;
    const perView = Math.max(1, Math.min(requestedPerView, images.length || 1));
    const maxIndex = Math.max(0, images.length - perView);

    useEffect(() => {
        setCurrentIndex((previous) => Math.min(previous, maxIndex));
    }, [maxIndex]);

    const goTo = useCallback(
        (target: number) => {
            if (images.length === 0) {
                return;
            }

            if (props.loop !== false) {
                if (target < 0) {
                    setCurrentIndex(maxIndex);
                    return;
                }
                if (target > maxIndex) {
                    setCurrentIndex(0);
                    return;
                }
            }

            setCurrentIndex(Math.min(Math.max(target, 0), maxIndex));
        },
        [images.length, maxIndex, props.loop]
    );

    const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
    const goPrevious = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

    const autoplayEnabled = Boolean(props.autoplay) && !isEditor && images.length > perView;
    const autoplayInterval = Math.min(
        15000,
        Math.max(2000, Number(props.autoplayInterval) || 4000)
    );

    useEffect(() => {
        if (!autoplayEnabled) {
            return;
        }

        const timer = window.setInterval(() => {
            setCurrentIndex((previous) => {
                if (previous >= maxIndex) {
                    return props.loop !== false ? 0 : previous;
                }

                return previous + 1;
            });
        }, autoplayInterval);

        return () => window.clearInterval(timer);
    }, [autoplayEnabled, autoplayInterval, maxIndex, props.loop]);

    const safeGap = SAFE_GAP_PATTERN.test(String(props.gap ?? '').trim())
        ? String(props.gap).trim()
        : '16px';
    const halfGap = `calc(${safeGap} / 2)`;
    const aspectRatio = ASPECT_RATIOS[props.aspectRatio ?? '4 / 3'] ?? '4 / 3';
    const imageFitClass = props.imageFit === 'contain' ? 'object-contain' : 'object-cover';
    const showArrows = props.showArrows !== false && images.length > perView;
    const showDots = props.showDots !== false && images.length > perView;

    const inlineStyles: CSSProperties = {
        backgroundColor: styles.backgroundColor,
        background: styles.background,
        color: styles.color,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        borderRadius: styles.borderRadius,
        maxWidth: styles.maxWidth,
        boxShadow: styles.boxShadow,
        borderWidth: styles.borderWidth,
        borderStyle: styles.borderStyle,
        borderColor: styles.borderColor,
        textAlign: styles.textAlign,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
    };

    const slideWidth = `${100 / perView}%`;
    const translate = `translateX(-${currentIndex * (100 / perView)}%)`;

    const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
    };

    const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
        const startX = touchStartX.current;
        const endX = event.changedTouches[0]?.clientX ?? null;

        if (startX === null || endX === null || Math.abs(startX - endX) < 40) {
            touchStartX.current = null;
            return;
        }

        if (startX > endX) {
            goNext();
        } else {
            goPrevious();
        }

        touchStartX.current = null;
    };

    return (
        <section style={inlineStyles} className="w-full bg-white py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {props.title && (
                    <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                        {props.title}
                    </h2>
                )}

                {images.length > 0 ? (
                    <div
                        className="relative"
                        aria-roledescription="carousel"
                        aria-label={props.title || 'Image carousel'}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
                                style={{ transform: translate }}
                            >
                                {images.map((image) => (
                                    <div
                                        key={image.id}
                                        className="shrink-0"
                                        style={{
                                            width: slideWidth,
                                            paddingLeft: halfGap,
                                            paddingRight: halfGap,
                                        }}
                                    >
                                        <div
                                            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm"
                                            style={{ aspectRatio }}
                                        >
                                            <SafeImage
                                                src={image.imageUrl}
                                                alt={image.altText || 'Carousel image'}
                                                className={`h-full w-full ${imageFitClass}`}
                                                loading="lazy"
                                                draggable={false}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {showArrows && (
                            <>
                                <button
                                    type="button"
                                    onClick={goPrevious}
                                    aria-label="Previous images"
                                    className="pointer-events-auto absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white hover:text-slate-950 sm:left-2"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    aria-label="Next images"
                                    className="pointer-events-auto absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white hover:text-slate-950 sm:right-2"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </>
                        )}

                        {showDots && (
                            <div className="mt-4 flex items-center justify-center gap-1.5">
                                {Array.from({ length: maxIndex + 1 }).map((_, dotIndex) => (
                                    <button
                                        key={dotIndex}
                                        type="button"
                                        onClick={() => goTo(dotIndex)}
                                        aria-label={`Go to image group ${dotIndex + 1}`}
                                        aria-current={currentIndex === dotIndex}
                                        className={`pointer-events-auto h-2 rounded-full transition-all ${
                                            currentIndex === dotIndex
                                                ? 'w-6 bg-slate-900'
                                                : 'w-2 bg-slate-300 hover:bg-slate-400'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                        <Images className="mb-2 h-8 w-8 text-slate-300" />
                        <span className="text-sm font-semibold text-slate-500">
                            No carousel images yet
                        </span>
                        <span className="mt-1 text-xs text-slate-400">
                            Add image URLs from the properties panel.
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
}
