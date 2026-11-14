<?php

declare(strict_types=1);

namespace App\Modules\Customer\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Category;
use App\Modules\Customer\Models\Customer;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerDashboardController extends Controller
{
    public function __construct(
        protected SettingsService $settings
    ) {}

    /**
     * Display customer account overview.
     */
    public function index(Request $request): Response
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');

        $theme = $this->settings->getStorefrontTheme();
        $categories = Category::toTree(true);

        $recentOrders = $customer->orders()
            ->with(['items.product.images', 'items.variant'])
            ->latest()
            ->take(5)
            ->get();

        $totalOrders = $customer->orders()->count();
        $pendingOrders = $customer->orders()->whereIn('status', ['pending', 'confirmed', 'processing'])->count();
        $deliveredOrders = $customer->orders()->where('status', 'delivered')->count();
        $wishlistCount = $customer->wishlistItems()->count();

        return Inertia::render('Customer/Dashboard', [
            'theme' => $theme,
            'categories' => $categories,
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'district' => $customer->district,
                'upazila' => $customer->upazila,
                'created_at' => $customer->created_at?->toISOString(),
            ],
            'stats' => [
                'total_orders' => $totalOrders,
                'pending_orders' => $pendingOrders,
                'delivered_orders' => $deliveredOrders,
                'wishlist_count' => $wishlistCount,
            ],
            'recent_orders' => $recentOrders,
        ]);
    }
}
