import {
    Award,
    Clock,
    HeartHandshake,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    ThumbsUp,
    Truck,
} from 'lucide-react';
import type { CSSProperties, ReactElement } from 'react';
import type { BenefitsGridBlockProps, BlockStyles } from '@/types/builder';

export interface BenefitsGridBlockComponentProps {
    props: BenefitsGridBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

const ICON_MAP: Record<string, ReactElement> = {
    ShieldCheck: <ShieldCheck className="w-8 h-8 text-primary-600" />,
    Truck: <Truck className="w-8 h-8 text-primary-600" />,
    RotateCcw: <RotateCcw className="w-8 h-8 text-primary-600" />,
    Award: <Award className="w-8 h-8 text-primary-600" />,
    Clock: <Clock className="w-8 h-8 text-primary-600" />,
    ThumbsUp: <ThumbsUp className="w-8 h-8 text-primary-600" />,
    HeartHandshake: <HeartHandshake className="w-8 h-8 text-primary-600" />,
};

export function BenefitsGridBlock({ props, styles = {} }: BenefitsGridBlockComponentProps) {
    const inlineStyles: CSSProperties = {
        backgroundColor: styles.backgroundColor,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        borderRadius: styles.borderRadius,
    };

    const columns = props.columns || 3;
    const gridColsClass =
        columns === 4
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : columns === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-3';

    return (
        <section style={inlineStyles} className="w-full py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {props.title && (
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            {props.title}
                        </h2>
                    </div>
                )}

                <div className={`grid gap-6 ${gridColsClass}`}>
                    {props.items?.map((item) => {
                        const iconComponent =
                            item.icon && ICON_MAP[item.icon] ? (
                                ICON_MAP[item.icon]
                            ) : (
                                <Sparkles className="w-8 h-8 text-primary-600" />
                            );

                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center"
                            >
                                <div className="p-3.5 bg-primary-50 rounded-2xl mb-4 flex items-center justify-center">
                                    {iconComponent}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
