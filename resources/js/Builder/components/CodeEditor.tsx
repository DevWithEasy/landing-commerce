import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { HighlightStyle, bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { EditorState, type Extension } from '@codemirror/state';
import {
    EditorView,
    crosshairCursor,
    drawSelection,
    dropCursor,
    highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    placeholder,
    rectangularSelection,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { useEffect, useRef } from 'react';

export type CodeEditorLanguage = 'html' | 'css';

export interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: CodeEditorLanguage;
    ariaLabel: string;
    placeholder?: string;
}

const editorTheme = EditorView.theme(
    {
        '&': {
            backgroundColor: '#0f172a',
            color: '#e2e8f0',
            fontSize: '12px',
            borderRadius: '0.5rem',
            border: '1px solid #334155',
            minHeight: '220px',
            maxHeight: '420px',
        },
        '&.cm-focused': {
            outline: 'none',
            borderColor: '#10b981',
        },
        '.cm-scroller': {
            overflow: 'auto',
            fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineHeight: '1.65',
        },
        '.cm-content': {
            padding: '10px 0',
            caretColor: '#34d399',
        },
        '.cm-gutters': {
            backgroundColor: '#0b1220',
            color: '#64748b',
            border: 'none',
        },
        '.cm-activeLine': {
            backgroundColor: 'rgba(148, 163, 184, 0.08)',
        },
        '.cm-activeLineGutter': {
            backgroundColor: 'rgba(148, 163, 184, 0.12)',
        },
        '.cm-selectionBackground, .cm-content ::selection': {
            backgroundColor: 'rgba(16, 185, 129, 0.22)',
        },
        '.cm-cursor': {
            borderLeftColor: '#34d399',
        },
        '.cm-placeholder': {
            color: '#64748b',
        },
    },
    { dark: true }
);

const highlightStyle = HighlightStyle.define([
    { tag: tags.comment, color: '#64748b', fontStyle: 'italic' },
    { tag: [tags.tagName, tags.angleBracket], color: '#f472b6' },
    { tag: tags.attributeName, color: '#93c5fd' },
    { tag: [tags.attributeValue, tags.string], color: '#86efac' },
    { tag: tags.propertyName, color: '#93c5fd' },
    { tag: [tags.number, tags.unit], color: '#fbbf24' },
    { tag: [tags.keyword, tags.atom], color: '#c084fc' },
    { tag: tags.variableName, color: '#e2e8f0' },
    { tag: [tags.punctuation, tags.separator], color: '#94a3b8' },
    { tag: tags.heading, color: '#fbbf24', fontWeight: 'bold' },
    { tag: tags.invalid, color: '#f87171' },
]);

function languageExtension(language: CodeEditorLanguage): Extension {
    return language === 'css' ? css() : html();
}

export function CodeEditor({ value, onChange, language, ariaLabel, placeholder: placeholderText = '' }: CodeEditorProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    const valueRef = useRef(value);
    const lastEmittedValueRef = useRef(value);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const state = EditorState.create({
            doc: valueRef.current,
            extensions: [
                lineNumbers(),
                highlightActiveLineGutter(),
                highlightSpecialChars(),
                history(),
                drawSelection(),
                dropCursor(),
                EditorState.allowMultipleSelections.of(true),
                EditorState.tabSize.of(2),
                indentOnInput(),
                bracketMatching(),
                rectangularSelection(),
                crosshairCursor(),
                highlightActiveLine(),
                keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
                languageExtension(language),
                syntaxHighlighting(highlightStyle),
                EditorView.lineWrapping,
                EditorView.contentAttributes.of({
                    'aria-label': ariaLabel,
                    spellcheck: 'false',
                }),
                EditorView.updateListener.of((update) => {
                    if (!update.docChanged) {
                        return;
                    }

                    const nextValue = update.state.doc.toString();
                    lastEmittedValueRef.current = nextValue;
                    onChangeRef.current(nextValue);
                }),
                placeholder(placeholderText),
                editorTheme,
            ],
        });

        const view = new EditorView({ state, parent: container });
        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, [ariaLabel, language, placeholderText]);

    useEffect(() => {
        const view = viewRef.current;

        if (!view) {
            return;
        }

        const currentValue = view.state.doc.toString();

        if (value !== currentValue && value !== lastEmittedValueRef.current) {
            view.dispatch({
                changes: {
                    from: 0,
                    to: currentValue.length,
                    insert: value,
                },
            });
            lastEmittedValueRef.current = value;
        }
    }, [value]);

    return <div ref={containerRef} className="overflow-hidden rounded-lg" data-code-editor={language} />;
}
