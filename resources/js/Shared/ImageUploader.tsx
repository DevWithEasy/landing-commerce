import { Image as ImageIcon, Star, Trash2, UploadCloud } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { useRef, useState } from 'react';
import type { ProductImage } from '@/types';
import { SafeImage } from './SafeImage';

export interface ImageUploaderProps {
    existingImages?: ProductImage[];
    newFiles: File[];
    onFilesSelected: (files: File[]) => void;
    onRemoveNewFile: (index: number) => void;
    onDeleteExistingImage?: (image: ProductImage) => void;
    onSetPrimaryExistingImage?: (image: ProductImage) => void;
    error?: string;
}

export function ImageUploader({
    existingImages = [],
    newFiles,
    onFilesSelected,
    onRemoveNewFile,
    onDeleteExistingImage,
    onSetPrimaryExistingImage,
    error,
}: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFileValidation(e.target.files);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {/* Drag & drop upload zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                        ? 'border-primary-500 bg-primary-50/50'
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileInput}
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-white rounded-full shadow-xs border border-gray-200">
                        <UploadCloud className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-primary-600 hover:text-primary-500">
                            Click to upload
                        </span>
                        <span className="text-sm text-gray-500"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-gray-400">
                        WebP, PNG, or JPEG raster formats (max 10MB each)
                    </p>
                </div>
            </div>

            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

            {/* Existing images list (from server) */}
            {existingImages.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Existing Gallery Images ({existingImages.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {existingImages.map((img) => (
                            <div
                                key={img.id}
                                className={`group relative rounded-lg border overflow-hidden bg-white shadow-xs transition-shadow ${
                                    img.is_primary
                                        ? 'border-primary-500 ring-2 ring-primary-500/20'
                                        : 'border-gray-200'
                                }`}
                            >
                                <div className="aspect-square bg-gray-100 overflow-hidden">
                                    <SafeImage
                                        src={img.thumb_url || img.url}
                                        alt={img.alt_text || 'Product image'}
                                        className="w-full h-full object-cover object-center"
                                        fallbackIconSize="w-8 h-8"
                                        fallbackText="Missing File"
                                    />
                                </div>

                                {img.is_primary && (
                                    <span className="absolute top-2 left-2 inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-600 text-white shadow-xs">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span>Primary</span>
                                    </span>
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                    {!img.is_primary && onSetPrimaryExistingImage && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSetPrimaryExistingImage(img);
                                            }}
                                            title="Set as primary thumbnail"
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

            {/* Newly selected images queue (pending upload) */}
            {newFiles.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Pending Uploads ({newFiles.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {newFiles.map((file, idx) => {
                            const previewUrl = URL.createObjectURL(file);
                            return (
                                <div
                                    key={idx}
                                    className="relative rounded-lg border border-gray-200 overflow-hidden bg-white shadow-xs group"
                                >
                                    <div className="aspect-square bg-gray-100 overflow-hidden">
                                        <SafeImage
                                            src={previewUrl}
                                            alt={file.name}
                                            className="w-full h-full object-cover object-center"
                                            fallbackIconSize="w-8 h-8"
                                            fallbackText=""
                                        />
                                    </div>
                                    <div className="p-2 text-xs truncate text-gray-600 bg-white">
                                        {file.name}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveNewFile(idx)}
                                        title="Remove from queue"
                                        className="absolute top-2 right-2 p-1 rounded-full bg-white/90 text-rose-600 hover:bg-rose-50 shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {existingImages.length === 0 && newFiles.length === 0 && (
                <div className="flex items-center space-x-2 text-xs text-gray-400 italic">
                    <ImageIcon className="w-4 h-4" />
                    <span>No product images attached yet.</span>
                </div>
            )}
        </div>
    );
}
