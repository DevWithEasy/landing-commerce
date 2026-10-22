import type { TestimonialBlockProps, TestimonialItem } from '@/types/builder';

export function createTestimonialItem(overrides: Partial<TestimonialItem> = {}): TestimonialItem {
    return {
        id: `testimonial_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        quote: 'The quality is outstanding and the delivery was faster than expected!',
        authorName: 'Customer Name',
        authorRole: 'Verified Customer',
        location: 'Dhaka',
        rating: 5,
        avatarUrl: '',
        verifiedPurchase: true,
        ...overrides,
    };
}

/**
 * Resolve the carousel items for a testimonial block while preserving
 * backwards compatibility with the original single-testimonial AST shape.
 */
export function resolveTestimonialItems(props: TestimonialBlockProps): TestimonialItem[] {
    if (Array.isArray(props.items) && props.items.length > 0) {
        return props.items.map((item, index) => ({
            ...item,
            id: item.id || `testimonial_${index + 1}`,
            quote: item.quote ?? '',
            authorName: item.authorName || 'Customer Name',
        }));
    }

    return [
        {
            id: 'testimonial_legacy',
            quote: props.quote ?? '',
            authorName: props.authorName || 'Customer Name',
            authorRole: props.authorRole,
            location: props.location,
            rating: props.rating,
            avatarUrl: props.avatarUrl,
            verifiedPurchase: props.verifiedPurchase,
        },
    ];
}

export function clampTestimonialRating(value: unknown): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return 5;
    }

    return Math.min(5, Math.max(1, Math.round(parsed)));
}
