import { Image as ImageIcon, Images, Star, Trash2, UploadCloud } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { useRef, useState } from 'react';
import { MediaPickerModal } from '@/Builder/components/MediaPickerModal';
import type { MediaLibraryItem, ProductImage } from '@/types';
import { SafeImage } from './SafeImage';

export interface ImageUploaderProps {
    existingImages?: ProductImage[];
    newFiles: File[];
    onFilesSelected: (files: File[]) => void;
    onRemoveNewFile: (index: number) => void;
    onDeleteExistingImage?: (image: ProductImage) => void;
    onSetPrimaryExistingImage?: (image: ProductImage) => void;
    featuredFile?: File | null;
    featuredLibraryItem?: MediaLibraryItem | null;
    onFeaturedFileChange?: (file: File | null) => void;
    onFeaturedLibrarySelect?: (item: MediaLibraryItem | null) => void;
    galleryLibraryItems?: MediaLibraryItem[];
    onGalleryLibraryAdd?: (items: MediaLibraryItem[]) => void;
    onRemoveGalleryLibraryItem?: (index: number) => void;
    error?: string;
}

export function ImageUploader({
    existingImages = [],
    newFiles,
    onFilesSelected,
    onRemoveNewFile,
    onDeleteExistingImage,
    onSetPrimaryExistingImage,
    featuredFile = null,
    featuredLibraryItem = null,
    onFeaturedFileChange,
    onFeaturedLibrarySelect,
    galleryLibraryItems = [],
    onGalleryLibraryAdd,
    onRemoveGalleryLibraryItem,
    error,
}: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isFeaturedPickerOpen, setIsFeaturedPickerOpen] = useState(false);
    const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);

    const featuredInputRef = useRef<HTMLInputElement | null>(null);
    const galleryInputRef = useRef<HTMLInputElement | null>(null);

    const existingPrimaryImage = existingImages.find((img) => img.is_primary) || null;
    const existingGalleryImages = existingImages.filter((img) => !img.is_primary);

    const featuredPreviewUrl = featuredFile
        ? URL.createObjectURL(featuredFile)
        : featuredLibraryItem
        ? featuredLibraryItem.thumb_url || featuredLibraryItem.url
        : existingPrimaryImage
        ? existingPrimaryImage.thumb_url || existingPrimaryImage.url
        : null;

    const handleFileValidation = (incomingFiles: FileList | File[]) => {
        const validList: File[] = [];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        for (let i = 0; i < incomingFiles.length; i++) {
            const file = incomingFiles[i];
            if (allowedTypes.includes(file.type)) {
                validList.push(file);
            }
        }

        if (validList.length > 0) {
            onFilesSelected(validList);
        }
    };

    const handleFeaturedFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file && onFeaturedFileChange) {
            onFeaturedFileChange(file);
            if (onFeaturedLibrarySelect) {
                onFeaturedLibrarySelect(null);
            }
        }
        e.target.value = '';
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            handleFileValidation(e.dataTransfer.files);
        }
    };

    const handleGalleryFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFileValidation(e.target.files);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* =====================================================================
                SECTION 1: SINGLE PRODUCT IMAGE (Featured / Primary Image)
               ===================================================================== */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span>Product Image (মূল প্রোডাক্টের ছবি — ১টি)</span>
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                            এই ছবিটি প্রোডাক্ট কার্ড এবং মেইন থাম্বনেইল হিসেবে সবার আগে দেখাবে।
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            ref={featuredInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFeaturedFileInput}
                        />
                        <button
                            type="button"
                            onClick={() => featuredInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload Image</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsFeaturedPickerOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-300 bg-white hover:bg-primary-50 text-primary-700 text-xs font-semibold transition cursor-pointer"
                        >
                            <Images className="w-3.5 h-3.5" />
                            <span>Select from Gallery</span>
                        </button>
                    </div>
                </div>

                {featuredPreviewUrl ? (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white border border-primary-200 shadow-2xs">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                            <SafeImage
                                src={featuredPreviewUrl}
                                alt="Product Primary Image"
                                className="w-full h-full object-cover"
                                fallbackIconSize="w-6 h-6"
                                fallbackText=""
                            />
                            <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary-600 text-white">
                                <Star className="w-2.5 h-2.5 fill-current" /> Primary
                            </span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-xs font-bold text-gray-900 truncate">
                                {featuredFile
                                    ? featuredFile.name
                                    : featuredLibraryItem
                                    ? featuredLibraryItem.name
                                    : 'Current Primary Product Image'}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                {featuredFile
                                    ? 'New file selected (will be saved as Primary Image)'
                                    : featuredLibraryItem
                                    ? 'Picked from Media Library (will be saved as Primary Image)'
                                    : 'Saved as main product thumbnail'}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                                {(featuredFile || featuredLibraryItem) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onFeaturedFileChange?.(null);
                                            onFeaturedLibrarySelect?.(null);
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Clear Selection</span>
                                    </button>
                                )}
                                {!featuredFile &&
                                    !featuredLibraryItem &&
                                    existingPrimaryImage &&
                                    onDeleteExistingImage && (
                                        <button
                                            type="button"
                                            onClick={() => onDeleteExistingImage(existingPrimaryImage)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Remove Primary Image</span>
                                        </button>
                                    )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => featuredInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-xl p-5 text-center bg-white cursor-pointer transition"
                    >
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                            <p className="text-xs font-semibold text-gray-700">
                                কোনো মূল প্রোডাক্ট ছবি সিলেক্ট করা হয়নি — আপলোড করুন অথবা গ্যালারি থেকে সিলেক্ট করুন
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* =====================================================================
                SECTION 2: PRODUCT GALLERY IMAGES (Multiple Images)
               ===================================================================== */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <Images className="w-4 h-4 text-primary-600" />
                            <span>Product Gallery Images (একাধিক গ্যালারি ছবি)</span>
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                            প্রোডাক্ট ডিটেইলস পেজে দেখানোর জন্য একসাথে একাধিক ছবি আপলোড বা গ্যালারি থেকে সিলেক্ট করতে পারবেন।
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            ref={galleryInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleGalleryFileInput}
                        />
                        <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload Multiple</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsGalleryPickerOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-300 bg-white hover:bg-primary-50 text-primary-700 text-xs font-semibold transition cursor-pointer"
                        >
                            <Images className="w-3.5 h-3.5" />
                            <span>Select from Gallery</span>
                        </button>
                    </div>
                </div>

                {/* Drag & drop upload zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => galleryInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                        isDragging
                            ? 'border-primary-500 bg-primary-50/50'
                            : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                >
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                        <div className="p-2.5 bg-gray-50 rounded-full border border-gray-200">
                            <UploadCloud className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-primary-600 hover:text-primary-500">
                                Click to upload multiple gallery images
                            </span>
                            <span className="text-xs text-gray-500"> or drag and drop</span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                            WebP, PNG, or JPEG raster formats (max 10MB each)
                        </p>
                    </div>
                </div>

                {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

                {/* Existing gallery images (from server) */}
                {existingGalleryImages.length > 0 && (
                    <div>
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Saved Gallery Images ({existingGalleryImages.length})
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {existingGalleryImages.map((img) => (
                                <div
                                    key={img.id}
                                    className="group relative rounded-lg border border-gray-200 overflow-hidden bg-white shadow-xs transition-shadow"
                                >
                                    <div className="aspect-square bg-gray-100 overflow-hidden">
                                        <SafeImage
                                            src={img.thumb_url || img.url}
                                            alt={img.alt_text || 'Product gallery image'}
                                            className="w-full h-full object-cover object-center"
                                            fallbackIconSize="w-6 h-6"
                                            fallbackText="Missing File"
                                        />
                                    </div>

                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                        {onSetPrimaryExistingImage && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSetPrimaryExistingImage(img);
                                                }}
                                                title="Make Primary Product Image"
                                                className="p-1.5 rounded bg-white text-gray-700 hover:bg-gray-100 shadow-xs"
                                            >
                                                <Star className="w-4 h-4 text-amber-500" />
                                            </button>
                                        )}

                                        {onDeleteExistingImage && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteExistingImage(img);
                                                }}
                                                title="Delete image"
                                                className="p-1.5 rounded bg-white text-rose-600 hover:bg-rose-50 shadow-xs"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pending Gallery Uploads & Media Library Selections */}
                {(newFiles.length > 0 || galleryLibraryItems.length > 0) && (
                    <div>
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Selected Gallery Images to Save ({newFiles.length + galleryLibraryItems.length})
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {newFiles.map((file, idx) => {
                                const previewUrl = URL.createObjectURL(file);
                                return (
                                    <div
                                        key={`file-${idx}`}
                                        className="relative rounded-lg border border-gray-200 overflow-hidden bg-white shadow-xs group"
                                    >
                                        <div className="aspect-square bg-gray-100 overflow-hidden">
                                            <SafeImage
                                                src={previewUrl}
                                                alt={file.name}
                                                className="w-full h-full object-cover object-center"
                                                fallbackIconSize="w-6 h-6"
                                                fallbackText=""
                                            />
                                        </div>
                                        <div className="p-1.5 text-[11px] truncate text-gray-600 bg-white">
                                            {file.name}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveNewFile(idx)}
                                            title="Remove"
                                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 text-rose-600 hover:bg-rose-50 shadow-sm"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}

                            {galleryLibraryItems.map((item, idx) => (
                                <div
                                    key={`lib-${item.key}-${idx}`}
                                    className="relative rounded-lg border border-primary-200 overflow-hidden bg-white shadow-xs group"
                                >
                                    <div className="aspect-square bg-gray-100 overflow-hidden">
                                        <SafeImage
                                            src={item.thumb_url || item.url}
                                            alt={item.name}
                                            className="w-full h-full object-cover object-center"
                                            fallbackIconSize="w-6 h-6"
                                            fallbackText=""
                                        />
                                    </div>
                                    <div className="p-1.5 text-[11px] truncate text-primary-700 font-medium bg-primary-50/40">
                                        {item.name}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveGalleryLibraryItem?.(idx)}
                                        title="Remove"
                                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 text-rose-600 hover:bg-rose-50 shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Media Library Modal for Single Featured Image */}
            <MediaPickerModal
                open={isFeaturedPickerOpen}
                onClose={() => setIsFeaturedPickerOpen(false)}
                onSelect={(item) => {
                    onFeaturedLibrarySelect?.(item);
                    onFeaturedFileChange?.(null);
                }}
                multiple={false}
                title="Select Product Primary Image"
            />

            {/* Media Library Modal for Multiple Gallery Images */}
            <MediaPickerModal
                open={isGalleryPickerOpen}
                onClose={() => setIsGalleryPickerOpen(false)}
                onSelect={(item) => onGalleryLibraryAdd?.([item])}
                onSelectMany={(items) => onGalleryLibraryAdd?.(items)}
                multiple={true}
                title="Select Product Gallery Images"
            />
        </div>
    );
}
