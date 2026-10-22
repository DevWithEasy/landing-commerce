import { useDndMonitor, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, ChevronDown, ChevronUp, GripVertical, Layers, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { ContainerBlock } from '../blocks/ContainerBlock';
import { GridBlock } from '../blocks/GridBlock';
import { renderAstBlock } from '../blocks';
import { useBuilderStore } from '../stores/useBuilderStore';
import {
    DEVICE_DESIGN_WIDTHS,
    buildElementStyleCss,
    getBlockScopeClass,
    getBlockWrapperStyle,
    resolveBlocksForViewport,
} from '../styleSystem';
import type {
    Block,
    BlockDefinition,
    BlockType,
    ContainerBlockProps,
    GridBlockProps,
} from '@/types';

export interface CanvasProps {
    blockDefinitions: Record<BlockType, BlockDefinition>;
    onAddBlockToContainer?: (containerId: string) => void;
}

export function Canvas({ blockDefinitions, onAddBlockToContainer }: CanvasProps) {
    const { ast, viewport, selectedBlockId, setSelectedBlockId, removeBlock, reorderBlocks } =
        useBuilderStore();
    const { setNodeRef: setEndDropRef, isOver: isEndDropOver } = useDroppable({
        id: 'canvas_end_drop',
    });
    const [isDragging, setIsDragging] = useState(false);
    const [availableWidth, setAvailableWidth] = useState(0);
    const [surfaceHeight, setSurfaceHeight] = useState(0);
    const viewportMeasureRef = useRef<HTMLDivElement>(null);
    const surfaceRef = useRef<HTMLDivElement>(null);

    useDndMonitor({
        onDragStart: () => setIsDragging(true),
        onDragEnd: () => setIsDragging(false),
        onDragCancel: () => setIsDragging(false),
    });

    useEffect(() => {
        const element = viewportMeasureRef.current;

        if (!element || typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? 0;
            setAvailableWidth(width);
        });

        observer.observe(element);
        setAvailableWidth(element.clientWidth);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const element = surfaceRef.current;

        if (!element || typeof ResizeObserver === 'undefined') {
            return;
        }

        const syncHeight = () => setSurfaceHeight(element.offsetHeight);
        const observer = new ResizeObserver(syncHeight);

        observer.observe(element);
        syncHeight();

        return () => observer.disconnect();
    }, [viewport]);

    const blocks = useMemo(
        () => resolveBlocksForViewport(ast.blocks || [], viewport),
        [ast.blocks, viewport]
    );
    const settings = ast.settings || {};
    const pageFontFamily = settings.fontFamily || "'Inter', sans-serif";
    const pageBgColor = settings.backgroundColor || '#ffffff';

    const designWidth = DEVICE_DESIGN_WIDTHS[viewport];
    const scale =
        availableWidth > 0 ? Math.min(1, Math.max(0.2, availableWidth / designWidth)) : 1;
    const scaledHeight = surfaceHeight > 0 ? surfaceHeight * scale : 0;

    const viewportClasses = {
        desktop: 'shadow-xs border border-gray-200/60',
        tablet: 'rounded-2xl shadow-2xl border-4 border-slate-700',
        mobile: 'rounded-3xl shadow-2xl border-8 border-slate-800',
    }[viewport];

    const canvasStyle: CSSProperties = {
        fontFamily: pageFontFamily,
        backgroundColor: pageBgColor,
        containerType: 'inline-size',
        width: `${designWidth}px`,
        position: 'absolute',
        top: 0,
        left: '50%',
        marginLeft: `-${designWidth / 2}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        minHeight: viewport === 'desktop' ? 'calc(100vh - 8rem)' : undefined,
    };

    return (
        <main
            className="flex-1 h-full min-h-0 w-full bg-slate-100/90 overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-28"
            onClick={() => setSelectedBlockId(null)}
        >
            <div
                ref={viewportMeasureRef}
                className="relative w-full"
                style={{
                    height: scaledHeight > 0 ? `${scaledHeight}px` : undefined,
                    minHeight: scaledHeight > 0 ? undefined : 'calc(100vh - 8rem)',
                }}
            >
                <div
                    ref={surfaceRef}
                    style={canvasStyle}
                    className={`transition-transform duration-200 relative ${viewportClasses}`}
                    onClick={(e) => e.stopPropagation()}
                    data-lc-device={viewport}
                    data-lc-scale={scale.toFixed(3)}
                >
                    {blocks.length === 0 ? (
                        <div
                            ref={setEndDropRef}
                            className={`flex min-h-[400px] flex-col items-center justify-center p-8 text-center transition-colors ${
                                isEndDropOver
                                    ? 'bg-primary-50/60 text-primary-700 ring-2 ring-inset ring-primary-400'
                                    : 'text-gray-400'
                            }`}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                <Layers className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="font-bold text-gray-700 text-base">
                                Your canvas is empty
                            </h3>
                            <p className="text-xs text-gray-500 max-w-sm mt-1">
                                Drag a section or container from the block palette on the left, or
                                click one to insert it here.
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
                                        parentId={null}
                                        index={index}
                                        totalBlocks={blocks.length}
                                        depth={0}
                                        viewport={viewport}
                                        isSelected={selectedBlockId === block.id}
                                        selectedBlockId={selectedBlockId}
                                        blockDefinitions={blockDefinitions}
                                        onSelect={(id) => setSelectedBlockId(id)}
                                        onRemove={(id) => removeBlock(id)}
                                        onMoveUp={(idx, pId) =>
                                            idx > 0 && reorderBlocks(idx, idx - 1, pId)
                                        }
                                        onMoveDown={(idx, total, pId) =>
                                            idx < total - 1 && reorderBlocks(idx, idx + 1, pId)
                                        }
                                        onAddBlockToContainer={onAddBlockToContainer}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    )}

                    {blocks.length > 0 && (
                        <div
                            ref={setEndDropRef}
                            className={`mx-3 my-2 flex items-center justify-center rounded-xl border-2 border-dashed text-[11px] font-bold transition-all ${
                                isEndDropOver
                                    ? 'min-h-[52px] border-primary-600 bg-primary-50 text-primary-800'
                                    : isDragging
                                      ? 'min-h-[44px] border-primary-300 bg-primary-50/40 text-primary-600'
                                      : 'min-h-[16px] border-transparent text-transparent'
                            }`}
                        >
                            Drop here to add the block at the end of the page
                        </div>
                    )}
                </div>
            </div>
            {scale < 1 && (
                <div className="pointer-events-none sticky bottom-3 z-30 mx-auto mt-3 w-fit rounded-full border border-gray-300 bg-white/95 px-3 py-1 text-[10px] font-bold text-gray-500 shadow-md">
                    {Math.round(scale * 100)}% preview scale · {designWidth}px canvas
                </div>
            )}
        </main>
    );
}

interface SortableBlockWrapperProps {
    block: Block;
    parentId: string | null;
    index: number;
    totalBlocks: number;
    depth?: number;
    viewport: import('@/types/builder').ViewportMode;
    isSelected: boolean;
    selectedBlockId: string | null;
    blockDefinitions: Record<BlockType, BlockDefinition>;
    onSelect: (id: string) => void;
    onRemove: (id: string) => void;
    onMoveUp: (index: number, parentId: string | null) => void;
    onMoveDown: (index: number, total: number, parentId: string | null) => void;
    onAddBlockToContainer?: (containerId: string) => void;
}

function SortableBlockWrapper({
    block,
    parentId,
    index,
    totalBlocks,
    depth = 0,
    viewport,
    isSelected,
    selectedBlockId,
    blockDefinitions,
    onSelect,
    onRemove,
    onMoveUp,
    onMoveDown,
    onAddBlockToContainer,
}: SortableBlockWrapperProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
        data: { block, parentId },
    });

    const isContainer = block.type === 'ContainerBlock' || block.type === 'GridBlock';
    const children = block.children || [];
    const blockDefinition = blockDefinitions[block.type];
    const scopeClass = getBlockScopeClass(block.id);
    const elementStyleCss = buildElementStyleCss(block.id, block.styles, viewport);

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        ...getBlockWrapperStyle(block.styles),
    };

    const handleActionClick = (e: MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-lc-block-scope={scopeClass}
            data-lc-block-id={block.id}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(block.id);
            }}
            className={`relative group transition-all cursor-pointer ${
                isSelected
                    ? 'ring-2 ring-primary-500 ring-offset-2 z-20'
                    : 'hover:ring-1 hover:ring-primary-300'
            } ${isContainer ? 'p-1.5 rounded-xl border border-dashed border-gray-200 hover:border-primary-400' : ''}`}
        >
            {elementStyleCss && <style>{elementStyleCss}</style>}
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

                    <span className="font-bold text-[11px] px-1 text-primary-100 flex items-center gap-1">
                        {isContainer && <Box className="w-3 h-3 text-primary-300" />}
                        {blockDefinition?.name || block.type}
                    </span>

                    {isContainer && onAddBlockToContainer && (
                        <button
                            type="button"
                            onClick={(e) =>
                                handleActionClick(e, () => onAddBlockToContainer(block.id))
                            }
                            className="p-1 rounded text-primary-200 hover:text-white hover:bg-primary-800 flex items-center gap-0.5 text-[10px] font-semibold"
                            title="Add Child Block to Container"
                        >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                        </button>
                    )}

                    <div className="h-3 w-px bg-primary-700 mx-0.5" />

                    <button
                        type="button"
                        onClick={(e) => handleActionClick(e, () => onMoveUp(index, parentId))}
                        disabled={index === 0}
                        className="p-1 rounded text-primary-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                    >
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={(e) =>
                            handleActionClick(e, () => onMoveDown(index, totalBlocks, parentId))
                        }
                        disabled={index === totalBlocks - 1}
                        className="p-1 rounded text-primary-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => handleActionClick(e, () => onRemove(block.id))}
                        className="p-1 rounded text-rose-300 hover:text-rose-100 hover:bg-rose-900/40"
                        title="Delete Block"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Block Content Component */}
            {isContainer ? (
                <ContainerWrapper
                    block={block}
                    childrenBlocks={children}
                    selectedBlockId={selectedBlockId}
                    depth={depth}
                    viewport={viewport}
                    blockDefinitions={blockDefinitions}
                    onSelect={onSelect}
                    onRemove={onRemove}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    onAddBlockToContainer={onAddBlockToContainer}
                />
            ) : (
                <div className="pointer-events-none select-none">{renderAstBlock(block, true)}</div>
            )}
        </div>
    );
}

interface ContainerWrapperProps {
    block: Block;
    childrenBlocks: Block[];
    selectedBlockId: string | null;
    depth: number;
    viewport: import('@/types/builder').ViewportMode;
    blockDefinitions: Record<BlockType, BlockDefinition>;
    onSelect: (id: string) => void;
    onRemove: (id: string) => void;
    onMoveUp: (index: number, parentId: string | null) => void;
    onMoveDown: (index: number, total: number, parentId: string | null) => void;
    onAddBlockToContainer?: (containerId: string) => void;
}

function ContainerWrapper({
    block,
    childrenBlocks,
    selectedBlockId,
    depth,
    viewport,
    blockDefinitions,
    onSelect,
    onRemove,
    onMoveUp,
    onMoveDown,
    onAddBlockToContainer,
}: ContainerWrapperProps) {
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `container_drop_${block.id}`,
        data: { containerId: block.id },
    });

    const hasChildren = childrenBlocks.length > 0;
    const isGrid = block.type === 'GridBlock';

    const renderChild = (child: Block, childIdx: number) => (
        <SortableBlockWrapper
            key={child.id}
            block={child}
            parentId={block.id}
            index={childIdx}
            totalBlocks={childrenBlocks.length}
            depth={depth + 1}
            viewport={viewport}
            isSelected={selectedBlockId === child.id}
            selectedBlockId={selectedBlockId}
            blockDefinitions={blockDefinitions}
            onSelect={onSelect}
            onRemove={onRemove}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onAddBlockToContainer={onAddBlockToContainer}
        />
    );

    if (isGrid) {
        return (
            <GridBlock
                props={block.props as unknown as GridBlockProps}
                styles={block.styles}
                children={childrenBlocks}
                isEditor={true}
                onAddChild={() => onAddBlockToContainer?.(block.id)}
                dropRef={setDropRef}
                renderChildren={() => (
                    <SortableContext
                        items={childrenBlocks.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {childrenBlocks.map(renderChild)}
                    </SortableContext>
                )}
            />
        );
    }

    return (
        <ContainerBlock
            props={block.props as unknown as ContainerBlockProps}
            styles={block.styles}
            children={childrenBlocks}
            isEditor={true}
            onAddChild={() => onAddBlockToContainer?.(block.id)}
            renderChildren={() => (
                <div
                    ref={setDropRef}
                    className={`w-full transition-colors rounded-lg ${
                        isOver ? 'bg-primary-50/50 ring-2 ring-primary-400' : ''
                    }`}
                >
                    {hasChildren ? (
                        <SortableContext
                            items={childrenBlocks.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="w-full space-y-2">
                                {childrenBlocks.map(renderChild)}
                            </div>
                        </SortableContext>
                    ) : (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddBlockToContainer?.(block.id);
                            }}
                            className={`w-full min-h-[90px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors ${
                                isOver
                                    ? 'border-primary-500 bg-primary-100/60 text-primary-900'
                                    : 'border-primary-300 bg-primary-50/40 hover:bg-primary-50 text-primary-700'
                            }`}
                        >
                            <Box className="w-5 h-5 mb-1 opacity-70" />
                            <span className="text-xs font-bold">Container is empty</span>
                            <span className="text-[11px] opacity-80 mt-0.5">
                                Drag widgets here or click to add
                            </span>
                        </div>
                    )}
                </div>
            )}
        />
    );
}
