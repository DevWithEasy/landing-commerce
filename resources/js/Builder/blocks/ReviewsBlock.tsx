import { CheckCircle, MapPin, Star } from 'lucide-react';
import type { CSSProperties } from 'react';
import { safeCheckoutCss } from './codCheckoutDesign';
import type { BlockStyles, ReviewsBlockProps } from '@/types/builder';

export interface ReviewsBlockComponentProps {
    props: ReviewsBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

function RatingStars({
    rating,
    color,
    emptyColor,
    size,
    starStyle,
}: {
    rating: number;
    color: string;
    emptyColor: string;
    size: string;
    starStyle: 'filled' | 'outline';
}) {
    const safeRating = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));

    return (
        <div className="flex items-center gap-0.5" data-lc-el="stars" aria-label={`${safeRating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, index) => {
                const isFilled = index < safeRating;

                return (
                    <Star
                        key={index}
                        style={{
                            width: size,
                            height: size,
                            color: isFilled ? color : emptyColor,
                            fill: isFilled && starStyle === 'filled' ? color : 'transparent',
                        }}
                    />
                );
            })}
        </div>
    );
}

export function ReviewsBlock({ props, styles = {} }: ReviewsBlockComponentProps) {
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

    const starColor = safeCheckoutCss(props.starColor) || '#f59e0b';
    const starEmptyColor = safeCheckoutCss(props.starEmptyColor) || '#d1d5db';
    const starSize = safeCheckoutCss(props.starSize) || '16px';
    const starStyle = props.starStyle === 'outline' ? 'outline' : 'filled';
    const showStars = props.showStars !== false;
    const showRatingSummary = props.showRatingSummary !== false;
    const ratingSummaryText = props.ratingSummaryText || '4.9/5 from verified buyers';
    const ratingSummaryColor = safeCheckoutCss(props.ratingSummaryColor) || '#334155';

    return (
        <section style={inlineStyles} className="w-full py-12">
            <div className="max-w-6xl mx-auto px-4 @min-[640px]:px-6 @min-[1024px]:px-8">
                {props.title && (
                    <div className="text-center mb-10">
                        {showStars && (
                            <div className="mb-2 flex justify-center">
                                <RatingStars
                                    rating={5}
                                    color={starColor}
                                    emptyColor={starEmptyColor}
                                    size={starSize}
                                    starStyle={starStyle}
                                />
                            </div>
                        )}
                        <h2
                            data-lc-el="title"
                            className="text-2xl @min-[640px]:text-3xl font-extrabold text-gray-900 tracking-tight"
                        >
                            {props.title}
                        </h2>
                        {showRatingSummary && (
                            <p
                                data-lc-el="summary"
                                className="mt-2 text-sm font-semibold"
                                style={{ color: ratingSummaryColor }}
                            >
                                {ratingSummaryText}
                            </p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 @min-[768px]:grid-cols-2 @min-[800px]:grid-cols-3 gap-6">
                    {props.items?.map((review) => (
                        <div
                            key={review.id}
                            data-lc-el="card"
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between"
                        >
                            <div>
                                {/* Rating Stars */}
                                {showStars && (
                                    <div className="mb-3">
                                        <RatingStars
                                            rating={review.rating || 5}
                                            color={starColor}
                                            emptyColor={starEmptyColor}
                                            size={starSize}
                                            starStyle={starStyle}
                                        />
                                    </div>
                                )}

                                {/* Review Body */}
                                <p
                                    data-lc-el="comment"
                                    className="text-sm text-gray-700 leading-relaxed italic mb-4"
                                >
                                    "{review.comment}"
                                </p>
                            </div>

                            {/* Author Info */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div>
                                    <div data-lc-el="author" className="font-bold text-sm text-gray-900">
                                        {review.authorName}
                                    </div>
                                    {review.location && (
                                        <div className="text-xs text-gray-400 flex items-center mt-0.5">
                                            <MapPin className="w-3 h-3 mr-0.5" />
                                            <span>{review.location}</span>
                                        </div>
                                    )}
                                </div>

                                {review.verifiedPurchase !== false && (
                                    <div
                                        data-lc-el="verified"
                                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold"
                                    >
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Verified Buyer</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
