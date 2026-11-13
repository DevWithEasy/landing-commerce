import {
    AlignLeft,
    Box,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock,
    Code,
    FileText,
    GripVertical,
    Heading,
    HelpCircle,
    Image as ImageIcon,
    Images,
    LayoutGrid,
    Layers,
    ListChecks,
    MousePointerClick,
    Package,
    Plus,
    Quote,
    Search,
    Settings,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Square,
    Star,
    Trash2,
    Type,
    Video,
    X,
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { ComponentType, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { findBlockInTree, useBuilderStore } from '../stores/useBuilderStore';
import type { Block, BlockDefinition, BlockType } from '@/types';
import { Inspector } from './Inspector';
import { PageSettingsInspector } from './PageSettingsInspector';

// Map icon strings to Lucide icon components safely
const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
    Sparkles,
    Package,
    ShoppingBag,
    ShieldCheck,
    Star,
    Video,
    HelpCircle,
    ChevronDown,
    Clock,
    Layers,
    Code,
    Box,
    Type,
    ImageIcon,
    Images,
    Square,
    Heading,
    AlignLeft,
    ListChecks,
    MousePointerClick,
    LayoutGrid,
    Quote,
};

function countAllBlocks(blocks: Block[]): number {
    return blocks.reduce((acc, b) => acc + 1 + (b.children ? countAllBlocks(b.children) : 0), 0);
}

export interface LeftSidebarProps {
    blockDefinitions: Record<BlockType, BlockDefinition>;
    products: Array<{
        id: number;
        title: string;
        slug: string;
        regular_price: string | number;
        sale_price: string | number | null;
    }>;
    onAddBlock: (blockType: BlockType, targetParentId?: string | null) => void;
    width?: number;
    targetContainerId?: string | null;
    onClearTargetContainer?: () => void;
}

type PanelMode = 'palette' | 'layers' | 'inspector' | 'page_settings';

export function LeftSidebar({
    blockDefinitions,
    products,
    onAddBlock,
    width,
    targetContainerId,
    onClearTargetContainer,
}: LeftSidebarProps) {
    const [panelMode, setPanelMode] = useState<PanelMode>('palette');
    const [widgetSearch, setWidgetSearch] = useState('');
    const { ast, selectedBlockId, setSelectedBlockId, removeBlock, reorderBlocks } =
        useBuilderStore();

    const blocks = ast.blocks || [];
    const totalCount = countAllBlocks(blocks);
    const selectedBlock = selectedBlockId ? findBlockInTree(blocks, selectedBlockId) : null;
    const selectedDef = selectedBlock ? blockDefinitions[selectedBlock.type] : null;

    // Automatically open widget controls in the left panel when a widget is selected on canvas
    const prevSelectedIdRef = useRef<string | null>(selectedBlockId);
    useEffect(() => {
        if (selectedBlockId && selectedBlockId !== prevSelectedIdRef.current) {
            setPanelMode('inspector');
        } else if (!selectedBlockId && prevSelectedIdRef.current) {
            setPanelMode((prev) => (prev === 'inspector' ? 'palette' : prev));
        }
        prevSelectedIdRef.current = selectedBlockId;
    }, [selectedBlockId]);

    // Group available blocks by category (with optional search filter)
    const normalizedSearch = widgetSearch.trim().toLowerCase();
    const categorizedBlocks: Record<string, BlockDefinition[]> = {};
    Object.values(blockDefinitions).forEach((def) => {
        if (
            normalizedSearch &&
            !def.name.toLowerCase().includes(normalizedSearch) &&
            !(def.category || '').toLowerCase().includes(normalizedSearch)
        ) {
            return;
        }
        const cat = def.category || 'General';
        if (!categorizedBlocks[cat]) {
            categorizedBlocks[cat] = [];
        }
        categorizedBlocks[cat].push(def);
    });

    const CATEGORY_PRIORITY: Record<string, number> = {
        layout: 0,
        basic: 1,
    };

    const orderedCategories = Object.entries(categorizedBlocks).sort(([a], [b]) => {
        const pa = CATEGORY_PRIORITY[a.toLowerCase()] ?? 99;
        const pb = CATEGORY_PRIORITY[b.toLowerCase()] ?? 99;
        return pa - pb;
    });

    const headerTitle =
        panelMode === 'inspector' && selectedBlock
            ? `Edit ${selectedDef?.name || selectedBlock.type}`
            : panelMode === 'layers'
              ? `Navigator (${totalCount})`
              : panelMode === 'page_settings'
                ? 'Page Settings'
                : 'Elements';

    return (
        <aside
            style={{ width: width ? `${width}px` : undefined }}
            className="w-80 sm:w-88 shrink-0 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-4rem)] select-none transition-[width] duration-75"
        >
            {/* Elementor-Style Unified Left Panel Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-slate-900 text-white px-2.5 py-2 shrink-0">
                <button
                    type="button"
                    onClick={() => setPanelMode('palette')}
                    title="Elements / Widgets"
                    className={`p-1.5 rounded-md transition-colors ${
                        panelMode === 'palette'
                            ? 'bg-white/15 text-white'
                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>

                <div className="min-w-0 flex-1 px-2 text-center">
                    <span className="block truncate text-xs font-bold tracking-wide">
                        {headerTitle}
                    </span>
                </div>

                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={() =>
                            setPanelMode(panelMode === 'layers' ? 'palette' : 'layers')
                        }
                        title={`Navigator (${totalCount})`}
                        className={`p-1.5 rounded-md transition-colors ${
                            panelMode === 'layers'
                                ? 'bg-white/15 text-white'
                                : 'text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            setPanelMode(
                                panelMode === 'page_settings'
                                    ? selectedBlock
                                        ? 'inspector'
                                        : 'palette'
                                    : 'page_settings'
                            )
                        }
                        title="Page Settings"
                        className={`p-1.5 rounded-md transition-colors ${
                            panelMode === 'page_settings'
                                ? 'bg-white/15 text-white'
                                : 'text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    {panelMode === 'inspector' && selectedBlock && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedBlockId(null);
                                setPanelMode('palette');
                            }}
                            title="Deselect Widget"
                            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Target Container Banner if selected */}
            {targetContainerId && panelMode === 'palette' && (
                <div className="bg-primary-50 border-b border-primary-200 px-3.5 py-2 flex items-center justify-between text-xs shrink-0">
                    <div className="flex items-center space-x-1.5 text-primary-900 font-semibold truncate">
                        <Box className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                        <span className="truncate">Adding into #{targetContainerId.slice(-4)}</span>
                    </div>
                    {onClearTargetContainer && (
                        <button
                            type="button"
                            onClick={onClearTargetContainer}
                            className="text-primary-600 hover:text-primary-900 p-0.5 rounded hover:bg-primary-100"
                            title="Add to root instead"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}

            {/* Mode 1: Block Palette (Elements) */}
            {panelMode === 'palette' && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-2.5 border-b border-gray-100 bg-gray-50/70 shrink-0">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={widgetSearch}
                                onChange={(e) => setWidgetSearch(e.target.value)}
                                placeholder="Search widgets..."
                                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                            />
                            {widgetSearch && (
                                <button
                                    type="button"
                                    onClick={() => setWidgetSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    title="Clear search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                        <p className="rounded-lg bg-primary-50/70 px-2.5 py-2 text-[10px] font-medium leading-snug text-primary-800">
                            Drag a block onto the canvas to place it exactly where you want, or
                            click to insert it after the selected block.
                        </p>
                        {orderedCategories.length === 0 ? (
                            <div className="text-center py-8 text-xs text-gray-400">
                                No widgets match "{widgetSearch}".
                            </div>
                        ) : (
                            orderedCategories.map(([category, defs]) => (
                                <div key={category} className="space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                        {category}
                                    </span>
                                    <div className="grid grid-cols-1 gap-1">
                                        {defs.map((def) => (
                                            <PaletteItem
                                                key={def.type}
                                                definition={def}
                                                targetContainerId={targetContainerId}
                                                onAddBlock={onAddBlock}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Mode 2: Navigator (Layers Tree) */}
            {panelMode === 'layers' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {blocks.length === 0 ? (
                        <div className="text-center py-12 px-4 text-gray-400">
                            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-semibold">No blocks added yet.</p>
                            <p className="text-[11px] text-gray-400 mt-1">
                                Click the grid icon above to insert widgets into your page.
                            </p>
                        </div>
                    ) : (
                        blocks.map((block, idx) => (
                            <LayerTreeItem
                                key={block.id}
                                block={block}
                                parentId={null}
                                index={idx}
                                totalSiblings={blocks.length}
                                depth={0}
                                selectedBlockId={selectedBlockId}
                                blockDefinitions={blockDefinitions}
                                onSelect={(id) => {
                                    setSelectedBlockId(id);
                                    setPanelMode('inspector');
                                }}
                                onRemove={(id) => removeBlock(id)}
                                onMoveUp={(i, pId) => i > 0 && reorderBlocks(i, i - 1, pId)}
                                onMoveDown={(i, total, pId) =>
                                    i < total - 1 && reorderBlocks(i, i + 1, pId)
                                }
                                onAddChild={(containerId) => {
                                    setSelectedBlockId(containerId);
                                    setPanelMode('palette');
                                }}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Mode 3: Active Widget Inspector */}
            {panelMode === 'inspector' && selectedBlock && (
                <Inspector
                    embedded
                    blockDefinitions={blockDefinitions}
                    products={products}
                />
            )}

            {/* Mode 4: Global Page Settings */}
            {panelMode === 'page_settings' && (
                <PageSettingsInspector
                    embedded
                    hasSelectedBlock={!!selectedBlock}
                    onBackToBlock={() =>
                        setPanelMode(selectedBlock ? 'inspector' : 'palette')
                    }
                />
            )}
        </aside>
    );
}

interface PaletteItemProps {
    definition: BlockDefinition;
    targetContainerId?: string | null;
    onAddBlock: (blockType: BlockType, targetParentId?: string | null) => void;
}

function PaletteItem({ definition, targetContainerId, onAddBlock }: PaletteItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette_${definition.type}`,
        data: {
            source: 'palette',
            blockType: definition.type,
        },
    });
    const IconComponent = ICON_MAP[definition.icon] || FileText;
    const pointerStart = useRef<{ x: number; y: number } | null>(null);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        const start = pointerStart.current;
        pointerStart.current = null;

        // PointerSensor requires a 5px movement to start a drag. Suppress the
        // click that follows a real drag so a block is never inserted twice.
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) {
            return;
        }

        onAddBlock(definition.type, targetContainerId || undefined);
    };

    return (
        <button
            ref={setNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            onPointerDownCapture={(event) => {
                pointerStart.current = { x: event.clientX, y: event.clientY };
            }}
            onClick={handleClick}
            title={`${definition.name} - ${definition.description}\nDrag onto the canvas or click to insert.`}
            className={`group relative flex min-h-[36px] w-full cursor-grab flex-row items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-left transition hover:border-primary-400 hover:bg-primary-50/40 hover:shadow-xs active:cursor-grabbing ${
                isDragging ? 'opacity-40' : ''
            }`}
        >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600 transition group-hover:bg-primary-100 group-hover:text-primary-700">
                <IconComponent className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[10.5px] font-bold leading-tight text-gray-800 transition group-hover:text-primary-700">
                {definition.name}
            </span>
            <GripVertical className="h-3 w-3 shrink-0 text-gray-300 opacity-0 transition group-hover:opacity-100" />
        </button>
    );
}

interface LayerTreeItemProps {
    block: Block;
    parentId: string | null;
    index: number;
    totalSiblings: number;
    depth: number;
    selectedBlockId: string | null;
    blockDefinitions: Record<BlockType, BlockDefinition>;
    onSelect: (id: string) => void;
    onRemove: (id: string) => void;
    onMoveUp: (index: number, parentId: string | null) => void;
    onMoveDown: (index: number, total: number, parentId: string | null) => void;
    onAddChild?: (containerId: string) => void;
}

function LayerTreeItem({
    block,
    parentId,
    index,
    totalSiblings,
    depth,
    selectedBlockId,
    blockDefinitions,
    onSelect,
    onRemove,
    onMoveUp,
    onMoveDown,
    onAddChild,
}: LayerTreeItemProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const def = blockDefinitions[block.type];
    const IconComponent = def ? ICON_MAP[def.icon] || FileText : FileText;
    const isSelected = selectedBlockId === block.id;
    const isContainer = block.type === 'ContainerBlock' || block.type === 'GridBlock';
    const children = block.children || [];

    return (
        <div className="space-y-1">
            <div
                onClick={() => onSelect(block.id)}
                style={{ paddingLeft: `${Math.max(6, depth * 14 + 6)}px` }}
                className={`flex items-center justify-between py-1.5 pr-1.5 rounded-lg border text-xs cursor-pointer transition ${
                    isSelected
                        ? 'bg-primary-50 border-primary-500 text-primary-900 font-semibold shadow-xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
            >
                <div className="flex items-center space-x-1.5 min-w-0 flex-1 mr-1">
                    {isContainer && children.length > 0 ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCollapsed(!isCollapsed);
                            }}
                            className="p-0.5 text-gray-400 hover:text-gray-700 rounded"
                        >
                            {isCollapsed ? (
                                <ChevronRight className="w-3 h-3" />
                            ) : (
                                <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                    ) : (
                        <div className="w-3" />
                    )}

                    <IconComponent
                        className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-primary-600' : 'text-gray-400'
                        }`}
                    />

                    <span className="truncate text-[11px]">{def?.name || block.type}</span>

                    {isContainer && (
                        <span className="text-[10px] text-gray-400 font-mono shrink-0">
                            ({children.length})
                        </span>
                    )}
                </div>

                <div
                    className="flex items-center space-x-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    {isContainer && onAddChild && (
                        <button
                            type="button"
                            onClick={() => onAddChild(block.id)}
                            className="p-1 rounded text-primary-600 hover:bg-primary-100"
                            title="Add Child Block"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => onMoveUp(index, parentId)}
                        disabled={index === 0}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Move Up"
                    >
                        <ChevronUp className="w-3 h-3" />
                    </button>

                    <button
                        type="button"
                        onClick={() => onMoveDown(index, totalSiblings, parentId)}
                        disabled={index === totalSiblings - 1}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Move Down"
                    >
                        <ChevronDown className="w-3 h-3" />
                    </button>

                    <button
                        type="button"
                        onClick={() => onRemove(block.id)}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Block"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Render children recursively if container is open */}
            {isContainer && !isCollapsed && children.length > 0 && (
                <div className="space-y-1">
                    {children.map((child, childIdx) => (
                        <LayerTreeItem
                            key={child.id}
                            block={child}
                            parentId={block.id}
                            index={childIdx}
                            totalSiblings={children.length}
                            depth={depth + 1}
                            selectedBlockId={selectedBlockId}
                            blockDefinitions={blockDefinitions}
                            onSelect={onSelect}
                            onRemove={onRemove}
                            onMoveUp={onMoveUp}
                            onMoveDown={onMoveDown}
                            onAddChild={onAddChild}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
