import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../src/contexts/AuthContext'
import { SupabaseAPI } from '../../../src/services/supabaseApi'
import { CLASSES, SUBCLASSES, FACTIONS } from '../operator/operatorMapping'
import ScriptEditor from './components/ScriptEditor'
import LivePreview from './components/LivePreview'
import { 
    ArrowLeft, Save, Trash2, Plus, Edit2, Play, 
    X, Sparkles, Volume2, BookOpen, Layers, 
    User, Check, ChevronRight, Settings, Loader, Copy
} from 'lucide-react'
import './operatorEditor.css'

export default function RedesignOperatorEditorPage() {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const { operatorId: urlOpId } = useParams()

    const [operators, setOperators] = useState([])
    const [selectedOp, setSelectedOp] = useState(null)
    const [loadingList, setLoadingList] = useState(true)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('info') // 'info', 'profile', 'dialogue', 'record'

    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [classFilter, setClassFilter] = useState('')
    const [rarityFilter, setRarityFilter] = useState('')

    // Editor forms state
    const [opId, setOpId] = useState('')
    const [name, setName] = useState('')
    const [appellation, setAppellation] = useState('')
    const [rarity, setRarity] = useState(5)
    const [classId, setClassId] = useState('')
    const [subClassId, setSubClassId] = useState('')
    const [selectedFactions, setSelectedFactions] = useState([])

    // Skins management state
    const [skins, setSkins] = useState([])
    const [showSkinModal, setShowSkinModal] = useState(false)
    const [editingSkin, setEditingSkin] = useState(null)
    const [skinName, setSkinName] = useState('')
    const [skinAvatarUrl, setSkinAvatarUrl] = useState('')
    const [skinFullUrl, setSkinFullUrl] = useState('')
    const [skinDesc, setSkinDesc] = useState('')
    const [skinDefault, setSkinDefault] = useState(false)

    // Profiles management state
    const [profiles, setProfiles] = useState([]) // [{ title: '...', content: '...' }]

    // Dialogues management state
    const [dialogues, setDialogues] = useState([]) // [{ dialogue_id, title, skin_id, text_content, audio_url_jp, ... }]

    // Records management state
    const [records, setRecords] = useState([])
    const [editingRecord, setEditingRecord] = useState(null) // when not null, shows VNScript editor for this record
    const [recordName, setRecordName] = useState('')
    const [recordId, setRecordId] = useState('')
    const [recordDesc, setRecordDesc] = useState('')
    const [recordOrder, setRecordOrder] = useState(1)
    const [recordScript, setRecordScript] = useState('')
    const recordEditorRef = useRef(null)

    // Notification toast helper
    const [toast, setToast] = useState({ message: '', type: 'success' })
    const showToast = (message, type = 'success') => {
        setToast({ message, type })
    }

    // Load operators list
    const loadOperatorsList = async (selectId = null) => {
        try {
            setLoadingList(true)
            const list = await SupabaseAPI.getOperators()
            setOperators(list)
            
            // Auto select operator based on URL or parameter
            const targetId = selectId || urlOpId
            if (targetId) {
                const found = list.find(o => o.operator_id === targetId)
                if (found) {
                    await loadOperatorDetail(found.operator_id)
                }
            }
        } catch (err) {
            console.error('Failed to load operators:', err)
            showToast('Không thể tải danh sách cán viên.', 'error')
        } finally {
            setLoadingList(false)
        }
    }

    useEffect(() => {
        loadOperatorsList()
    }, [urlOpId])

    // Load detailed operator data (skins, profiles, dialogues, records)
    const loadOperatorDetail = async (id) => {
        try {
            setLoadingDetail(true)
            setActiveTab('info')
            setEditingRecord(null)
            
            const op = await SupabaseAPI.getOperator(id)
            if (!op) return

            setSelectedOp(op)
            setOpId(op.operator_id)
            setName(op.name)
            setAppellation(op.appellation || '')
            setRarity(op.rarity ?? 5)
            setClassId(op.class_id || '')
            setSubClassId(op.sub_class_id || '')
            setSelectedFactions(op.factions || [])
            
            // Raw skins from DB
            const dbSkins = await SupabaseAPI.getOperatorSkins(id)
            setSkins(dbSkins)

            // Profiles
            setProfiles(op.profiles || [])

            // Dialogues
            const dbDialogues = await SupabaseAPI.getOperatorDialogues(id)
            setDialogues(dbDialogues)

            // Records
            const dbRecords = await SupabaseAPI.getOperatorRecords(id)
            setRecords(dbRecords)

            // Update URL query quietly
            window.history.pushState(null, '', `# /editor/operator/${id}`)
        } catch (err) {
            console.error('Failed to load operator detail:', err)
            showToast('Lỗi tải chi tiết cán viên.', 'error')
        } finally {
            setLoadingDetail(false)
        }
    }

    // Trigger creating a new blank operator
    const handleNewOperator = () => {
        setSelectedOp({ isNew: true })
        setOpId('char_' + Math.floor(Math.random() * 100000))
        setName('')
        setAppellation('')
        setRarity(5)
        setClassId('')
        setSubClassId('')
        setSelectedFactions([])
        setSkins([])
        setProfiles([
            { title: 'Thông tin cơ bản', content: 'Mã số cán viên:\nGiới tính:\nKinh nghiệm chiến đấu:\nNơi sinh:\nChủng tộc:\nChiều cao:\nTình trạng nhiễm trùng:' },
            { title: 'Đánh giá lâm sàng', content: '' },
            { title: 'Hồ sơ lưu trữ', content: '' }
        ])
        setDialogues([
            { title: 'Trợ lý', text_content: '', skin_id: null },
            { title: 'Thoại 1', text_content: '', skin_id: null },
            { title: 'Thoại 2', text_content: '', skin_id: null }
        ])
        setRecords([])
        setEditingRecord(null)
        setActiveTab('info')
    }

    // Faction selection handler
    const handleFactionToggle = (facId) => {
        if (selectedFactions.includes(facId)) {
            setSelectedFactions(selectedFactions.filter(id => id !== facId))
        } else {
            setSelectedFactions([...selectedFactions, facId])
        }
    }

    // Save operator basic info, skins, profiles, dialogues to Supabase
    const handleSaveOperator = async () => {
        if (!opId.trim() || !name.trim()) {
            showToast('Mã cán viên và Tên không được để trống.', 'error')
            return
        }

        setSaving(true)
        try {
            const payload = {
                operator_id: opId,
                name: name,
                appellation: appellation,
                rarity: rarity,
                class_id: classId || null,
                sub_class_id: subClassId || null,
                factions: selectedFactions,
                lore_info: { profiles: profiles },
                combat_info: selectedOp?.combat_info || {}
            }

            if (selectedOp.isNew) {
                // Check duplicate operator_id first
                const exists = operators.some(o => o.operator_id === opId)
                if (exists) {
                    showToast('Mã cán viên đã tồn tại.', 'error')
                    setSaving(false)
                    return
                }

                // 1. Create operator
                await SupabaseAPI.createOperator(payload)
                
                // 2. Create default skins automatically if none exist
                if (skins.length === 0) {
                    await SupabaseAPI.createSkin({
                        operator_id: opId,
                        name: 'Mặc định',
                        avatar_url: '',
                        full_url: '',
                        description: 'Trang phục mặc định của cán viên.',
                        is_default: true
                    })
                }

                showToast('Đã tạo cán viên thành công!', 'success')
                await loadOperatorsList(opId)
            } else {
                // Update operator
                await SupabaseAPI.updateOperator(selectedOp.operator_id, payload)
                showToast('Đã lưu thông tin cán viên!', 'success')
                await loadOperatorsList(opId)
            }
        } catch (err) {
            console.error('Failed to save operator:', err)
            showToast('Lưu cán viên thất bại: ' + err.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    // Delete operator
    const handleDeleteOperator = async () => {
        if (window.confirm(`Bạn có chắc muốn xoá hoàn toàn cán viên "${name}" cùng tất cả skins, thoại, và kí sự?`)) {
            try {
                setSaving(true)
                await SupabaseAPI.deleteOperator(opId)
                showToast('Đã xoá cán viên thành công.', 'success')
                setSelectedOp(null)
                loadOperatorsList()
            } catch (err) {
                console.error('Delete failed:', err)
                showToast('Xoá cán viên thất bại: ' + err.message, 'error')
            } finally {
                setSaving(false)
            }
        }
    }

    // Skins CRUD
    const handleOpenSkinModal = (skin = null) => {
        if (skin) {
            setEditingSkin(skin)
            setSkinName(skin.name)
            setSkinAvatarUrl(skin.avatar_url || '')
            setSkinFullUrl(skin.full_url || '')
            setSkinDesc(skin.description || '')
            setSkinDefault(skin.is_default || false)
        } else {
            setEditingSkin(null)
            setSkinName('')
            setSkinAvatarUrl('')
            setSkinFullUrl('')
            setSkinDesc('')
            setSkinDefault(skins.length === 0) // if first skin, default to true
        }
        setShowSkinModal(true)
    }

    const handleSaveSkin = async () => {
        if (!skinName.trim()) {
            showToast('Tên skin không được trống.', 'error')
            return
        }

        try {
            const payload = {
                operator_id: opId,
                name: skinName,
                avatar_url: skinAvatarUrl,
                full_url: skinFullUrl,
                description: skinDesc,
                is_default: skinDefault
            }

            if (editingSkin) {
                await SupabaseAPI.updateOperatorSkin(editingSkin.skin_id, payload)
                showToast('Đã cập nhật skin!', 'success')
            } else {
                await SupabaseAPI.createOperatorSkin(payload)
                showToast('Đã tạo skin mới!', 'success')
            }

            setShowSkinModal(false)
            // Reload skins
            const dbSkins = await SupabaseAPI.getOperatorSkins(opId)
            setSkins(dbSkins)
        } catch (err) {
            console.error('Save skin failed:', err)
            showToast('Lưu skin thất bại: ' + err.message, 'error')
        }
    }

    const handleDeleteSkin = async (skinId) => {
        if (window.confirm('Xoá skin này?')) {
            try {
                await SupabaseAPI.deleteOperatorSkin(skinId)
                showToast('Đã xoá skin.', 'success')
                const dbSkins = await SupabaseAPI.getOperatorSkins(opId)
                setSkins(dbSkins)
            } catch (err) {
                showToast('Xoá skin thất bại: ' + err.message, 'error')
            }
        }
    }

    // Profiles CRUD
    const handleAddProfile = () => {
        setProfiles([...profiles, { title: 'Hồ sơ mới', content: '' }])
    }

    const handleUpdateProfile = (idx, field, value) => {
        const updated = [...profiles]
        updated[idx][field] = value
        setProfiles(updated)
    }

    const handleDeleteProfile = (idx) => {
        const updated = profiles.filter((_, i) => i !== idx)
        setProfiles(updated)
    }

    // Dialogues CRUD
    const handleAddDialogue = () => {
        setDialogues([...dialogues, {
            title: 'Thoại mới',
            text_content: '',
            skin_id: null,
            audio_url_jp: '',
            audio_url_en: '',
            audio_url_cn: ''
        }])
    }

    const handleUpdateDialogue = (idx, field, value) => {
        const updated = [...dialogues]
        updated[idx][field] = value
        setDialogues(updated)
    }

    const handleDeleteDialogue = async (idx) => {
        const item = dialogues[idx]
        if (item.dialogue_id) {
            if (window.confirm('Xoá thoại này khỏi cơ sở dữ liệu?')) {
                try {
                    await SupabaseAPI.deleteOperatorDialogue(item.dialogue_id)
                    setDialogues(dialogues.filter((_, i) => i !== idx))
                    showToast('Đã xoá dòng thoại.', 'success')
                } catch (err) {
                    showToast('Xoá thoại thất bại: ' + err.message, 'error')
                }
            }
        } else {
            setDialogues(dialogues.filter((_, i) => i !== idx))
        }
    }

    // Dialogue database batch saver
    const handleSaveDialogues = async () => {
        setSaving(true)
        try {
            const promises = dialogues.map(d => {
                const payload = {
                    operator_id: opId,
                    skin_id: d.skin_id || null,
                    title: d.title,
                    text_content: d.text_content,
                    audio_url_jp: d.audio_url_jp || null,
                    audio_url_en: d.audio_url_en || null,
                    audio_url_cn: d.audio_url_cn || null
                }
                if (d.dialogue_id) {
                    return SupabaseAPI.updateOperatorDialogue(d.dialogue_id, payload)
                } else {
                    return SupabaseAPI.createOperatorDialogue(payload)
                }
            })
            await Promise.all(promises)
            showToast('Đã lưu danh sách thoại cán viên!', 'success')
            // Reload dialogues to get IDs
            const dbDialogues = await SupabaseAPI.getOperatorDialogues(opId)
            setDialogues(dbDialogues)
        } catch (err) {
            console.error('Save dialogues failed:', err)
            showToast('Lưu thoại thất bại: ' + err.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    // Records CRUD / Editing
    const handleOpenRecordScript = (record) => {
        setEditingRecord(record)
        setRecordId(record.record_id || record.id)
        setRecordName(record.name || record.title)
        setRecordDesc(record.description || '')
        setRecordOrder(record.display_order || 1)
        setRecordScript(record.story_content?.script || '')
    }

    const handleNewRecord = () => {
        setEditingRecord({ isNew: true })
        setRecordId('rec_' + opId.replace('char_', '') + '_' + (records.length + 1))
        setRecordName('Kí sự ' + (records.length + 1))
        setRecordDesc('')
        setRecordOrder(records.length + 1)
        setRecordScript('')
    }

    const handleSaveRecord = async () => {
        if (!recordId.trim() || !recordName.trim()) {
            showToast('Mã kí sự và Tên không được trống.', 'error')
            return
        }

        setSaving(true)
        try {
            const payload = {
                record_id: recordId,
                operator_id: opId,
                name: recordName,
                description: recordDesc,
                display_order: recordOrder,
                story_content: { type: 'vns', script: recordScript }
            }

            if (editingRecord.isNew) {
                await SupabaseAPI.createOperatorRecord(payload)
                showToast('Đã tạo kí sự mới!', 'success')
            } else {
                await SupabaseAPI.updateOperatorRecord(recordId, payload)
                showToast('Đã lưu kịch bản kí sự!', 'success')
            }

            setEditingRecord(null)
            // Reload records
            const dbRecords = await SupabaseAPI.getOperatorRecords(opId)
            setRecords(dbRecords)
        } catch (err) {
            console.error('Save record failed:', err)
            showToast('Lưu kí sự thất bại: ' + err.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteRecord = async (recId) => {
        if (window.confirm('Bạn có chắc muốn xoá kí sự này?')) {
            try {
                await SupabaseAPI.deleteOperatorRecord(recId)
                showToast('Đã xoá kí sự.', 'success')
                const dbRecords = await SupabaseAPI.getOperatorRecords(opId)
                setRecords(dbRecords)
            } catch (err) {
                showToast('Xoá kí sự thất bại: ' + err.message, 'error')
            }
        }
    }

    // Filtered operators
    const filteredOps = operators.filter(op => {
        const q = searchQuery.toLowerCase().trim()
        const matchesQuery = !q || op.name.toLowerCase().includes(q) || (op.appellation || '').toLowerCase().includes(q)
        const matchesClass = !classFilter || op.class_id === classFilter
        const matchesRarity = !rarityFilter || op.rarity === Number(rarityFilter)
        return matchesQuery && matchesClass && matchesRarity
    })

    return (
        <div className="op-editor-page">
            {/* Header */}
            <div className="redesign-editor-header app-header">
                <div className="header-left">
                    <button onClick={() => navigate('/editor')} className="brutalist-icon-btn" title="Về Hub">
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="editor-title technical-text">
                        OPERATOR_DATABASE_COMPILER
                    </h1>
                </div>
                <div className="header-right">
                    <button onClick={handleLogout} className="brutalist-icon-btn danger" title="Đăng xuất">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            <div className="op-editor-workspace">
                {/* Left Sidebar - Operators List */}
                <div className="op-sidebar">
                    <div className="op-sidebar-actions">
                        <button onClick={handleNewOperator} className="brutalist-btn primary technical-text w-full">
                            <Plus size={14} />
                            <span>ADD_OPERATOR</span>
                        </button>
                    </div>

                    <div className="op-sidebar-filters">
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm cán viên..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="op-search-input"
                        />
                        <div className="op-filters-row">
                            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="op-filter-select">
                                <option value="">Class</option>
                                {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} className="op-filter-select">
                                <option value="">Rarity</option>
                                {[6, 5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r}★</option>)}
                            </select>
                        </div>
                    </div>

                    {loadingList ? (
                        <div className="op-list-loading technical-text">FETCHING_LIST...</div>
                    ) : (
                        <div className="op-list scrollbar-custom">
                            {filteredOps.map(op => (
                                <div 
                                    key={op.operator_id}
                                    onClick={() => loadOperatorDetail(op.operator_id)}
                                    className={`op-list-item ${selectedOp?.operator_id === op.operator_id ? 'active' : ''}`}
                                >
                                    <div className="op-item-left">
                                        <span className="op-item-name">{op.name}</span>
                                        <span className="op-item-appellation technical-text">{op.appellation}</span>
                                    </div>
                                    <span className="op-item-rarity technical-text">{op.rarity}★</span>
                                </div>
                            ))}
                            {filteredOps.length === 0 && (
                                <div className="op-list-empty technical-text">NO_NODES_FOUND</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Form / Editor Workspace */}
                <div className="op-detail-column">
                    {loadingDetail ? (
                        <div className="op-detail-loader panel-stripes">
                            <Loader size={48} className="spinning text-terracotta" />
                            <span className="technical-text mt-4">RESOLVING_DATA_NODE...</span>
                        </div>
                    ) : selectedOp ? (
                        editingRecord ? (
                            /* Embed VNScript Script Editor for Operator Record */
                            <div className="record-script-workspace">
                                <div className="record-script-header">
                                    <div className="record-header-left">
                                        <button onClick={() => setEditingRecord(null)} className="brutalist-btn secondary technical-text">
                                            <ArrowLeft size={14} />
                                            <span>RETURN_TO_RECORDS</span>
                                        </button>
                                        <h3 className="technical-text ml-4">
                                            RECORD_SCRIPT_EDITOR // {recordName}
                                        </h3>
                                    </div>
                                    <button onClick={handleSaveRecord} className="brutalist-btn primary technical-text" disabled={saving}>
                                        {saving ? <Loader size={14} className="spinning" /> : <Save size={14} />}
                                        <span>SAVE_RECORD_SCRIPT</span>
                                    </button>
                                </div>

                                <div className="record-metadata-row panel-stripes">
                                    <div className="form-grid-3">
                                        <div className="form-group">
                                            <label className="technical-text">RECORD_ID</label>
                                            <input 
                                                type="text" 
                                                value={recordId} 
                                                onChange={(e) => setRecordId(e.target.value)} 
                                                disabled={!editingRecord.isNew}
                                                className="brutalist-input"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="technical-text">RECORD_TITLE</label>
                                            <input 
                                                type="text" 
                                                value={recordName} 
                                                onChange={(e) => setRecordName(e.target.value)} 
                                                className="brutalist-input"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="technical-text">DISPLAY_ORDER</label>
                                            <input 
                                                type="number" 
                                                value={recordOrder} 
                                                onChange={(e) => setRecordOrder(Number(e.target.value))} 
                                                className="brutalist-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group mt-2">
                                        <label className="technical-text">RECORD_DESCRIPTION</label>
                                        <input 
                                            type="text" 
                                            value={recordDesc} 
                                            onChange={(e) => setRecordDesc(e.target.value)} 
                                            placeholder="Nhập mô tả tóm tắt cho kí sự này..."
                                            className="brutalist-input"
                                        />
                                    </div>
                                </div>

                                <div className="record-split-pane">
                                    <div className="record-editor-pane">
                                        <ScriptEditor
                                            ref={recordEditorRef}
                                            value={recordScript}
                                            onChange={setRecordScript}
                                            characters={[]}
                                            assets={[]}
                                            height="100%"
                                        />
                                    </div>
                                    <div className="record-preview-pane">
                                        <LivePreview
                                            scriptText={recordScript}
                                            name={recordName}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* General Operator Details CRUD Panel */
                            <div className="op-detail-card scrollbar-custom">
                                {/* Detail Title Bar */}
                                <div className="op-detail-title-bar">
                                    <div className="op-title-left">
                                        <span className="op-rarity-badge technical-text">{rarity}★</span>
                                        <h2 className="op-name-header">{name || 'Cán viên mới'}</h2>
                                        {appellation && <span className="op-appellation-header technical-text">// {appellation}</span>}
                                    </div>
                                    <div className="op-title-actions">
                                        {!selectedOp.isNew && (
                                            <button onClick={handleDeleteOperator} className="brutalist-btn danger technical-text mr-2" disabled={saving}>
                                                <Trash2 size={14} />
                                                <span>DELETE</span>
                                            </button>
                                        )}
                                        <button onClick={handleSaveOperator} className="brutalist-btn primary technical-text" disabled={saving}>
                                            {saving ? <Loader size={14} className="spinning" /> : <Save size={14} />}
                                            <span>{selectedOp.isNew ? 'CREATE_OPERATOR' : 'SAVE_OPERATOR'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Custom Tabs */}
                                <div className="op-detail-tabs">
                                    {[
                                        { id: 'info', label: 'Thông tin & Skin' },
                                        { id: 'profile', label: 'Hồ sơ' },
                                        { id: 'dialogue', label: 'Lời thoại' },
                                        { id: 'record', label: 'Kí sự' },
                                    ].map(t => (
                                        <button 
                                            key={t.id}
                                            onClick={() => setActiveTab(t.id)}
                                            className={`op-tab-btn technical-text ${activeTab === t.id ? 'active' : ''}`}
                                            disabled={selectedOp.isNew && t.id !== 'info'}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="op-tab-content">
                                    {/* TAB 1: CORE INFO & SKINS */}
                                    {activeTab === 'info' && (
                                        <div className="info-tab-pane">
                                            <div className="form-section panel-stripes">
                                                <h3 className="technical-text section-header">CORE_METADATA</h3>
                                                <div className="form-grid-3">
                                                    <div className="form-group">
                                                        <label className="technical-text">OPERATOR_ID</label>
                                                        <input 
                                                            type="text" 
                                                            value={opId} 
                                                            onChange={(e) => setOpId(e.target.value)} 
                                                            disabled={!selectedOp.isNew}
                                                            placeholder="char_amiya"
                                                            className="brutalist-input"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="technical-text">NAME</label>
                                                        <input 
                                                            type="text" 
                                                            value={name} 
                                                            onChange={(e) => setName(e.target.value)} 
                                                            placeholder="Amiya"
                                                            className="brutalist-input"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="technical-text">APPELLATION</label>
                                                        <input 
                                                            type="text" 
                                                            value={appellation} 
                                                            onChange={(e) => setAppellation(e.target.value)} 
                                                            placeholder="Amiya"
                                                            className="brutalist-input"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-grid-3 mt-4">
                                                    <div className="form-group">
                                                        <label className="technical-text">RARITY</label>
                                                        <select value={rarity} onChange={(e) => setRarity(Number(e.target.value))} className="brutalist-select">
                                                            {[6, 5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Sao</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="technical-text">CLASS</label>
                                                        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="brutalist-select">
                                                            <option value="">Chọn Class</option>
                                                            {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="technical-text">SUBCLASS</label>
                                                        <select value={subClassId} onChange={(e) => setSubClassId(e.target.value)} className="brutalist-select">
                                                            <option value="">Chọn Subclass</option>
                                                            {SUBCLASSES.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group mt-4">
                                                    <label className="technical-text">FACTIONS & SUB-FACTIONS (Chọn nhiều)</label>
                                                    <div className="factions-selector-grid">
                                                        {FACTIONS.map(f => {
                                                            const isSelected = selectedFactions.includes(f.id)
                                                            return (
                                                                <button
                                                                    key={f.id}
                                                                    type="button"
                                                                    onClick={() => handleFactionToggle(f.id)}
                                                                    className={`faction-select-pill ${isSelected ? 'active' : ''} ${f.parentId ? 'sub-fac' : ''}`}
                                                                >
                                                                    {isSelected && <Check size={12} className="mr-1" />}
                                                                    {f.name}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Skins Section */}
                                            {!selectedOp.isNew && (
                                                <div className="skins-section mt-6">
                                                    <div className="skins-section-header">
                                                        <h3 className="technical-text section-header">SKINS_DATABASE</h3>
                                                        <button onClick={() => handleOpenSkinModal(null)} className="brutalist-btn primary technical-text">
                                                            <Plus size={14} />
                                                            <span>ADD_SKIN</span>
                                                        </button>
                                                    </div>

                                                    <div className="skins-grid">
                                                        {skins.map(skin => (
                                                            <div key={skin.skin_id} className="skin-card">
                                                                <div className="skin-card-img-container">
                                                                    {skin.avatar_url ? (
                                                                        <img src={skin.avatar_url} alt={skin.name} className="skin-card-avatar" />
                                                                    ) : (
                                                                        <div className="skin-avatar-placeholder">
                                                                            <User size={24} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="skin-card-body">
                                                                    <div className="skin-card-title-row">
                                                                        <span className="skin-card-name">
                                                                            {skin.name}
                                                                            {skin.is_default && <span className="skin-default-tag technical-text">DEFAULT</span>}
                                                                        </span>
                                                                        <div className="skin-card-actions">
                                                                            <button onClick={() => handleOpenSkinModal(skin)} className="skin-action-icon" title="Sửa skin">
                                                                                <Edit2 size={12} />
                                                                            </button>
                                                                            {!skin.is_default && (
                                                                                <button onClick={() => handleDeleteSkin(skin.skin_id)} className="skin-action-icon danger" title="Xoá skin">
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <span className="skin-card-desc">{skin.description || 'Không có mô tả skin.'}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {skins.length === 0 && (
                                                            <div className="skins-empty technical-text w-full">NO_SKINS_FOUND</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 2: PROFILES */}
                                    {activeTab === 'profile' && (
                                        <div className="profile-tab-pane">
                                            <div className="profile-tab-actions">
                                                <button onClick={handleAddProfile} className="brutalist-btn primary technical-text">
                                                    <Plus size={14} />
                                                    <span>ADD_PROFILE_FILE</span>
                                                </button>
                                            </div>

                                            <div className="profiles-editor-list">
                                                {profiles.map((prof, idx) => (
                                                    <div key={idx} className="profile-editor-card">
                                                        <div className="profile-editor-header">
                                                            <input 
                                                                type="text" 
                                                                value={prof.title} 
                                                                onChange={(e) => handleUpdateProfile(idx, 'title', e.target.value)} 
                                                                className="profile-title-input"
                                                            />
                                                            <button onClick={() => handleDeleteProfile(idx)} className="profile-delete-btn" title="Xoá file này">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <textarea 
                                                            value={prof.content} 
                                                            onChange={(e) => handleUpdateProfile(idx, 'content', e.target.value)} 
                                                            placeholder="Nhập nội dung hồ sơ..."
                                                            rows={6}
                                                            className="profile-content-textarea"
                                                        />
                                                    </div>
                                                ))}
                                                {profiles.length === 0 && (
                                                    <div className="profiles-empty technical-text">NO_LORE_FILES_FOUND</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 3: DIALOGUES */}
                                    {activeTab === 'dialogue' && (
                                        <div className="dialogue-tab-pane">
                                            <div className="dialogue-tab-actions">
                                                <button onClick={handleAddDialogue} className="brutalist-btn primary technical-text mr-2">
                                                    <Plus size={14} />
                                                    <span>ADD_DIALOGUE_LINE</span>
                                                </button>
                                                <button onClick={handleSaveDialogues} className="brutalist-btn secondary technical-text" disabled={saving}>
                                                    {saving ? <Loader size={14} className="spinning" /> : <Save size={14} />}
                                                    <span>SYNC_DIALOGUES_TO_DB</span>
                                                </button>
                                            </div>

                                            <div className="dialogues-table-wrapper scrollbar-custom">
                                                <table className="dialogues-table">
                                                    <thead>
                                                        <tr>
                                                            <th className="technical-text">TITLE</th>
                                                            <th className="technical-text">SKIN_DEPENDENT</th>
                                                            <th className="technical-text">DIALOGUE_TEXT</th>
                                                            <th className="technical-text">AUDIO_JP</th>
                                                            <th className="technical-text">AUDIO_EN</th>
                                                            <th className="technical-text">AUDIO_CN</th>
                                                            <th className="technical-text">ACTIONS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dialogues.map((d, idx) => (
                                                            <tr key={d.dialogue_id || idx}>
                                                                <td>
                                                                    <input 
                                                                        type="text" 
                                                                        value={d.title} 
                                                                        onChange={(e) => handleUpdateDialogue(idx, 'title', e.target.value)} 
                                                                        className="table-input"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <select 
                                                                        value={d.skin_id || ''} 
                                                                        onChange={(e) => handleUpdateDialogue(idx, 'skin_id', e.target.value || null)} 
                                                                        className="table-select"
                                                                    >
                                                                        <option value="">Default (Default / All)</option>
                                                                        {skins.map(s => <option key={s.skin_id} value={s.skin_id}>{s.name}</option>)}
                                                                    </select>
                                                                </td>
                                                                <td>
                                                                    <textarea 
                                                                        value={d.text_content || ''} 
                                                                        onChange={(e) => handleUpdateDialogue(idx, 'text_content', e.target.value)} 
                                                                        rows={2}
                                                                        className="table-textarea"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input 
                                                                        type="text" 
                                                                        value={d.audio_url_jp || ''} 
                                                                        onChange={(e) => handleUpdateDialogue(idx, 'audio_url_jp', e.target.value)} 
                                                                        placeholder="JP Audio URL"
                                                                        className="table-input"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input 
                                                                        type="text" 
                                                                        value={d.audio_url_en || ''} 
                                                                        onChange={(e) => handleUpdateDialogue(idx, 'audio_url_en', e.target.value)} 
                                                                        placeholder="EN Audio URL"
                                                                        className="table-input"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input 
                                                                        type="text" 
                                                                        value={d.audio_url_cn || ''} 
                                                                        onChange={(e) => handleUpdateDialogue(idx, 'audio_url_cn', e.target.value)} 
                                                                        placeholder="CN Audio URL"
                                                                        className="table-input"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <button onClick={() => handleDeleteDialogue(idx)} className="table-delete-icon" title="Xoá dòng thoại">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {dialogues.length === 0 && (
                                                            <tr>
                                                                <td colSpan={7} className="technical-text text-center py-4">NO_DIALOGUES_DECLARED</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 4: RECORDS */}
                                    {activeTab === 'record' && (
                                        <div className="record-tab-pane">
                                            <div className="record-tab-actions">
                                                <button onClick={handleNewRecord} className="brutalist-btn primary technical-text">
                                                    <Plus size={14} />
                                                    <span>ADD_RECORD</span>
                                                </button>
                                            </div>

                                            <div className="records-grid mt-4">
                                                {records.map((rec, idx) => (
                                                    <div key={rec.id || idx} className="record-editor-card panel-stripes">
                                                        <div className="record-card-top">
                                                            <div className="record-card-info">
                                                                <span className="record-card-meta technical-text">REC.{String(idx + 1).padStart(2, '0')} // {rec.record_id}</span>
                                                                <h4 className="record-card-title">{rec.name || rec.title}</h4>
                                                                <p className="record-card-desc">{rec.description || 'Không có mô tả cho kí sự.'}</p>
                                                            </div>
                                                            <div className="record-card-actions">
                                                                <button onClick={() => handleOpenRecordScript(rec)} className="brutalist-btn primary technical-text mr-2">
                                                                    <Edit2 size={12} />
                                                                    <span>EDIT_SCRIPT</span>
                                                                </button>
                                                                <button onClick={() => handleDeleteRecord(rec.record_id)} className="brutalist-btn danger technical-text">
                                                                    <Trash2 size={12} />
                                                                    <span>DELETE</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {records.length === 0 && (
                                                    <div className="records-empty technical-text">NO_RECORDS_DECLARED</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="empty-workspace-state panel-stripes">
                            <div className="empty-message-box">
                                <span className="technical-text text-muted">SYS_AWAITING_SELECTION</span>
                                <p>Chọn một cán viên từ danh sách ở bên trái, hoặc bấm "+ ADD_OPERATOR" để thiết lập hồ sơ cán viên mới...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Skins CRUD Modal */}
            {showSkinModal && (
                <div className="op-modal-backdrop">
                    <div className="op-modal panel-stripes">
                        <div className="op-modal-header">
                            <h3 className="technical-text">
                                {editingSkin ? 'EDIT_SKIN_NODE' : 'CREATE_SKIN_NODE'}
                            </h3>
                            <button onClick={() => setShowSkinModal(false)} className="op-modal-close-btn">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="op-modal-body">
                            <div className="form-group">
                                <label className="technical-text">SKIN_NAME</label>
                                <input 
                                    type="text" 
                                    value={skinName} 
                                    onChange={(e) => setSkinName(e.target.value)} 
                                    placeholder="Époque - Shining Steps"
                                    className="brutalist-input"
                                />
                            </div>
                            <div className="form-group mt-3">
                                <label className="technical-text">AVATAR_IMAGE_URL</label>
                                <input 
                                    type="text" 
                                    value={skinAvatarUrl} 
                                    onChange={(e) => setSkinAvatarUrl(e.target.value)} 
                                    placeholder="https://..."
                                    className="brutalist-input"
                                />
                            </div>
                            <div className="form-group mt-3">
                                <label className="technical-text">FULL_BODY_ARTWORK_URL</label>
                                <input 
                                    type="text" 
                                    value={skinFullUrl} 
                                    onChange={(e) => setSkinFullUrl(e.target.value)} 
                                    placeholder="https://..."
                                    className="brutalist-input"
                                />
                            </div>
                            <div className="form-group mt-3">
                                <label className="technical-text">SKIN_DESCRIPTION</label>
                                <textarea 
                                    value={skinDesc} 
                                    onChange={(e) => setSkinDesc(e.target.value)} 
                                    placeholder="Nhập mô tả skin..."
                                    rows={3}
                                    className="brutalist-input w-full"
                                />
                            </div>
                            <div className="form-group-checkbox mt-3">
                                <input 
                                    type="checkbox" 
                                    id="skin-default-chk"
                                    checked={skinDefault} 
                                    onChange={(e) => setSkinDefault(e.target.checked)} 
                                    disabled={editingSkin?.is_default}
                                />
                                <label htmlFor="skin-default-chk" className="technical-text ml-2">SET_AS_DEFAULT_SKIN</label>
                            </div>
                        </div>
                        <div className="op-modal-footer">
                            <button onClick={() => setShowSkinModal(false)} className="brutalist-btn secondary technical-text">
                                CANCEL
                            </button>
                            <button onClick={handleSaveSkin} className="brutalist-btn primary technical-text ml-2">
                                SAVE_SKIN
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {toast.message && (
                <NotificationToast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: '', type: 'success' })}
                />
            )}
        </div>
    )
}
