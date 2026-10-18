import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Copy,
    ExternalLink,
    FileText,
    Layers,
    Palette,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import { Pagination } from '@/Shared/Pagination';
import type { LandingPageData, PaginatedData } from '@/types';

interface ProductOption {
    id: number;
    title: string;
    slug: string;
    regular_price: string | number;
    sale_price: string | number | null;
}

interface LandingPagesIndexProps {
    landingPages: PaginatedData<LandingPageData>;
    filters: {
        search: string;
        status: string;
    };
    products: ProductOption[];
}

export default function LandingPagesIndex({
    landingPages,
    filters,
    products,
}: LandingPagesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [createSlug, setCreateSlug] = useState('');
    const [createProductId, setCreateProductId] = useState<string>('');
    const [createStatus, setCreateStatus] = useState<'draft' | 'published'>('draft');
    const [createIsDefault, setCreateIsDefault] = useState(false);
    const [createPrimaryColor, setCreatePrimaryColor] = useState('#16a34a');
    const [createFontFamily, setCreateFontFamily] = useState('Inter');
    const [createSeoTitle, setCreateSeoTitle] = useState('');
    const [createSeoDesc, setCreateSeoDesc] = useState('');
    const [createOpenBuilder, setCreateOpenBuilder] = useState(true);
    const [showAdvancedSeo, setShowAdvancedSeo] = useState(false);

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<LandingPageData | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [editProductId, setEditProductId] = useState<string>('');
    const [editStatus, setEditStatus] = useState<'draft' | 'published'>('draft');
    const [editIsDefault, setEditIsDefault] = useState(false);
    const [editSeoTitle, setEditSeoTitle] = useState('');
    const [editSeoDesc, setEditSeoDesc] = useState('');

    // Delete Modal State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingPage, setDeletingPage] = useState<LandingPageData | null>(null);

    // Submission & Feedback
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

    // Helper: auto-generate slug from title
    const handleTitleChange = (val: string) => {
        setCreateTitle(val);
        const generatedSlug = val
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        setCreateSlug(generatedSlug);
    };

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/landing-pages',
            {
                search: search || undefined,
                status: statusFilter || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleStatusFilterChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        router.get(
            '/admin/landing-pages',
            {
                search: search || undefined,
                status: newStatus || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleCopyUrl = (slug: string) => {
        const fullUrl = `${window.location.origin}/p/${slug}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedSlug(slug);
        setTimeout(() => setCopiedSlug(null), 2000);
    };

    const openCreate = () => {
        setCreateTitle('');
        setCreateSlug('');
        setCreateProductId(products[0]?.id ? String(products[0].id) : '');
        setCreateStatus('draft');
        setCreateIsDefault(false);
        setCreatePrimaryColor('#16a34a');
        setCreateFontFamily('Inter');
        setCreateSeoTitle('');
        setCreateSeoDesc('');
        setCreateOpenBuilder(true);
        setShowAdvancedSeo(false);
        setFormErrors({});
        setIsCreateOpen(true);
    };

    const openEdit = (page: LandingPageData) => {
        setEditingPage(page);
        setEditTitle(page.title);
        setEditSlug(page.slug);
        setEditProductId(page.product_id ? String(page.product_id) : '');
        setEditStatus(page.status === 'published' ? 'published' : 'draft');
        setEditIsDefault(page.is_default);
        const meta = (page.meta_seo as Record<string, string>) || {};
        setEditSeoTitle(meta.title || '');
        setEditSeoDesc(meta.description || '');
        setFormErrors({});
        setIsEditOpen(true);
    };

    const openDelete = (page: LandingPageData) => {
        setDeletingPage(page);
        setIsDeleteOpen(true);
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        router.post(
            '/admin/landing-pages',
            {
                title: createTitle,
                slug: createSlug,
                product_id: createProductId ? parseInt(createProductId, 10) : null,
                status: createStatus,
                is_default: createIsDefault,
                meta_seo: {
                    title: createSeoTitle || createTitle,
                    description: createSeoDesc || '',
                },
                settings: {
                    primaryColor: createPrimaryColor,
                    fontFamily: createFontFamily,
                },
                open_builder: createOpenBuilder,
            },
            {
                onSuccess: () => {
                    setIsCreateOpen(false);
                },
                onError: (errs) => {
                    setFormErrors(errs as Record<string, string>);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingPage) return;

        setIsSubmitting(true);
        setFormErrors({});

        router.put(
            `/admin/landing-pages/${editingPage.id}`,
            {
                title: editTitle,
                slug: editSlug,
                product_id: editProductId ? parseInt(editProductId, 10) : null,
                status: editStatus,
                is_default: editIsDefault,
                meta_seo: {
                    title: editSeoTitle,
                    description: editSeoDesc,
                },
            },
            {
                onSuccess: () => {
                    setIsEditOpen(false);
                    setEditingPage(null);
                },
                onError: (errs) => {
                    setFormErrors(errs as Record<string, string>);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleTogglePublish = (page: LandingPageData) => {
        const endpoint =
            page.status === 'published'
                ? `/admin/landing-pages/${page.id}/unpublish`
                : `/admin/landing-pages/${page.id}/publish`;

        router.post(
            endpoint,
            {},
            {
                preserveScroll: true,
            }
        );
    };

    const handleDeleteSubmit = () => {
        if (!deletingPage) return;

        setIsSubmitting(true);
        router.delete(`/admin/landing-pages/${deletingPage.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingPage(null);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AdminLayout
            title="Landing Pages"
            subtitle="Design, publish, and manage high-converting single-product landing pages."
            actions={
                <Button onClick={openCreate} className="inline-flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Create Landing Page</span>
                </Button>
            }
        >
            <Head title="Landing Pages Management - Admin" />

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Status Tabs */}
                    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg self-start">
                        {[
                            { key: '', label: 'All Pages' },
                            { key: 'published', label: 'Published' },
                            { key: 'draft', label: 'Drafts' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleStatusFilterChange(tab.key)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                                    statusFilter === tab.key
                                        ? 'bg-white text-gray-900 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by title or slug..."
                                className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
                            Search
                        </Button>
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    router.get(
                                        '/admin/landing-pages',
                                        { status: statusFilter || undefined },
                                        { preserveState: true }
                                    );
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1 text-xs"
                                title="Clear search"
                            >
                                Clear
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {/* Landing Pages Table */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th scope="col" className="px-6 py-3.5">
                                    Landing Page
                                </th>
                                <th scope="col" className="px-6 py-3.5">
                                    Linked Product
                                </th>
                                <th scope="col" className="px-6 py-3.5">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3.5">
                                    Revisions
                                </th>
                                <th scope="col" className="px-6 py-3.5">
                                    Last Updated
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {landingPages.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="max-w-sm mx-auto flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
                                                <Layers className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 mb-1">
                                                No landing pages found
                                            </h3>
                                            <p className="text-xs text-gray-500 mb-4">
                                                {search || statusFilter
                                                    ? 'No landing pages match your search criteria.'
                                                    : 'Create your first high-converting landing page to boost sales.'}
                                            </p>
                                            <Button onClick={openCreate} className="text-xs">
                                                <Plus className="w-3.5 h-3.5 mr-1" />
                                                Create Landing Page
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                landingPages.data.map((page) => (
                                    <tr key={page.id} className="hover:bg-gray-50/70 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 mt-0.5">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <Link
                                                            href={`/admin/landing-pages/${page.id}/builder`}
                                                            className="font-bold text-gray-900 hover:text-primary-600 transition"
                                                        >
                                                            {page.title}
                                                        </Link>
                                                        {page.is_default && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-0.5 text-xs text-gray-500">
                                                        <span className="font-mono text-gray-600">/p/{page.slug}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyUrl(page.slug)}
                                                            className="text-gray-400 hover:text-gray-600 transition"
                                                            title="Copy public URL"
                                                        >
                                                            {copiedSlug === page.slug ? (
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {page.product ? (
                                                <div>
                                                    <span className="font-medium text-gray-900 block truncate max-w-xs">
                                                        {page.product.title}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        ৳{page.product.sale_price ?? page.product.regular_price}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No product linked</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => handleTogglePublish(page)}
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                                                    page.status === 'published'
                                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                                }`}
                                                title={`Click to ${page.status === 'published' ? 'unpublish' : 'publish'}`}
                                            >
                                                {page.status === 'published' ? (
                                                    <>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
                                                        Published
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5" />
                                                        Draft
                                                    </>
                                                )}
                                            </button>
                                        </td>

                                        <td className="px-6 py-4 text-xs text-gray-600">
                                            <div className="flex items-center space-x-1">
                                                <Layers className="w-3.5 h-3.5 text-gray-400" />
                                                <span>
                                                    {page.revisions_count ?? page.revisions?.length ?? 1} revision
                                                    {(page.revisions_count ?? page.revisions?.length ?? 1) > 1
                                                        ? 's'
                                                        : ''}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(page.updated_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-1.5">
                                                {/* Open Visual Builder */}
                                                <Link
                                                    href={`/admin/landing-pages/${page.id}/builder`}
                                                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-xs transition"
                                                    title="Design in Visual Builder"
                                                >
                                                    <Palette className="w-3.5 h-3.5 mr-1" />
                                                    <span>Builder</span>
                                                </Link>

                                                {/* Preview / Live link */}
                                                <a
                                                    href={`/p/${page.slug}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={`p-1.5 rounded-lg border transition ${
                                                        page.status === 'published'
                                                            ? 'border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                                                            : 'border-dashed border-gray-200 text-gray-400 hover:bg-gray-50'
                                                    }`}
                                                    title={
                                                        page.status === 'published'
                                                            ? 'View live landing page'
                                                            : 'Preview (Page is currently draft - 404 for visitors)'
                                                    }
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>

                                                {/* Settings / Edit Info */}
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(page)}
                                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
                                                    title="Edit page settings"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() => openDelete(page)}
                                                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                                                    title="Delete landing page"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200">
                    <Pagination
                        links={landingPages.links}
                        from={landingPages.from}
                        to={landingPages.to}
                        total={landingPages.total}
                    />
                </div>
            </div>

            {/* Create Landing Page Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
                            <div className="flex items-center space-x-2">
                                <Sparkles className="w-5 h-5 text-primary-600" />
                                <h3 className="text-lg font-bold text-gray-900">Create New Landing Page</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Page Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createTitle}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    placeholder="e.g. Premium Smartwatch Offer"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                                />
                                {formErrors.title && (
                                    <p className="text-xs text-rose-600 mt-1">{formErrors.title}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    URL Slug *
                                </label>
                                <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500">
                                    <span className="px-3 py-2 bg-gray-100 text-xs font-mono text-gray-500 border-r border-gray-300">
                                        /p/
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        value={createSlug}
                                        onChange={(e) =>
                                            setCreateSlug(
                                                e.target.value.toLowerCase().replace(/[^\w-]/g, '')
                                            )
                                        }
                                        placeholder="smartwatch-deal"
                                        className="flex-1 px-3 py-2 text-sm font-mono focus:outline-hidden"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Public URL: <span className="font-mono text-gray-700">/p/{createSlug || 'your-slug'}</span>
                                </p>
                                {formErrors.slug && (
                                    <p className="text-xs text-rose-600 mt-1">{formErrors.slug}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Linked Product
                                </label>
                                <select
                                    value={createProductId}
                                    onChange={(e) => setCreateProductId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">-- No product linked (Standalone) --</option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.title} (৳{p.sale_price ?? p.regular_price})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Prepopulates checkout and variant selectors on the landing page canvas.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Primary Theme Color
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={createPrimaryColor}
                                            onChange={(e) => setCreatePrimaryColor(e.target.value)}
                                            className="w-9 h-9 p-0.5 rounded border border-gray-300 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={createPrimaryColor}
                                            onChange={(e) => setCreatePrimaryColor(e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs font-mono rounded border border-gray-300"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Font Family
                                    </label>
                                    <select
                                        value={createFontFamily}
                                        onChange={(e) => setCreateFontFamily(e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-hidden bg-white"
                                    >
                                        <option value="Inter">Inter</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Outfit">Outfit</option>
                                        <option value="Poppins">Poppins</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="text-xs font-bold text-gray-800 block">Publication Status</span>
                                    <span className="text-[11px] text-gray-500">
                                        Draft pages are invisible to public visitors (returns 404).
                                    </span>
                                </div>
                                <select
                                    value={createStatus}
                                    onChange={(e) => setCreateStatus(e.target.value as 'draft' | 'published')}
                                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>

                            {/* Advanced SEO Toggle */}
                            <div className="border border-gray-200 rounded-lg p-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedSeo(!showAdvancedSeo)}
                                    className="w-full flex items-center justify-between text-xs font-bold text-gray-700"
                                >
                                    <span>SEO & Meta Configuration</span>
                                    <span className="text-primary-600">
                                        {showAdvancedSeo ? 'Collapse' : 'Expand'}
                                    </span>
                                </button>
                                {showAdvancedSeo && (
                                    <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                                Meta Title
                                            </label>
                                            <input
                                                type="text"
                                                value={createSeoTitle}
                                                onChange={(e) => setCreateSeoTitle(e.target.value)}
                                                placeholder="Custom browser tab title"
                                                className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-hidden"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                                Meta Description
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={createSeoDesc}
                                                onChange={(e) => setCreateSeoDesc(e.target.value)}
                                                placeholder="Short summary for Google search results and social previews"
                                                className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-hidden"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={createOpenBuilder}
                                    onChange={(e) => setCreateOpenBuilder(e.target.checked)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="font-medium">
                                    Open Visual Page Builder immediately after saving
                                </span>
                            </label>

                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsCreateOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Page'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Landing Page Info Modal */}
            {isEditOpen && editingPage && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
                            <div className="flex items-center space-x-2">
                                <Pencil className="w-5 h-5 text-gray-700" />
                                <h3 className="text-lg font-bold text-gray-900">Edit Landing Page Details</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditOpen(false);
                                    setEditingPage(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Page Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                                />
                                {formErrors.title && (
                                    <p className="text-xs text-rose-600 mt-1">{formErrors.title}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    URL Slug *
                                </label>
                                <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500">
                                    <span className="px-3 py-2 bg-gray-100 text-xs font-mono text-gray-500 border-r border-gray-300">
                                        /p/
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        value={editSlug}
                                        onChange={(e) =>
                                            setEditSlug(e.target.value.toLowerCase().replace(/[^\w-]/g, ''))
                                        }
                                        className="flex-1 px-3 py-2 text-sm font-mono focus:outline-hidden"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Public URL: <span className="font-mono text-gray-700">/p/{editSlug || 'your-slug'}</span>
                                </p>
                                {formErrors.slug && (
                                    <p className="text-xs text-rose-600 mt-1">{formErrors.slug}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Linked Product
                                </label>
                                <select
                                    value={editProductId}
                                    onChange={(e) => setEditProductId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">-- No product linked (Standalone) --</option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.title} (৳{p.sale_price ?? p.regular_price})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="text-xs font-bold text-gray-800 block">Publication Status</span>
                                    <span className="text-[11px] text-gray-500">
                                        {editStatus === 'published'
                                            ? 'Visible to public visitors at /' + editSlug
                                            : 'Hidden from public visitors (returns 404)'}
                                    </span>
                                </div>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as 'draft' | 'published')}
                                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>

                            <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editIsDefault}
                                    onChange={(e) => setEditIsDefault(e.target.checked)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="font-medium">Set as store default homepage</span>
                            </label>

                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <span className="text-xs font-bold text-gray-700 block">SEO Metadata</span>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        value={editSeoTitle}
                                        onChange={(e) => setEditSeoTitle(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-hidden"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                        Meta Description
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={editSeoDesc}
                                        onChange={(e) => setEditSeoDesc(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setIsEditOpen(false);
                                        setEditingPage(null);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && deletingPage && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6" />
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Delete Landing Page?
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to delete{' '}
                            <span className="font-bold text-gray-900">"{deletingPage.title}"</span> (
                            <span className="font-mono text-xs">/{deletingPage.slug}</span>)?
                        </p>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-6 space-y-1">
                            <p className="font-semibold">Important:</p>
                            <p>• All revision history for this page will be permanently removed.</p>
                            <p>• Other landing pages and store orders are completely unaffected.</p>
                        </div>

                        <div className="flex items-center justify-end space-x-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setIsDeleteOpen(false);
                                    setDeletingPage(null);
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="danger"
                                onClick={handleDeleteSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Deleting...' : 'Delete Page'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
