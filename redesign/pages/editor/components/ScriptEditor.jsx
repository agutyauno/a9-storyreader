import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vnscriptLanguage } from './vnscript';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';
import { autocompletion } from '@codemirror/autocomplete';

/**
 * Custom CodeMirror 6 theme tailored to the CED Redesign
 * palette (cream background, charcoal text, terracotta/ochre highlights).
 */
/**
 * Light theme matching Warm Cream CED Redesign styles
 */
const lightEditorTheme = createTheme({
    theme: 'light',
    settings: {
        background: '#FAF6EC', // Warm cream background
        foreground: '#181818', // Charcoal
        caret: '#B2653B',      // Terracotta
        selection: 'rgba(178, 101, 59, 0.12)', // Terracotta transparent
        selectionMatch: 'rgba(178, 101, 59, 0.08)',
        lineHighlight: 'rgba(178, 101, 59, 0.04)',
        gutterBackground: '#F4EEDA', // Slightly darker warm cream for gutters
        gutterForeground: '#8C8578', // Muted gold/brown
        gutterBorder: 'transparent',
        gutterActiveForeground: '#B2653B',
    },
    styles: [
        { tag: tags.comment, color: '#5C7F71', fontStyle: 'italic' }, // Sage Green
        { tag: tags.keyword, color: '#802520', fontWeight: 'bold' },  // Crimson
        { tag: tags.string, color: '#3A6050' },                       // Darker Sage
        { tag: tags.variableName, color: '#B2653B', fontWeight: 'bold' }, // Terracotta
        { tag: tags.propertyName, color: '#BA8530' },                 // Ochre
        { tag: tags.typeName, color: '#802520' },
        { tag: tags.number, color: '#BA8530' },
        { tag: tags.meta, color: '#B2653B' },
        { tag: tags.heading, color: '#802520', fontWeight: 'bold' },
        { tag: tags.strong, fontWeight: 'bold' },
        { tag: tags.emphasis, fontStyle: 'italic' },
    ],
});

/**
 * Dark theme matching Charcoal CED Redesign styles
 */
const darkEditorTheme = createTheme({
    theme: 'dark',
    settings: {
        background: '#1A1A1A',
        foreground: '#F5EDDC',
        caret: '#B2653B',
        selection: 'rgba(178, 101, 59, 0.3)',
        selectionMatch: 'rgba(178, 101, 59, 0.2)',
        lineHighlight: 'rgba(255, 255, 255, 0.04)',
        gutterBackground: '#121212',
        gutterForeground: '#8C8578',
        gutterBorder: 'transparent',
        gutterActiveForeground: '#B2653B',
    },
    styles: [
        { tag: tags.comment, color: '#7E877F', fontStyle: 'italic' },
        { tag: tags.keyword, color: '#f87171', fontWeight: 'bold' },
        { tag: tags.string, color: '#a7f3d0' },
        { tag: tags.variableName, color: '#fb923c', fontWeight: 'bold' },
        { tag: tags.propertyName, color: '#fde047' },
        { tag: tags.typeName, color: '#f87171' },
        { tag: tags.number, color: '#fde047' },
        { tag: tags.meta, color: '#B2653B' },
        { tag: tags.heading, color: '#f87171', fontWeight: 'bold' },
        { tag: tags.strong, fontWeight: 'bold' },
        { tag: tags.emphasis, fontStyle: 'italic' },
    ],
});

/** Font styling mapping */
const fontExtension = EditorView.theme({
    '&': {
        fontSize: '15px',
        border: 'none',
        outline: 'none',
    },
    '&.cm-focused': {
        outline: 'none',
    },
    '.cm-content': {
        fontFamily: "'Source Code Pro', Consolas, Monaco, monospace",
        lineHeight: '1.6',
        padding: '1rem 0',
    },
    '.cm-gutters': {
        fontFamily: "'Source Code Pro', monospace",
        fontSize: '13px',
        borderRight: '1px solid var(--border-thin)',
        paddingRight: '4px',
    },
});

const ScriptEditor = forwardRef(({ value, onChange, characters = [], assets = [], eventCharacters = [], height = "calc(100vh - 200px)", theme = "light" }, ref) => {
    const editorRef = useRef(null);
    const activeTheme = theme === 'dark' ? darkEditorTheme : lightEditorTheme;

    useImperativeHandle(ref, () => ({
        insertText: (text, isInline = false) => {
            if (editorRef.current?.view) {
                const view = editorRef.current.view;
                const selection = view.state.selection.main;
                
                if (isInline) {
                    view.dispatch({
                        changes: {
                            from: selection.from,
                            to: selection.to,
                            insert: text
                        },
                        selection: { anchor: selection.from + text.length }
                    });
                } else {
                    const line = view.state.doc.lineAt(selection.head);
                    const prefix = line.text.trim().length > 0 ? '\n' : '';
                    const insertion = prefix + text + '\n';
                    
                    view.dispatch({
                        changes: {
                            from: selection.from,
                            to: selection.to,
                            insert: insertion
                        },
                        selection: { anchor: selection.from + insertion.length }
                    });
                }
                view.focus();
            }
        }
    }));

    const vnscriptCompletionSource = (context) => {
        const word = context.matchBefore(/[@\w]*/);
        if (!word || (word.from === word.to && !context.explicit)) return null;

        const line = context.state.doc.lineAt(context.pos);
        const lineText = line.text;
        const textBefore = lineText.slice(0, context.pos - line.from);

        // Extract translator notes from document
        const docText = context.state.doc.toString();
        const noteIds = [];
        const noteRegex = /^@note\s+([^:]+):/gm;
        let noteMatch;
        while ((noteMatch = noteRegex.exec(docText)) !== null) {
            noteIds.push(noteMatch[1].trim());
        }

        // 1. Directive keywords
        if (word.text.startsWith('@')) {
            const snippet = (text, offset = 0) => (view, completion, from, to) => {
                const insert = typeof text === 'function' ? text(completion) : text;
                view.dispatch({
                    changes: { from, to, insert },
                    selection: { anchor: from + insert.length + offset },
                    scrollIntoView: true
                });
            };

            const options = [
                { label: '@char', type: 'keyword', apply: snippet('@char Name [id="", color=""]', -20), detail: 'Declare character' },
                { label: '@narrator', type: 'keyword', apply: snippet('@narrator {\n  \n}', -2), detail: 'Multi-line narrator' },
                { label: '@bg', type: 'keyword', apply: snippet('@bg ""', -1), detail: 'Change background' },
                { label: '@bgm', type: 'keyword', apply: snippet('@bgm id=""', -1), detail: 'Play background music' },
                { label: '@sfx', type: 'keyword', apply: snippet('@sfx ""', -1), detail: 'Play sound effect' },
                { label: '@video', type: 'keyword', apply: snippet('@video src=""', -1), detail: 'Play video' },
                { label: '@decision', type: 'keyword', apply: snippet('@decision ""', -1), detail: 'Choice menu' },
                { label: '@response', type: 'keyword', apply: snippet('@response "" 1 {\n  \n}', -2), detail: 'Choice response group' },
                { label: '@note', type: 'keyword', apply: snippet('@note id: content', -11), detail: 'Declare translator note' },
                { label: '@section', type: 'keyword', detail: 'Break into chunks' },
            ];
            return {
                from: word.from,
                options: options.filter(o => o.label.startsWith(word.text))
            };
        }

        // 2. Assets suggestions
        const assetMatch = textBefore.match(/(?:id|src|image|loop|intro|at)\s*=\s*"([^"]*)$/);
        const bgRawMatch = textBefore.match(/@bg\s+"([^"]*)$/);
        const sfxRawMatch = textBefore.match(/@sfx\s+"([^"]*)"\s+src="([^"]*)$/);

        if (assetMatch || bgRawMatch || sfxRawMatch) {
            const currentWord = context.matchBefore(/[\w]*/);
            return {
                from: currentWord.from,
                options: (assets || []).map(a => ({
                    label: a.asset_id || a.id || '',
                    type: 'constant',
                    detail: a.category || a.type
                }))
            };
        }

        // 3. Expressions (inside brackets)
        if (textBefore.match(/\[\s*[\w, ]*$/)) {
            const currentWord = context.matchBefore(/[\w]*/);
            return {
                from: currentWord.from,
                options: [
                    { label: 'default', type: 'property' },
                    { label: 'smile', type: 'property' },
                    { label: 'angry', type: 'property' },
                    { label: 'serious', type: 'property' },
                    { label: 'sad', type: 'property' },
                    { label: 'happy', type: 'property' },
                    { label: 'surprised', type: 'property' },
                ]
            };
        }

        // 4. Translator Note references
        if (textBefore.match(/\[[^|\]]*\|\s*[\w]*$/)) {
            const currentWord = context.matchBefore(/[\w]*/);
            return {
                from: currentWord.from,
                options: noteIds.map(id => ({
                    label: id,
                    type: 'constant',
                    detail: 'Translator Note'
                }))
            };
        }

        // 5. Character names
        if (textBefore.match(/^@char\s+\S+\s+\[?\s*id\s*=\s*"/) || textBefore.match(/^[^:]*$/)) {
            const eventCharIds = new Set((eventCharacters || []).map(ec => ec.character_id));
            const sortedCharacters = [...(characters || [])].sort((a, b) => {
                const aIsEvent = eventCharIds.has(a.character_id);
                const bIsEvent = eventCharIds.has(b.character_id);
                if (aIsEvent && !bIsEvent) return -1;
                if (!aIsEvent && bIsEvent) return 1;
                return 0;
            });

            return {
                from: word.from,
                options: sortedCharacters.map(c => ({
                    label: c.character_id || c.id || '',
                    type: eventCharIds.has(c.character_id) ? 'variable' : 'type',
                    detail: `${eventCharIds.has(c.character_id) ? '★ ' : ''}${c.name}`,
                    boost: eventCharIds.has(c.character_id) ? 100 : 0
                }))
            };
        }

        return null;
    };

    return (
        <div className="script-editor-wrapper" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <CodeMirror
                ref={editorRef}
                value={value}
                height="100%"
                theme={activeTheme}
                extensions={[
                    vnscriptLanguage,
                    fontExtension,
                    EditorView.lineWrapping,
                    autocompletion({ override: [vnscriptCompletionSource] })
                ]}
                onChange={onChange}
                basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightSpecialChars: true,
                    history: true,
                    foldGutter: true,
                    drawSelection: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    syntaxHighlighting: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                }}
                style={{ height: height }}
            />
        </div>
    );
});

ScriptEditor.displayName = 'ScriptEditor';
export default ScriptEditor;
