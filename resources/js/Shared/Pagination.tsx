import { Link } from '@inertiajs/react';
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
                {from && to ? (
                    <span>
                        Showing <span className="font-medium text-gray-800">{from}</span> to{' '}
                        <span className="font-medium text-gray-800">{to}</span> of{' '}
                        <span className="font-medium text-gray-800">{total}</span> items
                    </span>
                ) : (
                    <span>No results found</span>
                )}
            </div>

            <nav className="inline-flex rounded-lg shadow-xs -space-x-px" aria-label="Pagination">
                {links.map((link, index) => {
                    // Sanitize label HTML (Laravel returns &laquo; and &raquo;)
                    const cleanLabel = link.label
                        .replace('&laquo; Previous', '← Prev')
                        .replace('Next &raquo;', 'Next →')
                        .replace('&laquo;', '«')
                        .replace('&raquo;', '»');

                    if (!link.url) {
                        return (
                            <span
                                key={index}
                                className="relative inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-300 bg-white border border-gray-300 cursor-not-allowed first:rounded-l-md last:rounded-r-md select-none"
                            >
                                {cleanLabel}
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={index}
                            href={link.url}
                            preserveScroll
                            preserveState
                            className={`relative inline-flex items-center px-3.5 py-1.5 text-sm font-medium border first:rounded-l-md last:rounded-r-md transition-colors ${
                                link.active
                                    ? 'z-10 bg-primary-600 border-primary-600 text-white font-semibold'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {cleanLabel}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
