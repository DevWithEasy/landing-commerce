<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PageBuilder\Models\PolicyPage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PolicyPageController extends Controller
{
    /**
     * Display a listing of policy and content pages.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('manage-policy-pages');

        $query = PolicyPage::query()->latest('id');

        if ($search = $request->input('search')) {
            $term = trim((string) $search);
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                    ->orWhere('slug', 'like', "%{$term}%");
            });
        }

        $pages = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/PolicyPages/Index', [
            'pages' => $pages,
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Store a newly created policy page.
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('manage-policy-pages');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:policy_pages,slug'],
            'content' => ['required', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $baseSlug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['title']);
        $slug = $this->generateUniqueSlug($baseSlug);

        $page = PolicyPage::create([
            'title' => trim($validated['title']),
            'slug' => $slug,
            'content' => $validated['content'],
            'is_published' => (bool) ($validated['is_published'] ?? false),
        ]);

        return redirect()
            ->route('admin.pages.index')
            ->with('success', "Policy page '{$page->title}' created successfully.");
    }

    /**
     * Update the specified policy page.
     */
    public function update(Request $request, PolicyPage $page): RedirectResponse
    {
        Gate::authorize('manage-policy-pages');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('policy_pages', 'slug')->ignore($page->id),
            ],
            'content' => ['required', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $baseSlug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['title']);
        $slug = $page->isProtected()
            ? $page->slug
            : ($baseSlug !== $page->slug ? $this->generateUniqueSlug($baseSlug, $page->id) : $page->slug);

        $page->update([
            'title' => trim($validated['title']),
            'slug' => $slug,
            'content' => $validated['content'],
            'is_published' => (bool) ($validated['is_published'] ?? false),
        ]);

        return redirect()
            ->route('admin.pages.index')
            ->with('success', "Policy page '{$page->title}' updated successfully.");
    }

    /**
     * Remove the specified policy page from storage.
     */
    public function destroy(PolicyPage $page): RedirectResponse
    {
        Gate::authorize('manage-policy-pages');

        if ($page->isProtected()) {
            return redirect()
                ->route('admin.pages.index')
                ->with('error', "Required page '{$page->title}' cannot be deleted. You can update its content instead.");
        }

        $title = $page->title;
        $page->delete();

        return redirect()
            ->route('admin.pages.index')
            ->with('success', "Policy page '{$title}' deleted successfully.");
    }

    /**
     * Toggle the publish status of the policy page.
     */
    public function toggle(PolicyPage $page): RedirectResponse
    {
        Gate::authorize('manage-policy-pages');

        $page->update([
            'is_published' => ! $page->is_published,
        ]);

        $status = $page->is_published ? 'published' : 'unpublished';

        return redirect()
            ->route('admin.pages.index')
            ->with('success', "Policy page '{$page->title}' {$status}.");
    }

    protected function generateUniqueSlug(string $baseSlug, ?int $ignoreId = null): string
    {
        $slug = $baseSlug;
        $counter = 1;

        $query = PolicyPage::where('slug', $slug);
        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        while ($query->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;

            $query = PolicyPage::where('slug', $slug);
            if ($ignoreId !== null) {
                $query->where('id', '!=', $ignoreId);
            }
        }

        return $slug;
    }
}
