<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Actions;

use App\Modules\Catalog\Models\ProductVariant;
use App\Modules\Checkout\Exceptions\InsufficientStockException;
use App\Modules\Checkout\Rules\BdPhoneRule;
use App\Modules\Checkout\Services\BlacklistService;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderHistory;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Orders\Models\OrderStatus;
use App\Modules\Payments\Models\PaymentMethod;
use App\Modules\Shipping\Services\ShippingCalculatorService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class ProcessCodOrderAction
{
    public function __construct(
        protected ShippingCalculatorService $shippingCalculator,
        protected ?BlacklistService $blacklistService = null
    ) {
        $this->blacklistService = $blacklistService ?? app(BlacklistService::class);
    }

    /**
     * @param array{
     *     customer_name: string,
     *     customer_phone: string,
     *     delivery_address: string,
     *     district: string,
     *     upazila?: string|null,
     *     idempotency_key: string,
     *     landing_page_id?: int|null,
     *     customer_id?: int|null,
     *     notes?: string|null,
     *     discount?: float|string|int|null,
     *     items: array<int, array{
     *         variant_id: int,
     *         quantity: int
     *     }>
     * } $data
     */
    public function execute(array $data, ?string $ipAddress = null): Order
    {
        // 1. Customer validation
        if (empty(trim($data['customer_name'] ?? ''))) {
            throw new InvalidArgumentException('Customer name is required.');
        }

        $rawPhone = (string) ($data['customer_phone'] ?? '');
        if (! preg_match(BdPhoneRule::PATTERN, trim($rawPhone))) {
            throw new InvalidArgumentException('A valid 11-digit Bangladeshi mobile number is required.');
        }
        $normalizedPhone = BdPhoneRule::normalize($rawPhone);

        if ($this->blacklistService->isBlacklisted($normalizedPhone)) {
            throw new InvalidArgumentException('This phone number is blocked from placing orders.');
        }

        if (empty(trim($data['delivery_address'] ?? ''))) {
            throw new InvalidArgumentException('Delivery address is required.');
        }

        if (empty(trim($data['district'] ?? ''))) {
            throw new InvalidArgumentException('District is required.');
        }

        $idempotencyKey = trim((string) ($data['idempotency_key'] ?? ''));
        if (empty($idempotencyKey)) {
            throw new InvalidArgumentException('Idempotency key is required.');
        }

        if (empty($data['items']) || ! is_array($data['items'])) {
            throw new InvalidArgumentException('Order must contain at least one item.');
        }

        // 2. Anti-duplicate / Idempotency check before lock
        $existingOrder = Order::with('items')->where('idempotency_key', $idempotencyKey)->first();
        if ($existingOrder) {
            return $existingOrder;
        }

        // 3. Atomic Cache Lock to serialize duplicate rapid submissions for the same client
        $lockKey = "checkout:{$normalizedPhone}:{$idempotencyKey}";
        $lock = Cache::lock($lockKey, 15);

        // Attempt to acquire lock; block up to 5 seconds
        $acquired = $lock->block(5);
        if (! $acquired) {
            $existingOrder = Order::with('items')->where('idempotency_key', $idempotencyKey)->first();
            if ($existingOrder) {
                return $existingOrder;
            }
            throw new InvalidArgumentException('A request with this idempotency key is currently being processed.');
        }

        try {
            // Re-check after lock acquired in case another thread just completed it
            $existingOrder = Order::with('items')->where('idempotency_key', $idempotencyKey)->first();
            if ($existingOrder) {
                return $existingOrder;
            }

            // 4. Shipping calculation
            $shippingResult = $this->shippingCalculator->calculate(
                $data['district'],
                $data['upazila'] ?? null,
                isset($data['shipping_method_id']) ? (int) $data['shipping_method_id'] : null
            );
            $shippingFee = $shippingResult->shippingFee;
            $shippingMethodId = $shippingResult->shippingMethodId;
            $shippingMethodName = $shippingResult->shippingMethodName;

            // 5. Payment method resolution & verification
            $paymentCode = ! empty($data['payment_method']) ? (string) $data['payment_method'] : 'cod';
            $paymentMethod = PaymentMethod::where('code', $paymentCode)->first();

            if (! $paymentMethod && $paymentCode === 'cod') {
                $paymentMethod = PaymentMethod::firstOrCreate(
                    ['code' => 'cod'],
                    [
                        'name' => 'Cash on Delivery',
                        'description' => 'Pay cash upon delivery at your doorstep.',
                        'instructions' => 'Keep the exact cash amount ready for the delivery courier.',
                        'is_active' => true,
                        'is_online' => false,
                        'requires_transaction_id' => false,
                        'sort_order' => 1,
                    ]
                );
            }

            if (! $paymentMethod || ! $paymentMethod->is_active) {
                throw new InvalidArgumentException('Selected payment method is unavailable.');
            }

            $paymentTrxId = isset($data['payment_transaction_id']) && trim((string) $data['payment_transaction_id']) !== ''
                ? trim((string) $data['payment_transaction_id'])
                : null;

            if ($paymentMethod->requires_transaction_id && empty($paymentTrxId)) {
                throw new InvalidArgumentException("Transaction ID (TrxID) is required for {$paymentMethod->name}.");
            }

            // Payment status integrity: COD is 'unpaid'. Manual MFS is 'pending_verification'.
            // Never mark as 'paid' without verified gateway integration.
            $paymentStatus = $paymentMethod->requires_transaction_id ? 'pending_verification' : 'unpaid';

            $paymentDetails = [
                'code' => $paymentMethod->code,
                'name' => $paymentMethod->name,
                'account_number' => $paymentMethod->account_number,
                'requires_transaction_id' => $paymentMethod->requires_transaction_id,
                'is_online' => $paymentMethod->is_online,
            ];

            // 6. Database transaction with pessimistic row locks
            return DB::transaction(function () use (
                $data,
                $normalizedPhone,
                $idempotencyKey,
                $shippingFee,
                $shippingMethodId,
                $shippingMethodName,
                $paymentMethod,
                $paymentStatus,
                $paymentTrxId,
                $paymentDetails,
                $ipAddress
            ): Order {
                // Double check inside transaction for race-condition resilience
                $existingOrder = Order::with('items')->where('idempotency_key', $idempotencyKey)->first();
                if ($existingOrder) {
                    return $existingOrder;
                }

                // Sort items by variant_id to avoid deadlocks in concurrent transactions
                $items = collect($data['items'])->sortBy('variant_id')->values()->all();

                $subtotal = 0.0;
                $orderItemsData = [];

                foreach ($items as $item) {
                    $variantId = (int) $item['variant_id'];
                    $quantity = (int) ($item['quantity'] ?? 1);

                    if ($quantity < 1) {
                        throw new InvalidArgumentException('Item quantity must be at least 1.');
                    }

                    // Acquire pessimistic row lock
                    /** @var ProductVariant $variant */
                    $variant = ProductVariant::where('id', $variantId)
                        ->lockForUpdate()
                        ->firstOrFail();

                    if ($variant->manage_stock && $variant->stock_quantity < $quantity) {
                        throw new InsufficientStockException(
                            message: "Stock exhausted for '{$variant->name}'. Available: {$variant->stock_quantity}, requested: {$quantity}",
                            variantId: $variant->id,
                            available: $variant->stock_quantity,
                            requested: $quantity
                        );
                    }

                    if ($variant->manage_stock) {
                        $variant->decrement('stock_quantity', $quantity);
                    }

                    // Calculate price snapshot
                    $unitPrice = (float) ($variant->sale_price ?? $variant->regular_price);
                    $totalItemPrice = $unitPrice * $quantity;
                    $subtotal += $totalItemPrice;

                    $comboSummary = isset($item['combo_summary']) && trim((string) $item['combo_summary']) !== ''
                        ? trim((string) $item['combo_summary'])
                        : null;

                    $orderItemsData[] = [
                        'product_id' => $variant->product_id,
                        'variant_id' => $variant->id,
                        'product_title' => $variant->product ? $variant->product->title : 'Product',
                        'variant_name' => $comboSummary ?: $variant->name,
                        'unit_price' => $unitPrice,
                        'quantity' => $quantity,
                        'total_price' => $totalItemPrice,
                        'is_restocked' => false,
                    ];
                }

                $discount = isset($data['discount']) && $data['discount'] !== null
                    ? (float) $data['discount']
                    : 0.00;

                $total = max(0.00, $subtotal + $shippingFee - $discount);
                $orderNumber = $this->generateUniqueOrderNumber();
                $rawTrackingToken = bin2hex(random_bytes(32));
                $trackingTokenHash = hash('sha256', $rawTrackingToken);

                $order = Order::create([
                    'order_number' => $orderNumber,
                    'idempotency_key' => $idempotencyKey,
                    'tracking_token_hash' => $trackingTokenHash,
                    'landing_page_id' => $data['landing_page_id'] ?? null,
                    'customer_id' => $data['customer_id'] ?? null,
                    'customer_name' => trim($data['customer_name']),
                    'customer_phone' => $normalizedPhone,
                    'delivery_address' => trim($data['delivery_address']),
                    'district' => trim($data['district']),
                    'upazila' => ! empty($data['upazila']) ? trim($data['upazila']) : null,
                    'subtotal' => $subtotal,
                    'shipping_fee' => $shippingFee,
                    'shipping_method_id' => $shippingMethodId,
                    'shipping_method_name' => $shippingMethodName,
                    'discount' => $discount,
                    'total' => $total,
                    'payment_method' => $paymentMethod->code,
                    'payment_status' => $paymentStatus,
                    'payment_transaction_id' => $paymentTrxId,
                    'payment_details' => $paymentDetails,
                    'status' => OrderStatus::PENDING,
                    'notes' => $data['notes'] ?? null,
                    'ip_address' => $ipAddress,
                ]);

                $order->setAttribute('tracking_token', $rawTrackingToken);

                foreach ($orderItemsData as $itemData) {
                    $itemData['order_id'] = $order->id;
                    OrderItem::create($itemData);
                }

                $historyComment = $paymentMethod->code === 'cod'
                    ? 'Order placed via Cash on Delivery.'
                    : "Order placed via {$paymentMethod->name} (TrxID: {$paymentTrxId}). Awaiting manual verification.";

                OrderHistory::create([
                    'order_id' => $order->id,
                    'from_status' => null,
                    'to_status' => OrderStatus::PENDING,
                    'comment' => $historyComment,
                    'user_id' => null,
                ]);

                return $order->load('items');
            });
        } finally {
            $lock->release();
        }
    }

    /**
     * Generate an alphanumeric human-readable unique order number: ORD-YYYYMMDD-XXXXXX
     */
    protected function generateUniqueOrderNumber(): string
    {
        $prefix = 'ORD-'.date('Ymd').'-';

        do {
            $candidate = $prefix.strtoupper(Str::random(6));
        } while (Order::where('order_number', $candidate)->exists());

        return $candidate;
    }
}
