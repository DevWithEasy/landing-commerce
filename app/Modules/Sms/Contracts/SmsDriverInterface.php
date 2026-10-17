<?php

declare(strict_types=1);

namespace App\Modules\Sms\Contracts;

use App\Modules\Orders\Models\Order;
use App\Modules\Sms\DTOs\SmsSendResult;
use App\Modules\Sms\Exceptions\SmsConfigurationException;
use App\Modules\Sms\Exceptions\SmsException;

interface SmsDriverInterface
{
    /**
     * Get the unique identifier name of the SMS driver.
     */
    public function getName(): string;

    /**
     * Check if the driver has valid credentials configured in the environment.
     */
    public function isConfigured(): bool;

    /**
     * Send an arbitrary SMS message to a recipient phone number.
     *
     * @param  array<string, mixed>  $options
     *
     * @throws SmsConfigurationException
     * @throws SmsException
     */
    public function send(string $recipientPhone, string $message, array $options = []): SmsSendResult;

    /**
     * Send an order notification SMS using a registered template key with dynamic placeholder substitution.
     *
     * @param  array<string, string>  $extraPlaceholders
     * @param  array<string, mixed>  $options
     *
     * @throws SmsConfigurationException
     * @throws SmsException
     */
    public function sendOrderNotification(
        Order $order,
        string $templateKey,
        array $extraPlaceholders = [],
        array $options = []
    ): SmsSendResult;
}
