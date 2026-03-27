import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vnscriptLanguage } from './vnscript';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { createTheme } from '@uiw/codemirror-themes';
import { autocompletion } from '@codemirror/autocomplete';

/**
 * Custom CodeMirror 6 theme to match the global CSS variables (dark gray palette).
 * Based on the app's --color-bg-* and --color-accent-* variables.
 */
const editorTheme = createTheme({
    theme: 'dark',
    settings: {
        background: '#1e2128',
        foreground: '#d0d0d0',
        caret: '#e9e3ff',
        selection: 'rgba(184, 169, 255, 0.18)',
        selectionMatch: 'rgba(184, 169, 255, 0.12)',
        lineHighlight: 'rgba(255, 255, 255, 0.04)',
        gutterBackground: '#1a1d23',
        gutterForeground: '#5a5a5a',
        gutterBorder: 'transparent',
        gutterActiveForeground: '#b8a9ff',
    },
    styles: [
        { tag: tags.comment, color: '#6a737d' },
        { tag: tags.keyword, color: '#b8a9ff' },
        { tag: tags.string, color: '#a5d6a7' },
        { tag: tags.variableName, color: '#80cbc4' },
        { tag: tags.typeName, color: '#ffab91' },
        { tag: tags.number, color: '#f48fb1' },
        { tag: tags.meta, color: '#b8a9ff', fontWeight: 'bold' },
        { tag: tags.heading, color: '#e9e3ff', fontWeight: 'bold' },
        { tag: tags.strong, fontWeight: 'bold' },
        { tag: tags.emphasis, fontStyle: 'italic' },
    ],
});

/** font & line height customization */
const fontExtension = EditorView.theme({
    '&': {
        fontSize: '16px',
    },
    '.cm-content': {
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineHeight: '1.65',
    },
    '.cm-gutters': {
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: '14px',
    },
});

const CodeEditor = forwardRef(({ value, onChange }, ref) => {
    const editorRef = useRef(null);

    useImperativeHandle(ref, () => ({
        insertText: (text) => {
            if (editorRef.current?.view) {
                const view = editorRef.current.view;
                const selection = view.state.selection.main;
                
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

        // 1. Directive suggestions (starts with @)
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
                { label: '@char', type: 'keyword', apply: snippet('@char ', 0), detail: 'Declare character' },
                { label: '@bg', type: 'keyword', apply: snippet('@bg ""', -1), detail: 'Change background' },
                { label: '@bgm', type: 'keyword', apply: snippet('@bgm id=""', -1), detail: 'Play background music' },
                { label: '@sfx', type: 'keyword', apply: snippet('@sfx ""', -1), detail: 'Play sound effect' },
                { label: '@video', type: 'keyword', apply: snippet('@video src=""', -1), detail: 'Play video' },
                { label: '@decision', type: 'keyword', apply: snippet('@decision ""', -1), detail: 'Choice menu' },
                { label: '@response', type: 'keyword', apply: snippet('@response ', 0), detail: 'Choice response' },
                { label: '@section', type: 'keyword', detail: 'Break into chunks' },
                { label: '@nickname', type: 'variable', detail: 'Shorthand for player name' },
            ];
            return {
                from: word.from,
                options: options.filter(o => o.label.startsWith(word.text))
            };
        }

        // 2. Asset ID suggestions (inside quotes after specific params)
        const assetMatch = textBefore.match(/(?:id|src|image|loop|intro|at)\s*=\s*"([^"]*)$/);
        const bgRawMatch = textBefore.match(/@bg\s+"([^"]*)$/);
        const sfxRawMatch = textBefore.match(/@sfx\s+"([^"]*)"\s+src="([^"]*)$/);

        if (assetMatch || bgRawMatch || sfxRawMatch) {
            const currentWord = context.matchBefore(/[\w]*/);
            return {
                from: currentWord.from,
                options: (assets || []).map(a => ({
                    label: a.asset_id,
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

        // 4. Character IDs (after @char or at start of line for dialogue)
        if (textBefore.match(/^@char\s+\S+\s+id\s*=\s*"/) || textBefore.match(/^[^:]*$/)) {
             return {
                from: word.from,
                options: (characters || []).map(c => ({
                    label: c.character_id,
                    type: 'variable',
                    detail: c.name
                }))
            };
        }

        return null;
    };

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <CodeMirror
                ref={editorRef}
                value={value}
                height="100%"
                theme={editorTheme}
                extensions={[
                    vnscriptLanguage, 
                    fontExtension,
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
                style={{ height: 'calc(100vh - 120px)' }}
            />
        </div>
    );
});

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;
