<?php

declare(strict_types=1);

namespace App\Modules\Sms\Drivers;

use App\Modules\Orders\Models\Order;
use App\Modules\Sms\Contracts\SmsDriverInterface;
use App\Modules\Sms\DTOs\SmsSendResult;
use App\Modules\Sms\Exceptions\SmsConfigurationException;
use App\Modules\Sms\Exceptions\SmsException;
use App\Modules\Sms\Services\SmsTemplateService;
use Illuminate\Support\Facades\Http;

class SslWirelessSmsDriver implements SmsDriverInterface
{
    protected SmsTemplateService $templateService;

    /**
     * @param  array{api_token?: ?string, sid?: ?string, base_url?: ?string}  $config
     */
    public function __construct(
        protected array $config = [],
        ?SmsTemplateService $templateService = null
    ) {
        $this->templateService = $templateService ?? new SmsTemplateService;
    }

    public function getName(): string
    {
        return 'ssl_wireless';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->config['api_token']) && ! empty($this->config['sid']);
    }

    /**
     * @throws SmsConfigurationException
     */
    protected function ensureConfigured(): void
    {
        $missing = [];
        if (empty($this->config['api_token'])) {
            $missing[] = 'api_token';
        }
        if (empty($this->config['sid'])) {
            $missing[] = 'sid';
        }

        if (! empty($missing)) {
            throw SmsConfigurationException::missingCredentials('ssl_wireless', $missing);
        }
    }

    protected function getBaseUrl(): string
    {
        return (string) ($this->config['base_url'] ?? 'https://smsplus.sslwireless.com/api/v3/send-sms');
    }

    public function send(string $recipientPhone, string $message, array $options = []): SmsSendResult
    {
        $this->ensureConfigured();

        // Format phone number to standard Bangladesh international 8801XXXXXXXXX if needed
        $cleanPhone = preg_replace('/[^\d]/', '', $recipientPhone) ?? $recipientPhone;
        if (str_starts_with($cleanPhone, '01') && strlen($cleanPhone) === 11) {
            $cleanPhone = '88'.$cleanPhone;
        }

        $csmsId = (string) ($options['csms_id'] ?? ('CSMS_'.substr(md5($cleanPhone.microtime()), 0, 12)));

        $payload = [
            'api_token' => (string) $this->config['api_token'],
            'sid' => (string) $this->config['sid'],
            'msisdn' => $cleanPhone,
            'sms' => $message,
            'csms_id' => $csmsId,
        ];

        try {
            $response = Http::asJson()
                ->timeout(12)
                ->post($this->getBaseUrl(), $payload);

            $body = $response->json() ?? [];
            $status = strtoupper((string) ($body['status'] ?? ''));

            if ($response->successful() && $status === 'SUCCESS') {
                $smsInfo = $body['smsinfo'][0] ?? [];
                $referenceId = (string) ($smsInfo['reference_id'] ?? $smsInfo['csms_id'] ?? $csmsId);

                return SmsSendResult::success(
                    recipient: $cleanPhone,
                    content: $message,
                    provider: 'ssl_wireless',
                    messageId: $referenceId,
                    message: 'SMS sent successfully via SSL Wireless.',
                    rawResponse: is_array($body) ? $body : []
                );
            }

            $errorMsg = (string) ($body['error_message'] ?? $body['errorinfo'] ?? $body['message'] ?? $body['error'] ?? 'SSL Wireless delivery failed.');

            return SmsSendResult::failure(
                recipient: $cleanPhone,
                content: $message,
                provider: 'ssl_wireless',
                message: "SSL Wireless error: {$errorMsg}",
                rawResponse: is_array($body) ? $body : ['raw' => $response->body()]
            );
        } catch (\Throwable $e) {
            if ($e instanceof SmsConfigurationException) {
                throw $e;
            }

            throw new SmsException(
                "SSL Wireless SMS API communication error: {$e->getMessage()}",
                ['payload' => ['msisdn' => $cleanPhone]],
                0,
                $e
            );
        }
    }

    public function sendOrderNotification(
        Order $order,
        string $templateKey,
        array $extraPlaceholders = [],
        array $options = []
    ): SmsSendResult {
        $renderedMessage = $this->templateService->renderOrder($order, $templateKey, $extraPlaceholders);

        return $this->send($order->customer_phone, $renderedMessage, $options);
    }
}
