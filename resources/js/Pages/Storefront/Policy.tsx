import { Link } from '@inertiajs/react';
import { ChevronRight, FileText, Home } from 'lucide-react';
import { StorefrontLayout } from '@/Layouts/StorefrontLayout';
import { SeoHead } from '@/Shared/SeoHead';
import type { StorefrontPolicyProps } from '@/types/storefront';

export default function Policy({
    page,
    content,
    categories,
    theme,
}: StorefrontPolicyProps) {
    const plainText = content
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const description = plainText.slice(0, 160);
    const canonicalUrl = `/pages/${page.slug}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: page.title,
        url: canonicalUrl,
        description,
    };

    return (
        <StorefrontLayout theme={theme} categories={categories}>
            <SeoHead
                title={page.title}
                description={description}
                canonicalUrl={canonicalUrl}
                ogType="article"
                theme={theme}
                jsonLd={jsonLd}
            />

            <div className="bg-gray-50">
                <div className="border-b border-gray-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <nav className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1 transition hover:text-indigo-600"
                            >
                                <Home className="h-3.5 w-3.5" />
                                হোম
                            </Link>
                            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-semibold text-gray-900">{page.title}</span>
                        </nav>

                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-2xl">
                                    {page.title}
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                    <div className="mx-auto max-w-4xl">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
                            {content.trim() !== '' ? (
                                <article
                                    className="prose prose-indigo max-w-none leading-relaxed text-gray-700"
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />
                            ) : (
                                <p className="text-sm text-gray-500">
                                    এই পেজের কন্টেন্ট এখনো যোগ করা হয়নি।
                                </p>
                            )}
                        </div>

                        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm text-indigo-900">
                            <span className="font-semibold">কোনো প্রশ্ন আছে?</span>{' '}
                            <Link href="/pages/contact" className="font-semibold underline underline-offset-2">
                                আমাদের সাথে যোগাযোগ করুন
                            </Link>
                            ।
                        </div>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
