<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Services;

use App\Modules\Checkout\Rules\BdPhoneRule;
use Illuminate\Support\Facades\RateLimiter;

class OrderRateLimiter
{
    public const IP_MAX_ATTEMPTS = 3;

    public const IP_DECAY_SECONDS = 900; // 15 minutes

    public const PHONE_MAX_ATTEMPTS = 1;

    public const PHONE_DECAY_SECONDS = 300; // 5 minutes

    /**
     * Resolve the cache key for IP rate limiting.
     */
    public function ipKey(string $ip): string
    {
        return 'checkout:ip:'.trim($ip);
    }

    /**
     * Resolve the cache key for phone rate limiting.
     */
    public function phoneKey(string $phone): string
    {
        $normalized = BdPhoneRule::normalize($phone);
        $key = $normalized !== '' ? $normalized : trim($phone);

        return 'checkout:phone:'.$key;
    }

    /**
     * Determine if the given IP address has exceeded its rate limit.
     */
    public function tooManyIpAttempts(string $ip): bool
    {
        return RateLimiter::tooManyAttempts($this->ipKey($ip), self::IP_MAX_ATTEMPTS);
    }

    /**
     * Determine if the given phone number has exceeded its rate limit.
     */
    public function tooManyPhoneAttempts(string $phone): bool
    {
        if (trim($phone) === '') {
            return false;
        }

        return RateLimiter::tooManyAttempts($this->phoneKey($phone), self::PHONE_MAX_ATTEMPTS);
    }

    /**
     * Get the number of seconds until the IP rate limit is released.
     */
    public function ipAvailableIn(string $ip): int
    {
        return RateLimiter::availableIn($this->ipKey($ip));
    }

    /**
     * Get the number of seconds until the phone rate limit is released.
     */
    public function phoneAvailableIn(string $phone): int
    {
        return RateLimiter::availableIn($this->phoneKey($phone));
    }

    /**
     * Increment the counter for the IP address.
     */
    public function hitIp(string $ip): int
    {
        return RateLimiter::hit($this->ipKey($ip), self::IP_DECAY_SECONDS);
    }

    /**
     * Increment the counter for the phone number.
     */
    public function hitPhone(string $phone): int
    {
        if (trim($phone) === '') {
            return 0;
        }

        return RateLimiter::hit($this->phoneKey($phone), self::PHONE_DECAY_SECONDS);
    }

    /**
     * Record a checkout attempt for both IP and phone.
     */
    public function hit(string $ip, string $phone): void
    {
        $this->hitIp($ip);
        $this->hitPhone($phone);
    }

    /**
     * Clear the rate limit counters.
     */
    public function clear(string $ip, ?string $phone = null): void
    {
        RateLimiter::clear($this->ipKey($ip));

        if ($phone !== null && trim($phone) !== '') {
            RateLimiter::clear($this->phoneKey($phone));
        }
    }
}
