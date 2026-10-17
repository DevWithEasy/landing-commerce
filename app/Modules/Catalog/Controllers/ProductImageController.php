<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Media\Services\MediaUploadService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProductImageController extends Controller
{
    /**
     * Upload and attach an image to the product.
     */
    public function store(
        Request $request,
        Product $product,
        MediaUploadService $mediaUploadService
    ): RedirectResponse {
        Gate::authorize('update', $product);

        $request->validate([
            'image' => ['required', 'file', 'mimes:jpeg,png,webp', 'max:10240'],
        ]);

        $uploadResult = $mediaUploadService->upload($request->file('image'), 'products');
        $isFirst = $product->images()->count() === 0;

        ProductImage::create([
            'product_id' => $product->id,
            'file_path' => $uploadResult['file_path'],
            'sort_order' => $product->images()->count(),
            'is_primary' => $isFirst,
            'alt_text' => $product->title,
        ]);

        return back()->with('success', 'Image uploaded successfully.');
    }

    /**
     * Remove an image from storage and delete the database record.
     */
    public function destroy(
        Product $product,
        ProductImage $image,
        MediaUploadService $mediaUploadService
    ): RedirectResponse {
        Gate::authorize('update', $product);

        if ($image->product_id !== $product->id) {
            abort(404, 'Image does not belong to this product.');
        }

        $wasPrimary = $image->is_primary;

        $mediaUploadService->delete($image->file_path);
        $image->delete();

        // If the primary image was deleted, promote the first remaining image
        if ($wasPrimary) {
            $nextImage = $product->images()->first();
            if ($nextImage) {
                $nextImage->update(['is_primary' => true]);
            }
        }

        return back()->with('success', 'Image removed successfully.');
    }

    /**
     * Set the specified image as the primary image for the product.
     */
    public function setPrimary(Product $product, ProductImage $image): RedirectResponse
    {
        Gate::authorize('update', $product);

        if ($image->product_id !== $product->id) {
            abort(404, 'Image does not belong to this product.');
        }

        $product->images()->update(['is_primary' => false]);
        $image->update(['is_primary' => true]);

        return back()->with('success', 'Primary image updated.');
    }
}
