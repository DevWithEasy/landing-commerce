<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Models;

use App\Modules\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class LandingPage extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::saved(function () {
            Cache::forget('storefront_sitemap_xml');
        });

        static::deleted(function () {
            Cache::forget('storefront_sitemap_xml');
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'title',
        'slug',
        'is_default',
        'status',
        'meta_seo',
        'tracking_settings',
        'published_revision_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'meta_seo' => 'array',
            'tracking_settings' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return HasMany<LandingPageRevision, $this>
     */
    public function revisions(): HasMany
    {
        return $this->hasMany(LandingPageRevision::class)->orderByDesc('revision_number');
    }

    /**
     * @return BelongsTo<LandingPageRevision, $this>
     */
    public function publishedRevision(): BelongsTo
    {
        return $this->belongsTo(LandingPageRevision::class, 'published_revision_id');
    }
}
