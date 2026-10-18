import { Head, useForm } from '@inertiajs/react';
import {
    Eye,
    EyeOff,
    Lock,
    MessageSquare,
    Save,
    Shield,
    Store,
    Truck,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import type { SharedProps } from '@/types';

interface SettingsData {
    courier_default: string;
    steadfast_api_key: string;
    steadfast_api_key_configured: boolean;
    steadfast_secret_key: string;
    steadfast_secret_key_configured: boolean;
    steadfast_base_url: string;

    pathao_client_id: string;
    pathao_client_id_configured: boolean;
    pathao_client_secret: string;
    pathao_client_secret_configured: boolean;
    pathao_username: string;
    pathao_username_configured: boolean;
    pathao_password: string;
    pathao_password_configured: boolean;
    pathao_base_url: string;

    redx_api_token: string;
    redx_api_token_configured: boolean;
    redx_base_url: string;

    sms_default: string;
    greenweb_token: string;
    greenweb_token_configured: boolean;
    greenweb_base_url: string;

    ssl_wireless_api_token: string;
    ssl_wireless_api_token_configured: boolean;
    ssl_wireless_sid: string;
    ssl_wireless_sid_configured: boolean;
    ssl_wireless_base_url: string;

    smspoh_token: string;
    smspoh_token_configured: boolean;
    smspoh_sender_id: string;
    smspoh_base_url: string;

    store_name: string;
    store_phone: string;
    store_whatsapp: string;
}

interface SettingsIndexProps extends SharedProps {
    settings: SettingsData;
    courierDrivers: Record<string, string>;
    smsDrivers: Record<string, string>;
    courierConfigured: Record<string, boolean>;
    smsConfigured: Record<string, boolean>;
}

export default function SettingsIndex({
    settings,
    courierDrivers,
    smsDrivers,
    courierConfigured,
    smsConfigured,
}: SettingsIndexProps) {
    const [activeTab, setActiveTab] = useState<'couriers' | 'sms' | 'store'>('couriers');
    const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});

    const { data, setData, post, processing } = useForm({
        courier_default: settings.courier_default || 'mock',
        steadfast_api_key: settings.steadfast_api_key || '',
        steadfast_secret_key: settings.steadfast_secret_key || '',
        steadfast_base_url: settings.steadfast_base_url || '',

        pathao_client_id: settings.pathao_client_id || '',
        pathao_client_secret: settings.pathao_client_secret || '',
        pathao_username: settings.pathao_username || '',
        pathao_password: settings.pathao_password || '',
        pathao_base_url: settings.pathao_base_url || '',

        redx_api_token: settings.redx_api_token || '',
        redx_base_url: settings.redx_base_url || '',

        sms_default: settings.sms_default || 'mock',
        greenweb_token: settings.greenweb_token || '',
        greenweb_base_url: settings.greenweb_base_url || '',

        ssl_wireless_api_token: settings.ssl_wireless_api_token || '',
        ssl_wireless_sid: settings.ssl_wireless_sid || '',
        ssl_wireless_base_url: settings.ssl_wireless_base_url || '',

        smspoh_token: settings.smspoh_token || '',
        smspoh_sender_id: settings.smspoh_sender_id || '',
        smspoh_base_url: settings.smspoh_base_url || '',

        store_name: settings.store_name || '',
        store_phone: settings.store_phone || '',
        store_whatsapp: settings.store_whatsapp || '',
    });

    const toggleReveal = (field: string) => {
        setRevealedFields((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/settings', {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout
            title="Settings & Integrations"
            subtitle="Manage encrypted integration credentials, delivery partners, and store details"
            actions={
                <Button
                    type="submit"
                    form="settings-form"
                    variant="primary"
                    size="sm"
                    disabled={processing}
                    className="bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
                >
                    <Save className="w-4 h-4 mr-1.5" />
                    {processing ? 'Saving Changes...' : 'Save Settings'}
                </Button>
            }
        >
            <Head title="Settings & Integrations - Admin" />

            <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Security Announcement Banner */}
                <div className="p-4 rounded-xl bg-slate-900 text-white shadow-sm flex items-start space-x-3.5 border border-slate-800">
                    <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                        <Lock className="w-5 h-5" />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-white">
                            Zero-Knowledge Encrypted Credential Vault
                        </h2>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                            API tokens and private secret keys are secured with AES-256 database
                            encryption before storage. Masked credentials (••••••••) indicate active
                            encrypted settings and will not be overwritten unless a new value is
                            entered.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 space-x-8">
                    <button
                        type="button"
                        onClick={() => setActiveTab('couriers')}
                        className={`pb-4 px-1 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                            activeTab === 'couriers'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Truck className="w-4 h-4" />
                        <span>Courier Partners</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('sms')}
                        className={`pb-4 px-1 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                            activeTab === 'sms'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>SMS Gateways</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('store')}
                        className={`pb-4 px-1 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                            activeTab === 'store'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Store className="w-4 h-4" />
                        <span>Store Details</span>
                    </button>
                </div>

                <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* COURIER TAB */}
                    {activeTab === 'couriers' && (
                        <div className="space-y-6">
                            {/* Default Courier Card */}
                            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
                                <h3 className="text-sm font-bold text-gray-900 mb-1">
                                    Default Delivery Partner
                                </h3>
                                <p className="text-xs text-gray-500 mb-4">
                                    Primary courier service used automatically for 1-click order
                                    dispatch.
                                </p>
                                <div className="max-w-md">
                                    <label
                                        htmlFor="courier_default"
                                        className="block text-xs font-semibold text-gray-700 mb-1"
                                    >
                                        Active Courier Driver
                                    </label>
                                    <select
                                        id="courier_default"
                                        value={data.courier_default}
                                        onChange={(e) => setData('courier_default', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        {Object.entries(courierDrivers).map(([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}{' '}
                                                {courierConfigured[key]
                                                    ? '✓ (Ready)'
                                                    : '(Credentials Required)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Steadfast Courier */}
                            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Steadfast Courier
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Nationwide parcel delivery across all 64 districts in
                                            Bangladesh
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                                            settings.steadfast_api_key_configured &&
                                            settings.steadfast_secret_key_configured
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>
                                            {settings.steadfast_api_key_configured &&
                                            settings.steadfast_secret_key_configured
                                                ? 'Encrypted & Ready'
                                                : 'Credentials Missing'}
                                        </span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="steadfast_api_key"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            API Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="steadfast_api_key"
                                                type={
                                                    revealedFields.steadfast_api_key
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                value={data.steadfast_api_key}
                                                onChange={(e) =>
                                                    setData('steadfast_api_key', e.target.value)
                                                }
                                                placeholder={
                                                    settings.steadfast_api_key_configured
                                                        ? '••••••••'
                                                        : 'Enter Steadfast API Key'
                                                }
                                                className="w-full px-3 py-2 pr-9 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleReveal('steadfast_api_key')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {revealedFields.steadfast_api_key ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="steadfast_secret_key"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Secret Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="steadfast_secret_key"
                                                type={
                                                    revealedFields.steadfast_secret_key
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                value={data.steadfast_secret_key}
                                                onChange={(e) =>
                                                    setData('steadfast_secret_key', e.target.value)
                                                }
                                                placeholder={
                                                    settings.steadfast_secret_key_configured
                                                        ? '••••••••'
                                                        : 'Enter Steadfast Secret Key'
                                                }
                                                className="w-full px-3 py-2 pr-9 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleReveal('steadfast_secret_key')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {revealedFields.steadfast_secret_key ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="steadfast_base_url"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            API Base Endpoint
                                        </label>
                                        <input
                                            id="steadfast_base_url"
                                            type="url"
                                            value={data.steadfast_base_url}
                                            onChange={(e) =>
                                                setData('steadfast_base_url', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pathao Courier */}
                            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Pathao Courier
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            On-demand and next-day courier fulfillment via Pathao
                                            Aladdin API
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                                            courierConfigured.pathao
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>
                                            {courierConfigured.pathao
                                                ? 'Encrypted & Ready'
                                                : 'Credentials Missing'}
                                        </span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="pathao_client_id"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Client ID
                                        </label>
                                        <input
                                            id="pathao_client_id"
                                            type={
                                                revealedFields.pathao_client_id
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={data.pathao_client_id}
                                            onChange={(e) =>
                                                setData('pathao_client_id', e.target.value)
                                            }
                                            placeholder={
                                                settings.pathao_client_id_configured
                                                    ? '••••••••'
                                                    : 'Pathao OAuth Client ID'
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="pathao_client_secret"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Client Secret
                                        </label>
                                        <input
                                            id="pathao_client_secret"
                                            type={
                                                revealedFields.pathao_client_secret
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={data.pathao_client_secret}
                                            onChange={(e) =>
                                                setData('pathao_client_secret', e.target.value)
                                            }
                                            placeholder={
                                                settings.pathao_client_secret_configured
                                                    ? '••••••••'
                                                    : 'Pathao OAuth Client Secret'
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="pathao_username"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Username / Email
                                        </label>
                                        <input
                                            id="pathao_username"
                                            type={
                                                revealedFields.pathao_username ? 'text' : 'password'
                                            }
                                            value={data.pathao_username}
                                            onChange={(e) =>
                                                setData('pathao_username', e.target.value)
                                            }
                                            placeholder={
                                                settings.pathao_username_configured
                                                    ? '••••••••'
                                                    : 'Merchant Account Email'
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="pathao_password"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Password
                                        </label>
                                        <input
                                            id="pathao_password"
                                            type={
                                                revealedFields.pathao_password ? 'text' : 'password'
                                            }
                                            value={data.pathao_password}
                                            onChange={(e) =>
                                                setData('pathao_password', e.target.value)
                                            }
                                            placeholder={
                                                settings.pathao_password_configured
                                                    ? '••••••••'
                                                    : 'Account Password'
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="pathao_base_url"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Pathao Base URL
                                        </label>
                                        <input
                                            id="pathao_base_url"
                                            type="url"
                                            value={data.pathao_base_url}
                                            onChange={(e) =>
                                                setData('pathao_base_url', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* RedX Courier */}
                            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">
                                            RedX Courier
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            RedX doorstep parcel pickup and cash-on-delivery service
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                                            settings.redx_api_token_configured
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>
                                            {settings.redx_api_token_configured
                                                ? 'Encrypted & Ready'
                                                : 'Credentials Missing'}
                                        </span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="redx_api_token"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            API Access Token
                                        </label>
                                        <input
                                            id="redx_api_token"
                                            type={
                                                revealedFields.redx_api_token ? 'text' : 'password'
                                            }
                                            value={data.redx_api_token}
                                            onChange={(e) =>
                                                setData('redx_api_token', e.target.value)
                                            }
                                            placeholder={
                                                settings.redx_api_token_configured
                                                    ? '••••••••'
                                                    : 'RedX API Access Token'
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="redx_base_url"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            API Base URL
                                        </label>
                                        <input
                                            id="redx_base_url"
                                            type="url"
                                            value={data.redx_base_url}
                                            onChange={(e) =>
                                                setData('redx_base_url', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SMS GATEWAYS TAB */}
                    {activeTab === 'sms' && (
                        <div className="space-y-6">
                            {/* Default SMS Gateway */}
                            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
                                <h3 className="text-sm font-bold text-gray-900 mb-1">
                                    Default SMS Gateway
                                </h3>
                                <p className="text-xs text-gray-500 mb-4">
                                    Primary provider for automated customer order confirmations and
                                    alerts.
                                </p>
                                <div className="max-w-md">
                                    <label
                                        htmlFor="sms_default"
                                        className="block text-xs font-semibold text-gray-700 mb-1"
                                    >
                                        Active SMS Provider
                                    </label>
                                    <select
                                        id="sms_default"
                                        value={data.sms_default}
                                        onChange={(e) => setData('sms_default', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        {Object.entries(smsDrivers).map(([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}{' '}
                                                {smsConfigured[key]
                                                    ? '✓ (Ready)'
                                                    : '(Credentials Required)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Greenweb SMS */}
                            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Greenweb SMS
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Low-latency Bangladeshi SMS gateway with masking and
                                            non-masking routes
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                                            settings.greenweb_token_configured
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>
                                            {settings.greenweb_token_configured
                                                ? 'Encrypted & Ready'
                                                : 'Credentials Missing'}
                                        </span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="greenweb_token"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            API Token
                                        </label>
                                        <input
                                            id="greenweb_token"
                                            type={
                                                revealedFields.greenweb_token ? 'text' : 'password'
                                            }
                                            value={data.greenweb_token}
                                            onChange={(e) =>
                                                setData('greenweb_token', e.target.value)
                                            }
                                            placeholder={
                                                settings.greenweb_token_configured
                                                    ? '••••••••'
                                                    : 'Greenweb Token'
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="greenweb_base_url"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            API URL
                                        </label>
                                        <input
                                            id="greenweb_base_url"
                                            type="url"
                                            value={data.greenweb_base_url}
                                            onChange={(e) =>
                                                setData('greenweb_base_url', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SSL Wireless SMS */}
                            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">
                                            SSL Wireless SMS
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Enterprise telecom-grade Push SMS API v3
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                                            settings.ssl_wireless_api_token_configured &&
                                            settings.ssl_wireless_sid_configured
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>
                                            {settings.ssl_wireless_api_token_configured &&
                                            settings.ssl_wireless_sid_configured
                                                ? 'Encrypted & Ready'
                                                : 'Credentials Missing'}
                                        </span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="ssl_wireless_api_token"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            API Token
                                        </label>
                                        <input
                                            id="ssl_wireless_api_token"
                                            type={
                                                revealedFields.ssl_wireless_api_token
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={data.ssl_wireless_api_token}
                                            onChange={(e) =>
                                                setData('ssl_wireless_api_token', e.target.value)
                                            }
                                            placeholder={
                                                settings.ssl_wireless_api_token_configured
                                                    ? '••••••••'
                                                    : 'SSL Wireless API Token'
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="ssl_wireless_sid"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            SID (Sender Identifier)
                                        </label>
                                        <input
                                            id="ssl_wireless_sid"
                                            type={
                                                revealedFields.ssl_wireless_sid
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={data.ssl_wireless_sid}
                                            onChange={(e) =>
                                                setData('ssl_wireless_sid', e.target.value)
                                            }
                                            placeholder={
                                                settings.ssl_wireless_sid_configured
                                                    ? '••••••••'
                                                    : 'SSL Wireless SID'
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="ssl_wireless_base_url"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            API Endpoint URL
                                        </label>
                                        <input
                                            id="ssl_wireless_base_url"
                                            type="url"
                                            value={data.ssl_wireless_base_url}
                                            onChange={(e) =>
                                                setData('ssl_wireless_base_url', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SMSPoh */}
                            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">SMSPoh</h3>
                                        <p className="text-xs text-gray-500">
                                            Regional SMS delivery gateway
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                                            settings.smspoh_token_configured
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>
                                            {settings.smspoh_token_configured
                                                ? 'Encrypted & Ready'
                                                : 'Credentials Missing'}
                                        </span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="smspoh_token"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Bearer Token
                                        </label>
                                        <input
                                            id="smspoh_token"
                                            type={revealedFields.smspoh_token ? 'text' : 'password'}
                                            value={data.smspoh_token}
                                            onChange={(e) =>
                                                setData('smspoh_token', e.target.value)
                                            }
                                            placeholder={
                                                settings.smspoh_token_configured
                                                    ? '••••••••'
                                                    : 'SMSPoh Authorization Token'
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="smspoh_sender_id"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Sender ID
                                        </label>
                                        <input
                                            id="smspoh_sender_id"
                                            type="text"
                                            value={data.smspoh_sender_id}
                                            onChange={(e) =>
                                                setData('smspoh_sender_id', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="smspoh_base_url"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            API Endpoint URL
                                        </label>
                                        <input
                                            id="smspoh_base_url"
                                            type="url"
                                            value={data.smspoh_base_url}
                                            onChange={(e) =>
                                                setData('smspoh_base_url', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STORE TAB */}
                    {activeTab === 'store' && (
                        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 mb-1">
                                Store Information & Support
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Public store metadata displayed on checkout headers, thermal
                                receipts, and WhatsApp inquiry buttons.
                            </p>

                            <div className="space-y-4 max-w-lg">
                                <div>
                                    <label
                                        htmlFor="store_name"
                                        className="block text-xs font-semibold text-gray-700 mb-1"
                                    >
                                        Store Brand Name
                                    </label>
                                    <input
                                        id="store_name"
                                        type="text"
                                        value={data.store_name}
                                        onChange={(e) => setData('store_name', e.target.value)}
                                        placeholder="e.g. Dhaka Heritage"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="store_phone"
                                        className="block text-xs font-semibold text-gray-700 mb-1"
                                    >
                                        Customer Care Helpline
                                    </label>
                                    <input
                                        id="store_phone"
                                        type="text"
                                        value={data.store_phone}
                                        onChange={(e) => setData('store_phone', e.target.value)}
                                        placeholder="e.g. 01700000000"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="store_whatsapp"
                                        className="block text-xs font-semibold text-gray-700 mb-1"
                                    >
                                        Merchant WhatsApp Number (for Order Confirmation)
                                    </label>
                                    <input
                                        id="store_whatsapp"
                                        type="text"
                                        value={data.store_whatsapp}
                                        onChange={(e) => setData('store_whatsapp', e.target.value)}
                                        placeholder="e.g. +8801700000000"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        Used for the direct WhatsApp help button on the order
                                        confirmation thank-you page.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            disabled={processing}
                            className="bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {processing ? 'Saving Changes...' : 'Save Settings & Credentials'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
