<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - {{ $order->order_number }}</title>
    <style>
        /* Base styles */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            background-color: #f3f4f6;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* Screen toolbar */
        .no-print {
            background-color: #1e293b;
            color: #f8fafc;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .btn {
            display: inline-flex;
            align-items: center;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            text-decoration: none;
            transition: background-color 0.15s ease;
        }
        .btn-primary {
            background-color: #2563eb;
            color: #ffffff;
        }
        .btn-primary:hover {
            background-color: #1d4ed8;
        }
        .btn-secondary {
            background-color: #334155;
            color: #f8fafc;
            margin-right: 8px;
        }
        .btn-secondary:hover {
            background-color: #475569;
        }

        /* Mode: 80mm Thermal Receipt */
        @if($type === 'thermal')
        .invoice-container {
            width: 80mm;
            max-width: 80mm;
            margin: 20px auto;
            background: #ffffff;
            padding: 12px 10px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.35;
        }
        .header {
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px dashed #4b5563;
            margin-bottom: 8px;
        }
        .store-name {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .store-sub {
            font-size: 10px;
            color: #4b5563;
            margin-top: 2px;
        }
        .meta-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }
        .divider {
            border-top: 1px dashed #4b5563;
            margin: 8px 0;
        }
        .customer-section {
            margin-bottom: 8px;
        }
        .customer-title {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            margin-bottom: 2px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
        }
        .items-table th {
            text-align: left;
            border-bottom: 1px dashed #4b5563;
            padding: 4px 0;
            font-size: 10px;
            text-transform: uppercase;
        }
        .items-table th.right, .items-table td.right {
            text-align: right;
        }
        .items-table td {
            padding: 4px 0;
            vertical-align: top;
        }
        .totals-section {
            border-top: 1px dashed #4b5563;
            padding-top: 6px;
        }
        .grand-total {
            font-size: 14px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px solid #000;
        }
        .barcode-wrap {
            text-align: center;
            margin: 10px 0 6px 0;
        }
        .barcode-wrap svg {
            max-width: 100%;
            height: auto;
        }
        .footer-note {
            text-align: center;
            font-size: 10px;
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px dashed #4b5563;
            color: #4b5563;
        }

        @media print {
            body {
                background: #ffffff;
            }
            .no-print {
                display: none !important;
            }
            .invoice-container {
                width: 72mm;
                max-width: 72mm;
                margin: 0;
                padding: 4mm 2mm;
                box-shadow: none;
            }
            @page {
                size: 80mm auto;
                margin: 0;
            }
        }

        /* Mode: Standard A4 Packing Slip / Invoice */
        @else
        .invoice-container {
            max-width: 800px;
            margin: 30px auto;
            background: #ffffff;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            font-size: 13px;
            line-height: 1.5;
            color: #1f2937;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 24px;
            margin-bottom: 24px;
        }
        .store-name {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        .store-sub {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h1 {
            font-size: 20px;
            font-weight: 700;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .order-meta {
            text-align: right;
            margin-top: 6px;
            font-size: 12px;
            color: #4b5563;
        }
        .columns {
            display: flex;
            justify-content: space-between;
            margin-bottom: 28px;
            gap: 20px;
        }
        .column {
            flex: 1;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
        }
        .column-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
        }
        .customer-name {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }
        .items-table th {
            background-color: #f1f5f9;
            text-align: left;
            padding: 10px 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #475569;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #cbd5e1;
        }
        .items-table th.right, .items-table td.right {
            text-align: right;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
        }
        .variant-tag {
            display: inline-block;
            font-size: 11px;
            color: #64748b;
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 2px;
        }
        .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
        }
        .barcode-wrap {
            flex: 1;
            padding: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            text-align: center;
        }
        .barcode-wrap svg {
            max-width: 100%;
            height: auto;
        }
        .totals-table {
            width: 280px;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 6px 0;
        }
        .totals-table td.right {
            text-align: right;
            font-weight: 600;
        }
        .grand-total-row td {
            border-top: 2px solid #0f172a;
            padding-top: 8px;
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
        }
        .footer-note {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
        }

        @media print {
            body {
                background: #ffffff;
            }
            .no-print {
                display: none !important;
            }
            .invoice-container {
                max-width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none;
            }
            @page {
                size: A4 portrait;
                margin: 15mm;
            }
        }
        @endif
    </style>
</head>
<body>
    {{-- On-screen action toolbar --}}
    <div class="no-print">
        <div>
            <strong>{{ $order->order_number }}</strong>
            <span style="opacity: 0.7; margin-left: 8px;">
                Mode: {{ $type === 'thermal' ? '80mm POS Receipt' : 'A4 Packing Slip' }}
            </span>
        </div>
        <div>
            @if($type === 'thermal')
                <a href="{{ route('admin.orders.invoice', ['order' => $order->id, 'type' => 'a4']) }}" class="btn btn-secondary">
                    Switch to A4 Slip
                </a>
            @else
                <a href="{{ route('admin.orders.invoice', ['order' => $order->id, 'type' => 'thermal']) }}" class="btn btn-secondary">
                    Switch to 80mm POS
                </a>
            @endif
            <button onclick="window.print()" class="btn btn-primary">
                Print Invoice
            </button>
        </div>
    </div>

    {{-- Printable container --}}
    <div class="invoice-container">
        @if($type === 'thermal')
            {{-- 80mm POS Format --}}
            <div class="header">
                <div class="store-name">{{ config('app.name', 'Landing Commerce') }}</div>
                <div class="store-sub">Cash on Delivery Invoice</div>
            </div>

            <div class="meta-line">
                <span>Order No:</span>
                <strong>{{ $order->order_number }}</strong>
            </div>
            <div class="meta-line">
                <span>Date:</span>
                <span>{{ $order->created_at?->format('d M Y, h:i A') }}</span>
            </div>
            <div class="meta-line">
                <span>Payment:</span>
                <strong>COD (Cash on Delivery)</strong>
            </div>
            <div class="meta-line">
                <span>Status:</span>
                <span>{{ strtoupper($order->status) }}</span>
            </div>

            <div class="divider"></div>

            <div class="customer-section">
                <div class="customer-title">Delivery To:</div>
                <div style="font-weight: bold;">{{ $order->customer_name }}</div>
                <div>Phone: {{ $order->customer_phone }}</div>
                <div>Address: {{ $order->delivery_address }}</div>
                <div>Location: {{ $order->upazila ? $order->upazila . ', ' : '' }}{{ $order->district }}</div>
                @if($order->notes)
                    <div style="margin-top: 3px; font-style: italic;">Note: {{ $order->notes }}</div>
                @endif
            </div>

            <div class="divider"></div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="right">Qty</th>
                        <th class="right">Price</th>
                        <th class="right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($order->items as $item)
                        <tr>
                            <td>
                                <div>{{ $item->product_title }}</div>
                                @if($item->variant_name)
                                    <div style="font-size: 9px; color: #4b5563;">({{ $item->variant_name }})</div>
                                @endif
                            </td>
                            <td class="right">{{ $item->quantity }}</td>
                            <td class="right">৳{{ number_format((float) $item->unit_price, 2) }}</td>
                            <td class="right">৳{{ number_format((float) $item->total_price, 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="totals-section">
                <div class="meta-line">
                    <span>Subtotal:</span>
                    <span>৳{{ number_format((float) $order->subtotal, 2) }}</span>
                </div>
                <div class="meta-line">
                    <span>Shipping Fee:</span>
                    <span>৳{{ number_format((float) $order->shipping_fee, 2) }}</span>
                </div>
                @if((float) $order->discount > 0)
                    <div class="meta-line">
                        <span>Discount:</span>
                        <span>-৳{{ number_format((float) $order->discount, 2) }}</span>
                    </div>
                @endif
                <div class="grand-total">
                    <span>TOTAL PAYABLE:</span>
                    <span>৳{{ number_format((float) $order->total, 2) }}</span>
                </div>
            </div>

            <div class="barcode-wrap">
                {!! $barcodeSvg !!}
            </div>

            <div class="footer-note">
                Thank you for your order!<br>
                Please keep this receipt for order verification upon delivery.
            </div>

        @else
            {{-- Standard A4 Packing Slip / Invoice --}}
            <div class="header">
                <div>
                    <div class="store-name">{{ config('app.name', 'Landing Commerce') }}</div>
                    <div class="store-sub">Official Merchant Packing Slip & Delivery Invoice</div>
                </div>
                <div class="invoice-title">
                    <h1>INVOICE</h1>
                    <div class="order-meta">
                        <div><strong>Order #:</strong> {{ $order->order_number }}</div>
                        <div><strong>Date:</strong> {{ $order->created_at?->format('d M Y, h:i A') }}</div>
                        <div><strong>Payment Method:</strong> Cash on Delivery</div>
                        <div><strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold;">{{ str_replace('_', ' ', $order->status) }}</span></div>
                    </div>
                </div>
            </div>

            <div class="columns">
                <div class="column">
                    <div class="column-title">Customer & Delivery Details</div>
                    <div class="customer-name">{{ $order->customer_name }}</div>
                    <div style="margin-top: 4px;"><strong>Phone:</strong> {{ $order->customer_phone }}</div>
                    <div style="margin-top: 2px;"><strong>Address:</strong> {{ $order->delivery_address }}</div>
                    <div style="margin-top: 2px;"><strong>District:</strong> {{ $order->district }}</div>
                    @if($order->upazila)
                        <div style="margin-top: 2px;"><strong>Upazila / Thana:</strong> {{ $order->upazila }}</div>
                    @endif
                </div>
                <div class="column">
                    <div class="column-title">Fulfillment & Courier Notes</div>
                    <div><strong>Courier:</strong> {{ $order->courier_name ?? 'Pending Assignment' }}</div>
                    @if($order->courier_tracking_id)
                        <div style="margin-top: 2px;"><strong>Tracking ID:</strong> {{ $order->courier_tracking_id }}</div>
                    @endif
                    @if($order->notes)
                        <div style="margin-top: 6px; padding: 6px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 4px;">
                            <strong>Customer Instructions:</strong><br>
                            {{ $order->notes }}
                        </div>
                    @endif
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 50%;">Ordered Item / Variant</th>
                        <th class="right" style="width: 15%;">Unit Price</th>
                        <th class="right" style="width: 15%;">Quantity</th>
                        <th class="right" style="width: 20%;">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($order->items as $item)
                        <tr>
                            <td>
                                <div style="font-weight: 600; color: #0f172a;">{{ $item->product_title }}</div>
                                @if($item->variant_name)
                                    <span class="variant-tag">{{ $item->variant_name }}</span>
                                @endif
                            </td>
                            <td class="right">৳{{ number_format((float) $item->unit_price, 2) }}</td>
                            <td class="right" style="font-weight: 600;">{{ $item->quantity }}</td>
                            <td class="right" style="font-weight: 700;">৳{{ number_format((float) $item->total_price, 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="bottom-section">
                <div class="barcode-wrap">
                    <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase;">
                        Warehouse Scan & Courier Barcode
                    </div>
                    {!! $barcodeSvg !!}
                </div>
                <table class="totals-table">
                    <tr>
                        <td>Subtotal:</td>
                        <td class="right">৳{{ number_format((float) $order->subtotal, 2) }}</td>
                    </tr>
                    <tr>
                        <td>Shipping Fee:</td>
                        <td class="right">৳{{ number_format((float) $order->shipping_fee, 2) }}</td>
                    </tr>
                    @if((float) $order->discount > 0)
                        <tr>
                            <td>Discount:</td>
                            <td class="right" style="color: #16a34a;">-৳{{ number_format((float) $order->discount, 2) }}</td>
                        </tr>
                    @endif
                    <tr class="grand-total-row">
                        <td>Total Due (COD):</td>
                        <td class="right">৳{{ number_format((float) $order->total, 2) }}</td>
                    </tr>
                </table>
            </div>

            <div class="footer-note">
                Generated electronically. Single-tenant self-hosted order fulfillment slip.
            </div>
        @endif
    </div>

    @if(request()->boolean('autoprint'))
        <script>
            window.addEventListener('DOMContentLoaded', () => {
                window.print();
            });
        </script>
    @endif
</body>
</html>
