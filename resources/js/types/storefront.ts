import type { Category, PaginatedData, Product, SharedProps, Slider } from '@/types';

export interface StorefrontTheme {
    store_name: string;
    store_phone: string;
    store_whatsapp: string;
    logo_url: string;
    favicon_url?: string;
    primary_color: string;
    secondary_color?: string;
    accent_color?: string;
    font_family?: string;
    custom_css?: string;
}

export interface SectionsConfig {
    hero_slider_enabled: boolean;
    categories_enabled: boolean;
    featured_enabled: boolean;
    new_arrivals_enabled: boolean;
    best_sellers_enabled: boolean;
    category_sections_enabled: boolean;
}

export interface StorefrontHomeProps extends SharedProps {
    sliders: Slider[];
    categories: Category[];
    featuredProducts: Product[];
    newArrivals: Product[];
    bestSellers: Product[];
    categorySections: Category[];
    theme: StorefrontTheme;
    sectionsConfig: SectionsConfig;
}

export interface StorefrontShopProps extends SharedProps {
    products: PaginatedData<Product>;
    categories: Category[];
    selectedCategory: {
        id: number;
        name: string;
        slug: string;
        description: string | null;
        image_url: string | null;
    } | null;
    filters: {
        search: string;
        category: string;
        sort: string;
        in_stock: boolean;
    };
    theme: StorefrontTheme;
}

export interface StorefrontProductProps extends SharedProps {
    product: Product;
    relatedProducts: Product[];
    deliveryInfo: {
        inside_dhaka_fee: number;
        outside_dhaka_fee: number;
        cod_available: boolean;
        return_policy_days: number;
    };
    theme: StorefrontTheme;
}
