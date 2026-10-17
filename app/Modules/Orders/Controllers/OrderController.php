<?php

declare(strict_types=1);

namespace App\Modules\Orders\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Orders\Exceptions\InvalidOrderStateTransitionException;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Orders\Requests\BulkTransitionOrderRequest;
use App\Modules\Orders\Requests\TransitionOrderRequest;
use App\Modules\Orders\Services\BarcodeGeneratorService;
use App\Modules\Orders\Services\OrderStateMachine;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderController extends Controller
{
    public function __construct(
        protected OrderStateMachine $stateMachine,
        protected BarcodeGeneratorService $barcodeGenerator
    ) {}

    /**
     * Display a paginated listing of orders with multi-parameter filtering and status counts.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Order::class);

        $query = $this->buildFilteredQuery($request);

        // Calculate counts for all 9 states and overall total for tab pills
        $statusCounts = [
            'all' => Order::query()->count(),
        ];
        foreach (OrderStatus::all() as $status) {
            $statusCounts[$status] = Order::query()->where('status', $status)->count();
        }

        $orders = $query->with([
            'items',
            'latestHistory',
        ])
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
            ],
            'statusCounts' => $statusCounts,
            'allowedTransitions' => OrderStateMachine::ALLOWED_TRANSITIONS,
        ]);
    }

    /**
     * Display detailed order view including timeline. Returns JSON for drawers/modals when requested.
     */
    public function show(Order $order, Request $request): JsonResponse|Response
    {
        Gate::authorize('view', $order);

        $order->load(['items', 'histories.user']);
        $timeline = $order->getTimeline();

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'order' => $order,
                'timeline' => $timeline,
            ]);
        }

        // Return Inertia page if direct browser request
        return Inertia::render('Admin/Orders/Show', [
            'order' => $order,
            'timeline' => $timeline,
            'allowedTransitions' => $this->stateMachine->getAllowedTransitions($order->status),
        ]);
    }

    /**
     * Execute a single order status transition with strict state guards and audit trail.
     */
    public function transition(Order $order, TransitionOrderRequest $request): RedirectResponse|JsonResponse
    {
        Gate::authorize('update', $order);

        $toStatus = (string) $request->input('status');
        $comment = $request->input('comment');

        try {
            $updatedOrder = $this->stateMachine->transition(
                $order,
                $toStatus,
                $comment ? (string) $comment : null,
                $request->user()
            );

            $statusLabel = strtoupper(str_replace('_', ' ', $toStatus));
            $message = "Order {$updatedOrder->order_number} status updated to {$statusLabel}.";

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'order' => $updatedOrder->load('items'),
                    'timeline' => $updatedOrder->getTimeline(),
                ]);
            }

            return back()->with('success', $message);
        } catch (InvalidOrderStateTransitionException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['status' => $e->getMessage()]);
        }
    }

    /**
     * Execute bulk order status transitions with per-order safety and detailed failure reporting.
     */
    public function bulkTransition(BulkTransitionOrderRequest $request): RedirectResponse|JsonResponse
    {
        Gate::authorize('viewAny', Order::class);

        /** @var list<int> $orderIds */
        $orderIds = $request->input('order_ids', []);
        $toStatus = (string) $request->input('status');
        $comment = $request->input('comment');

        $orders = Order::whereIn('id', $orderIds)->get();

        $successful = [];
        $failures = [];

        foreach ($orders as $order) {
            try {
                $this->stateMachine->transition(
                    $order,
                    $toStatus,
                    $comment ? (string) $comment : null,
                    $request->user()
                );
                $successful[] = $order->order_number;
            } catch (InvalidOrderStateTransitionException $e) {
                $failures[] = [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'from_status' => $order->status,
                    'reason' => $e->getMessage(),
                ];
            }
        }

        $successCount = count($successful);
        $failureCount = count($failures);

        if ($failureCount === 0) {
            $statusLabel = strtoupper(str_replace('_', ' ', $toStatus));
            $msg = "Successfully updated {$successCount} order(s) to {$statusLabel}.";

            if ($request->wantsJson()) {
                return response()->json(['success' => true, 'message' => $msg, 'successful' => $successful]);
            }

            return back()->with('success', $msg);
        }

        $failureDetails = array_map(
            fn (array $f) => "{$f['order_number']} ({$f['reason']})",
            $failures
        );

        $msg = "Updated {$successCount} order(s). {$failureCount} failed: ".implode(', ', $failureDetails);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => $successCount > 0,
                'message' => $msg,
                'successful_count' => $successCount,
                'failure_count' => $failureCount,
                'failures' => $failures,
            ], 422);
        }

        if ($successCount > 0) {
            return back()->with('warning', $msg);
        }

        return back()->withErrors(['status' => $msg]);
    }

    /**
     * Export filtered orders to CSV with UTF-8 BOM encoding for Excel compatibility.
     */
    public function export(Request $request): StreamedResponse
    {
        Gate::authorize('export', Order::class);

        $query = $this->buildFilteredQuery($request)->with('items')->latest('id');

        $filename = 'orders-export-'.date('Ymd-His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query) {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            // UTF-8 BOM for Microsoft Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            // CSV Column Headers
            fputcsv($handle, [
                'Order Number',
                'Date',
                'Status',
                'Customer Name',
                'Customer Phone',
                'Delivery Address',
                'District',
                'Upazila',
                'Items Count',
                'Items Summary',
                'Subtotal (BDT)',
                'Shipping Fee (BDT)',
                'Discount (BDT)',
                'Total Payable (BDT)',
                'Payment Method',
                'Customer Notes',
            ]);

            $query->chunk(200, function ($orders) use ($handle) {
                foreach ($orders as $order) {
                    $itemsSummary = $order->items->map(function (OrderItem $item) {
                        $desc = "{$item->quantity}x {$item->product_title}";
                        if ($item->variant_name) {
                            $desc .= " ({$item->variant_name})";
                        }

                        return $desc;
                    })->implode('; ');

                    fputcsv($handle, [
                        $order->order_number,
                        $order->created_at?->format('Y-m-d H:i:s'),
                        strtoupper($order->status),
                        $order->customer_name,
                        $order->customer_phone,
                        $order->delivery_address,
                        $order->district,
                        $order->upazila ?? '',
                        $order->items->sum('quantity'),
                        $itemsSummary,
                        number_format((float) $order->subtotal, 2, '.', ''),
                        number_format((float) $order->shipping_fee, 2, '.', ''),
                        number_format((float) $order->discount, 2, '.', ''),
                        number_format((float) $order->total, 2, '.', ''),
                        strtoupper($order->payment_method),
                        $order->notes ?? '',
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Render standalone printable 80mm thermal receipt or A4 packing slip.
     */
    public function invoice(Order $order, Request $request): HttpResponse
    {
        Gate::authorize('view', $order);

        $order->load('items');
        $type = $request->query('type') === 'a4' ? 'a4' : 'thermal';

        // Generate vector SVG barcode for order number
        $barcodeSvg = $this->barcodeGenerator->generateSvg(
            $order->order_number,
            $type === 'thermal' ? 44 : 54,
            2,
            true
        );

        return response()->view('admin.orders.invoice', [
            'order' => $order,
            'type' => $type,
            'barcodeSvg' => $barcodeSvg,
        ]);
    }

    /**
     * Build the filtered order query based on request parameters.
     *
     * @return Builder<Order>
     */
    protected function buildFilteredQuery(Request $request): Builder
    {
        $query = Order::query();

        // Search by order number, customer name, customer phone
        if ($search = $request->input('search')) {
            $term = trim((string) $search);
            $query->where(function (Builder $q) use ($term) {
                $q->where('order_number', 'like', "%{$term}%")
                    ->orWhere('customer_name', 'like', "%{$term}%")
                    ->orWhere('customer_phone', 'like', "%{$term}%");
            });
        }

        // Status tab filter
        if ($status = $request->input('status')) {
            if ($status !== 'all' && in_array($status, OrderStatus::all(), true)) {
                $query->where('status', $status);
            }
        }

        // Date-from filter
        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', (string) $dateFrom);
        }

        // Date-to filter
        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', (string) $dateTo);
        }

        return $query;
    }
}
