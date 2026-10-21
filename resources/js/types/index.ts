export * from './cart';
import type { CartSummary } from './cart';
import type { StorefrontTheme } from './storefront';

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'super_admin' | 'store_manager' | 'fulfillment_agent' | string;
}

export interface Customer {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    district?: string | null;
    upazila?: string | null;
    created_at?: string;
}

export interface SharedProps extends Record<string, unknown> {
    auth: {
        user: User | null;
        customer?: Customer | null;
    };
    flash: {
        success?: string | null;
        error?: string | null;
    };
    cart?: CartSummary | null;
    errors: Record<string, string>;
}

export interface WishlistItem {
    id: number;
    customer_id: number;
    product_id: number;
    variant_id: number | null;
    product: Product;
    variant?: ProductVariant | null;
    created_at: string;
}

export interface OrderTrackingData {
    order_number: string;
    created_at: string;
    created_at_human: string;
    status: string;
    status_label: {
        en: string;
        bn: string;
    };
    masked_phone: string;
    district: string;
    subtotal: number;
    shipping_fee: number;
    discount: number;
    total: number;
    payment_method: string;
    payment_status: string;
    courier_name: string | null;
    courier_tracking_id: string | null;
    courier_tracking_url: string | null;
    items: Array<{
        id: number;
        product_title: string;
        variant_name: string | null;
        quantity: number;
        unit_price: number;
        total_price: number;
    }>;
    timeline: Array<{
        from_status: string | null;
        to_status: string;
        created_at: string;
        created_at_human: string;
    }>;
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
    images?: ProductImage[];
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

export interface MediaLibraryItem {
    key: string;
    source: 'product' | 'library';
    record_id: number;
    file_path: string;
    url: string;
    thumb_url: string;
    name: string;
    alt_text: string | null;
    source_label: string;
    is_primary: boolean;
    created_at: string | null;
}

export interface MediaIndexProps extends SharedProps {
    media: PaginatedData<MediaLibraryItem>;
    stats: {
        total: number;
        product: number;
        library: number;
    };
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
    categories?: Category[];
    primaryImage?: ProductImage | null;
    primary_image?: ProductImage | null;
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
    product?: Product | null;
    variant?: ProductVariant | null;
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
    mode?: 'cart' | 'direct';
    cart?: CartSummary | null;
    product: Product;
    shippingMethods: ShippingMethod[];
    paymentMethods: PaymentMethod[];
    defaultShippingFee: number;
    defaultZoneName: string;
    theme: StorefrontTheme;
    categories: Category[];
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

export interface Category {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    image_path: string | null;
    image_url?: string | null;
    sort_order: number;
    is_active: boolean;
    parent?: Category | null;
    children?: Category[];
    products?: Product[];
    products_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CategoryIndexProps extends SharedProps {
    categories: PaginatedData<Category>;
    rootCategories: Array<{ id: number; name: string }>;
    filters: {
        search: string;
    };
}

export interface PolicyPage {
    id: number;
    title: string;
    slug: string;
    content: string;
    is_published: boolean;
    is_protected: boolean;
    created_at: string;
    updated_at: string;
}

export interface PolicyPageIndexProps extends SharedProps {
    pages: PaginatedData<PolicyPage>;
    filters: {
        search: string;
    };
}

export interface ThemeSettings {
    storefront_mode: 'full_storefront' | 'landing_page_home';
    home_landing_page_id: number | string | null;
    store_name: string;
    store_logo_url: string;
    store_favicon_url: string;
    support_phone: string;
    support_whatsapp: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    text_color: string;
    font_family: string;
    custom_css: string;
}

export interface ThemeSettingsProps extends SharedProps {
    settings: ThemeSettings;
    landingPages: Array<{ id: number; title: string; slug: string }>;
}

export interface Slider {
    id: number;
    title: string;
    subtitle: string | null;
    image_path: string;
    mobile_image_path: string | null;
    image_url: string;
    mobile_image_url: string | null;
    link_url: string | null;
    button_text: string | null;
    sort_order: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface SliderIndexProps extends SharedProps {
    sliders: PaginatedData<Slider>;
    filters: {
        search: string;
    };
}

export * from './builder';
