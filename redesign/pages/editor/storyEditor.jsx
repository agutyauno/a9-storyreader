import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../src/contexts/AuthContext'
import { ArrowLeft, ExternalLink, Save, Loader, PanelLeft, PanelRight, LogOut, User, X } from 'lucide-react'

import EditorSidebar from './components/sidebar/EditorSidebar'
import EditorToolbar from './components/EditorToolbar'
import ScriptEditor from './components/ScriptEditor'
import LivePreview from './components/LivePreview'

import SuggestionsManager from './components/managers/SuggestionsManager'
import EventCharactersManager from './components/managers/EventCharactersManager'
import EventGalleryManager from './components/managers/EventGalleryManager'

import AssetPickerModal from './components/modals/AssetPickerModal'
import AssetDetailModal from './components/modals/AssetDetailModal'
import AssetPreviewModal from './components/modals/AssetPreviewModal'
import NotificationToast from './components/NotificationToast'
import UnsavedChangesModal from './components/modals/UnsavedChangesModal'

import { StoryScriptParser } from '../../../src/utils/storyParser'
import { SupabaseAPI } from '../../../src/services/supabaseApi'
import './storyEditor.css'

export default function RedesignStoryEditorPage({ isRecord = false }) {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const { storyId, recordId } = useParams()
    const currentId = isRecord ? (recordId || storyId) : storyId
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
        confirmNavigation(() => navigate(isRecord ? '/editor/operator' : '/editor'))
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

    // Story / Record metadata & Script text
    const [metadata, setMetadata] = useState({
        name: 'Untitled Draft',
        description: '',
        display_order: null,
        event_id: null,
        story_id: null,
        operator_id: null,
        record_id: null,
    })

    // Record-specific states
    const [recordReloadTrigger, setRecordReloadTrigger] = useState(0)
    const [newRecordModalOpen, setNewRecordModalOpen] = useState(false)
    const [newRecordTargetOp, setNewRecordTargetOp] = useState(null)
    const [newRecordData, setNewRecordData] = useState({
        record_id: '',
        name: '',
        description: '',
        display_order: 1
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
        const typePrefix = isRecord ? 'Record Editor' : 'Editor'
        if (metadata.name) {
            document.title = `${prefix}${typePrefix}: ${metadata.name} // Civilight Eterna Database`
        } else {
            document.title = `${prefix}${isRecord ? 'Record Editor' : 'Story Editor'} // Admin`
        }
    }, [metadata.name, isDirty, isRecord])

    // Unsaved Changes Modal State
    const [unsavedModalOpen, setUnsavedModalOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState(null)

    // 'story' = code editor, null = select story state
    const [editorMode, setEditorMode] = useState(currentId ? 'story' : null)
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
        async function loadContent() {
            if (!currentId) {
                setScriptText('')
                setEditorMode(null)
                return
            }

            setLoading(true)
            setError(null)
            try {
                if (isRecord) {
                    const item = await SupabaseAPI.getOperatorRecord(currentId)
                    if (!item) {
                        setError(`Không tìm thấy Kí sự cán viên với mã ID "${currentId}".`)
                        return
                    }
                    setMetadata({
                        name: item.name,
                        description: item.description || '',
                        display_order: item.display_order ?? null,
                        operator_id: item.operator_id ?? null,
                        record_id: item.record_id,
                        story_id: item.record_id,
                    })
                    const text = item.story_content?.script || ''
                    setScriptText(text)
                    setInitialScript(text)
                    setEditorMode('story')
                } else {
                    const item = await SupabaseAPI.getStory(currentId)
                    if (!item) {
                        setError(`Không tìm thấy Story với mã ID "${currentId}".`)
                        return
                    }
                    setMetadata({
                        name: item.name,
                        description: item.description || '',
                        display_order: item.display_order ?? null,
                        event_id: item.event_id ?? null,
                        story_id: item.story_id,
                        operator_id: null,
                        record_id: null,
                    })
                    let text = ''
                    if (item.story_content) {
                        text = item.story_content.script || ''
                    }
                    setScriptText(text)
                    setInitialScript(text)
                    setEditorMode('story')
                }
            } catch (err) {
                console.error('Failed to load content:', err)
                setError(isRecord ? 'Không thể tải dữ liệu kí sự cán viên.' : 'Không thể tải dữ liệu cốt truyện.')
            } finally {
                setLoading(false)
            }
        }
        loadContent()
    }, [currentId, isRecord])

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

            if (isRecord) {
                const payload = {
                    name: metadata.name,
                    description: metadata.description,
                    display_order: metadata.display_order,
                    operator_id: metadata.operator_id,
                    story_content: { type: 'vns', script: scriptText },
                }

                if (metadata.record_id) {
                    await SupabaseAPI.updateOperatorRecord(metadata.record_id, payload)
                    setInitialScript(scriptText)
                    if (!silent) showNotification('Đã lưu kịch bản kí sự cán viên!', 'success')
                    return true
                } else {
                    const created = await SupabaseAPI.createOperatorRecord(payload)
                    setMetadata(prev => ({ ...prev, record_id: created.record_id, story_id: created.record_id }))
                    setInitialScript(scriptText)
                    navigate(`/editor/operator/records/${created.record_id}`, { replace: true })
                    if (!silent) showNotification('Kí sự cán viên mới đã được tạo!', 'success')
                    return true
                }
            } else {
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
            }
        } catch (err) {
            console.error('Save failed:', err)
            if (!silent) showNotification('Lưu kịch bản thất bại: ' + (err.message || 'Lỗi hệ thống'), 'error')
            return false
        } finally {
            setSaving(false)
        }
    }

    // Keyboard Shortcuts (Ctrl+S to save, Alt+S to jump to operator detail)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault()
                if (editorMode === 'story' && !saving) {
                    handleSave(false)
                }
            } else if (isRecord && e.altKey && (e.key === 's' || e.key === 'S')) {
                e.preventDefault()
                const targetOp = metadata.operator_id
                confirmNavigation(() => {
                    if (targetOp) {
                        navigate(`/editor/operator/${targetOp}`)
                    } else {
                        navigate('/editor/operator')
                    }
                })
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [editorMode, saving, scriptText, metadata, allCharacters, allAssets, isRecord])

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
        if (isRecord) {
            const targetUrl = metadata.record_id 
                ? `#/operator-record/${metadata.record_id}?preview=1`
                : `#/operator-record/preview?preview=1`
            window.open(targetUrl, '_blank')
        } else {
            window.open('#/story/preview?preview=1', '_blank')
        }
    }

    const handleEntitySelect = (storyIdOrNode, nodeObj) => {
        const targetNode = nodeObj || (typeof storyIdOrNode === 'object' ? storyIdOrNode : null)
        const storyId = typeof storyIdOrNode === 'string' ? storyIdOrNode : (targetNode?.story_id || targetNode?.id)

        const action = () => {
            if (targetNode?.type === 'story' || (storyId && (!targetNode || targetNode.type === 'story'))) {
                if (storyId) navigate(`/editor/story/${storyId}`)
                setEditorMode('story')
                setSelectedEntity(null)
            } else if (targetNode) {
                setSelectedEntity(targetNode)
                setEditorMode(null)
            }
        }
        confirmNavigation(action)
    }

    // Record selection and management handlers
    const handleRecordSelect = (record, operator) => {
        const targetId = typeof record === 'string' ? record : record?.record_id
        const action = () => {
            if (targetId) {
                navigate(`/editor/operator/records/${targetId}`)
            }
            setEditorMode('story')
            setSelectedEntity(null)
        }
        confirmNavigation(action)
    }

    const handleOpenNewRecordModal = (operator) => {
        setNewRecordTargetOp(operator)
        setNewRecordData({
            record_id: `${operator.operator_id}_rec_${(operator.records?.length || 0) + 1}`,
            name: `Kí sự ${(operator.records?.length || 0) + 1}`,
            description: '',
            display_order: (operator.records?.length || 0) + 1
        })
        setNewRecordModalOpen(true)
    }

    const handleCreateRecordSubmit = async (e) => {
        e?.preventDefault?.()
        if (!newRecordData.record_id.trim() || !newRecordData.name.trim()) {
            showNotification('Vui lòng điền mã và tên kí sự!', 'warning')
            return
        }
        try {
            const payload = {
                record_id: newRecordData.record_id.trim(),
                operator_id: newRecordTargetOp.operator_id,
                name: newRecordData.name.trim(),
                description: newRecordData.description || '',
                display_order: Number(newRecordData.display_order) || 1,
                story_content: { type: 'vns', script: `@bg ""\n\n${newRecordTargetOp.name}: ...\n` }
            }
            await SupabaseAPI.createOperatorRecord(payload)
            showNotification(`Đã tạo kí sự "${payload.name}"!`, 'success')
            setNewRecordModalOpen(false)
            setRecordReloadTrigger(prev => prev + 1)
            navigate(`/editor/operator/records/${payload.record_id}`)
        } catch (err) {
            console.error('Create record failed:', err)
            showNotification(`Lỗi tạo kí sự: ${err.message}`, 'error')
        }
    }

    const handleDeleteRecord = (rec, op) => {
        if (window.confirm(`Bạn có chắc muốn xoá kí sự "${rec.name}" của cán viên "${op.name}"?`)) {
            (async () => {
                try {
                    await SupabaseAPI.deleteOperatorRecord(rec.record_id)
                    showNotification(`Đã xoá kí sự "${rec.name}"`, 'success')
                    setRecordReloadTrigger(prev => prev + 1)
                    if (metadata.record_id === rec.record_id) {
                        navigate('/editor/operator/records')
                        setEditorMode(null)
                        setScriptText('')
                    }
                } catch (err) {
                    console.error('Delete record failed:', err)
                    showNotification(`Lỗi xoá kí sự: ${err.message}`, 'error')
                }
            })()
        }
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
                        {isRecord ? (
                            editorMode === 'story'
                                ? `RECORD_COMPILER // ${metadata.name}`
                                : 'RECORD_COMPILER // INITIALIZING'
                        ) : (
                            editorMode === 'story'
                                ? `STORY_COMPILER // ${metadata.name}`
                                : selectedEntity 
                                    ? `${selectedEntity.type.toUpperCase()}_META // ${selectedEntity.name}`
                                    : 'STORY_COMPILER // INITIALIZING'
                        )}
                        {isDirty && <span className="dirty-star">*</span>}
                    </h1>
                </div>

                <div className="header-right">
                    {isRecord && (
                        <button 
                            onClick={() => confirmNavigation(() => navigate(metadata.operator_id ? `/editor/operator/${metadata.operator_id}` : '/editor/operator'))}
                            className="brutalist-btn secondary technical-text"
                            title="Chuyển sang sửa hồ sơ chi tiết cán viên (Alt+S)"
                        >
                            <User size={14} />
                            <span>SỬA HỒ SƠ (ALT+S)</span>
                        </button>
                    )}

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
                            isRecord={isRecord}
                            metadata={metadata}
                            onMetadataChange={setMetadata}
                            onStorySelect={isRecord ? handleRecordSelect : handleEntitySelect}
                            currentStoryId={isRecord ? metadata.record_id : metadata.story_id}
                            reloadRef={sidebarReloadRef}
                            onPickAsset={openPicker}
                            showNotification={showNotification}
                            currentRecordId={metadata.record_id}
                            onRecordSelect={handleRecordSelect}
                            onNewRecord={handleOpenNewRecordModal}
                            onDeleteRecord={handleDeleteRecord}
                            recordReloadTrigger={recordReloadTrigger}
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

                                {/* Detailed Managers based on entity type - EXCLUDED in Record mode */}
                                {!isRecord && selectedEntity.type === 'arc' && (
                                    <SuggestionsManager 
                                        arcId={selectedEntity.arc_id || selectedEntity.id} 
                                        showNotification={showNotification} 
                                    />
                                )}
                                {!isRecord && selectedEntity.type === 'event' && (
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

                                <span className="meta-tip technical-text">
                                    {isRecord ? 'RECORD_NODE: EDIT_INFO_IN_LEFT_SIDEBAR' : 'STORY_NODE: EDIT_INFO_IN_LEFT_SIDEBAR'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-workspace-state panel-stripes">
                            <div className="empty-message-box">
                                <span className="technical-text text-muted">SYS_AWAITING_SELECTION</span>
                                <p>
                                    {isRecord
                                        ? 'Chọn một kí sự từ danh mục bên trái hoặc nhấn nút [+] trên cán viên để tạo mới kịch bản kí sự...'
                                        : 'Chọn một chương cốt truyện từ danh mục Story Tree ở bên trái để bắt đầu viết kịch bản...'
                                    }
                                </p>
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

            {/* Modal Tạo Kí Sự Mới */}
            {newRecordModalOpen && newRecordTargetOp && (
                <div className="redesign-modal-backdrop" onClick={() => setNewRecordModalOpen(false)}>
                    <div className="redesign-modal-container" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
                        <div className="redesign-modal-header">
                            <h3 className="redesign-modal-title">
                                <User size={18} />
                                <span>THÊM KÍ SỰ // {newRecordTargetOp.name}</span>
                            </h3>
                            <button className="redesign-modal-close" onClick={() => setNewRecordModalOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRecordSubmit}>
                            <div className="redesign-modal-body">
                                <div className="redesign-form-group">
                                    <label className="redesign-label">MÃ KÍ SỰ (RECORD_ID):</label>
                                    <input
                                        type="text"
                                        required
                                        className="redesign-input"
                                        value={newRecordData.record_id}
                                        onChange={e => setNewRecordData({ ...newRecordData, record_id: e.target.value })}
                                    />
                                </div>

                                <div className="redesign-form-group">
                                    <label className="redesign-label">TÊN KÍ SỰ:</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: Kí sự 1 - Khởi đầu..."
                                        className="redesign-input"
                                        value={newRecordData.name}
                                        onChange={e => setNewRecordData({ ...newRecordData, name: e.target.value })}
                                    />
                                </div>

                                <div className="redesign-form-group">
                                    <label className="redesign-label">TÓM TẮT HỒ SƠ:</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Mô tả tóm tắt nội dung kí sự..."
                                        className="redesign-textarea"
                                        value={newRecordData.description}
                                        onChange={e => setNewRecordData({ ...newRecordData, description: e.target.value })}
                                    />
                                </div>

                                <div className="redesign-form-group">
                                    <label className="redesign-label">THỨ TỰ HIỂN THỊ (DISPLAY ORDER):</label>
                                    <input
                                        type="number"
                                        className="redesign-input"
                                        value={newRecordData.display_order}
                                        onChange={e => setNewRecordData({ ...newRecordData, display_order: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="redesign-modal-footer">
                                <button type="button" className="redesign-btn" onClick={() => setNewRecordModalOpen(false)}>
                                    HUỶ BỎ
                                </button>
                                <button type="submit" className="redesign-btn primary">
                                    TẠO KÍ SỰ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
