import { Head } from '@inertiajs/react';
import type { StorefrontTheme } from '@/types/storefront';

export interface SeoHeadProps {
    title: string;
    description?: string | null;
    canonicalUrl?: string | null;
    ogType?: 'website' | 'product' | 'article';
    ogImage?: string | null;
    keywords?: string | null;
    jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
    theme?: StorefrontTheme | null;
    noIndex?: boolean;
    productPrice?: number | string | null;
}

export function SeoHead({
    title,
    description,
    canonicalUrl,
    ogType = 'website',
    ogImage,
    keywords,
    jsonLd,
    theme,
    noIndex = false,
    productPrice,
}: SeoHeadProps) {
    const storeName = theme?.store_name || 'Landing Commerce';
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const fullCanonical = canonicalUrl
        ? (canonicalUrl.startsWith('http') ? canonicalUrl : `${siteUrl}${canonicalUrl}`)
        : (typeof window !== 'undefined' ? window.location.href.split('?')[0] : '');

    const safeDescription = description
        ? description.trim().slice(0, 250)
        : 'সেরা পণ্য ও দ্রুততম ক্যাশ অন ডেলিভারি সুবিধা উপভোগ করুন।';

    const fullTitle = title.includes(storeName) ? title : `${title} - ${storeName}`;

    const defaultImage = theme?.logo_url || (siteUrl ? `${siteUrl}/images/og-default.png` : '');
    const finalOgImage = ogImage || defaultImage;

    // Securely serialize JSON-LD preventing XSS injection (replace < and > with Unicode escapes)
    const serializedJsonLd = jsonLd
        ? JSON.stringify(jsonLd)
              .replace(/</g, '\\u003c')
              .replace(/>/g, '\\u003e')
        : null;

    return (
        <Head>
            {/* Title & Standard Meta */}
            <title>{fullTitle}</title>
            <meta name="description" content={safeDescription} />
            {keywords && <meta name="keywords" content={keywords} />}

            {/* Robots Indexing Directive */}
            {noIndex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            )}

            {/* Canonical Link */}
            {fullCanonical && !noIndex && <link rel="canonical" href={fullCanonical} />}

            {/* Open Graph / Facebook */}
            <meta property="og:site_name" content={storeName} />
            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={safeDescription} />
            {fullCanonical && <meta property="og:url" content={fullCanonical} />}
            {finalOgImage && <meta property="og:image" content={finalOgImage} />}

            {/* Product Specific Open Graph */}
            {ogType === 'product' && productPrice !== null && productPrice !== undefined && (
                <>
                    <meta property="product:price:amount" content={String(productPrice)} />
                    <meta property="product:price:currency" content="BDT" />
                </>
            )}

            {/* Twitter Cards */}
            <meta name="twitter:card" content={finalOgImage ? 'summary_large_image' : 'summary'} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={safeDescription} />
            {finalOgImage && <meta name="twitter:image" content={finalOgImage} />}

            {/* Structured Data (JSON-LD) */}
            {serializedJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: serializedJsonLd }}
                />
            )}
        </Head>
    );
}
