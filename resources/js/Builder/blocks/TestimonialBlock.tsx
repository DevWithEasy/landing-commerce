import { BadgeCheck, MapPin, Quote, Star } from 'lucide-react';
import type { CSSProperties } from 'react';
import { SafeImage } from '@/Shared/SafeImage';
import { safeCheckoutCss } from './codCheckoutDesign';
import type { BlockStyles, TestimonialBlockProps } from '@/types/builder';

export interface TestimonialBlockComponentProps {
    props: TestimonialBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

export function TestimonialBlock({ props, styles = {} }: TestimonialBlockComponentProps) {
    const accentColor = safeCheckoutCss(props.accentColor) || '#059669';
    const accentSoft = /^#[0-9a-f]{6}$/i.test(accentColor)
        ? `${accentColor}14`
        : 'rgba(5, 150, 105, 0.08)';
    const authorName = props.authorName || 'Customer Name';
    const rating = Math.min(5, Math.max(1, Math.round(Number(props.rating) || 5)));
    const isMinimal = props.layout === 'minimal';
    const avatarSize = safeCheckoutCss(props.avatarSize) || '52px';

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

    const authorStyle: CSSProperties = {
        color: safeCheckoutCss(props.authorColor) || '#0f172a',
    };

    const avatarStyle: CSSProperties = {
        width: avatarSize,
        height: avatarSize,
        borderRadius: '9999px',
        backgroundColor: accentSoft,
        color: accentColor,
    };

    return (
        <section style={sectionStyle} className="w-full">
            <div
                className="mx-auto w-full max-w-4xl px-4 sm:px-6"
                style={{ textAlign: isMinimal ? 'center' : 'left' }}
            >
                <div style={cardStyle}>
                    <div
                        className={`flex items-center ${
                            isMinimal ? 'justify-center' : 'justify-between'
                        }`}
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
                            <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                        key={index}
                                        className="h-4 w-4"
                                        style={{
                                            color: index < rating ? accentColor : '#e2e8f0',
                                            fill: index < rating ? accentColor : 'transparent',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <blockquote style={{ margin: 0 }}>
                        <p style={quoteStyle}>&ldquo;{props.quote}&rdquo;</p>
                    </blockquote>

                    <div
                        className={`flex items-center gap-3 ${
                            isMinimal ? 'justify-center' : ''
                        }`}
                    >
                        <div
                            className="flex shrink-0 items-center justify-center overflow-hidden text-sm font-extrabold"
                            style={avatarStyle}
                        >
                            {props.avatarUrl ? (
                                <SafeImage
                                    src={props.avatarUrl}
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
                                <span className="text-sm font-bold" style={authorStyle}>
                                    {authorName}
                                </span>
                                {props.verifiedPurchase !== false && (
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
                                {props.authorRole && <span>{props.authorRole}</span>}
                                {props.location && (
                                    <span className="inline-flex items-center gap-0.5">
                                        <MapPin className="h-3 w-3" />
                                        {props.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
