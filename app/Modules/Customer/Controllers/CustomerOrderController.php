<?php

declare(strict_types=1);

namespace App\Modules\Customer\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Category;
use App\Modules\Customer\Models\Customer;
use App\Modules\Orders\Models\Order;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerOrderController extends Controller
{
    public function __construct(
        protected SettingsService $settings
    ) {}

    /**
     * Display paginated order history for the authenticated customer.
     */
    public function index(Request $request): Response
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');

        $theme = $this->settings->getStorefrontTheme();
        $categories = Category::toTree(true);

        $orders = $customer->orders()
            ->with(['items.product.images'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Customer/Orders', [
            'theme' => $theme,
            'categories' => $categories,
            'orders' => $orders,
        ]);
    }

    /**
     * Display order details for a specific order owned by the authenticated customer.
     */
    public function show(Request $request, string $orderNumber): Response
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');

        // Enforce strict ownership scoping to prevent IDOR vulnerabilities
        $order = Order::with(['items.product.images', 'items.variant', 'shippingMethod'])
            ->where('order_number', $orderNumber)
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        $theme = $this->settings->getStorefrontTheme();
        $categories = Category::toTree(true);

        return Inertia::render('Customer/OrderDetail', [
            'theme' => $theme,
            'categories' => $categories,
            'order' => $order,
        ]);
    }
}
