import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationLink } from '@/types';

export interface PaginationProps {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
}

export function Pagination({ links, from, to, total }: PaginationProps) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="text-xs sm:text-sm text-gray-500">
                {from && to ? (
                    <span>
                        Showing <span className="font-semibold text-gray-800">{from}–{to}</span> of{' '}
                        <span className="font-semibold text-gray-800">{total}</span> products
                    </span>
                ) : (
                    <span>No results found</span>
                )}
            </div>

            <nav className="inline-flex items-center gap-1.5" aria-label="Pagination">
                {links.map((link, index) => {
                    const isPrev = link.label.includes('Previous') || link.label.includes('&laquo;');
                    const isNext = link.label.includes('Next') || link.label.includes('&raquo;');
                    const cleanLabel = link.label
                        .replace('&laquo; Previous', '')
                        .replace('Next &raquo;', '')
                        .replace('&laquo;', '')
                        .replace('&raquo;', '')
                        .trim();

                    const content = isPrev ? (
                        <ChevronLeft className="w-4 h-4" />
                    ) : isNext ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        cleanLabel
                    );

                    if (!link.url) {
                        return (
                            <span
                                key={index}
                                className="inline-flex items-center justify-center min-w-[34px] h-[34px] px-2.5 text-xs font-medium text-gray-300 bg-white border border-stone-200 rounded-lg cursor-not-allowed select-none"
                            >
                                {content}
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={index}
                            href={link.url}
                            preserveScroll
                            preserveState
                            className={`inline-flex items-center justify-center min-w-[34px] h-[34px] px-2.5 text-xs font-semibold rounded-lg border transition-colors ${
                                link.active
                                    ? 'bg-[#F96D16] border-[#F96D16] text-white shadow-xs'
                                    : 'bg-white border-stone-200 text-gray-700 hover:bg-[#FAF7F2] hover:border-stone-300'
                            }`}
                        >
                            {content}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
