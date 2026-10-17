<?php

declare(strict_types=1);

namespace App\Modules\Couriers\Exceptions;

use RuntimeException;

class CourierException extends RuntimeException
{
    /**
     * @param  array<string, mixed>  $context
     */
    public function __construct(
        string $message,
        public readonly array $context = [],
        int $code = 0,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }
}
