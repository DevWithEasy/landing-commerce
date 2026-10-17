<?php

declare(strict_types=1);

namespace App\Modules\Sms\Drivers;

use App\Modules\Orders\Models\Order;
use App\Modules\Sms\Contracts\SmsDriverInterface;
use App\Modules\Sms\DTOs\SmsSendResult;
use App\Modules\Sms\Services\SmsTemplateService;
use Illuminate\Support\Facades\Log;

class MockSmsDriver implements SmsDriverInterface
{
    /**
     * @var list<array{recipient: string, content: string, message_id: string, sent_at: string}>
     */
    protected static array $sentMessages = [];

    protected SmsTemplateService $templateService;

    /**
     * @param  array<string, mixed>  $config
     */
    public function __construct(
        protected array $config = [],
        ?SmsTemplateService $templateService = null
    ) {
        $this->templateService = $templateService ?? new SmsTemplateService;
    }

    public function getName(): string
    {
        return 'mock';
    }

    public function isConfigured(): bool
    {
        return true;
    }

    public function send(string $recipientPhone, string $message, array $options = []): SmsSendResult
    {
        $messageId = 'MOCK-SMS-'.strtoupper(substr(md5($recipientPhone.$message.microtime()), 0, 10));

        $record = [
            'recipient' => $recipientPhone,
            'content' => $message,
            'message_id' => $messageId,
            'sent_at' => now()->toIso8601String(),
        ];

        self::$sentMessages[] = $record;

        Log::info("Mock SMS delivered to [{$recipientPhone}]: {$message}", [
            'provider' => 'mock',
            'message_id' => $messageId,
        ]);

        return SmsSendResult::success(
            recipient: $recipientPhone,
            content: $message,
            provider: 'mock',
            messageId: $messageId,
            message: 'Mock SMS simulated and logged successfully.',
            rawResponse: $record
        );
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

    /**
     * @return list<array{recipient: string, content: string, message_id: string, sent_at: string}>
     */
    public static function getSentMessages(): array
    {
        return self::$sentMessages;
    }

    public static function getLastMessage(): ?array
    {
        return self::$sentMessages[count(self::$sentMessages) - 1] ?? null;
    }

    public static function hasSentTo(string $phone): bool
    {
        foreach (self::$sentMessages as $msg) {
            if ($msg['recipient'] === $phone) {
                return true;
            }
        }

        return false;
    }

    public static function clearSentMessages(): void
    {
        self::$sentMessages = [];
    }
}
