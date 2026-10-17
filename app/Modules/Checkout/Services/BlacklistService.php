<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Services;

use App\Modules\Checkout\Models\PhoneBlacklist;
use App\Modules\Checkout\Rules\BdPhoneRule;

class BlacklistService
{
    /**
     * Check if a given phone number is blacklisted.
     */
    public function isBlacklisted(string $phone): bool
    {
        $phone = trim($phone);
        if ($phone === '') {
            return false;
        }

        $normalized = BdPhoneRule::normalize($phone);

        return PhoneBlacklist::query()
            ->where(function ($query) use ($phone, $normalized) {
                $query->where('phone', $normalized)
                    ->orWhere('phone', $phone);
            })
            ->exists();
    }

    /**
     * Add a phone number to the blacklist.
     */
    public function blacklist(string $phone, ?string $reason = null): PhoneBlacklist
    {
        $normalized = BdPhoneRule::normalize($phone);
        $lookup = $normalized !== '' ? $normalized : trim($phone);

        return PhoneBlacklist::updateOrCreate(
            ['phone' => $lookup],
            ['reason' => $reason]
        );
    }

    /**
     * Remove a phone number from the blacklist.
     */
    public function remove(string $phone): bool
    {
        $normalized = BdPhoneRule::normalize($phone);
        $lookup = $normalized !== '' ? $normalized : trim($phone);

        return (bool) PhoneBlacklist::where('phone', $lookup)->orWhere('phone', trim($phone))->delete();
    }
}
