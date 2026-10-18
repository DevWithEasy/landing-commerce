import {
    ChevronDown,
    ChevronUp,
    Clock,
    Code,
    FileText,
    HelpCircle,
    Layers,
    Package,
    Plus,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Star,
    Trash2,
    Video,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { useBuilderStore } from '../stores/useBuilderStore';
import type { BlockDefinition, BlockType } from '@/types';

// Map icon strings to Lucide icon components safely
const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
    Sparkles,
    Package,
    ShoppingBag,
    ShieldCheck,
    Star,
    Video,
    HelpCircle,
    Clock,
    Layers,
    Code,
};

export interface LeftSidebarProps {
    blockDefinitions: Record<BlockType, BlockDefinition>;
    onAddBlock: (blockType: BlockType) => void;
}

export function LeftSidebar({ blockDefinitions, onAddBlock }: LeftSidebarProps) {
    const [activeTab, setActiveTab] = useState<'palette' | 'layers'>('palette');
    const { ast, selectedBlockId, setSelectedBlockId, removeBlock, reorderBlocks } =
        useBuilderStore();

    const blocks = ast.blocks;

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
        <aside className="w-72 sm:w-80 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-4rem)] select-none">
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
                    <span>Layers ({blocks.length})</span>
                </button>
            </div>

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
                                            onClick={() => onAddBlock(def.type)}
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
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {blocks.length === 0 ? (
                        <div className="text-center py-12 px-4 text-gray-400">
                            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-semibold">No blocks added yet.</p>
                            <p className="text-[11px] text-gray-400 mt-1">
                                Click on "Add Blocks" above to insert sections into your page.
                            </p>
                        </div>
                    ) : (
                        blocks.map((block, idx) => {
                            const def = blockDefinitions[block.type];
                            const IconComponent = def ? ICON_MAP[def.icon] || FileText : FileText;
                            const isSelected = selectedBlockId === block.id;

                            return (
                                <div
                                    key={block.id}
                                    onClick={() => setSelectedBlockId(block.id)}
                                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                                        isSelected
                                            ? 'bg-primary-50 border-primary-500 text-primary-900 font-semibold shadow-xs'
                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2.5 truncate">
                                        <span className="text-[10px] font-mono text-gray-400 w-4 text-center">
                                            {idx + 1}
                                        </span>
                                        <IconComponent
                                            className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`}
                                        />
                                        <span className="truncate">{def?.name || block.type}</span>
                                    </div>

                                    <div
                                        className="flex items-center space-x-0.5 shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => idx > 0 && reorderBlocks(idx, idx - 1)}
                                            disabled={idx === 0}
                                            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move Up"
                                        >
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                idx < blocks.length - 1 &&
                                                reorderBlocks(idx, idx + 1)
                                            }
                                            disabled={idx === blocks.length - 1}
                                            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move Down"
                                        >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeBlock(block.id)}
                                            className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                                            title="Delete Block"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </aside>
    );
}
