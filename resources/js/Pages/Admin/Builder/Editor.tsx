import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AiGenerateModal } from '@/Builder/components/AiGenerateModal';
import { Canvas } from '@/Builder/components/Canvas';
import { LeftSidebar } from '@/Builder/components/LeftSidebar';
import { RevisionsDrawer } from '@/Builder/components/RevisionsDrawer';
import { TopBar } from '@/Builder/components/TopBar';
import {
    findBlockInTree,
    findParentInTree,
    useBuilderStore,
} from '@/Builder/stores/useBuilderStore';
import type { Block, BlockType, BuilderEditorProps, LandingPageRevisionSummary } from '@/types';

export default function Editor({
    landingPage,
    initialAst,
    blockDefinitions,
    products,
    ai = { configured: false, enabled: false, model: null },
}: BuilderEditorProps) {
    const {
        ast,
        setAst,
        setAvailableProducts,
        addBlock,
        addBlocks,
        moveBlock,
        reorderBlocks,
        undo,
        redo,
        canUndo,
        canRedo,
        selectedBlockId,
        setSelectedBlockId,
    } = useBuilderStore();

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isRevisionsOpen, setIsRevisionsOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [targetContainerId, setTargetContainerId] = useState<string | null>(null);
    const [paletteDragType, setPaletteDragType] = useState<BlockType | null>(null);

    // Draggable left panel width with localStorage persistence
    const [leftWidth, setLeftWidth] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('lc_builder_left_width');
            return saved ? Math.max(280, Math.min(540, Number(saved))) : 340;
        } catch {
            return 340;
        }
    });

    const [isResizingLeft, setIsResizingLeft] = useState(false);

    // Mouse drag handler for resizing left panel
    const startResizingLeft = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingLeft(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingLeft) {
                const newWidth = Math.max(280, Math.min(540, e.clientX));
                setLeftWidth(newWidth);
                try {
                    localStorage.setItem('lc_builder_left_width', String(newWidth));
                } catch {
                    // ignore
                }
            }
        };

        const handleMouseUp = () => {
            if (isResizingLeft) setIsResizingLeft(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        if (isResizingLeft) {
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingLeft]);

    // Initialize AST and products into Zustand store on mount
    useEffect(() => {
        if (initialAst) {
            setAst(initialAst);
        }
        if (products) {
            setAvailableProducts(products as unknown as import('@/types').Product[]);
        }
    }, [initialAst, products, setAst, setAvailableProducts]);

    // Handle saving current AST to backend revision endpoint
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setSaveSuccess(null);
        setSaveError(null);

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ||
                '';

            const response = await fetch(`/admin/landing-pages/${landingPage.id}/revisions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ ast }),
            });

            const data = (await response.json()) as {
                success?: boolean;
                message?: string;
                errors?: Record<string, string[]>;
                revision?: {
                    id: number;
                    revision_number: number;
                    created_by: string | null;
                    created_at: string;
                };
                published_revision_id?: number;
            };

            if (!response.ok) {
                if (data.errors) {
                    const firstMsg = Object.values(data.errors).flat()[0];
                    setSaveError(firstMsg || 'Validation failed. Please verify block inputs.');
                } else {
                    setSaveError(data.message || 'Failed to save revision.');
                }
                return;
            }

            if (data.revision) {
                const newRev: LandingPageRevisionSummary = {
                    id: data.revision.id,
                    landing_page_id: landingPage.id,
                    revision_number: data.revision.revision_number,
                    ast_content: ast,
                    created_by: data.revision.created_by,
                    created_at: data.revision.created_at || new Date().toISOString(),
                };
                landingPage.revisions = [newRev, ...(landingPage.revisions || [])];
                landingPage.published_revision_id = data.published_revision_id || data.revision.id;
            }

            setSaveSuccess(data.message || 'Revision saved successfully.');
            setTimeout(() => setSaveSuccess(null), 3500);
        } catch {
            setSaveError('Network error while saving. Please check your connection.');
        } finally {
            setIsSaving(false);
        }
    }, [ast, landingPage]);

    // Global keyboard shortcuts (Save, Undo, Redo)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isModifier = e.ctrlKey || e.metaKey;

            if (isModifier && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSave();
            } else if (isModifier && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    e.preventDefault();
                    if (canRedo()) redo();
                } else {
                    e.preventDefault();
                    if (canUndo()) undo();
                }
            } else if (isModifier && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                if (canRedo()) redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, undo, redo, canUndo, canRedo]);

    // Warn about unsaved changes on browser close or navigation away
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (canUndo()) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [canUndo]);

    // Configure sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag start so palette drags show a floating preview.
    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as
            { source?: string; blockType?: BlockType } | undefined;

        if (data?.source === 'palette' && data.blockType) {
            setPaletteDragType(data.blockType);
        }
    };

    const handleDragCancel = () => {
        setPaletteDragType(null);
    };

    const isDropAfter = (event: DragEndEvent): boolean => {
        const translated = event.active.rect.current.translated;

        if (!translated || !event.over) {
            return false;
        }

        const activeMiddle = translated.top + translated.height / 2;
        const overMiddle = event.over.rect.top + event.over.rect.height / 2;

        return activeMiddle > overMiddle;
    };

    const createBlock = (blockType: BlockType): Block | null => {
        const def = blockDefinitions[blockType];

        if (!def) {
            return null;
        }

        const uniqueSuffix = Math.random().toString(36).substring(2, 8);
        const blockPrefix = blockType.toLowerCase().replace('block', '');
        const newBlockId = `blk_${blockPrefix}_${uniqueSuffix}`;

        let initialProps = { ...def.defaultProps };

        // Pre-fill target product for commerce blocks
        if (blockType === 'ProductSelectorBlock' || blockType === 'CodCheckoutBlock') {
            const defaultProdId = landingPage.product_id || (products[0]?.id ?? 0);
            initialProps = { ...initialProps, productId: defaultProdId };
        }

        const isContainer = blockType === 'ContainerBlock' || blockType === 'GridBlock';

        return {
            id: newBlockId,
            type: blockType,
            props: initialProps,
            styles: { ...def.defaultStyles },
            children: isContainer ? [] : undefined,
        };
    };

    const insertBlock = (blockType: BlockType, parentId: string | null, index?: number) => {
        const newBlock = createBlock(blockType);

        if (!newBlock) {
            return;
        }

        addBlock(newBlock, parentId, index);
        setSelectedBlockId(newBlock.id);
    };

    // Handle drag end reordering, cross-container moving and palette drops.
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeData = active.data.current as
            { source?: string; blockType?: BlockType } | undefined;
        const paletteType = activeData?.source === 'palette' ? activeData.blockType : null;

        setPaletteDragType(null);

        if (!over) {
            return;
        }

        const overId = String(over.id);

        // Palette block dropped somewhere on the canvas.
        if (paletteType) {
            if (overId === 'canvas_end_drop') {
                insertBlock(paletteType, null, ast.blocks.length);
                return;
            }

            if (overId.startsWith('container_drop_')) {
                const containerId = overId.replace('container_drop_', '');
                const container = findBlockInTree(ast.blocks, containerId);
                insertBlock(paletteType, containerId, container?.children?.length ?? 0);
                return;
            }

            const targetInfo = findParentInTree(ast.blocks, overId);

            if (targetInfo) {
                const targetParentId = targetInfo.parent ? targetInfo.parent.id : null;
                const targetIndex = targetInfo.index + (isDropAfter(event) ? 1 : 0);
                insertBlock(paletteType, targetParentId, targetIndex);
            } else {
                insertBlock(paletteType, null, ast.blocks.length);
            }

            return;
        }

        if (active.id === over.id) {
            return;
        }

        const activeId = String(active.id);

        // Case 1: Dropped onto the end-of-page drop zone.
        if (overId === 'canvas_end_drop') {
            moveBlock(activeId, null, ast.blocks.length);
            return;
        }

        // Case 2: Dropped onto a container drop target.
        if (overId.startsWith('container_drop_')) {
            const containerId = overId.replace('container_drop_', '');
            moveBlock(activeId, containerId, 0);
            return;
        }

        // Case 3: Dropped over a sibling or nested block.
        const targetInfo = findParentInTree(ast.blocks, overId);

        if (targetInfo) {
            const targetParentId = targetInfo.parent ? targetInfo.parent.id : null;
            moveBlock(activeId, targetParentId, targetInfo.index);
            return;
        }

        // Root-level fallback
        const oldIndex = ast.blocks.findIndex((b) => b.id === activeId);
        const newIndex = ast.blocks.findIndex((b) => b.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
            reorderBlocks(oldIndex, newIndex);
        }
    };

    // Add a block from the palette. Clicking inserts relative to the current
    // selection (or into the selected container) instead of always appending.
    const handleAddBlock = (blockType: BlockType, targetParentId?: string | null) => {
        const explicitTarget = targetParentId ?? targetContainerId;

        if (explicitTarget) {
            insertBlock(blockType, explicitTarget, undefined);
            return;
        }

        if (selectedBlockId) {
            const selectedBlock = findBlockInTree(ast.blocks, selectedBlockId);
            const selectedInfo = findParentInTree(ast.blocks, selectedBlockId);

            if (selectedBlock && selectedInfo) {
                if (selectedBlock.type === 'ContainerBlock' || selectedBlock.type === 'GridBlock') {
                    insertBlock(blockType, selectedBlock.id, undefined);
                    return;
                }

                insertBlock(
                    blockType,
                    selectedInfo.parent ? selectedInfo.parent.id : null,
                    selectedInfo.index + 1
                );
                return;
            }
        }

        insertBlock(blockType, null, undefined);
    };

    const handleInsertAiDesign = (generatedBlocks: Block[]) => {
        // AI now creates one complete Custom HTML / CSS block. Add it at the
        // page root so it is never nested inside an existing layout container.
        addBlocks(generatedBlocks, null);
        setIsAiOpen(false);
    };

    return (
        <>
            <Head title={`Builder - ${landingPage.title}`} />

            <div className="h-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
                {/* Header TopBar */}
                <TopBar
                    landingPage={landingPage}
                    isSaving={isSaving}
                    saveSuccess={saveSuccess}
                    saveError={saveError}
                    onSave={handleSave}
                    onOpenRevisions={() => setIsRevisionsOpen(true)}
                    onOpenAi={() => setIsAiOpen(true)}
                />

                {/* Main 2-Column Elementor-Style Workspace (Unified Left Panel + Full-Width Canvas) */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <div className="flex-1 flex overflow-hidden relative">
                        <LeftSidebar
                            width={leftWidth}
                            blockDefinitions={blockDefinitions}
                            products={products}
                            onAddBlock={handleAddBlock}
                            targetContainerId={targetContainerId}
                            onClearTargetContainer={() => setTargetContainerId(null)}
                        />

                        {/* Left Panel Resize Handle (Mouse Drag) */}
                        <div
                            onMouseDown={startResizingLeft}
                            title="Drag to resize panel (মাউস দিয়ে টেনে প্রস্থ পরিবর্তন করুন)"
                            className="w-1.5 hover:w-2 bg-transparent hover:bg-primary-500/30 active:bg-primary-600 transition-all cursor-col-resize flex items-center justify-center relative select-none z-20 shrink-0 group"
                        >
                            <div className="w-0.5 h-8 bg-gray-300 group-hover:bg-primary-600 rounded-full transition-colors" />
                        </div>

                        <Canvas
                            blockDefinitions={blockDefinitions}
                            onAddBlockToContainer={(containerId) => {
                                setSelectedBlockId(containerId);
                                setTargetContainerId(containerId);
                            }}
                        />
                    </div>

                    <DragOverlay dropAnimation={null}>
                        {paletteDragType && blockDefinitions[paletteDragType] ? (
                            <div className="flex items-center gap-2 rounded-xl border-2 border-primary-400 bg-white px-3 py-2 text-xs font-extrabold text-primary-800 shadow-2xl">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                                    <Plus className="h-3.5 w-3.5" />
                                </span>
                                {blockDefinitions[paletteDragType].name}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* Slide-over Revisions & Restore Drawer */}
                <RevisionsDrawer
                    isOpen={isRevisionsOpen}
                    landingPage={landingPage}
                    onClose={() => setIsRevisionsOpen(false)}
                    onRestored={(msg) => {
                        setSaveSuccess(msg);
                        setTimeout(() => setSaveSuccess(null), 4000);
                    }}
                />

                <AiGenerateModal
                    isOpen={isAiOpen}
                    onClose={() => setIsAiOpen(false)}
                    onInsert={handleInsertAiDesign}
                    landingPageId={landingPage.id}
                    aiConfig={ai}
                />
            </div>
        </>
    );
}
