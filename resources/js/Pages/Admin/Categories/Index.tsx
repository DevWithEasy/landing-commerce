import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    FolderTree,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import { Pagination } from '@/Shared/Pagination';
import type { Category, CategoryIndexProps } from '@/types';

export default function CategoryIndex({
    categories,
    rootCategories,
    filters,
}: CategoryIndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createSlug, setCreateSlug] = useState('');
    const [createParentId, setCreateParentId] = useState('');
    const [createDescription, setCreateDescription] = useState('');
    const [createSortOrder, setCreateSortOrder] = useState('0');
    const [createIsActive, setCreateIsActive] = useState(true);
    const [createImage, setCreateImage] = useState<File | null>(null);
    const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editName, setEditName] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [editParentId, setEditParentId] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editSortOrder, setEditSortOrder] = useState('0');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editImage, setEditImage] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

    // Delete Modal State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    // Submission & Feedback
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Filter Search
    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/categories',
            { search: search.trim() },
            { preserveState: true, replace: true }
        );
    };

    const handleClearSearch = () => {
        setSearch('');
        router.get('/admin/categories', {}, { preserveState: true, replace: true });
    };

    // Toggle Active Status
    const handleToggleStatus = (category: Category) => {
        router.post(
            `/admin/categories/${category.id}/toggle`,
            {},
            { preserveScroll: true }
        );
    };

    // Handle Image Selection
    const handleImageChange = (
        e: ChangeEvent<HTMLInputElement>,
        isEdit: boolean
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (isEdit) {
            setEditImage(file);
            setEditImagePreview(URL.createObjectURL(file));
        } else {
            setCreateImage(file);
            setCreateImagePreview(URL.createObjectURL(file));
        }
    };

    // Open Edit Modal
    const openEditModal = (cat: Category) => {
        setEditingCategory(cat);
        setEditName(cat.name);
        setEditSlug(cat.slug);
        setEditParentId(cat.parent_id ? String(cat.parent_id) : '');
        setEditDescription(cat.description || '');
        setEditSortOrder(String(cat.sort_order));
        setEditIsActive(cat.is_active);
        setEditImage(null);
        setEditImagePreview(cat.image_url || null);
        setFormErrors({});
        setIsEditOpen(true);
    };

    // Create Category Form Submit
    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        const formData = new FormData();
        formData.append('name', createName.trim());
        if (createSlug.trim()) formData.append('slug', createSlug.trim());
        if (createParentId) formData.append('parent_id', createParentId);
        if (createDescription.trim()) formData.append('description', createDescription.trim());
        formData.append('sort_order', createSortOrder);
        formData.append('is_active', createIsActive ? '1' : '0');
        if (createImage) formData.append('image', createImage);

        router.post('/admin/categories', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                setCreateName('');
                setCreateSlug('');
                setCreateParentId('');
                setCreateDescription('');
                setCreateSortOrder('0');
                setCreateIsActive(true);
                setCreateImage(null);
                setCreateImagePreview(null);
            },
            onError: (errors) => {
                setFormErrors(errors as Record<string, string>);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Edit Category Form Submit
    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        setIsSubmitting(true);
        setFormErrors({});

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', editName.trim());
        if (editSlug.trim()) formData.append('slug', editSlug.trim());
        if (editParentId) formData.append('parent_id', editParentId);
        if (editDescription.trim()) formData.append('description', editDescription.trim());
        formData.append('sort_order', editSortOrder);
        formData.append('is_active', editIsActive ? '1' : '0');
        if (editImage) formData.append('image', editImage);

        router.post(`/admin/categories/${editingCategory.id}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                setEditingCategory(null);
            },
            onError: (errors) => {
                setFormErrors(errors as Record<string, string>);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Delete Category Submit
    const handleDeleteSubmit = () => {
        if (!deletingCategory) return;
        setIsSubmitting(true);

        router.delete(`/admin/categories/${deletingCategory.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingCategory(null);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AdminLayout
            title="Category Management"
            subtitle="Organize your store catalog into hierarchical root categories and subcategories (max 2 levels)."
            actions={
                <Button
                    onClick={() => {
                        setFormErrors({});
                        setIsCreateOpen(true);
                    }}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                </Button>
            }
        >
            <Head title="Categories - Admin" />

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                <form onSubmit={handleSearchSubmit} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search categories by name or slug..."
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <Button type="submit" variant="secondary">
                        Search
                    </Button>
                </form>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Hierarchy</th>
                                <th className="py-3 px-4">Slug</th>
                                <th className="py-3 px-4 text-center">Products</th>
                                <th className="py-3 px-4 text-center">Sort</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-800">
                            {categories.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                        <FolderTree className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-base font-medium">No categories found</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Click "Add Category" above to create your first root category.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                categories.data.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-gray-50 transition">
                                        <td className="py-3.5 px-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                                {cat.image_url ? (
                                                    <img
                                                        src={cat.image_url}
                                                        alt={cat.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <FolderTree className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {cat.name}
                                                </div>
                                                {cat.description && (
                                                    <div className="text-xs text-gray-400 truncate max-w-xs">
                                                        {cat.description}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {cat.parent ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    <span>Subcategory of:</span>
                                                    <strong>{cat.parent.name}</strong>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Root Category
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                                            {cat.slug}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {cat.products_count ?? 0}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center text-xs text-gray-500 font-mono">
                                            {cat.sort_order}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(cat)}
                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    cat.is_active ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                        cat.is_active ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(cat)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition"
                                                    title="Edit category"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDeletingCategory(cat);
                                                        setIsDeleteOpen(true);
                                                    }}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 transition"
                                                    title="Delete category"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {categories.total > categories.per_page && (
                    <div className="p-4 border-t border-gray-100">
                        <Pagination
                            links={categories.links}
                            from={categories.from}
                            to={categories.to}
                            total={categories.total}
                        />
                    </div>
                )}
            </div>

            {/* Create Category Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-600" />
                                <span>Create Category</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    placeholder="e.g. Men's Fashion, Electronics"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {formErrors.name && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Slug (URL identifier)
                                </label>
                                <input
                                    type="text"
                                    value={createSlug}
                                    onChange={(e) => setCreateSlug(e.target.value)}
                                    placeholder="Leave blank to generate automatically"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {formErrors.slug && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.slug}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Parent Category (Max 2 Levels)
                                </label>
                                <select
                                    value={createParentId}
                                    onChange={(e) => setCreateParentId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                >
                                    <option value="">None (Top-level Root Category)</option>
                                    {rootCategories.map((rc) => (
                                        <option key={rc.id} value={rc.id}>
                                            {rc.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    Assigning a parent makes this category a Subcategory (Level 2).
                                </p>
                                {formErrors.parent_id && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.parent_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={createDescription}
                                    onChange={(e) => setCreateDescription(e.target.value)}
                                    placeholder="Brief summary of items in this category"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {formErrors.description && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={createSortOrder}
                                        onChange={(e) => setCreateSortOrder(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {formErrors.sort_order && (
                                        <p className="text-xs text-red-600 mt-1">{formErrors.sort_order}</p>
                                    )}
                                </div>
                                <div className="flex items-center pt-5">
                                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={createIsActive}
                                            onChange={(e) => setCreateIsActive(e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span>Active / Visible</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Category Image (WebP, PNG, JPEG)
                                </label>
                                <div className="flex items-center gap-4">
                                    {createImagePreview && (
                                        <div className="w-14 h-14 rounded-lg border border-gray-200 overflow-hidden shrink-0">
                                            <img
                                                src={createImagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(e) => handleImageChange(e, false)}
                                        className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                </div>
                                {formErrors.image && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.image}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsCreateOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Create Category'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {isEditOpen && editingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-indigo-600" />
                                <span>Edit Category: {editingCategory.name}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsEditOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {formErrors.name && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Slug (URL identifier)
                                </label>
                                <input
                                    type="text"
                                    value={editSlug}
                                    onChange={(e) => setEditSlug(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {formErrors.slug && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.slug}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Parent Category (Max 2 Levels)
                                </label>
                                <select
                                    value={editParentId}
                                    onChange={(e) => setEditParentId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                >
                                    <option value="">None (Top-level Root Category)</option>
                                    {rootCategories
                                        .filter((rc) => rc.id !== editingCategory.id)
                                        .map((rc) => (
                                            <option key={rc.id} value={rc.id}>
                                                {rc.name}
                                            </option>
                                        ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    A subcategory cannot have children. A root category cannot be assigned to itself.
                                </p>
                                {formErrors.parent_id && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.parent_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {formErrors.description && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editSortOrder}
                                        onChange={(e) => setEditSortOrder(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {formErrors.sort_order && (
                                        <p className="text-xs text-red-600 mt-1">{formErrors.sort_order}</p>
                                    )}
                                </div>
                                <div className="flex items-center pt-5">
                                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={editIsActive}
                                            onChange={(e) => setEditIsActive(e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span>Active / Visible</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Change Image (WebP, PNG, JPEG)
                                </label>
                                <div className="flex items-center gap-4">
                                    {editImagePreview && (
                                        <div className="w-14 h-14 rounded-lg border border-gray-200 overflow-hidden shrink-0">
                                            <img
                                                src={editImagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(e) => handleImageChange(e, true)}
                                        className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                </div>
                                {formErrors.image && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.image}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsEditOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Update Category'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && deletingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Delete Category?
                            </h3>
                        </div>

                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            Are you sure you want to delete category{' '}
                            <strong className="text-gray-900">{deletingCategory.name}</strong>?
                            Any subcategories under it will be safely reassigned to root level, and
                            assigned products will remain in the catalog.
                        </p>

                        <div className="flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsDeleteOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleDeleteSubmit}
                                disabled={isSubmitting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
