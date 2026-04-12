import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation, Routes, Route, useMatch } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ArrowLeft, ExternalLink, Save, Loader, PanelLeft, PanelRight, Home } from 'lucide-react';

import EditorSidebar from '../components/Editor/EditorSidebar';
import EditorToolbar from '../components/Editor/EditorToolbar';
import CodeEditor from '../components/Editor/CodeEditor';
import MetadataForm from '../components/Editor/MetadataForm';
import SuggestionsManager from '../components/Editor/SuggestionsManager';
import EventCharactersManager from '../components/Editor/EventCharactersManager';
import EventGalleryManager from '../components/Editor/EventGalleryManager';
import AssetPickerModal from '../components/Editor/AssetPickerModal';
import AssetDetailModal from '../components/Editor/AssetDetailModal';
import AssetPreviewModal from '../components/Editor/AssetPreviewModal';
import NotificationToast from '../components/Editor/NotificationToast';
import UnsavedChangesModal from '../components/Editor/UnsavedChangesModal';
import StoryRenderer from '../components/StoryPage/StoryRenderer';

import EditorHub from '../components/Editor/EditorHub';
import OperatorManager from '../components/Editor/OperatorManager';

import { StoryScriptParser } from '../utils/storyParser';
import { StoryScriptSerializer } from '../utils/storySerializer';
import { SupabaseAPI } from '../services/supabaseApi';

import styles from './EditorPage.module.css';
const editorStyles = styles;

// =============================================================================
// Game Story Editor (extracted from old EditorPage logic)
// =============================================================================
function GameStoryEditor({ showNotification }) {
    const navigate = useNavigate();
    const location = useLocation();
    const editorRef = useRef(null);

    // Extract storyId from URL: /editor/game/:storyId or /editor/game
    const storyMatch = useMatch('/editor/game/:storyId');
    const storyId = storyMatch?.params?.storyId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Sidebar & Preview visibility & width
    const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth > 1024);
    const [isPreviewVisible, setIsPreviewVisible] = useState(window.innerWidth > 1024);
    const [sidebarWidth, setSidebarWidth] = useState(280);
    const [previewWidth, setPreviewWidth] = useState(420);
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024);

    // Monitor screen size
    useEffect(() => {
        const handleResize = () => {
            const small = window.innerWidth <= 1024;
            setIsSmallScreen(small);
            if (small) {
                if (isSidebarVisible && isPreviewVisible) {
                    setIsSidebarVisible(false);
                }
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarVisible, isPreviewVisible]);

    const toggleSidebar = () => {
        if (isSmallScreen && !isSidebarVisible) {
            setIsPreviewVisible(false);
        }
        setIsSidebarVisible(!isSidebarVisible);
    };

    const togglePreview = () => {
        if (isSmallScreen && !isPreviewVisible) {
            setIsSidebarVisible(false);
        }
        setIsPreviewVisible(!isPreviewVisible);
    };

    const [notification, setNotification] = useState({ message: '', type: 'success' });
    const localNotify = (message, type = 'success') => {
        showNotification ? showNotification(message, type) : setNotification({ message, type });
    };

    // Resizing state
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [isResizingPreview, setIsResizingPreview] = useState(false);

    // Asset Preview Modal (Read-only Lightbox)
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewTarget, setPreviewTarget] = useState(null);
    const [previewKind, setPreviewKind] = useState('asset');

    const handlePreviewAsset = (item, kind) => {
        let target = item;
        if (kind === 'asset' && item.gallery_id) {
            target = {
                asset_id: item.gallery_id,
                url: item.image_url,
                title: item.title,
                type: 'image',
                category: 'gallery'
            };
        }
        setPreviewTarget(target);
        setPreviewKind(kind);
        setPreviewOpen(true);
    };

    // Asset Detail/Edit Modal
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

    const [metadata, setMetadata] = useState({
        name: 'Untitled Draft',
        description: '',
        display_order: null,
        event_id: null,
        story_id: null,
    });

    const [scriptText, setScriptText] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [allCharacters, setAllCharacters] = useState([]);
    const [eventCharacters, setEventCharacters] = useState([]);
    const [allAssets, setAllAssets] = useState([]);
    const [initialScript, setInitialScript] = useState('');
    const isDirty = scriptText !== initialScript;

    // Update Page Title
    useEffect(() => {
        const prefix = isDirty ? '* ' : '';
        if (metadata.name) {
            document.title = `${prefix}Editor: ${metadata.name} - Civilight Eterna Database`;
        } else {
            document.title = `${prefix}A9 Story Editor`;
        }
    }, [metadata.name, isDirty]);

    // Unsaved Changes Modal State
    const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    // Entity selection (Region/Arc/Event clicked in tree)
    const [selectedEntity, setSelectedEntity] = useState(null);
    // 'story' = code editor, 'entity' = metadata form, null = blank
    const [editorMode, setEditorMode] = useState(storyId ? 'story' : null);

    // Asset Picker Modal
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerFilter, setPickerFilter] = useState(null);
    const pickerCallbackRef = useRef(null);

    const openPicker = (callback, filter = null) => {
        pickerCallbackRef.current = callback;
        setPickerFilter(filter);
        setPickerOpen(true);
    };

    const handlePickerSelect = (asset) => {
        pickerCallbackRef.current?.(asset);
        pickerCallbackRef.current = null;
        setPickerFilter(null);
        setPickerOpen(false);
    };

    const sidebarReloadRef = useRef(null);

    const confirmNavigation = (action) => {
        if (isDirty) {
            setPendingAction(() => action);
            setUnsavedModalOpen(true);
        } else {
            action();
        }
    };

    // Initial Load
    useEffect(() => {
        async function loadStory() {
            if (!storyId) {
                setScriptText('');
                setEditorMode(null);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const item = await SupabaseAPI.getStory(storyId);
                if (!item) {
                    setError(`Story "${storyId}" not found.`);
                    return;
                }
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
                setScriptText(text);
                setInitialScript(text);
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
    
    // Load metadata for editor suggestions and parser cache (run once)
    useEffect(() => {
        async function loadMetadata() {
            try {
                const [chars, assets, galleryData] = await Promise.all([
                    SupabaseAPI.getCharacters(),
                    SupabaseAPI.getAssets(),
                    SupabaseAPI.getAllGallery(),
                ]);
                
                setAllCharacters(chars);
                
                if (metadata.event_id) {
                    try {
                        const eventChars = await SupabaseAPI.getCharactersByEvent(metadata.event_id);
                        setEventCharacters(eventChars);
                    } catch (e) {
                        console.error('Failed to fetch event characters:', e);
                    }
                } else {
                    setEventCharacters([]);
                }
                
                const mappedGallery = (galleryData || []).map(g => ({
                    asset_id: g.gallery_id,
                    name: g.title,
                    url: g.image_url,
                    type: 'image',
                    category: 'gallery'
                }));
                setAllAssets([...(assets || []), ...mappedGallery]);
            } catch (err) {
                console.error('Failed to load character/asset metadata:', err);
            }
        }
        loadMetadata();
    }, []);

    const charCacheMap = React.useMemo(() => {
        return Object.fromEntries(allCharacters.map(c => [c.character_id, c]));
    }, [allCharacters]);

    const assetCacheMap = React.useMemo(() => {
        return Object.fromEntries(allAssets.map(a => [a.asset_id, a]));
    }, [allAssets]);

    // Live Preview
    useEffect(() => {
        if (editorMode !== 'story') return;
        const timerId = setTimeout(async () => {
            if (!scriptText) return;
            setPreviewLoading(true);
            try {
                const parsed = await StoryScriptParser.parseWithDB(scriptText, charCacheMap, assetCacheMap);
                setPreviewData({ name: metadata.name, story_content: parsed });
            } catch (err) {
                try {
                    const parsed = StoryScriptParser.parse(scriptText);
                    setPreviewData({ name: metadata.name, story_content: parsed });
                } catch (syncErr) {
                    console.warn('Live Preview failed:', syncErr);
                }
            } finally {
                setPreviewLoading(false);
            }
        }, 600);
        return () => clearTimeout(timerId);
    }, [scriptText, metadata.name, editorMode, charCacheMap, assetCacheMap]);

    // Handle Browser-level BeforeUnload
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Resizing
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizingSidebar) {
                const newWidth = Math.max(180, Math.min(600, e.clientX));
                setSidebarWidth(newWidth);
            } else if (isResizingPreview) {
                const windowWidth = window.innerWidth;
                const newWidth = Math.max(250, Math.min(800, windowWidth - e.clientX));
                setPreviewWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizingSidebar(false);
            setIsResizingPreview(false);
            document.body.style.cursor = 'default';
        };

        if (isResizingSidebar || isResizingPreview) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'auto';
        };
    }, [isResizingSidebar, isResizingPreview]);

    const handleInsertTemplate = (template, isInline = false) => {
        editorRef.current?.insertText(template, isInline);
    };

    const handleSave = async (silent = false) => {
        setSaving(true);
        try {
            await StoryScriptParser.parseWithDB(scriptText, charCacheMap, assetCacheMap);
            
            const payload = {
                name: metadata.name,
                description: metadata.description,
                display_order: metadata.display_order,
                event_id: metadata.event_id,
                story_content: { type: 'vns', script: scriptText }, 
            };

            if (metadata.story_id) {
                await SupabaseAPI.updateStory(metadata.story_id, payload);
                setInitialScript(scriptText);
                if (!silent) localNotify('Đã lưu thay đổi!', 'success');
                return true;
            } else {
                const created = await SupabaseAPI.createStory(payload);
                setMetadata(prev => ({ ...prev, story_id: created.story_id }));
                setInitialScript(scriptText);
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
        if (success) {
            setUnsavedModalOpen(false);
            if (pendingAction) pendingAction();
        }
    };

    const handleConfirmDiscard = () => {
        setUnsavedModalOpen(false);
        if (pendingAction) pendingAction();
    };

    const handleOpenStandalonePreview = async () => {
        const parsed = await StoryScriptParser.parseWithDB(scriptText, charCacheMap, assetCacheMap);
        const previewObj = { ...metadata, story_content: parsed };
        sessionStorage.setItem('preview_story', JSON.stringify(previewObj));
        window.open('#/story/preview?preview=1', '_blank');
    };

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

    const handleEntitySaved = () => {
        sidebarReloadRef.current?.();
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
            {/* Header actions — injected via the parent shell */}
            <div className={editorStyles.editorHeader}>
                <div className={editorStyles.headerLeft}>
                    <button onClick={() => confirmNavigation(() => navigate('/editor'))} className={editorStyles.backBtn} title="Hub">
                        <Home size={20} />
                    </button>
                    <button 
                        onClick={toggleSidebar} 
                        className={`${editorStyles.toggleBtn} ${isSidebarVisible ? editorStyles.active : ''}`} 
                        title={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
                    >
                        <PanelLeft size={20} />
                    </button>
                    <h1 className={editorStyles.headerTitle}>
                        {editorMode === 'entity' && selectedEntity
                            ? selectedEntity.name
                            : (metadata.story_id ? metadata.name : 'New Story')}
                        {isDirty && <span className={editorStyles.dirtyStar}>*</span>}
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
                            <button onClick={handleOpenStandalonePreview} className={editorStyles.btnSecondary}>
                                <ExternalLink size={16} />
                                <span className={editorStyles.btnText}>Full Preview</span>
                            </button>
                            <button onClick={handleSave} className={`${editorStyles.btnPrimary} ${isDirty ? editorStyles.dirty : ''}`} disabled={saving}>
                                {saving
                                    ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    : <Save size={16} />
                                }
                                <span className={editorStyles.btnText}>{saving ? 'Đang lưu...' : 'Lưu'}</span>
                            </button>
                        </>
                    )}

                    {editorMode === 'story' && (
                        <button 
                            onClick={togglePreview} 
                            className={`${editorStyles.toggleBtn} ${isPreviewVisible ? editorStyles.active : ''}`} 
                            title={isPreviewVisible ? "Hide Preview" : "Show Preview"}
                        >
                            <PanelRight size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className={editorStyles.workspace}>
                {isSidebarVisible && (
                    <div className={editorStyles.sidebarWrapper} style={{ width: sidebarWidth }}>
                        <EditorSidebar
                            metadata={metadata}
                            onMetadataChange={setMetadata}
                            onStorySelect={handleEntitySelect}
                            currentStoryId={metadata.story_id}
                            reloadRef={sidebarReloadRef}
                            onPickAsset={openPicker}
                            showNotification={localNotify}
                        />
                        <div 
                            className={editorStyles.resizer} 
                            onMouseDown={() => setIsResizingSidebar(true)}
                        />
                    </div>
                )}

                <div className={editorStyles.editorColumn}>
                    {loading ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e2128' }}>
                            <Loader size={48} className={editorStyles.spinner} />
                        </div>
                    ) : editorMode === 'story' ? (
                        <>
                            <EditorToolbar onInsert={handleInsertTemplate} />
                            <div className={editorStyles.editorArea}>
                                <CodeEditor
                                    ref={editorRef}
                                    value={scriptText}
                                    onChange={setScriptText}
                                    characters={allCharacters}
                                    eventCharacters={eventCharacters}
                                    assets={allAssets}
                                />
                            </div>
                        </>
                    ) : selectedEntity ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', color: 'var(--color-text-secondary)', padding: '20px', textAlign: 'center', overflowY: 'auto' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', marginTop: '20px' }}>{selectedEntity.name}</div>
                            <div style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginBottom: '16px' }}>{selectedEntity.type?.toUpperCase()}</div>
                            <p style={{ maxWidth: '400px', lineHeight: '1.6' }}>{selectedEntity.description || "No description available."}</p>
                            
                            {selectedEntity.type === 'arc' && (
                                <SuggestionsManager 
                                    arcId={selectedEntity.arc_id || selectedEntity.id} 
                                    showNotification={localNotify} 
                                />
                            )}
                            {selectedEntity.type === 'event' && (
                                <>
                                    <EventCharactersManager 
                                        eventId={selectedEntity.event_id || selectedEntity.id} 
                                        showNotification={localNotify} 
                                        onPickAsset={openPicker}
                                        onPreview={handlePreviewAsset}
                                    />
                                    <EventGalleryManager 
                                        eventId={selectedEntity.event_id || selectedEntity.id} 
                                        showNotification={localNotify} 
                                        onPickAsset={openPicker}
                                        onPreview={handlePreviewAsset}
                                    />
                                </>
                            )}

                            <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                                Sửa thông tin bằng icon bút chì ở bên trái.
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
                            Chọn một Story từ Story Tree để bắt đầu viết kịch bản...
                        </div>
                    )}
                </div>

                {isPreviewVisible && editorMode === 'story' && !loading && (
                    <div className={editorStyles.previewWrapper} style={{ width: previewWidth }}>
                        <div 
                            className={`${editorStyles.resizer} ${editorStyles.resizerLeft}`} 
                            onMouseDown={() => setIsResizingPreview(true)}
                        />
                        <div className={editorStyles.previewColumn} style={{ width: '100%' }}>
                            <div className={editorStyles.previewHeader}>
                                <div className={editorStyles.previewHeaderLeft}>
                                    <span className={editorStyles.previewDot} style={previewLoading ? { background: 'var(--color-warning, #f59e0b)' } : {}} />
                                    <span className={editorStyles.previewLabel}>
                                        {previewLoading ? 'Parsing...' : 'Live Preview'}
                                    </span>
                                </div>
                            </div>
                            <div className={editorStyles.previewBody}>
                                {previewData?.story_content ? (
                                    <StoryRenderer 
                                        previewData={previewData} 
                                        isPreviewMode={true} 
                                    />
                                ) : (
                                    <div className={editorStyles.previewPlaceholder} style={{ background: '#000' }} />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AssetPickerModal
                isOpen={pickerOpen}
                filterType={pickerFilter}
                onClose={() => setPickerOpen(false)}
                onSelect={handlePickerSelect}
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
