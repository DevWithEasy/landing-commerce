<?php

declare(strict_types=1);

namespace App\Modules\Orders\Exceptions;

use DomainException;
use Throwable;

class InvalidOrderStateTransitionException extends DomainException
{
    public function __construct(
        public readonly string $fromStatus,
        public readonly string $toStatus,
        public readonly string $orderNumber = '',
        string $message = '',
        int $code = 422,
        ?Throwable $previous = null
    ) {
        if ($message === '') {
            $identifier = $orderNumber !== '' ? "order #{$orderNumber}" : 'order';
            $message = "Cannot transition {$identifier} from status '{$fromStatus}' to '{$toStatus}'.";
        }

        parent::__construct($message, $code, $previous);
    }
}
