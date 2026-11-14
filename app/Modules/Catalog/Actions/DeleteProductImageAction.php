<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Actions;

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Media\Services\MediaLibraryService;
use App\Modules\Media\Services\MediaUploadService;

class DeleteProductImageAction
{
    private readonly MediaLibraryService $mediaLibraryService;

    public function __construct(
        private readonly MediaUploadService $mediaUploadService,
        ?MediaLibraryService $mediaLibraryService = null
    ) {
        $this->mediaLibraryService = $mediaLibraryService ?? new MediaLibraryService;
    }

    /**
     * Delete a product image, its stored files when unreferenced elsewhere, and promote the next image when needed.
     */
    public function execute(ProductImage $image): void
    {
        /** @var Product|null $product */
        $product = $image->product;
        $wasPrimary = $image->is_primary;
        $filePath = $image->file_path;

        $image->delete();

        if ($filePath !== '' && ! $this->mediaLibraryService->isFilePathReferenced($filePath)) {
            $this->mediaUploadService->delete($filePath);
        }

        if ($wasPrimary && $product) {
            $nextImage = $product->images()->first();

            if ($nextImage) {
                $nextImage->update(['is_primary' => true]);
            }
        }
    }
}
