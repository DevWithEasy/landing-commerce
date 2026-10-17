<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class BdPhoneRule implements ValidationRule
{
    public const PATTERN = '/^(?:\+?88)?(01[3-9]\d{8})$/';

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! preg_match(self::PATTERN, trim($value))) {
            $fail('The :attribute must be a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).');
        }
    }

    /**
     * Normalize any Bangladeshi phone representation into standard 11-digit format.
     */
    public static function normalize(string $phone): string
    {
        $clean = preg_replace('/[^\d+]/', '', trim($phone));

        if (preg_match(self::PATTERN, $clean, $matches)) {
            return $matches[1];
        }

        return $clean;
    }
}
