<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Requests\StoreCategoryRequest;
use App\Modules\Catalog\Requests\UpdateCategoryRequest;
use App\Modules\Media\Services\MediaUploadService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function __construct(
        protected MediaUploadService $mediaUploadService
    ) {}

    /**
     * Display a listing of categories.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('manage-categories');

        $query = Category::query()
            ->with(['parent', 'children'])
            ->withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($search = $request->input('search')) {
            $term = trim((string) $search);
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('slug', 'like', "%{$term}%");
            });
        }

        $categories = $query->paginate(25)->withQueryString();

        // Get root categories for parent selection (excluding non-root categories)
        $rootCategories = Category::query()
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'rootCategories' => $rootCategories,
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Sanitize a relative storage path selected from the Media Library.
     */
    protected function sanitizeMediaPath(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        $trimmed = ltrim(trim($path), '/');
        if (
            $trimmed === ''
            || str_contains($trimmed, '..')
            || preg_match('#^(https?:|javascript:|data:|vbscript:)#i', $trimmed) === 1
        ) {
            return null;
        }

        if (str_starts_with($trimmed, 'storage/')) {
            $trimmed = substr($trimmed, strlen('storage/'));
        }

        return Storage::disk('public')->exists($trimmed) ? $trimmed : null;
    }

    /**
     * Store a newly created category.
     */
    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $baseSlug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['name']);
        $slug = $this->generateUniqueSlug($baseSlug);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $upload = $this->mediaUploadService->upload($request->file('image'), 'categories');
            $imagePath = $upload['file_path'];
        } elseif (! empty($validated['image_path'])) {
            $imagePath = $this->sanitizeMediaPath($validated['image_path']);
        }

        $category = Category::create([
            'name' => trim($validated['name']),
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'parent_id' => ! empty($validated['parent_id']) ? (int) $validated['parent_id'] : null,
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'image_path' => $imagePath,
        ]);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', "Category '{$category->name}' created successfully.");
    }

    /**
     * Update the specified category.
     */
    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();

        $baseSlug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['name']);
        if ($baseSlug !== $category->slug) {
            $slug = $this->generateUniqueSlug($baseSlug, $category->id);
        } else {
            $slug = $category->slug;
        }

        $imagePath = $category->image_path;

        if ($request->boolean('remove_image')) {
            if ($category->image_path && str_starts_with($category->image_path, 'categories/')) {
                $this->mediaUploadService->delete($category->image_path);
            }
            $imagePath = null;
        } elseif ($request->hasFile('image')) {
            if ($category->image_path && str_starts_with($category->image_path, 'categories/')) {
                $this->mediaUploadService->delete($category->image_path);
            }
            $upload = $this->mediaUploadService->upload($request->file('image'), 'categories');
            $imagePath = $upload['file_path'];
        } elseif (! empty($validated['image_path'])) {
            $mediaPath = $this->sanitizeMediaPath($validated['image_path']);
            if ($mediaPath) {
                if ($category->image_path && $category->image_path !== $mediaPath && str_starts_with($category->image_path, 'categories/')) {
                    $this->mediaUploadService->delete($category->image_path);
                }
                $imagePath = $mediaPath;
            }
        }

        $category->update([
            'name' => trim($validated['name']),
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'parent_id' => ! empty($validated['parent_id']) ? (int) $validated['parent_id'] : null,
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'image_path' => $imagePath,
        ]);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', "Category '{$category->name}' updated successfully.");
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(Category $category): RedirectResponse
    {
        Gate::authorize('manage-categories');

        $name = $category->name;

        // Only delete files originally stored in categories/ (avoid deleting shared media library files)
        if ($category->image_path && str_starts_with($category->image_path, 'categories/')) {
            $this->mediaUploadService->delete($category->image_path);
        }

        // Subcategories: because of parent_id nullOnDelete, their parent_id becomes null (reassigned to root)
        $category->delete();

        return redirect()
            ->route('admin.categories.index')
            ->with('success', "Category '{$name}' deleted successfully.");
    }

    /**
     * Toggle the active status of the category.
     */
    public function toggle(Category $category): RedirectResponse
    {
        Gate::authorize('manage-categories');

        $category->update([
            'is_active' => ! $category->is_active,
        ]);

        $status = $category->is_active ? 'activated' : 'deactivated';

        return redirect()
            ->route('admin.categories.index')
            ->with('success', "Category '{$category->name}' {$status}.");
    }

    protected function generateUniqueSlug(string $baseSlug, ?int $ignoreId = null): string
    {
        $slug = $baseSlug;
        $counter = 1;

        $query = Category::where('slug', $slug);
        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        while ($query->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;

            $query = Category::where('slug', $slug);
            if ($ignoreId !== null) {
                $query->where('id', '!=', $ignoreId);
            }
        }

        return $slug;
    }
}
