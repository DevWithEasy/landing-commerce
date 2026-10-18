import { Check, Layout, Palette, Sparkles, Type } from 'lucide-react';
import { useBuilderStore } from '../stores/useBuilderStore';

export interface PageSettingsInspectorProps {
    width?: number;
    onBackToBlock?: () => void;
    hasSelectedBlock?: boolean;
}

const FONT_OPTIONS = [
    {
        name: 'Hind Siliguri',
        labelBengali: 'হিন্দ শিলিগুড়ি',
        value: "'Hind Siliguri', sans-serif",
        category: 'গুগল ফন্ট • আধুনিক বাংলা ও ইংরেজি',
        preview: 'সবচেয়ে দ্রুত ও সহজে অর্ডার করুন',
    },
    {
        name: 'Tiro Bangla',
        labelBengali: 'তিরো বাংলা',
        value: "'Tiro Bangla', serif",
        category: 'গুগল ফন্ট • ক্লাসিক সেরিফ বাংলা',
        preview: 'সবচেয়ে দ্রুত ও সহজে অর্ডার করুন',
    },
    {
        name: 'Inter',
        labelBengali: 'ইন্টার (Inter)',
        value: "'Inter', sans-serif",
        category: 'মডার্ন ও ক্লিন ইংরেজি ফন্ট',
        preview: 'Fast & Secure Cash On Delivery',
    },
    {
        name: 'System Default',
        labelBengali: 'সিস্টেম ডিফল্ট',
        value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        category: 'ডিভাইসের নিজস্ব ফন্ট',
        preview: 'দ্রুত ডেলিভারি ও প্রিমিয়াম কোয়ালিটি',
    },
];

const BG_COLOR_PRESETS = [
    { label: 'সাদা', color: '#ffffff', border: true },
    { label: 'হালকা স্লেট', color: '#f8fafc', border: true },
    { label: 'লাইট গ্রে', color: '#f3f4f6', border: true },
    { label: 'ওয়ার্ম ক্রিম', color: '#fefce8', border: true },
    { label: 'হালকা মিন্ট', color: '#f0fdf4', border: true },
    { label: 'হালকা গোলাপি', color: '#fff1f2', border: true },
    { label: 'হালকা স্কাই', color: '#f0f9ff', border: true },
    { label: 'ডার্ক স্লেট', color: '#0f172a', border: false },
];

const PRIMARY_COLOR_PRESETS = [
    { label: 'সবুজ', color: '#16a34a' },
    { label: 'নীল', color: '#2563eb' },
    { label: 'ইন্ডিগো', color: '#4f46e5' },
    { label: 'লাল', color: '#dc2626' },
    { label: 'অরেঞ্জ', color: '#ea580c' },
    { label: 'কালো', color: '#0f172a' },
];

const CONTAINER_WIDTH_OPTIONS = [
    { value: '1200px', label: '1200px (স্ট্যান্ডার্ড)' },
    { value: '1280px', label: '1280px (ওয়াইড)' },
    { value: '1400px', label: '1400px (এক্সট্রা ওয়াইড)' },
    { value: '100%', label: '100% (ফুল স্ক্রিন)' },
];

export function PageSettingsInspector({
    width,
    onBackToBlock,
    hasSelectedBlock = false,
}: PageSettingsInspectorProps) {
    const { ast, updatePageSettings } = useBuilderStore();
    const settings = ast.settings || {};

    const currentFont = settings.fontFamily || "'Hind Siliguri', sans-serif";
    const currentBg = settings.backgroundColor || '#ffffff';
    const currentPrimary = settings.primaryColor || '#16a34a';
    const currentMaxWidth = settings.containerMaxWidth || '1200px';

    return (
        <aside
            style={{ width: width ? `${width}px` : undefined }}
            className="w-80 sm:w-88 shrink-0 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-4rem)] select-none transition-[width] duration-75 overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Palette className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-900">পেজ সেটিংস (Page Settings)</h4>
                        <p className="text-[10px] text-gray-500">ফন্ট, ব্যাকগ্রাউন্ড ও গ্লোবাল কালার</p>
                    </div>
                </div>

                {hasSelectedBlock && onBackToBlock && (
                    <button
                        type="button"
                        onClick={onBackToBlock}
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                    >
                        ব্লকে ফিরুন
                    </button>
                )}
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* 1. Font Family Selector */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                            <Type className="w-3.5 h-3.5 text-indigo-500" />
                            <span>গুগল ফন্ট সিলেক্ট করুন (Font Family)</span>
                        </label>
                    </div>

                    <div className="space-y-2">
                        {FONT_OPTIONS.map((font) => {
                            const isSelected = currentFont === font.value;
                            return (
                                <button
                                    key={font.value}
                                    type="button"
                                    onClick={() => updatePageSettings({ fontFamily: font.value })}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                                        isSelected
                                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center space-x-1.5">
                                                <span className="text-xs font-bold text-gray-900">
                                                    {font.name}
                                                </span>
                                                <span className="text-[10px] text-gray-500">
                                                    ({font.labelBengali})
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 block mt-0.5">
                                                {font.category}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Preview sample */}
                                    <div
                                        style={{ fontFamily: font.value }}
                                        className="mt-2 pt-2 border-t border-gray-200/50 text-xs text-gray-700 font-normal leading-relaxed"
                                    >
                                        {font.preview}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* 2. Full Page Background Color */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                        <Palette className="w-3.5 h-3.5 text-indigo-500" />
                        <span>পুরো ল্যান্ডিং পেজের ব্যাকগ্রাউন্ড কালার</span>
                    </label>

                    {/* Color picker + Hex text field */}
                    <div className="flex items-center space-x-2">
                        <div className="relative w-9 h-9 rounded-lg border border-gray-300 overflow-hidden shadow-xs shrink-0 cursor-pointer">
                            <input
                                type="color"
                                value={currentBg}
                                onChange={(e) =>
                                    updatePageSettings({ backgroundColor: e.target.value })
                                }
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="w-full h-full rounded"
                                style={{ backgroundColor: currentBg }}
                            />
                        </div>
                        <input
                            type="text"
                            value={currentBg}
                            onChange={(e) =>
                                updatePageSettings({ backgroundColor: e.target.value })
                            }
                            placeholder="#ffffff"
                            className="flex-1 text-xs font-mono uppercase bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                        />
                    </div>

                    {/* Presets */}
                    <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-medium text-gray-400 block">
                            পছন্দসই প্রিসেট কালার:
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                            {BG_COLOR_PRESETS.map((preset) => {
                                const isSelected =
                                    currentBg.toLowerCase() === preset.color.toLowerCase();
                                return (
                                    <button
                                        key={preset.color}
                                        type="button"
                                        title={preset.label}
                                        onClick={() =>
                                            updatePageSettings({ backgroundColor: preset.color })
                                        }
                                        className={`group flex flex-col items-center p-1.5 rounded-lg border transition-all ${
                                            isSelected
                                                ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-md shadow-xs ${
                                                preset.border ? 'border border-gray-300' : ''
                                            }`}
                                            style={{ backgroundColor: preset.color }}
                                        />
                                        <span className="text-[9px] text-gray-600 mt-1 truncate max-w-full">
                                            {preset.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* 3. Primary Brand Color */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>ব্র্যান্ড কালার (Primary Brand Accent)</span>
                    </label>

                    <div className="flex items-center space-x-2">
                        <div className="relative w-9 h-9 rounded-lg border border-gray-300 overflow-hidden shadow-xs shrink-0 cursor-pointer">
                            <input
                                type="color"
                                value={currentPrimary}
                                onChange={(e) =>
                                    updatePageSettings({ primaryColor: e.target.value })
                                }
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="w-full h-full rounded"
                                style={{ backgroundColor: currentPrimary }}
                            />
                        </div>
                        <input
                            type="text"
                            value={currentPrimary}
                            onChange={(e) =>
                                updatePageSettings({ primaryColor: e.target.value })
                            }
                            placeholder="#16a34a"
                            className="flex-1 text-xs font-mono uppercase bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                        />
                    </div>

                    <div className="flex items-center space-x-1.5 pt-1">
                        {PRIMARY_COLOR_PRESETS.map((preset) => (
                            <button
                                key={preset.color}
                                type="button"
                                title={preset.label}
                                onClick={() => updatePageSettings({ primaryColor: preset.color })}
                                className="w-6 h-6 rounded-md border border-gray-300 shadow-xs hover:scale-110 transition-transform"
                                style={{ backgroundColor: preset.color }}
                            />
                        ))}
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* 4. Container Max Width */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                        <Layout className="w-3.5 h-3.5 text-indigo-500" />
                        <span>কন্টেইনার চওড়া (Container Width)</span>
                    </label>
                    <select
                        value={currentMaxWidth}
                        onChange={(e) =>
                            updatePageSettings({ containerMaxWidth: e.target.value })
                        }
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    >
                        {CONTAINER_WIDTH_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </aside>
    );
}
