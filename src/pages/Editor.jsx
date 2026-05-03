import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation, Routes, Route, useMatch } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ArrowLeft, ExternalLink, Save, Loader, PanelLeft, PanelRight, Home } from 'lucide-react';

import EditorSidebar from '../components/Editor/EditorSidebar';
import StoryEditorWorkspace from '../components/Editor/StoryEditorWorkspace';
import SuggestionsManager from '../components/Editor/SuggestionsManager';
import EventCharactersManager from '../components/Editor/EventCharactersManager';
import EventGalleryManager from '../components/Editor/EventGalleryManager';
import AssetPickerModal from '../components/Editor/AssetPickerModal';
import AssetDetailModal from '../components/Editor/AssetDetailModal';
import AssetPreviewModal from '../components/Editor/AssetPreviewModal';
import NotificationToast from '../components/Editor/NotificationToast';
import UnsavedChangesModal from '../components/Editor/UnsavedChangesModal';

import EditorHub from '../components/Editor/EditorHub';
import OperatorManager from '../components/Editor/OperatorManager';
import OperatorRecordEditor from '../components/Editor/OperatorRecordEditor';

import useStoryEditor from '../hooks/useStoryEditor';
import { StoryScriptParser } from '../utils/storyParser';
import { StoryScriptSerializer } from '../utils/storySerializer';
import { SupabaseAPI } from '../services/supabaseApi';

import styles from './EditorPage.module.css';
const editorStyles = styles;

// =============================================================================
// Game Story Editor (refactored to use shared hook + workspace)
// =============================================================================
function GameStoryEditor({ showNotification }) {
    const navigate = useNavigate();
    const storyMatch = useMatch('/editor/game/:storyId');
    const storyId = storyMatch?.params?.storyId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [metadata, setMetadata] = useState({
        name: 'Untitled Draft',
        description: '',
        display_order: null,
        event_id: null,
        story_id: null,
    });

    // ── Shared editor logic (script, preview, panels, assets) ─────────────
    const editor = useStoryEditor({ title: metadata.name, eventId: metadata.event_id });

    const [notification, setNotification] = useState({ message: '', type: 'success' });
    const localNotify = (message, type = 'success') => {
        showNotification ? showNotification(message, type) : setNotification({ message, type });
    };

    // Asset Preview Modal (for EventCharactersManager / EventGalleryManager)
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewTarget, setPreviewTarget] = useState(null);
    const [previewKind, setPreviewKind] = useState('asset');

    const handlePreviewAsset = (item, kind) => {
        let target = item;
        if (kind === 'asset' && item.gallery_id) {
            target = { asset_id: item.gallery_id, url: item.image_url, title: item.title, type: 'image', category: 'gallery' };
        }
        setPreviewTarget(target);
        setPreviewKind(kind);
        setPreviewOpen(true);
    };

    // Asset Detail Modal
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailTarget, setDetailTarget] = useState(null);
    const [detailKind, setDetailKind] = useState('asset');

    const handleEditAsset = (item, kind) => {
        setDetailTarget(item);
        setDetailKind(kind);
        setDetailOpen(true);
    };

    const handleDetailUpdate = () => {
        sidebarReloadRef.current?.();
    };

    // Entity selection (Region/Arc/Event clicked in tree)
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [editorMode, setEditorMode] = useState(storyId ? 'story' : null);

    // Unsaved Changes Modal
    const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const sidebarReloadRef = useRef(null);

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
        if (metadata.name) {
            document.title = `${prefix}Editor: ${metadata.name} - Civilight Eterna Database`;
        } else {
            document.title = `${prefix}A9 Story Editor`;
        }
    }, [metadata.name, editor.isDirty]);

    // ── Load Story ────────────────────────────────────────────────────────
    useEffect(() => {
        async function loadStory() {
            setError(null);
            if (!storyId) {
                editor.setScriptText('');
                setEditorMode(null);
                return;
            }
            setLoading(true);
            try {
                const item = await SupabaseAPI.getStory(storyId);
                if (!item) { setError(`Story "${storyId}" not found.`); return; }
                setMetadata({
                    name: item.name,
                    description: item.description || '',
                    display_order: item.display_order ?? null,
                    event_id: item.event_id ?? null,
                    story_id: item.story_id,
                });
                let text = '';
                if (item.story_content) {
                    if (item.story_content.type === 'vns') {
                        text = item.story_content.script || '';
                    } else {
                        text = StoryScriptSerializer.serialize(item.story_content);
                    }
                }
                editor.setScriptText(text);
                editor.setInitialScript(text);
                setEditorMode('story');
            } catch (err) {
                console.error('Failed to load story:', err);
                setError('Không thể tải dữ liệu story.');
            } finally {
                setLoading(false);
            }
        }
        loadStory();
    }, [storyId]);

    // ── Save ──────────────────────────────────────────────────────────────
    const handleSave = async (silent = false) => {
        setSaving(true);
        try {
            await StoryScriptParser.parseWithDB(editor.scriptText, editor.charCacheMap, editor.assetCacheMap);
            const payload = {
                name: metadata.name,
                description: metadata.description,
                display_order: metadata.display_order,
                event_id: metadata.event_id,
                story_content: { type: 'vns', script: editor.scriptText },
            };
            if (metadata.story_id) {
                await SupabaseAPI.updateStory(metadata.story_id, payload);
                editor.setInitialScript(editor.scriptText);
                if (!silent) localNotify('Đã lưu thay đổi!', 'success');
                return true;
            } else {
                const created = await SupabaseAPI.createStory(payload);
                setMetadata(prev => ({ ...prev, story_id: created.story_id }));
                editor.setInitialScript(editor.scriptText);
                navigate(`/editor/game/${created.story_id}`, { replace: true });
                if (!silent) localNotify('Story đã được tạo!', 'success');
                return true;
            }
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
        if (success) { setUnsavedModalOpen(false); if (pendingAction) pendingAction(); }
    };

    const handleConfirmDiscard = () => {
        setUnsavedModalOpen(false);
        if (pendingAction) pendingAction();
    };

    // ── Entity Selection ──────────────────────────────────────────────────
    const handleEntitySelect = (node) => {
        const action = () => {
            if (node.type === 'story') {
                navigate(`/editor/game/${node.story_id || node.id}`);
                setEditorMode('story');
                setSelectedEntity(null);
            } else {
                setSelectedEntity(node);
                setEditorMode(null);
            }
        };
        confirmNavigation(action);
    };

    if (error) {
        return (
            <div className={editorStyles.editorPage} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--color-error, #f87171)', fontSize: 16 }}>{error}</p>
                <button className={editorStyles.backBtn} onClick={() => navigate('/editor/game')} style={{ marginTop: 16 }}>
                    <ArrowLeft size={18} /> Quay lại
                </button>
            </div>
        );
    }

    return (
        <>
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className={editorStyles.editorHeader}>
                <div className={editorStyles.headerLeft}>
                    <button onClick={() => confirmNavigation(() => navigate('/editor'))} className={editorStyles.backBtn} title="Hub">
                        <Home size={20} />
                    </button>
                    <button
                        onClick={editor.toggleSidebar}
                        className={`${editorStyles.toggleBtn} ${editor.isSidebarVisible ? editorStyles.active : ''}`}
                        title={editor.isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
                    >
                        <PanelLeft size={20} />
                    </button>
                    <h1 className={editorStyles.headerTitle}>
                        {editorMode === 'entity' && selectedEntity
                            ? selectedEntity.name
                            : (metadata.story_id ? metadata.name : 'New Story')}
                        {editor.isDirty && <span className={editorStyles.dirtyStar}>*</span>}
                        <span>
                            {editorMode === 'entity'
                                ? selectedEntity?.type?.charAt(0).toUpperCase() + selectedEntity?.type?.slice(1)
                                : (metadata.story_id ? 'Edit' : 'Draft')}
                        </span>
                    </h1>
                </div>

                <div className={editorStyles.headerRight}>
                    {editorMode === 'story' && (
                        <>
                            <button onClick={editor.handleOpenStandalonePreview} className={editorStyles.btnSecondary}>
                                <ExternalLink size={16} />
                                <span className={editorStyles.btnText}>Full Preview</span>
                            </button>
                            <button onClick={handleSave} className={`${editorStyles.btnPrimary} ${editor.isDirty ? editorStyles.dirty : ''}`} disabled={saving}>
                                {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                <span className={editorStyles.btnText}>{saving ? 'Đang lưu...' : 'Lưu'}</span>
                            </button>
                        </>
                    )}
                    {editorMode === 'story' && (
                        <button
                            onClick={editor.togglePreview}
                            className={`${editorStyles.toggleBtn} ${editor.isPreviewVisible ? editorStyles.active : ''}`}
                            title={editor.isPreviewVisible ? "Hide Preview" : "Show Preview"}
                        >
                            <PanelRight size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Workspace ────────────────────────────────────────────── */}
            <div className={editorStyles.workspace}>
                {/* Sidebar */}
                {editor.isSidebarVisible && (
                    <div className={editorStyles.sidebarWrapper} style={{ width: editor.sidebarWidth }}>
                        <EditorSidebar
                            metadata={metadata}
                            onMetadataChange={setMetadata}
                            onStorySelect={handleEntitySelect}
                            currentStoryId={metadata.story_id}
                            reloadRef={sidebarReloadRef}
                            onPickAsset={editor.openPicker}
                            showNotification={localNotify}
                        />
                        <div className={editorStyles.resizer} onMouseDown={() => editor.setIsResizingSidebar(true)} />
                    </div>
                )}

                {/* Main Content */}
                {editorMode === 'story' ? (
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
                ) : selectedEntity ? (
                    <div className={editorStyles.editorColumn}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', color: 'var(--color-text-secondary)', padding: '20px', textAlign: 'center', overflowY: 'auto' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', marginTop: '20px' }}>{selectedEntity.name}</div>
                            <div style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginBottom: '16px' }}>{selectedEntity.type?.toUpperCase()}</div>
                            <p style={{ maxWidth: '400px', lineHeight: '1.6' }}>{selectedEntity.description || "No description available."}</p>

                            {selectedEntity.type === 'arc' && (
                                <SuggestionsManager arcId={selectedEntity.arc_id || selectedEntity.id} showNotification={localNotify} />
                            )}
                            {selectedEntity.type === 'event' && (
                                <>
                                    <EventCharactersManager
                                        eventId={selectedEntity.event_id || selectedEntity.id}
                                        showNotification={localNotify}
                                        onPickAsset={editor.openPicker}
                                        onPreview={handlePreviewAsset}
                                    />
                                    <EventGalleryManager
                                        eventId={selectedEntity.event_id || selectedEntity.id}
                                        showNotification={localNotify}
                                        onPickAsset={editor.openPicker}
                                        onPreview={handlePreviewAsset}
                                    />
                                </>
                            )}
                            <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                                Sửa thông tin bằng icon bút chì ở bên trái.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={editorStyles.editorColumn}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
                            Chọn một Story từ Story Tree để bắt đầu viết kịch bản...
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ───────────────────────────────────────────────── */}
            <AssetPickerModal
                isOpen={editor.pickerOpen}
                filterType={editor.pickerOptions.filter}
                multiSelect={editor.pickerOptions.multi}
                onClose={() => editor.handlePickerSelect(null)}
                onSelect={editor.handlePickerSelect}
            />

            <AssetPreviewModal
                isOpen={previewOpen}
                asset={previewTarget}
                kind={previewKind}
                onClose={() => setPreviewOpen(false)}
            />

            <AssetDetailModal
                isOpen={detailOpen}
                asset={detailTarget}
                kind={detailKind}
                onClose={() => setDetailOpen(false)}
                onUpdated={handleDetailUpdate}
                showNotification={localNotify}
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


// =============================================================================
// Editor Shell — The main page component that handles routing
// =============================================================================
export default function EditorPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [notification, setNotification] = useState({ message: '', type: 'success' });

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return (
        <div className={editorStyles.editorPage}>
            <Routes>
                {/* Hub — Landing page */}
                <Route path="/" element={
                    <>
                        <div className={editorStyles.editorHeader}>
                            <div className={editorStyles.headerLeft}>
                                <button onClick={() => navigate(-1)} className={editorStyles.backBtn} title="Back">
                                    <ArrowLeft size={20} />
                                </button>
                                <h1 className={editorStyles.headerTitle}>
                                    Editor Hub
                                </h1>
                            </div>
                            <div className={editorStyles.headerRight}>
                                <button onClick={handleLogout} className={editorStyles.btnSecondary} title="Đăng xuất">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                        <EditorHub />
                    </>
                } />

                {/* Game Story Editor */}
                <Route path="/game" element={<GameStoryEditor showNotification={showNotification} />} />
                <Route path="/game/:storyId" element={<GameStoryEditor showNotification={showNotification} />} />

                {/* Operator Record Editor */}
                <Route path="/record/:recordId" element={<OperatorRecordEditor showNotification={showNotification} />} />

                {/* Operator Manager */}
                <Route path="/operator/*" element={
                    <>
                        <div className={editorStyles.editorHeader}>
                            <div className={editorStyles.headerLeft}>
                                <button onClick={() => navigate('/editor')} className={editorStyles.backBtn} title="Hub">
                                    <Home size={20} />
                                </button>
                                <h1 className={editorStyles.headerTitle}>
                                    Operator Database
                                </h1>
                            </div>
                            <div className={editorStyles.headerRight}>
                                <button onClick={handleLogout} className={editorStyles.btnSecondary} title="Đăng xuất">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                        <div className={editorStyles.workspace}>
                            <OperatorManager showNotification={showNotification} />
                        </div>
                    </>
                } />
            </Routes>

            <NotificationToast
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification({ message: '', type: 'success' })}
            />
        </div>
    );
}
