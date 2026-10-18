import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { Canvas } from '@/Builder/components/Canvas';
import { Inspector } from '@/Builder/components/Inspector';
import { LeftSidebar } from '@/Builder/components/LeftSidebar';
import { RevisionsDrawer } from '@/Builder/components/RevisionsDrawer';
import { TopBar } from '@/Builder/components/TopBar';
import { useBuilderStore } from '@/Builder/stores/useBuilderStore';
import type { Block, BlockType, BuilderEditorProps, LandingPageRevisionSummary } from '@/types';

export default function Editor({
    landingPage,
    initialAst,
    blockDefinitions,
    products,
}: BuilderEditorProps) {
    const { ast, setAst, setAvailableProducts, addBlock, reorderBlocks, undo, redo, canUndo, canRedo } =
        useBuilderStore();

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isRevisionsOpen, setIsRevisionsOpen] = useState(false);

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

    // Handle drag end reordering
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = ast.blocks.findIndex((b) => b.id === active.id);
        const newIndex = ast.blocks.findIndex((b) => b.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            reorderBlocks(oldIndex, newIndex);
        }
    };

    // Add block from palette
    const handleAddBlock = (blockType: BlockType) => {
        const def = blockDefinitions[blockType];
        if (!def) return;

        const uniqueSuffix = Math.random().toString(36).substring(2, 8);
        const blockPrefix = blockType.toLowerCase().replace('block', '');
        const newBlockId = `blk_${blockPrefix}_${uniqueSuffix}`;

        let initialProps = { ...def.defaultProps };

        // Pre-fill target product for commerce blocks
        if (blockType === 'ProductSelectorBlock' || blockType === 'CodCheckoutBlock') {
            const defaultProdId = landingPage.product_id || (products[0]?.id ?? 0);
            initialProps = { ...initialProps, productId: defaultProdId };
        }

        const newBlock: Block = {
            id: newBlockId,
            type: blockType,
            props: initialProps,
            styles: { ...def.defaultStyles },
        };

        addBlock(newBlock);
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
                />

                {/* Main 3-Column Studio Workspace */}
                <div className="flex-1 flex overflow-hidden">
                    <LeftSidebar blockDefinitions={blockDefinitions} onAddBlock={handleAddBlock} />

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <Canvas blockDefinitions={blockDefinitions} />
                    </DndContext>

                    <Inspector blockDefinitions={blockDefinitions} products={products} />
                </div>

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
            </div>
        </>
    );
}
