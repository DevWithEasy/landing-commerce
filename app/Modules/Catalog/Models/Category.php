<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image_path',
        'parent_id',
        'sort_order',
        'is_active',
    ];

    protected $appends = ['image_url'];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'parent_id' => 'integer',
        ];
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        return Storage::disk('public')->url($this->image_path);
    }

    /**
     * Parent category (Level 1 root category).
     *
     * @return BelongsTo<Category, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Subcategories (Level 2 child categories).
     *
     * @return HasMany<Category, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Products assigned to this category.
     *
     * @return BelongsToMany<Product, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'category_product');
    }

    /**
     * Scope only active categories.
     *
     * @param  Builder<Category>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * Scope only top-level (root) categories.
     *
     * @param  Builder<Category>  $query
     */
    public function scopeRoot(Builder $query): void
    {
        $query->whereNull('parent_id');
    }

    /**
     * Scope only top-level (parents only) categories alias.
     *
     * @param  Builder<Category>  $query
     */
    public function scopeParentsOnly(Builder $query): void
    {
        $this->scopeRoot($query);
    }

    /**
     * Validate maximum 2-level hierarchy depth and prevent circular references.
     * Rule: Root (Level 1) -> Subcategory (Level 2).
     * No Sub-subcategory (Level 3+) allowed.
     */
    public static function validateHierarchy(?int $parentId, ?int $categoryId = null): void
    {
        if ($parentId === null) {
            return;
        }

        if ($categoryId !== null && $parentId === $categoryId) {
            throw new InvalidArgumentException('A category cannot be its own parent.');
        }

        $parent = self::find($parentId);
        if (! $parent) {
            throw new InvalidArgumentException('Selected parent category does not exist.');
        }

        // Depth restriction: A parent category must be a Root category (parent_id must be null).
        if ($parent->parent_id !== null) {
            throw new InvalidArgumentException('Categories support a maximum of 2 levels (Parent -> Subcategory). A subcategory cannot have child categories.');
        }

        // Circular reference prevention: If updating, parent cannot be an existing child of categoryId
        if ($categoryId !== null) {
            $isChild = self::where('parent_id', $categoryId)->where('id', $parentId)->exists();
            if ($isChild) {
                throw new InvalidArgumentException('Cannot set a child category as the parent category.');
            }
        }
    }

    /**
     * Get categories structured as a 2-level tree.
     *
     * @return Collection<int, Category>
     */
    public static function toTree(bool $onlyActive = true): Collection
    {
        $query = self::query()->root()->orderBy('sort_order')->orderBy('name');

        if ($onlyActive) {
            $query->active()->with(['children' => function ($q) {
                $q->active()->orderBy('sort_order')->orderBy('name');
            }]);
        } else {
            $query->with(['children' => function ($q) {
                $q->orderBy('sort_order')->orderBy('name');
            }]);
        }

        return $query->get();
    }
}
