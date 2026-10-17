<?php

declare(strict_types=1);

namespace App\Modules\Couriers\Exceptions;

class CourierConfigurationException extends CourierException
{
    public static function missingCredentials(string $driver, array $missingKeys): self
    {
        $keysList = implode(', ', $missingKeys);

        return new self(
            "Courier driver [{$driver}] is missing required configuration credentials: {$keysList}.",
            ['driver' => $driver, 'missing_keys' => $missingKeys]
        );
    }
}
