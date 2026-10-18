import {
    CheckCircle2,
    Clock,
    History,
    Layers,
    Loader2,
    RotateCcw,
    UploadCloud,
    User,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { useBuilderStore } from '../stores/useBuilderStore';
import type { LandingPageData, LandingPageRevisionSummary } from '@/types';

export interface RevisionsDrawerProps {
    isOpen: boolean;
    landingPage: LandingPageData;
    onClose: () => void;
    onRestored?: (message: string) => void;
}

export function RevisionsDrawer({
    isOpen,
    landingPage,
    onClose,
    onRestored,
}: RevisionsDrawerProps) {
    const { setAst } = useBuilderStore();
    const [isRestoringId, setIsRestoringId] = useState<number | null>(null);
    const [restoreError, setRestoreError] = useState<string | null>(null);

    if (!isOpen) return null;

    const revisions: LandingPageRevisionSummary[] = landingPage.revisions || [];
    const activeRevisionId = landingPage.published_revision_id;

    // Handle 1: Quick restore directly into builder canvas
    const handleRestoreToCanvas = (rev: LandingPageRevisionSummary) => {
        if (!rev.ast_content) {
            setRestoreError('Selected revision has no content.');
            return;
        }

        if (
            window.confirm(
                `Restore Revision #${rev.revision_number} to canvas? Any unsaved edits will be replaced.`
            )
        ) {
            setAst(rev.ast_content);
            if (onRestored) {
                onRestored(
                    `Revision #${rev.revision_number} loaded into canvas. Click "Save Revision" to publish.`
                );
            }
            onClose();
        }
    };

    // Handle 2: Restore and publish live directly via backend API
    const handleRestoreAndPublish = async (rev: LandingPageRevisionSummary) => {
        if (
            !window.confirm(
                `Restore Revision #${rev.revision_number} and immediately publish it to your live page?`
            )
        ) {
            return;
        }

        setIsRestoringId(rev.id);
        setRestoreError(null);

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ||
                '';

            const response = await fetch(
                `/admin/landing-pages/${landingPage.id}/revisions/${rev.id}/restore`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                }
            );

            const data = (await response.json()) as {
                success?: boolean;
                message?: string;
                revision?: { ast_content: unknown };
                published_revision_id?: number;
            };

            if (!response.ok) {
                setRestoreError(data.message || 'Failed to restore revision.');
                return;
            }

            if (rev.ast_content) {
                setAst(rev.ast_content);
            }

            if (onRestored) {
                onRestored(data.message || `Revision #${rev.revision_number} restored and published live.`);
            }

            onClose();
            // Refresh to sync newly created revision and published_revision_id
            window.location.reload();
        } catch {
            setRestoreError('Network error while restoring revision.');
        } finally {
            setIsRestoringId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <aside className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
                    {/* Drawer Header */}
                    <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                                <History className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">
                                    Revision History
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    {revisions.length} saved {revisions.length === 1 ? 'version' : 'versions'} for this landing page
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Error Notice */}
                    {restoreError && (
                        <div className="p-3 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 font-medium">
                            {restoreError}
                        </div>
                    )}

                    {/* Revisions List */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                        {revisions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-xs">
                                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>No revision snapshots found.</p>
                            </div>
                        ) : (
                            revisions.map((rev) => {
                                const isCurrentLive = rev.id === activeRevisionId;
                                const isBusy = isRestoringId === rev.id;
                                const blockCount = rev.ast_content?.blocks?.length || 0;
                                const formattedDate = new Date(rev.created_at).toLocaleString(
                                    undefined,
                                    {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    }
                                );

                                return (
                                    <div
                                        key={rev.id}
                                        className={`rounded-xl border p-4 transition-all bg-white shadow-xs ${
                                            isCurrentLive
                                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-extrabold text-sm text-gray-900">
                                                    Revision #{rev.revision_number}
                                                </span>
                                                {isCurrentLive && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Active Live
                                                    </span>
                                                )}
                                            </div>

                                            <span className="inline-flex items-center text-[11px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                                                <Layers className="w-3 h-3 mr-1 text-gray-400" />
                                                {blockCount} blocks
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-xs text-gray-500 mb-3">
                                            <div className="flex items-center space-x-1.5">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{formattedDate}</span>
                                            </div>
                                            <div className="flex items-center space-x-1.5">
                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{rev.created_by || 'Store Administrator'}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-2 border-t border-gray-100 flex items-center justify-end space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleRestoreToCanvas(rev)}
                                                disabled={isBusy}
                                                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                                                title="Preview / load this revision into canvas"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                                <span>Restore to Canvas</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleRestoreAndPublish(rev)}
                                                disabled={isBusy || isCurrentLive}
                                                className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                                    isCurrentLive
                                                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                                        : 'text-white bg-primary-600 hover:bg-primary-700 shadow-xs cursor-pointer'
                                                }`}
                                                title={isCurrentLive ? 'Already active live' : 'Restore and make live now'}
                                            >
                                                {isBusy ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                                        <span>Restoring...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="w-3.5 h-3.5 mr-1" />
                                                        <span>Restore & Publish</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
