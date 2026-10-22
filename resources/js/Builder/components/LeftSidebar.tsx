import {
    AlignLeft,
    Box,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock,
    Code,
    FileText,
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
import type { ComponentType } from 'react';
import { useState } from 'react';
import { useBuilderStore } from '../stores/useBuilderStore';
import type { Block, BlockDefinition, BlockType } from '@/types';

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
    onAddBlock: (blockType: BlockType, targetParentId?: string | null) => void;
    width?: number;
    targetContainerId?: string | null;
    onClearTargetContainer?: () => void;
}

export function LeftSidebar({
    blockDefinitions,
    onAddBlock,
    width,
    targetContainerId,
    onClearTargetContainer,
}: LeftSidebarProps) {
    const [activeTab, setActiveTab] = useState<'palette' | 'layers'>('palette');
    const { ast, selectedBlockId, setSelectedBlockId, removeBlock, reorderBlocks } =
        useBuilderStore();

    const blocks = ast.blocks || [];
    const totalCount = countAllBlocks(blocks);

    // Group available blocks by category
    const categorizedBlocks: Record<string, BlockDefinition[]> = {};
    Object.values(blockDefinitions).forEach((def) => {
        const cat = def.category || 'General';
        if (!categorizedBlocks[cat]) {
            categorizedBlocks[cat] = [];
        }
        categorizedBlocks[cat].push(def);
    });

    return (
        <aside
            style={{ width: width ? `${width}px` : undefined }}
            className="w-72 sm:w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-4rem)] select-none transition-[width] duration-75"
        >
            {/* Sidebar Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50/70 p-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('palette')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition ${
                        activeTab === 'palette'
                            ? 'bg-white text-primary-700 shadow-xs'
                            : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Blocks</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('layers')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition ${
                        activeTab === 'layers'
                            ? 'bg-white text-primary-700 shadow-xs'
                            : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Layers ({totalCount})</span>
                </button>
            </div>

            {/* Target Container Banner if selected */}
            {targetContainerId && (
                <div className="bg-primary-50 border-b border-primary-200 px-3.5 py-2 flex items-center justify-between text-xs">
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

            {/* Tab 1: Block Palette */}
            {activeTab === 'palette' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {Object.entries(categorizedBlocks).map(([category, defs]) => (
                        <div key={category} className="space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                {category}
                            </span>
                            <div className="grid grid-cols-1 gap-2">
                                {defs.map((def) => {
                                    const IconComponent = ICON_MAP[def.icon] || FileText;
                                    return (
                                        <button
                                            key={def.type}
                                            type="button"
                                            onClick={() => onAddBlock(def.type, targetContainerId)}
                                            className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start space-x-3 cursor-pointer"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary-100 text-gray-600 group-hover:text-primary-700 flex items-center justify-center shrink-0 transition">
                                                <IconComponent className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-900 group-hover:text-primary-700 truncate">
                                                        {def.name}
                                                    </span>
                                                    <Plus className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 shrink-0 ml-1" />
                                                </div>
                                                <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                                                    {def.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab 2: Layers Tree */}
            {activeTab === 'layers' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {blocks.length === 0 ? (
                        <div className="text-center py-12 px-4 text-gray-400">
                            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-semibold">No blocks added yet.</p>
                            <p className="text-[11px] text-gray-400 mt-1">
                                Click on "Add Blocks" above to insert sections into your page.
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
                                onSelect={(id) => setSelectedBlockId(id)}
                                onRemove={(id) => removeBlock(id)}
                                onMoveUp={(i, pId) => i > 0 && reorderBlocks(i, i - 1, pId)}
                                onMoveDown={(i, total, pId) =>
                                    i < total - 1 && reorderBlocks(i, i + 1, pId)
                                }
                                onAddChild={(containerId) => {
                                    setSelectedBlockId(containerId);
                                    setActiveTab('palette');
                                }}
                            />
                        ))
                    )}
                </div>
            )}
        </aside>
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
