<?php

declare(strict_types=1);

namespace App\Modules\Sms\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Orders\Models\Order;
use App\Modules\Sms\Requests\SendOrderSmsRequest;
use App\Modules\Sms\Services\SmsManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class OrderSmsController extends Controller
{
    public function __construct(
        protected SmsManager $smsManager
    ) {}

    /**
     * Dispatch an on-demand or templated SMS notification for an order.
     */
    public function sendOrderSms(Order $order, SendOrderSmsRequest $request): JsonResponse|RedirectResponse
    {
        Gate::authorize('update', $order);

        $driver = (string) ($request->validated('driver') ?: config('sms.default', 'mock'));

        if (! $this->smsManager->isConfigured($driver)) {
            $msg = "SMS driver [{$driver}] is not configured with required API credentials.";
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $msg], 422);
            }

            return back()->with('error', $msg);
        }

        $template = $request->validated('template');
        $customMessage = $request->validated('message');

        if (! empty($template) && $template !== 'custom') {
            $templateService = $this->smsManager->getTemplateService();
            if ($templateService->getTemplate($template) === null) {
                $msg = "Requested SMS template [{$template}] is not defined.";
                if ($request->wantsJson() || $request->ajax()) {
                    return response()->json(['success' => false, 'message' => $msg], 422);
                }

                return back()->with('error', $msg);
            }

            $messageText = $templateService->renderOrder($order, $template);
        } else {
            $messageText = (string) $customMessage;
        }

        try {
            $result = $this->smsManager->send($order->customer_phone, $messageText, $driver);
        } catch (\Throwable $e) {
            $msg = "SMS dispatch failed: {$e->getMessage()}";
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $msg], 422);
            }

            return back()->with('error', $msg);
        }

        if (! $result->success) {
            $msg = $result->message ?: 'SMS dispatch failed.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $msg], 422);
            }

            return back()->with('error', $msg);
        }

        // Audit the dispatched SMS in order histories
        $order->histories()->create([
            'from_status' => $order->status,
            'to_status' => $order->status,
            'comment' => "SMS dispatched via {$result->provider}: {$messageText}",
            'user_id' => $request->user()?->id,
        ]);

        $order->refresh();
        $order->load(['histories.user']);

        $successMsg = "SMS successfully dispatched to {$order->customer_phone} via {$result->provider}.";

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $successMsg,
                'result' => $result->toArray(),
                'timeline' => $order->getTimeline(),
            ]);
        }

        return back()->with('success', $successMsg);
    }
}
