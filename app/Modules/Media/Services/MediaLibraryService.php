<?php

declare(strict_types=1);

namespace App\Modules\Media\Services;

use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Media\Models\MediaAsset;
use Illuminate\Contracts\Pagination\LengthAwarePaginator as LengthAwarePaginatorContract;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MediaLibraryService
{
    /**
     * Convert a public storage URL or relative path into a disk-relative file path.
     */
    public function extractStorageFilePath(string $urlOrPath): string
    {
        $trimmed = trim($urlOrPath);
        if ($trimmed === '') {
            return '';
        }

        $storageBaseUrl = rtrim(Storage::disk('public')->url(''), '/');
        if ($storageBaseUrl !== '' && str_starts_with($trimmed, $storageBaseUrl.'/')) {
            return ltrim(substr($trimmed, strlen($storageBaseUrl) + 1), '/');
        }

        if (preg_match('#^https?://#i', $trimmed) || str_starts_with($trimmed, '/')) {
            $parsedPath = parse_url($trimmed, PHP_URL_PATH);
            if (! is_string($parsedPath) || $parsedPath === '') {
                return '';
            }

            $storagePos = strpos($parsedPath, '/storage/');
            if ($storagePos !== false) {
                return ltrim(substr($parsedPath, $storagePos + strlen('/storage/')), '/');
            }

            return '';
        }

        if (str_starts_with($trimmed, 'storage/')) {
            return ltrim(substr($trimmed, strlen('storage/')), '/');
        }

        return ltrim($trimmed, '/');
    }

    /**
     * Check whether any product image, library asset, or combo color still references this file path.
     */
    public function isFilePathReferenced(string $filePath): bool
    {
        $normalizedPath = $this->extractStorageFilePath($filePath);
        if ($normalizedPath === '') {
            return false;
        }

        if (ProductImage::where('file_path', $normalizedPath)->exists()) {
            return true;
        }

        if (MediaAsset::where('file_path', $normalizedPath)->exists()) {
            return true;
        }

        $comboRows = DB::table('products')
            ->whereNotNull('combo_colors')
            ->pluck('combo_colors');

        foreach ($comboRows as $rawComboColors) {
            $comboColors = is_string($rawComboColors)
                ? json_decode($rawComboColors, true)
                : $rawComboColors;

            if (! is_array($comboColors)) {
                continue;
            }

            foreach ($comboColors as $colorRow) {
                if (! is_array($colorRow) || empty($colorRow['image_url'])) {
                    continue;
                }

                if ($this->extractStorageFilePath((string) $colorRow['image_url']) === $normalizedPath) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get a paginated, unified list of unique media items across product images, combo images, and library uploads.
     */
    public function paginate(int $perPage = 24, string $search = ''): LengthAwarePaginatorContract
    {
        $allItems = $this->collectUniqueMediaItems();

        $search = trim($search);
        if ($search !== '') {
            $needle = mb_strtolower($search);
            $allItems = $allItems->filter(function (object $item) use ($needle): bool {
                $searchText = (string) ($item->search_text ?? '');

                return $searchText !== '' && str_contains(mb_strtolower($searchText), $needle);
            });
        }

        $sortedItems = $allItems
            ->sort(function (object $a, object $b): int {
                $timeA = $a->created_at ? (strtotime((string) $a->created_at) ?: 0) : 0;
                $timeB = $b->created_at ? (strtotime((string) $b->created_at) ?: 0) : 0;

                if ($timeB !== $timeA) {
                    return $timeB <=> $timeA;
                }

                return (int) $b->record_id <=> (int) $a->record_id;
            })
            ->values();

        $currentPage = Paginator::resolveCurrentPage();
        $total = $sortedItems->count();

        $pageItems = $sortedItems
            ->forPage($currentPage, $perPage)
            ->values()
            ->map(function (object $item): object {
                $item->url = Storage::disk('public')->url($item->file_path);
                $item->thumb_url = $this->thumbUrl($item->file_path);
                $item->name = basename($item->file_path);
                $item->is_primary = (bool) $item->is_primary;
                unset($item->original_name, $item->search_text);

                return $item;
            });

        $paginator = new LengthAwarePaginator(
            $pageItems,
            $total,
            $perPage,
            $currentPage,
            [
                'path' => Paginator::resolveCurrentPath(),
            ]
        );

        return $paginator->withQueryString();
    }

    /**
     * @return array{total: int, product: int, product_primary: int, gallery: int, combo: int, library: int}
     */
    public function stats(): array
    {
        $uniqueItems = $this->collectUniqueMediaItems();

        $primaryProductCount = $uniqueItems->where('media_type', 'product')->count();
        $galleryCount = $uniqueItems->where('media_type', 'gallery')->count();
        $comboCount = $uniqueItems->where('media_type', 'combo')->count();
        $libraryCount = $uniqueItems->where('media_type', 'library')->count();

        return [
            'total' => $uniqueItems->count(),
            'product' => $primaryProductCount + $galleryCount + $comboCount,
            'product_primary' => $primaryProductCount,
            'gallery' => $galleryCount,
            'combo' => $comboCount,
            'library' => $libraryCount,
        ];
    }

    /**
     * Collect all media entries across library, product images, and combo images deduplicated by file path.
     *
     * @return Collection<int, object>
     */
    private function collectUniqueMediaItems(): Collection
    {
        $libraryItems = DB::table('media_assets')
            ->orderBy('media_assets.id', 'asc')
            ->select([
                'media_assets.id as record_id',
                'media_assets.file_path',
                'media_assets.alt_text',
                'media_assets.original_name',
                'media_assets.created_at',
            ])
            ->get()
            ->map(function (object $row): object {
                return (object) [
                    'record_id' => (int) $row->record_id,
                    'source' => 'library',
                    'media_type' => 'library',
                    'key' => "library:{$row->record_id}",
                    'file_path' => (string) $row->file_path,
                    'alt_text' => $row->alt_text !== null ? (string) $row->alt_text : null,
                    'created_at' => $row->created_at !== null ? (string) $row->created_at : null,
                    'source_label' => 'Media Library',
                    'is_primary' => false,
                    'original_name' => $row->original_name !== null ? (string) $row->original_name : null,
                ];
            });

        $productItems = DB::table('product_images')
            ->join('products', 'products.id', '=', 'product_images.product_id')
            ->orderByDesc('product_images.is_primary')
            ->orderBy('product_images.id', 'asc')
            ->select([
                'product_images.id as record_id',
                'product_images.file_path',
                'product_images.alt_text',
                'product_images.created_at',
                'products.title as source_label',
                'product_images.is_primary',
            ])
            ->get()
            ->map(function (object $row): object {
                $isPrimary = (bool) $row->is_primary;

                return (object) [
                    'record_id' => (int) $row->record_id,
                    'source' => 'product',
                    'media_type' => $isPrimary ? 'product' : 'gallery',
                    'key' => "product:{$row->record_id}",
                    'file_path' => (string) $row->file_path,
                    'alt_text' => $row->alt_text !== null ? (string) $row->alt_text : null,
                    'created_at' => $row->created_at !== null ? (string) $row->created_at : null,
                    'source_label' => (string) $row->source_label,
                    'is_primary' => $isPrimary,
                    'original_name' => null,
                ];
            });

        $comboItems = $this->collectComboImages();

        $allItems = $libraryItems
            ->concat($productItems)
            ->concat($comboItems);

        /** @var array<string, array{canonical: object, terms: list<string>}> $grouped */
        $grouped = [];

        foreach ($allItems as $item) {
            $normalizedPath = $this->extractStorageFilePath((string) $item->file_path);
            if ($normalizedPath === '') {
                continue;
            }

            if (! isset($grouped[$normalizedPath])) {
                $item->file_path = $normalizedPath;
                $grouped[$normalizedPath] = [
                    'canonical' => $item,
                    'terms' => [],
                ];
            }

            $candidates = [
                $normalizedPath,
                basename($normalizedPath),
                (string) ($item->alt_text ?? ''),
                (string) ($item->source_label ?? ''),
                (string) ($item->original_name ?? ''),
            ];

            foreach ($candidates as $candidate) {
                $trimmed = trim($candidate);
                if ($trimmed !== '') {
                    $grouped[$normalizedPath]['terms'][] = $trimmed;
                }
            }
        }

        return collect($grouped)
            ->map(function (array $entry): object {
                $canonical = $entry['canonical'];
                $canonical->search_text = implode(' | ', array_values(array_unique($entry['terms'])));

                return $canonical;
            })
            ->values();
    }

    /**
     * Collect all combo color images defined across products.
     *
     * @return Collection<int, object>
     */
    private function collectComboImages(): Collection
    {
        $rows = DB::table('products')
            ->whereNotNull('combo_colors')
            ->orderBy('id', 'asc')
            ->select(['id', 'title', 'combo_colors', 'created_at', 'updated_at'])
            ->get();

        $items = collect();

        foreach ($rows as $product) {
            $comboColors = is_string($product->combo_colors)
                ? json_decode($product->combo_colors, true)
                : $product->combo_colors;

            if (! is_array($comboColors)) {
                continue;
            }

            foreach ($comboColors as $index => $colorRow) {
                if (! is_array($colorRow) || empty($colorRow['image_url'])) {
                    continue;
                }

                $filePath = $this->extractStorageFilePath((string) $colorRow['image_url']);
                if ($filePath === '') {
                    continue;
                }

                $colorName = trim((string) ($colorRow['name'] ?? ''));
                $displayColor = $colorName !== '' ? $colorName : 'Color '.((int) $index + 1);
                $timestamp = $product->created_at ?? $product->updated_at;

                $items->push((object) [
                    'record_id' => ((int) $product->id * 1000) + (int) $index,
                    'source' => 'combo',
                    'media_type' => 'combo',
                    'key' => "combo:{$product->id}:{$index}",
                    'file_path' => $filePath,
                    'alt_text' => trim("{$product->title} - {$displayColor}"),
                    'created_at' => $timestamp !== null ? (string) $timestamp : null,
                    'source_label' => "{$product->title} (Combo: {$displayColor})",
                    'is_primary' => false,
                    'original_name' => null,
                ]);
            }
        }

        return $items;
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
