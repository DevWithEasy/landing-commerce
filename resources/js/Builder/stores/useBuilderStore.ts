import { create } from 'zustand';
import type { Product } from '@/types';
import type { Block, BlockProps, BlockStyles, PageAst } from '@/types/builder';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export interface BuilderState {
    // Current Page AST
    ast: PageAst;

    // Selection
    selectedBlockId: string | null;

    // Viewport Mode
    viewport: ViewportMode;

    // Available Products for previewing real items
    availableProducts: Product[];

    // History (Undo / Redo stacks)
    history: PageAst[];
    historyIndex: number;

    // Actions
    setAst: (ast: PageAst) => void;
    setSelectedBlockId: (id: string | null) => void;
    setViewport: (viewport: ViewportMode) => void;
    setAvailableProducts: (products: Product[]) => void;

    // Block manipulations
    addBlock: (block: Block, index?: number) => void;
    updateBlockProps: (id: string, props: Partial<BlockProps>) => void;
    updateBlockStyles: (id: string, styles: Partial<BlockStyles>) => void;
    removeBlock: (id: string) => void;
    reorderBlocks: (startIndex: number, endIndex: number) => void;

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

    addBlock: (block: Block, index?: number) => {
        const { ast, history, historyIndex } = get();
        const newBlocks = [...ast.blocks];

        if (typeof index === 'number' && index >= 0 && index <= newBlocks.length) {
            newBlocks.splice(index, 0, block);
        } else {
            newBlocks.push(block);
        }

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

    updateBlockProps: (id: string, props: Partial<BlockProps>) => {
        const { ast, history, historyIndex } = get();
        const newBlocks = ast.blocks.map((b) =>
            b.id === id ? { ...b, props: { ...b.props, ...props } } : b
        );

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
        const newBlocks = ast.blocks.map((b) =>
            b.id === id ? { ...b, styles: { ...b.styles, ...styles } } : b
        );

        const newAst: PageAst = { ...ast, blocks: newBlocks };
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
        const newBlocks = ast.blocks.filter((b) => b.id !== id);

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

    reorderBlocks: (startIndex: number, endIndex: number) => {
        const { ast, history, historyIndex } = get();
        const newBlocks = [...ast.blocks];
        const [moved] = newBlocks.splice(startIndex, 1);
        newBlocks.splice(endIndex, 0, moved);

        const newAst: PageAst = { ...ast, blocks: newBlocks };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAst);

        set({
            ast: newAst,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

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
