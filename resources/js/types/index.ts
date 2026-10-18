export interface User {
    id: number;
    name: string;
    email: string;
    role: 'super_admin' | 'store_manager' | 'fulfillment_agent' | string;
}

export interface SharedProps extends Record<string, unknown> {
    auth: {
        user: User | null;
    };
    flash: {
        success?: string | null;
        error?: string | null;
    };
    errors: Record<string, string>;
}

export interface ProductVariant {
    id: number;
    product_id: number;
    sku: string;
    name: string;
    attributes: Record<string, string> | null;
    regular_price: string | number;
    sale_price: string | number | null;
    stock_quantity: number;
    manage_stock: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ProductImage {
    id: number;
    product_id: number;
    variant_id: number | null;
    file_path: string;
    sort_order: number;
    is_primary: boolean;
    alt_text: string | null;
    url: string;
    thumb_url: string;
}

export interface Product {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    regular_price: string | number;
    sale_price: string | number | null;
    has_variants: boolean;
    status: 'draft' | 'active' | 'archived';
    created_at: string;
    updated_at: string;
    variants: ProductVariant[];
    images: ProductImage[];
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

export interface ProductIndexProps extends SharedProps {
    products: PaginatedData<Product>;
    filters: {
        search: string;
        status: string;
        stock_level: string;
    };
    stats: {
        total: number;
        active: number;
        low_stock: number;
        out_of_stock: number;
    };
}

export interface ProductEditProps extends SharedProps {
    product: Product;
}

export interface VariantMatrixCombination {
    name: string;
    sku_suffix: string;
    attributes: Record<string, string>;
}

export interface ShippingZone {
    id: number;
    name: string;
    code: string;
    rate: string | number;
    delivery_time?: string | null;
    is_active: boolean;
    is_default: boolean;
}

export interface ShippingMethod {
    id: number;
    name: string;
    code: string;
    description: string | null;
    shipping_zone_id: number | null;
    zone_code: string | null;
    rate: string | number;
    delivery_time: string | null;
    is_active: boolean;
    is_default: boolean;
    sort_order: number;
    zone?: ShippingZone | null;
}

export interface PaymentMethod {
    id: number;
    name: string;
    code: string;
    description: string | null;
    instructions: string | null;
    account_number: string | null;
    is_active: boolean;
    is_online: boolean;
    requires_transaction_id: boolean;
    sort_order: number;
}

export interface Upazila {
    id: number;
    district_id: number;
    name: string;
    bn_name: string | null;
    shipping_zone_id: number | null;
}

export interface District {
    id: number;
    name: string;
    bn_name: string | null;
    shipping_zone_id: number | null;
    upazilas?: Upazila[];
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    variant_id: number;
    product_title: string;
    variant_name: string;
    unit_price: string | number;
    quantity: number;
    total_price: string | number;
    is_restocked: boolean;
}

export interface Order {
    id: number;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    district: string;
    upazila: string | null;
    status: string;
    payment_method: string;
    payment_status?: string;
    payment_transaction_id?: string | null;
    payment_details?: Record<string, unknown> | null;
    shipping_method_id?: number | null;
    shipping_method_name?: string | null;
    subtotal: string | number;
    shipping_fee: string | number;
    discount: string | number;
    total: string | number;
    courier_name?: string | null;
    courier_tracking_id?: string | null;
    courier_tracking_url?: string | null;
    notes: string | null;
    idempotency_key: string;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
    histories?: OrderHistory[];
    timeline?: OrderTimelineNode[];
}

export interface OrderHistory {
    id: number;
    order_id: number;
    from_status: string | null;
    to_status: string;
    comment: string | null;
    user_id: number | null;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

export interface OrderTimelineNode {
    id: number;
    order_id: number;
    from_status: string | null;
    to_status: string;
    comment: string | null;
    user_id: number | null;
    user_name: string | null;
    is_system: boolean;
    created_at: string | null;
    created_at_human: string | null;
}

export interface CheckoutShowProps extends SharedProps {
    product: Product;
    districts: District[];
    defaultShippingFee: number;
    defaultZoneName: string;
    defaultShippingMethods?: ShippingMethod[];
    paymentMethods?: PaymentMethod[];
}

export interface ThankYouProps extends SharedProps {
    order: Order;
    merchantWhatsapp: string | null;
}

export interface CourierConfig {
    default: string;
    drivers: Record<string, string>;
    configured: Record<string, boolean>;
}

export interface SmsConfig {
    default: string;
    drivers: Record<string, string>;
    configured: Record<string, boolean>;
    templates: Record<string, string>;
}

export interface OrderIndexProps extends SharedProps {
    orders: PaginatedData<Order>;
    filters: {
        search: string | null;
        status: string | null;
        date_from: string | null;
        date_to: string | null;
    };
    statusCounts: Record<string, number>;
    allowedTransitions: Record<string, string[]>;
    courierConfig?: CourierConfig;
    smsConfig?: SmsConfig;
}

export * from './builder';
