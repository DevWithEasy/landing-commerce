export interface CartItemData {
    id: number;
    product_id: number;
    product_title: string;
    product_slug: string;
    variant_id: number;
    variant_name: string;
    image_url: string;
    unit_price: number;
    formatted_unit_price: string;
    regular_price: number;
    formatted_regular_price: string;
    quantity: number;
    line_total: number;
    formatted_line_total: string;
    is_in_stock: boolean;
    available_stock: number;
    manage_stock: boolean;
}

export interface CartSummary {
    id: number | null;
    total_items: number;
    subtotal: number;
    formatted_subtotal: string;
    items: CartItemData[];
    is_empty: boolean;
}
