import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, GripVertical, Layers, Trash2 } from 'lucide-react';
import type { CSSProperties, MouseEvent } from 'react';
import { renderAstBlock } from '../blocks';
import { useBuilderStore } from '../stores/useBuilderStore';
import type { Block, BlockDefinition, BlockType } from '@/types';

export interface CanvasProps {
    blockDefinitions: Record<BlockType, BlockDefinition>;
}

export function Canvas({ blockDefinitions }: CanvasProps) {
    const { ast, viewport, selectedBlockId, setSelectedBlockId, removeBlock, reorderBlocks } =
        useBuilderStore();

    const blocks = ast.blocks;

    // Viewport styling
    const viewportClasses = {
        desktop: 'w-full max-w-full my-0 shadow-xs border border-gray-200/60',
        tablet: 'w-full max-w-[768px] mx-auto my-6 rounded-2xl shadow-2xl border-4 border-slate-700',
        mobile: 'w-full max-w-[390px] mx-auto my-6 rounded-3xl shadow-2xl border-8 border-slate-800',
    }[viewport];

    return (
        <main
            className="flex-1 h-full min-h-0 w-full bg-slate-100/90 overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-28"
            onClick={() => setSelectedBlockId(null)}
        >
            <div
                className={`bg-white min-h-[calc(100vh-8rem)] transition-all duration-300 relative ${viewportClasses}`}
                onClick={(e) => e.stopPropagation()}
            >
                {blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <Layers className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-bold text-gray-700 text-base">Your canvas is empty</h3>
                        <p className="text-xs text-gray-500 max-w-sm mt-1">
                            Choose a section from the block palette on the left to start building
                            your landing page.
                        </p>
                    </div>
                ) : (
                    <SortableContext
                        items={blocks.map((b) => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="divide-y divide-gray-100">
                            {blocks.map((block, index) => (
                                <SortableBlockWrapper
                                    key={block.id}
                                    block={block}
                                    index={index}
                                    totalBlocks={blocks.length}
                                    isSelected={selectedBlockId === block.id}
                                    blockDefinition={blockDefinitions[block.type]}
                                    onSelect={() => setSelectedBlockId(block.id)}
                                    onRemove={() => removeBlock(block.id)}
                                    onMoveUp={() => index > 0 && reorderBlocks(index, index - 1)}
                                    onMoveDown={() =>
                                        index < blocks.length - 1 && reorderBlocks(index, index + 1)
                                    }
                                />
                            ))}
                        </div>
                    </SortableContext>
                )}
            </div>
        </main>
    );
}

interface SortableBlockWrapperProps {
    block: Block;
    index: number;
    totalBlocks: number;
    isSelected: boolean;
    blockDefinition?: BlockDefinition;
    onSelect: () => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

function SortableBlockWrapper({
    block,
    index,
    totalBlocks,
    isSelected,
    blockDefinition,
    onSelect,
    onRemove,
    onMoveUp,
    onMoveDown,
}: SortableBlockWrapperProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const handleActionClick = (e: MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            className={`relative group transition-all cursor-pointer ${
                isSelected
                    ? 'ring-2 ring-primary-500 ring-offset-2 z-20'
                    : 'hover:ring-1 hover:ring-primary-300'
            }`}
        >
            {/* Quick Action Floating Toolbar for Selected Block */}
            {isSelected && (
                <div
                    className="absolute -top-3.5 right-4 z-30 bg-primary-900 text-white px-2.5 py-1 rounded-md shadow-lg flex items-center space-x-1 text-xs select-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 text-primary-200 hover:text-white"
                        title="Drag to Reorder"
                    >
                        <GripVertical className="w-3.5 h-3.5" />
                    </button>

                    <span className="font-bold text-[11px] px-1 text-primary-100">
                        {blockDefinition?.name || block.type}
                    </span>

                    <div className="h-3 w-px bg-primary-700 mx-0.5" />

                    <button
                        type="button"
                        onClick={(e) => handleActionClick(e, onMoveUp)}
                        disabled={index === 0}
                        className="p-1 rounded text-primary-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                    >
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => handleActionClick(e, onMoveDown)}
                        disabled={index === totalBlocks - 1}
                        className="p-1 rounded text-primary-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => handleActionClick(e, onRemove)}
                        className="p-1 rounded text-rose-300 hover:text-rose-100 hover:bg-rose-900/40"
                        title="Delete Block"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Block Content Component */}
            <div className="pointer-events-none select-none">{renderAstBlock(block, true)}</div>
        </div>
    );
}
