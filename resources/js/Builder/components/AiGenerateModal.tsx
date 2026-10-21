import {
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    Loader2,
    Plus,
    RefreshCw,
    Sparkles,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { renderAstBlock } from '../blocks';
import type { Block, BuilderAiConfig } from '@/types/builder';

export interface AiGenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (blocks: Block[]) => void;
    landingPageId: number;
    aiConfig: BuilderAiConfig;
}

interface GenerateDesignResponse {
    success?: boolean;
    message?: string;
    blocks?: Block[];
    count?: number;
    errors?: Record<string, string[]>;
}

export function AiGenerateModal({
    isOpen,
    onClose,
    onInsert,
    landingPageId,
    aiConfig,
}: AiGenerateModalProps) {
    const [prompt, setPrompt] = useState('');
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        if (!isOpen) {
            abortRef.current?.abort();
            abortRef.current = null;
            requestIdRef.current += 1;
            setIsGenerating(false);
        } else {
            setError(null);
        }
    }, [isOpen]);

    useEffect(
        () => () => {
            abortRef.current?.abort();
        },
        []
    );

    if (!isOpen) return null;

    const isReady = aiConfig.configured && aiConfig.enabled;
    const canGenerate = isReady && prompt.trim().length >= 5 && !isGenerating;
    const canInsert = blocks.length > 0 && !isGenerating;

    const cancelGeneration = () => {
        requestIdRef.current += 1;
        abortRef.current?.abort();
        abortRef.current = null;
        setIsGenerating(false);
    };

    const handleClose = () => {
        cancelGeneration();
        onClose();
    };

    const handleGenerate = async (promptText: string = prompt) => {
        const cleanPrompt = promptText.trim();

        if (!aiConfig.configured) {
            setError('No Gemini API key is configured. Add your key in Admin Settings first.');
            return;
        }

        if (!aiConfig.enabled) {
            setError('AI generation is disabled. Enable it in Admin Settings first.');
            return;
        }

        if (cleanPrompt.length < 5) {
            setError('Please describe the design you want in a little more detail.');
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        setIsGenerating(true);
        setError(null);

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ||
                '';

            const response = await fetch('/admin/ai/generate-design', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    prompt: cleanPrompt,
                    landing_page_id: landingPageId,
                }),
                signal: controller.signal,
            });

            let data: GenerateDesignResponse = {};
            try {
                data = (await response.json()) as GenerateDesignResponse;
            } catch {
                data = {};
            }

            if (requestIdRef.current !== requestId) return;

            if (!response.ok || !data.success) {
                const firstValidationError = data.errors
                    ? Object.values(data.errors).flat()[0]
                    : undefined;

                setError(
                    firstValidationError ||
                        data.message ||
                        'The design could not be generated. Please try again.'
                );
                return;
            }

            if (!Array.isArray(data.blocks) || data.blocks.length === 0) {
                setError('Gemini returned an empty design. Please try a different prompt.');
                return;
            }

            setBlocks(data.blocks);
        } catch (caught) {
            if (caught instanceof DOMException && caught.name === 'AbortError') return;
            if (requestIdRef.current !== requestId) return;
            setError('Network error while generating the design. Please check your connection.');
        } finally {
            if (requestIdRef.current === requestId) {
                setIsGenerating(false);
            }
        }
    };

    const handleInsert = () => {
        if (!canInsert) return;
        onInsert(blocks);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-designer-title"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) handleClose();
            }}
        >
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 id="ai-designer-title" className="text-sm font-bold text-gray-900">
                                Generate with AI
                            </h2>
                            <p className="text-xs text-gray-500">
                                Complete HTML + CSS design · Added to the page root after preview
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        title="Close AI designer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-2">
                    <div className="space-y-4 border-b border-gray-200 p-5 lg:border-b-0 lg:border-r">
                        {!aiConfig.configured && (
                            <div className="flex items-start space-x-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="font-semibold">Gemini API key required</p>
                                    <p className="mt-0.5 leading-relaxed">
                                        Add your own Google AI Studio key in AI Settings. Existing
                                        pages and blocks will not be changed.
                                    </p>
                                    <a
                                        href="/admin/settings"
                                        className="mt-1.5 inline-flex items-center font-semibold text-amber-800 underline"
                                    >
                                        Open AI Settings
                                        <ExternalLink className="ml-1 h-3 w-3" />
                                    </a>
                                </div>
                            </div>
                        )}

                        {aiConfig.configured && !aiConfig.enabled && (
                            <div className="flex items-start space-x-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="font-semibold">AI generation is disabled</p>
                                    <p className="mt-0.5 leading-relaxed">
                                        Enable AI generation in AI Settings to use this feature.
                                    </p>
                                    <a
                                        href="/admin/settings"
                                        className="mt-1.5 inline-flex items-center font-semibold text-amber-800 underline"
                                    >
                                        Open AI Settings
                                        <ExternalLink className="ml-1 h-3 w-3" />
                                    </a>
                                </div>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="ai-design-prompt"
                                className="mb-1.5 block text-xs font-semibold text-gray-700"
                            >
                                Describe the design
                            </label>
                            <textarea
                                id="ai-design-prompt"
                                value={prompt}
                                onChange={(event) => setPrompt(event.target.value)}
                                maxLength={2000}
                                rows={8}
                                placeholder="Example: Create a premium full-width hero section for a Bangladeshi clothing brand with a headline, short description, visual product area, and cash-on-delivery button."
                                className="w-full resize-y rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500"
                            />
                            <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                                <span>Plain design instructions only</span>
                                <span>{prompt.length}/2000</span>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span className="leading-relaxed">{error}</span>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            {isGenerating ? (
                                <>
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white opacity-80"
                                        disabled
                                    >
                                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                        Generating...
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelGeneration}
                                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => void handleGenerate()}
                                    disabled={!canGenerate}
                                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {blocks.length > 0 ? (
                                        <>
                                            <RefreshCw className="mr-1.5 h-4 w-4" />
                                            Regenerate
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-1.5 h-4 w-4" />
                                            Generate design
                                        </>
                                    )}
                                </button>
                            )}

                            {blocks.length > 0 && !isGenerating && (
                                <button
                                    type="button"
                                    onClick={handleInsert}
                                    className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Add to Canvas
                                </button>
                            )}
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
                            AI output is treated as untrusted. HTML and CSS are sanitized, scoped,
                            and validated before they appear in the preview or become a Custom
                            HTML / CSS block.
                        </div>
                    </div>

                    <div className="min-h-[320px] bg-slate-100 p-4 sm:p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                Preview
                            </h3>
                            {blocks.length > 0 && (
                                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Validated · 1 Custom HTML / CSS block
                                </span>
                            )}
                        </div>

                        {blocks.length > 0 ? (
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                {blocks.map((block) => (
                                    <div key={block.id}>{renderAstBlock(block, true)}</div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white/70 p-8 text-center">
                                <Sparkles className="mb-2 h-8 w-8 text-violet-300" />
                                <p className="text-xs font-semibold text-gray-600">
                                    Your generated design will appear here
                                </p>
                                <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-gray-400">
                                    Nothing is added to the canvas until you review the preview and
                                    click Add to Canvas.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
