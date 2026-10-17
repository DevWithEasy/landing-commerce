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

class GreenwebSmsDriver implements SmsDriverInterface
{
    protected SmsTemplateService $templateService;

    /**
     * @param  array{token?: ?string, base_url?: ?string}  $config
     */
    public function __construct(
        protected array $config = [],
        ?SmsTemplateService $templateService = null
    ) {
        $this->templateService = $templateService ?? new SmsTemplateService;
    }

    public function getName(): string
    {
        return 'greenweb';
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
            throw SmsConfigurationException::missingCredentials('greenweb', ['token']);
        }
    }

    protected function getBaseUrl(): string
    {
        return (string) ($this->config['base_url'] ?? 'https://api.greenweb.com.bd/api.php');
    }

    public function send(string $recipientPhone, string $message, array $options = []): SmsSendResult
    {
        $this->ensureConfigured();

        $token = (string) $this->config['token'];
        $cleanPhone = preg_replace('/[^\d+]/', '', $recipientPhone) ?: $recipientPhone;

        $payload = [
            'token' => $token,
            'to' => $cleanPhone,
            'message' => $message,
            'json' => '1',
        ];

        try {
            $response = Http::asForm()
                ->timeout(12)
                ->post($this->getBaseUrl(), $payload);

            $rawBody = $response->body();
            $data = $response->json();

            // Greenweb JSON response format: [{"status":"SUCCESS","statusmsg":"SUCCESS","messageid":"..."}]
            if (is_array($data) && isset($data[0])) {
                $item = $data[0];
                $status = strtoupper((string) ($item['status'] ?? ''));

                if ($status === 'SUCCESS') {
                    $msgId = (string) ($item['messageid'] ?? '');

                    return SmsSendResult::success(
                        recipient: $cleanPhone,
                        content: $message,
                        provider: 'greenweb',
                        messageId: $msgId ?: null,
                        message: 'SMS sent successfully via Greenweb.',
                        rawResponse: is_array($data) ? $data : ['raw' => $rawBody]
                    );
                }

                $errMsg = (string) ($item['statusmsg'] ?? 'Greenweb delivery failed.');

                return SmsSendResult::failure(
                    recipient: $cleanPhone,
                    content: $message,
                    provider: 'greenweb',
                    message: "Greenweb error: {$errMsg}",
                    rawResponse: is_array($data) ? $data : ['raw' => $rawBody]
                );
            }

            // Fallback string matching if raw text returned (e.g. "Ok: 1 SMS Sent Successfully")
            if (str_starts_with(strtolower(trim($rawBody)), 'ok')) {
                return SmsSendResult::success(
                    recipient: $cleanPhone,
                    content: $message,
                    provider: 'greenweb',
                    message: $rawBody,
                    rawResponse: ['raw' => $rawBody]
                );
            }

            return SmsSendResult::failure(
                recipient: $cleanPhone,
                content: $message,
                provider: 'greenweb',
                message: "Greenweb delivery failed: {$rawBody}",
                rawResponse: ['raw' => $rawBody]
            );
        } catch (\Throwable $e) {
            if ($e instanceof SmsConfigurationException) {
                throw $e;
            }

            throw new SmsException(
                "Greenweb SMS API communication error: {$e->getMessage()}",
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
