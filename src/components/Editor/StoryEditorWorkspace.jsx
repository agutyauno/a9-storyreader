import React from 'react';
import EditorToolbar from './EditorToolbar';
import CodeEditor from './CodeEditor';
import StoryRenderer from '../StoryPage/StoryRenderer';
import { Loader } from 'lucide-react';
import styles from '../../pages/EditorPage.module.css';

/**
 * Shared workspace UI for all story-based editors.
 * Renders: EditorToolbar + CodeEditor (center) + Live Preview (right).
 * Does NOT include sidebar, header, or modals — those are provided by the parent editor.
 */
export default function StoryEditorWorkspace({
  scriptText,
  onScriptChange,
  editorRef,
  onInsertTemplate,
  previewData,
  previewLoading,
  previewWidth,
  isPreviewVisible,
  onPreviewResize,
  characters,
  eventCharacters,
  assets,
  loading,
}) {
  return (
    <>
      {/* ── Editor Column (Toolbar + Code) ──────────────────────────── */}
      <div className={styles.editorColumn}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e2128' }}>
            <Loader size={48} className={styles.spinner} />
          </div>
        ) : (
          <>
            <EditorToolbar onInsert={onInsertTemplate} />
            <div className={styles.editorArea}>
              <CodeEditor
                ref={editorRef}
                value={scriptText}
                onChange={onScriptChange}
                characters={characters}
                eventCharacters={eventCharacters}
                assets={assets}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Preview Column ──────────────────────────────────────────── */}
      {isPreviewVisible && !loading && (
        <div className={styles.previewWrapper} style={{ width: previewWidth }}>
          <div
            className={`${styles.resizer} ${styles.resizerLeft}`}
            onMouseDown={onPreviewResize}
          />
          <div className={styles.previewColumn} style={{ width: '100%' }}>
            <div className={styles.previewHeader}>
              <div className={styles.previewHeaderLeft}>
                <span className={styles.previewDot} style={previewLoading ? { background: 'var(--color-warning, #f59e0b)' } : {}} />
                <span className={styles.previewLabel}>
                  {previewLoading ? 'Parsing...' : 'Live Preview'}
                </span>
              </div>
            </div>
            <div className={styles.previewBody}>
              {previewData?.story_content ? (
                <StoryRenderer previewData={previewData} isPreviewMode={true} />
              ) : (
                <div className={styles.previewPlaceholder} style={{ background: '#000' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
