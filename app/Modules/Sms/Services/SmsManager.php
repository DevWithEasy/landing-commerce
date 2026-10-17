<?php

declare(strict_types=1);

namespace App\Modules\Sms\Services;

use App\Modules\Orders\Models\Order;
use App\Modules\Sms\Contracts\SmsDriverInterface;
use App\Modules\Sms\Drivers\GreenwebSmsDriver;
use App\Modules\Sms\Drivers\MockSmsDriver;
use App\Modules\Sms\Drivers\SmspohSmsDriver;
use App\Modules\Sms\Drivers\SslWirelessSmsDriver;
use App\Modules\Sms\DTOs\SmsSendResult;
use App\Modules\Sms\Exceptions\SmsException;
use InvalidArgumentException;

class SmsManager
{
    /**
     * @var array<string, SmsDriverInterface>
     */
    protected array $drivers = [];

    protected SmsTemplateService $templateService;

    public function __construct(?SmsTemplateService $templateService = null)
    {
        $this->templateService = $templateService ?? new SmsTemplateService;
    }

    /**
     * Get an SMS driver instance by name or default.
     *
     * @throws InvalidArgumentException
     */
    public function driver(?string $name = null): SmsDriverInterface
    {
        $name = strtolower(trim((string) ($name ?: config('sms.default', 'mock'))));

        if (isset($this->drivers[$name])) {
            return $this->drivers[$name];
        }

        $driver = $this->resolveDriver($name);
        $this->drivers[$name] = $driver;

        return $driver;
    }

    /**
     * Resolve a driver by name.
     */
    protected function resolveDriver(string $name): SmsDriverInterface
    {
        return match ($name) {
            'mock' => new MockSmsDriver(
                (array) config('sms.drivers.mock', []),
                $this->templateService
            ),
            'greenweb' => new GreenwebSmsDriver(
                (array) config('sms.drivers.greenweb', []),
                $this->templateService
            ),
            'ssl_wireless' => new SslWirelessSmsDriver(
                (array) config('sms.drivers.ssl_wireless', []),
                $this->templateService
            ),
            'smspoh' => new SmspohSmsDriver(
                (array) config('sms.drivers.smspoh', []),
                $this->templateService
            ),
            default => throw new InvalidArgumentException("Unsupported SMS driver [{$name}]."),
        };
    }

    /**
     * Send an arbitrary SMS message using the specified or default driver.
     *
     * @param  array<string, mixed>  $options
     *
     * @throws SmsException
     */
    public function send(
        string $phone,
        string $message,
        ?string $driver = null,
        array $options = []
    ): SmsSendResult {
        return $this->driver($driver)->send($phone, $message, $options);
    }

    /**
     * Send an order notification SMS using a registered template.
     *
     * @param  array<string, string>  $extraPlaceholders
     * @param  array<string, mixed>  $options
     *
     * @throws SmsException
     */
    public function sendOrderNotification(
        Order $order,
        string $templateKey,
        array $extraPlaceholders = [],
        ?string $driver = null,
        array $options = []
    ): SmsSendResult {
        return $this->driver($driver)->sendOrderNotification($order, $templateKey, $extraPlaceholders, $options);
    }

    /**
     * Check if a driver is configured with required credentials.
     */
    public function isConfigured(?string $driver = null): bool
    {
        return $this->driver($driver)->isConfigured();
    }

    /**
     * List all supported SMS drivers and their user-friendly labels.
     *
     * @return array<string, string>
     */
    public function getSupportedDrivers(): array
    {
        return [
            'mock' => 'Mock SMS (Testing/Local Log)',
            'greenweb' => 'Greenweb SMS Gateway',
            'ssl_wireless' => 'SSL Wireless Push SMS',
            'smspoh' => 'SMSPoh Regional Gateway',
        ];
    }

    public function getTemplateService(): SmsTemplateService
    {
        return $this->templateService;
    }
}
