<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Actions\CreateProductAction;
use App\Modules\Catalog\Actions\UpdateProductAction;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Catalog\Requests\StoreProductRequest;
use App\Modules\Catalog\Requests\UpdateProductRequest;
use App\Modules\Catalog\Services\VariantMatrixGenerator;
use App\Modules\Media\Services\MediaLibraryService;
use App\Modules\Media\Services\MediaUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of products with filters.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Product::class);

        $query = Product::query()->with([
            'variants',
            'images' => fn ($q) => $q->orderByDesc('is_primary')->orderBy('sort_order'),
        ]);

        // Search filter
        if ($search = $request->input('search')) {
            $term = trim((string) $search);
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                    ->orWhere('slug', 'like', "%{$term}%")
                    ->orWhereHas('variants', fn ($vq) => $vq->where('sku', 'like', "%{$term}%"));
            });
        }

        // Status filter
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Stock level filter
        if ($stockLevel = $request->input('stock_level')) {
            match ($stockLevel) {
                'in_stock' => $query->inStock(),
                'low_stock' => $query->lowStock(5),
                'out_of_stock' => $query->outOfStock(),
                default => null,
            };
        }

        $products = $query->latest('id')->paginate(12)->withQueryString();

        // Calculate statistics
        $stats = [
            'total' => Product::count(),
            'active' => Product::where('status', 'active')->count(),
            'low_stock' => Product::lowStock(5)->count(),
            'out_of_stock' => Product::outOfStock()->count(),
        ];

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', ''),
                'stock_level' => $request->input('stock_level', ''),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create(): Response
    {
        Gate::authorize('create', Product::class);

        return Inertia::render('Admin/Products/Create', [
            'categories' => Category::orderBy('name')->get(['id', 'name', 'parent_id']),
        ]);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(
        StoreProductRequest $request,
        CreateProductAction $createProductAction,
        MediaUploadService $mediaUploadService
    ): RedirectResponse {
        $validated = $request->validated();

        if ($request->hasFile('combo_color_images') && ! empty($validated['combo_colors']) && is_array($validated['combo_colors'])) {
            $comboFiles = (array) $request->file('combo_color_images');
            foreach ($comboFiles as $cIndex => $cFile) {
                if ($cFile && isset($validated['combo_colors'][$cIndex])) {
                    $uploadResult = $mediaUploadService->upload($cFile, 'products');
                    $validated['combo_colors'][$cIndex]['image_url'] = \Illuminate\Support\Facades\Storage::disk('public')->url($uploadResult['file_path']);
                }
            }
        }

        $product = $createProductAction->execute($validated);

        $hasPrimary = false;
        $sortOrder = 0;

        // 1. Process Single Featured Product Image (Upload or Library Pick)
        if ($request->hasFile('featured_image')) {
            $featuredFile = $request->file('featured_image');
            if ($featuredFile) {
                $uploadResult = $mediaUploadService->upload($featuredFile, 'products');
                ProductImage::create([
                    'product_id' => $product->id,
                    'file_path' => $uploadResult['file_path'],
                    'sort_order' => $sortOrder++,
                    'is_primary' => true,
                    'alt_text' => $product->title,
                ]);
                $hasPrimary = true;
            }
        } elseif ($request->filled('featured_library_path')) {
            $libPath = trim((string) $request->input('featured_library_path'));
            if ($libPath !== '') {
                ProductImage::create([
                    'product_id' => $product->id,
                    'file_path' => $libPath,
                    'sort_order' => $sortOrder++,
                    'is_primary' => true,
                    'alt_text' => $product->title,
                ]);
                $hasPrimary = true;
            }
        }

        // 2. Process Gallery Images (Uploaded files)
        if ($request->hasFile('images')) {
            $uploadedFiles = (array) $request->file('images');

            foreach ($uploadedFiles as $file) {
                if ($file) {
                    $uploadResult = $mediaUploadService->upload($file, 'products');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'file_path' => $uploadResult['file_path'],
                        'sort_order' => $sortOrder++,
                        'is_primary' => ! $hasPrimary,
                        'alt_text' => $product->title,
                    ]);
                    $hasPrimary = true;
                }
            }
        }

        // 3. Process Gallery Images (Media Library picked paths)
        if ($request->filled('gallery_library_paths')) {
            $galleryPaths = (array) $request->input('gallery_library_paths');
            foreach ($galleryPaths as $gPath) {
                $cleanPath = trim((string) $gPath);
                if ($cleanPath !== '' && ! $product->images()->whereNull('variant_id')->where('file_path', $cleanPath)->exists()) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'file_path' => $cleanPath,
                        'sort_order' => $sortOrder++,
                        'is_primary' => ! $hasPrimary,
                        'alt_text' => $product->title,
                    ]);
                    $hasPrimary = true;
                }
            }
        }

        // Process any uploaded variant images
        if ($request->hasFile('variant_images')) {
            $variantImages = (array) $request->file('variant_images');
            $variants = $product->variants()->orderBy('id')->get();

            foreach ($variantImages as $vIndex => $file) {
                if ($file && isset($variants[$vIndex])) {
                    $variant = $variants[$vIndex];
                    $uploadResult = $mediaUploadService->upload($file, 'products');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'file_path' => $uploadResult['file_path'],
                        'sort_order' => 0,
                        'is_primary' => false,
                        'alt_text' => "{$product->title} - {$variant->name}",
                    ]);
                }
            }
        }

        return redirect()
            ->route('admin.products.index')
            ->with('success', "Product '{$product->title}' created successfully.");
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product): Response
    {
        Gate::authorize('view', $product);

        $product->load([
            'categories',
            'variants' => fn ($q) => $q->orderBy('id')->with(['images' => fn ($iq) => $iq->orderBy('sort_order')]),
            'images' => fn ($q) => $q->orderByDesc('is_primary')->orderBy('sort_order'),
        ]);

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
            'categories' => Category::orderBy('name')->get(['id', 'name', 'parent_id']),
        ]);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(
        UpdateProductRequest $request,
        Product $product,
        UpdateProductAction $updateProductAction,
        MediaUploadService $mediaUploadService,
        MediaLibraryService $mediaLibraryService
    ): RedirectResponse {
        $validated = $request->validated();

        if ($request->hasFile('combo_color_images') && ! empty($validated['combo_colors']) && is_array($validated['combo_colors'])) {
            $comboFiles = (array) $request->file('combo_color_images');
            foreach ($comboFiles as $cIndex => $cFile) {
                if ($cFile && isset($validated['combo_colors'][$cIndex])) {
                    $uploadResult = $mediaUploadService->upload($cFile, 'products');
                    $validated['combo_colors'][$cIndex]['image_url'] = \Illuminate\Support\Facades\Storage::disk('public')->url($uploadResult['file_path']);
                }
            }
        }

        $product = $updateProductAction->execute($product, $validated);

        // 1. Process Updated Single Featured Product Image (Upload or Library Pick)
        if ($request->hasFile('featured_image') || $request->filled('featured_library_path')) {
            $product->images()->where('is_primary', true)->update(['is_primary' => false]);

            if ($request->hasFile('featured_image')) {
                $featuredFile = $request->file('featured_image');
                if ($featuredFile) {
                    $uploadResult = $mediaUploadService->upload($featuredFile, 'products');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'file_path' => $uploadResult['file_path'],
                        'sort_order' => 0,
                        'is_primary' => true,
                        'alt_text' => $product->title,
                    ]);
                }
            } elseif ($request->filled('featured_library_path')) {
                $libPath = trim((string) $request->input('featured_library_path'));
                if ($libPath !== '') {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'file_path' => $libPath,
                        'sort_order' => 0,
                        'is_primary' => true,
                        'alt_text' => $product->title,
                    ]);
                }
            }
        }

        // 2. Process any newly attached gallery files
        if ($request->hasFile('images')) {
            $uploadedFiles = (array) $request->file('images');
            $hasExistingPrimary = $product->images()->where('is_primary', true)->exists();
            $currentCount = $product->images()->count();

            foreach ($uploadedFiles as $offset => $file) {
                if ($file) {
                    $uploadResult = $mediaUploadService->upload($file, 'products');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'file_path' => $uploadResult['file_path'],
                        'sort_order' => $currentCount + $offset,
                        'is_primary' => ! $hasExistingPrimary,
                        'alt_text' => $product->title,
                    ]);
                    $hasExistingPrimary = true;
                }
            }
        }

        // 3. Process any newly attached gallery images from Media Library
        if ($request->filled('gallery_library_paths')) {
            $galleryPaths = (array) $request->input('gallery_library_paths');
            $hasExistingPrimary = $product->images()->where('is_primary', true)->exists();
            $currentCount = $product->images()->count();

            foreach ($galleryPaths as $offset => $gPath) {
                $cleanPath = trim((string) $gPath);
                if ($cleanPath !== '' && ! $product->images()->whereNull('variant_id')->where('file_path', $cleanPath)->exists()) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'file_path' => $cleanPath,
                        'sort_order' => $currentCount + (int) $offset,
                        'is_primary' => ! $hasExistingPrimary,
                        'alt_text' => $product->title,
                    ]);
                    $hasExistingPrimary = true;
                }
            }
        }

        // Process any removed variant images
        if ($request->filled('remove_variant_images')) {
            $removeVariantIds = (array) $request->input('remove_variant_images');
            $imagesToDelete = ProductImage::where('product_id', $product->id)
                ->whereIn('variant_id', $removeVariantIds)
                ->get();

            foreach ($imagesToDelete as $oldImg) {
                $oldPath = $oldImg->file_path;
                $oldImg->delete();
                if ($oldPath !== '' && ! $mediaLibraryService->isFilePathReferenced($oldPath)) {
                    $mediaUploadService->delete($oldPath);
                }
            }
        }

        // Process any uploaded variant images
        if ($request->hasFile('variant_images')) {
            $variantImages = (array) $request->file('variant_images');
            $variants = $product->variants()->orderBy('id')->get();

            foreach ($variantImages as $vKey => $file) {
                if (! $file) {
                    continue;
                }

                $targetVariant = null;
                if (is_numeric($vKey)) {
                    $intKey = (int) $vKey;
                    $targetVariant = $variants->firstWhere('id', $intKey) ?? $variants->get($intKey);
                }

                if ($targetVariant) {
                    // Delete previous image for this variant if exists
                    $oldImages = ProductImage::where('product_id', $product->id)
                        ->where('variant_id', $targetVariant->id)
                        ->get();
                    foreach ($oldImages as $oldImg) {
                        $oldPath = $oldImg->file_path;
                        $oldImg->delete();
                        if ($oldPath !== '' && ! $mediaLibraryService->isFilePathReferenced($oldPath)) {
                            $mediaUploadService->delete($oldPath);
                        }
                    }

                    $uploadResult = $mediaUploadService->upload($file, 'products');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'variant_id' => $targetVariant->id,
                        'file_path' => $uploadResult['file_path'],
                        'sort_order' => 0,
                        'is_primary' => false,
                        'alt_text' => "{$product->title} - {$targetVariant->name}",
                    ]);
                }
            }
        }

        return redirect()
            ->route('admin.products.edit', $product)
            ->with('success', "Product '{$product->title}' updated successfully.");
    }

    /**
     * Duplicate an existing product along with its categories, variants, combo settings, and images.
     */
    public function duplicate(Product $product): RedirectResponse
    {
        Gate::authorize('create', Product::class);

        $product->load(['categories', 'variants', 'images']);

        $duplicated = \Illuminate\Support\Facades\DB::transaction(function () use ($product): Product {
            $baseSlug = $product->slug.'-copy';
            $newSlug = $baseSlug;
            $counter = 1;
            while (Product::where('slug', $newSlug)->exists()) {
                $newSlug = "{$baseSlug}-{$counter}";
                $counter++;
            }

            $newProduct = Product::create([
                'title' => $product->title.' (Copy)',
                'slug' => $newSlug,
                'description' => $product->description,
                'regular_price' => $product->regular_price,
                'sale_price' => $product->sale_price,
                'has_variants' => $product->has_variants,
                'combo_pack_size' => $product->combo_pack_size ?? 1,
                'combo_colors' => $product->combo_colors,
                'combo_sizes' => $product->combo_sizes,
                'status' => $product->status,
            ]);

            if ($product->categories->isNotEmpty()) {
                $newProduct->categories()->sync($product->categories->pluck('id')->all());
            }

            $variantIdMap = [];
            foreach ($product->variants as $oldVariant) {
                $baseSku = strtoupper($oldVariant->sku.'-COPY');
                $newSku = $baseSku;
                $skuCounter = 1;
                while (\App\Modules\Catalog\Models\ProductVariant::where('sku', $newSku)->exists()) {
                    $newSku = "{$baseSku}-{$skuCounter}";
                    $skuCounter++;
                }

                $createdVariant = \App\Modules\Catalog\Models\ProductVariant::create([
                    'product_id' => $newProduct->id,
                    'sku' => $newSku,
                    'name' => $oldVariant->name,
                    'attributes' => $oldVariant->attributes,
                    'regular_price' => $oldVariant->regular_price,
                    'sale_price' => $oldVariant->sale_price,
                    'stock_quantity' => $oldVariant->stock_quantity,
                    'manage_stock' => $oldVariant->manage_stock,
                ]);

                $variantIdMap[$oldVariant->id] = $createdVariant->id;
            }

            $seenImages = [];
            foreach ($product->images as $oldImg) {
                $dedupeKey = ($oldImg->variant_id ?? 0).':'.$oldImg->file_path;
                if (isset($seenImages[$dedupeKey])) {
                    continue;
                }
                $seenImages[$dedupeKey] = true;

                ProductImage::create([
                    'product_id' => $newProduct->id,
                    'variant_id' => $oldImg->variant_id ? ($variantIdMap[$oldImg->variant_id] ?? null) : null,
                    'file_path' => $oldImg->file_path,
                    'sort_order' => $oldImg->sort_order,
                    'is_primary' => $oldImg->is_primary,
                    'alt_text' => $newProduct->title,
                ]);
            }

            return $newProduct;
        });

        return redirect()
            ->route('admin.products.index')
            ->with('success', "Product '{$product->title}' duplicated as '{$duplicated->title}'.");
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(
        Product $product,
        MediaUploadService $mediaUploadService,
        MediaLibraryService $mediaLibraryService
    ): RedirectResponse {
        Gate::authorize('delete', $product);

        $productTitle = $product->title;
        $product->load('images');

        $candidatePaths = [];
        foreach ($product->images as $image) {
            $normalized = $mediaLibraryService->extractStorageFilePath((string) $image->file_path);
            if ($normalized !== '') {
                $candidatePaths[$normalized] = true;
            }
        }

        if (is_array($product->combo_colors)) {
            foreach ($product->combo_colors as $colorRow) {
                if (is_array($colorRow) && ! empty($colorRow['image_url'])) {
                    $normalized = $mediaLibraryService->extractStorageFilePath((string) $colorRow['image_url']);
                    if ($normalized !== '') {
                        $candidatePaths[$normalized] = true;
                    }
                }
            }
        }

        $product->delete();

        foreach (array_keys($candidatePaths) as $filePath) {
            if (! $mediaLibraryService->isFilePathReferenced($filePath)) {
                $mediaUploadService->delete($filePath);
            }
        }

        return redirect()
            ->route('admin.products.index')
            ->with('success', "Product '{$productTitle}' deleted successfully.");
    }

    /**
     * Preview variant matrix combinations without saving.
     */
    public function previewMatrix(
        Request $request,
        VariantMatrixGenerator $generator
    ): JsonResponse {
        Gate::authorize('create', Product::class);

        $validated = $request->validate([
            'attributes' => ['required', 'array'],
            'attributes.*' => ['array'],
        ]);

        $matrix = $generator->generate($validated['attributes']);

        return response()->json([
            'combinations' => $matrix,
        ]);
    }
}
