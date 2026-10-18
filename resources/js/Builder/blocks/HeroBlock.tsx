import { ArrowRight, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { BlockStyles, HeroBlockProps } from '@/types/builder';

export interface HeroBlockComponentProps {
    props: HeroBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function HeroBlock({ props, styles = {}, isEditor = false }: HeroBlockComponentProps) {
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

    const buttonCustomStyle: CSSProperties = {
        backgroundColor: styles.buttonBgColor || undefined,
        color: styles.buttonTextColor || undefined,
    };
    const buttonPulseClass = styles.buttonPulseAnimation ? 'animate-pulse' : '';

    const hasImage = Boolean(props.imageUrl);

    return (
        <section
            style={inlineStyles}
            className="w-full relative overflow-hidden transition-all duration-150"
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                    className={`flex flex-col ${
                        hasImage ? 'lg:flex-row items-center gap-12' : 'items-center text-center'
                    }`}
                >
                    {/* Content Column */}
                    <div className={`flex-1 ${hasImage ? 'text-left' : 'max-w-3xl'}`}>
                        {props.badgeText && (
                            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
                                <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                                <span>{props.badgeText}</span>
                            </div>
                        )}

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                            {props.headline || 'Your Compelling Headline Here'}
                        </h1>

                        {props.subheadline && (
                            <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
                                {props.subheadline}
                            </p>
                        )}

                        <div className="mt-8 flex flex-wrap gap-4 items-center">
                            {isEditor ? (
                                <button
                                    type="button"
                                    style={buttonCustomStyle}
                                    className={`inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer ${buttonPulseClass}`}
                                >
                                    <span>{props.ctaText || 'Order Now'}</span>
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            ) : (
                                <a
                                    href={props.ctaTarget || '#cod-checkout'}
                                    style={buttonCustomStyle}
                                    className={`inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/25 transition-all transform hover:-translate-y-0.5 ${buttonPulseClass}`}
                                >
                                    <span>{props.ctaText || 'Order Now'}</span>
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Image Column if present */}
                    {hasImage && (
                        <div className="flex-1 w-full max-w-md lg:max-w-none">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white border border-gray-100 aspect-4/3">
                                <img
                                    src={props.imageUrl}
                                    alt={props.headline}
                                    className="w-full h-full object-cover object-center"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
