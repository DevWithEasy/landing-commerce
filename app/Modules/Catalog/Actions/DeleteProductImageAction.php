<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Actions;

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Media\Services\MediaUploadService;

class DeleteProductImageAction
{
    public function __construct(
        private readonly MediaUploadService $mediaUploadService
    ) {}

    /**
     * Delete a product image, its stored files, and promote the next image when needed.
     */
    public function execute(ProductImage $image): void
    {
        /** @var Product|null $product */
        $product = $image->product;
        $wasPrimary = $image->is_primary;

        $this->mediaUploadService->delete($image->file_path);
        $image->delete();

        if ($wasPrimary && $product) {
            $nextImage = $product->images()->first();

            if ($nextImage) {
                $nextImage->update(['is_primary' => true]);
            }
        }
    }
}
