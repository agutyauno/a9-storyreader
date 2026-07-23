import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../src/contexts/AuthContext'
import { ArrowLeft, ExternalLink, Save, Loader, PanelLeft, PanelRight, LogOut } from 'lucide-react'

import EditorSidebar from '../../../src/components/Editor/EditorSidebar'
import EditorToolbar from '../../../src/components/Editor/EditorToolbar'
import ScriptEditor from './components/ScriptEditor'
import LivePreview from './components/LivePreview'

import SuggestionsManager from '../../../src/components/Editor/SuggestionsManager'
import EventCharactersManager from '../../../src/components/Editor/EventCharactersManager'
import EventGalleryManager from '../../../src/components/Editor/EventGalleryManager'

import AssetPickerModal from '../../../src/components/Editor/AssetPickerModal'
import AssetDetailModal from '../../../src/components/Editor/AssetDetailModal'
import AssetPreviewModal from '../../../src/components/Editor/AssetPreviewModal'
import NotificationToast from '../../../src/components/Editor/NotificationToast'
import UnsavedChangesModal from '../../../src/components/Editor/UnsavedChangesModal'

import { StoryScriptParser } from '../../../src/utils/storyParser'
import { SupabaseAPI } from '../../../src/services/supabaseApi'
import './storyEditor.css'

export default function RedesignStoryEditorPage() {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const { storyId } = useParams()
    const editorRef = useRef(null)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // Sidebar & Preview visibility & width
    const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth > 1024)
    const [isPreviewVisible, setIsPreviewVisible] = useState(window.innerWidth > 1024)
    const [sidebarWidth, setSidebarWidth] = useState(300)
    const [previewWidth, setPreviewWidth] = useState(450)
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024)

    // Monitor screen size
    useEffect(() => {
        const handleResize = () => {
            const small = window.innerWidth <= 1024
            setIsSmallScreen(small)
            if (small) {
                if (isSidebarVisible && isPreviewVisible) {
                    setIsSidebarVisible(false)
                }
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isSidebarVisible, isPreviewVisible])

    const toggleSidebar = () => {
        if (isSmallScreen && !isSidebarVisible) {
            setIsPreviewVisible(false)
        }
        setIsSidebarVisible(!isSidebarVisible)
    }

    const togglePreview = () => {
        if (isSmallScreen && !isPreviewVisible) {
            setIsSidebarVisible(false)
        }
        setIsPreviewVisible(!isPreviewVisible)
    }

    const handleBack = () => {
        confirmNavigation(() => navigate('/editor'))
    }

    const handleLogout = () => {
        confirmNavigation(async () => {
            try {
                await logout()
                navigate('/login')
            } catch (err) {
                console.error('Logout failed:', err)
            }
        })
    }

    const confirmNavigation = (action) => {
        if (isDirty) {
            setPendingAction(() => action)
            setUnsavedModalOpen(true)
        } else {
            action()
        }
    }

    const [notification, setNotification] = useState({ message: '', type: 'success' })
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type })
    }

    // Resizing state
    const [isResizingSidebar, setIsResizingSidebar] = useState(false)
    const [isResizingPreview, setIsResizingPreview] = useState(false)

    // Asset Preview Modal (Read-only Lightbox)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewTarget, setPreviewTarget] = useState(null)
    const [previewKind, setPreviewKind] = useState('asset') // 'asset' or 'character'

    const handlePreviewAsset = (item, kind) => {
        let target = item
        if (kind === 'asset' && item.gallery_id) {
            target = {
                asset_id: item.gallery_id,
                url: item.image_url,
                title: item.title,
                type: 'image',
                category: 'gallery'
            }
        }
        setPreviewTarget(target)
        setPreviewKind(kind)
        setPreviewOpen(true)
    }

    // Asset Detail/Edit Modal
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailTarget, setDetailTarget] = useState(null)
    const [detailKind, setDetailKind] = useState('asset') // 'asset' or 'character'

    const handleEditAsset = (item, kind) => {
        setDetailTarget(item)
        setDetailKind(kind)
        setDetailOpen(true)
    }

    const handleDetailUpdate = () => {
        sidebarReloadRef.current?.()
    }

    // Story metadata & Script text
    const [metadata, setMetadata] = useState({
        name: 'Untitled Draft',
        description: '',
        display_order: null,
        event_id: null,
        story_id: null,
    })

    const [scriptText, setScriptText] = useState('')
    const [allCharacters, setAllCharacters] = useState([])
    const [eventCharacters, setEventCharacters] = useState([])
    const [allAssets, setAllAssets] = useState([])
    const [initialScript, setInitialScript] = useState('')
    const isDirty = scriptText !== initialScript

    // Update Document Title
    useEffect(() => {
        const prefix = isDirty ? '* ' : ''
        if (metadata.name) {
            document.title = `${prefix}Editor: ${metadata.name} // Civilight Eterna Database`
        } else {
            document.title = `${prefix}Story Editor // Admin`
        }
    }, [metadata.name, isDirty])

    // Unsaved Changes Modal State
    const [unsavedModalOpen, setUnsavedModalOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState(null)

    // 'story' = code editor, null = select story state
    const [editorMode, setEditorMode] = useState(storyId ? 'story' : null)
    const [selectedEntity, setSelectedEntity] = useState(null)

    // Asset Picker Modal
    const [pickerOpen, setPickerOpen] = useState(false)
    const [pickerOptions, setPickerOptions] = useState({ filter: null, multi: false })
    const pickerCallbackRef = useRef(null)

    const openPicker = (callback, options = {}) => {
        pickerCallbackRef.current = callback
        setPickerOptions({
            filter: options.filter || (typeof options === 'string' ? options : null),
            multi: options.multi || false
        })
        setPickerOpen(true)
    }

    const handlePickerSelect = (assetOrAssets) => {
        pickerCallbackRef.current?.(assetOrAssets)
        pickerCallbackRef.current = null
        setPickerOptions({ filter: null, multi: false })
        setPickerOpen(false)
    }

    const sidebarReloadRef = useRef(null)

    // Initial load
    useEffect(() => {
        async function loadStory() {
            if (!storyId) {
                setScriptText('')
                setEditorMode(null)
                return
            }

            setLoading(true)
            setError(null)
            try {
                const item = await SupabaseAPI.getStory(storyId)
                if (!item) {
                    setError(`Không tìm thấy Story với mã ID "${storyId}".`)
                    return
                }
                setMetadata({
                    name: item.name,
                    description: item.description || '',
                    display_order: item.display_order ?? null,
                    event_id: item.event_id ?? null,
                    story_id: item.story_id,
                })
                let text = ''
                if (item.story_content) {
                    if (item.story_content.type === 'vns') {
                        text = item.story_content.script || ''
                    } else {
                        // V1 format parsing fallback is not strictly required here
                        text = item.story_content.script || ''
                    }
                }
                setScriptText(text)
                setInitialScript(text)
                setEditorMode('story')
            } catch (err) {
                console.error('Failed to load story:', err)
                setError('Không thể tải dữ liệu cốt truyện.')
            } finally {
                setLoading(false)
            }
        }
        loadStory()
    }, [storyId])

    // Load auto-completions metadata
    useEffect(() => {
        async function loadMetadata() {
            try {
                const [chars, assets, galleryData] = await Promise.all([
                    SupabaseAPI.getCharacters(),
                    SupabaseAPI.getAssets(),
                    SupabaseAPI.getAllGallery(),
                ])
                setAllCharacters(chars || [])

                if (metadata.event_id) {
                    try {
                        const eventChars = await SupabaseAPI.getCharactersByEvent(metadata.event_id)
                        setEventCharacters(eventChars || [])
                    } catch (e) {
                        console.error('Failed to fetch event characters:', e)
                    }
                } else {
                    setEventCharacters([])
                }

                const mappedGallery = (galleryData || []).map(g => ({
                    asset_id: g.gallery_id,
                    name: g.title,
                    url: g.image_url,
                    type: 'image',
                    category: 'gallery'
                }))
                setAllAssets([...(assets || []), ...mappedGallery])
            } catch (err) {
                console.error('Failed to load metadata:', err)
            }
        }
        loadMetadata()
    }, [metadata.event_id])

    // Resizing listeners
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizingSidebar) {
                const newWidth = Math.max(200, Math.min(500, e.clientX))
                setSidebarWidth(newWidth)
            } else if (isResizingPreview) {
                const windowWidth = window.innerWidth
                const newWidth = Math.max(300, Math.min(800, windowWidth - e.clientX))
                setPreviewWidth(newWidth)
            }
        }

        const handleMouseUp = () => {
            setIsResizingSidebar(false)
            setIsResizingPreview(false)
            document.body.style.cursor = 'default'
        }

        if (isResizingSidebar || isResizingPreview) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            document.body.style.userSelect = 'auto'
        }
    }, [isResizingSidebar, isResizingPreview])

    const handleInsertTemplate = (template, isInline = false) => {
        editorRef.current?.insertText(template, isInline)
    }

    const handleSave = async (silent = false) => {
        setSaving(true)
        try {
            // Validate syntax before saving
            const charCacheMap = Object.fromEntries(allCharacters.map(c => [c.character_id, c]))
            const assetCacheMap = Object.fromEntries(allAssets.map(a => [a.asset_id, a]))
            await StoryScriptParser.parseWithDB(scriptText, charCacheMap, assetCacheMap)

            const payload = {
                name: metadata.name,
                description: metadata.description,
                display_order: metadata.display_order,
                event_id: metadata.event_id,
                story_content: { type: 'vns', script: scriptText },
            }

            if (metadata.story_id) {
                await SupabaseAPI.updateStory(metadata.story_id, payload)
                setInitialScript(scriptText)
                if (!silent) showNotification('Đã lưu kịch bản chương!', 'success')
                return true
            } else {
                const created = await SupabaseAPI.createStory(payload)
                setMetadata(prev => ({ ...prev, story_id: created.story_id }))
                setInitialScript(scriptText)
                navigate(`/editor/story/${created.story_id}`, { replace: true })
                if (!silent) showNotification('Chương cốt truyện mới đã được tạo!', 'success')
                return true
            }
        } catch (err) {
            console.error('Save failed:', err)
            if (!silent) showNotification('Lưu kịch bản thất bại: ' + (err.message || 'Lỗi hệ thống'), 'error')
            return false
        } finally {
            setSaving(false)
        }
    }

    // Keyboard Shortcuts (Ctrl+S / Cmd+S to save)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault()
                if (editorMode === 'story' && !saving) {
                    handleSave(false)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [editorMode, saving, scriptText, metadata, allCharacters, allAssets])

    // Browser Unsaved Changes Protection
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [isDirty])

    const handleSaveAndConfirm = async () => {
        const success = await handleSave(true)
        if (success) {
            setUnsavedModalOpen(false)
            if (pendingAction) pendingAction()
        }
    }

    const handleConfirmDiscard = () => {
        setUnsavedModalOpen(false)
        if (pendingAction) pendingAction()
    }

    const handleOpenStandalonePreview = () => {
        const previewObj = {
            ...metadata,
            story_content: { type: 'vns', script: scriptText }
        }
        sessionStorage.setItem('preview_story', JSON.stringify(previewObj))
        window.open('#/story/preview?preview=1', '_blank')
    }

    const handleEntitySelect = (node) => {
        const action = () => {
            if (node.type === 'story') {
                navigate(`/editor/story/${node.story_id || node.id}`)
                setEditorMode('story')
                setSelectedEntity(null)
            } else {
                setSelectedEntity(node)
                setEditorMode(null)
            }
        }
        confirmNavigation(action)
    }

    if (error) {
        return (
            <div className="redesign-editor-page error-state">
                <div className="error-box panel-stripes">
                    <p className="technical-text">SYS_ERROR: {error}</p>
                    <button className="brutalist-btn technical-text" onClick={() => navigate('/editor')}>
                        <ArrowLeft size={16} /> RETURN_TO_HUB
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="redesign-editor-page">
            {/* Header / Command Center */}
            <div className="redesign-editor-header app-header">
                <div className="header-left">
                    <button onClick={handleBack} className="brutalist-icon-btn" title="Về Hub">
                        <ArrowLeft size={18} />
                    </button>
                    <button 
                        onClick={toggleSidebar} 
                        className={`brutalist-icon-btn ${isSidebarVisible ? 'active' : ''}`} 
                        title={isSidebarVisible ? "Ẩn danh mục" : "Hiện danh mục"}
                    >
                        <PanelLeft size={18} />
                    </button>
                    <h1 className="editor-title technical-text">
                        {editorMode === 'story'
                            ? `STORY_COMPILER // ${metadata.name}`
                            : selectedEntity 
                                ? `${selectedEntity.type.toUpperCase()}_META // ${selectedEntity.name}`
                                : 'STORY_COMPILER // INITIALIZING'}
                        {isDirty && <span className="dirty-star">*</span>}
                    </h1>
                </div>

                <div className="header-right">
                    {editorMode === 'story' && (
                        <>
                            <button onClick={handleOpenStandalonePreview} className="brutalist-btn secondary technical-text">
                                <ExternalLink size={14} />
                                <span>STANDALONE_PREVIEW</span>
                            </button>
                            <button 
                                onClick={() => handleSave(false)} 
                                className={`brutalist-btn primary technical-text ${isDirty ? 'dirty' : ''}`} 
                                disabled={saving}
                            >
                                {saving ? <Loader size={14} className="spinning" /> : <Save size={14} />}
                                <span>{saving ? 'SAVING...' : 'SAVE_CHANGES'}</span>
                            </button>
                        </>
                    )}
                    
                    <button onClick={handleLogout} className="brutalist-icon-btn danger" title="Đăng xuất">
                        <LogOut size={16} />
                    </button>

                    {editorMode === 'story' && (
                        <button 
                            onClick={togglePreview} 
                            className={`brutalist-icon-btn ${isPreviewVisible ? 'active' : ''}`} 
                            title={isPreviewVisible ? "Ẩn Live Preview" : "Mở Live Preview"}
                        >
                            <PanelRight size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Core Workspace Panels */}
            <div className="editor-workspace">
                {/* Sidebar Panel */}
                {isSidebarVisible && (
                    <div className="workspace-sidebar-wrapper" style={{ width: sidebarWidth }}>
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
                            className="splitter-bar" 
                            onMouseDown={() => setIsResizingSidebar(true)}
                        />
                    </div>
                )}

                {/* Script Editor Column */}
                <div className="editor-main-column">
                    {loading ? (
                        <div className="loader-container panel-stripes">
                            <Loader size={48} className="spinning text-terracotta" />
                            <span className="technical-text mt-4">FETCHING_DATABASE_NODE...</span>
                        </div>
                    ) : editorMode === 'story' ? (
                        <div className="script-editor-container">
                            <EditorToolbar onInsert={handleInsertTemplate} />
                            <div className="editor-view-pane">
                                <ScriptEditor
                                    ref={editorRef}
                                    value={scriptText}
                                    onChange={setScriptText}
                                    characters={allCharacters}
                                    eventCharacters={eventCharacters}
                                    assets={allAssets}
                                    height="100%"
                                    theme="dark"
                                />
                            </div>
                        </div>
                    ) : selectedEntity ? (
                        <div className="entity-meta-details panel-stripes">
                            <div className="meta-card">
                                <span className="technical-text meta-type-tag">{selectedEntity.type?.toUpperCase()}</span>
                                <h2 className="meta-entity-title">{selectedEntity.name}</h2>
                                <p className="meta-entity-desc">
                                    {selectedEntity.description || "Không có hồ sơ mô tả cụ thể."}
                                </p>

                                {/* Detailed Managers based on entity type */}
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

                                <span className="meta-tip technical-text">STORY_NODE: EDIT_INFO_IN_LEFT_SIDEBAR</span>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-workspace-state panel-stripes">
                            <div className="empty-message-box">
                                <span className="technical-text text-muted">SYS_AWAITING_SELECTION</span>
                                <p>Chọn một chương cốt truyện từ danh mục Story Tree ở bên trái để bắt đầu viết kịch bản...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Live Preview Column */}
                {isPreviewVisible && editorMode === 'story' && !loading && (
                    <div className="workspace-preview-wrapper" style={{ width: previewWidth }}>
                        <div 
                            className="splitter-bar left" 
                            onMouseDown={() => setIsResizingPreview(true)}
                        />
                        <div className="preview-inner-column">
                            <LivePreview 
                                scriptText={scriptText}
                                name={metadata.name}
                                characters={allCharacters}
                                assets={allAssets}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Modals & Overlays */}
            <AssetPickerModal
                isOpen={pickerOpen}
                filterType={pickerOptions.filter}
                multiSelect={pickerOptions.multi}
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

            <UnsavedChangesModal 
                isOpen={unsavedModalOpen}
                saving={saving}
                onConfirm={handleConfirmDiscard}
                onCancel={() => setUnsavedModalOpen(false)}
                onSaveAndConfirm={handleSaveAndConfirm}
            />
        </div>
    )
}
