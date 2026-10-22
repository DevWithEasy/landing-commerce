import { BadgeCheck, ChevronLeft, ChevronRight, MapPin, Quote, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { SafeImage } from '@/Shared/SafeImage';
import { safeCheckoutCss } from './codCheckoutDesign';
import { clampTestimonialRating, resolveTestimonialItems } from './testimonialItems';
import type { BlockStyles, TestimonialBlockProps, TestimonialItem } from '@/types/builder';

export interface TestimonialBlockComponentProps {
    props: TestimonialBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

const DEFAULT_AUTOPLAY_INTERVAL = 5000;

function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

function TestimonialCard({
    item,
    props,
    accentColor,
    accentSoft,
    isMinimal,
    avatarSize,
    starColor,
    starSize,
    starStyle,
}: {
    item: TestimonialItem;
    props: TestimonialBlockProps;
    accentColor: string;
    accentSoft: string;
    isMinimal: boolean;
    avatarSize: string;
    starColor: string;
    starSize: string;
    starStyle: 'filled' | 'outline';
}) {
    const authorName = item.authorName || 'Customer Name';
    const rating = clampTestimonialRating(item.rating ?? props.rating ?? 5);
    const verified = item.verifiedPurchase ?? props.verifiedPurchase ?? true;

    const cardStyle: CSSProperties = isMinimal
        ? {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '18px',
              padding: '8px',
          }
        : {
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              height: '100%',
              padding: safeCheckoutCss(props.cardPadding) || '32px',
              borderRadius: safeCheckoutCss(props.cardRadius) || '20px',
              backgroundColor: safeCheckoutCss(props.cardBgColor) || '#ffffff',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              boxShadow: '0 18px 40px -24px rgba(15, 23, 42, 0.35)',
          };

    const quoteStyle: CSSProperties = {
        color: safeCheckoutCss(props.quoteColor) || '#1e293b',
        fontSize: safeCheckoutCss(props.quoteFontSize) || '20px',
        lineHeight: 1.6,
        fontWeight: 500,
        margin: 0,
    };

    const avatarStyle: CSSProperties = {
        width: avatarSize,
        height: avatarSize,
        borderRadius: '9999px',
        backgroundColor: accentSoft,
        color: accentColor,
    };

    return (
        <div style={cardStyle} data-lc-el="card" className="w-full">
            <div
                className={`flex items-center ${isMinimal ? 'justify-center' : 'justify-between'}`}
            >
                {props.showQuoteIcon !== false && (
                    <span
                        className="flex h-9 w-9 items-center justify-center rounded-full"
                        style={{ backgroundColor: accentSoft, color: accentColor }}
                    >
                        <Quote className="h-4 w-4" />
                    </span>
                )}

                {props.showRating !== false && (
                    <div
                        data-lc-el="stars"
                        className="flex items-center gap-0.5"
                        aria-label={`${rating} out of 5 stars`}
                    >
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                                key={index}
                                style={{
                                    width: starSize,
                                    height: starSize,
                                    color: index < rating ? starColor : '#e2e8f0',
                                    fill:
                                        index < rating && starStyle === 'filled'
                                            ? starColor
                                            : 'transparent',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <blockquote style={{ margin: 0 }}>
                <p style={quoteStyle} data-lc-el="quote">
                    &ldquo;{item.quote}&rdquo;
                </p>
            </blockquote>

            <div className={`flex items-center gap-3 ${isMinimal ? 'justify-center' : ''}`}>
                <div
                    data-lc-el="avatar"
                    className="flex shrink-0 items-center justify-center overflow-hidden text-sm font-extrabold"
                    style={avatarStyle}
                >
                    {item.avatarUrl ? (
                        <SafeImage
                            src={item.avatarUrl}
                            alt={authorName}
                            className="h-full w-full object-cover"
                            fallbackText=""
                            fallbackIconSize="h-5 w-5"
                        />
                    ) : (
                        <span>{initials(authorName)}</span>
                    )}
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span
                            data-lc-el="author"
                            className="text-sm font-bold"
                            style={{ color: safeCheckoutCss(props.authorColor) || '#0f172a' }}
                        >
                            {authorName}
                        </span>
                        {verified && (
                            <span
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                                style={{ color: accentColor }}
                            >
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Verified
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        {item.authorRole && <span>{item.authorRole}</span>}
                        {item.location && (
                            <span className="inline-flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TestimonialBlock({
    props,
    styles = {},
    isEditor = false,
}: TestimonialBlockComponentProps) {
    const items = useMemo(() => resolveTestimonialItems(props), [props]);
    const accentColor = safeCheckoutCss(props.accentColor) || '#059669';
    const accentSoft = /^#[0-9a-f]{6}$/i.test(accentColor)
        ? `${accentColor}14`
        : 'rgba(5, 150, 105, 0.08)';
    const isMinimal = props.layout === 'minimal';
    const avatarSize = safeCheckoutCss(props.avatarSize) || '52px';
    const starColor = safeCheckoutCss(props.starColor) || accentColor;
    const starSize = safeCheckoutCss(props.starSize) || '16px';
    const starStyle = props.starStyle === 'outline' ? 'outline' : 'filled';
    const canScroll = items.length > 1;

    const trackRef = useRef<HTMLDivElement | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const sectionStyle: CSSProperties = {
        backgroundColor: styles.backgroundColor,
        background: styles.background,
        color: styles.color,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        minHeight: styles.minHeight,
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

    useEffect(() => {
        if (activeIndex <= items.length - 1) {
            return;
        }

        setActiveIndex(Math.max(0, items.length - 1));
    }, [activeIndex, items.length]);

    useEffect(() => {
        const track = trackRef.current;

        if (!track) {
            return;
        }

        track.scrollTo({
            left: activeIndex * track.clientWidth,
            behavior: isEditor ? 'auto' : 'smooth',
        });
    }, [activeIndex, isEditor]);

    const goTo = useCallback(
        (index: number) => {
            const lastIndex = items.length - 1;
            const loop = props.loop !== false;

            if (index < 0) {
                setActiveIndex(loop ? lastIndex : 0);
                return;
            }

            if (index > lastIndex) {
                setActiveIndex(loop ? 0 : lastIndex);
                return;
            }

            setActiveIndex(index);
        },
        [items.length, props.loop]
    );

    useEffect(() => {
        if (isEditor || !canScroll || !props.autoplay || isPaused) {
            return;
        }

        const parsedInterval = Number(props.autoplayInterval);
        const interval = Number.isFinite(parsedInterval)
            ? Math.min(15000, Math.max(2000, parsedInterval))
            : DEFAULT_AUTOPLAY_INTERVAL;

        const timer = window.setInterval(() => {
            setActiveIndex((current) => {
                if (current >= items.length - 1) {
                    return props.loop !== false ? 0 : current;
                }

                return current + 1;
            });
        }, interval);

        return () => window.clearInterval(timer);
    }, [
        canScroll,
        isEditor,
        isPaused,
        items.length,
        props.autoplay,
        props.autoplayInterval,
        props.loop,
    ]);

    const handleScroll = () => {
        const track = trackRef.current;

        if (!track || track.clientWidth === 0) {
            return;
        }

        const nextIndex = Math.round(track.scrollLeft / track.clientWidth);

        if (nextIndex !== activeIndex) {
            setActiveIndex(Math.min(items.length - 1, Math.max(0, nextIndex)));
        }
    };

    return (
        <section style={sectionStyle} className="w-full">
            <div className="mx-auto w-full max-w-4xl px-4 @min-[640px]:px-6">
                <div
                    className="relative"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                >
                    <div
                        ref={trackRef}
                        onScroll={canScroll ? handleScroll : undefined}
                        style={{
                            display: 'flex',
                            overflowX: canScroll ? 'auto' : 'visible',
                            scrollBehavior: isEditor ? 'auto' : 'smooth',
                            scrollSnapType: canScroll ? 'x mandatory' : undefined,
                            scrollbarWidth: 'none',
                        }}
                    >
                        {items.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    flex: '0 0 100%',
                                    minWidth: '100%',
                                    paddingInline: canScroll ? '8px' : 0,
                                    scrollSnapAlign: 'start',
                                    scrollSnapStop: 'always',
                                }}
                            >
                                <TestimonialCard
                                    item={item}
                                    props={props}
                                    accentColor={accentColor}
                                    accentSoft={accentSoft}
                                    isMinimal={isMinimal}
                                    avatarSize={avatarSize}
                                    starColor={starColor}
                                    starSize={starSize}
                                    starStyle={starStyle}
                                />
                            </div>
                        ))}
                    </div>

                    {canScroll && props.showArrows !== false && (
                        <>
                            <button
                                type="button"
                                onClick={() => goTo(activeIndex - 1)}
                                aria-label="Previous testimonial"
                                data-lc-el="arrow"
                                className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => goTo(activeIndex + 1)}
                                aria-label="Next testimonial"
                                data-lc-el="arrow"
                                className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>

                {canScroll && props.showDots !== false && (
                    <div className="mt-5 flex items-center justify-center gap-1.5">
                        {items.map((item, index) => (
                            <button
                                key={`dot_${item.id}`}
                                type="button"
                                onClick={() => goTo(index)}
                                aria-label={`Go to testimonial ${index + 1}`}
                                aria-current={index === activeIndex}
                                data-lc-el="dot"
                                className="h-2 rounded-full transition-all"
                                style={{
                                    width: index === activeIndex ? '24px' : '8px',
                                    backgroundColor:
                                        index === activeIndex ? accentColor : '#cbd5e1',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
