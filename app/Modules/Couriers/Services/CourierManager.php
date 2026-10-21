<?php

declare(strict_types=1);

namespace App\Modules\Couriers\Services;

use App\Modules\Couriers\Contracts\CourierDriverInterface;
use App\Modules\Couriers\Drivers\MockCourierDriver;
use App\Modules\Couriers\Drivers\PathaoCourierDriver;
use App\Modules\Couriers\Drivers\RedXCourierDriver;
use App\Modules\Couriers\Drivers\SteadfastCourierDriver;
use App\Modules\Couriers\DTOs\CourierBookingResult;
use App\Modules\Couriers\DTOs\CourierConnectionResult;
use App\Modules\Couriers\DTOs\CourierTrackingResult;
use App\Modules\Couriers\Exceptions\CourierException;
use App\Modules\Orders\Models\Order;
use InvalidArgumentException;

class CourierManager
{
    /**
     * @var array<string, CourierDriverInterface>
     */
    protected array $drivers = [];

    /**
     * Get a courier driver instance by name.
     *
     * @throws InvalidArgumentException
     */
    public function driver(?string $name = null): CourierDriverInterface
    {
        $name = strtolower(trim((string) ($name ?: config('courier.default', 'mock'))));

        if (isset($this->drivers[$name])) {
            return $this->drivers[$name];
        }

        $driver = $this->resolveDriver($name);
        $this->drivers[$name] = $driver;

        return $driver;
    }

    /**
     * Resolve a driver by name using the active runtime configuration.
     */
    protected function resolveDriver(string $name): CourierDriverInterface
    {
        return $this->makeDriver($name, (array) config("courier.drivers.{$name}", []));
    }

    /**
     * Build a driver instance with an explicit configuration payload.
     *
     * This is used by the admin connection test so that unsaved form values
     * can be verified without mutating the stored settings.
     *
     * @param  array<string, mixed>  $config
     *
     * @throws InvalidArgumentException
     */
    public function makeDriver(string $name, array $config = []): CourierDriverInterface
    {
        $name = strtolower(trim($name));

        return match ($name) {
            'mock' => new MockCourierDriver($config),
            'steadfast' => new SteadfastCourierDriver($config),
            'pathao' => new PathaoCourierDriver($config),
            'redx' => new RedXCourierDriver($config),
            default => throw new InvalidArgumentException("Unsupported courier driver [{$name}]."),
        };
    }

    /**
     * Verify credentials and endpoint connectivity without saving settings.
     *
     * @param  array<string, mixed>  $config
     */
    public function testConnection(string $driver, array $config = []): CourierConnectionResult
    {
        return $this->makeDriver($driver, $config)->testConnection();
    }

    /**
     * Create/book an order consignment with the specified or default courier driver.
     *
     * @param  array<string, mixed>  $options
     *
     * @throws CourierException
     */
    public function createOrder(Order $order, array $options = [], ?string $driver = null): CourierBookingResult
    {
        return $this->driver($driver)->createOrder($order, $options);
    }

    /**
     * Query delivery tracking info for a consignment with the specified or default courier driver.
     *
     * @throws CourierException
     */
    public function trackOrder(string $consignmentId, ?string $driver = null): CourierTrackingResult
    {
        return $this->driver($driver)->trackOrder($consignmentId);
    }

    /**
     * Request cancellation of a consignment with the specified or default courier driver.
     */
    public function cancelOrder(string $consignmentId, ?string $driver = null): bool
    {
        return $this->driver($driver)->cancelOrder($consignmentId);
    }

    /**
     * Check if a driver is configured with required credentials.
     */
    public function isConfigured(?string $driver = null): bool
    {
        return $this->driver($driver)->isConfigured();
    }

    /**
     * List all supported courier drivers and their user-friendly labels.
     *
     * @return array<string, string>
     */
    public function getSupportedDrivers(): array
    {
        return [
            'mock' => 'Mock Courier (Testing/Offline)',
            'steadfast' => 'Steadfast Courier',
            'pathao' => 'Pathao Courier',
            'redx' => 'RedX Courier',
        ];
    }
}
