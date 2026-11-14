import { Head, router } from '@inertiajs/react';
import {
    Globe,
    Layers,
    LayoutTemplate,
    Palette,
    Save,
    Sparkles,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import { StorefrontColorsEditor } from '@/Shared/StorefrontColorsEditor';
import type { StorefrontColorKey, StorefrontColors, ThemeSettingsProps } from '@/types';

export default function ThemeSettingsPage({
    settings,
    landingPages,
    storefrontColors: initialStorefrontColors,
    storefrontColorDefaults,
}: ThemeSettingsProps) {
    const [storefrontColors, setStorefrontColors] = useState<StorefrontColors>(initialStorefrontColors);
    const updateStorefrontColor = (key: StorefrontColorKey, value: string) => {
        setStorefrontColors((prev) => ({ ...prev, [key]: value }));
    };
    const [storefrontMode, setStorefrontMode] = useState<'full_storefront' | 'landing_page_home'>(
        settings.storefront_mode || 'full_storefront'
    );
    const [homeLandingPageId, setHomeLandingPageId] = useState<string>(
        settings.home_landing_page_id ? String(settings.home_landing_page_id) : ''
    );

    // Branding
    const [storeName, setStoreName] = useState(settings.store_name || '');
    const [supportPhone, setSupportPhone] = useState(settings.support_phone || '');
    const [supportWhatsapp, setSupportWhatsapp] = useState(settings.support_whatsapp || '');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>(settings.store_logo_url || '');
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string>(settings.store_favicon_url || '');

    // Theme Colors & Typography
    const [primaryColor, setPrimaryColor] = useState(settings.primary_color || '#4f46e5');
    const [secondaryColor, setSecondaryColor] = useState(settings.secondary_color || '#06b6d4');
    const [accentColor, setAccentColor] = useState(settings.accent_color || '#f59e0b');
    const [backgroundColor, setBackgroundColor] = useState(settings.background_color || '#f8fafc');
    const [textColor, setTextColor] = useState(settings.text_color || '#0f172a');
    const [fontFamily, setFontFamily] = useState(settings.font_family || 'Hind Siliguri, Inter, sans-serif');
    const [customCss, setCustomCss] = useState(settings.custom_css || '');

    // State & Errors
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleFaviconChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFaviconFile(file);
        setFaviconPreview(URL.createObjectURL(file));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        const formData = new FormData();
        formData.append('storefront_mode', storefrontMode);
        if (storefrontMode === 'landing_page_home' && homeLandingPageId) {
            formData.append('home_landing_page_id', homeLandingPageId);
        }

        formData.append('store_name', storeName.trim());
        if (supportPhone.trim()) formData.append('support_phone', supportPhone.trim());
        if (supportWhatsapp.trim()) formData.append('support_whatsapp', supportWhatsapp.trim());

        if (logoFile) formData.append('logo', logoFile);
        if (faviconFile) formData.append('favicon', faviconFile);

        formData.append('primary_color', primaryColor);
        formData.append('secondary_color', secondaryColor);
        formData.append('accent_color', accentColor);
        formData.append('background_color', backgroundColor);
        formData.append('text_color', textColor);
        formData.append('font_family', fontFamily);
        if (customCss.trim()) formData.append('custom_css', customCss.trim());

        (Object.keys(storefrontColors) as StorefrontColorKey[]).forEach((key) => {
            formData.append(`storefront_colors[${key}]`, storefrontColors[key]);
        });

        router.post('/admin/appearance/theme', formData, {
            preserveScroll: true,
            onError: (errors) => {
                setFormErrors(errors as Record<string, string>);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AdminLayout
            title="Appearance & Theme Customization"
            subtitle="Configure storefront mode, store branding, and custom color palettes for your full website."
        >
            <Head title="Appearance & Theme - Admin" />

            <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
                {/* 1. Storefront Mode */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                        <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                            <LayoutTemplate className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Storefront Homepage Mode</h3>
                            <p className="text-xs text-gray-500">
                                Choose how your root domain (/) behaves when visitors enter your site.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label
                            className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer transition ${
                                storefrontMode === 'full_storefront'
                                    ? 'border-primary-600 bg-primary-50/30'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-primary-600" />
                                    <span className="font-bold text-gray-900 text-sm">Full E-Commerce Website</span>
                                </div>
                                <input
                                    type="radio"
                                    name="storefront_mode"
                                    value="full_storefront"
                                    checked={storefrontMode === 'full_storefront'}
                                    onChange={() => setStorefrontMode('full_storefront')}
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                />
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Standard e-commerce store with category browsing, hero sections, product catalog, cart, and policy pages.
                            </p>
                        </label>

                        <label
                            className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer transition ${
                                storefrontMode === 'landing_page_home'
                                    ? 'border-primary-600 bg-primary-50/30'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-primary-600" />
                                    <span className="font-bold text-gray-900 text-sm">Landing Page Homepage</span>
                                </div>
                                <input
                                    type="radio"
                                    name="storefront_mode"
                                    value="landing_page_home"
                                    checked={storefrontMode === 'landing_page_home'}
                                    onChange={() => setStorefrontMode('landing_page_home')}
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                />
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Routes root domain directly to a high-converting visual landing page built in the visual page builder.
                            </p>
                        </label>
                    </div>

                    {storefrontMode === 'landing_page_home' && (
                        <div className="mt-5 p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Select Homepage Landing Page *
                            </label>
                            <select
                                value={homeLandingPageId}
                                onChange={(e) => setHomeLandingPageId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Default (First Published Landing Page)</option>
                                {landingPages.map((lp) => (
                                    <option key={lp.id} value={lp.id}>
                                        {lp.title} (/p/{lp.slug})
                                    </option>
                                ))}
                            </select>
                            {formErrors.home_landing_page_id && (
                                <p className="text-xs text-red-600 mt-1">{formErrors.home_landing_page_id}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Store Branding & Identity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Store Branding & Support Contacts</h3>
                            <p className="text-xs text-gray-500">
                                Store name, logo, favicon, and customer support channels.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                Store Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            {formErrors.store_name && (
                                <p className="text-xs text-red-600 mt-1">{formErrors.store_name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                Customer Hotline / Phone
                            </label>
                            <input
                                type="text"
                                value={supportPhone}
                                onChange={(e) => setSupportPhone(e.target.value)}
                                placeholder="+880 1XXXXXXXXX"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                WhatsApp Merchant Number
                            </label>
                            <input
                                type="text"
                                value={supportWhatsapp}
                                onChange={(e) => setSupportWhatsapp(e.target.value)}
                                placeholder="01XXXXXXXXX"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Store Logo
                            </label>
                            <div className="flex items-center gap-4">
                                {logoPreview && (
                                    <div className="h-12 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                                        <img src={logoPreview} alt="Logo" className="max-h-8 max-w-full object-contain" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleLogoChange}
                                    className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Store Favicon
                            </label>
                            <div className="flex items-center gap-4">
                                {faviconPreview && (
                                    <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                        <img src={faviconPreview} alt="Favicon" className="w-6 h-6 object-contain" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleFaviconChange}
                                    className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Customize Colors & Typography */}
                <StorefrontColorsEditor
                    colors={storefrontColors}
                    defaults={storefrontColorDefaults}
                    errors={formErrors}
                    onChange={updateStorefrontColor}
                    onResetAll={() => setStorefrontColors({ ...storefrontColorDefaults })}
                />

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <Palette className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Typography, Custom CSS & Legacy Palette</h3>
                            <p className="text-xs text-gray-500">
                                Font family and custom CSS. The legacy palette below does not affect the storefront — use Storefront Colors above.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Primary
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-9 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Secondary
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="w-9 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Accent
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    className="w-9 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Background
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="w-9 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Text
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={textColor}
                                    onChange={(e) => setTextColor(e.target.value)}
                                    className="w-9 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={textColor}
                                    onChange={(e) => setTextColor(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-5">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                            Storefront Font Family
                        </label>
                        <select
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="Hind Siliguri, Inter, sans-serif">Hind Siliguri (Bengali + English Modern Sans)</option>
                            <option value="Tiro Bangla, serif">Tiro Bangla (Bengali Serif Elegance)</option>
                            <option value="Inter, system-ui, sans-serif">Inter (Clean International Sans)</option>
                            <option value="system-ui, sans-serif">System Default Sans</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                            Custom CSS (Optional)
                        </label>
                        <textarea
                            rows={4}
                            value={customCss}
                            onChange={(e) => setCustomCss(e.target.value)}
                            placeholder=":root { --store-header-height: 80px; }"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono leading-relaxed focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                    <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5">
                        <Save className="w-4 h-4" />
                        <span>{isSubmitting ? 'Saving Settings...' : 'Save Theme & Appearance'}</span>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
