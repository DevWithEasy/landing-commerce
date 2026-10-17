<?php

declare(strict_types=1);

namespace App\Modules\Couriers\DTOs;

final class CourierTrackingResult
{
    /**
     * @param  array<string, mixed>  $rawResponse
     */
    public function __construct(
        public readonly bool $success,
        public readonly string $consignmentId,
        public readonly string $status,
        public readonly string $rawStatus,
        public readonly ?string $message = null,
        public readonly ?string $updatedAt = null,
        public readonly array $rawResponse = [],
    ) {}

    /**
     * @param  array<string, mixed>  $rawResponse
     */
    public static function create(
        string $consignmentId,
        string $status,
        string $rawStatus,
        ?string $message = null,
        ?string $updatedAt = null,
        array $rawResponse = [],
    ): self {
        return new self(
            success: true,
            consignmentId: $consignmentId,
            status: $status,
            rawStatus: $rawStatus,
            message: $message,
            updatedAt: $updatedAt,
            rawResponse: $rawResponse,
        );
    }

    /**
     * @param  array<string, mixed>  $rawResponse
     */
    public static function failure(string $consignmentId, string $message, array $rawResponse = []): self
    {
        return new self(
            success: false,
            consignmentId: $consignmentId,
            status: 'unknown',
            rawStatus: 'unknown',
            message: $message,
            updatedAt: null,
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
            'status' => $this->status,
            'raw_status' => $this->rawStatus,
            'message' => $this->message,
            'updated_at' => $this->updatedAt,
            'raw_response' => $this->rawResponse,
        ];
    }
}
