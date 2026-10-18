export interface PurchaseOrderItem {
    id?: number;
    order_id?: number;
    product_id?: number;
    variant_id?: number;
    quantity: number;
    price: string | number;
}

export interface PurchaseOrderPayload {
    id?: number;
    order_number: string;
    total_amount: string | number;
    items?: PurchaseOrderItem[];
}

declare global {
    interface Window {
        fbq?: (
            action: string,
            eventName: string,
            params?: Record<string, unknown>,
            options?: { eventID?: string }
        ) => void;
        gtag?: (
            command: string,
            action: string,
            params?: Record<string, unknown>
        ) => void;
        ttq?: {
            track: (
                eventName: string,
                params?: Record<string, unknown>,
                options?: { event_id?: string }
            ) => void;
            page: () => void;
        };
        dataLayer?: Array<Record<string, unknown> | unknown[]>;
    }
}

/**
 * Track InitiateCheckout event (when customer opens checkout form or clicks an order button).
 */
export function trackInitiateCheckout(payload?: {
    value?: number;
    contentIds?: string[];
    numItems?: number;
}): void {
    const value = payload?.value || 0;
    const contentIds = payload?.contentIds || [];
    const numItems = payload?.numItems || 1;

    // Meta Pixel
    if (typeof window.fbq === 'function') {
        window.fbq('track', 'InitiateCheckout', {
            content_type: 'product',
            content_ids: contentIds,
            num_items: numItems,
            value,
            currency: 'BDT',
        });
    }

    // Google Analytics 4 / Google Ads
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'begin_checkout', {
            currency: 'BDT',
            value,
            items: contentIds.map((id) => ({ item_id: id })),
        });
    }

    // TikTok Pixel
    if (typeof window.ttq === 'object' && typeof window.ttq.track === 'function') {
        window.ttq.track('InitiateCheckout', {
            content_type: 'product',
            content_id: contentIds[0] || '',
            quantity: numItems,
            value,
            currency: 'BDT',
        });
    }
}

/**
 * Track AddPaymentInfo event (when customer selects a payment method like COD or MFS).
 */
export function trackAddPaymentInfo(paymentType: string, value?: number): void {
    const val = value || 0;

    // Meta Pixel
    if (typeof window.fbq === 'function') {
        window.fbq('track', 'AddPaymentInfo', {
            content_category: paymentType,
            value: val,
            currency: 'BDT',
        });
    }

    // Google Analytics 4
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'add_payment_info', {
            payment_type: paymentType,
            currency: 'BDT',
            value: val,
        });
    }

    // TikTok Pixel
    if (typeof window.ttq === 'object' && typeof window.ttq.track === 'function') {
        window.ttq.track('AddPaymentInfo', {
            content_type: 'product',
            value: val,
            currency: 'BDT',
        });
    }
}

/**
 * Track Purchase event on order confirmation / Thank You page.
 * Strictly deduplicates repeated fires so customer page refreshes never inflate purchase metrics.
 */
export function trackPurchase(order: PurchaseOrderPayload): boolean {
    if (!order || !order.order_number) return false;

    const dedupeKey = `lc_purchased_${order.order_number}`;

    try {
        if (sessionStorage.getItem(dedupeKey) || localStorage.getItem(dedupeKey)) {
            // Already tracked, strictly prevent duplicate firing
            return false;
        }
        sessionStorage.setItem(dedupeKey, '1');
        localStorage.setItem(dedupeKey, '1');
    } catch {
        // Fallback if browser storage is blocked
    }

    const value = Number(order.total_amount) || 0;
    const contentIds = (order.items || []).map((i) =>
        String(i.variant_id || i.product_id || i.id || '')
    );
    const numItems = (order.items || []).reduce(
        (sum, i) => sum + (Number(i.quantity) || 1),
        0
    );

    // Meta Pixel
    if (typeof window.fbq === 'function') {
        window.fbq(
            'track',
            'Purchase',
            {
                content_type: 'product',
                content_ids: contentIds,
                num_items: numItems,
                value,
                currency: 'BDT',
            },
            { eventID: order.order_number }
        );
    }

    // Google Analytics 4 & Google Ads
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'purchase', {
            transaction_id: order.order_number,
            value,
            currency: 'BDT',
            items: (order.items || []).map((i) => ({
                item_id: String(i.variant_id || i.product_id || ''),
                price: Number(i.price) || 0,
                quantity: Number(i.quantity) || 1,
            })),
        });
    }

    // TikTok Pixel
    if (typeof window.ttq === 'object' && typeof window.ttq.track === 'function') {
        window.ttq.track(
            'CompletePayment',
            {
                content_id: contentIds[0] || '',
                content_type: 'product',
                value,
                currency: 'BDT',
                quantity: numItems,
            },
            { event_id: order.order_number }
        );
    }

    return true;
}

/**
 * Track Contact event (e.g., clicking WhatsApp button or support inquiry).
 */
export function trackContact(channel = 'WhatsApp'): void {
    // Meta Pixel
    if (typeof window.fbq === 'function') {
        window.fbq('track', 'Contact', {
            content_name: channel,
        });
    }

    // Google Analytics 4
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'contact', {
            method: channel,
        });
    }

    // TikTok Pixel
    if (typeof window.ttq === 'object' && typeof window.ttq.track === 'function') {
        window.ttq.track('Contact', {
            content_name: channel,
        });
    }
}
