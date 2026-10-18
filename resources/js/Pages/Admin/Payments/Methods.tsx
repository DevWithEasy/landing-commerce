import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    Edit2,
    Plus,
    ShieldAlert,
    Trash2,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import type { PaymentMethod } from '@/types';

interface PaymentMethodsPageProps {
    methods: PaymentMethod[];
}

export default function PaymentMethodsPage({ methods }: PaymentMethodsPageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [requiresTransactionId, setRequiresTransactionId] = useState(true);
    const [sortOrder, setSortOrder] = useState('0');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const openCreateModal = () => {
        setEditingMethod(null);
        setName('');
        setCode('');
        setDescription('');
        setInstructions('');
        setAccountNumber('');
        setIsActive(false);
        setIsOnline(false);
        setRequiresTransactionId(true);
        setSortOrder('0');
        setErrorMsg(null);
        setIsModalOpen(true);
    };

    const openEditModal = (method: PaymentMethod) => {
        setEditingMethod(method);
        setName(method.name);
        setCode(method.code);
        setDescription(method.description || '');
        setInstructions(method.instructions || '');
        setAccountNumber(method.account_number || '');
        setIsActive(method.is_active);
        setIsOnline(method.is_online);
        setRequiresTransactionId(method.requires_transaction_id);
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
            code: code.trim().toLowerCase(),
            description,
            instructions,
            account_number: accountNumber.trim() || null,
            is_active: isActive,
            is_online: isOnline,
            requires_transaction_id: requiresTransactionId,
            sort_order: parseInt(sortOrder, 10) || 0,
        };

        if (editingMethod) {
            router.put(`/admin/payment-methods/${editingMethod.id}`, payload, {
                onSuccess: () => closeModal(),
                onError: (errs) => {
                    setErrorMsg(Object.values(errs)[0] || 'Failed to update payment method.');
                },
                onFinish: () => setIsSubmitting(false),
            });
        } else {
            router.post('/admin/payment-methods', payload, {
                onSuccess: () => closeModal(),
                onError: (errs) => {
                    setErrorMsg(Object.values(errs)[0] || 'Failed to create payment method.');
                },
                onFinish: () => setIsSubmitting(false),
            });
        }
    };

    const handleToggle = (method: PaymentMethod) => {
        router.post(`/admin/payment-methods/${method.id}/toggle`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (method: PaymentMethod) => {
        if (method.code === 'cod') {
            alert('Cash on Delivery is the store primary payment method and cannot be removed.');
            return;
        }

        if (confirm(`Are you sure you want to delete payment method "${method.name}"? Existing order references will remain intact.`)) {
            router.delete(`/admin/payment-methods/${method.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AdminLayout
            title="Payment Methods"
            subtitle="Configure Cash on Delivery and manual mobile financial services for checkout"
            actions={
                <Button
                    type="button"
                    variant="primary"
                    onClick={openCreateModal}
                    className="flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Payment Method</span>
                </Button>
            }
        >
            <Head title="Payment Methods - Admin" />

            <div className="space-y-6">
                {/* Security & Verification Callout */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="font-semibold text-amber-950">
                            Strict Payment Integrity Guardrail
                        </p>
                        <p className="text-amber-800/90 leading-relaxed">
                            <strong>Cash on Delivery (COD)</strong> is fully operational and orders are safely created with status <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-amber-900">unpaid</code>.
                            Manual MFS (bKash, Nagad, Rocket) require a customer-submitted <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-amber-900">TrxID</code> and are stored as <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-amber-900">pending_verification</code>. Under no circumstances can unverified online payments mark orders as paid without authorized gateway validation.
                        </p>
                    </div>
                </div>

                {/* Payment Methods Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3.5 px-4">Method & Code</th>
                                    <th className="py-3.5 px-4">Account & Instructions</th>
                                    <th className="py-3.5 px-4">Verification Type</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {methods.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400">
                                            No payment methods configured. Click "Add Payment Method" to create one.
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
                                                    {method.code === 'cod' && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                                                            COD DEFAULT
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                                    code: {method.code}
                                                </div>
                                                {method.description && (
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {method.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 max-w-xs">
                                                {method.account_number ? (
                                                    <div className="text-xs font-semibold text-slate-900">
                                                        A/C: <span className="font-mono text-emerald-700 font-bold">{method.account_number}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">None specified</span>
                                                )}
                                                {method.instructions && (
                                                    <p className="text-xs text-slate-500 mt-0.5 truncate" title={method.instructions}>
                                                        {method.instructions}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {method.requires_transaction_id ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">
                                                        TrxID Required
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">
                                                        Cash on Delivery
                                                    </span>
                                                )}
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
                                                    {method.code !== 'cod' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(method)}
                                                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Method"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
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

            {/* Modal: Create / Edit Payment Method */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-base">
                                {editingMethod ? 'Edit Payment Method' : 'Create Payment Method'}
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
                                    placeholder="e.g. bKash (Personal/Merchant)"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Unique Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={editingMethod?.code === 'cod'}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="e.g. bkash, nagad, rocket"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm font-mono disabled:bg-slate-100 disabled:text-slate-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Account Number <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder="e.g. 01712345678"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Customer Instructions <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="e.g. Send Money to 01712345678 and enter Transaction ID (TrxID) below."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Description <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Short explanation shown on checkout"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
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
                                        checked={requiresTransactionId}
                                        disabled={editingMethod?.code === 'cod'}
                                        onChange={(e) => setRequiresTransactionId(e.target.checked)}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 disabled:opacity-50"
                                    />
                                    <span className="text-xs font-semibold text-slate-700">Requires Transaction ID (TrxID) from Customer</span>
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
