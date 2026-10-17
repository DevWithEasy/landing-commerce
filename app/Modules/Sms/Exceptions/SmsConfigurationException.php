<?php

declare(strict_types=1);

namespace App\Modules\Sms\Exceptions;

class SmsConfigurationException extends SmsException
{
    /**
     * @param  list<string>  $missingKeys
     */
    public static function missingCredentials(string $driver, array $missingKeys): self
    {
        $keys = implode(', ', $missingKeys);

        return new self(
            "SMS driver [{$driver}] is missing mandatory configuration keys: {$keys}.",
            [
                'driver' => $driver,
                'missing_keys' => $missingKeys,
            ]
        );
    }
}
