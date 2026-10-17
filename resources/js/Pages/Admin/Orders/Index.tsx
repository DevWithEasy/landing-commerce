import { Head, router } from '@inertiajs/react';
import {
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Download,
    Eye,
    FileText,
    Filter,
    Layers,
    MapPin,
    Package,
    Phone,
    Printer,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    ShoppingBag,
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

    // Order detail drawer state
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const [timeline, setTimeline] = useState<OrderTimelineNode[]>([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);

    // Single order transition modal/drawer state
    const [targetTransitionStatus, setTargetTransitionStatus] = useState<string | null>(null);
    const [transitionComment, setTransitionComment] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);

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
                                                <div className="text-[11px] text-gray-400 uppercase tracking-wider">
                                                    {order.payment_method}
                                                </div>
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
                                        onClick={closeOrderDetail}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Content Scrollable Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
        </AdminLayout>
    );
}
