import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    CreditCard,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Filter,
    Layers,
    MapPin,
    MessageSquare,
    Package,
    Phone,
    Printer,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    ShoppingBag,
    Trash2,
    Truck,
    User as UserIcon,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Badge } from '@/Shared/Badge';
import { Button } from '@/Shared/Button';
import { Card } from '@/Shared/Card';
import { Pagination } from '@/Shared/Pagination';
import type { Order, OrderIndexProps, OrderTimelineNode } from '@/types';

// Map status identifiers to human-readable names and styling
const STATUS_CONFIG: Record<
    string,
    { label: string; badgeVariant: 'warning' | 'info' | 'success' | 'danger' | 'neutral' }
> = {
    pending: { label: 'Pending', badgeVariant: 'warning' },
    confirmed: { label: 'Confirmed', badgeVariant: 'info' },
    processing: { label: 'Processing', badgeVariant: 'info' },
    handed_to_courier: { label: 'Handed to Courier', badgeVariant: 'info' },
    in_transit: { label: 'In Transit', badgeVariant: 'info' },
    delivered: { label: 'Delivered', badgeVariant: 'success' },
    returned: { label: 'Returned', badgeVariant: 'danger' },
    cancelled: { label: 'Cancelled', badgeVariant: 'danger' },
    spam: { label: 'Spam', badgeVariant: 'neutral' },
};

const ALL_STATUS_KEYS = [
    'pending',
    'confirmed',
    'processing',
    'handed_to_courier',
    'in_transit',
    'delivered',
    'returned',
    'cancelled',
    'spam',
];

export default function Index({
    orders,
    filters,
    statusCounts,
    allowedTransitions,
    courierConfig,
    smsConfig,
}: OrderIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [currentStatus, setCurrentStatus] = useState(filters.status || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkTargetStatus, setBulkTargetStatus] = useState('confirmed');
    const [bulkComment, setBulkComment] = useState('');
    const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

    // Order delete confirmation state
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const [singleDeleteOrder, setSingleDeleteOrder] = useState<Order | null>(null);
    const [isDeletingOrders, setIsDeletingOrders] = useState(false);

    // Order detail drawer state
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const [timeline, setTimeline] = useState<OrderTimelineNode[]>([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);

    // Single order transition modal/drawer state
    const [targetTransitionStatus, setTargetTransitionStatus] = useState<string | null>(null);
    const [transitionComment, setTransitionComment] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Courier dispatch & live tracking state
    const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
    const [selectedCourierDriver, setSelectedCourierDriver] = useState(
        courierConfig?.default || 'mock'
    );
    const [dispatchRecipientName, setDispatchRecipientName] = useState('');
    const [dispatchRecipientPhone, setDispatchRecipientPhone] = useState('');
    const [dispatchRecipientAddress, setDispatchRecipientAddress] = useState('');
    const [dispatchCodAmount, setDispatchCodAmount] = useState<string | number>('');
    const [dispatchNote, setDispatchNote] = useState('');
    const [dispatchWeight, setDispatchWeight] = useState<string | number>('0.5');
    const [isDispatching, setIsDispatching] = useState(false);
    const [dispatchError, setDispatchError] = useState<string | null>(null);
    const [isTrackingLoading, setIsTrackingLoading] = useState(false);
    const [trackingFeedback, setTrackingFeedback] = useState<{
        status: string;
        message: string;
        rawStatus?: string;
    } | null>(null);

    // SMS notification state
    const [smsModalOpen, setSmsModalOpen] = useState(false);
    const [selectedSmsDriver, setSelectedSmsDriver] = useState(smsConfig?.default || 'mock');
    const [selectedSmsTemplate, setSelectedSmsTemplate] = useState('order_confirmed');
    const [smsCustomMessage, setSmsCustomMessage] = useState('');
    const [isSmsSending, setIsSmsSending] = useState(false);
    const [smsError, setSmsError] = useState<string | null>(null);

    // Sync search and filter changes
    const applyFilters = (statusOverride?: string) => {
        const nextStatus = statusOverride !== undefined ? statusOverride : currentStatus;
        router.get(
            '/admin/orders',
            {
                search: search || undefined,
                status: nextStatus !== 'all' ? nextStatus : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleFilterSubmit = (e: FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleStatusTabClick = (statusKey: string) => {
        setCurrentStatus(statusKey);
        applyFilters(statusKey);
    };

    const handleResetFilters = () => {
        setSearch('');
        setCurrentStatus('all');
        setDateFrom('');
        setDateTo('');
        router.get('/admin/orders', {}, { preserveState: true, preserveScroll: true });
    };

    // Selection handlers
    const allVisibleSelected =
        orders.data.length > 0 && orders.data.every((o) => selectedIds.includes(o.id));

    const toggleSelectAll = () => {
        if (allVisibleSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(orders.data.map((o) => o.id));
        }
    };

    const toggleSelectRow = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Open detail drawer and load audit trail timeline
    const openOrderDetail = (order: Order) => {
        setDetailOrder(order);
        setTimeline([]);
        setTargetTransitionStatus(null);
        setTransitionComment('');
        setLoadingTimeline(true);

        // Prepopulate courier fields
        setSelectedCourierDriver(order.courier_name || courierConfig?.default || 'mock');
        setDispatchRecipientName(order.customer_name);
        setDispatchRecipientPhone(order.customer_phone);
        const destination = order.upazila
            ? `${order.delivery_address}, ${order.upazila}, ${order.district}`
            : `${order.delivery_address}, ${order.district}`;
        setDispatchRecipientAddress(destination);
        setDispatchCodAmount(order.total);
        setDispatchNote(order.notes || '');
        setDispatchWeight('0.5');
        setDispatchError(null);
        setTrackingFeedback(null);
        setSmsModalOpen(false);
        setSmsError(null);
        setSelectedSmsDriver(smsConfig?.default || 'mock');
        setSelectedSmsTemplate(
            order.status === 'handed_to_courier' || order.status === 'in_transit'
                ? 'out_for_delivery'
                : order.status === 'pending'
                  ? 'order_placed'
                  : 'order_confirmed'
        );
        setSmsCustomMessage('');

        fetch(`/admin/orders/${order.id}`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((res) => res.json())
            .then((data: { order: Order; timeline: OrderTimelineNode[] }) => {
                setDetailOrder(data.order);
                setTimeline(data.timeline || []);
            })
            .catch(() => {
                // If fetch fails, keep current order data
            })
            .finally(() => {
                setLoadingTimeline(false);
            });
    };

    // Close detail drawer
    const closeOrderDetail = () => {
        setDetailOrder(null);
        setTimeline([]);
        setTargetTransitionStatus(null);
        setDispatchModalOpen(false);
        setDispatchError(null);
        setTrackingFeedback(null);
        setSmsModalOpen(false);
        setSmsError(null);
    };

    // Get live preview of the SMS text for the active order
    const getPreviewMessage = (templateKey: string, order: Order | null) => {
        if (!order) return '';
        if (templateKey === 'custom') return smsCustomMessage;
        const template = smsConfig?.templates?.[templateKey];
        if (!template) return '';
        return template
            .replace(/{customer_name}/g, order.customer_name)
            .replace(/{customer_phone}/g, order.customer_phone)
            .replace(/{order_number}/g, order.order_number)
            .replace(/{total}/g, String(order.total))
            .replace(/{subtotal}/g, String(order.subtotal))
            .replace(/{shipping_fee}/g, String(order.shipping_fee))
            .replace(/{courier_name}/g, order.courier_name || 'courier')
            .replace(/{tracking_id}/g, order.courier_tracking_id || 'N/A')
            .replace(/{tracking_url}/g, order.courier_tracking_url || '');
    };

    // Execute SMS notification dispatch
    const executeSendSms = (e: FormEvent) => {
        e.preventDefault();
        if (!detailOrder) return;
        setIsSmsSending(true);
        setSmsError(null);

        router.post(
            `/admin/orders/${detailOrder.id}/sms/send`,
            {
                driver: selectedSmsDriver,
                template: selectedSmsTemplate,
                message: selectedSmsTemplate === 'custom' ? smsCustomMessage : undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSmsSending(false);
                    setSmsModalOpen(false);
                    openOrderDetail(detailOrder);
                },
                onError: (errors) => {
                    setIsSmsSending(false);
                    const errorMsg =
                        Object.values(errors).join(', ') || 'Failed to send SMS notification.';
                    setSmsError(errorMsg);
                },
            }
        );
    };

    // Execute courier consignment booking
    const executeCourierDispatch = (e: FormEvent) => {
        e.preventDefault();
        if (!detailOrder) return;
        setIsDispatching(true);
        setDispatchError(null);

        router.post(
            `/admin/orders/${detailOrder.id}/courier/dispatch`,
            {
                driver: selectedCourierDriver,
                recipient_name: dispatchRecipientName,
                recipient_phone: dispatchRecipientPhone,
                recipient_address: dispatchRecipientAddress,
                cod_amount: dispatchCodAmount,
                note: dispatchNote || undefined,
                weight: dispatchWeight ? parseFloat(String(dispatchWeight)) : 0.5,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDispatching(false);
                    setDispatchModalOpen(false);
                    openOrderDetail(detailOrder);
                },
                onError: (errors) => {
                    setIsDispatching(false);
                    const errorMsg =
                        Object.values(errors).join(', ') || 'Failed to dispatch order to courier.';
                    setDispatchError(errorMsg);
                },
            }
        );
    };

    // Execute live courier tracking lookup
    const executeCourierTrack = () => {
        if (!detailOrder || !detailOrder.courier_tracking_id) return;
        setIsTrackingLoading(true);
        setTrackingFeedback(null);

        router.post(
            `/admin/orders/${detailOrder.id}/courier/track`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsTrackingLoading(false);
                    openOrderDetail(detailOrder);
                },
                onError: (errors) => {
                    setIsTrackingLoading(false);
                    const errorMsg =
                        Object.values(errors).join(', ') ||
                        'Failed to retrieve live courier tracking.';
                    setTrackingFeedback({
                        status: 'error',
                        message: errorMsg,
                    });
                },
            }
        );
    };

    // Single order transition execution
    const executeSingleTransition = (toStatus: string) => {
        if (!detailOrder) return;
        setIsTransitioning(true);

        router.post(
            `/admin/orders/${detailOrder.id}/transition`,
            {
                status: toStatus,
                comment: transitionComment || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsTransitioning(false);
                    setTargetTransitionStatus(null);
                    setTransitionComment('');
                    // Refresh order detail drawer
                    openOrderDetail(detailOrder);
                },
                onError: () => {
                    setIsTransitioning(false);
                },
            }
        );
    };

    // Bulk transition execution
    const executeBulkTransition = (e: FormEvent) => {
        e.preventDefault();
        if (selectedIds.length === 0) return;

        setIsBulkSubmitting(true);
        router.post(
            '/admin/orders/bulk-transition',
            {
                order_ids: selectedIds,
                status: bulkTargetStatus,
                comment: bulkComment || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsBulkSubmitting(false);
                    setBulkModalOpen(false);
                    setSelectedIds([]);
                    setBulkComment('');
                },
                onError: () => {
                    setIsBulkSubmitting(false);
                },
            }
        );
    };

    // Bulk delete selected orders execution
    const executeBulkDelete = () => {
        if (selectedIds.length === 0 || isDeletingOrders) return;

        const deletingIds = [...selectedIds];
        setIsDeletingOrders(true);
        router.post(
            '/admin/orders/bulk-delete',
            {
                order_ids: deletingIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDeletingOrders(false);
                    setBulkDeleteModalOpen(false);
                    setSelectedIds([]);
                    if (detailOrder && deletingIds.includes(detailOrder.id)) {
                        closeOrderDetail();
                    }
                },
                onError: () => {
                    setIsDeletingOrders(false);
                },
            }
        );
    };

    // Single order delete execution
    const executeSingleDelete = () => {
        if (!singleDeleteOrder || isDeletingOrders) return;

        const targetId = singleDeleteOrder.id;
        setIsDeletingOrders(true);
        router.delete(`/admin/orders/${targetId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeletingOrders(false);
                setSingleDeleteOrder(null);
                setSelectedIds((prev) => prev.filter((id) => id !== targetId));
                if (detailOrder && detailOrder.id === targetId) {
                    closeOrderDetail();
                }
            },
            onError: () => {
                setIsDeletingOrders(false);
            },
        });
    };

    // Format currency to BDT
    const formatMoney = (amount: string | number | null | undefined): string => {
        if (amount === null || amount === undefined || amount === '') return '৳0.00';
        const num = typeof amount === 'number' ? amount : parseFloat(amount);
        return isNaN(num) ? '৳0.00' : `৳${num.toFixed(2)}`;
    };

    // Build CSV export URL preserving current filters
    const csvExportUrl = (() => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (currentStatus && currentStatus !== 'all') params.append('status', currentStatus);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        const query = params.toString();
        return `/admin/orders/export${query ? `?${query}` : ''}`;
    })();

    // Allowed transitions for currently viewed detail order
    const currentAllowedTransitions = detailOrder
        ? allowedTransitions[detailOrder.status] || []
        : [];

    return (
        <AdminLayout
            title="Orders & Fulfillment"
            subtitle="Process, pack, track, and dispatch Cash on Delivery orders across Bangladesh's 64 districts."
            actions={
                <div className="flex items-center space-x-2">
                    <a
                        href={csvExportUrl}
                        className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 px-3.5 py-2 text-sm shadow-sm"
                    >
                        <Download className="w-4 h-4 mr-1.5 text-gray-500" />
                        Export to CSV
                    </a>
                </div>
            }
        >
            <Head title="Orders & Fulfillment - Admin" />

            {/* Status Tabs Navigation */}
            <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                <nav className="flex space-x-2 min-w-max pb-2">
                    <button
                        type="button"
                        onClick={() => handleStatusTabClick('all')}
                        className={`px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
                            currentStatus === 'all'
                                ? 'bg-primary-50 text-primary-700 font-semibold ring-1 ring-primary-200'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        <span>All Orders</span>
                        <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                currentStatus === 'all'
                                    ? 'bg-primary-200 text-primary-800'
                                    : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            {statusCounts.all ?? 0}
                        </span>
                    </button>

                    {ALL_STATUS_KEYS.map((key) => {
                        const config = STATUS_CONFIG[key];
                        const count = statusCounts[key] ?? 0;
                        const isActive = currentStatus === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleStatusTabClick(key)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
                                    isActive
                                        ? 'bg-primary-50 text-primary-700 font-semibold ring-1 ring-primary-200'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                <span>{config?.label || key}</span>
                                <span
                                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                        isActive
                                            ? 'bg-primary-200 text-primary-800'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Filter Card */}
            <Card padding="sm" className="mb-6">
                <form
                    onSubmit={handleFilterSubmit}
                    className="flex flex-col md:flex-row gap-3 items-end"
                >
                    {/* Search Field */}
                    <div className="flex-1 w-full">
                        <label
                            htmlFor="order-search"
                            className="block text-xs font-medium text-gray-700 mb-1"
                        >
                            Search Orders
                        </label>
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                            <input
                                id="order-search"
                                type="text"
                                placeholder="Order #, customer name, phone number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    {/* Date From */}
                    <div className="w-full md:w-40">
                        <label
                            htmlFor="date-from"
                            className="block text-xs font-medium text-gray-700 mb-1"
                        >
                            Date From
                        </label>
                        <input
                            id="date-from"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* Date To */}
                    <div className="w-full md:w-40">
                        <label
                            htmlFor="date-to"
                            className="block text-xs font-medium text-gray-700 mb-1"
                        >
                            Date To
                        </label>
                        <input
                            id="date-to"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                        <Button type="submit" variant="primary" size="md">
                            <Filter className="w-3.5 h-3.5 mr-1" />
                            Filter
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={handleResetFilters}
                            title="Reset all filters"
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Reset
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Bulk Actions Floating Bar */}
            {selectedIds.length > 0 && (
                <div className="mb-4 p-3 bg-slate-900 text-white rounded-xl shadow-md flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-sm">
                        <span className="font-semibold px-2 py-0.5 bg-primary-600 rounded text-xs">
                            {selectedIds.length}
                        </span>
                        <span>order(s) selected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="primary" size="sm" onClick={() => setBulkModalOpen(true)}>
                            Update Status...
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setBulkDeleteModalOpen(true)}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Delete Selected
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedIds([])}
                            className="!bg-slate-800 !text-slate-200 hover:!bg-slate-700"
                        >
                            Deselect All
                        </Button>
                    </div>
                </div>
            )}

            {/* Orders Data Table */}
            <Card padding="none" className="overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 divide-y divide-gray-200">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-4 py-3.5 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allVisibleSelected}
                                        onChange={toggleSelectAll}
                                        aria-label="Select all orders on this page"
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                                    />
                                </th>
                                <th scope="col" className="px-4 py-3.5">
                                    Order # / Date
                                </th>
                                <th scope="col" className="px-4 py-3.5">
                                    Customer & Location
                                </th>
                                <th scope="col" className="px-4 py-3.5">
                                    Items Summary
                                </th>
                                <th scope="col" className="px-4 py-3.5">
                                    Payable Total
                                </th>
                                <th scope="col" className="px-4 py-3.5">
                                    Pipeline Status
                                </th>
                                <th scope="col" className="px-4 py-3.5 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-12 text-center text-gray-500"
                                    >
                                        <ShoppingBag className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                        <p className="font-medium text-gray-700">No orders found</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Try adjusting your search criteria or status filter.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((order) => {
                                    const isSelected = selectedIds.includes(order.id);
                                    const statusMeta = STATUS_CONFIG[order.status] || {
                                        label: order.status,
                                        badgeVariant: 'neutral',
                                    };

                                    return (
                                        <tr
                                            key={order.id}
                                            className={`hover:bg-slate-50 transition-colors ${
                                                isSelected ? 'bg-primary-50/40' : ''
                                            }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="px-4 py-3.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectRow(order.id)}
                                                    aria-label={`Select order ${order.order_number}`}
                                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                                                />
                                            </td>

                                            {/* Order Number & Date */}
                                            <td className="px-4 py-3.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openOrderDetail(order)}
                                                    className="font-mono font-semibold text-primary-600 hover:text-primary-800 hover:underline block text-left"
                                                >
                                                    {order.order_number}
                                                </button>
                                                <div className="text-[11px] text-gray-400 flex items-center mt-0.5">
                                                    <Clock className="w-3 h-3 mr-1 inline" />
                                                    {new Date(order.created_at).toLocaleDateString(
                                                        'en-GB',
                                                        {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        }
                                                    )}
                                                </div>
                                                {order.courier_tracking_id && (
                                                    <div className="mt-1 flex items-center text-[10px] text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200 w-fit">
                                                        <Truck className="w-2.5 h-2.5 mr-1 text-primary-600" />
                                                        <span className="font-semibold uppercase mr-1">
                                                            {order.courier_name || 'Courier'}:
                                                        </span>
                                                        {order.courier_tracking_url ? (
                                                            <a
                                                                href={order.courier_tracking_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="underline hover:text-primary-900"
                                                            >
                                                                {order.courier_tracking_id}
                                                            </a>
                                                        ) : (
                                                            <span>{order.courier_tracking_id}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Customer & Location */}
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-gray-900">
                                                    {order.customer_name}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                                    <Phone className="w-3 h-3 mr-1 text-gray-400" />
                                                    <a
                                                        href={`tel:${order.customer_phone}`}
                                                        className="hover:underline"
                                                    >
                                                        {order.customer_phone}
                                                    </a>
                                                </div>
                                                <div className="text-[11px] text-gray-400 flex items-center mt-0.5">
                                                    <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                                    {order.upazila ? `${order.upazila}, ` : ''}
                                                    {order.district}
                                                </div>
                                            </td>

                                            {/* Items Summary */}
                                            <td className="px-4 py-3.5 max-w-xs">
                                                <div className="space-y-0.5">
                                                    {order.items && order.items.length > 0 ? (
                                                        order.items.slice(0, 2).map((item) => (
                                                            <div
                                                                key={item.id}
                                                                className="text-xs text-gray-800 truncate"
                                                                title={`${item.quantity}x ${item.product_title}${item.variant_name ? ` (${item.variant_name})` : ''}`}
                                                            >
                                                                <span className="font-semibold text-gray-600">
                                                                    {item.quantity}x
                                                                </span>{' '}
                                                                {item.product_title}
                                                                {item.variant_name && (
                                                                    <span className="text-gray-400 text-[10px] ml-1">
                                                                        ({item.variant_name})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                            No items
                                                        </span>
                                                    )}
                                                    {order.items && order.items.length > 2 && (
                                                        <div className="text-[10px] text-primary-600 font-medium">
                                                            +{order.items.length - 2} more item(s)
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Payable Total */}
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-gray-900">
                                                    {formatMoney(order.total)}
                                                </div>
                                                <div className="text-[11px] text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                                    <span>{order.payment_method}</span>
                                                    <span
                                                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                                            order.payment_status === 'paid'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : order.payment_status === 'pending_verification'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {order.payment_status || 'unpaid'}
                                                    </span>
                                                </div>
                                                {order.shipping_method_name && (
                                                    <div className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5" title={order.shipping_method_name}>
                                                        {order.shipping_method_name}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Pipeline Status */}
                                            <td className="px-4 py-3.5">
                                                <Badge variant={statusMeta.badgeVariant} size="sm">
                                                    {statusMeta.label}
                                                </Badge>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center space-x-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openOrderDetail(order)}
                                                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="View Order Details & Audit Trail"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <a
                                                        href={`/admin/orders/${order.id}/invoice?type=thermal`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Print 80mm Thermal Slip"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </a>
                                                    <a
                                                        href={`/admin/orders/${order.id}/invoice?type=a4`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Print A4 Packing Slip"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSingleDeleteOrder(order)}
                                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {orders.total > orders.per_page && (
                    <div className="px-4 py-3 border-t border-gray-200">
                        <Pagination
                            links={orders.links}
                            from={orders.from}
                            to={orders.to}
                            total={orders.total}
                        />
                    </div>
                )}
            </Card>

            {/* ORDER DETAIL DRAWER / MODAL */}
            {detailOrder && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                        onClick={closeOrderDetail}
                    />

                    {/* Drawer panel */}
                    <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
                            {/* Drawer Header */}
                            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                                <div>
                                    <div className="flex items-center space-x-2.5">
                                        <h2 className="text-lg font-bold font-mono">
                                            {detailOrder.order_number}
                                        </h2>
                                        <Badge
                                            variant={
                                                STATUS_CONFIG[detailOrder.status]?.badgeVariant ||
                                                'neutral'
                                            }
                                            size="sm"
                                        >
                                            {STATUS_CONFIG[detailOrder.status]?.label ||
                                                detailOrder.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Placed on{' '}
                                        {new Date(detailOrder.created_at).toLocaleString('en-GB')}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <a
                                        href={`/admin/orders/${detailOrder.id}/invoice?type=thermal`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Print 80mm POS Slip"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </a>
                                    <a
                                        href={`/admin/orders/${detailOrder.id}/invoice?type=a4`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Print A4 Packing Slip"
                                    >
                                        <FileText className="w-4 h-4" />
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setSmsModalOpen(true)}
                                        className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Send Customer SMS Notification"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSingleDeleteOrder(detailOrder)}
                                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition-colors"
                                        title="Delete Order"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeOrderDetail}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Content Scrollable Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Courier Consignment & Dispatch Action Card */}
                                <div className="p-4 bg-primary-50/70 border border-primary-200 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2.5">
                                            <span className="p-2 bg-primary-600 text-white rounded-lg shadow-xs">
                                                <Truck className="w-4 h-4" />
                                            </span>
                                            <div>
                                                <div className="text-xs font-bold text-primary-950 uppercase tracking-wide flex items-center gap-1.5">
                                                    <span>
                                                        {detailOrder.courier_name
                                                            ? `${detailOrder.courier_name.toUpperCase()} COURIER`
                                                            : 'COURIER DISPATCH'}
                                                    </span>
                                                    {detailOrder.courier_tracking_id && (
                                                        <span className="inline-block px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 rounded font-semibold border border-emerald-300">
                                                            Booked
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-primary-700">
                                                    {detailOrder.courier_tracking_id
                                                        ? `Tracking ID: ${detailOrder.courier_tracking_id}`
                                                        : 'Ready to book parcel consignment with local courier'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {detailOrder.courier_tracking_id ? (
                                                <>
                                                    {detailOrder.courier_tracking_url && (
                                                        <a
                                                            href={detailOrder.courier_tracking_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-primary-700 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors shadow-2xs"
                                                            title="Track on Courier Portal"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                                            Track Online
                                                        </a>
                                                    )}
                                                    <button
                                                        type="button"
                                                        disabled={isTrackingLoading}
                                                        onClick={executeCourierTrack}
                                                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-2xs disabled:opacity-50"
                                                        title="Sync live status from courier"
                                                    >
                                                        <RefreshCw
                                                            className={`w-3.5 h-3.5 mr-1 ${isTrackingLoading ? 'animate-spin' : ''}`}
                                                        />
                                                        {isTrackingLoading
                                                            ? 'Syncing...'
                                                            : 'Sync Status'}
                                                    </button>
                                                </>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => setDispatchModalOpen(true)}
                                                    className="bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
                                                >
                                                    <Truck className="w-3.5 h-3.5 mr-1" />
                                                    Send to Courier
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tracking Feedback alert if present */}
                                    {trackingFeedback && (
                                        <div className="p-2.5 bg-white border border-primary-200 rounded-lg text-xs text-primary-900 flex items-start space-x-2">
                                            <AlertCircle className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold">
                                                    {trackingFeedback.message}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Re-dispatch link if already dispatched */}
                                    {detailOrder.courier_tracking_id && (
                                        <div className="pt-2 border-t border-primary-100 flex items-center justify-between text-[11px] text-primary-600">
                                            <span>Consignment details booked</span>
                                            <button
                                                type="button"
                                                onClick={() => setDispatchModalOpen(true)}
                                                className="underline hover:text-primary-800"
                                            >
                                                Re-dispatch or change courier &rarr;
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Customer SMS Notification Bar */}
                                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-emerald-950">
                                                Customer SMS Notification
                                            </p>
                                            <p className="text-[11px] text-emerald-700">
                                                Dispatch status SMS directly to customer (
                                                {detailOrder.customer_phone})
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSmsModalOpen(true)}
                                        className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 shadow-2xs"
                                    >
                                        <MessageSquare className="w-3 h-3 mr-1 text-emerald-600" />
                                        Send SMS
                                    </Button>
                                </div>

                                {/* Next Status Transition Action Bar */}
                                {currentAllowedTransitions.length > 0 && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center">
                                            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                                            Pipeline Transition Options
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {currentAllowedTransitions.map((nextStatus) => {
                                                const meta = STATUS_CONFIG[nextStatus];
                                                const isSelectedForAction =
                                                    targetTransitionStatus === nextStatus;

                                                return (
                                                    <button
                                                        key={nextStatus}
                                                        type="button"
                                                        onClick={() =>
                                                            setTargetTransitionStatus(
                                                                isSelectedForAction
                                                                    ? null
                                                                    : nextStatus
                                                            )
                                                        }
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                                            isSelectedForAction
                                                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        Mark as {meta?.label || nextStatus}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Confirmation & Comment Box */}
                                        {targetTransitionStatus && (
                                            <div className="mt-3.5 pt-3.5 border-t border-slate-200">
                                                <label
                                                    htmlFor="transition-comment-input"
                                                    className="block text-xs font-medium text-gray-700 mb-1"
                                                >
                                                    Transition Reason / Fulfillment Note (Optional)
                                                </label>
                                                <input
                                                    id="transition-comment-input"
                                                    type="text"
                                                    placeholder="e.g. Phone confirmed with customer, parcel handed to Steadfast rider..."
                                                    value={transitionComment}
                                                    onChange={(e) =>
                                                        setTransitionComment(e.target.value)
                                                    }
                                                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg mb-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() =>
                                                            setTargetTransitionStatus(null)
                                                        }
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="primary"
                                                        size="sm"
                                                        disabled={isTransitioning}
                                                        onClick={() =>
                                                            executeSingleTransition(
                                                                targetTransitionStatus
                                                            )
                                                        }
                                                    >
                                                        {isTransitioning ? (
                                                            'Updating...'
                                                        ) : (
                                                            <>
                                                                <Check className="w-3.5 h-3.5 mr-1" />
                                                                Confirm Status Change
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Customer & Delivery Snapshot */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                                            <UserIcon className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                            Customer Information
                                        </div>
                                        <p className="font-semibold text-gray-900 text-sm">
                                            {detailOrder.customer_name}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            <a
                                                href={`tel:${detailOrder.customer_phone}`}
                                                className="text-primary-600 hover:underline font-mono"
                                            >
                                                {detailOrder.customer_phone}
                                            </a>
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                                            <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                            Delivery Location
                                        </div>
                                        <p className="text-xs text-gray-800 font-medium">
                                            {detailOrder.delivery_address}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {detailOrder.upazila ? `${detailOrder.upazila}, ` : ''}
                                            {detailOrder.district}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment & Shipping Method Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                                        <div className="font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center">
                                            <CreditCard className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                            Payment Method
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-bold text-gray-900 uppercase">
                                                {detailOrder.payment_method}
                                            </span>
                                            <span
                                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                                    detailOrder.payment_status === 'paid'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : detailOrder.payment_status === 'pending_verification'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                {detailOrder.payment_status?.toUpperCase() || 'UNPAID'}
                                            </span>
                                        </div>
                                        {detailOrder.payment_transaction_id && (
                                            <div className="mt-1.5 text-gray-600 font-mono">
                                                TrxID: <span className="font-bold text-primary-700">{detailOrder.payment_transaction_id}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                                        <div className="font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center">
                                            <Truck className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                            Shipping Method
                                        </div>
                                        <div className="font-bold text-gray-900 mt-1">
                                            {detailOrder.shipping_method_name || 'Standard Delivery'}
                                        </div>
                                        <div className="text-gray-500 mt-0.5">
                                            Delivery Fee: {formatMoney(detailOrder.shipping_fee)}
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Notes if present */}
                                {detailOrder.notes && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                                        <span className="font-semibold">Customer Notes: </span>
                                        {detailOrder.notes}
                                    </div>
                                )}

                                {/* Order Items Breakdown */}
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                                        <Package className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                        Ordered Items & Pricing
                                    </h3>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 text-gray-600 uppercase font-medium border-b border-gray-200">
                                                <tr>
                                                    <th className="px-3 py-2">Item</th>
                                                    <th className="px-3 py-2 text-right">Price</th>
                                                    <th className="px-3 py-2 text-right">Qty</th>
                                                    <th className="px-3 py-2 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {detailOrder.items?.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="px-3 py-2.5">
                                                            <div className="font-medium text-gray-900">
                                                                {item.product_title}
                                                            </div>
                                                            {item.variant_name && (
                                                                <div className="text-[11px] text-gray-500">
                                                                    Variant: {item.variant_name}
                                                                </div>
                                                            )}
                                                            {item.is_restocked && (
                                                                <span className="inline-block mt-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                                                    Inventory Restocked
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right">
                                                            {formatMoney(item.unit_price)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-medium">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                                                            {formatMoney(item.total_price)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50 border-t border-gray-200 text-xs">
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="px-3 py-1.5 text-right text-gray-500"
                                                    >
                                                        Subtotal:
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right font-medium">
                                                        {formatMoney(detailOrder.subtotal)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="px-3 py-1.5 text-right text-gray-500"
                                                    >
                                                        Shipping Fee:
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right font-medium">
                                                        {formatMoney(detailOrder.shipping_fee)}
                                                    </td>
                                                </tr>
                                                {parseFloat(String(detailOrder.discount || 0)) >
                                                    0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={3}
                                                            className="px-3 py-1.5 text-right text-emerald-600 font-medium"
                                                        >
                                                            Discount:
                                                        </td>
                                                        <td className="px-3 py-1.5 text-right text-emerald-600 font-medium">
                                                            -{formatMoney(detailOrder.discount)}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className="font-bold text-sm text-gray-900 border-t border-gray-200">
                                                    <td
                                                        colSpan={3}
                                                        className="px-3 py-2 text-right"
                                                    >
                                                        Total Payable (COD):
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-primary-600">
                                                        {formatMoney(detailOrder.total)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Chronological Audit Trail Timeline */}
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                        <Layers className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                        Chronological Audit Trail & State Transitions
                                    </h3>

                                    {loadingTimeline ? (
                                        <div className="py-6 text-center text-xs text-gray-400">
                                            Loading audit trail...
                                        </div>
                                    ) : timeline.length === 0 ? (
                                        <div className="py-4 text-center text-xs text-gray-400">
                                            No audit entries recorded yet.
                                        </div>
                                    ) : (
                                        <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                            {timeline.map((node) => (
                                                <div key={node.id} className="relative group">
                                                    {/* Node bullet */}
                                                    <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary-500 group-hover:border-primary-600 transition-colors" />

                                                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs shadow-xs">
                                                        {/* Header: Status transition */}
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center space-x-1.5 font-medium">
                                                                {node.from_status ? (
                                                                    <>
                                                                        <span className="text-gray-500 uppercase text-[10px]">
                                                                            {node.from_status}
                                                                        </span>
                                                                        <ChevronRight className="w-3 h-3 text-gray-400" />
                                                                    </>
                                                                ) : (
                                                                    <span className="text-gray-400 text-[10px] italic">
                                                                        Order Placed &rarr;
                                                                    </span>
                                                                )}
                                                                <span className="font-semibold text-gray-900 uppercase text-[11px]">
                                                                    {node.to_status}
                                                                </span>
                                                            </div>
                                                            <span
                                                                className="text-[10px] text-gray-400"
                                                                title={node.created_at || ''}
                                                            >
                                                                {node.created_at_human ||
                                                                    node.created_at}
                                                            </span>
                                                        </div>

                                                        {/* Performer: User or System */}
                                                        <div className="flex items-center space-x-1 text-[11px] text-gray-500 mb-1">
                                                            {node.is_system ? (
                                                                <span className="inline-flex items-center text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                                                                    <Shield className="w-2.5 h-2.5 mr-1 text-slate-500" />
                                                                    System / Webhook
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center text-primary-700 bg-primary-50 px-1.5 py-0.2 rounded text-[10px]">
                                                                    <UserIcon className="w-2.5 h-2.5 mr-1 text-primary-600" />
                                                                    {node.user_name || 'Admin User'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Comment/Reason if present */}
                                                        {node.comment && (
                                                            <div className="mt-1 text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 font-sans text-xs">
                                                                {node.comment}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* COURIER DISPATCH MODAL */}
            {dispatchModalOpen && detailOrder && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                            onClick={() => setDispatchModalOpen(false)}
                        />

                        <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">
                                            Send Order to Courier
                                        </h3>
                                        <p className="text-xs text-gray-500 font-mono">
                                            #{detailOrder.order_number}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDispatchModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {dispatchError && (
                                <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                                    <span>{dispatchError}</span>
                                </div>
                            )}

                            <form onSubmit={executeCourierDispatch} className="space-y-4">
                                {/* Courier Driver Selection */}
                                <div>
                                    <label
                                        htmlFor="courier-driver-select"
                                        className="block text-xs font-semibold text-gray-700 mb-1"
                                    >
                                        Select Courier Gateway
                                    </label>
                                    <select
                                        id="courier-driver-select"
                                        value={selectedCourierDriver}
                                        onChange={(e) => setSelectedCourierDriver(e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        {courierConfig?.drivers ? (
                                            Object.entries(courierConfig.drivers).map(
                                                ([key, label]) => {
                                                    const isConfigured =
                                                        courierConfig.configured?.[key] ?? true;
                                                    return (
                                                        <option key={key} value={key}>
                                                            {label}{' '}
                                                            {isConfigured
                                                                ? ''
                                                                : '(Credentials Not Set)'}
                                                        </option>
                                                    );
                                                }
                                            )
                                        ) : (
                                            <>
                                                <option value="mock">
                                                    Mock Courier (Testing/Offline)
                                                </option>
                                                <option value="steadfast">Steadfast Courier</option>
                                                <option value="pathao">Pathao Courier</option>
                                                <option value="redx">RedX Courier</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Recipient Name */}
                                    <div>
                                        <label
                                            htmlFor="recipient-name"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Customer Name
                                        </label>
                                        <input
                                            id="recipient-name"
                                            type="text"
                                            required
                                            value={dispatchRecipientName}
                                            onChange={(e) =>
                                                setDispatchRecipientName(e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    {/* Recipient Phone */}
                                    <div>
                                        <label
                                            htmlFor="recipient-phone"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Customer Phone
                                        </label>
                                        <input
                                            id="recipient-phone"
                                            type="text"
                                            required
                                            value={dispatchRecipientPhone}
                                            onChange={(e) =>
                                                setDispatchRecipientPhone(e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                <div>
                                    <label
                                        htmlFor="recipient-address"
                                        className="block text-xs font-semibold text-gray-700 mb-1"
                                    >
                                        Delivery Address & District
                                    </label>
                                    <textarea
                                        id="recipient-address"
                                        rows={2}
                                        required
                                        value={dispatchRecipientAddress}
                                        onChange={(e) =>
                                            setDispatchRecipientAddress(e.target.value)
                                        }
                                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* COD Collection Amount */}
                                    <div>
                                        <label
                                            htmlFor="cod-amount"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            COD Collection (৳ BDT)
                                        </label>
                                        <input
                                            id="cod-amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={dispatchCodAmount}
                                            onChange={(e) => setDispatchCodAmount(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 font-mono"
                                        />
                                    </div>

                                    {/* Weight in kg */}
                                    <div>
                                        <label
                                            htmlFor="parcel-weight"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Weight (kg)
                                        </label>
                                        <input
                                            id="parcel-weight"
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            value={dispatchWeight}
                                            onChange={(e) => setDispatchWeight(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Special Notes */}
                                <div>
                                    <label
                                        htmlFor="dispatch-note"
                                        className="block text-xs font-semibold text-gray-700 mb-1"
                                    >
                                        Delivery Instructions / Note (Optional)
                                    </label>
                                    <input
                                        id="dispatch-note"
                                        type="text"
                                        placeholder="e.g. Call before delivery, fragile package"
                                        value={dispatchNote}
                                        onChange={(e) => setDispatchNote(e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setDispatchModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={isDispatching}
                                        className="bg-primary-600 hover:bg-primary-700 text-white"
                                    >
                                        {isDispatching ? (
                                            'Booking Consignment...'
                                        ) : (
                                            <>
                                                <Truck className="w-3.5 h-3.5 mr-1" />
                                                Confirm & Dispatch
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* SMS NOTIFICATION MODAL */}
            {smsModalOpen && detailOrder && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                            onClick={() => {
                                if (!isSmsSending) setSmsModalOpen(false);
                            }}
                        />

                        <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6">
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                                <div className="flex items-center space-x-2">
                                    <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                                        <MessageSquare className="w-5 h-5" />
                                    </span>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">
                                            Send SMS Notification
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Recipient: {detailOrder.customer_name} (
                                            {detailOrder.customer_phone})
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSmsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                    disabled={isSmsSending}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {smsError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{smsError}</span>
                                </div>
                            )}

                            <form onSubmit={executeSendSms}>
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="sms-gateway-driver"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            SMS Gateway Provider
                                        </label>
                                        <select
                                            id="sms-gateway-driver"
                                            value={selectedSmsDriver}
                                            onChange={(e) => setSelectedSmsDriver(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            {smsConfig?.drivers ? (
                                                Object.entries(smsConfig.drivers).map(
                                                    ([driverKey, driverLabel]) => {
                                                        const isConfigured =
                                                            smsConfig.configured?.[driverKey] ??
                                                            false;
                                                        return (
                                                            <option
                                                                key={driverKey}
                                                                value={driverKey}
                                                            >
                                                                {driverLabel}
                                                                {driverKey === 'mock'
                                                                    ? ' (Simulation)'
                                                                    : isConfigured
                                                                      ? ' (Ready)'
                                                                      : ' (Missing Credentials)'}
                                                            </option>
                                                        );
                                                    }
                                                )
                                            ) : (
                                                <>
                                                    <option value="mock">
                                                        Mock SMS (Local Simulation)
                                                    </option>
                                                    <option value="greenweb">Greenweb SMS</option>
                                                    <option value="sslwireless">
                                                        SSL Wireless SMS
                                                    </option>
                                                    <option value="smspoh">SMSPoh</option>
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="sms-notification-template"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Notification Template
                                        </label>
                                        <select
                                            id="sms-notification-template"
                                            value={selectedSmsTemplate}
                                            onChange={(e) => setSelectedSmsTemplate(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="order_placed">
                                                Order Placed Template
                                            </option>
                                            <option value="order_confirmed">
                                                Order Confirmed Template
                                            </option>
                                            <option value="out_for_delivery">
                                                Out For Delivery Template
                                            </option>
                                            <option value="custom">Custom Message (Manual)</option>
                                        </select>
                                    </div>

                                    {selectedSmsTemplate === 'custom' && (
                                        <div>
                                            <label
                                                htmlFor="sms-custom-message"
                                                className="block text-xs font-semibold text-gray-700 mb-1"
                                            >
                                                Custom Message Content
                                            </label>
                                            <textarea
                                                id="sms-custom-message"
                                                rows={4}
                                                value={smsCustomMessage}
                                                onChange={(e) =>
                                                    setSmsCustomMessage(e.target.value)
                                                }
                                                placeholder="Write custom SMS message for the customer..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-gray-700">
                                                Message Preview
                                            </span>
                                            <span className="text-[11px] text-gray-400 font-mono">
                                                {
                                                    getPreviewMessage(
                                                        selectedSmsTemplate,
                                                        detailOrder
                                                    ).length
                                                }{' '}
                                                chars (~
                                                {Math.max(
                                                    1,
                                                    Math.ceil(
                                                        getPreviewMessage(
                                                            selectedSmsTemplate,
                                                            detailOrder
                                                        ).length / 160
                                                    )
                                                )}{' '}
                                                SMS)
                                            </span>
                                        </div>
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
                                            {getPreviewMessage(
                                                selectedSmsTemplate,
                                                detailOrder
                                            ) || (
                                                <span className="text-gray-400 italic">
                                                    No message content
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSmsModalOpen(false)}
                                        disabled={isSmsSending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={
                                            isSmsSending ||
                                            !getPreviewMessage(
                                                selectedSmsTemplate,
                                                detailOrder
                                            ).trim()
                                        }
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {isSmsSending ? (
                                            'Dispatching SMS...'
                                        ) : (
                                            <>
                                                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                                Send SMS Now
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* BULK STATUS UPDATE MODAL */}
            {bulkModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                            onClick={() => setBulkModalOpen(false)}
                        />

                        <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full p-6">
                            <h3 className="text-base font-bold text-gray-900 mb-1">
                                Bulk Update Order Status
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Update pipeline status for {selectedIds.length} selected order(s).
                                State transition rules and restocking protections will be strictly
                                applied.
                            </p>

                            <form onSubmit={executeBulkTransition}>
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="bulk-target-status"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Target Pipeline Status
                                        </label>
                                        <select
                                            id="bulk-target-status"
                                            value={bulkTargetStatus}
                                            onChange={(e) => setBulkTargetStatus(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            {ALL_STATUS_KEYS.map((k) => (
                                                <option key={k} value={k}>
                                                    {STATUS_CONFIG[k]?.label || k}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="bulk-comment-input"
                                            className="block text-xs font-semibold text-gray-700 mb-1"
                                        >
                                            Optional Reason / Note
                                        </label>
                                        <textarea
                                            id="bulk-comment-input"
                                            rows={2}
                                            placeholder="e.g. Batch dispatched with courier, bulk call verification..."
                                            value={bulkComment}
                                            onChange={(e) => setBulkComment(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-6 flex items-center justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="md"
                                        onClick={() => setBulkModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="md"
                                        disabled={isBulkSubmitting}
                                    >
                                        {isBulkSubmitting ? (
                                            'Applying...'
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                                Apply to {selectedIds.length} Order(s)
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* BULK / SINGLE ORDER DELETE CONFIRMATION MODAL */}
            {(bulkDeleteModalOpen || singleDeleteOrder) && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                            onClick={() => {
                                if (!isDeletingOrders) {
                                    setBulkDeleteModalOpen(false);
                                    setSingleDeleteOrder(null);
                                }
                            }}
                        />

                        <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full p-6">
                            <div className="flex items-start space-x-3.5">
                                <div className="p-2.5 rounded-full bg-rose-50 text-rose-600 shrink-0">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-gray-900">
                                        {singleDeleteOrder
                                            ? `Delete Order ${singleDeleteOrder.order_number}?`
                                            : `Delete ${selectedIds.length} Selected Order(s)?`}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                        {singleDeleteOrder
                                            ? `Are you sure you want to permanently delete order ${singleDeleteOrder.order_number} (${singleDeleteOrder.customer_name})? Un-restocked items for non-delivered orders will be restored to stock, and all order items & history logs will be removed.`
                                            : `Are you sure you want to permanently delete ${selectedIds.length} selected order(s)? Un-restocked items for non-delivered orders will be restored to stock, and all order items & history logs will be removed.`}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end space-x-2.5 pt-4 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={isDeletingOrders}
                                    onClick={() => {
                                        setBulkDeleteModalOpen(false);
                                        setSingleDeleteOrder(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    isLoading={isDeletingOrders}
                                    onClick={
                                        singleDeleteOrder
                                            ? executeSingleDelete
                                            : executeBulkDelete
                                    }
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    {singleDeleteOrder
                                        ? 'Delete Order'
                                        : `Delete ${selectedIds.length} Order(s)`}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
