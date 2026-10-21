import { Head, router, usePage } from '@inertiajs/react';
import {
    Check,
    Copy,
    ImagePlus,
    Images,
    Loader2,
    Package,
    Trash2,
    UploadCloud,
} from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import { Pagination } from '@/Shared/Pagination';
import { SafeImage } from '@/Shared/SafeImage';
import type { MediaIndexProps, MediaLibraryItem } from '@/types';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 20;

function formatDate(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function MediaIndex({ media, stats }: MediaIndexProps) {
    const { errors } = usePage<MediaIndexProps>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selected, setSelected] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const pageKeys = useMemo(() => media.data.map((item) => item.key), [media.data]);
    const allSelected = pageKeys.length > 0 && pageKeys.every((key) => selected.includes(key));
    const uploadErrorMessage = uploadError ?? errors.images ?? errors['images.0'] ?? null;

    useEffect(() => {
        setSelected([]);
    }, [media.current_page]);

    const toggleSelected = (key: string) => {
        setSelected((current) =>
            current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
        );
    };

    const toggleAllOnPage = () => {
        setSelected((current) => {
            if (allSelected) {
                return current.filter((key) => !pageKeys.includes(key));
            }

            return Array.from(new Set([...current, ...pageKeys]));
        });
    };

    const uploadFiles = (files: FileList | File[]) => {
        setUploadError(null);

        const fileArray = Array.from(files);

        if (fileArray.length === 0) {
            return;
        }

        if (fileArray.length > MAX_FILES_PER_UPLOAD) {
            setUploadError(`You can upload up to ${MAX_FILES_PER_UPLOAD} images at a time.`);
            return;
        }

        const invalidType = fileArray.find((file) => !ACCEPTED_TYPES.includes(file.type));

        if (invalidType) {
            setUploadError('Only JPEG, PNG, and WebP images are allowed.');
            return;
        }

        const oversized = fileArray.find((file) => file.size > MAX_FILE_SIZE);

        if (oversized) {
            setUploadError(`"${oversized.name}" is larger than 10 MB.`);
            return;
        }

        const formData = new FormData();
        fileArray.forEach((file) => formData.append('images[]', file));

        setIsUploading(true);
        router.post('/admin/media', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSelected([]);
                setUploadError(null);
            },
            onError: (serverErrors) => {
                const firstError = Object.values(serverErrors)[0];
                setUploadError(
                    typeof firstError === 'string'
                        ? firstError
                        : 'The upload failed. Please check the selected images and try again.'
                );
            },
            onFinish: () => {
                setIsUploading(false);

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            uploadFiles(event.target.files);
        }

        event.target.value = '';
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);

        if (!isUploading) {
            uploadFiles(event.dataTransfer.files);
        }
    };

    const copyLink = async (item: MediaLibraryItem) => {
        try {
            await navigator.clipboard.writeText(item.url);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = item.url;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }

        setCopiedKey(item.key);
        window.setTimeout(() => {
            setCopiedKey((current) => (current === item.key ? null : current));
        }, 2000);
    };

    const deleteSelected = () => {
        if (selected.length === 0) {
            return;
        }

        setIsDeleting(true);
        router.delete('/admin/media', {
            data: { items: selected },
            preserveScroll: true,
            onSuccess: () => {
                setSelected([]);
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <>
            <Head title="Media Library" />

            <AdminLayout
                title="Media Library"
                subtitle="Upload, reuse, and manage images for products, landing pages, and campaigns."
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                    <Images className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        All Media
                                    </p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <Package className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Product Images
                                    </p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {stats.product}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                    <UploadCloud className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Library Uploads
                                    </p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {stats.library}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        onDragOver={(event) => {
                            event.preventDefault();
                            if (!isUploading) {
                                setIsDragging(true);
                            }
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`rounded-2xl border-2 border-dashed bg-white p-6 text-center shadow-sm transition-colors ${
                            isDragging
                                ? 'border-primary-400 bg-primary-50/60'
                                : 'border-gray-300 hover:border-primary-300'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <div className="mx-auto flex max-w-lg flex-col items-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                                {isUploading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <ImagePlus className="h-6 w-6" />
                                )}
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                                {isUploading
                                    ? 'Uploading your images…'
                                    : 'Drag and drop images here'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                JPEG, PNG, or WebP. Up to 10 MB each, 20 images per upload.
                            </p>
                            <Button
                                type="button"
                                variant="primary"
                                className="mt-4 inline-flex items-center gap-2"
                                isLoading={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <UploadCloud className="h-4 w-4" />
                                Choose Images
                            </Button>
                        </div>

                        {uploadErrorMessage && (
                            <p className="mx-auto mt-4 max-w-xl rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                {uploadErrorMessage}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleAllOnPage}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            Select all on this page
                        </label>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                                {selected.length > 0
                                    ? `${selected.length} selected`
                                    : 'Select images to delete'}
                            </span>
                            {selected.length > 0 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setSelected([])}
                                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
                                    >
                                        Clear
                                    </button>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        className="inline-flex items-center gap-1.5"
                                        onClick={() => setIsDeleteOpen(true)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete Selected
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {media.data.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
                            <Images className="mx-auto h-10 w-10 text-gray-300" />
                            <h3 className="mt-3 text-base font-semibold text-gray-900">
                                No media yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Upload your first image using the area above. Product images will
                                appear here automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {media.data.map((item) => {
                                const isSelected = selected.includes(item.key);

                                return (
                                    <div
                                        key={item.key}
                                        className={`group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                                            isSelected
                                                ? 'border-primary-500 ring-2 ring-primary-500/30'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="relative aspect-square bg-gray-100">
                                            <SafeImage
                                                src={item.thumb_url}
                                                alt={item.alt_text || item.name}
                                                className="h-full w-full object-cover"
                                                fallbackIcon={<ImagePlus className="h-8 w-8" />}
                                                fallbackText="Image unavailable"
                                            />
                                            <label className="absolute left-2 top-2 z-10 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/80 bg-white/90 shadow-sm backdrop-blur">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelected(item.key)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    aria-label={`Select ${item.name}`}
                                                />
                                            </label>
                                            {item.is_primary && (
                                                <span className="absolute right-2 top-2 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                                                    Primary
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-3">
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                                        item.source === 'product'
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'bg-emerald-50 text-emerald-700'
                                                    }`}
                                                >
                                                    {item.source === 'product'
                                                        ? 'Product'
                                                        : 'Library'}
                                                </span>
                                                {item.created_at && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {formatDate(item.created_at)}
                                                    </span>
                                                )}
                                            </div>

                                            <p
                                                className="mt-2 truncate text-xs font-semibold text-gray-900"
                                                title={item.name}
                                            >
                                                {item.name}
                                            </p>
                                            <p
                                                className="mt-0.5 truncate text-[11px] text-gray-500"
                                                title={item.source_label}
                                            >
                                                {item.source_label}
                                            </p>
                                            <p
                                                className="mt-0.5 truncate text-[10px] text-gray-400"
                                                title={item.url}
                                            >
                                                {item.url}
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() => copyLink(item)}
                                                className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                                                    copiedKey === item.key
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                                title={`Copy ${item.url}`}
                                            >
                                                {copiedKey === item.key ? (
                                                    <>
                                                        <Check className="h-3.5 w-3.5" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3.5 w-3.5" />
                                                        Copy Link
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <Pagination
                        links={media.links}
                        from={media.from}
                        to={media.to}
                        total={media.total}
                    />
                </div>
            </AdminLayout>

            {isDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50"
                        onClick={() => {
                            if (!isDeleting) {
                                setIsDeleteOpen(false);
                            }
                        }}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Delete {selected.length}{' '}
                                    {selected.length === 1 ? 'image' : 'images'}?
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    This permanently removes the selected files. Product images
                                    will also be removed from their product galleries, and any
                                    landing page using these links will no longer display them.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsDeleteOpen(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="danger"
                                isLoading={isDeleting}
                                onClick={deleteSelected}
                            >
                                Delete Permanently
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
