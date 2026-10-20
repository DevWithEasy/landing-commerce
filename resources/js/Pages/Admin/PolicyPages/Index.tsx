import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ExternalLink,
    FileText,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import { Pagination } from '@/Shared/Pagination';
import { RichTextEditor } from '@/Shared/RichTextEditor';
import type { PolicyPage, PolicyPageIndexProps } from '@/types';

export default function PolicyPagesIndex({
    pages,
    filters,
}: PolicyPageIndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [createSlug, setCreateSlug] = useState('');
    const [createContent, setCreateContent] = useState('');
    const [createIsPublished, setCreateIsPublished] = useState(true);

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<PolicyPage | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editIsPublished, setEditIsPublished] = useState(true);

    // Delete Modal State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingPage, setDeletingPage] = useState<PolicyPage | null>(null);

    // Submission & Feedback
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Filter Search
    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/pages',
            { search: search.trim() },
            { preserveState: true, replace: true }
        );
    };

    const handleClearSearch = () => {
        setSearch('');
        router.get('/admin/pages', {}, { preserveState: true, replace: true });
    };

    // Toggle Published Status
    const handleToggleStatus = (page: PolicyPage) => {
        router.post(
            `/admin/pages/${page.id}/toggle`,
            {},
            { preserveScroll: true }
        );
    };

    // Open Edit Modal
    const openEditModal = (page: PolicyPage) => {
        setEditingPage(page);
        setEditTitle(page.title);
        setEditSlug(page.slug);
        setEditContent(page.content);
        setEditIsPublished(page.is_published);
        setFormErrors({});
        setIsEditOpen(true);
    };

    // Create Page Submit
    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        router.post(
            '/admin/pages',
            {
                title: createTitle.trim(),
                slug: createSlug.trim() || undefined,
                content: createContent,
                is_published: createIsPublished,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setCreateTitle('');
                    setCreateSlug('');
                    setCreateContent('');
                    setCreateIsPublished(true);
                },
                onError: (errors) => {
                    setFormErrors(errors as Record<string, string>);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Edit Page Submit
    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingPage) return;
        setIsSubmitting(true);
        setFormErrors({});

        router.put(
            `/admin/pages/${editingPage.id}`,
            {
                title: editTitle.trim(),
                slug: editSlug.trim() || undefined,
                content: editContent,
                is_published: editIsPublished,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditOpen(false);
                    setEditingPage(null);
                },
                onError: (errors) => {
                    setFormErrors(errors as Record<string, string>);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Delete Page Submit
    const handleDeleteSubmit = () => {
        if (!deletingPage) return;
        setIsSubmitting(true);

        router.delete(`/admin/pages/${deletingPage.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingPage(null);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AdminLayout
            title="Policy & Content Pages"
            subtitle="Manage required business, legal, and storefront policy pages (Privacy, Terms, Return Policy, About, Contact)."
            actions={
                <Button
                    onClick={() => {
                        setFormErrors({});
                        setIsCreateOpen(true);
                    }}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Policy Page</span>
                </Button>
            }
        >
            <Head title="Policy Pages - Admin" />

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                <form onSubmit={handleSearchSubmit} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search policy pages by title or slug..."
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

            {/* Pages Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                                <th className="py-3 px-4">Title</th>
                                <th className="py-3 px-4">URL Path</th>
                                <th className="py-3 px-4 text-center">Published</th>
                                <th className="py-3 px-4 text-center">Public Link</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-800">
                            {pages.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-500">
                                        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-base font-medium">No policy pages found</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Click "Create Policy Page" above to publish your first content page.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                pages.data.map((page) => (
                                    <tr key={page.id} className="hover:bg-gray-50 transition">
                                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                                            {page.title}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                                            /pages/{page.slug}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(page)}
                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    page.is_published ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                        page.is_published ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            {page.is_published ? (
                                                <a
                                                    href={`/pages/${page.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                                >
                                                    <span>View Live</span>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400">Unpublished</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(page)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition"
                                                    title="Edit page"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDeletingPage(page);
                                                        setIsDeleteOpen(true);
                                                    }}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 transition"
                                                    title="Delete page"
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

                {pages.total > pages.per_page && (
                    <div className="p-4 border-t border-gray-100">
                        <Pagination
                            links={pages.links}
                            from={pages.from}
                            to={pages.to}
                            total={pages.total}
                        />
                    </div>
                )}
            </div>

            {/* Create Policy Page Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-gray-200 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-600" />
                                <span>Create Policy Page</span>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                        Page Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createTitle}
                                        onChange={(e) => setCreateTitle(e.target.value)}
                                        placeholder="e.g. Terms and Conditions"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {formErrors.title && (
                                        <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                        Slug (URL Path)
                                    </label>
                                    <input
                                        type="text"
                                        value={createSlug}
                                        onChange={(e) => setCreateSlug(e.target.value)}
                                        placeholder="terms-and-conditions"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xs"
                                    />
                                    {formErrors.slug && (
                                        <p className="text-xs text-red-600 mt-1">{formErrors.slug}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <RichTextEditor
                                    label="Page Content"
                                    required
                                    placeholder="Write or format your policy content here..."
                                    value={createContent}
                                    onChange={(html) => setCreateContent(html)}
                                    error={formErrors.content}
                                    minHeight="260px"
                                />
                            </div>

                            <div className="flex items-center">
                                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={createIsPublished}
                                        onChange={(e) => setCreateIsPublished(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span>Published (accessible to customers at /pages/{createSlug || 'slug'})</span>
                                </label>
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
                                    {isSubmitting ? 'Saving...' : 'Create Page'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Policy Page Modal */}
            {isEditOpen && editingPage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-gray-200 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-indigo-600" />
                                <span>Edit Policy Page: {editingPage.title}</span>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                        Page Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {formErrors.title && (
                                        <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                        Slug (URL Path)
                                    </label>
                                    <input
                                        type="text"
                                        value={editSlug}
                                        onChange={(e) => setEditSlug(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xs"
                                    />
                                    {formErrors.slug && (
                                        <p className="text-xs text-red-600 mt-1">{formErrors.slug}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <RichTextEditor
                                    label="Page Content"
                                    required
                                    placeholder="Write or format your policy content here..."
                                    value={editContent}
                                    onChange={(html) => setEditContent(html)}
                                    error={formErrors.content}
                                    minHeight="260px"
                                />
                            </div>

                            <div className="flex items-center">
                                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={editIsPublished}
                                        onChange={(e) => setEditIsPublished(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span>Published (accessible to customers at /pages/{editSlug})</span>
                                </label>
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
                                    {isSubmitting ? 'Saving...' : 'Update Page'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && deletingPage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Delete Policy Page?
                            </h3>
                        </div>

                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            Are you sure you want to delete{' '}
                            <strong className="text-gray-900">{deletingPage.title}</strong>?
                            Customers accessing this URL will receive a 404 error.
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
