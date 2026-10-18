import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    Clock,
    Edit2,
    Plus,
    Trash2,
    Truck,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import type { ShippingMethod, ShippingZone } from '@/types';

interface ShippingMethodsPageProps {
    methods: ShippingMethod[];
    zones: ShippingZone[];
}

export default function ShippingMethodsPage({ methods, zones }: ShippingMethodsPageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [zoneCode, setZoneCode] = useState('all');
    const [rate, setRate] = useState('70');
    const [deliveryTime, setDeliveryTime] = useState('24-48 hours');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isDefault, setIsDefault] = useState(false);
    const [sortOrder, setSortOrder] = useState('0');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const openCreateModal = () => {
        setEditingMethod(null);
        setName('');
        setCode('');
        setZoneCode('all');
        setRate('70');
        setDeliveryTime('24-48 hours');
        setDescription('');
        setIsActive(true);
        setIsDefault(false);
        setSortOrder('0');
        setErrorMsg(null);
        setIsModalOpen(true);
    };

    const openEditModal = (method: ShippingMethod) => {
        setEditingMethod(method);
        setName(method.name);
        setCode(method.code);
        setZoneCode(method.zone_code || 'all');
        setRate(String(method.rate));
        setDeliveryTime(method.delivery_time || '');
        setDescription(method.description || '');
        setIsActive(method.is_active);
        setIsDefault(method.is_default);
        setSortOrder(String(method.sort_order));
        setErrorMsg(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMethod(null);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsSubmitting(true);

        const payload = {
            name,
            code: code.trim() || undefined,
            zone_code: zoneCode,
            rate: parseFloat(rate) || 0,
            delivery_time: deliveryTime,
            description,
            is_active: isActive,
            is_default: isDefault,
            sort_order: parseInt(sortOrder, 10) || 0,
        };

        if (editingMethod) {
            router.put(`/admin/shipping-methods/${editingMethod.id}`, payload, {
                onSuccess: () => closeModal(),
                onError: (errs) => {
                    setErrorMsg(Object.values(errs)[0] || 'Failed to update shipping method.');
                },
                onFinish: () => setIsSubmitting(false),
            });
        } else {
            router.post('/admin/shipping-methods', payload, {
                onSuccess: () => closeModal(),
                onError: (errs) => {
                    setErrorMsg(Object.values(errs)[0] || 'Failed to create shipping method.');
                },
                onFinish: () => setIsSubmitting(false),
            });
        }
    };

    const handleToggle = (method: ShippingMethod) => {
        router.post(`/admin/shipping-methods/${method.id}/toggle`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (method: ShippingMethod) => {
        if (confirm(`Are you sure you want to delete "${method.name}"? Past order snapshots and history will remain intact.`)) {
            router.delete(`/admin/shipping-methods/${method.id}`, {
                preserveScroll: true,
            });
        }
    };

    const getZoneBadge = (codeVal: string | null) => {
        switch (codeVal) {
            case 'inside_dhaka':
                return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-100 text-sky-800">Inside Dhaka</span>;
            case 'sub_dhaka':
                return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-800">Sub-Dhaka</span>;
            case 'outside_dhaka':
                return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">Outside Dhaka</span>;
            case 'all':
            default:
                return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-800">All Bangladesh</span>;
        }
    };

    return (
        <AdminLayout
            title="Shipping Methods"
            subtitle="Manage delivery options, shipping fees, and zone rules for checkout"
            actions={
                <Button
                    type="button"
                    variant="primary"
                    onClick={openCreateModal}
                    className="flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Shipping Method</span>
                </Button>
            }
        >
            <Head title="Shipping Methods - Admin" />

            <div className="space-y-6">
                {/* Information Callout */}
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
                    <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="font-semibold text-blue-950">
                            Customer Delivery Rates vs Courier Dispatch
                        </p>
                        <p className="text-blue-800/90 leading-relaxed">
                            Shipping methods define the rates and delivery options presented to your customers during checkout.
                            Couriers (e.g. Steadfast, Pathao, RedX) handle physical dispatch and parcel tracking. Deleted shipping methods are safely archived so past order records and invoices never lose referential integrity.
                        </p>
                    </div>
                </div>

                {/* Shipping Methods Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3.5 px-4">Method Name & Details</th>
                                    <th className="py-3.5 px-4">Applicable Zone</th>
                                    <th className="py-3.5 px-4">Rate (৳)</th>
                                    <th className="py-3.5 px-4">Est. Delivery</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {methods.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400">
                                            No shipping methods configured yet. Click "Add Shipping Method" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    methods.map((method) => (
                                        <tr key={method.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900">
                                                        {method.name}
                                                    </span>
                                                    {method.is_default && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                                                            DEFAULT
                                                        </span>
                                                    )}
                                                </div>
                                                {method.description && (
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {method.description}
                                                    </p>
                                                )}
                                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                    Code: {method.code}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {getZoneBadge(method.zone_code)}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-slate-900">
                                                ৳{parseFloat(String(method.rate)).toFixed(2)}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600 flex items-center gap-1.5 pt-4.5">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{method.delivery_time || 'N/A'}</span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggle(method)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                                        method.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            method.is_active ? 'bg-emerald-600' : 'bg-slate-400'
                                                        }`}
                                                    />
                                                    {method.is_active ? 'Active' : 'Disabled'}
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(method)}
                                                        className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Edit Method"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(method)}
                                                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Method"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal: Create / Edit Shipping Method */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-base">
                                {editingMethod ? 'Edit Shipping Method' : 'Create Shipping Method'}
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {errorMsg && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Method Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Inside Dhaka Standard Delivery"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Applicable Area / Zone <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={zoneCode}
                                        onChange={(e) => setZoneCode(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                                    >
                                        <option value="all">All Bangladesh (Universal)</option>
                                        {zones.map((z) => (
                                            <option key={z.id} value={z.code}>
                                                {z.name} ({z.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Shipping Charge (৳) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={rate}
                                        onChange={(e) => setRate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Estimated Delivery Time
                                    </label>
                                    <input
                                        type="text"
                                        value={deliveryTime}
                                        onChange={(e) => setDeliveryTime(e.target.value)}
                                        placeholder="e.g. 24-48 hours"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Unique Code <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="e.g. dhaka-express"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Description / Customer Note <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief note shown under this option on checkout page"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                                    />
                                    <span className="text-xs font-semibold text-slate-700">Active (Visible at checkout)</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isDefault}
                                        onChange={(e) => setIsDefault(e.target.checked)}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                                    />
                                    <span className="text-xs font-semibold text-slate-700">Default for Zone</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                                <Button type="button" variant="secondary" onClick={closeModal}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : editingMethod ? 'Update Method' : 'Create Method'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
