import { Check, CheckSquare, CircleDot, Package, ShoppingBag, Tag } from 'lucide-react';
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

    const count = props.productIds?.length || (props.productId ? 1 : 0);
    const isMultiple = Boolean(props.productIds && props.productIds.length > 1);
    const mode = props.selectionMode || 'single';

    if (isMultiple) {
        return (
            <section style={inlineStyles} className="w-full py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
                            {mode === 'multiple' ? 'Multiple Selection (Checkbox)' : 'Single Selection (Radio)'}
                        </span>
                        <h2 className="text-2xl font-extrabold text-gray-900">
                            {mode === 'multiple' ? 'Select Products to Order Together' : 'Choose 1 Product Option'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(props.productIds || []).map((pid, idx) => (
                            <div
                                key={pid}
                                className={`rounded-2xl border-2 p-4 transition-all bg-white shadow-xs ${
                                    idx === 0 || mode === 'multiple'
                                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                                        : 'border-gray-200'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-700">
                                        {mode === 'multiple' ? (
                                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <CircleDot className="w-4 h-4 text-emerald-600" />
                                        )}
                                        <span>Product #{pid}</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                        Active
                                    </span>
                                </div>

                                <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center mb-3">
                                    <Package className="w-10 h-10 text-gray-400" />
                                </div>

                                <h3 className="text-sm font-bold text-gray-900 mb-1">
                                    Product Item #{pid}
                                </h3>
                                {props.showPrice !== false && (
                                    <div className="text-base font-extrabold text-emerald-600">
                                        ৳1,250.00
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-gray-600">
                            <span className="font-bold text-gray-900">{count} products</span> included in this selector.
                        </div>
                        <a
                            href="#cod-checkout"
                            onClick={(e) => isEditor && e.preventDefault()}
                            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
                        >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            <span>Proceed to Checkout</span>
                        </a>
                    </div>
                </div>
            </section>
        );
    }

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
