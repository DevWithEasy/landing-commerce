<?php

namespace App\Http\Middleware;

use App\Modules\Cart\Services\CartManagerService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user('web') ? [
                    'id' => $request->user('web')->id,
                    'name' => $request->user('web')->name,
                    'email' => $request->user('web')->email,
                    'role' => $request->user('web')->role,
                ] : null,
                'customer' => $request->user('customer') ? [
                    'id' => $request->user('customer')->id,
                    'name' => $request->user('customer')->name,
                    'email' => $request->user('customer')->email,
                    'phone' => $request->user('customer')->phone,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'cart' => function () use ($request) {
                /** @var CartManagerService $manager */
                $manager = app(CartManagerService::class);
                $cart = $manager->getCart($request);

                return $cart ? $cart->toSummaryArray() : [
                    'id' => null,
                    'total_items' => 0,
                    'subtotal' => 0,
                    'formatted_subtotal' => '৳0',
                    'items' => [],
                    'is_empty' => true,
                ];
            },
        ];
    }
}
