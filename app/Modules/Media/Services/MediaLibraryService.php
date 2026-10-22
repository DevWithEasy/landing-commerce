<?php

declare(strict_types=1);

namespace App\Modules\Media\Services;

use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Media\Models\MediaAsset;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MediaLibraryService
{
    /**
     * Get a paginated, unified list of product images and standalone media uploads.
     */
    public function paginate(int $perPage = 24, string $search = ''): LengthAwarePaginator
    {
        $productImages = DB::table('product_images')
            ->join('products', 'products.id', '=', 'product_images.product_id')
            ->select([
                'product_images.id as record_id',
                DB::raw("'product' as source"),
                'product_images.file_path',
                'product_images.alt_text',
                'product_images.created_at',
                'products.title as source_label',
                'product_images.is_primary',
            ]);

        $mediaAssets = DB::table('media_assets')
            ->select([
                'media_assets.id as record_id',
                DB::raw("'library' as source"),
                'media_assets.file_path',
                'media_assets.alt_text',
                'media_assets.created_at',
                DB::raw("'Media Library' as source_label"),
                DB::raw('0 as is_primary'),
            ]);

        $search = trim($search);

        if ($search !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';

            $productImages->where(function ($query) use ($like): void {
                $query->where('product_images.file_path', 'like', $like)
                    ->orWhere('product_images.alt_text', 'like', $like)
                    ->orWhere('products.title', 'like', $like);
            });

            $mediaAssets->where(function ($query) use ($like): void {
                $query->where('media_assets.file_path', 'like', $like)
                    ->orWhere('media_assets.alt_text', 'like', $like)
                    ->orWhere('media_assets.original_name', 'like', $like);
            });
        }

        $paginator = DB::query()
            ->fromSub($productImages->unionAll($mediaAssets), 'media_items')
            ->orderByDesc('created_at')
            ->orderByDesc('record_id')
            ->paginate($perPage)
            ->withQueryString();

        return $paginator->through(function (object $item): object {
            $item->key = "{$item->source}:{$item->record_id}";
            $item->url = Storage::disk('public')->url($item->file_path);
            $item->thumb_url = $this->thumbUrl($item->file_path);
            $item->name = basename($item->file_path);
            $item->is_primary = (bool) $item->is_primary;

            return $item;
        });
    }

    /**
     * @return array{total: int, product: int, library: int}
     */
    public function stats(): array
    {
        $productCount = ProductImage::count();
        $libraryCount = MediaAsset::count();

        return [
            'total' => $productCount + $libraryCount,
            'product' => $productCount,
            'library' => $libraryCount,
        ];
    }

    private function thumbUrl(string $filePath): string
    {
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);

        if ($extension !== '') {
            $base = substr($filePath, 0, -(strlen($extension) + 1));
            $thumbPath = "{$base}-thumb.{$extension}";

            if (Storage::disk('public')->exists($thumbPath)) {
                return Storage::disk('public')->url($thumbPath);
            }
        }

        return Storage::disk('public')->url($filePath);
    }
}
