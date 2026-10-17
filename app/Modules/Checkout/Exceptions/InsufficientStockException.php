<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Exceptions;

use RuntimeException;

class InsufficientStockException extends RuntimeException
{
    public function __construct(
        string $message = 'Insufficient stock for requested item.',
        public readonly ?int $variantId = null,
        public readonly ?int $available = null,
        public readonly ?int $requested = null
    ) {
        parent::__construct($message);
    }
}
