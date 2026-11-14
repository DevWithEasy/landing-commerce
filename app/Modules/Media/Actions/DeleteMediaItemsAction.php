<?php

declare(strict_types=1);

namespace App\Modules\Media\Actions;

use App\Modules\Catalog\Actions\DeleteProductImageAction;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Media\Models\MediaAsset;
use App\Modules\Media\Services\MediaLibraryService;
use App\Modules\Media\Services\MediaUploadService;

class DeleteMediaItemsAction
{
    private readonly MediaLibraryService $mediaLibraryService;

    public function __construct(
        private readonly MediaUploadService $mediaUploadService,
        private readonly DeleteProductImageAction $deleteProductImageAction,
        ?MediaLibraryService $mediaLibraryService = null
    ) {
        $this->mediaLibraryService = $mediaLibraryService ?? new MediaLibraryService;
    }

    /**
     * Delete the selected media library items and remove all references to their underlying file paths.
     *
     * Keys use the format "product:{id}", "library:{id}", or "combo:{productId}:{colorIndex}".
     *
     * @param  list<string>  $keys
     */
    public function execute(array $keys): int
    {
        $deletedCount = 0;
        $processedPaths = [];

        foreach (array_unique($keys) as $key) {
            $filePath = $this->resolveFilePathForKey($key);
            if ($filePath === '' || isset($processedPaths[$filePath])) {
                continue;
            }

            $processedPaths[$filePath] = true;

            // 1. Remove standalone library asset records referencing this file path
            MediaAsset::where('file_path', $filePath)->delete();

            // 2. Clear any combo color image references pointing to this file path
            $this->clearComboReferences($filePath);

            // 3. Remove all product/gallery/variant image rows and promote next primary if needed
            $productImages = ProductImage::with('product')
                ->where('file_path', $filePath)
                ->get();

            foreach ($productImages as $image) {
                $this->deleteProductImageAction->execute($image);
            }

            // 4. Ensure physical file and generated variants are removed if no references remain
            if (! $this->mediaLibraryService->isFilePathReferenced($filePath)) {
                $this->mediaUploadService->delete($filePath);
            }

            $deletedCount++;
        }

        return $deletedCount;
    }

    /**
     * Resolve the normalized storage file path for a given media library key.
     */
    private function resolveFilePathForKey(string $key): string
    {
        if (preg_match('/^combo:(\d+):(\d+)$/', $key, $comboMatches)) {
            $productId = (int) $comboMatches[1];
            $colorIndex = (int) $comboMatches[2];

            $product = Product::find($productId);
            if (! $product || ! is_array($product->combo_colors) || ! isset($product->combo_colors[$colorIndex])) {
                return '';
            }

            $rawUrl = (string) ($product->combo_colors[$colorIndex]['image_url'] ?? '');

            return $this->mediaLibraryService->extractStorageFilePath($rawUrl);
        }

        if (! preg_match('/^(product|library):(\d+)$/', $key, $matches)) {
            return '';
        }

        $recordId = (int) $matches[2];

        if ($matches[1] === 'library') {
            $asset = MediaAsset::find($recordId);

            return $asset ? $this->mediaLibraryService->extractStorageFilePath($asset->file_path) : '';
        }

        $image = ProductImage::find($recordId);

        return $image ? $this->mediaLibraryService->extractStorageFilePath($image->file_path) : '';
    }

    /**
     * Null out image_url entries on all products whose combo_colors reference the given file path.
     */
    private function clearComboReferences(string $filePath): void
    {
        $comboProducts = Product::whereNotNull('combo_colors')->get();

        foreach ($comboProducts as $comboProduct) {
            if (! is_array($comboProduct->combo_colors)) {
                continue;
            }

            $comboColors = $comboProduct->combo_colors;
            $changed = false;

            foreach ($comboColors as $idx => $colorRow) {
                if (! is_array($colorRow) || empty($colorRow['image_url'])) {
                    continue;
                }

                if ($this->mediaLibraryService->extractStorageFilePath((string) $colorRow['image_url']) === $filePath) {
                    $comboColors[$idx]['image_url'] = null;
                    $changed = true;
                }
            }

            if ($changed) {
                $comboProduct->combo_colors = $comboColors;
                $comboProduct->save();
            }
        }
    }
}
