import { Check, Layout, Palette, Sparkles, Type } from 'lucide-react';
import { useBuilderStore } from '../stores/useBuilderStore';
import { ColorControl, ControlSection, SelectControl } from './controls';

export interface PageSettingsInspectorProps {
    width?: number;
    onBackToBlock?: () => void;
    hasSelectedBlock?: boolean;
}

const FONT_OPTIONS = [
    {
        name: 'Hind Siliguri',
        label: 'Modern Bengali & English',
        value: "'Hind Siliguri', sans-serif",
        preview: 'সবচেয়ে দ্রুত ও সহজে অর্ডার করুন',
    },
    {
        name: 'Tiro Bangla',
        label: 'Classic Bengali serif',
        value: "'Tiro Bangla', serif",
        preview: 'সবচেয়ে দ্রুত ও সহজে অর্ডার করুন',
    },
    {
        name: 'Inter',
        label: 'Clean English sans-serif',
        value: "'Inter', sans-serif",
        preview: 'Fast & Secure Cash On Delivery',
    },
    {
        name: 'System Default',
        label: 'Device native font stack',
        value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        preview: 'দ্রুত ডেলিভারি ও প্রিমিয়াম কোয়ালিটি',
    },
];

const BG_COLOR_PRESETS = [
    { label: 'White', color: '#ffffff' },
    { label: 'Slate', color: '#f8fafc' },
    { label: 'Light Gray', color: '#f3f4f6' },
    { label: 'Cream', color: '#fefce8' },
    { label: 'Mint', color: '#f0fdf4' },
    { label: 'Rose', color: '#fff1f2' },
    { label: 'Sky', color: '#f0f9ff' },
    { label: 'Dark', color: '#0f172a' },
];

const CONTAINER_WIDTH_OPTIONS = [
    { value: '1200px', label: '1200px (Standard)' },
    { value: '1280px', label: '1280px (Wide)' },
    { value: '1400px', label: '1400px (Extra Wide)' },
    { value: '100%', label: '100% (Full Width)' },
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
    const currentMaxWidth = settings.containerMaxWidth || '1200px';

    return (
        <aside
            style={{ width: width ? `${width}px` : undefined }}
            className="w-80 sm:w-88 shrink-0 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-4rem)] select-none transition-[width] duration-75 overflow-hidden"
        >
            <div className="p-3 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Palette className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-900">Page Settings</h4>
                        <p className="text-[10px] text-gray-500">
                            Global fonts, background and brand color
                        </p>
                    </div>
                </div>

                {hasSelectedBlock && onBackToBlock && (
                    <button
                        type="button"
                        onClick={onBackToBlock}
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                    >
                        Back to block
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                <ControlSection title="Typography" icon={Type} defaultOpen>
                    <p className="text-[10px] font-medium text-gray-500">Font family</p>
                    <div className="space-y-1.5">
                        {FONT_OPTIONS.map((font) => {
                            const isSelected = currentFont === font.value;
                            return (
                                <button
                                    key={font.value}
                                    type="button"
                                    onClick={() => updatePageSettings({ fontFamily: font.value })}
                                    className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all ${
                                        isSelected
                                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0">
                                            <span className="text-xs font-bold text-gray-900">
                                                {font.name}
                                            </span>
                                            <span className="block text-[9.5px] text-gray-400">
                                                {font.label}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        style={{ fontFamily: font.value }}
                                        className="mt-1.5 pt-1.5 border-t border-gray-200/60 text-[11px] text-gray-600 leading-relaxed truncate"
                                    >
                                        {font.preview}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </ControlSection>

                <ControlSection title="Page Background" icon={Palette} defaultOpen>
                    <ColorControl
                        label="Background Color"
                        value={currentBg}
                        fallback="#ffffff"
                        onChange={(value) => updatePageSettings({ backgroundColor: value })}
                    />
                    <div>
                        <p className="mb-1 text-[10px] font-medium text-gray-500">Presets</p>
                        <div className="grid grid-cols-8 gap-1">
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
                                        className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 ${
                                            isSelected
                                                ? 'ring-2 ring-indigo-600 ring-offset-1 border-indigo-600'
                                                : 'border-gray-300'
                                        }`}
                                        style={{ backgroundColor: preset.color }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </ControlSection>

                <ControlSection title="Brand Accent" icon={Sparkles} defaultOpen>
                    <ColorControl
                        label="Primary Brand Color"
                        value={settings.primaryColor || '#16a34a'}
                        fallback="#16a34a"
                        onChange={(value) => updatePageSettings({ primaryColor: value })}
                    />
                    <p className="text-[9px] leading-relaxed text-gray-400">
                        Applied to buttons, badges and highlighted elements across the page.
                    </p>
                </ControlSection>

                <ControlSection title="Layout" icon={Layout} defaultOpen>
                    <SelectControl
                        label="Container Width"
                        value={currentMaxWidth}
                        options={CONTAINER_WIDTH_OPTIONS}
                        onChange={(value) => updatePageSettings({ containerMaxWidth: value })}
                    />
                </ControlSection>
            </div>
        </aside>
    );
}
