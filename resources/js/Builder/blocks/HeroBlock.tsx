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

    const headlineStyle: CSSProperties = {
        color: props.headlineColor || undefined,
        fontSize: props.headlineFontSize || undefined,
        fontWeight: props.headlineFontWeight || undefined,
        lineHeight: props.headlineLineHeight || undefined,
        textAlign: props.headlineAlign || undefined,
    };

    const subheadlineStyle: CSSProperties = {
        color: props.subheadlineColor || undefined,
        fontSize: props.subheadlineFontSize || undefined,
        fontWeight: props.subheadlineFontWeight || undefined,
    };

    const badgeStyle: CSSProperties = {
        color: props.badgeTextColor || undefined,
        backgroundColor: props.badgeBgColor || undefined,
        borderRadius: props.badgeBorderRadius || undefined,
    };

    const buttonSizeClasses = {
        sm: 'px-5 py-2.5 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-3.5 text-base font-bold',
        xl: 'px-10 py-5 text-xl font-black',
    }[props.buttonSize || 'lg'] || 'px-8 py-3.5 text-base font-bold';

    const buttonWidthClass = props.buttonWidth === 'full' ? 'w-full justify-center' : 'w-auto';

    const buttonCustomStyle: CSSProperties = {
        backgroundColor: props.buttonBgColor || styles.buttonBgColor || undefined,
        color: props.buttonTextColor || styles.buttonTextColor || undefined,
        borderRadius: props.buttonBorderRadius || styles.buttonBorderRadius || undefined,
    };
    const buttonPulseClass = (props.buttonPulseAnimation || styles.buttonPulseAnimation) ? 'animate-pulse' : '';

    const hasImage = Boolean(props.imageUrl);

    return (
        <section
            style={inlineStyles}
            className="w-full relative overflow-hidden transition-all duration-150"
        >
            <div className="max-w-6xl mx-auto px-4 @min-[640px]:px-6 @min-[1024px]:px-8">
                <div
                    className={`flex flex-col ${
                        hasImage ? '@min-[800px]:flex-row items-center gap-8 @min-[1024px]:gap-12' : 'items-center text-center'
                    }`}
                >
                    {/* Content Column */}
                    <div className={`flex-1 ${hasImage ? 'text-left' : 'max-w-3xl'}`}>
                        {props.badgeText && (
                            <div
                                style={badgeStyle}
                                data-lc-el="badge"
                                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs ${
                                    !props.badgeBgColor ? 'bg-primary-100 text-primary-800' : ''
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 opacity-80" />
                                <span>{props.badgeText}</span>
                            </div>
                        )}

                        <h1
                            style={headlineStyle}
                            data-lc-el="title"
                            className="text-3xl @min-[640px]:text-4xl @min-[800px]:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight"
                        >
                            {props.headline || 'Your Compelling Headline Here'}
                        </h1>

                        {props.subheadline && (
                            <p
                                style={subheadlineStyle}
                                data-lc-el="subtitle"
                                className="mt-4 text-base @min-[640px]:text-lg text-gray-600 leading-relaxed max-w-2xl"
                            >
                                {props.subheadline}
                            </p>
                        )}

                        <div className={`mt-8 flex flex-wrap gap-4 items-center ${props.buttonWidth === 'full' ? 'w-full' : ''}`}>
                            {isEditor ? (
                                <button
                                    type="button"
                                    style={buttonCustomStyle}
                                    data-lc-el="cta"
                                    className={`inline-flex items-center justify-center rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer ${buttonSizeClasses} ${buttonWidthClass} ${buttonPulseClass}`}
                                >
                                    <span>{props.ctaText || 'Order Now'}</span>
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            ) : (
                                <a
                                    href={props.ctaTarget || '#cod-checkout'}
                                    style={buttonCustomStyle}
                                    data-lc-el="cta"
                                    className={`inline-flex items-center justify-center rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all transform hover:-translate-y-0.5 ${buttonSizeClasses} ${buttonWidthClass} ${buttonPulseClass}`}
                                >
                                    <span>{props.ctaText || 'Order Now'}</span>
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Image Column if present */}
                    {hasImage && (
                        <div
                            data-lc-el="image"
                            className="flex-1 w-full max-w-md @min-[800px]:max-w-none"
                        >
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
