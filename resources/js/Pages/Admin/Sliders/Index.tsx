import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ExternalLink,
    FolderOpen,
    Images,
    Pencil,
    Plus,
    Save,
    Search,
    Smartphone,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { MediaPickerModal } from '@/Builder/components/MediaPickerModal';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { Button } from '@/Shared/Button';
import { Pagination } from '@/Shared/Pagination';
import type { MediaLibraryItem, Slider, SliderIndexProps } from '@/types';

export default function SliderIndex({
    sliders,
    defaultHero,
    promoBanners,
    filters,
}: SliderIndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    // Default Fallback Hero State
    const [heroBadge, setHeroBadge] = useState(defaultHero.badge_text);
    const [heroTitle, setHeroTitle] = useState(defaultHero.title);
    const [heroDescription, setHeroDescription] = useState(defaultHero.description);
    const [heroPrimaryText, setHeroPrimaryText] = useState(defaultHero.primary_button_text);
    const [heroPrimaryUrl, setHeroPrimaryUrl] = useState(defaultHero.primary_button_url);
    const [heroSecondaryText, setHeroSecondaryText] = useState(defaultHero.secondary_button_text);
    const [heroSecondaryUrl, setHeroSecondaryUrl] = useState(defaultHero.secondary_button_url);
    const [heroCardTitle, setHeroCardTitle] = useState(defaultHero.card_title);
    const [heroCardSubtitle, setHeroCardSubtitle] = useState(defaultHero.card_subtitle);
    const [heroImage, setHeroImage] = useState<File | null>(null);
    const [heroImagePath, setHeroImagePath] = useState<string | null>(null);
    const [heroImagePreview, setHeroImagePreview] = useState<string | null>(defaultHero.image_url || null);
    const [removeHeroImage, setRemoveHeroImage] = useState(false);
    const [isSavingHero, setIsSavingHero] = useState(false);
    const [heroErrors, setHeroErrors] = useState<Record<string, string>>({});
    const [heroSaved, setHeroSaved] = useState(false);

    // Promo Banners (Seasonal Sale & Combo Deals) State
    const [promoEnabled, setPromoEnabled] = useState(promoBanners.enabled);
    const [seasonalBadge, setSeasonalBadge] = useState(promoBanners.seasonal.badge);
    const [seasonalTitle, setSeasonalTitle] = useState(promoBanners.seasonal.title);
    const [seasonalSubtitle, setSeasonalSubtitle] = useState(promoBanners.seasonal.subtitle);
    const [seasonalBtnText, setSeasonalBtnText] = useState(promoBanners.seasonal.button_text);
    const [seasonalBtnUrl, setSeasonalBtnUrl] = useState(promoBanners.seasonal.button_url);
    const [seasonalImage, setSeasonalImage] = useState<File | null>(null);
    const [seasonalImagePath, setSeasonalImagePath] = useState<string | null>(null);
    const [seasonalImagePreview, setSeasonalImagePreview] = useState<string | null>(
        promoBanners.seasonal.image_url || null
    );
    const [removeSeasonalImage, setRemoveSeasonalImage] = useState(false);

    const [comboTitle, setComboTitle] = useState(promoBanners.combo.title);
    const [comboSubtitle, setComboSubtitle] = useState(promoBanners.combo.subtitle);
    const [comboBtnText, setComboBtnText] = useState(promoBanners.combo.button_text);
    const [comboBtnUrl, setComboBtnUrl] = useState(promoBanners.combo.button_url);
    const [comboBadgeLabel, setComboBadgeLabel] = useState(promoBanners.combo.badge_label);
    const [comboBadgeValue, setComboBadgeValue] = useState(promoBanners.combo.badge_value);
    const [comboImage, setComboImage] = useState<File | null>(null);
    const [comboImagePath, setComboImagePath] = useState<string | null>(null);
    const [comboImagePreview, setComboImagePreview] = useState<string | null>(
        promoBanners.combo.image_url || null
    );
    const [removeComboImage, setRemoveComboImage] = useState(false);

    const [isSavingPromo, setIsSavingPromo] = useState(false);
    const [promoErrors, setPromoErrors] = useState<Record<string, string>>({});
    const [promoSaved, setPromoSaved] = useState(false);

    // Shared Media Library Picker State
    type MediaTarget =
        | 'create_desktop'
        | 'create_mobile'
        | 'edit_desktop'
        | 'edit_mobile'
        | 'default_hero'
        | 'promo_seasonal'
        | 'promo_combo'
        | null;
    const [mediaPickerTarget, setMediaPickerTarget] = useState<MediaTarget>(null);

    const handleMediaSelect = (item: MediaLibraryItem) => {
        switch (mediaPickerTarget) {
            case 'create_desktop':
                setCreateImage(null);
                setCreateImagePath(item.file_path);
                setCreateImagePreview(item.url);
                break;
            case 'create_mobile':
                setCreateMobileImage(null);
                setCreateMobileImagePath(item.file_path);
                setCreateMobileImagePreview(item.url);
                break;
            case 'edit_desktop':
                setEditImage(null);
                setEditImagePath(item.file_path);
                setEditImagePreview(item.url);
                break;
            case 'edit_mobile':
                setEditMobileImage(null);
                setEditMobileImagePath(item.file_path);
                setEditMobileImagePreview(item.url);
                break;
            case 'default_hero':
                setHeroImage(null);
                setHeroImagePath(item.file_path);
                setHeroImagePreview(item.url);
                setRemoveHeroImage(false);
                break;
            case 'promo_seasonal':
                setSeasonalImage(null);
                setSeasonalImagePath(item.file_path);
                setSeasonalImagePreview(item.url);
                setRemoveSeasonalImage(false);
                break;
            case 'promo_combo':
                setComboImage(null);
                setComboImagePath(item.file_path);
                setComboImagePreview(item.url);
                setRemoveComboImage(false);
                break;
        }
        setMediaPickerTarget(null);
    };

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [createSubtitle, setCreateSubtitle] = useState('');
    const [createLinkUrl, setCreateLinkUrl] = useState('');
    const [createButtonText, setCreateButtonText] = useState('অর্ডার করুন');
    const [createSortOrder, setCreateSortOrder] = useState('0');
    const [createIsActive, setCreateIsActive] = useState(true);
    const [createImage, setCreateImage] = useState<File | null>(null);
    const [createImagePath, setCreateImagePath] = useState<string | null>(null);
    const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
    const [createMobileImage, setCreateMobileImage] = useState<File | null>(null);
    const [createMobileImagePath, setCreateMobileImagePath] = useState<string | null>(null);
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
    const [editImagePath, setEditImagePath] = useState<string | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [editMobileImage, setEditMobileImage] = useState<File | null>(null);
    const [editMobileImagePath, setEditMobileImagePath] = useState<string | null>(null);
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
            setCreateImagePath(null);
            setCreateImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCreateMobileImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCreateMobileImage(file);
            setCreateMobileImagePath(null);
            setCreateMobileImagePreview(URL.createObjectURL(file));
        }
    };

    const handleEditDesktopImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditImage(file);
            setEditImagePath(null);
            setEditImagePreview(URL.createObjectURL(file));
        }
    };

    const handleEditMobileImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditMobileImage(file);
            setEditMobileImagePath(null);
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
        setEditImagePath(null);
        setEditImagePreview(slider.image_url || null);
        setEditMobileImage(null);
        setEditMobileImagePath(null);
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
        if (createImage) {
            formData.append('image', createImage);
        } else if (createImagePath) {
            formData.append('image_path', createImagePath);
        }
        if (createMobileImage) {
            formData.append('mobile_image', createMobileImage);
        } else if (createMobileImagePath) {
            formData.append('mobile_image_path', createMobileImagePath);
        }

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
                setCreateImagePath(null);
                setCreateImagePreview(null);
                setCreateMobileImage(null);
                setCreateMobileImagePath(null);
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
        if (editImage) {
            formData.append('image', editImage);
        } else if (editImagePath) {
            formData.append('image_path', editImagePath);
        }
        if (editMobileImage) {
            formData.append('mobile_image', editMobileImage);
        } else if (editMobileImagePath) {
            formData.append('mobile_image_path', editMobileImagePath);
        }

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

    const handleHeroImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setHeroImage(file);
            setHeroImagePath(null);
            setHeroImagePreview(URL.createObjectURL(file));
            setRemoveHeroImage(false);
        }
    };

    const handleDefaultHeroSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSavingHero(true);
        setHeroErrors({});
        setHeroSaved(false);

        const formData = new FormData();
        formData.append('badge_text', heroBadge);
        formData.append('title', heroTitle);
        formData.append('description', heroDescription);
        formData.append('primary_button_text', heroPrimaryText);
        formData.append('primary_button_url', heroPrimaryUrl);
        formData.append('secondary_button_text', heroSecondaryText);
        formData.append('secondary_button_url', heroSecondaryUrl);
        formData.append('card_title', heroCardTitle);
        formData.append('card_subtitle', heroCardSubtitle);
        formData.append('remove_image', removeHeroImage ? '1' : '0');
        if (heroImage) {
            formData.append('image', heroImage);
        } else if (heroImagePath) {
            formData.append('image_path', heroImagePath);
        }

        router.post('/admin/sliders/default-hero', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setHeroImage(null);
                setHeroImagePath(null);
                setRemoveHeroImage(false);
                setHeroSaved(true);
            },
            onError: (errs) => {
                setHeroErrors(errs);
            },
            onFinish: () => {
                setIsSavingHero(false);
            },
        });
    };

    const handlePromoSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSavingPromo(true);
        setPromoErrors({});
        setPromoSaved(false);

        const formData = new FormData();
        formData.append('enabled', promoEnabled ? '1' : '0');
        formData.append('seasonal_badge', seasonalBadge);
        formData.append('seasonal_title', seasonalTitle);
        formData.append('seasonal_subtitle', seasonalSubtitle);
        formData.append('seasonal_button_text', seasonalBtnText);
        formData.append('seasonal_button_url', seasonalBtnUrl);
        formData.append('remove_seasonal_image', removeSeasonalImage ? '1' : '0');
        if (seasonalImage) {
            formData.append('seasonal_image', seasonalImage);
        } else if (seasonalImagePath) {
            formData.append('seasonal_image_path', seasonalImagePath);
        }

        formData.append('combo_title', comboTitle);
        formData.append('combo_subtitle', comboSubtitle);
        formData.append('combo_button_text', comboBtnText);
        formData.append('combo_button_url', comboBtnUrl);
        formData.append('combo_badge_label', comboBadgeLabel);
        formData.append('combo_badge_value', comboBadgeValue);
        formData.append('remove_combo_image', removeComboImage ? '1' : '0');
        if (comboImage) {
            formData.append('combo_image', comboImage);
        } else if (comboImagePath) {
            formData.append('combo_image_path', comboImagePath);
        }

        router.post('/admin/sliders/promo-banners', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setSeasonalImage(null);
                setSeasonalImagePath(null);
                setComboImage(null);
                setComboImagePath(null);
                setRemoveSeasonalImage(false);
                setRemoveComboImage(false);
                setPromoSaved(true);
            },
            onError: (errs) => {
                setPromoErrors(errs);
            },
            onFinish: () => {
                setIsSavingPromo(false);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Homepage Sliders" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Images className="w-7 h-7 text-primary-600" />
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
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                                    <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-primary-50 text-primary-700">
                                                        {slider.button_text}
                                                        {slider.link_url && <ExternalLink className="w-3 h-3 ml-0.5 text-primary-400" />}
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
                                                        className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
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

                {/* Default Fallback Hero Settings (Shown when no active slides exist) */}
                <form
                    onSubmit={handleDefaultHeroSubmit}
                    className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
                >
                    <div className="px-6 py-4 bg-[#FAF7F2] border-b border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#0B3B2E] text-white flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">
                                    Default Fallback Hero Banner
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Displayed on the homepage when no active hero slides are added above.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {heroSaved && (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                                    Saved
                                </span>
                            )}
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isSavingHero}
                                className="inline-flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSavingHero ? 'Saving...' : 'Save Default Hero'}
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Eyebrow Badge Text
                                    </label>
                                    <input
                                        type="text"
                                        value={heroBadge}
                                        onChange={(e) => setHeroBadge(e.target.value)}
                                        placeholder="NEW COLLECTION"
                                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                    {heroErrors.badge_text && (
                                        <p className="mt-1 text-xs text-rose-600">{heroErrors.badge_text}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Hero Heading <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={heroTitle}
                                        onChange={(e) => setHeroTitle(e.target.value)}
                                        placeholder="Modern Fashion for Everyday Life"
                                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                    {heroErrors.title && (
                                        <p className="mt-1 text-xs text-rose-600">{heroErrors.title}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Hero Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={heroDescription}
                                    onChange={(e) => setHeroDescription(e.target.value)}
                                    placeholder="Discover premium clothing, shoes, watches and accessories..."
                                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                />
                                {heroErrors.description && (
                                    <p className="mt-1 text-xs text-rose-600">{heroErrors.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Primary Button Text
                                    </label>
                                    <input
                                        type="text"
                                        value={heroPrimaryText}
                                        onChange={(e) => setHeroPrimaryText(e.target.value)}
                                        placeholder="Shop Now"
                                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Primary Button Link
                                    </label>
                                    <input
                                        type="text"
                                        value={heroPrimaryUrl}
                                        onChange={(e) => setHeroPrimaryUrl(e.target.value)}
                                        placeholder="/shop"
                                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Secondary Button Text
                                    </label>
                                    <input
                                        type="text"
                                        value={heroSecondaryText}
                                        onChange={(e) => setHeroSecondaryText(e.target.value)}
                                        placeholder="Explore Collection"
                                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Secondary Button Link
                                    </label>
                                    <input
                                        type="text"
                                        value={heroSecondaryUrl}
                                        onChange={(e) => setHeroSecondaryUrl(e.target.value)}
                                        placeholder="/shop?sort=latest"
                                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Right Arch Card Title (when no image)
                                    </label>
                                    <input
                                        type="text"
                                        value={heroCardTitle}
                                        onChange={(e) => setHeroCardTitle(e.target.value)}
                                        placeholder="Curated Essentials"
                                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Right Arch Card Subtitle (when no image)
                                    </label>
                                    <input
                                        type="text"
                                        value={heroCardSubtitle}
                                        onChange={(e) => setHeroCardSubtitle(e.target.value)}
                                        placeholder="100% Authentic · Fast Cash on Delivery"
                                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-3">
                            <label className="block text-xs font-semibold text-gray-700">
                                Default Hero Image (Optional)
                            </label>
                            <div className="rounded-xl border border-dashed border-stone-300 bg-[#FAF7F2] p-4 text-center">
                                {heroImagePreview ? (
                                    <div className="space-y-3">
                                        <div className="mx-auto w-44 h-40 rounded-t-full overflow-hidden border border-stone-200 bg-[#F5EFE6]">
                                            <img
                                                src={heroImagePreview}
                                                alt="Default hero preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center gap-2">
                                            <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-gray-700 hover:bg-stone-50 transition">
                                                Change Image
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    onChange={handleHeroImageChange}
                                                    className="sr-only"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setMediaPickerTarget('default_hero')}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0B3B2E]/30 bg-white text-xs font-semibold text-[#0B3B2E] hover:bg-emerald-50 transition"
                                            >
                                                <FolderOpen className="w-3.5 h-3.5" />
                                                Media Library
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHeroImage(null);
                                                    setHeroImagePath(null);
                                                    setHeroImagePreview(null);
                                                    setRemoveHeroImage(true);
                                                }}
                                                className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-5 space-y-3">
                                        <label className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                                            <div className="w-11 h-11 rounded-full bg-[#0B3B2E]/10 text-[#0B3B2E] flex items-center justify-center">
                                                <Images className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-800">
                                                Upload Default Hero Image
                                            </span>
                                            <span className="text-[11px] text-gray-500">
                                                JPG, PNG or WebP (max 5MB)
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={handleHeroImageChange}
                                                className="sr-only"
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setMediaPickerTarget('default_hero')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0B3B2E]/30 bg-white text-xs font-semibold text-[#0B3B2E] hover:bg-emerald-50 transition"
                                        >
                                            <FolderOpen className="w-3.5 h-3.5" />
                                            Choose from Media Library
                                        </button>
                                    </div>
                                )}
                            </div>
                            {heroErrors.image && (
                                <p className="text-xs text-rose-600">{heroErrors.image}</p>
                            )}
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                If an image is uploaded, it fills the right-side arch frame on the homepage fallback hero. Otherwise, the cream brand card is shown.
                            </p>
                        </div>
                    </div>
                </form>

                {/* Homepage Promo Banners (Seasonal Sale & Combo Deals) */}
                <form
                    onSubmit={handlePromoSubmit}
                    className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
                >
                    <div className="px-6 py-4 bg-[#FAF7F2] border-b border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#F96D16] text-white flex items-center justify-center shrink-0 mt-0.5">
                                <Images className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">
                                    Homepage Promo Banners (Seasonal Sale &amp; Combo Deals)
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Customize the 2 promotional banners shown on the storefront homepage.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={promoEnabled}
                                    onChange={(e) => setPromoEnabled(e.target.checked)}
                                    className="rounded border-stone-300 text-[#0B3B2E] focus:ring-[#0B3B2E]"
                                />
                                <span>Show on Homepage</span>
                            </label>
                            {promoSaved && (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                                    Saved
                                </span>
                            )}
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isSavingPromo}
                                className="inline-flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSavingPromo ? 'Saving...' : 'Save Promo Banners'}
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Seasonal Sale */}
                        <div className="rounded-xl border border-stone-200 p-5 space-y-4 bg-[#FAF7F2]/40">
                            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                                <h3 className="text-sm font-bold text-[#0B3B2E]">
                                    1. Left Banner (Seasonal Sale)
                                </h3>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#0B3B2E] text-white">
                                    Green Card
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Eyebrow Badge
                                    </label>
                                    <input
                                        type="text"
                                        value={seasonalBadge}
                                        onChange={(e) => setSeasonalBadge(e.target.value)}
                                        placeholder="SEASONAL SALE"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Title <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={seasonalTitle}
                                        onChange={(e) => setSeasonalTitle(e.target.value)}
                                        placeholder="Up to 50% OFF"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                    {promoErrors.seasonal_title && (
                                        <p className="mt-1 text-xs text-rose-600">{promoErrors.seasonal_title}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Subtitle
                                </label>
                                <input
                                    type="text"
                                    value={seasonalSubtitle}
                                    onChange={(e) => setSeasonalSubtitle(e.target.value)}
                                    placeholder="On Selected Items"
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Button Text
                                    </label>
                                    <input
                                        type="text"
                                        value={seasonalBtnText}
                                        onChange={(e) => setSeasonalBtnText(e.target.value)}
                                        placeholder="Shop the Sale"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Button Link
                                    </label>
                                    <input
                                        type="text"
                                        value={seasonalBtnUrl}
                                        onChange={(e) => setSeasonalBtnUrl(e.target.value)}
                                        placeholder="/shop"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Optional Banner Image
                                </label>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    {seasonalImagePreview && (
                                        <img
                                            src={seasonalImagePreview}
                                            alt="Seasonal Sale preview"
                                            className="w-14 h-14 rounded-lg object-cover border border-stone-200 bg-white"
                                        />
                                    )}
                                    <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-gray-700 hover:bg-stone-50 transition">
                                        {seasonalImagePreview ? 'Change File' : 'Upload File'}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) {
                                                    setSeasonalImage(f);
                                                    setSeasonalImagePath(null);
                                                    setSeasonalImagePreview(URL.createObjectURL(f));
                                                    setRemoveSeasonalImage(false);
                                                }
                                            }}
                                            className="sr-only"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setMediaPickerTarget('promo_seasonal')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0B3B2E]/30 bg-white text-xs font-semibold text-[#0B3B2E] hover:bg-emerald-50 transition"
                                    >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                        Media Library
                                    </button>
                                    {seasonalImagePreview && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSeasonalImage(null);
                                                setSeasonalImagePath(null);
                                                setSeasonalImagePreview(null);
                                                setRemoveSeasonalImage(true);
                                            }}
                                            className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Combo Deals */}
                        <div className="rounded-xl border border-stone-200 p-5 space-y-4 bg-[#FAF7F2]/40">
                            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                                <h3 className="text-sm font-bold text-gray-900">
                                    2. Right Banner (Combo Deals)
                                </h3>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F2ECE1] text-gray-800 border border-stone-300">
                                    Cream Card
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Title <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={comboTitle}
                                        onChange={(e) => setComboTitle(e.target.value)}
                                        placeholder="Combo Deals"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                    {promoErrors.combo_title && (
                                        <p className="mt-1 text-xs text-rose-600">{promoErrors.combo_title}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Subtitle
                                    </label>
                                    <input
                                        type="text"
                                        value={comboSubtitle}
                                        onChange={(e) => setComboSubtitle(e.target.value)}
                                        placeholder="Buy More, Save More"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Circle Badge Top Label
                                    </label>
                                    <input
                                        type="text"
                                        value={comboBadgeLabel}
                                        onChange={(e) => setComboBadgeLabel(e.target.value)}
                                        placeholder="SAVE"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Circle Badge Value
                                    </label>
                                    <input
                                        type="text"
                                        value={comboBadgeValue}
                                        onChange={(e) => setComboBadgeValue(e.target.value)}
                                        placeholder="30%"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Button Text
                                    </label>
                                    <input
                                        type="text"
                                        value={comboBtnText}
                                        onChange={(e) => setComboBtnText(e.target.value)}
                                        placeholder="Shop Combo"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Button Link
                                    </label>
                                    <input
                                        type="text"
                                        value={comboBtnUrl}
                                        onChange={(e) => setComboBtnUrl(e.target.value)}
                                        placeholder="/shop"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F96D16]/25 focus:border-[#F96D16]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Optional Banner Image
                                </label>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    {comboImagePreview && (
                                        <img
                                            src={comboImagePreview}
                                            alt="Combo Deals preview"
                                            className="w-14 h-14 rounded-lg object-cover border border-stone-200 bg-white"
                                        />
                                    )}
                                    <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-gray-700 hover:bg-stone-50 transition">
                                        {comboImagePreview ? 'Change File' : 'Upload File'}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) {
                                                    setComboImage(f);
                                                    setComboImagePath(null);
                                                    setComboImagePreview(URL.createObjectURL(f));
                                                    setRemoveComboImage(false);
                                                }
                                            }}
                                            className="sr-only"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setMediaPickerTarget('promo_combo')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0B3B2E]/30 bg-white text-xs font-semibold text-[#0B3B2E] hover:bg-emerald-50 transition"
                                    >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                        Media Library
                                    </button>
                                    {comboImagePreview && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setComboImage(null);
                                                setComboImagePath(null);
                                                setComboImagePreview(null);
                                                setRemoveComboImage(true);
                                            }}
                                            className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>


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
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Images Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Desktop Image <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            required={!createImagePath}
                                            onChange={handleCreateDesktopImage}
                                            className="flex-1 min-w-0 text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMediaPickerTarget('create_desktop')}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0B3B2E]/30 bg-white text-xs font-semibold text-[#0B3B2E] hover:bg-emerald-50 transition shrink-0"
                                        >
                                            <FolderOpen className="w-3.5 h-3.5" />
                                            Media
                                        </button>
                                    </div>
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
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleCreateMobileImage}
                                            className="flex-1 min-w-0 text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMediaPickerTarget('create_mobile')}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0B3B2E]/30 bg-white text-xs font-semibold text-[#0B3B2E] hover:bg-emerald-50 transition shrink-0"
                                        >
                                            <FolderOpen className="w-3.5 h-3.5" />
                                            Media
                                        </button>
                                    </div>
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
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-6">
                                    <input
                                        type="checkbox"
                                        id="create_is_active"
                                        checked={createIsActive}
                                        onChange={(e) => setCreateIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Images Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Desktop Image (Optional Replace)
                                    </label>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleEditDesktopImage}
                                            className="flex-1 min-w-0 text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMediaPickerTarget('edit_desktop')}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0B3B2E]/30 bg-white text-xs font-semibold text-[#0B3B2E] hover:bg-emerald-50 transition shrink-0"
                                        >
                                            <FolderOpen className="w-3.5 h-3.5" />
                                            Media
                                        </button>
                                    </div>
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
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleEditMobileImage}
                                            className="flex-1 min-w-0 text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMediaPickerTarget('edit_mobile')}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0B3B2E]/30 bg-white text-xs font-semibold text-[#0B3B2E] hover:bg-emerald-50 transition shrink-0"
                                        >
                                            <FolderOpen className="w-3.5 h-3.5" />
                                            Media
                                        </button>
                                    </div>
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
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-6">
                                    <input
                                        type="checkbox"
                                        id="edit_is_active"
                                        checked={editIsActive}
                                        onChange={(e) => setEditIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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

            <MediaPickerModal
                open={mediaPickerTarget !== null}
                onClose={() => setMediaPickerTarget(null)}
                onSelect={handleMediaSelect}
                title="Select Image from Media Library"
            />
        </AdminLayout>
    );
}
