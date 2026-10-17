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

class SmspohSmsDriver implements SmsDriverInterface
{
    protected SmsTemplateService $templateService;

    /**
     * @param  array{token?: ?string, sender_id?: ?string, base_url?: ?string}  $config
     */
    public function __construct(
        protected array $config = [],
        ?SmsTemplateService $templateService = null
    ) {
        $this->templateService = $templateService ?? new SmsTemplateService;
    }

    public function getName(): string
    {
        return 'smspoh';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->config['token']);
    }

    /**
     * @throws SmsConfigurationException
     */
    protected function ensureConfigured(): void
    {
        if (empty($this->config['token'])) {
            throw SmsConfigurationException::missingCredentials('smspoh', ['token']);
        }
    }

    protected function getBaseUrl(): string
    {
        return (string) ($this->config['base_url'] ?? 'https://v3.smspoh.com/api/rest/send');
    }

    public function send(string $recipientPhone, string $message, array $options = []): SmsSendResult
    {
        $this->ensureConfigured();

        $token = (string) $this->config['token'];
        $sender = (string) ($options['sender'] ?? $this->config['sender_id'] ?? 'SMSPOH');
        $cleanPhone = preg_replace('/[^\d+]/', '', $recipientPhone) ?? $recipientPhone;

        $payload = [
            'to' => $cleanPhone,
            'message' => $message,
            'sender' => $sender,
        ];

        try {
            $response = Http::withToken($token)
                ->timeout(12)
                ->post($this->getBaseUrl(), $payload);

            $body = $response->json() ?? [];
            $isSuccess = ($body['status'] ?? false) === true;

            if ($response->successful() && $isSuccess) {
                $data = $body['data'] ?? [];
                $messageId = (string) ($data['message_id'] ?? $data['id'] ?? '');

                return SmsSendResult::success(
                    recipient: $cleanPhone,
                    content: $message,
                    provider: 'smspoh',
                    messageId: $messageId ?: null,
                    message: 'SMS sent successfully via SMSPoh.',
                    rawResponse: is_array($body) ? $body : []
                );
            }

            $errorMsg = (string) ($body['message'] ?? $body['error'] ?? 'SMSPoh delivery failed.');

            return SmsSendResult::failure(
                recipient: $cleanPhone,
                content: $message,
                provider: 'smspoh',
                message: "SMSPoh error: {$errorMsg}",
                rawResponse: is_array($body) ? $body : ['raw' => $response->body()]
            );
        } catch (\Throwable $e) {
            if ($e instanceof SmsConfigurationException) {
                throw $e;
            }

            throw new SmsException(
                "SMSPoh API communication error: {$e->getMessage()}",
                ['payload' => ['to' => $cleanPhone]],
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
