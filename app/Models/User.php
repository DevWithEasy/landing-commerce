<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Modules\Orders\Models\OrderHistory;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isStoreManager(): bool
    {
        return $this->role === 'store_manager';
    }

    public function isFulfillmentAgent(): bool
    {
        return $this->role === 'fulfillment_agent';
    }

    public function canManageCatalog(): bool
    {
        return in_array($this->role, ['super_admin', 'store_manager'], true);
    }

    public function canManageOrders(): bool
    {
        return in_array($this->role, ['super_admin', 'store_manager', 'fulfillment_agent'], true);
    }

    public function canManageLandingPages(): bool
    {
        return in_array($this->role, ['super_admin', 'store_manager'], true);
    }

    public function canManageSettings(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canManageBackups(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canEditProductPrices(): bool
    {
        return in_array($this->role, ['super_admin', 'store_manager'], true);
    }

    public function canManageShippingAndPayments(): bool
    {
        return in_array($this->role, ['super_admin', 'store_manager'], true);
    }

    /**
     * @return HasMany<OrderHistory, $this>
     */
    public function orderHistories(): HasMany
    {
        return $this->hasMany(OrderHistory::class);
    }
}
