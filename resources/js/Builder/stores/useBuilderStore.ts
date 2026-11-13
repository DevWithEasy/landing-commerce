import { create } from 'zustand';
import type { Product } from '@/types';
import type { Block, BlockProps, BlockStyles, PageAst } from '@/types/builder';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

// Recursive Tree Utilities

export function cloneBlockWithFreshIds(block: Block): Block {
    const suffix =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID().slice(0, 8)
            : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    return {
        ...block,
        id: `blk_${suffix}`,
        props: JSON.parse(JSON.stringify(block.props || {})) as BlockProps,
        styles: JSON.parse(JSON.stringify(block.styles || {})) as BlockStyles,
        children: block.children ? block.children.map(cloneBlockWithFreshIds) : undefined,
    };
}

export function findBlockInTree(blocks: Block[], id: string): Block | null {
    for (const b of blocks) {
        if (b.id === id) return b;
        if (b.children && b.children.length > 0) {
            const found = findBlockInTree(b.children, id);
            if (found) return found;
        }
    }
    return null;
}

export function findParentInTree(
    blocks: Block[],
    id: string,
    parent: Block | null = null
): { parent: Block | null; index: number } | null {
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === id) {
            return { parent, index: i };
        }
        if (blocks[i].children && blocks[i].children!.length > 0) {
            const res = findParentInTree(blocks[i].children!, id, blocks[i]);
            if (res) return res;
        }
    }
    return null;
}

export function isDescendant(blocks: Block[], parentId: string, targetId: string): boolean {
    const parent = findBlockInTree(blocks, parentId);
    if (!parent || !parent.children) return false;
    return !!findBlockInTree(parent.children, targetId);
}

export function updateBlockPropsInTree(
    blocks: Block[],
    id: string,
    props: Partial<BlockProps>
): Block[] {
    return blocks.map((b) => {
        if (b.id === id) {
            return { ...b, props: { ...b.props, ...props } };
        }
        if (b.children && b.children.length > 0) {
            return { ...b, children: updateBlockPropsInTree(b.children, id, props) };
        }
        return b;
    });
}

export function updateBlockStylesInTree(
    blocks: Block[],
    id: string,
    styles: Partial<BlockStyles>
): Block[] {
    return blocks.map((b) => {
        if (b.id === id) {
            return { ...b, styles: { ...b.styles, ...styles } };
        }
        if (b.children && b.children.length > 0) {
            return { ...b, children: updateBlockStylesInTree(b.children, id, styles) };
        }
        return b;
    });
}

export function setBlockStylesInTree(
    blocks: Block[],
    id: string,
    styles: BlockStyles
): Block[] {
    return blocks.map((b) => {
        if (b.id === id) {
            return { ...b, styles };
        }
        if (b.children && b.children.length > 0) {
            return { ...b, children: setBlockStylesInTree(b.children, id, styles) };
        }
        return b;
    });
}

export function removeBlockFromTree(blocks: Block[], id: string): Block[] {
    return blocks
        .filter((b) => b.id !== id)
        .map((b) => {
            if (b.children && b.children.length > 0) {
                return { ...b, children: removeBlockFromTree(b.children, id) };
            }
            return b;
        });
}

export function addBlockToTree(
    blocks: Block[],
    block: Block,
    parentId?: string | null,
    index?: number
): Block[] {
    if (!parentId) {
        const next = [...blocks];
        if (typeof index === 'number' && index >= 0 && index <= next.length) {
            next.splice(index, 0, block);
        } else {
            next.push(block);
        }
        return next;
    }

    return blocks.map((b) => {
        if (b.id === parentId) {
            const children = [...(b.children || [])];
            if (typeof index === 'number' && index >= 0 && index <= children.length) {
                children.splice(index, 0, block);
            } else {
                children.push(block);
            }
            return { ...b, children };
        }
        if (b.children && b.children.length > 0) {
            return { ...b, children: addBlockToTree(b.children, block, parentId, index) };
        }
        return b;
    });
}

export function addBlocksToTree(
    blocks: Block[],
    newBlocks: Block[],
    parentId: string
): Block[] {
    return blocks.map((b) => {
        if (b.id === parentId) {
            return { ...b, children: [...(b.children || []), ...newBlocks] };
        }
        if (b.children && b.children.length > 0) {
            return { ...b, children: addBlocksToTree(b.children, newBlocks, parentId) };
        }
        return b;
    });
}

function collectBlockIds(blocks: Block[], ids: Set<string> = new Set<string>()): Set<string> {
    for (const block of blocks) {
        ids.add(block.id);
        if (block.children && block.children.length > 0) {
            collectBlockIds(block.children, ids);
        }
    }
    return ids;
}

function cloneBlockWithUniqueId(block: Block, usedIds: Set<string>): Block {
    let id = block.id;
    if (!id || usedIds.has(id)) {
        do {
            id = `blk_ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
        } while (usedIds.has(id));
    }
    usedIds.add(id);

    return {
        ...block,
        id,
        children: block.children?.map((child) => cloneBlockWithUniqueId(child, usedIds)),
    };
}

export function reorderBlocksInTree(
    blocks: Block[],
    startIndex: number,
    endIndex: number,
    parentId?: string | null
): Block[] {
    if (!parentId) {
        const next = [...blocks];
        const [moved] = next.splice(startIndex, 1);
        next.splice(endIndex, 0, moved);
        return next;
    }

    return blocks.map((b) => {
        if (b.id === parentId && b.children) {
            const nextChildren = [...b.children];
            const [moved] = nextChildren.splice(startIndex, 1);
            nextChildren.splice(endIndex, 0, moved);
            return { ...b, children: nextChildren };
        }
        if (b.children && b.children.length > 0) {
            return { ...b, children: reorderBlocksInTree(b.children, startIndex, endIndex, parentId) };
        }
        return b;
    });
}

export function moveBlockInTree(
    blocks: Block[],
    activeId: string,
    targetParentId: string | null,
    targetIndex?: number
): Block[] {
    if (activeId === targetParentId || (targetParentId && isDescendant(blocks, activeId, targetParentId))) {
        return blocks;
    }

    const blockToMove = findBlockInTree(blocks, activeId);
    if (!blockToMove) return blocks;

    const treeWithoutMoved = removeBlockFromTree(blocks, activeId);
    return addBlockToTree(treeWithoutMoved, blockToMove, targetParentId, targetIndex);
}

export interface BuilderState {
    ast: PageAst;
    selectedBlockId: string | null;
    viewport: ViewportMode;
    availableProducts: Product[];
    history: PageAst[];
    historyIndex: number;

    setAst: (ast: PageAst) => void;
    setSelectedBlockId: (id: string | null) => void;
    setViewport: (viewport: ViewportMode) => void;
    setAvailableProducts: (products: Product[]) => void;

    // Block manipulations
    addBlock: (block: Block, parentId?: string | null, index?: number) => void;
    addBlocks: (blocks: Block[], parentId?: string | null) => void;
    updateBlockProps: (id: string, props: Partial<BlockProps>) => void;
    updateBlockStyles: (id: string, styles: Partial<BlockStyles>) => void;
    setBlockStyles: (id: string, styles: BlockStyles) => void;
    removeBlock: (id: string) => void;
    duplicateBlock: (id: string) => void;
    reorderBlocks: (startIndex: number, endIndex: number, parentId?: string | null) => void;
    moveBlock: (activeId: string, targetParentId: string | null, targetIndex?: number) => void;

    // Queries
    findBlock: (id: string) => Block | null;
    findParent: (id: string) => { parent: Block | null; index: number } | null;

    // Page Settings manipulation
    updatePageSettings: (settings: Partial<import('@/types/builder').PageSettings>) => void;

    // History actions
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
}

const DEFAULT_AST: PageAst = {
    version: 1,
    settings: {
        primaryColor: '#16a34a',
        fontFamily: 'Inter',
        containerMaxWidth: '1200px',
    },
    blocks: [],
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
    ast: DEFAULT_AST,
    selectedBlockId: null,
    viewport: 'desktop',
    availableProducts: [],
    history: [DEFAULT_AST],
    historyIndex: 0,

    setAvailableProducts: (products: Product[]) => set({ availableProducts: products }),

    setAst: (ast: PageAst) => {
        set({
            ast,
            history: [ast],
            historyIndex: 0,
            selectedBlockId: null,
        });
    },

    setSelectedBlockId: (id: string | null) => {
        set({ selectedBlockId: id });
    },

    setViewport: (viewport: ViewportMode) => {
        set({ viewport });
    },

    addBlock: (block: Block, parentId?: string | null, index?: number) => {
        const { ast, history, historyIndex } = get();
        const newBlocks = addBlockToTree(ast.blocks, block, parentId, index);

        const newAst: PageAst = { ...ast, blocks: newBlocks };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAst);

        set({
            ast: newAst,
            selectedBlockId: block.id,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    addBlocks: (blocks: Block[], parentId?: string | null) => {
        if (blocks.length === 0) return;

        const { ast, history, historyIndex } = get();
        const usedIds = collectBlockIds(ast.blocks);
        const normalizedBlocks = blocks.map((block) => cloneBlockWithUniqueId(block, usedIds));

        const targetParent = parentId ? findBlockInTree(ast.blocks, parentId) : null;
        const isNestedLayout =
            targetParent?.type === 'ContainerBlock' || targetParent?.type === 'GridBlock';
        const newBlocks = isNestedLayout
            ? addBlocksToTree(ast.blocks, normalizedBlocks, targetParent.id)
            : [...ast.blocks, ...normalizedBlocks];

        const newAst: PageAst = { ...ast, blocks: newBlocks };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAst);

        set({
            ast: newAst,
            selectedBlockId: normalizedBlocks[0]?.id ?? null,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    updateBlockProps: (id: string, props: Partial<BlockProps>) => {
        const { ast, history, historyIndex } = get();
        const newBlocks = updateBlockPropsInTree(ast.blocks, id, props);

        const newAst: PageAst = { ...ast, blocks: newBlocks };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAst);

        set({
            ast: newAst,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    updateBlockStyles: (id: string, styles: Partial<BlockStyles>) => {
        const { ast, history, historyIndex } = get();
        const newBlocks = updateBlockStylesInTree(ast.blocks, id, styles);

        const newAst: PageAst = { ...ast, blocks: newBlocks };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAst);

        set({
            ast: newAst,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    setBlockStyles: (id: string, styles: BlockStyles) => {
        const { ast, history, historyIndex } = get();
        const newBlocks = setBlockStylesInTree(ast.blocks, id, styles);

        const newAst: PageAst = { ...ast, blocks: newBlocks };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAst);

        set({
            ast: newAst,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    updatePageSettings: (settings: Partial<import('@/types/builder').PageSettings>) => {
        const { ast, history, historyIndex } = get();
        const newSettings = { ...(ast.settings || {}), ...settings };
        const newAst: PageAst = { ...ast, settings: newSettings };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAst);

        set({
            ast: newAst,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    removeBlock: (id: string) => {
        const { ast, history, historyIndex, selectedBlockId } = get();
        const newBlocks = removeBlockFromTree(ast.blocks, id);

        const newAst: PageAst = { ...ast, blocks: newBlocks };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAst);

        set({
            ast: newAst,
            selectedBlockId: selectedBlockId === id ? null : selectedBlockId,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    duplicateBlock: (id: string) => {
        const { ast, history, historyIndex } = get();
        const target = findBlockInTree(ast.blocks, id);
        const location = findParentInTree(ast.blocks, id);
        if (!target || !location) return;

        const cloned = cloneBlockWithFreshIds(target);
        const newBlocks = addBlockToTree(
            ast.blocks,
            cloned,
            location.parent ? location.parent.id : null,
            location.index + 1
        );

        const newAst: PageAst = { ...ast, blocks: newBlocks };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAst);

        set({
            ast: newAst,
            selectedBlockId: cloned.id,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    reorderBlocks: (startIndex: number, endIndex: number, parentId?: string | null) => {
        const { ast, history, historyIndex } = get();
        const newBlocks = reorderBlocksInTree(ast.blocks, startIndex, endIndex, parentId);

        const newAst: PageAst = { ...ast, blocks: newBlocks };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAst);

        set({
            ast: newAst,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    moveBlock: (activeId: string, targetParentId: string | null, targetIndex?: number) => {
        const { ast, history, historyIndex } = get();
        const newBlocks = moveBlockInTree(ast.blocks, activeId, targetParentId, targetIndex);

        const newAst: PageAst = { ...ast, blocks: newBlocks };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAst);

        set({
            ast: newAst,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    findBlock: (id: string) => findBlockInTree(get().ast.blocks, id),
    findParent: (id: string) => findParentInTree(get().ast.blocks, id),

    undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
            const nextIndex = historyIndex - 1;
            set({
                ast: history[nextIndex],
                historyIndex: nextIndex,
            });
        }
    },

    redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            set({
                ast: history[nextIndex],
                historyIndex: nextIndex,
            });
        }
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
}));
