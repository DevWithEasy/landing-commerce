import { CheckCircle, MapPin, Star } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { BlockStyles, ReviewsBlockProps } from '@/types/builder';

export interface ReviewsBlockComponentProps {
    props: ReviewsBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
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

    return (
        <section style={inlineStyles} className="w-full py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {props.title && (
                    <div className="text-center mb-10">
                        <div className="flex items-center justify-center space-x-1 text-amber-400 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className="w-5 h-5 fill-current" />
                            ))}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            {props.title}
                        </h2>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {props.items?.map((review) => (
                        <div
                            key={review.id}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between"
                        >
                            <div>
                                {/* Rating Stars */}
                                <div className="flex items-center space-x-1 text-amber-400 mb-3">
                                    {Array.from({ length: review.rating || 5 }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-current" />
                                    ))}
                                </div>

                                {/* Review Body */}
                                <p className="text-sm text-gray-700 leading-relaxed italic mb-4">
                                    "{review.comment}"
                                </p>
                            </div>

                            {/* Author Info */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-sm text-gray-900">
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
                                    <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
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
