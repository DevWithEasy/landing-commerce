<?php

declare(strict_types=1);

namespace App\Modules\Shipping\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShippingZone extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'code',
        'rate',
        'delivery_time',
        'is_active',
        'is_default',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
        ];
    }

    /**
     * @return HasMany<District, $this>
     */
    public function districts(): HasMany
    {
        return $this->hasMany(District::class, 'shipping_zone_id');
    }

    /**
     * @return HasMany<Upazila, $this>
     */
    public function upazilas(): HasMany
    {
        return $this->hasMany(Upazila::class, 'shipping_zone_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
