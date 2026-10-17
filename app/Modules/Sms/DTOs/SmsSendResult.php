<?php

declare(strict_types=1);

namespace App\Modules\Sms\DTOs;

final class SmsSendResult
{
    /**
     * @param  array<string, mixed>  $rawResponse
     */
    public function __construct(
        public readonly bool $success,
        public readonly string $recipient,
        public readonly string $content,
        public readonly string $provider,
        public readonly ?string $messageId = null,
        public readonly ?string $status = null,
        public readonly ?string $message = null,
        public readonly array $rawResponse = []
    ) {}

    /**
     * Factory for successful delivery result.
     *
     * @param  array<string, mixed>  $rawResponse
     */
    public static function success(
        string $recipient,
        string $content,
        string $provider,
        ?string $messageId = null,
        ?string $message = 'SMS sent successfully.',
        array $rawResponse = []
    ): self {
        return new self(
            success: true,
            recipient: $recipient,
            content: $content,
            provider: $provider,
            messageId: $messageId,
            status: 'sent',
            message: $message,
            rawResponse: $rawResponse
        );
    }

    /**
     * Factory for failed delivery result.
     *
     * @param  array<string, mixed>  $rawResponse
     */
    public static function failure(
        string $recipient,
        string $content,
        string $provider,
        string $message,
        array $rawResponse = []
    ): self {
        return new self(
            success: false,
            recipient: $recipient,
            content: $content,
            provider: $provider,
            messageId: null,
            status: 'failed',
            message: $message,
            rawResponse: $rawResponse
        );
    }

    /**
     * Convert DTO to array.
     *
     * @return array{
     *     success: bool,
     *     recipient: string,
     *     content: string,
     *     provider: string,
     *     message_id: ?string,
     *     status: ?string,
     *     message: ?string,
     *     raw_response: array<string, mixed>
     * }
     */
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'recipient' => $this->recipient,
            'content' => $this->content,
            'provider' => $this->provider,
            'message_id' => $this->messageId,
            'status' => $this->status,
            'message' => $this->message,
            'raw_response' => $this->rawResponse,
        ];
    }
}
