<?php

declare(strict_types=1);

namespace App\Modules\Media\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use InvalidArgumentException;

class MediaUploadService
{
    /**
     * Approved raster MIME types.
     * SVG is strictly prohibited by default.
     *
     * @var list<string>
     */
    protected const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    protected ImageManager $manager;

    public function __construct(?ImageManager $manager = null)
    {
        $this->manager = $manager ?? new ImageManager(new Driver);
    }

    /**
     * @return list<string>
     */
    public function getAllowedMimeTypes(): array
    {
        return self::ALLOWED_MIME_TYPES;
    }

    /**
     * Validate image file existence and inspect true MIME type via finfo_file.
     */
    public function validateImage(UploadedFile|string $file): string
    {
        $filePath = $file instanceof UploadedFile ? $file->getRealPath() : $file;

        if (! is_string($filePath) || ! file_exists($filePath)) {
            throw new InvalidArgumentException('Image file does not exist or is unreadable.');
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo === false) {
            throw new InvalidArgumentException('Failed to open fileinfo database.');
        }

        $mimeType = finfo_file($finfo, $filePath);
        finfo_close($finfo);

        if ($mimeType === false || ! in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            throw new InvalidArgumentException(
                'Unsupported or unsafe image format. Only WebP, PNG, and JPEG raster formats are permitted.'
            );
        }

        return $mimeType;
    }

    /**
     * Validate, convert to WebP, generate responsive variants, and store on public disk.
     *
     * @param  array<string, int>  $variantSizes  Variant name => target pixel width
     * @param  int  $quality  WebP compression quality (1-100)
     * @return array{
     *     file_path: string,
     *     filename: string,
     *     directory: string,
     *     mime_type: string,
     *     width: int,
     *     height: int,
     *     size_bytes: int,
     *     variants: array<string, string>
     * }
     */
    public function upload(
        UploadedFile|string $file,
        string $directory = 'products',
        array $variantSizes = ['thumb' => 300, 'medium' => 800],
        int $quality = 85
    ): array {
        $this->validateImage($file);

        $filePath = $file instanceof UploadedFile ? $file->getRealPath() : $file;
        $image = $this->manager->decodePath((string) $filePath);

        $randomName = Str::random(40);
        $directory = trim($directory, '/');

        // 1. Process & Store Main WebP Image
        $encodedMain = $image->encodeUsingFileExtension('webp', quality: $quality);
        $mainPath = "{$directory}/{$randomName}.webp";

        $disk = Storage::disk('public');
        $disk->put($mainPath, (string) $encodedMain);

        // 2. Generate Responsive Variants
        $variants = [];
        foreach ($variantSizes as $sizeName => $targetWidth) {
            if ($targetWidth > 0 && $image->width() > $targetWidth) {
                $variantImage = clone $image;
                $variantImage->scaleDown(width: $targetWidth);

                $encodedVariant = $variantImage->encodeUsingFileExtension('webp', quality: $quality);
                $variantPath = "{$directory}/{$randomName}-{$sizeName}.webp";

                $disk->put($variantPath, (string) $encodedVariant);
                $variants[$sizeName] = $variantPath;
            }
        }

        return [
            'file_path' => $mainPath,
            'filename' => "{$randomName}.webp",
            'directory' => $directory,
            'mime_type' => 'image/webp',
            'width' => $image->width(),
            'height' => $image->height(),
            'size_bytes' => strlen((string) $encodedMain),
            'variants' => $variants,
        ];
    }

    /**
     * Delete stored image and any associated generated variants.
     */
    public function delete(string $filePath): bool
    {
        $disk = Storage::disk('public');

        if ($disk->exists($filePath)) {
            $disk->delete($filePath);
        }

        // Clean up any matching variants in the directory
        $dir = dirname($filePath);
        $baseName = pathinfo($filePath, PATHINFO_FILENAME);

        $files = $disk->files($dir);
        foreach ($files as $file) {
            if (str_starts_with(basename($file), "{$baseName}-")) {
                $disk->delete($file);
            }
        }

        return true;
    }
}
