import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Monitor,
    Redo2,
    Save,
    Smartphone,
    Tablet,
    Undo2,
} from 'lucide-react';
import { useBuilderStore } from '../stores/useBuilderStore';
import type { LandingPageData, ViewportMode } from '@/types';

export interface TopBarProps {
    landingPage: LandingPageData;
    isSaving: boolean;
    saveSuccess: string | null;
    saveError: string | null;
    onSave: () => void;
}

export function TopBar({ landingPage, isSaving, saveSuccess, saveError, onSave }: TopBarProps) {
    const { viewport, setViewport, undo, redo, canUndo, canRedo } = useBuilderStore();

    const viewports: Array<{ mode: ViewportMode; label: string; icon: typeof Monitor }> = [
        { mode: 'desktop', label: 'Desktop', icon: Monitor },
        { mode: 'tablet', label: 'Tablet (768px)', icon: Tablet },
        { mode: 'mobile', label: 'Mobile (390px)', icon: Smartphone },
    ];

    return (
        <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between z-30 select-none shadow-xs">
            {/* Left: Back Link & Page Metadata */}
            <div className="flex items-center space-x-3 sm:space-x-4">
                <Link
                    href="/admin/products"
                    className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition p-1.5 rounded-lg hover:bg-gray-100"
                    title="Back to Admin"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Products</span>
                </Link>

                <div className="h-4 w-px bg-gray-200" />

                <div>
                    <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900 truncate max-w-[140px] sm:max-w-xs">
                            {{ title: landingPage.title }.title}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide bg-gray-100 text-gray-700">
                            {landingPage.status}
                        </span>
                    </div>
                    <span className="text-[11px] text-gray-400 block -mt-0.5">
                        Slug: /{landingPage.slug}
                    </span>
                </div>
            </div>

            {/* Center: Viewport Switcher & History Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3">
                {/* Undo / Redo */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
                    <button
                        type="button"
                        onClick={undo}
                        disabled={!canUndo()}
                        className={`p-1.5 rounded-md transition ${
                            canUndo()
                                ? 'text-gray-700 hover:bg-white hover:shadow-xs cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={redo}
                        disabled={!canRedo()}
                        className={`p-1.5 rounded-md transition ${
                            canRedo()
                                ? 'text-gray-700 hover:bg-white hover:shadow-xs cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="h-4 w-px bg-gray-200 hidden sm:block" />

                {/* Viewport Modes */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
                    {viewports.map((vp) => {
                        const Icon = vp.icon;
                        const isActive = viewport === vp.mode;
                        return (
                            <button
                                key={vp.mode}
                                type="button"
                                onClick={() => setViewport(vp.mode)}
                                className={`flex items-center px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
                                    isActive
                                        ? 'bg-white text-primary-700 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                                title={vp.label}
                            >
                                <Icon className="w-4 h-4 sm:mr-1.5" />
                                <span className="hidden md:inline">
                                    {vp.mode.charAt(0).toUpperCase() + vp.mode.slice(1)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right: Feedback & Save Action */}
            <div className="flex items-center space-x-3">
                {saveSuccess && (
                    <div className="hidden sm:inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        <span>{saveSuccess}</span>
                    </div>
                )}

                {saveError && (
                    <div
                        className="hidden sm:inline-flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 max-w-[200px] truncate"
                        title={saveError}
                    >
                        <span>{saveError}</span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 active:scale-98 shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-1.5" />
                            <span>Save Revision</span>
                        </>
                    )}
                </button>
            </div>
        </header>
    );
}
