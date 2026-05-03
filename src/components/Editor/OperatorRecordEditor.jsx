import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Save, Loader, PanelLeft, PanelRight, Home } from 'lucide-react';

import StoryEditorWorkspace from './StoryEditorWorkspace';
import AssetPanel from './AssetPanel';
import AssetPickerModal from './AssetPickerModal';
import UnsavedChangesModal from './UnsavedChangesModal';

import useStoryEditor from '../../hooks/useStoryEditor';
import { StoryScriptParser } from '../../utils/storyParser';
import { StoryScriptSerializer } from '../../utils/storySerializer';
import { SupabaseAPI } from '../../services/supabaseApi';

import styles from '../../pages/EditorPage.module.css';

/**
 * Operator Record Editor — A focused story editor for operator side-stories.
 * Uses the same StoryEditorWorkspace as GameStoryEditor but with an Asset-only sidebar.
 */
export default function OperatorRecordEditor({ showNotification }) {
    const navigate = useNavigate();
    const { recordId } = useParams();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [recordMeta, setRecordMeta] = useState({ name: '', description: '', operator_name: '' });

    // ── Shared editor logic ───────────────────────────────────────────────
    const editor = useStoryEditor({ title: recordMeta.name });

    const localNotify = (message, type = 'success') => {
        showNotification ? showNotification(message, type) : console.log(message);
    };

    // ── Unsaved Changes Modal ─────────────────────────────────────────────
    const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const confirmNavigation = (action) => {
        if (editor.isDirty) {
            setPendingAction(() => action);
            setUnsavedModalOpen(true);
        } else {
            action();
        }
    };

    // ── Update Page Title ─────────────────────────────────────────────────
    useEffect(() => {
        const prefix = editor.isDirty ? '* ' : '';
        document.title = `${prefix}Record: ${recordMeta.name || 'Untitled'} - Civilight Eterna Database`;
    }, [recordMeta.name, editor.isDirty]);

    // ── Load Record ───────────────────────────────────────────────────────
    useEffect(() => {
        async function loadRecord() {
            setError(null);
            if (!recordId) return;
            setLoading(true);
            try {
                const record = await SupabaseAPI.getOperatorRecord(recordId);
                if (!record) {
                    setError(`Record "${recordId}" not found.`);
                    return;
                }
                setRecordMeta({
                    name: record.name || '',
                    description: record.description || '',
                    operator_name: record.operator_name || '',
                });
                let text = '';
                if (record.story_content) {
                    if (record.story_content.type === 'vns') {
                        text = record.story_content.script || '';
                    } else if (typeof record.story_content === 'object') {
                        text = StoryScriptSerializer.serialize(record.story_content);
                    }
                }
                editor.setScriptText(text);
                editor.setInitialScript(text);
            } catch (err) {
                console.error('Failed to load record:', err);
                setError('Không thể tải dữ liệu record.');
            } finally {
                setLoading(false);
            }
        }
        loadRecord();
    }, [recordId]);

    // ── Save ──────────────────────────────────────────────────────────────
    const handleSave = async (silent = false) => {
        setSaving(true);
        try {
            await StoryScriptParser.parseWithDB(editor.scriptText, editor.charCacheMap, editor.assetCacheMap);
            const payload = {
                story_content: { type: 'vns', script: editor.scriptText },
            };
            await SupabaseAPI.updateOperatorRecord(recordId, payload);
            editor.setInitialScript(editor.scriptText);
            if (!silent) localNotify('Đã lưu ngoại truyện!', 'success');
            return true;
        } catch (err) {
            console.error('Save failed:', err);
            if (!silent) localNotify('Lưu thất bại: ' + (err.message || 'Lỗi hệ thống'), 'error');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAndConfirm = async () => {
        const success = await handleSave(true);
        if (success) {
            setUnsavedModalOpen(false);
            if (pendingAction) pendingAction();
        }
    };

    const handleConfirmDiscard = () => {
        setUnsavedModalOpen(false);
        if (pendingAction) pendingAction();
    };

    // ── Error Screen ──────────────────────────────────────────────────────
    if (error) {
        return (
            <div className={styles.editorPage} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--color-error, #f87171)', fontSize: 16 }}>{error}</p>
                <button className={styles.backBtn} onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
                    <ArrowLeft size={18} /> Quay lại
                </button>
            </div>
        );
    }

    return (
        <>
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className={styles.editorHeader}>
                <div className={styles.headerLeft}>
                    <button
                        onClick={() => confirmNavigation(() => navigate(-1))}
                        className={styles.backBtn}
                        title="Quay về Operator"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <button
                        onClick={editor.toggleSidebar}
                        className={`${styles.toggleBtn} ${editor.isSidebarVisible ? styles.active : ''}`}
                        title={editor.isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
                    >
                        <PanelLeft size={20} />
                    </button>
                    <h1 className={styles.headerTitle}>
                        {recordMeta.name || 'Ngoại Truyện'}
                        {editor.isDirty && <span className={styles.dirtyStar}>*</span>}
                        <span>Record</span>
                    </h1>
                </div>

                <div className={styles.headerRight}>
                    <button onClick={editor.handleOpenStandalonePreview} className={styles.btnSecondary}>
                        <ExternalLink size={16} />
                        <span className={styles.btnText}>Full Preview</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className={`${styles.btnPrimary} ${editor.isDirty ? styles.dirty : ''}`}
                        disabled={saving}
                    >
                        {saving
                            ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            : <Save size={16} />
                        }
                        <span className={styles.btnText}>{saving ? 'Đang lưu...' : 'Lưu'}</span>
                    </button>
                    <button
                        onClick={editor.togglePreview}
                        className={`${styles.toggleBtn} ${editor.isPreviewVisible ? styles.active : ''}`}
                        title={editor.isPreviewVisible ? "Hide Preview" : "Show Preview"}
                    >
                        <PanelRight size={20} />
                    </button>
                </div>
            </div>

            {/* ── Workspace ────────────────────────────────────────────── */}
            <div className={styles.workspace}>
                {/* Sidebar — Asset Only */}
                {editor.isSidebarVisible && (
                    <div className={styles.sidebarWrapper} style={{ width: editor.sidebarWidth }}>
                        <AssetPanel
                            onPickAsset={editor.openPicker}
                            showNotification={localNotify}
                        />
                        <div className={styles.resizer} onMouseDown={() => editor.setIsResizingSidebar(true)} />
                    </div>
                )}

                {/* Main Content — CodeEditor + Preview */}
                <StoryEditorWorkspace
                    scriptText={editor.scriptText}
                    onScriptChange={editor.setScriptText}
                    editorRef={editor.editorRef}
                    onInsertTemplate={editor.handleInsertTemplate}
                    previewData={editor.previewData}
                    previewLoading={editor.previewLoading}
                    previewWidth={editor.previewWidth}
                    isPreviewVisible={editor.isPreviewVisible}
                    onPreviewResize={() => editor.setIsResizingPreview(true)}
                    characters={editor.allCharacters}
                    eventCharacters={editor.eventCharacters}
                    assets={editor.allAssets}
                    loading={loading}
                />
            </div>

            {/* ── Modals ───────────────────────────────────────────────── */}
            <AssetPickerModal
                isOpen={editor.pickerOpen}
                filterType={editor.pickerOptions.filter}
                multiSelect={editor.pickerOptions.multi}
                onClose={() => editor.handlePickerSelect(null)}
                onSelect={editor.handlePickerSelect}
            />

            <UnsavedChangesModal
                isOpen={unsavedModalOpen}
                saving={saving}
                onConfirm={handleConfirmDiscard}
                onCancel={() => setUnsavedModalOpen(false)}
                onSaveAndConfirm={handleSaveAndConfirm}
            />
        </>
    );
}
