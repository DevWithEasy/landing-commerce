<?php

declare(strict_types=1);

namespace App\Modules\Couriers\DTOs;

final class CourierConnectionResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $message,
        public readonly ?int $httpStatus = null,
    ) {}

    public static function success(string $message, ?int $httpStatus = null): self
    {
        return new self(
            success: true,
            message: $message,
            httpStatus: $httpStatus,
        );
    }

    public static function failure(string $message, ?int $httpStatus = null): self
    {
        return new self(
            success: false,
            message: $message,
            httpStatus: $httpStatus,
        );
    }

    /**
     * @return array{success: bool, message: string, http_status: int|null}
     */
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'message' => $this->message,
            'http_status' => $this->httpStatus,
        ];
    }
}
