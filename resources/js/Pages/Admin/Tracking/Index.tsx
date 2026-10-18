import { Head, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    BarChart3,
    Edit3,
    Eye,
    EyeOff,
    Globe,
    Layers,
    Save,
    ShieldCheck,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import type { SharedProps } from '@/types';

interface GlobalTrackingSettings {
    meta_pixel: {
        enabled: boolean;
        pixel_id: string;
        access_token?: string;
        access_token_configured?: boolean;
        test_event_code?: string;
    };
    ga4: {
        enabled: boolean;
        measurement_id: string;
    };
    google_ads: {
        enabled: boolean;
        conversion_id: string;
        conversion_label: string;
    };
    tiktok_pixel: {
        enabled: boolean;
        pixel_id: string;
    };
    gtm: {
        enabled: boolean;
        container_id: string;
    };
    target_mode: 'all' | 'custom';
    target_page_ids: number[];
}

interface LandingPageSummary {
    id: number;
    title: string;
    slug: string;
    status: string;
    override_global: boolean;
    tracking_settings: Record<string, any> | null;
}

interface TrackingIndexProps extends SharedProps {
    settings: GlobalTrackingSettings;
    landingPages: LandingPageSummary[];
}

const META_PIXEL_REGEX = /^\d{8,20}$/;
const META_TEST_EVENT_CODE_REGEX = /^[A-Za-z0-9_-]{3,50}$/;
const GA4_REGEX = /^G-[A-Z0-9]{4,15}$/i;
const GOOGLE_ADS_ID_REGEX = /^(AW-)?\d{7,15}$/i;
const GOOGLE_ADS_LABEL_REGEX = /^[A-Za-z0-9_-]{8,30}$/;
const TIKTOK_PIXEL_REGEX = /^[A-Za-z0-9]{10,25}$/;
const GTM_REGEX = /^GTM-[A-Z0-9]{5,12}$/i;

export default function TrackingIndex({ settings, landingPages }: TrackingIndexProps) {
    const [activeTab, setActiveTab] = useState<'global' | 'pages' | 'diagnostics'>('global');
    const [editingPage, setEditingPage] = useState<LandingPageSummary | null>(null);
    const [showMetaToken, setShowMetaToken] = useState<boolean>(false);

    // Global settings form
    const { data, setData, post, processing, errors } = useForm<GlobalTrackingSettings>({
        meta_pixel: {
            enabled: Boolean(settings.meta_pixel?.enabled),
            pixel_id: settings.meta_pixel?.pixel_id || '',
            access_token: settings.meta_pixel?.access_token || '',
            test_event_code: settings.meta_pixel?.test_event_code || '',
        },
        ga4: {
            enabled: Boolean(settings.ga4?.enabled),
            measurement_id: settings.ga4?.measurement_id || '',
        },
        google_ads: {
            enabled: Boolean(settings.google_ads?.enabled),
            conversion_id: settings.google_ads?.conversion_id || '',
            conversion_label: settings.google_ads?.conversion_label || '',
        },
        tiktok_pixel: {
            enabled: Boolean(settings.tiktok_pixel?.enabled),
            pixel_id: settings.tiktok_pixel?.pixel_id || '',
        },
        gtm: {
            enabled: Boolean(settings.gtm?.enabled),
            container_id: settings.gtm?.container_id || '',
        },
        target_mode: settings.target_mode || 'all',
        target_page_ids: settings.target_page_ids || [],
    });

    // Page-specific override modal form state
    const [pageOverrideForm, setPageOverrideForm] = useState({
        override_global: false,
        meta_pixel: { enabled: false, pixel_id: '', test_event_code: '' },
        ga4: { enabled: false, measurement_id: '' },
        google_ads: { enabled: false, conversion_id: '', conversion_label: '' },
        tiktok_pixel: { enabled: false, pixel_id: '' },
        gtm: { enabled: false, container_id: '' },
    });
    const [isSavingPage, setIsSavingPage] = useState(false);
    const [pageSaveError, setPageSaveError] = useState<string | null>(null);

    const handleGlobalSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/tracking', {
            preserveScroll: true,
        });
    };

    const openPageEditModal = (page: LandingPageSummary) => {
        setEditingPage(page);
        const pSettings = page.tracking_settings || {};
        setPageOverrideForm({
            override_global: Boolean(pSettings.override_global),
            meta_pixel: {
                enabled: Boolean(pSettings.meta_pixel?.enabled),
                pixel_id: pSettings.meta_pixel?.pixel_id || '',
                test_event_code: pSettings.meta_pixel?.test_event_code || '',
            },
            ga4: {
                enabled: Boolean(pSettings.ga4?.enabled),
                measurement_id: pSettings.ga4?.measurement_id || '',
            },
            google_ads: {
                enabled: Boolean(pSettings.google_ads?.enabled),
                conversion_id: pSettings.google_ads?.conversion_id || '',
                conversion_label: pSettings.google_ads?.conversion_label || '',
            },
            tiktok_pixel: {
                enabled: Boolean(pSettings.tiktok_pixel?.enabled),
                pixel_id: pSettings.tiktok_pixel?.pixel_id || '',
            },
            gtm: {
                enabled: Boolean(pSettings.gtm?.enabled),
                container_id: pSettings.gtm?.container_id || '',
            },
        });
        setPageSaveError(null);
    };

    const handleSavePageOverride = () => {
        if (!editingPage) return;
        setIsSavingPage(true);
        setPageSaveError(null);

        router.post(
            `/admin/tracking/page/${editingPage.id}`,
            pageOverrideForm,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingPage(null);
                    setIsSavingPage(false);
                },
                onError: (errs: Record<string, string>) => {
                    setIsSavingPage(false);
                    const first = Object.values(errs)[0];
                    setPageSaveError(typeof first === 'string' ? first : 'Validation error occurred.');
                },
            }
        );
    };

    const toggleTargetPage = (pageId: number) => {
        setData('target_page_ids', 
            data.target_page_ids.includes(pageId)
                ? data.target_page_ids.filter((id: number) => id !== pageId)
                : [...data.target_page_ids, pageId]
        );
    };

    // Client-side quick validation helpers
    const isMetaValid = !data.meta_pixel.enabled || META_PIXEL_REGEX.test(data.meta_pixel.pixel_id.trim());
    const isMetaTestEventCodeValid = !data.meta_pixel.test_event_code?.trim() || META_TEST_EVENT_CODE_REGEX.test(data.meta_pixel.test_event_code.trim());
    const isGa4Valid = !data.ga4.enabled || GA4_REGEX.test(data.ga4.measurement_id.trim());
    const isGadsValid = !data.google_ads.enabled || (
        GOOGLE_ADS_ID_REGEX.test(data.google_ads.conversion_id.trim()) &&
        (!data.google_ads.conversion_label.trim() || GOOGLE_ADS_LABEL_REGEX.test(data.google_ads.conversion_label.trim()))
    );
    const isTiktokValid = !data.tiktok_pixel.enabled || TIKTOK_PIXEL_REGEX.test(data.tiktok_pixel.pixel_id.trim());
    const isGtmValid = !data.gtm.enabled || GTM_REGEX.test(data.gtm.container_id.trim());

    return (
        <AdminLayout
            title="Marketing Pixels & Analytics"
            subtitle="Configure Meta Pixel, Google Analytics 4, Google Ads, TikTok Pixel, and Google Tag Manager"
        >
            <Head title="Marketing Pixels & Analytics - Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Navigation Tabs */}
                <div className="flex items-center space-x-2 border-b border-slate-200 bg-white px-6 pt-4 rounded-xl shadow-sm">
                    <button
                        type="button"
                        onClick={() => setActiveTab('global')}
                        className={`pb-4 px-3 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
                            activeTab === 'global'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Globe className="w-4 h-4" />
                        <span>Global Tracking Settings</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('pages')}
                        className={`pb-4 px-3 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
                            activeTab === 'pages'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        <span>Landing Page Overrides</span>
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
                            {landingPages.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('diagnostics')}
                        className={`pb-4 px-3 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
                            activeTab === 'diagnostics'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                        <span>Diagnostics & Event Health</span>
                    </button>
                </div>

                {/* TAB 1: GLOBAL SETTINGS */}
                {activeTab === 'global' && (
                    <form onSubmit={handleGlobalSubmit} className="space-y-6">
                        {/* Notice & Security Card */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-sm text-blue-900">
                            <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold">Enterprise Security & Privacy Shield Active</h4>
                                <p className="text-xs text-blue-700 mt-0.5">
                                    Customer Personally Identifiable Information (name, phone, delivery address) is never exposed in pixel payloads. 
                                    Pixel IDs are sanitized with strict regular expressions to block XSS injection. Public tracking is strictly isolated from draft pages and admin routes.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 1. Meta (Facebook) Pixel Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-lg">
                                            f
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Meta (Facebook) Pixel</h3>
                                            <p className="text-xs text-slate-500">Track PageView, ViewContent, InitiateCheckout & Purchase</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.meta_pixel.enabled}
                                            onChange={(e) => setData('meta_pixel', { ...data.meta_pixel, enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>

                                {data.meta_pixel.enabled ? (
                                    <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                                        {/* 1. Meta Pixel ID */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                Meta Pixel ID
                                            </label>
                                            <input
                                                type="text"
                                                value={data.meta_pixel.pixel_id}
                                                onChange={(e) => setData('meta_pixel', { ...data.meta_pixel, pixel_id: e.target.value.trim() })}
                                                placeholder="e.g. 123456789012345"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition ${
                                                    !isMetaValid
                                                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                                        : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500 bg-white'
                                                }`}
                                            />
                                            {!isMetaValid && (
                                                <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    <span>Pixel ID must be 8-20 numeric digits without letters or symbols.</span>
                                                </p>
                                            )}
                                            {errors['meta_pixel.pixel_id' as keyof typeof errors] && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    {errors['meta_pixel.pixel_id' as keyof typeof errors]}
                                                </p>
                                            )}
                                        </div>

                                        {/* 2. Conversions API (CAPI) Access Token */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Conversions API (CAPI) Access Token
                                                </label>
                                                <span className="text-[11px] text-slate-400 font-medium">Server CAPI Token</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={showMetaToken ? 'text' : 'password'}
                                                    value={data.meta_pixel.access_token || ''}
                                                    onChange={(e) => setData('meta_pixel', { ...data.meta_pixel, access_token: e.target.value.trim() })}
                                                    placeholder={settings.meta_pixel?.access_token_configured ? '•••••••• (Encrypted in database)' : 'Paste your Meta CAPI Access Token'}
                                                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono bg-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowMetaToken(!showMetaToken)}
                                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                                                >
                                                    {showMetaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-1">
                                                Generated in Meta Events Manager &gt; Settings &gt; Generate Access Token. Stored securely with AES-256 encryption.
                                            </p>
                                        </div>

                                        {/* 3. Test Event Code */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Test Event Code
                                                </label>
                                                <span className="text-[11px] text-amber-600 font-medium">For Events Manager Debugging</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={data.meta_pixel.test_event_code || ''}
                                                onChange={(e) => setData('meta_pixel', { ...data.meta_pixel, test_event_code: e.target.value.trim().toUpperCase() })}
                                                placeholder="e.g. TEST12345"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition ${
                                                    !isMetaTestEventCodeValid
                                                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                                        : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500 bg-white'
                                                }`}
                                            />
                                            {!isMetaTestEventCodeValid && (
                                                <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    <span>Test Event Code must be 3-50 alphanumeric characters (e.g. TEST12345).</span>
                                                </p>
                                            )}
                                            <p className="text-[11px] text-slate-500 mt-1">
                                                Found in Meta Events Manager &gt; Test Events tab. Clear this field before launching live paid ads.
                                            </p>
                                        </div>

                                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
                                            <p className="font-semibold text-slate-700">Supported Events:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">PageView</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">ViewContent</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">InitiateCheckout</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">AddPaymentInfo</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">Purchase (Deduplicated)</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">Contact</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-2 px-1 flex items-center justify-between text-xs text-slate-500">
                                        <span className="inline-flex items-center space-x-1.5 text-slate-400 font-medium">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                            <span>Disabled</span>
                                        </span>
                                        <span className="text-[11px] text-slate-400">Toggle switch to configure Pixel ID, CAPI & Test Events</span>
                                    </div>
                                )}
                            </div>

                            {/* 2. Google Analytics 4 (GA4) Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Google Analytics 4 (GA4)</h3>
                                            <p className="text-xs text-slate-500">Universal gtag.js e-commerce tracking</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.ga4.enabled}
                                            onChange={(e) => setData('ga4', { ...data.ga4, enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>

                                {data.ga4.enabled ? (
                                    <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                GA4 Measurement ID
                                            </label>
                                            <input
                                                type="text"
                                                value={data.ga4.measurement_id}
                                                onChange={(e) => setData('ga4', { ...data.ga4, measurement_id: e.target.value.trim().toUpperCase() })}
                                                placeholder="G-XXXXXXXXXX"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition ${
                                                    !isGa4Valid
                                                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                                        : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500 bg-white'
                                                }`}
                                            />
                                            {!isGa4Valid && (
                                                <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    <span>Measurement ID must start with "G-" followed by alphanumeric characters.</span>
                                                </p>
                                            )}
                                            {errors['ga4.measurement_id' as keyof typeof errors] && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    {errors['ga4.measurement_id' as keyof typeof errors]}
                                                </p>
                                            )}
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
                                            <p className="font-semibold text-slate-700">Supported Events:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">page_view</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">view_item</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">begin_checkout</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">add_payment_info</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">purchase (transaction_id deduplicated)</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-2 px-1 flex items-center justify-between text-xs text-slate-500">
                                        <span className="inline-flex items-center space-x-1.5 text-slate-400 font-medium">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                            <span>Disabled</span>
                                        </span>
                                        <span className="text-[11px] text-slate-400">Toggle switch to configure GA4 Measurement ID</span>
                                    </div>
                                )}
                            </div>

                            {/* 3. Google Ads Conversion Tracking Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                                            GAds
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Google Ads Conversion</h3>
                                            <p className="text-xs text-slate-500">Track ROAS and successful checkout conversions</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.google_ads.enabled}
                                            onChange={(e) => setData('google_ads', { ...data.google_ads, enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>

                                {data.google_ads.enabled ? (
                                    <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                    Conversion ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.google_ads.conversion_id}
                                                    onChange={(e) => setData('google_ads', { ...data.google_ads, conversion_id: e.target.value.trim() })}
                                                    placeholder="AW-123456789"
                                                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition ${
                                                        !isGadsValid
                                                            ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                                            : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500 bg-white'
                                                    }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                    Conversion Label <span className="text-slate-400 font-normal">(Optional)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.google_ads.conversion_label}
                                                    onChange={(e) => setData('google_ads', { ...data.google_ads, conversion_label: e.target.value.trim() })}
                                                    placeholder="e.g. AbC-D_ef123"
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono bg-white"
                                                />
                                            </div>
                                        </div>
                                        {(!isGadsValid || errors['google_ads.conversion_id' as keyof typeof errors]) && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                <span>
                                                    {errors['google_ads.conversion_id' as keyof typeof errors] || 'Conversion ID must be formatted as AW-123456789 or 123456789.'}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-2 px-1 flex items-center justify-between text-xs text-slate-500">
                                        <span className="inline-flex items-center space-x-1.5 text-slate-400 font-medium">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                            <span>Disabled</span>
                                        </span>
                                        <span className="text-[11px] text-slate-400">Toggle switch to configure Google Ads Conversion Tracking</span>
                                    </div>
                                )}
                            </div>

                            {/* 4. TikTok Pixel Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                                            TT
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">TikTok Pixel</h3>
                                            <p className="text-xs text-slate-500">Track TikTok marketing traffic and conversions</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.tiktok_pixel.enabled}
                                            onChange={(e) => setData('tiktok_pixel', { ...data.tiktok_pixel, enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>

                                {data.tiktok_pixel.enabled ? (
                                    <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                TikTok Pixel ID
                                            </label>
                                            <input
                                                type="text"
                                                value={data.tiktok_pixel.pixel_id}
                                                onChange={(e) => setData('tiktok_pixel', { ...data.tiktok_pixel, pixel_id: e.target.value.trim() })}
                                                placeholder="e.g. C1234567890ABCDEF"
                                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition ${
                                                    !isTiktokValid
                                                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                                        : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500 bg-white'
                                                }`}
                                            />
                                            {!isTiktokValid && (
                                                <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    <span>TikTok Pixel ID must be 10-25 alphanumeric characters.</span>
                                                </p>
                                            )}
                                            {errors['tiktok_pixel.pixel_id' as keyof typeof errors] && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    {errors['tiktok_pixel.pixel_id' as keyof typeof errors]}
                                                </p>
                                            )}
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
                                            <p className="font-semibold text-slate-700">Supported Events:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">ViewContent</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">InitiateCheckout</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">AddPaymentInfo</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-[11px] font-mono">CompletePayment (Purchase)</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-2 px-1 flex items-center justify-between text-xs text-slate-500">
                                        <span className="inline-flex items-center space-x-1.5 text-slate-400 font-medium">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                            <span>Disabled</span>
                                        </span>
                                        <span className="text-[11px] text-slate-400">Toggle switch to configure TikTok Pixel ID</span>
                                    </div>
                                )}
                            </div>

                            {/* 5. Google Tag Manager (GTM) Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 lg:col-span-2">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-600/10 text-cyan-700 flex items-center justify-center font-bold text-sm">
                                            GTM
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-base font-bold text-slate-900">Google Tag Manager (GTM)</h3>
                                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                    Optional
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">Inject GTM Container script & noscript tags into public landing pages</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.gtm.enabled}
                                            onChange={(e) => setData('gtm', { ...data.gtm, enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>

                                {data.gtm.enabled ? (
                                    <div className="max-w-xl pt-1 animate-in fade-in duration-200">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            GTM Container ID
                                        </label>
                                        <input
                                            type="text"
                                            value={data.gtm.container_id}
                                            onChange={(e) => setData('gtm', { ...data.gtm, container_id: e.target.value.trim().toUpperCase() })}
                                            placeholder="GTM-XXXXXXX"
                                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition ${
                                                !isGtmValid
                                                    ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                                    : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500 bg-white'
                                            }`}
                                        />
                                        {!isGtmValid && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                <span>Container ID must start with "GTM-" followed by alphanumeric characters.</span>
                                            </p>
                                        )}
                                        {errors['gtm.container_id' as keyof typeof errors] && (
                                            <p className="text-xs text-red-600 mt-1">
                                                {errors['gtm.container_id' as keyof typeof errors]}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-2 px-1 flex items-center justify-between text-xs text-slate-500">
                                        <span className="inline-flex items-center space-x-1.5 text-slate-400 font-medium">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                            <span>Disabled</span>
                                        </span>
                                        <span className="text-[11px] text-slate-400">Toggle switch to configure GTM Container ID</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Target Landing Pages Configuration */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Target Landing Pages</h3>
                                    <p className="text-xs text-slate-500">Choose which landing pages execute this global tracking configuration</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label
                                        onClick={() => setData('target_mode', 'all')}
                                        className={`p-4 rounded-xl border cursor-pointer flex items-center space-x-3 transition ${
                                            data.target_mode === 'all'
                                                ? 'border-primary-600 bg-primary-50/40 ring-1 ring-primary-500'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="target_mode"
                                            checked={data.target_mode === 'all'}
                                            onChange={() => setData('target_mode', 'all')}
                                            className="text-primary-600 focus:ring-primary-500"
                                        />
                                        <div>
                                            <span className="block font-bold text-sm text-slate-900">All Published Landing Pages</span>
                                            <span className="block text-xs text-slate-500">Global tracking will fire on every active published campaign.</span>
                                        </div>
                                    </label>

                                    <label
                                        onClick={() => setData('target_mode', 'custom')}
                                        className={`p-4 rounded-xl border cursor-pointer flex items-center space-x-3 transition ${
                                            data.target_mode === 'custom'
                                                ? 'border-primary-600 bg-primary-50/40 ring-1 ring-primary-500'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="target_mode"
                                            checked={data.target_mode === 'custom'}
                                            onChange={() => setData('target_mode', 'custom')}
                                            className="text-primary-600 focus:ring-primary-500"
                                        />
                                        <div>
                                            <span className="block font-bold text-sm text-slate-900">Selected Landing Pages Only</span>
                                            <span className="block text-xs text-slate-500">Only inject scripts into explicitly checked pages below.</span>
                                        </div>
                                    </label>
                                </div>

                                {data.target_mode === 'custom' && (
                                    <div className="pt-3 border-t border-slate-100">
                                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Select Pages to Track:
                                        </p>
                                        {landingPages.length === 0 ? (
                                            <p className="text-xs text-slate-500">No landing pages found.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                {landingPages.map((lp) => {
                                                    const isChecked = data.target_page_ids.includes(lp.id);
                                                    return (
                                                        <label
                                                            key={lp.id}
                                                            className={`p-3 rounded-xl border text-sm flex items-center space-x-2.5 cursor-pointer transition ${
                                                                isChecked
                                                                    ? 'border-primary-500 bg-primary-50/20 text-slate-900'
                                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleTargetPage(lp.id)}
                                                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                            />
                                                            <span className="truncate font-medium">{lp.title}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Save Bar */}
                        <div className="flex items-center justify-end space-x-3 pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={processing}
                                disabled={processing}
                            >
                                <Save className="w-4 h-4 mr-1.5" />
                                Save Global Tracking Settings
                            </Button>
                        </div>
                    </form>
                )}

                {/* TAB 2: LANDING PAGE OVERRIDES */}
                {activeTab === 'pages' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Per-Landing Page Tracking Overrides</h3>
                                <p className="text-xs text-slate-500">
                                    Override global pixel IDs with campaign-specific pixels for distinct Facebook ad accounts or client tracking.
                                </p>
                            </div>
                        </div>

                        {landingPages.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No landing pages found. Create a landing page to configure overrides.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {landingPages.map((page) => {
                                    const pSett = page.tracking_settings || {};
                                    const hasOverride = Boolean(pSett.override_global);
                                    const isDraft = page.status === 'draft';

                                    return (
                                        <div
                                            key={page.id}
                                            className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <h4 className="font-bold text-sm text-slate-900">{page.title}</h4>
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                            isDraft
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-emerald-100 text-emerald-800'
                                                        }`}
                                                    >
                                                        {page.status}
                                                    </span>
                                                    {hasOverride ? (
                                                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                            Custom Override
                                                        </span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                            Inherits Global
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center space-x-2">
                                                    <span>Slug: /{page.slug}</span>
                                                    {isDraft && (
                                                        <span className="text-amber-700 font-medium">
                                                            (Tracking automatically disabled on drafts)
                                                        </span>
                                                    )}
                                                </div>
                                                {hasOverride && (
                                                    <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-slate-600 font-mono">
                                                        {pSett.meta_pixel?.enabled && (
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded">
                                                                Meta: {pSett.meta_pixel.pixel_id || 'Global'}
                                                            </span>
                                                        )}
                                                        {pSett.ga4?.enabled && (
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded">
                                                                GA4: {pSett.ga4.measurement_id || 'Global'}
                                                            </span>
                                                        )}
                                                        {pSett.google_ads?.enabled && (
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded">
                                                                Google Ads: {pSett.google_ads.conversion_id || 'Global'}
                                                            </span>
                                                        )}
                                                        {pSett.tiktok_pixel?.enabled && (
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded">
                                                                TikTok: {pSett.tiktok_pixel.pixel_id || 'Global'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => openPageEditModal(page)}
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                                                    {hasOverride ? 'Edit Overrides' : 'Configure Override'}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: DIAGNOSTICS & EVENT HEALTH */}
                {activeTab === 'diagnostics' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <h3 className="text-base font-bold text-slate-900">Tracking Integrity & Verification Status</h3>
                            <p className="text-xs text-slate-500">
                                Real-time validation checks for your configured advertising pixels.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                                {/* Meta Pixel Status */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">Meta Pixel</span>
                                        {data.meta_pixel.enabled && isMetaValid && data.meta_pixel.pixel_id ? (
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                Configured
                                            </span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-600 space-y-1">
                                        <p>ID: {data.meta_pixel.pixel_id || 'Not set'}</p>
                                        <p>Standard Events: 6 events enabled</p>
                                    </div>
                                </div>

                                {/* GA4 Status */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">GA4 Analytics</span>
                                        {data.ga4.enabled && isGa4Valid && data.ga4.measurement_id ? (
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                Configured
                                            </span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-600 space-y-1">
                                        <p>ID: {data.ga4.measurement_id || 'Not set'}</p>
                                        <p>gtag.js: Universal loader</p>
                                    </div>
                                </div>

                                {/* Google Ads Status */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">Google Ads</span>
                                        {data.google_ads.enabled && isGadsValid && data.google_ads.conversion_id ? (
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                Configured
                                            </span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-600 space-y-1">
                                        <p>ID: {data.google_ads.conversion_id || 'Not set'}</p>
                                        <p>Conversion Deduplication: Active</p>
                                    </div>
                                </div>

                                {/* TikTok Pixel Status */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">TikTok Pixel</span>
                                        {data.tiktok_pixel.enabled && isTiktokValid && data.tiktok_pixel.pixel_id ? (
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                Configured
                                            </span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-600 space-y-1">
                                        <p>ID: {data.tiktok_pixel.pixel_id || 'Not set'}</p>
                                        <p>CompletePayment: Active</p>
                                    </div>
                                </div>
                            </div>

                            {/* Testing Notice */}
                            <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-xs text-amber-900 space-y-1">
                                <div className="flex items-center space-x-1.5 font-bold">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    <span>Real Account Live Testing Disclaimer</span>
                                </div>
                                <p>
                                    Script templates, XSS validation, and deduplication logic are automatically tested. 
                                    However, live event delivery to third-party ad servers (Meta Events Manager, Google Analytics DebugView, TikTok Events Manager) requires valid merchant account credentials and live network requests from your domain.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PAGE OVERRIDE MODAL */}
            {editingPage && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Override Tracking for "{editingPage.title}"
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Slug: /{editingPage.slug} &bull; Status: {editingPage.status}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingPage(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {pageSaveError && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{pageSaveError}</span>
                            </div>
                        )}

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                            {/* Override Toggle */}
                            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                                <div>
                                    <span className="block font-bold text-sm text-purple-900">
                                        Enable Custom Tracking Overrides for this Page
                                    </span>
                                    <span className="block text-xs text-purple-700">
                                        When active, the page will use these custom IDs instead of global settings.
                                    </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={pageOverrideForm.override_global}
                                        onChange={(e) =>
                                            setPageOverrideForm({
                                                ...pageOverrideForm,
                                                override_global: e.target.checked,
                                            })
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>

                            {pageOverrideForm.override_global && (
                                <div className="space-y-4 pt-2">
                                    {/* Meta Override */}
                                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 uppercase">Meta (Facebook) Pixel Override</span>
                                            <input
                                                type="checkbox"
                                                checked={pageOverrideForm.meta_pixel.enabled}
                                                onChange={(e) =>
                                                    setPageOverrideForm({
                                                        ...pageOverrideForm,
                                                        meta_pixel: { ...pageOverrideForm.meta_pixel, enabled: e.target.checked },
                                                    })
                                                }
                                                className="rounded text-primary-600 cursor-pointer"
                                            />
                                        </div>
                                        {pageOverrideForm.meta_pixel.enabled ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                                                <input
                                                    type="text"
                                                    value={pageOverrideForm.meta_pixel.pixel_id}
                                                    onChange={(e) =>
                                                        setPageOverrideForm({
                                                            ...pageOverrideForm,
                                                            meta_pixel: { ...pageOverrideForm.meta_pixel, pixel_id: e.target.value.trim() },
                                                        })
                                                    }
                                                    placeholder="Custom Pixel ID (e.g. 12345...)"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                                                />
                                                <input
                                                    type="text"
                                                    value={pageOverrideForm.meta_pixel.test_event_code || ''}
                                                    onChange={(e) =>
                                                        setPageOverrideForm({
                                                            ...pageOverrideForm,
                                                            meta_pixel: { ...pageOverrideForm.meta_pixel, test_event_code: e.target.value.trim().toUpperCase() },
                                                        })
                                                    }
                                                    placeholder="Test Event Code (e.g. TEST12345)"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-slate-400">Disabled — will not override global Meta Pixel</p>
                                        )}
                                    </div>

                                    {/* GA4 Override */}
                                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 uppercase">Google Analytics 4 (GA4) Override</span>
                                            <input
                                                type="checkbox"
                                                checked={pageOverrideForm.ga4.enabled}
                                                onChange={(e) =>
                                                    setPageOverrideForm({
                                                        ...pageOverrideForm,
                                                        ga4: { ...pageOverrideForm.ga4, enabled: e.target.checked },
                                                    })
                                                }
                                                className="rounded text-primary-600 cursor-pointer"
                                            />
                                        </div>
                                        {pageOverrideForm.ga4.enabled ? (
                                            <input
                                                type="text"
                                                value={pageOverrideForm.ga4.measurement_id}
                                                onChange={(e) =>
                                                    setPageOverrideForm({
                                                        ...pageOverrideForm,
                                                        ga4: { ...pageOverrideForm.ga4, measurement_id: e.target.value.trim().toUpperCase() },
                                                    })
                                                }
                                                placeholder="Custom GA4 Measurement ID (e.g. G-XXXXXXX)"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono animate-in fade-in duration-150"
                                            />
                                        ) : (
                                            <p className="text-[11px] text-slate-400">Disabled — will not override global GA4</p>
                                        )}
                                    </div>

                                    {/* Google Ads Override */}
                                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 uppercase">Google Ads Conversion Override</span>
                                            <input
                                                type="checkbox"
                                                checked={pageOverrideForm.google_ads.enabled}
                                                onChange={(e) =>
                                                    setPageOverrideForm({
                                                        ...pageOverrideForm,
                                                        google_ads: { ...pageOverrideForm.google_ads, enabled: e.target.checked },
                                                    })
                                                }
                                                className="rounded text-primary-600 cursor-pointer"
                                            />
                                        </div>
                                        {pageOverrideForm.google_ads.enabled ? (
                                            <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                                                <input
                                                    type="text"
                                                    value={pageOverrideForm.google_ads.conversion_id}
                                                    onChange={(e) =>
                                                        setPageOverrideForm({
                                                            ...pageOverrideForm,
                                                            google_ads: { ...pageOverrideForm.google_ads, conversion_id: e.target.value.trim() },
                                                        })
                                                    }
                                                    placeholder="Conversion ID (e.g. AW-12345)"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                                                />
                                                <input
                                                    type="text"
                                                    value={pageOverrideForm.google_ads.conversion_label}
                                                    onChange={(e) =>
                                                        setPageOverrideForm({
                                                            ...pageOverrideForm,
                                                            google_ads: { ...pageOverrideForm.google_ads, conversion_label: e.target.value.trim() },
                                                        })
                                                    }
                                                    placeholder="Label (optional)"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-slate-400">Disabled — will not override global Google Ads</p>
                                        )}
                                    </div>

                                    {/* TikTok Override */}
                                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 uppercase">TikTok Pixel Override</span>
                                            <input
                                                type="checkbox"
                                                checked={pageOverrideForm.tiktok_pixel.enabled}
                                                onChange={(e) =>
                                                    setPageOverrideForm({
                                                        ...pageOverrideForm,
                                                        tiktok_pixel: { ...pageOverrideForm.tiktok_pixel, enabled: e.target.checked },
                                                    })
                                                }
                                                className="rounded text-primary-600 cursor-pointer"
                                            />
                                        </div>
                                        {pageOverrideForm.tiktok_pixel.enabled ? (
                                            <input
                                                type="text"
                                                value={pageOverrideForm.tiktok_pixel.pixel_id}
                                                onChange={(e) =>
                                                    setPageOverrideForm({
                                                        ...pageOverrideForm,
                                                        tiktok_pixel: { ...pageOverrideForm.tiktok_pixel, pixel_id: e.target.value.trim() },
                                                    })
                                                }
                                                placeholder="Custom TikTok Pixel ID (e.g. C12345...)"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono animate-in fade-in duration-150"
                                            />
                                        ) : (
                                            <p className="text-[11px] text-slate-400">Disabled — will not override global TikTok Pixel</p>
                                        )}
                                    </div>

                                    {/* GTM Override */}
                                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 uppercase">GTM Container Override</span>
                                            <input
                                                type="checkbox"
                                                checked={pageOverrideForm.gtm.enabled}
                                                onChange={(e) =>
                                                    setPageOverrideForm({
                                                        ...pageOverrideForm,
                                                        gtm: { ...pageOverrideForm.gtm, enabled: e.target.checked },
                                                    })
                                                }
                                                className="rounded text-primary-600 cursor-pointer"
                                            />
                                        </div>
                                        {pageOverrideForm.gtm.enabled ? (
                                            <input
                                                type="text"
                                                value={pageOverrideForm.gtm.container_id}
                                                onChange={(e) =>
                                                    setPageOverrideForm({
                                                        ...pageOverrideForm,
                                                        gtm: { ...pageOverrideForm.gtm, container_id: e.target.value.trim().toUpperCase() },
                                                    })
                                                }
                                                placeholder="Custom GTM Container ID (e.g. GTM-XXXXXXX)"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono animate-in fade-in duration-150"
                                            />
                                        ) : (
                                            <p className="text-[11px] text-slate-400">Disabled — will not override global GTM Container</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setEditingPage(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                isLoading={isSavingPage}
                                disabled={isSavingPage}
                                onClick={handleSavePageOverride}
                            >
                                <Save className="w-4 h-4 mr-1.5" />
                                Save Page Overrides
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
