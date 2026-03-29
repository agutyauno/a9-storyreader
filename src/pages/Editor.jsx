import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ArrowLeft, ExternalLink, Save, Loader, PanelLeft, PanelRight } from 'lucide-react';

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
import NotificationToast from '../components/Editor/NotificationToast'; // New
import StoryRenderer from '../components/StoryPage/StoryRenderer';

import { StoryScriptParser } from '../utils/storyParser';
import { StoryScriptSerializer } from '../utils/storySerializer';
import { SupabaseAPI } from '../services/supabaseApi';

import styles from './EditorPage.module.css';
const editorStyles = styles;

export default function EditorPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { storyId } = useParams();  // undefined when creating a new story
    const editorRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    // Sidebar & Preview visibility & width
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isPreviewVisible, setIsPreviewVisible] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(280);
    const [previewWidth, setPreviewWidth] = useState(420);

    // Notification State
    const [notification, setNotification] = useState({ message: '', type: 'success' });
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    // Resizing state
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [isResizingPreview, setIsResizingPreview] = useState(false);

    // Asset Preview Modal (Read-only Lightbox)
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewTarget, setPreviewTarget] = useState(null);
    const [previewKind, setPreviewKind] = useState('asset'); // 'asset' or 'character'

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
    const [detailKind, setDetailKind] = useState('asset'); // 'asset' or 'character'

    const handleEditAsset = (item, kind) => {
        setDetailTarget(item);
        setDetailKind(kind);
        setDetailOpen(true);
    };

    const handleDetailUpdate = () => {
        sidebarReloadRef.current?.();
    };

    // Sidebar reload ref
    const [metadata, setMetadata] = useState({
        name: 'Untitled Draft',
        description: '',
        display_order: null,
        event_id: null,
        story_id: null,
    });

    // Update Page Title
    useEffect(() => {
        if (metadata.name) {
            document.title = `Editor: ${metadata.name} - A9 StoryReader`;
        } else {
            document.title = 'A9 Story Editor';
        }
    }, [metadata.name]);

    const [scriptText, setScriptText] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [doctorNickname, setDoctorNickname] = useState(localStorage.getItem('doctor_nickname') || '');
    const [allCharacters, setAllCharacters] = useState([]);
    const [eventCharacters, setEventCharacters] = useState([]); // Specifically linked to current event
    const [allAssets, setAllAssets] = useState([]);

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

    // Initial Load
    useEffect(() => {
        async function loadStory() {
            if (!storyId) {
                // New/Blank state — start with empty script and no active editor
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
                const text = item.story_content
                    ? StoryScriptSerializer.serialize(item.story_content)
                    : '';
                setScriptText(text);
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
                const [chars, assets] = await Promise.all([
                    SupabaseAPI.getCharacters(),
                    SupabaseAPI.getAssets()
                ]);
                
                setAllCharacters(chars);
                
                // Fetch event characters if we are in a story
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
                
                setAllAssets(assets);
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

    // Persist Nickname
    useEffect(() => {
        localStorage.setItem('doctor_nickname', doctorNickname);
    }, [doctorNickname]);

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

    const handleInsertTemplate = (template) => {
        editorRef.current?.insertText(template);
    };


    const handleSave = async () => {
        setSaving(true);
        try {
            const parsed = await StoryScriptParser.parseWithDB(scriptText, charCacheMap, assetCacheMap);
            const payload = {
                name: metadata.name,
                description: metadata.description,
                display_order: metadata.display_order,
                event_id: metadata.event_id,
                story_content: parsed, 
            };

            if (metadata.story_id) {
                await SupabaseAPI.updateStory(metadata.story_id, payload);
                showNotification('Đã lưu thay đổi!', 'success');
            } else {
                const created = await SupabaseAPI.createStory(payload);
                setMetadata(prev => ({ ...prev, story_id: created.story_id }));
                navigate(`/editor/${created.story_id}`, { replace: true });
                showNotification('Story đã được tạo!', 'success');
            }
        } catch (err) {
            console.error('Save failed:', err);
            showNotification('Lưu thất bại: ' + (err.message || 'Lỗi hệ thống'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenStandalonePreview = () => {
        const parsed = StoryScriptParser.parse(scriptText);
        const previewObj = { ...metadata, story_content: parsed };
        sessionStorage.setItem('preview_story', JSON.stringify(previewObj));
        window.open('/story/preview?preview=1', '_blank');
    };

    const handleEntitySelect = (node) => {
        if (node.type === 'story') {
            navigate(`/editor/${node.story_id || node.id}`);
            setEditorMode('story');
            setSelectedEntity(null);
        } else {
            // For other types, just register the selection (highlight) 
            // but don't show an edit panel since there's a modal now
            setSelectedEntity(node);
            setEditorMode(null);
        }
    };

    const handleEntitySaved = () => {
        sidebarReloadRef.current?.();
    };

    if (error) {
        return (
            <div className={editorStyles.editorPage} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--color-error, #f87171)', fontSize: 16 }}>{error}</p>
                <button className={editorStyles.backBtn} onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
                    <ArrowLeft size={18} /> Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className={editorStyles.editorPage}>
            <div className={editorStyles.editorHeader}>
                <div className={editorStyles.headerLeft}>
                    <button onClick={() => navigate(-1)} className={editorStyles.backBtn} title="Back">
                        <ArrowLeft size={20} />
                    </button>
                    <button 
                        onClick={() => setIsSidebarVisible(!isSidebarVisible)} 
                        className={`${editorStyles.toggleBtn} ${isSidebarVisible ? editorStyles.active : ''}`} 
                        title={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
                    >
                        <PanelLeft size={20} />
                    </button>
                    <h1 className={editorStyles.headerTitle}>
                        {editorMode === 'entity' && selectedEntity
                            ? selectedEntity.name
                            : (metadata.story_id ? metadata.name : 'New Story')}
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
                                Full Preview
                            </button>
                            <button onClick={handleSave} className={editorStyles.btnPrimary} disabled={saving}>
                                {saving
                                    ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    : <Save size={16} />
                                }
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </>
                    )}
                    
                    <button onClick={handleLogout} className={editorStyles.btnSecondary} title="Đăng xuất">
                        <LogOut size={16} />
                    </button>

                    {editorMode === 'story' && (
                        <button 
                            onClick={() => setIsPreviewVisible(!isPreviewVisible)} 
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
                            showNotification={showNotification}
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
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{selectedEntity.name}</div>
                            <div style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginBottom: '16px' }}>{selectedEntity.type?.toUpperCase()}</div>
                            <p style={{ maxWidth: '400px', lineHeight: '1.6' }}>{selectedEntity.description || "No description available."}</p>
                            
                            {/* Detailed Managers based on type */}
                            {selectedEntity.type === 'arc' && (
                                <SuggestionsManager 
                                    arcId={selectedEntity.arc_id || selectedEntity.id} 
                                    showNotification={showNotification} 
                                />
                            )}
                            {selectedEntity.type === 'event' && (
                                <>
                                    <EventCharactersManager 
                                        eventId={selectedEntity.event_id || selectedEntity.id} 
                                        showNotification={showNotification} 
                                        onPickAsset={openPicker}
                                        onPreview={handlePreviewAsset}
                                    />
                                    <EventGalleryManager 
                                        eventId={selectedEntity.event_id || selectedEntity.id} 
                                        showNotification={showNotification} 
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
                                <div className={editorStyles.nicknameInputWrapper}>
                                    <span className={editorStyles.nicknamePrefix}>Dr.</span>
                                    <input 
                                        type="text" 
                                        className={editorStyles.nicknameInput} 
                                        value={doctorNickname}
                                        onChange={(e) => setDoctorNickname(e.target.value)}
                                        placeholder="@nickname"
                                    />
                                </div>
                            </div>
                            <div className={editorStyles.previewBody}>
                                {previewData?.story_content ? (
                                    <StoryRenderer 
                                        previewData={previewData} 
                                        isPreviewMode={true} 
                                        doctorNickname={doctorNickname}
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
                showNotification={showNotification}
            />

            <NotificationToast
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification({ message: '', type: 'success' })}
            />
        </div>
    );
}
