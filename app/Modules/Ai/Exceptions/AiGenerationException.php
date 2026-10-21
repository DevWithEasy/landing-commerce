<?php

declare(strict_types=1);

namespace App\Modules\Ai\Exceptions;

use RuntimeException;

class AiGenerationException extends RuntimeException
{
    public function __construct(
        string $message,
        protected int $status = 422
    ) {
        parent::__construct($message);
    }

    public function status(): int
    {
        return $this->status;
    }
}
