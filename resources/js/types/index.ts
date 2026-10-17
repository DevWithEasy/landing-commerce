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
