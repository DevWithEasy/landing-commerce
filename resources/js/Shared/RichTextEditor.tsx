import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Code2,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Minus,
    Quote,
    Redo,
    RemoveFormatting,
    Strikethrough,
    Underline,
    Undo,
    Unlink,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type FormEvent,
    type KeyboardEvent,
} from 'react';

export interface RichTextEditorProps {
    value?: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
    error?: string;
    id?: string;
    label?: string;
    required?: boolean;
    className?: string;
}

export function RichTextEditor({
    value = '',
    onChange,
    placeholder = 'Start typing your content here...',
    minHeight = '220px',
    error,
    id,
    label,
    required = false,
    className = '',
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(false);
    const [isSourceMode, setIsSourceMode] = useState(false);
    const [sourceContent, setSourceContent] = useState(value);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        insertUnorderedList: false,
        insertOrderedList: false,
        justifyLeft: false,
        justifyCenter: false,
        justifyRight: false,
        justifyFull: false,
    });

    // Sync external value to editor without losing cursor position
    useEffect(() => {
        if (!editorRef.current) return;
        const currentHtml = editorRef.current.innerHTML;
        const nextHtml = value || '';

        // Only sync if content actually differs and editor is not actively being typed in
        if (currentHtml !== nextHtml && document.activeElement !== editorRef.current) {
            editorRef.current.innerHTML = nextHtml;
        }
        setSourceContent(nextHtml);
        isMounted.current = true;
    }, [value]);

    // Update active format states based on current selection
    const updateActiveFormats = useCallback(() => {
        if (!editorRef.current || isSourceMode) return;
        try {
            setActiveFormats({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                strikeThrough: document.queryCommandState('strikeThrough'),
                insertUnorderedList: document.queryCommandState('insertUnorderedList'),
                insertOrderedList: document.queryCommandState('insertOrderedList'),
                justifyLeft: document.queryCommandState('justifyLeft'),
                justifyCenter: document.queryCommandState('justifyCenter'),
                justifyRight: document.queryCommandState('justifyRight'),
                justifyFull: document.queryCommandState('justifyFull'),
            });
        } catch {
            // Silently handle if queryCommandState is unsupported in environment
        }
    }, [isSourceMode]);

    // Execute standard formatting commands
    const exec = (command: string, val: string | null = null) => {
        if (isSourceMode) return;
        if (editorRef.current) {
            editorRef.current.focus();
        }
        document.execCommand(command, false, val ?? undefined);
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            onChange(html);
            setSourceContent(html);
        }
        updateActiveFormats();
    };

    // Format heading or paragraph block
    const handleBlockFormat = (tag: string) => {
        if (isSourceMode) return;
        exec('formatBlock', tag ? `<${tag}>` : '<p>');
    };

    // Handle Link insertion
    const handleInsertLink = () => {
        if (isSourceMode) return;
        const existingUrl = '';
        const url = window.prompt('Enter link URL (e.g. https://example.com):', existingUrl);
        if (url !== null) {
            const trimmed = url.trim();
            if (trimmed) {
                const formattedUrl = trimmed.match(/^https?:\/\//i) || trimmed.startsWith('/')
                    ? trimmed
                    : `https://${trimmed}`;
                exec('createLink', formattedUrl);
            } else {
                exec('unlink');
            }
        }
    };

    // Handle content changes in WYSIWYG mode
    const handleInput = () => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        onChange(html);
        setSourceContent(html);
        updateActiveFormats();
    };

    // Handle content changes in raw HTML source mode
    const handleSourceChange = (e: FormEvent<HTMLTextAreaElement>) => {
        const newHtml = e.currentTarget.value;
        setSourceContent(newHtml);
        onChange(newHtml);
        if (editorRef.current) {
            editorRef.current.innerHTML = newHtml;
        }
    };

    // Toggle between visual WYSIWYG and HTML source view
    const toggleSourceMode = () => {
        if (isSourceMode) {
            // Switching from Source to Visual
            if (editorRef.current) {
                editorRef.current.innerHTML = sourceContent;
            }
            setIsSourceMode(false);
            setTimeout(() => {
                editorRef.current?.focus();
                updateActiveFormats();
            }, 50);
        } else {
            // Switching from Visual to Source
            if (editorRef.current) {
                setSourceContent(editorRef.current.innerHTML);
            }
            setIsSourceMode(true);
        }
    };

    // Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Tab)
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            exec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
        }
    };

    const isEditorEmpty = !value || value.trim() === '' || value === '<p><br></p>' || value === '<br>';

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <div className="flex items-center justify-between mb-1.5">
                    <label
                        htmlFor={id}
                        className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                        {label} {required && <span className="text-rose-600">*</span>}
                    </label>
                    <span className="text-[11px] text-gray-400">
                        {isSourceMode ? 'HTML Source Mode' : 'Visual Rich Editor'}
                    </span>
                </div>
            )}

            <div
                className={`border rounded-xl bg-white shadow-2xs overflow-hidden transition ${
                    error
                        ? 'border-rose-400 ring-2 ring-rose-100'
                        : 'border-gray-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100'
                }`}
            >
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/90 border-b border-gray-200 text-gray-700 select-none">
                    {/* Block Formatter (Headings / Paragraph) */}
                    <select
                        onChange={(e) => handleBlockFormat(e.target.value)}
                        disabled={isSourceMode}
                        defaultValue="p"
                        className="text-xs h-8 py-1 px-2 border border-gray-300 bg-white rounded-lg font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        title="Text Format"
                    >
                        <option value="p">Paragraph</option>
                        <option value="h1">Heading 1</option>
                        <option value="h2">Heading 2</option>
                        <option value="h3">Heading 3</option>
                        <option value="h4">Heading 4</option>
                        <option value="blockquote">Quote Block</option>
                        <option value="pre">Code Block</option>
                    </select>

                    <div className="w-px h-5 bg-gray-300 mx-1" />

                    {/* Inline Formats */}
                    <button
                        type="button"
                        onClick={() => exec('bold')}
                        disabled={isSourceMode}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            activeFormats.bold
                                ? 'bg-indigo-100 text-indigo-700 shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40'
                        }`}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('italic')}
                        disabled={isSourceMode}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            activeFormats.italic
                                ? 'bg-indigo-100 text-indigo-700 shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40'
                        }`}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('underline')}
                        disabled={isSourceMode}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            activeFormats.underline
                                ? 'bg-indigo-100 text-indigo-700 shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40'
                        }`}
                        title="Underline (Ctrl+U)"
                    >
                        <Underline className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('strikeThrough')}
                        disabled={isSourceMode}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            activeFormats.strikeThrough
                                ? 'bg-indigo-100 text-indigo-700 shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40'
                        }`}
                        title="Strikethrough"
                    >
                        <Strikethrough className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-gray-300 mx-1" />

                    {/* Lists */}
                    <button
                        type="button"
                        onClick={() => exec('insertUnorderedList')}
                        disabled={isSourceMode}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            activeFormats.insertUnorderedList
                                ? 'bg-indigo-100 text-indigo-700 shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40'
                        }`}
                        title="Bullet List"
                    >
                        <List className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('insertOrderedList')}
                        disabled={isSourceMode}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            activeFormats.insertOrderedList
                                ? 'bg-indigo-100 text-indigo-700 shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40'
                        }`}
                        title="Numbered List"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-gray-300 mx-1" />

                    {/* Text Alignment */}
                    <button
                        type="button"
                        onClick={() => exec('justifyLeft')}
                        disabled={isSourceMode}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            activeFormats.justifyLeft
                                ? 'bg-indigo-100 text-indigo-700 shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40'
                        }`}
                        title="Align Left"
                    >
                        <AlignLeft className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('justifyCenter')}
                        disabled={isSourceMode}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            activeFormats.justifyCenter
                                ? 'bg-indigo-100 text-indigo-700 shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40'
                        }`}
                        title="Align Center"
                    >
                        <AlignCenter className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('justifyRight')}
                        disabled={isSourceMode}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            activeFormats.justifyRight
                                ? 'bg-indigo-100 text-indigo-700 shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40'
                        }`}
                        title="Align Right"
                    >
                        <AlignRight className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('justifyFull')}
                        disabled={isSourceMode}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                            activeFormats.justifyFull
                                ? 'bg-indigo-100 text-indigo-700 shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40'
                        }`}
                        title="Justify"
                    >
                        <AlignJustify className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-gray-300 mx-1" />

                    {/* Inserts: Link, Quote, Divider */}
                    <button
                        type="button"
                        onClick={handleInsertLink}
                        disabled={isSourceMode}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40 transition"
                        title="Insert / Edit Link"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('unlink')}
                        disabled={isSourceMode}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40 transition"
                        title="Remove Link"
                    >
                        <Unlink className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('formatBlock', '<blockquote>')}
                        disabled={isSourceMode}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40 transition"
                        title="Quote"
                    >
                        <Quote className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('insertHorizontalRule')}
                        disabled={isSourceMode}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40 transition"
                        title="Horizontal Rule"
                    >
                        <Minus className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('removeFormat')}
                        disabled={isSourceMode}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40 transition"
                        title="Clear Formatting"
                    >
                        <RemoveFormatting className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-gray-300 mx-1" />

                    {/* Undo / Redo */}
                    <button
                        type="button"
                        onClick={() => exec('undo')}
                        disabled={isSourceMode}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40 transition"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => exec('redo')}
                        disabled={isSourceMode}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-40 transition"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="w-4 h-4" />
                    </button>

                    {/* Source / HTML Toggle Button (Pushed to Right) */}
                    <div className="ml-auto flex items-center gap-1">
                        <button
                            type="button"
                            onClick={toggleSourceMode}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                isSourceMode
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                            title={isSourceMode ? 'Switch to Visual Editor' : 'Switch to HTML Code Editor'}
                        >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>{isSourceMode ? 'Visual' : 'HTML'}</span>
                        </button>
                    </div>
                </div>

                {/* Editor Content Area */}
                <div className="relative">
                    {/* Visual ContentEditable Mode */}
                    <div
                        ref={editorRef}
                        contentEditable={!isSourceMode}
                        onInput={handleInput}
                        onKeyUp={updateActiveFormats}
                        onMouseUp={updateActiveFormats}
                        onKeyDown={handleKeyDown}
                        style={{ minHeight, display: isSourceMode ? 'none' : 'block' }}
                        className="p-4 text-sm text-gray-800 leading-relaxed focus:outline-none overflow-y-auto prose prose-indigo max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-blockquote:my-2"
                        role="textbox"
                        aria-multiline="true"
                        aria-label={label || 'Rich text content'}
                    />

                    {/* Placeholder when visual editor is empty */}
                    {!isSourceMode && isEditorEmpty && (
                        <div
                            onClick={() => editorRef.current?.focus()}
                            className="absolute top-4 left-4 text-sm text-gray-400 pointer-events-none select-none"
                        >
                            {placeholder}
                        </div>
                    )}

                    {/* HTML Source Textarea Mode */}
                    {isSourceMode && (
                        <textarea
                            value={sourceContent}
                            onChange={handleSourceChange}
                            style={{ minHeight }}
                            placeholder="<p>Write raw HTML here...</p>"
                            className="w-full p-4 text-xs font-mono text-gray-800 leading-relaxed bg-slate-900 text-emerald-400 border-none focus:ring-0 focus:outline-none resize-y"
                            spellCheck={false}
                        />
                    )}
                </div>
            </div>

            {error && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                    {error}
                </p>
            )}
        </div>
    );
}

export default RichTextEditor;
