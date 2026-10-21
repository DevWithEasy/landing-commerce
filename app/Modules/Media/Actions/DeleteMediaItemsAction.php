<?php

declare(strict_types=1);

namespace App\Modules\Media\Actions;

use App\Modules\Catalog\Actions\DeleteProductImageAction;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Media\Models\MediaAsset;
use App\Modules\Media\Services\MediaUploadService;

class DeleteMediaItemsAction
{
    public function __construct(
        private readonly MediaUploadService $mediaUploadService,
        private readonly DeleteProductImageAction $deleteProductImageAction
    ) {}

    /**
     * Delete the selected media library items.
     *
     * Keys use the format "product:{id}" or "library:{id}".
     *
     * @param  list<string>  $keys
     */
    public function execute(array $keys): int
    {
        $deletedCount = 0;

        foreach (array_unique($keys) as $key) {
            if (! preg_match('/^(product|library):(\d+)$/', $key, $matches)) {
                continue;
            }

            $recordId = (int) $matches[2];

            if ($matches[1] === 'library') {
                $asset = MediaAsset::find($recordId);

                if (! $asset) {
                    continue;
                }

                $this->mediaUploadService->delete($asset->file_path);
                $asset->delete();
                $deletedCount++;

                continue;
            }

            $image = ProductImage::with('product')->find($recordId);

            if (! $image) {
                continue;
            }

            $this->deleteProductImageAction->execute($image);
            $deletedCount++;
        }

        return $deletedCount;
    }
}
