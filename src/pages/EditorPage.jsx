import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Save, Loader } from 'lucide-react';

import EditorSidebar from '../components/Editor/EditorSidebar';
import EditorToolbar from '../components/Editor/EditorToolbar';
import CodeEditor from '../components/Editor/CodeEditor';
import MetadataForm from '../components/Editor/MetadataForm';
import AssetPickerModal from '../components/Editor/AssetPickerModal';
import StoryRenderer from '../components/StoryPage/StoryRenderer';

import { StoryScriptParser } from '../utils/storyParser';
import { StoryScriptSerializer } from '../utils/storySerializer';
import { SupabaseAPI } from '../services/supabaseApi';

import styles from './EditorPage.module.css';

export default function EditorPage() {
    const navigate = useNavigate();
    const { storyId } = useParams();  // undefined when creating a new story
    const editorRef = useRef(null);

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

    const [scriptText, setScriptText] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // ─── Entity selection (Region/Arc/Event clicked in tree) ───────────────────
    const [selectedEntity, setSelectedEntity] = useState(null);
    // 'story' = code editor, 'entity' = metadata form, null = blank
    const [editorMode, setEditorMode] = useState(storyId ? 'story' : null);

    // ─── Asset Picker Modal ────────────────────────────────────────────────────
    const [pickerOpen, setPickerOpen] = useState(false);
    const pickerCallbackRef = useRef(null);

    const openPicker = (callback) => {
        pickerCallbackRef.current = callback;
        setPickerOpen(true);
    };

    const handlePickerSelect = (url) => {
        pickerCallbackRef.current?.(url);
        pickerCallbackRef.current = null;
        setPickerOpen(false);
    };

    // ─── Sidebar reload ref ────────────────────────────────────────────────────
    const sidebarReloadRef = useRef(null);

    // ─── Initial Load ──────────────────────────────────────────────────────────
    useEffect(() => {
        async function loadStory() {
            if (!storyId) {
                // New story — start with blank template
                setScriptText(`# Characters\n@char Doctor id="char_doctor"\n\n@section\n\n@bg "bg_amiya_awake"\nDoctor [doctor, ]: Welcome to the editor!`);
                setEditorMode('story');
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

    // ─── Debounced Async Live Preview ─────────────────────────────────────────
    useEffect(() => {
        if (editorMode !== 'story') return;
        const timerId = setTimeout(async () => {
            if (!scriptText) return;
            setPreviewLoading(true);
            try {
                const parsed = await StoryScriptParser.parseWithDB(scriptText);
                setPreviewData({ name: metadata.name, story_content: parsed });
            } catch {
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
    }, [scriptText, metadata.name, editorMode]);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleInsertTemplate = (template) => {
        editorRef.current?.insertText(template);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const parsed = await StoryScriptParser.parseWithDB(scriptText);
            const payload = {
                name: metadata.name,
                description: metadata.description,
                display_order: metadata.display_order,
                event_id: metadata.event_id,
                story_content: parsed,
            };

            if (metadata.story_id) {
                await SupabaseAPI.updateStory(metadata.story_id, payload);
                alert('Đã lưu thay đổi!');
            } else {
                const created = await SupabaseAPI.createStory(payload);
                setMetadata(prev => ({ ...prev, story_id: created.story_id }));
                navigate(`/editor/${created.story_id}`, { replace: true });
                alert('Story đã được tạo!');
            }
        } catch (err) {
            console.error('Save failed:', err);
            alert('Lưu thất bại. Xem console để biết chi tiết.');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenStandalonePreview = () => {
        const parsed = StoryScriptParser.parse(scriptText);
        const previewObj = { ...metadata, story_content: parsed };
        sessionStorage.setItem('preview_story', JSON.stringify(previewObj));
        window.open('/?preview=1', '_blank');
    };

    // ─── Entity selection from sidebar tree ───────────────────────────────────
    const handleEntitySelect = (node) => {
        if (node.type === 'story') {
            // Navigate to story editor
            navigate(`/editor/${node.story_id || node.id}`);
            setEditorMode('story');
            setSelectedEntity(null);
        } else {
            setSelectedEntity(node);
            setEditorMode('entity');
        }
    };

    const handleEntitySaved = () => {
        sidebarReloadRef.current?.();
    };

    // ─── Loading / Error states ────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.editorPage} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent)' }} />
                <p style={{ color: 'var(--color-text-tertiary)', marginTop: 12 }}>Đang tải story...</p>
            </div>
        );
    }

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
        <div className={styles.editorPage}>
            {/* Top Navigation Bar */}
            <div className={styles.editorHeader}>
                <div className={styles.headerLeft}>
                    <button onClick={() => navigate(-1)} className={styles.backBtn} title="Back">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className={styles.headerTitle}>
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

                <div className={styles.headerRight}>
                    {editorMode === 'story' && (
                        <>
                            <button onClick={handleOpenStandalonePreview} className={styles.btnSecondary}>
                                <ExternalLink size={16} />
                                Full Preview
                            </button>
                            <button onClick={handleSave} className={styles.btnPrimary} disabled={saving}>
                                {saving
                                    ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    : <Save size={16} />
                                }
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Workspace */}
            <div className={styles.workspace}>
                {/* Left Sidebar */}
                <EditorSidebar
                    metadata={metadata}
                    onMetadataChange={setMetadata}
                    onStorySelect={handleEntitySelect}
                    currentStoryId={metadata.story_id}
                    reloadRef={sidebarReloadRef}
                    onPickAsset={openPicker}
                />

                {/* Center - Conditional: Code Editor or Metadata Form */}
                {editorMode === 'story' ? (
                    <>
                        <div className={styles.editorColumn}>
                            <EditorToolbar onInsert={handleInsertTemplate} />
                            <div className={styles.editorArea}>
                                <CodeEditor
                                    ref={editorRef}
                                    value={scriptText}
                                    onChange={(val) => setScriptText(val)}
                                />
                            </div>
                        </div>

                        {/* Right - Live Preview */}
                        <div className={styles.previewColumn}>
                            <div className={styles.previewHeader}>
                                <span className={styles.previewDot} style={previewLoading ? { background: 'var(--color-warning, #f59e0b)' } : {}} />
                                <span className={styles.previewLabel}>
                                    {previewLoading ? 'Parsing...' : 'Live Preview'}
                                </span>
                            </div>
                            <div className={styles.previewBody}>
                                {previewData?.story_content ? (
                                    <StoryRenderer previewData={previewData} isPreviewMode={true} />
                                ) : (
                                    <div className={styles.previewPlaceholder}>
                                        Bắt đầu viết script để xem preview...
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : editorMode === 'entity' ? (
                    <MetadataForm
                        entity={selectedEntity}
                        onSaved={handleEntitySaved}
                        onPickAsset={openPicker}
                    />
                ) : (
                    <div className={styles.editorColumn}>
                        <div className={styles.previewPlaceholder} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            Chọn một item từ Story Tree để bắt đầu...
                        </div>
                    </div>
                )}
            </div>

            {/* Asset Picker Modal */}
            <AssetPickerModal
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handlePickerSelect}
            />
        </div>
    );
}
