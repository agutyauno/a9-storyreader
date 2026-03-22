import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vnscriptLanguage } from './vnscript';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { createTheme } from '@uiw/codemirror-themes';

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
        fontSize: '14px',
    },
    '.cm-content': {
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineHeight: '1.65',
    },
    '.cm-gutters': {
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: '12px',
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

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <CodeMirror
                ref={editorRef}
                value={value}
                height="100%"
                theme={editorTheme}
                extensions={[vnscriptLanguage, fontExtension]}
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
