import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ExternalLink,
    Images,
    Pencil,
    Plus,
    Search,
    Smartphone,
    Trash2,
    X,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import { Pagination } from '@/Shared/Pagination';
import type { Slider, SliderIndexProps } from '@/types';

export default function SliderIndex({ sliders, filters }: SliderIndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [createSubtitle, setCreateSubtitle] = useState('');
    const [createLinkUrl, setCreateLinkUrl] = useState('');
    const [createButtonText, setCreateButtonText] = useState('অর্ডার করুন');
    const [createSortOrder, setCreateSortOrder] = useState('0');
    const [createIsActive, setCreateIsActive] = useState(true);
    const [createImage, setCreateImage] = useState<File | null>(null);
    const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
    const [createMobileImage, setCreateMobileImage] = useState<File | null>(null);
    const [createMobileImagePreview, setCreateMobileImagePreview] = useState<string | null>(null);

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editSubtitle, setEditSubtitle] = useState('');
    const [editLinkUrl, setEditLinkUrl] = useState('');
    const [editButtonText, setEditButtonText] = useState('');
    const [editSortOrder, setEditSortOrder] = useState('0');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editImage, setEditImage] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [editMobileImage, setEditMobileImage] = useState<File | null>(null);
    const [editMobileImagePreview, setEditMobileImagePreview] = useState<string | null>(null);

    // Delete Modal State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingSlider, setDeletingSlider] = useState<Slider | null>(null);

    // Submission & Feedback
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/sliders',
            { search: search.trim() },
            { preserveState: true, replace: true }
        );
    };

    const handleCreateDesktopImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCreateImage(file);
            setCreateImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCreateMobileImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCreateMobileImage(file);
            setCreateMobileImagePreview(URL.createObjectURL(file));
        }
    };

    const handleEditDesktopImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditImage(file);
            setEditImagePreview(URL.createObjectURL(file));
        }
    };

    const handleEditMobileImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditMobileImage(file);
            setEditMobileImagePreview(URL.createObjectURL(file));
        }
    };

    const openEditModal = (slider: Slider) => {
        setEditingSlider(slider);
        setEditTitle(slider.title);
        setEditSubtitle(slider.subtitle || '');
        setEditLinkUrl(slider.link_url || '');
        setEditButtonText(slider.button_text || '');
        setEditSortOrder(String(slider.sort_order));
        setEditIsActive(slider.is_active);
        setEditImage(null);
        setEditImagePreview(slider.image_url || null);
        setEditMobileImage(null);
        setEditMobileImagePreview(slider.mobile_image_url || null);
        setFormErrors({});
        setIsEditOpen(true);
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        const formData = new FormData();
        formData.append('title', createTitle);
        if (createSubtitle) formData.append('subtitle', createSubtitle);
        if (createLinkUrl) formData.append('link_url', createLinkUrl);
        if (createButtonText) formData.append('button_text', createButtonText);
        formData.append('sort_order', createSortOrder);
        formData.append('is_active', createIsActive ? '1' : '0');
        if (createImage) formData.append('image', createImage);
        if (createMobileImage) formData.append('mobile_image', createMobileImage);

        router.post('/admin/sliders', formData, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setCreateTitle('');
                setCreateSubtitle('');
                setCreateLinkUrl('');
                setCreateButtonText('অর্ডার করুন');
                setCreateSortOrder('0');
                setCreateIsActive(true);
                setCreateImage(null);
                setCreateImagePreview(null);
                setCreateMobileImage(null);
                setCreateMobileImagePreview(null);
            },
            onError: (errs) => {
                setFormErrors(errs);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingSlider) return;

        setIsSubmitting(true);
        setFormErrors({});

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('title', editTitle);
        if (editSubtitle) formData.append('subtitle', editSubtitle);
        if (editLinkUrl) formData.append('link_url', editLinkUrl);
        if (editButtonText) formData.append('button_text', editButtonText);
        formData.append('sort_order', editSortOrder);
        formData.append('is_active', editIsActive ? '1' : '0');
        if (editImage) formData.append('image', editImage);
        if (editMobileImage) formData.append('mobile_image', editMobileImage);

        router.post(`/admin/sliders/${editingSlider.id}`, formData, {
            onSuccess: () => {
                setIsEditOpen(false);
                setEditingSlider(null);
            },
            onError: (errs) => {
                setFormErrors(errs);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDeleteSubmit = () => {
        if (!deletingSlider) return;

        setIsSubmitting(true);
        router.delete(`/admin/sliders/${deletingSlider.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingSlider(null);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleToggleStatus = (slider: Slider) => {
        router.post(`/admin/sliders/${slider.id}/toggle`, {}, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Homepage Sliders" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Images className="w-7 h-7 text-indigo-600" />
                            Homepage Hero Sliders
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Configure responsive hero slides, banners, and promotions for your storefront homepage.
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => {
                            setFormErrors({});
                            setIsCreateOpen(true);
                        }}
                        className="inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Slide
                    </Button>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search slides..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </form>
                    <div className="text-sm text-gray-500 w-full sm:w-auto text-right">
                        Total {sliders.total} slide{sliders.total === 1 ? '' : 's'}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Slide Preview</th>
                                    <th className="px-6 py-3">Title & Subtitle</th>
                                    <th className="px-6 py-3">Call to Action</th>
                                    <th className="px-6 py-3">Sort Order</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sliders.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No slides found. Click "Add New Slide" to create your first homepage banner.
                                        </td>
                                    </tr>
                                ) : (
                                    sliders.data.map((slider) => (
                                        <tr key={slider.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-14 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                                        <img
                                                            src={slider.image_url}
                                                            alt={slider.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    {slider.mobile_image_url && (
                                                        <span
                                                            title="Mobile specific image configured"
                                                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200"
                                                        >
                                                            <Smartphone className="w-3 h-3" />
                                                            Mobile
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{slider.title}</div>
                                                {slider.subtitle && (
                                                    <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">
                                                        {slider.subtitle}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {slider.button_text ? (
                                                    <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
                                                        {slider.button_text}
                                                        {slider.link_url && <ExternalLink className="w-3 h-3 ml-0.5 text-indigo-400" />}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">No CTA</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-xs bg-gray-100 px-2.5 py-1 rounded-md text-gray-700">
                                                    {slider.sort_order}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(slider)}
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition ${
                                                        slider.is_active
                                                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {slider.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(slider)}
                                                        className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                        title="Edit Slide"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeletingSlider(slider);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="p-1.5 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                        title="Delete Slide"
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

                    {/* Pagination */}
                    {sliders.total > sliders.per_page && (
                        <div className="p-4 border-t border-gray-200">
                            <Pagination
                                links={sliders.links}
                                from={sliders.from}
                                to={sliders.to}
                                total={sliders.total}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Add New Hero Slide</h2>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-5 mt-5">
                            {Object.keys(formErrors).length > 0 && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Please fix the following errors:</p>
                                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                                            {Object.values(formErrors).map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Slide Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createTitle}
                                    onChange={(e) => setCreateTitle(e.target.value)}
                                    placeholder="e.g. বিশেষ অফার - ৩০% পর্যন্ত ছাড়!"
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Subtitle / Caption
                                </label>
                                <input
                                    type="text"
                                    value={createSubtitle}
                                    onChange={(e) => setCreateSubtitle(e.target.value)}
                                    placeholder="e.g. সীমিত সময়ের অফার। দ্রুত অর্ডার করুন!"
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Images Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Desktop Image <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        required
                                        onChange={handleCreateDesktopImage}
                                        className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Recommended: 1920x600px (WebP/JPEG/PNG)</p>
                                    {createImagePreview && (
                                        <div className="mt-2 w-full h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            <img
                                                src={createImagePreview}
                                                alt="Desktop Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Mobile Image (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleCreateMobileImage}
                                        className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Recommended: 768x600px (WebP/JPEG/PNG)</p>
                                    {createMobileImagePreview && (
                                        <div className="mt-2 w-full h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            <img
                                                src={createMobileImagePreview}
                                                alt="Mobile Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CTA Link & Button Text */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Button Text
                                    </label>
                                    <input
                                        type="text"
                                        value={createButtonText}
                                        onChange={(e) => setCreateButtonText(e.target.value)}
                                        placeholder="e.g. অর্ডার করুন / Shop Now"
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Link URL
                                    </label>
                                    <input
                                        type="text"
                                        value={createLinkUrl}
                                        onChange={(e) => setCreateLinkUrl(e.target.value)}
                                        placeholder="e.g. /shop or /product/slug"
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Sort Order & Active */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={createSortOrder}
                                        onChange={(e) => setCreateSortOrder(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-6">
                                    <input
                                        type="checkbox"
                                        id="create_is_active"
                                        checked={createIsActive}
                                        onChange={(e) => setCreateIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="create_is_active" className="text-sm font-semibold text-gray-700 cursor-pointer">
                                        Active on Homepage
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsCreateOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Uploading...' : 'Save Slide'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditOpen && editingSlider && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Edit Hero Slide</h2>
                            <button
                                type="button"
                                onClick={() => setIsEditOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-5 mt-5">
                            {Object.keys(formErrors).length > 0 && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Please fix the following errors:</p>
                                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                                            {Object.values(formErrors).map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Slide Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Subtitle / Caption
                                </label>
                                <input
                                    type="text"
                                    value={editSubtitle}
                                    onChange={(e) => setEditSubtitle(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Images Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Desktop Image (Optional Replace)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleEditDesktopImage}
                                        className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {editImagePreview && (
                                        <div className="mt-2 w-full h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            <img
                                                src={editImagePreview}
                                                alt="Desktop Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Mobile Image (Optional Replace)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleEditMobileImage}
                                        className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {editMobileImagePreview && (
                                        <div className="mt-2 w-full h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            <img
                                                src={editMobileImagePreview}
                                                alt="Mobile Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CTA Link & Button Text */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Button Text
                                    </label>
                                    <input
                                        type="text"
                                        value={editButtonText}
                                        onChange={(e) => setEditButtonText(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Link URL
                                    </label>
                                    <input
                                        type="text"
                                        value={editLinkUrl}
                                        onChange={(e) => setEditLinkUrl(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Sort Order & Active */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editSortOrder}
                                        onChange={(e) => setEditSortOrder(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-6">
                                    <input
                                        type="checkbox"
                                        id="edit_is_active"
                                        checked={editIsActive}
                                        onChange={(e) => setEditIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="edit_is_active" className="text-sm font-semibold text-gray-700 cursor-pointer">
                                        Active on Homepage
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsEditOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Updating...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && deletingSlider && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                        <h2 className="text-lg font-bold text-gray-900">Delete Slide</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Are you sure you want to delete the slide "{deletingSlider.title}"? This will permanently delete its associated images.
                        </p>

                        <div className="flex justify-end gap-3 mt-6">
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
                                variant="danger"
                                onClick={handleDeleteSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Deleting...' : 'Delete Slide'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
