<?php

declare(strict_types=1);

namespace App\Modules\Payments\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payments\Models\PaymentMethod;
use App\Modules\Payments\Requests\StorePaymentMethodRequest;
use App\Modules\Payments\Requests\UpdatePaymentMethodRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    /**
     * Display a listing of payment methods.
     */
    public function index(): Response
    {
        Gate::authorize('manage-payment-methods');

        $methods = PaymentMethod::orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return Inertia::render('Admin/Payments/Methods', [
            'methods' => $methods,
        ]);
    }

    /**
     * Store a newly created payment method.
     */
    public function store(StorePaymentMethodRequest $request): RedirectResponse
    {
        Gate::authorize('manage-payment-methods');

        PaymentMethod::create($request->validated());

        return back()->with('success', 'Payment method created successfully.');
    }

    /**
     * Update the specified payment method.
     */
    public function update(UpdatePaymentMethodRequest $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        Gate::authorize('manage-payment-methods');

        $paymentMethod->update($request->validated());

        return back()->with('success', 'Payment method updated successfully.');
    }

    /**
     * Delete the specified payment method.
     */
    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        Gate::authorize('manage-payment-methods');

        if ($paymentMethod->code === 'cod') {
            return back()->with('error', 'The primary Cash on Delivery method cannot be deleted.');
        }

        $paymentMethod->delete();

        return back()->with('success', 'Payment method deleted successfully.');
    }

    /**
     * Toggle the active status of a payment method.
     */
    public function toggle(PaymentMethod $paymentMethod): RedirectResponse
    {
        Gate::authorize('manage-payment-methods');

        $paymentMethod->update([
            'is_active' => ! $paymentMethod->is_active,
        ]);

        return back()->with('success', 'Payment method status updated successfully.');
    }
}
