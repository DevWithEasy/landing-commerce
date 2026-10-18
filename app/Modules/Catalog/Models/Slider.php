<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Slider extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
        'image_path',
        'mobile_image_path',
        'link_url',
        'button_text',
        'sort_order',
        'is_active',
    ];

    protected $appends = ['image_url', 'mobile_image_url'];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        return Storage::disk('public')->url($this->image_path);
    }

    public function getMobileImageUrlAttribute(): ?string
    {
        if (! $this->mobile_image_path) {
            return null;
        }

        return Storage::disk('public')->url($this->mobile_image_path);
    }

    /**
     * Scope active sliders ordered by sort_order.
     *
     * @param  Builder<Slider>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true)->orderBy('sort_order');
    }
}
