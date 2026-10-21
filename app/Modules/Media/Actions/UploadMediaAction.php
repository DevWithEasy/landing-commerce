<?php

declare(strict_types=1);

namespace App\Modules\Media\Actions;

use App\Modules\Media\Models\MediaAsset;
use App\Modules\Media\Services\MediaUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class UploadMediaAction
{
    public function __construct(
        private readonly MediaUploadService $mediaUploadService
    ) {}

    /**
     * Upload one or more images to the shared media library.
     *
     * @param  array<int, UploadedFile>  $files
     */
    public function execute(array $files, ?int $uploadedBy = null): int
    {
        $uploadedCount = 0;

        foreach ($files as $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $upload = $this->mediaUploadService->upload($file, 'media', [
                'thumb' => 300,
                'medium' => 800,
            ]);

            $originalName = Str::limit(
                basename($file->getClientOriginalName()),
                255,
                ''
            );

            MediaAsset::create([
                'file_path' => $upload['file_path'],
                'original_name' => $originalName,
                'mime_type' => $upload['mime_type'],
                'size_bytes' => $upload['size_bytes'],
                'width' => $upload['width'],
                'height' => $upload['height'],
                'alt_text' => pathinfo($originalName, PATHINFO_FILENAME) ?: null,
                'uploaded_by' => $uploadedBy,
            ]);

            $uploadedCount++;
        }

        return $uploadedCount;
    }
}
