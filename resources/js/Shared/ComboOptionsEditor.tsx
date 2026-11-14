import { ImagePlus, Images, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { MediaPickerModal } from '@/Builder/components/MediaPickerModal';
import { Button } from '@/Shared/Button';
import type { MediaLibraryItem } from '@/types';

export interface ComboColorRow {
    name: string;
    image_url: string | null;
    image_file?: File | null;
}

interface ComboOptionsEditorProps {
    comboPackSize: number;
    colors: ComboColorRow[];
    onChangeColors: (colors: ComboColorRow[]) => void;
    sizes: string[];
    onChangeSizes: (sizes: string[]) => void;
    stockQuantity: number;
    onChangeStockQuantity: (qty: number) => void;
    manageStock: boolean;
    onChangeManageStock: (manage: boolean) => void;
}

const PRESET_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '28', '30', '32', '34', '36'];

export function ComboOptionsEditor({
    comboPackSize,
    colors,
    onChangeColors,
    sizes,
    onChangeSizes,
    stockQuantity,
    onChangeStockQuantity,
    manageStock,
    onChangeManageStock,
}: ComboOptionsEditorProps) {
    const [customSizeInput, setCustomSizeInput] = useState('');
    const [mediaPickerColorIndex, setMediaPickerColorIndex] = useState<number | null>(null);

    const handleAddColorRow = () => {
        onChangeColors([
            ...colors,
            {
                name: '',
                image_url: null,
                image_file: null,
            },
        ]);
    };

    const handleColorNameChange = (index: number, name: string) => {
        const next = [...colors];
        next[index] = { ...next[index], name };
        onChangeColors(next);
    };

    const handleColorImageChange = (index: number, file: File | null) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        const next = [...colors];
        next[index] = {
            ...next[index],
            image_file: file,
            image_url: previewUrl,
        };
        onChangeColors(next);
    };

    const handleSelectColorFromLibrary = (item: MediaLibraryItem) => {
        if (mediaPickerColorIndex === null) return;
        const next = [...colors];
        next[mediaPickerColorIndex] = {
            ...next[mediaPickerColorIndex],
            image_file: null,
            image_url: item.url,
        };
        onChangeColors(next);
        setMediaPickerColorIndex(null);
    };

    const handleRemoveColorImage = (index: number) => {
        const next = [...colors];
        next[index] = {
            ...next[index],
            image_file: null,
            image_url: null,
        };
        onChangeColors(next);
    };

    const handleRemoveColorRow = (index: number) => {
        onChangeColors(colors.filter((_, idx) => idx !== index));
    };

    const handleToggleSize = (size: string) => {
        if (sizes.includes(size)) {
            onChangeSizes(sizes.filter((s) => s !== size));
        } else {
            onChangeSizes([...sizes, size]);
        }
    };

    const handleAddCustomSize = () => {
        const trimmed = customSizeInput.trim();
        if (!trimmed) return;
        if (!sizes.includes(trimmed)) {
            onChangeSizes([...sizes, trimmed]);
        }
        setCustomSizeInput('');
    };

    return (
        <div className="space-y-6 pt-2">
            {/* Info Banner */}
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 text-xs text-emerald-900">
                <span className="font-bold">Combo Pack Mode ({comboPackSize} Pcs Combo) চালু আছে:</span> এখানে আলাদা করে ভেরিয়েন্ট জেনারেট করতে হবে না। শুধু আপনার কাছে যে কয়টি কালার (নাম ও ছবি) এবং সাইজ আছে সেগুলো নিচে যোগ করুন। কাস্টমার প্রোডাক্ট ডিটেইলস পেজে <span className="font-bold">[ + ]</span> বক্সে ক্লিক করলে একটি পপআপ মডালে এই কালার ও ছবিগুলো দেখতে পাবে এবং সিলেক্ট করে অ্যাড করে নেবে।
            </div>

            {/* 1. Combo Colors (Name + Image) */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">
                            ১. কম্বো কালার এবং ছবি যুক্ত করুন (Combo Colors & Photos)
                        </h4>
                        <p className="text-xs text-gray-500">
                            যেমন ৫টি কালারের শার্ট/টি-শার্ট থাকলে ৫টি কালারের নাম ও ছবি দিন।
                        </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddColorRow}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add Color Option
                    </Button>
                </div>

                {colors.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center space-y-2 bg-gray-50/50">
                        <p className="text-xs text-gray-500">
                            এখনো কোনো কালার যোগ করা হয়নি। নিচের বাটনে ক্লিক করে কালার ও ছবি যোগ করুন।
                        </p>
                        <Button type="button" variant="primary" size="sm" onClick={handleAddColorRow}>
                            <Plus className="w-4 h-4 mr-1.5" />
                            প্রথম কালার যোগ করুন
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {colors.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white shadow-2xs"
                            >
                                {/* Color Image Upload Box */}
                                <div className="relative w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center group">
                                    {item.image_url ? (
                                        <>
                                            <img
                                                src={item.image_url}
                                                alt={item.name || `Color ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveColorImage(idx)}
                                                title="Remove photo"
                                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </>
                                    ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition text-gray-400 hover:text-primary-600">
                                            <ImagePlus className="w-5 h-5" />
                                            <span className="text-[9px] font-semibold mt-0.5">Photo</span>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) =>
                                                    handleColorImageChange(idx, e.target.files?.[0] || null)
                                                }
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* Color Name Input & Upload/Gallery Buttons */}
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <label className="block text-[11px] font-semibold text-gray-500">
                                        Color #{idx + 1} Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Black, Navy, Maroon..."
                                        value={item.name}
                                        onChange={(e) => handleColorNameChange(idx, e.target.value)}
                                        className="w-full text-sm rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                    />
                                    <div className="flex items-center gap-2 pt-0.5">
                                        <label className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[10px] font-semibold text-gray-700 cursor-pointer transition">
                                            <ImagePlus className="w-3 h-3 text-primary-600" />
                                            <span>Upload</span>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) =>
                                                    handleColorImageChange(idx, e.target.files?.[0] || null)
                                                }
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setMediaPickerColorIndex(idx)}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-primary-200 bg-primary-50/60 hover:bg-primary-100/70 text-[10px] font-semibold text-primary-700 transition"
                                        >
                                            <Images className="w-3 h-3" />
                                            <span>From Gallery</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Delete Color Row */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveColorRow(idx)}
                                    title="Remove color"
                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Combo Common Sizes */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
                <div>
                    <h4 className="text-sm font-bold text-gray-900">
                        ২. কমন সাইজগুলো সিলেক্ট করুন (Available Common Sizes)
                    </h4>
                    <p className="text-xs text-gray-500">
                        প্রোডাক্ট ডিটেইলস পেজে [ + ] বক্সগুলোর নিচে এই সাইজগুলো দেখাবে।
                    </p>
                </div>

                {/* Preset Size Chips */}
                <div className="flex flex-wrap gap-2">
                    {PRESET_SIZES.map((sz) => {
                        const isSelected = sizes.includes(sz);
                        return (
                            <button
                                key={sz}
                                type="button"
                                onClick={() => handleToggleSize(sz)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                    isSelected
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400'
                                }`}
                            >
                                {sz}
                            </button>
                        );
                    })}
                </div>

                {/* Custom Size Input & Selected Tags */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Custom size (e.g. 38, 40, Free Size)"
                            value={customSizeInput}
                            onChange={(e) => setCustomSizeInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomSize();
                                }
                            }}
                            className="text-xs rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 w-52"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={handleAddCustomSize}>
                            Add Size
                        </Button>
                    </div>

                    {sizes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pl-2">
                            <span className="text-xs text-gray-500 font-medium">Selected:</span>
                            {sizes.map((sz) => (
                                <span
                                    key={sz}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-800 border border-primary-200"
                                >
                                    {sz}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleSize(sz)}
                                        className="text-primary-600 hover:text-rose-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Combo Pack Stock Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Available Combo Stock Quantity
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={stockQuantity}
                        disabled={!manageStock}
                        onChange={(e) => onChangeStockQuantity(parseInt(e.target.value, 10) || 0)}
                        className="w-full text-sm rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                </div>

                <div className="flex items-center pt-5">
                    <label className="inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={manageStock}
                            onChange={(e) => onChangeManageStock(e.target.checked)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 font-medium">
                            Track Inventory Stock for this Combo
                        </span>
                    </label>
                </div>
            </div>

            <MediaPickerModal
                open={mediaPickerColorIndex !== null}
                onClose={() => setMediaPickerColorIndex(null)}
                onSelect={handleSelectColorFromLibrary}
                multiple={false}
                title={
                    mediaPickerColorIndex !== null
                        ? `Select Photo for Color #${mediaPickerColorIndex + 1}`
                        : 'Select Color Photo'
                }
            />
        </div>
    );
}
