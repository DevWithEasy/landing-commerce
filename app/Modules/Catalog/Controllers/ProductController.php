<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Actions\CreateProductAction;
use App\Modules\Catalog\Actions\UpdateProductAction;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\ProductImage;
use App\Modules\Catalog\Requests\StoreProductRequest;
use App\Modules\Catalog\Requests\UpdateProductRequest;
use App\Modules\Catalog\Services\VariantMatrixGenerator;
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

        return Inertia::render('Admin/Products/Create');
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
        $product = $createProductAction->execute($validated);

        // Process any uploaded images
        if ($request->hasFile('images')) {
            $uploadedFiles = (array) $request->file('images');
            $isFirst = true;

            foreach ($uploadedFiles as $index => $file) {
                if ($file) {
                    $uploadResult = $mediaUploadService->upload($file, 'products');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'file_path' => $uploadResult['file_path'],
                        'sort_order' => $index,
                        'is_primary' => $isFirst,
                        'alt_text' => $product->title,
                    ]);
                    $isFirst = false;
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
            'variants' => fn ($q) => $q->orderBy('id'),
            'images' => fn ($q) => $q->orderByDesc('is_primary')->orderBy('sort_order'),
        ]);

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
        ]);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(
        UpdateProductRequest $request,
        Product $product,
        UpdateProductAction $updateProductAction,
        MediaUploadService $mediaUploadService
    ): RedirectResponse {
        $validated = $request->validated();
        $product = $updateProductAction->execute($product, $validated);

        // Process any newly attached images
        if ($request->hasFile('images')) {
            $uploadedFiles = (array) $request->file('images');
            $hasExistingImages = $product->images()->count() > 0;
            $currentCount = $product->images()->count();

            foreach ($uploadedFiles as $offset => $file) {
                if ($file) {
                    $uploadResult = $mediaUploadService->upload($file, 'products');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'file_path' => $uploadResult['file_path'],
                        'sort_order' => $currentCount + $offset,
                        'is_primary' => ! $hasExistingImages && $offset === 0,
                        'alt_text' => $product->title,
                    ]);
                }
            }
        }

        return redirect()
            ->route('admin.products.edit', $product)
            ->with('success', "Product '{$product->title}' updated successfully.");
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(
        Product $product,
        MediaUploadService $mediaUploadService
    ): RedirectResponse {
        Gate::authorize('delete', $product);

        $productTitle = $product->title;

        // Delete physical files for product images
        foreach ($product->images as $image) {
            $mediaUploadService->delete($image->file_path);
        }

        $product->delete();

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
