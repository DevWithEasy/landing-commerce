<?php

declare(strict_types=1);

namespace App\Modules\Settings\Policies;

use App\Models\User;
use App\Modules\Settings\Models\Setting;

class SettingPolicy
{
    /**
     * Determine whether the user can view settings.
     */
    public function viewAny(User $user): bool
    {
        return $user->canManageSettings();
    }

    /**
     * Determine whether the user can update settings.
     */
    public function update(User $user, ?Setting $setting = null): bool
    {
        return $user->canManageSettings();
    }
}
