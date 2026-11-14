import {
    Check,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Images,
    Loader2,
    Search,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeImage } from '@/Shared/SafeImage';
import type { MediaLibraryItem } from '@/types';

interface MediaPickerResponse {
    data: MediaLibraryItem[];
    current_page: number;
    last_page: number;
    total: number;
}

export interface MediaPickerModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (item: MediaLibraryItem) => void;
    onSelectMany?: (items: MediaLibraryItem[]) => void;
    multiple?: boolean;
    title?: string;
}

export function MediaPickerModal({
    open,
    onClose,
    onSelect,
    onSelectMany,
    multiple = false,
    title = 'Select from Media Library',
}: MediaPickerModalProps) {
    const [items, setItems] = useState<MediaLibraryItem[]>([]);
    const [selected, setSelected] = useState<Map<string, MediaLibraryItem>>(new Map());
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!open) {
            return;
        }

        setSelected(new Map());
        setPage(1);
        setSearch('');
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const controller = new AbortController();
        let active = true;

        const timer = window.setTimeout(
            () => {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams({
                    page: String(page),
                    per_page: '24',
                });

                if (search.trim() !== '') {
                    params.set('search', search.trim());
                }

                fetch(`/admin/media/picker?${params.toString()}`, {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                })
                    .then(async (response) => {
                        if (!response.ok) {
                            throw new Error(
                                response.status === 403
                                    ? 'You do not have permission to manage media.'
                                    : 'Failed to load the media library.'
                            );
                        }

                        return (await response.json()) as MediaPickerResponse;
                    })
                    .then((data) => {
                        if (!active) {
                            return;
                        }

                        setItems(Array.isArray(data.data) ? data.data : []);
                        setLastPage(Math.max(1, Number(data.last_page) || 1));
                        setTotal(Math.max(0, Number(data.total) || 0));
                    })
                    .catch((requestError: unknown) => {
                        if (
                            !active ||
                            (requestError instanceof DOMException &&
                                requestError.name === 'AbortError')
                        ) {
                            return;
                        }

                        setError(
                            requestError instanceof Error
                                ? requestError.message
                                : 'Failed to load the media library.'
                        );
                    })
                    .finally(() => {
                        if (active) {
                            setLoading(false);
                        }
                    });
            },
            search.trim() === '' ? 0 : 300
        );

        return () => {
            active = false;
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [open, page, search, refreshKey]);

    const toggleItem = useCallback(
        (item: MediaLibraryItem) => {
            setSelected((current) => {
                if (!multiple) {
                    return new Map([[item.key, item]]);
                }

                const next = new Map(current);

                if (next.has(item.key)) {
                    next.delete(item.key);
                } else {
                    next.set(item.key, item);
                }

                return next;
            });
        },
        [multiple]
    );

    const handleConfirm = () => {
        const chosen = Array.from(selected.values());

        if (onSelectMany) {
            onSelectMany(chosen);
        } else {
            chosen.forEach((item) => onSelect(item));
        }

        onClose();
    };

    const selectedCount = selected.size;
    const canConfirm = selectedCount > 0;
    const selectionLabel = useMemo(() => {
        if (selectedCount === 0) {
            return multiple ? 'Select one or more images' : 'Select an image';
        }

        return multiple
            ? `${selectedCount} image${selectedCount === 1 ? '' : 's'} selected`
            : '1 image selected';
    }, [multiple, selectedCount]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                            <Images className="h-4 w-4" />
                        </span>
                        <div>
                            <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
                            <p className="text-[11px] text-slate-500">
                                {total} image{total === 1 ? '' : 's'} in your library
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by file name, alt text or product..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                        />
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                    {loading && items.length === 0 ? (
                        <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-xs font-semibold">Loading media library...</span>
                        </div>
                    ) : error ? (
                        <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 px-6 text-center">
                            <ImageIcon className="h-8 w-8 text-slate-300" />
                            <p className="text-xs font-semibold text-rose-600">{error}</p>
                            <button
                                type="button"
                                onClick={() => setRefreshKey((current) => current + 1)}
                                className="mt-1 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                            >
                                Try again
                            </button>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 px-6 text-center">
                            <Images className="h-8 w-8 text-slate-300" />
                            <p className="text-xs font-bold text-slate-600">No images found</p>
                            <p className="text-[11px] text-slate-400">
                                Upload images from the Media Library page, then try again.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {items.map((item) => {
                                const isSelected = selected.has(item.key);

                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => toggleItem(item)}
                                        onDoubleClick={() => {
                                            if (!multiple) {
                                                onSelect(item);
                                                onClose();
                                            }
                                        }}
                                        className={`group relative overflow-hidden rounded-xl border-2 bg-slate-50 text-left transition ${
                                            isSelected
                                                ? 'border-primary-600 ring-2 ring-primary-100'
                                                : 'border-transparent hover:border-primary-300'
                                        }`}
                                        title={item.alt_text || item.name}
                                    >
                                        <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                                            <SafeImage
                                                src={item.thumb_url || item.url}
                                                alt={item.alt_text || item.name}
                                                className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                                                fallbackText=""
                                                fallbackIconSize="h-6 w-6"
                                            />
                                            {isSelected && (
                                                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white shadow">
                                                    <Check className="h-3 w-3" />
                                                </span>
                                            )}
                                            <span
                                                className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold shadow-xs ${
                                                    item.is_primary || item.media_type === 'product'
                                                        ? 'bg-blue-600 text-white'
                                                        : item.source === 'combo' || item.media_type === 'combo'
                                                        ? 'bg-amber-400 text-amber-950'
                                                        : item.media_type === 'gallery'
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-emerald-600 text-white'
                                                }`}
                                            >
                                                {item.is_primary || item.media_type === 'product'
                                                    ? 'Primary'
                                                    : item.source === 'combo' || item.media_type === 'combo'
                                                    ? 'Combo'
                                                    : item.media_type === 'gallery'
                                                    ? 'Gallery'
                                                    : 'Library'}
                                            </span>
                                        </div>
                                        <div className="space-y-0.5 p-2">
                                            <p className="truncate text-[10px] font-bold text-slate-700">
                                                {item.name}
                                            </p>
                                            <p className="truncate text-[9px] text-slate-400">
                                                {item.source_label}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex items-center justify-between gap-2 sm:justify-start">
                        <span className="text-[11px] font-semibold text-slate-500">
                            {selectionLabel}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                disabled={page <= 1 || loading}
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Previous page"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[52px] text-center text-[10px] font-bold text-slate-500">
                                {page} / {lastPage}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((current) => Math.min(lastPage, current + 1))
                                }
                                disabled={page >= lastPage || loading}
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Next page"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!canConfirm || loading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Check className="h-3.5 w-3.5" />
                            {multiple ? 'Add Selected' : 'Use Image'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export interface MediaFieldProps {
    label: string;
    value?: string;
    onChange: (url: string) => void;
    placeholder?: string;
    compact?: boolean;
    hint?: string;
}

export function MediaField({
    label,
    value = '',
    onChange,
    placeholder = 'https://example.com/image.jpg',
    compact = false,
    hint,
}: MediaFieldProps) {
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <label className="block text-[11px] font-semibold text-slate-700">{label}</label>
                <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary-700 transition hover:bg-primary-100"
                >
                    <Images className="h-3 w-3" />
                    Media Library
                </button>
            </div>

            <div
                className={`flex items-stretch gap-1.5 ${compact ? 'min-h-[42px]' : 'min-h-[56px]'}`}
            >
                <div
                    className={`relative shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${
                        compact ? 'h-10 w-10' : 'h-14 w-14'
                    }`}
                >
                    {value ? (
                        <SafeImage
                            src={value}
                            alt={label}
                            className="h-full w-full object-cover"
                            fallbackText=""
                            fallbackIconSize="h-4 w-4"
                        />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-slate-300">
                            <ImageIcon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
                        </span>
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <input
                        type="text"
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        placeholder={placeholder}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-100"
                    />
                    <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[9px] text-slate-400">
                            {hint || 'Paste a URL or choose an uploaded image.'}
                        </span>
                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="shrink-0 text-[9px] font-semibold text-rose-500 hover:text-rose-700"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <MediaPickerModal
                open={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={(item) => onChange(item.url)}
                title={`${label} - Media Library`}
            />
        </div>
    );
}

export interface MediaLibraryAddButtonProps {
    label?: string;
    onSelect: (items: MediaLibraryItem[]) => void;
}

export function MediaLibraryAddButton({
    label = 'Add from Library',
    onSelect,
}: MediaLibraryAddButtonProps) {
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 transition hover:text-primary-700"
            >
                <Images className="h-3.5 w-3.5" />
                <span>{label}</span>
            </button>
            <MediaPickerModal
                open={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={() => undefined}
                onSelectMany={onSelect}
                multiple
                title="Add Images from Media Library"
            />
        </>
    );
}
