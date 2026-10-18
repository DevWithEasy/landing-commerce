<?php

declare(strict_types=1);

namespace App\Modules\Shipping\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Shipping\Models\ShippingMethod;
use App\Modules\Shipping\Models\ShippingZone;
use App\Modules\Shipping\Requests\StoreShippingMethodRequest;
use App\Modules\Shipping\Requests\UpdateShippingMethodRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ShippingMethodController extends Controller
{
    /**
     * Display a listing of shipping methods.
     */
    public function index(): Response
    {
        Gate::authorize('manage-shipping-methods');

        $methods = ShippingMethod::with('zone')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $zones = ShippingZone::where('is_active', true)->orderBy('id')->get();

        return Inertia::render('Admin/Shipping/Methods', [
            'methods' => $methods,
            'zones' => $zones,
        ]);
    }

    /**
     * Store a newly created shipping method.
     */
    public function store(StoreShippingMethodRequest $request): RedirectResponse
    {
        Gate::authorize('manage-shipping-methods');

        $data = $request->validated();

        if (empty($data['code'])) {
            $data['code'] = Str::slug($data['name']);
        }

        if (! empty($data['is_default']) && ! empty($data['zone_code'])) {
            ShippingMethod::where('zone_code', $data['zone_code'])->update(['is_default' => false]);
        }

        ShippingMethod::create($data);

        return back()->with('success', 'Shipping method created successfully.');
    }

    /**
     * Update the specified shipping method.
     */
    public function update(UpdateShippingMethodRequest $request, ShippingMethod $shippingMethod): RedirectResponse
    {
        Gate::authorize('manage-shipping-methods');

        $data = $request->validated();

        if (empty($data['code'])) {
            $data['code'] = Str::slug($data['name']);
        }

        if (! empty($data['is_default'])) {
            $zoneCode = $data['zone_code'] ?? $shippingMethod->zone_code;
            if ($zoneCode) {
                ShippingMethod::where('zone_code', $zoneCode)
                    ->where('id', '!=', $shippingMethod->id)
                    ->update(['is_default' => false]);
            }
        }

        $shippingMethod->update($data);

        return back()->with('success', 'Shipping method updated successfully.');
    }

    /**
     * Soft-delete the specified shipping method.
     */
    public function destroy(ShippingMethod $shippingMethod): RedirectResponse
    {
        Gate::authorize('manage-shipping-methods');

        $shippingMethod->delete();

        return back()->with('success', 'Shipping method deleted successfully.');
    }

    /**
     * Toggle the active status of a shipping method.
     */
    public function toggle(ShippingMethod $shippingMethod): RedirectResponse
    {
        Gate::authorize('manage-shipping-methods');

        $shippingMethod->update([
            'is_active' => ! $shippingMethod->is_active,
        ]);

        return back()->with('success', 'Shipping method status updated successfully.');
    }
}
