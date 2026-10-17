<?php

declare(strict_types=1);

namespace App\Modules\Couriers\DTOs;

final class CourierBookingResult
{
    /**
     * @param  array<string, mixed>  $rawResponse
     */
    public function __construct(
        public readonly bool $success,
        public readonly string $consignmentId,
        public readonly string $trackingCode,
        public readonly ?string $trackingUrl = null,
        public readonly string $status = 'handed_to_courier',
        public readonly ?string $message = null,
        public readonly array $rawResponse = [],
    ) {}

    /**
     * @param  array<string, mixed>  $rawResponse
     */
    public static function success(
        string $consignmentId,
        string $trackingCode,
        ?string $trackingUrl = null,
        string $status = 'handed_to_courier',
        ?string $message = 'Order booked with courier successfully.',
        array $rawResponse = [],
    ): self {
        return new self(
            success: true,
            consignmentId: $consignmentId,
            trackingCode: $trackingCode,
            trackingUrl: $trackingUrl,
            status: $status,
            message: $message,
            rawResponse: $rawResponse,
        );
    }

    /**
     * @param  array<string, mixed>  $rawResponse
     */
    public static function failure(string $message, array $rawResponse = []): self
    {
        return new self(
            success: false,
            consignmentId: '',
            trackingCode: '',
            trackingUrl: null,
            status: 'failed',
            message: $message,
            rawResponse: $rawResponse,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'consignment_id' => $this->consignmentId,
            'tracking_code' => $this->trackingCode,
            'tracking_url' => $this->trackingUrl,
            'status' => $this->status,
            'message' => $this->message,
            'raw_response' => $this->rawResponse,
        ];
    }
}
