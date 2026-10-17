<?php

declare(strict_types=1);

namespace App\Modules\Shipping\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class District extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'bn_name',
        'lat',
        'lon',
        'shipping_zone_id',
    ];

    /**
     * @return BelongsTo<ShippingZone, $this>
     */
    public function shippingZone(): BelongsTo
    {
        return $this->belongsTo(ShippingZone::class, 'shipping_zone_id');
    }

    /**
     * @return HasMany<Upazila, $this>
     */
    public function upazilas(): HasMany
    {
        return $this->hasMany(Upazila::class);
    }
}
