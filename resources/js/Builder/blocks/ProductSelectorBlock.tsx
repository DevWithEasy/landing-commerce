import { Check, Package, ShoppingBag, Tag } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { BlockStyles, ProductSelectorBlockProps } from '@/types/builder';

export interface ProductSelectorBlockComponentProps {
    props: ProductSelectorBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function ProductSelectorBlock({
    props,
    styles = {},
    isEditor = false,
}: ProductSelectorBlockComponentProps) {
    const inlineStyles: CSSProperties = {
        backgroundColor: styles.backgroundColor,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        borderRadius: styles.borderRadius,
        maxWidth: styles.maxWidth,
    };

    return (
        <section style={inlineStyles} className="w-full py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="bg-white rounded-2xl border-2 border-primary-500 shadow-xl overflow-hidden p-6 sm:p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        {/* Product Visual Container */}
                        <div className="w-full md:w-1/2 aspect-square bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-6 text-center">
                            <div>
                                <Package className="w-16 h-16 text-primary-400 mx-auto mb-3" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Product ID: #{props.productId || 'Active Product'}
                                </span>
                            </div>
                        </div>

                        {/* Product Meta */}
                        <div className="w-full md:w-1/2 space-y-4">
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                                <Tag className="w-3.5 h-3.5" />
                                <span>Verified Authentic - In Stock</span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                Premium Product Selection
                            </h2>

                            {props.showDescription !== false && (
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Select your preferred variants and proceed to our fast, 1-step
                                    Cash on Delivery checkout.
                                </p>
                            )}

                            {props.showPrice !== false && (
                                <div className="flex items-baseline space-x-3 pt-2">
                                    <span className="text-3xl font-extrabold text-primary-600">
                                        ৳1,450.00
                                    </span>
                                    <span className="text-lg text-gray-400 line-through">
                                        ৳1,850.00
                                    </span>
                                    <span className="text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md">
                                        SAVE ৳400
                                    </span>
                                </div>
                            )}

                            <div className="pt-4">
                                <a
                                    href="#cod-checkout"
                                    onClick={(e) => isEditor && e.preventDefault()}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-600/20 transition-all text-center"
                                >
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    <span>Select & Order Now</span>
                                </a>
                            </div>

                            <div className="flex items-center space-x-4 pt-2 text-xs text-gray-500">
                                <span className="flex items-center">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                    Cash on Delivery
                                </span>
                                <span className="flex items-center">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                    Inspect Before Paying
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
