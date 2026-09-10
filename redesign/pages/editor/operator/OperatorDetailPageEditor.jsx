import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { SupabaseAPI } from '../../../../src/services/supabaseApi'
import {
    CLASSES, CLASSES_MAP, SUBCLASSES, SUBCLASSES_MAP, FACTIONS, FACTIONS_MAP,
    getHierarchicalFactions
} from '../../operator/operatorMapping'
import ImageUploadField from './components/ImageUploadField'
import AudioUploadField from './components/AudioUploadField'
import {
    ArrowLeft, Save, ExternalLink, BookOpen, Star, Plus, Trash2,
    Edit2, Check, X, Play, Loader2, Image as ImageIcon, Sparkles,
    Shield, Swords, Zap, Clock, Package, Home, Volume2, MoveUp, MoveDown,
    ChevronDown
} from 'lucide-react'
import { getAssetUrl } from '../../../../src/utils/assetUtils'
import '../../operator/operator.css'
import './operatorEditorPages.css'

// Custom renderer for class options with PNG icons
const renderClassOption = (opt) => {
    if (!opt.value) return opt.label
    const clazz = CLASSES_MAP[opt.value]
    const iconUrl = clazz ? getAssetUrl(clazz.icon) : ''
    return (
        <span className="class-option-content">
            <img
                src={iconUrl}
                alt={opt.label}
                className="class-option-img"
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
            />
            <span>{opt.label}</span>
        </span>
    )
}

// Custom renderer for subclass options with PNG icons
const renderSubclassOption = (opt) => {
    if (!opt.value) return opt.label
    const sub = SUBCLASSES_MAP[opt.value]
    const iconUrl = sub ? getAssetUrl(sub.icon) : ''
    return (
        <span className="class-option-content">
            <img
                src={iconUrl}
                alt={opt.label}
                className="class-option-img"
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
            />
            <span>{opt.label}</span>
        </span>
    )
}

// Custom renderer for faction options with SVG/PNG icons
const renderFactionOption = (opt) => {
    if (!opt.value) return opt.label
    const faction = FACTIONS_MAP[opt.value]
    const iconUrl = faction?.icon ? getAssetUrl(faction.icon) : ''
    return (
        <span className="class-option-content">
            {iconUrl ? (
                <img
                    src={iconUrl}
                    alt={opt.label}
                    className="class-option-img"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
            ) : null}
            <span>{opt.label}</span>
        </span>
    )
}

// Custom renderer for rarity options with Stars
const renderRarityOption = (opt) => {
    const r = Number(opt.value)
    return (
        <span className="rarity-option-content">
            <span className="rarity-number">{r}★</span>
            <span className="rarity-stars">
                {Array.from({ length: r }, (_, i) => (
                    <Star key={i} size={11} fill="var(--color-ochre, #BA8530)" strokeWidth={0} />
                ))}
            </span>
        </span>
    )
}

// Reusable Swiss-Brutalist Custom Select Component with Portal rendering to prevent clipping
function CustomSelect({ id, value, onChange, options, placeholder, renderOption }) {
    const [isOpen, setIsOpen] = useState(false)
    const [menuStyle, setMenuStyle] = useState({})
    const toggleRef = useRef(null)
    const menuRef = useRef(null)

    // Calculate position in viewport
    const updatePosition = useCallback(() => {
        if (!toggleRef.current) return
        const rect = toggleRef.current.getBoundingClientRect()

        // If button is off-screen, close menu
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
            setIsOpen(false)
            return
        }

        const menuMaxHeight = 260
        const spaceBelow = window.innerHeight - rect.bottom
        const openUpwards = spaceBelow < menuMaxHeight && rect.top > menuMaxHeight

        setMenuStyle({
            position: 'fixed',
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            top: openUpwards ? 'auto' : `${rect.bottom + 4}px`,
            bottom: openUpwards ? `${window.innerHeight - rect.top + 4}px` : 'auto',
            zIndex: 999999,
            maxHeight: `${menuMaxHeight}px`
        })
    }, [])

    useEffect(() => {
        if (!isOpen) return

        updatePosition()

        const handleScroll = (event) => {
            // Allow user to scroll inside the dropdown menu itself
            if (menuRef.current && menuRef.current.contains(event.target)) {
                return
            }
            updatePosition()
        }

        const handleClickOutside = (event) => {
            if (
                toggleRef.current && !toggleRef.current.contains(event.target) &&
                menuRef.current && !menuRef.current.contains(event.target)
            ) {
                setIsOpen(false)
            }
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('resize', updatePosition)
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('scroll', handleScroll, true)
            window.removeEventListener('resize', updatePosition)
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, updatePosition])

    const handleSelect = (val) => {
        onChange(val)
        setIsOpen(false)
    }

    const selectedOption = options.find(o => o.value === value)

    return (
        <div className="ced-dropdown" id={id}>
            <button
                ref={toggleRef}
                type="button"
                className={`ced-dropdown-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="ced-dropdown-value">
                    {selectedOption ? (
                        renderOption ? renderOption(selectedOption) : selectedOption.label
                    ) : (
                        placeholder
                    )}
                </span>
                <ChevronDown size={14} className="ced-dropdown-caret" />
            </button>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className="ced-dropdown-menu ced-dropdown-portal-menu"
                    style={menuStyle}
                >
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`ced-dropdown-item ${value === opt.value ? 'selected' : ''} ${opt.className || ''}`}
                            onClick={() => handleSelect(opt.value)}
                        >
                            {renderOption ? renderOption(opt) : opt.label}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    )
}

export default function OperatorDetailPageEditor() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isNew = !id || id === 'new'

    // Operator basic state
    const [opId, setOpId] = useState(isNew ? 'char_' + Math.floor(100 + Math.random() * 900) + '_' : id)
    const [name, setName] = useState('')
    const [appellation, setAppellation] = useState('')
    const [rarity, setRarity] = useState(5)
    const [classId, setClassId] = useState('guard')
    const [subClassId, setSubClassId] = useState('')
    const [selectedFactions, setSelectedFactions] = useState(['rhodes_island'])

    // Combat info state
    const [talents, setTalents] = useState([])
    const [skills, setSkills] = useState([])
    const [modules, setModules] = useState([])
    const [baseSkills, setBaseSkills] = useState([])
    const [token, setToken] = useState({ name: '', description: '', imageUrl: '' })

    // Lore / Profiles state
    const [profiles, setProfiles] = useState([
        { title: 'Thông tin cơ bản', content: 'Mã số cán viên:\nGiới tính:\nKinh nghiệm chiến đấu:\nNơi sinh:\nChủng tộc:\nChiều cao:\nTình trạng nhiễm trùng: Chưa phát hiện dấu hiệu nhiễm trùng Originium.' },
        { title: 'Đánh giá lâm sàng', content: 'Kiểm tra y tế cho thấy các chỉ số sinh lý của cán viên hoàn toàn bình thường.' },
        { title: 'Hồ sơ lưu trữ 1', content: '' }
    ])

    // Skins & Dialogues & Records
    const [skins, setSkins] = useState([])
    const [selectedSkinId, setSelectedSkinId] = useState(null)
    const [dialogues, setDialogues] = useState([])
    const [records, setRecords] = useState([])

    // Active tab: 'skill', 'profile', 'dialogue', 'record'
    const [activeTab, setActiveTab] = useState('skill')
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [notification, setNotification] = useState({ message: '', type: 'success' })

    // Modals
    const [skinModalOpen, setSkinModalOpen] = useState(false)
    const [editingSkin, setEditingSkin] = useState(null)
    const [skinForm, setSkinForm] = useState({
        name: '',
        avatar_url: '',
        full_url: '',
        description: '',
        is_default: false
    })

    const [dialogueModalOpen, setDialogueModalOpen] = useState(false)
    const [editingDialogue, setEditingDialogue] = useState(null)
    const [dialogueForm, setDialogueForm] = useState({
        title: '',
        text_content: '',
        skin_id: '',
        audio_url_jp: '',
        audio_url_en: '',
        audio_url_cn: ''
    })

    const [recordModalOpen, setRecordModalOpen] = useState(false)
    const [recordForm, setRecordForm] = useState({
        record_id: '',
        name: '',
        description: '',
        display_order: 1
    })

    const showToast = (message, type = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification({ message: '', type: 'success' }), 4000)
    }

    // Keyboard shortcut Alt + S to switch to record/story editor
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && (e.key === 's' || e.key === 'S')) {
                e.preventDefault()
                const targetOpId = opId || id
                navigate(`/editor/operator/records?operatorId=${targetOpId}`)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [opId, id, navigate])

    // Load operator details if not new
    useEffect(() => {
        if (isNew) {
            setLoading(false)
            return
        }

        async function fetchDetail() {
            setLoading(true)
            try {
                const op = await SupabaseAPI.getOperator(id)
                if (op) {
                    setOpId(op.operator_id)
                    setName(op.name || '')
                    setAppellation(op.appellation || '')
                    setRarity(op.rarity ?? 5)
                    setClassId(op.class_id || 'guard')
                    setSubClassId(op.sub_class_id || '')
                    setSelectedFactions(Array.isArray(op.factions) ? op.factions : ['rhodes_island'])

                    // Combat info
                    const combat = op.combat_info || {}
                    setTalents(combat.talents || [])
                    setSkills(combat.skills || [])
                    setModules(combat.modules || [])
                    setBaseSkills(combat.baseSkills || [])
                    setToken(combat.token || { name: '', description: '', imageUrl: '' })

                    // Lore info
                    const lore = op.lore_info || {}
                    if (lore.profiles && lore.profiles.length > 0) {
                        setProfiles(lore.profiles)
                    }

                    // Skins
                    const dbSkins = await SupabaseAPI.getOperatorSkins(id)
                    setSkins(dbSkins || [])
                    const defaultS = dbSkins?.find(s => s.is_default) || dbSkins?.[0]
                    setSelectedSkinId(defaultS?.skin_id || null)

                    // Dialogues
                    const dbDialogues = await SupabaseAPI.getOperatorDialogues(id)
                    setDialogues(dbDialogues || [])

                    // Records
                    const dbRecords = await SupabaseAPI.getOperatorRecords(id)
                    setRecords(dbRecords || [])
                } else {
                    showToast('Không tìm thấy cán viên: ' + id, 'error')
                }
            } catch (err) {
                console.error('Failed to load operator detail:', err)
                showToast('Lỗi tải dữ liệu: ' + err.message, 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchDetail()
    }, [id, isNew])

    // Current portrait for preview
    const activeSkin = skins.find(s => s.skin_id === selectedSkinId) || skins[0]
    const previewPortrait = activeSkin?.full_url || activeSkin?.avatar_url || ''

    // Available subclasses based on current class
    const availableSubclasses = useMemo(() => {
        return SUBCLASSES.filter(s => s.classId === classId)
    }, [classId])

    // Option lists for CustomSelect dropdowns
    const classOptions = useMemo(() => CLASSES.map(c => ({ value: c.id, label: c.name })), [])
    const subclassOptions = useMemo(() => availableSubclasses.map(s => ({ value: s.id, label: s.name })), [availableSubclasses])
    const factionOptions = useMemo(() => {
        const hierarchical = getHierarchicalFactions()
        return hierarchical.map(f => ({
            value: f.id,
            label: f.displayName || f.name,
            className: f.parentId ? 'sub-faction-option' : 'parent-faction-option'
        }))
    }, [])
    const rarityOptions = useMemo(() => [
        { value: 6, label: '6' },
        { value: 5, label: '5' },
        { value: 4, label: '4' },
        { value: 3, label: '3' },
        { value: 2, label: '2' },
        { value: 1, label: '1' }
    ], [])

    // Save full operator
    const handleSave = async () => {
        if (!opId.trim() || !name.trim()) {
            showToast('Mã cán viên và Tên không được để trống!', 'error')
            return
        }

        setSaving(true)
        try {
            const payload = {
                operator_id: opId.trim(),
                name: name.trim(),
                appellation: appellation.trim(),
                rarity: Number(rarity),
                class_id: classId || null,
                sub_class_id: subClassId || null,
                factions: selectedFactions,
                combat_info: {
                    talents,
                    skills,
                    modules,
                    baseSkills,
                    token
                },
                lore_info: {
                    profiles
                }
            }

            if (isNew) {
                await SupabaseAPI.createOperator(payload)
                // If there are initial skins, create default skin if none exists
                if (skins.length === 0) {
                    await SupabaseAPI.createOperatorSkin({
                        operator_id: opId.trim(),
                        name: 'Mặc định',
                        avatar_url: '',
                        full_url: '',
                        description: 'Trang phục mặc định của cán viên.',
                        is_default: true
                    })
                }
                showToast('Đã tạo cán viên mới thành công!', 'success')
                navigate(`/editor/operator/${opId.trim()}`, { replace: true })
            } else {
                await SupabaseAPI.updateOperator(id, payload)
                showToast('Đã lưu hồ sơ cán viên thành công!', 'success')
            }
        } catch (err) {
            console.error('Save operator failed:', err)
            showToast('Lưu cán viên thất bại: ' + err.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    // ─── SKINS HANDLERS ────────────────────────────────────────────────────────
    const handleOpenSkinModal = (skin = null) => {
        if (skin) {
            setEditingSkin(skin)
            setSkinForm({
                name: skin.name,
                avatar_url: skin.avatar_url || '',
                full_url: skin.full_url || '',
                description: skin.description || '',
                is_default: skin.is_default || false
            })
        } else {
            setEditingSkin(null)
            setSkinForm({
                name: skins.length === 0 ? 'Mặc định' : `Skin ${skins.length + 1}`,
                avatar_url: '',
                full_url: '',
                description: '',
                is_default: skins.length === 0
            })
        }
        setSkinModalOpen(true)
    }

    const handleSaveSkin = async () => {
        if (!skinForm.name.trim()) {
            showToast('Tên skin không được để trống.', 'error')
            return
        }

        try {
            const payload = {
                operator_id: opId,
                name: skinForm.name.trim(),
                avatar_url: skinForm.avatar_url,
                full_url: skinForm.full_url,
                description: skinForm.description,
                is_default: skinForm.is_default
            }

            if (editingSkin) {
                await SupabaseAPI.updateOperatorSkin(editingSkin.skin_id, payload)
                showToast('Đã cập nhật skin.', 'success')
            } else {
                await SupabaseAPI.createOperatorSkin(payload)
                showToast('Đã thêm skin mới.', 'success')
            }

            const updatedSkins = await SupabaseAPI.getOperatorSkins(opId)
            setSkins(updatedSkins || [])
            setSkinModalOpen(false)
        } catch (err) {
            console.error('Save skin error:', err)
            showToast('Lưu skin thất bại: ' + err.message, 'error')
        }
    }

    const handleDeleteSkin = async (skinId) => {
        if (window.confirm('Bạn có chắc muốn xoá skin này?')) {
            try {
                await SupabaseAPI.deleteOperatorSkin(skinId)
                showToast('Đã xoá skin.', 'success')
                const updated = await SupabaseAPI.getOperatorSkins(opId)
                setSkins(updated || [])
            } catch (err) {
                showToast('Xoá skin thất bại: ' + err.message, 'error')
            }
        }
    }

    // ─── TALENTS HANDLERS ──────────────────────────────────────────────────────
    const handleAddTalent = () => {
        setTalents([...talents, { name: `Tài năng ${talents.length + 1}`, description: '' }])
    }
    const handleUpdateTalent = (index, field, val) => {
        const next = [...talents]
        next[index][field] = val
        setTalents(next)
    }
    const handleDeleteTalent = (index) => {
        setTalents(talents.filter((_, i) => i !== index))
    }

    // ─── SKILLS HANDLERS ───────────────────────────────────────────────────────
    const handleAddSkill = () => {
        setSkills([...skills, {
            name: `Kĩ năng ${skills.length + 1}`,
            icon: '',
            initialSp: 0,
            spCost: 0,
            activationType: 'auto',
            spRecoveryType: 'auto',
            duration: '0s',
            description: ''
        }])
    }
    const handleUpdateSkill = (index, field, val) => {
        const next = [...skills]
        next[index][field] = val
        setSkills(next)
    }
    const handleDeleteSkill = (index) => {
        setSkills(skills.filter((_, i) => i !== index))
    }

    // ─── MODULES HANDLERS ──────────────────────────────────────────────────────
    const handleAddModule = () => {
        setModules([...modules, {
            name: `Module ${modules.length + 1}`,
            imageUrl: '',
            lore: '',
            stats: { hp: 120, atk: 45 },
            description: '',
            skillDescription: ''
        }])
    }
    const handleUpdateModule = (index, field, val) => {
        const next = [...modules]
        next[index][field] = val
        setModules(next)
    }
    const handleDeleteModule = (index) => {
        setModules(modules.filter((_, i) => i !== index))
    }

    // ─── BASE SKILLS HANDLERS ──────────────────────────────────────────────────
    const handleAddBaseSkill = () => {
        setBaseSkills([...baseSkills, { name: `Kĩ năng hậu cần ${baseSkills.length + 1}`, icon: '', description: '' }])
    }
    const handleUpdateBaseSkill = (index, field, val) => {
        const next = [...baseSkills]
        next[index][field] = val
        setBaseSkills(next)
    }
    const handleDeleteBaseSkill = (index) => {
        setBaseSkills(baseSkills.filter((_, i) => i !== index))
    }

    // ─── PROFILES HANDLERS ─────────────────────────────────────────────────────
    const handleAddProfile = () => {
        setProfiles([...profiles, { title: `Hồ sơ lưu trữ ${profiles.length}`, content: '' }])
    }
    const handleUpdateProfile = (index, field, val) => {
        const next = [...profiles]
        next[index][field] = val
        setProfiles(next)
    }
    const handleDeleteProfile = (index) => {
        setProfiles(profiles.filter((_, i) => i !== index))
    }
    const handleMoveProfile = (index, direction) => {
        const targetIndex = index + direction
        if (targetIndex < 0 || targetIndex >= profiles.length) return
        const next = [...profiles]
        const temp = next[index]
        next[index] = next[targetIndex]
        next[targetIndex] = temp
        setProfiles(next)
    }

    // ─── DIALOGUES HANDLERS ────────────────────────────────────────────────────
    const handleOpenDialogueModal = (dialogue = null) => {
        if (dialogue) {
            setEditingDialogue(dialogue)
            setDialogueForm({
                title: dialogue.title,
                text_content: dialogue.text_content,
                skin_id: dialogue.skin_id || '',
                audio_url_jp: dialogue.audio_url_jp || '',
                audio_url_en: dialogue.audio_url_en || '',
                audio_url_cn: dialogue.audio_url_cn || ''
            })
        } else {
            setEditingDialogue(null)
            setDialogueForm({
                title: 'Thoại mới',
                text_content: '',
                skin_id: '',
                audio_url_jp: '',
                audio_url_en: '',
                audio_url_cn: ''
            })
        }
        setDialogueModalOpen(true)
    }

    const handleSaveDialogue = async () => {
        if (!dialogueForm.title.trim() || !dialogueForm.text_content.trim()) {
            showToast('Tiêu đề và Nội dung thoại không được để trống.', 'error')
            return
        }

        try {
            const payload = {
                operator_id: opId,
                title: dialogueForm.title.trim(),
                text_content: dialogueForm.text_content.trim(),
                skin_id: dialogueForm.skin_id || null,
                audio_url_jp: dialogueForm.audio_url_jp || null,
                audio_url_en: dialogueForm.audio_url_en || null,
                audio_url_cn: dialogueForm.audio_url_cn || null
            }

            if (editingDialogue) {
                await SupabaseAPI.updateOperatorDialogue(editingDialogue.dialogue_id, payload)
                showToast('Đã cập nhật dòng thoại.', 'success')
            } else {
                await SupabaseAPI.createOperatorDialogue(payload)
                showToast('Đã thêm dòng thoại mới.', 'success')
            }

            const updated = await SupabaseAPI.getOperatorDialogues(opId)
            setDialogues(updated || [])
            setDialogueModalOpen(false)
        } catch (err) {
            console.error('Save dialogue failed:', err)
            showToast('Lưu thoại thất bại: ' + err.message, 'error')
        }
    }

    const handleDeleteDialogue = async (dialogueId) => {
        if (window.confirm('Xoá dòng thoại này?')) {
            try {
                await SupabaseAPI.deleteOperatorDialogue(dialogueId)
                showToast('Đã xoá dòng thoại.', 'success')
                const updated = await SupabaseAPI.getOperatorDialogues(opId)
                setDialogues(updated || [])
            } catch (err) {
                showToast('Xoá thoại thất bại: ' + err.message, 'error')
            }
        }
    }

    // ─── RECORDS HANDLERS ──────────────────────────────────────────────────────
    const handleOpenRecordModal = () => {
        setRecordForm({
            record_id: `rec_${opId.replace('char_', '')}_${records.length + 1}`,
            name: `Kí sự ${records.length + 1}`,
            description: '',
            display_order: records.length + 1
        })
        setRecordModalOpen(true)
    }

    const handleCreateRecord = async () => {
        if (!recordForm.record_id.trim() || !recordForm.name.trim()) {
            showToast('Mã kí sự và Tên không được để trống.', 'error')
            return
        }

        try {
            const payload = {
                record_id: recordForm.record_id.trim(),
                operator_id: opId,
                name: recordForm.name.trim(),
                description: recordForm.description.trim(),
                display_order: Number(recordForm.display_order) || 1,
                story_content: { type: 'vns', script: `// Kịch bản kí sự: ${recordForm.name}\n\n[dialog]\n${name}: Kí sự bắt đầu.\n` }
            }

            await SupabaseAPI.createOperatorRecord(payload)
            showToast('Đã tạo kí sự mới!', 'success')
            const updated = await SupabaseAPI.getOperatorRecords(opId)
            setRecords(updated || [])
            setRecordModalOpen(false)
        } catch (err) {
            console.error('Create record failed:', err)
            showToast('Tạo kí sự thất bại: ' + err.message, 'error')
        }
    }

    const handleDeleteRecord = async (recordId) => {
        if (window.confirm(`Xoá kí sự "${recordId}" cùng kịch bản của nó?`)) {
            try {
                await SupabaseAPI.deleteOperatorRecord(recordId)
                showToast('Đã xoá kí sự.', 'success')
                const updated = await SupabaseAPI.getOperatorRecords(opId)
                setRecords(updated || [])
            } catch (err) {
                showToast('Xoá kí sự thất bại: ' + err.message, 'error')
            }
        }
    }

    if (loading) {
        return (
            <div className="op-editor-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={36} className="spin-animate" color="var(--color-accent-gold, #cf9d46)" />
                    <p className="technical-text" style={{ marginTop: '1rem' }}>LOADING_OPERATOR_DOSSIER...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="op-editor-container">
            {/* Top Pinned Bar */}
            <header className="op-editor-header">
                <div className="op-editor-header-left">
                    <button
                        onClick={() => navigate('/editor/operator')}
                        className="brutalist-icon-btn"
                        title="Quay lại Danh Sách"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <h1 className="op-compact-title technical-text">
                        {isNew ? (
                            <>
                                OPERATOR_DOSSIER // NEW_REGISTRATION
                                <span className="op-count-badge">[NEW]</span>
                            </>
                        ) : (
                            <>
                                OPERATOR_DOSSIER // {name ? name.toUpperCase() : opId}
                                <span className="op-count-badge">[{opId}]</span>
                            </>
                        )}
                    </h1>
                </div>

                <div className="op-editor-header-right">
                    {/* Quick Switcher to Record Editor */}
                    {!isNew && (
                        <button
                            className="brutalist-btn secondary technical-text"
                            onClick={() => navigate(`/editor/operator/records?operatorId=${opId}`)}
                            title="Chuyển sang soạn thảo kịch bản kí sự (Alt + S)"
                        >
                            <BookOpen size={14} />
                            <span>KỊCH BẢN KÍ SỰ (ALT+S)</span>
                        </button>
                    )}

                    {/* View Public Page */}
                    {!isNew && (
                        <a
                            href={`#/operator/${opId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="brutalist-btn secondary technical-text"
                            title="Xem trang hiển thị cho người dùng"
                        >
                            <ExternalLink size={14} />
                            <span>XEM TRANG PUBLIC</span>
                        </a>
                    )}

                    {/* Save Button */}
                    <button
                        className="brutalist-btn primary technical-text"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Loader2 size={14} className="spin-animate" /> : <Save size={14} />}
                        <span>{saving ? 'ĐANG LƯU...' : (isNew ? 'TẠO CÁN VIÊN' : 'LƯU HỒ SƠ')}</span>
                    </button>
                </div>
            </header>

            {/* Notification Toast */}
            {notification.message && (
                <div className={`notification-toast ${notification.type} show`} style={{ position: 'fixed', top: '70px', right: '20px', zIndex: 9999 }}>
                    <span>{notification.message}</span>
                </div>
            )}

            {/* WYSIWYG Editor Body */}
            <main className="content-area operator-page-wrapper operator-detail-page expanded" style={{ padding: '1.25rem 2rem' }}>
                <div className="operator-detail-layout">
                    {/* ─── LEFT COLUMN: Identity & Skins ────────────────────────── */}
                    <div className="operator-left-col">
                        {/* Portrait Preview Frame */}
                        <div className="operator-portrait-wrap">
                            {previewPortrait ? (
                                <img
                                    className="operator-portrait-img"
                                    src={previewPortrait}
                                    alt={name}
                                    onError={(e) => { e.target.style.opacity = '0.3' }}
                                />
                            ) : (
                                <div style={{ height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111318', color: '#666', gap: '0.75rem' }}>
                                    <ImageIcon size={44} strokeWidth={1.5} color="rgba(245, 237, 220, 0.4)" />
                                    <span className="technical-text" style={{ fontSize: '0.75rem', color: 'rgba(245, 237, 220, 0.6)' }}>
                                        CHƯA CÓ ẢNH CHÂN DUNG // THÊM SKIN
                                    </span>
                                </div>
                            )}

                            <div className="operator-rarity-stars" style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '3px', padding: '4px 8px' }}>
                                {Array.from({ length: rarity }, (_, i) => (
                                    <Star key={i} size={15} fill="var(--color-ochre, #BA8530)" strokeWidth={0} />
                                ))}
                            </div>

                            <button
                                className="brutalist-btn secondary technical-text"
                                style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '0.72rem', background: 'rgba(24, 24, 24, 0.85)', color: '#F5EDDC', borderColor: 'rgba(245,237,220,0.4)' }}
                                onClick={() => handleOpenSkinModal()}
                            >
                                <Plus size={13} />
                                <span>Thêm Skin</span>
                            </button>
                        </div>

                        {/* Identity form */}
                        <div className="operator-left-info">
                            {/* Operator ID */}
                            <div className="op-form-group">
                                <label className="op-form-label technical-text" title="MÃ CÁN VIÊN (OPERATOR_ID)">MÃ CÁN VIÊN (OPERATOR_ID):</label>
                                <input
                                    type="text"
                                    className="op-form-input"
                                    value={opId}
                                    onChange={(e) => setOpId(e.target.value)}
                                    disabled={!isNew}
                                    placeholder="char_123_name"
                                    style={{ fontFamily: 'var(--font-mono, monospace)' }}
                                />
                            </div>

                            {/* Name & Appellation */}
                            <div className="op-form-row">
                                <div className="op-form-group">
                                    <label className="op-form-label technical-text" title="TÊN CÁN VIÊN">TÊN CÁN VIÊN:</label>
                                    <input
                                        type="text"
                                        className="op-form-input"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ví dụ: Trần Huy Khiết"
                                    />
                                </div>
                                <div className="op-form-group">
                                    <label className="op-form-label technical-text" title="DANH HIỆU / CODE">DANH HIỆU / CODE NAME:</label>
                                    <input
                                        type="text"
                                        className="op-form-input"
                                        value={appellation}
                                        onChange={(e) => setAppellation(e.target.value)}
                                        placeholder="Ví dụ: Ch'en"
                                    />
                                </div>
                            </div>

                            {/* Rarity & Class with CustomSelect */}
                            <div className="op-form-row">
                                <div className="op-form-group">
                                    <label className="op-form-label technical-text" title="ĐỘ HIẾM (RARITY)">ĐỘ HIẾM (RARITY):</label>
                                    <CustomSelect
                                        id="operator-rarity-select"
                                        value={rarity}
                                        onChange={(val) => setRarity(Number(val))}
                                        options={rarityOptions}
                                        placeholder="Chọn độ hiếm"
                                        renderOption={renderRarityOption}
                                    />
                                </div>
                                <div className="op-form-group">
                                    <label className="op-form-label technical-text" title="CLASS">CLASS:</label>
                                    <CustomSelect
                                        id="operator-class-select"
                                        value={classId}
                                        onChange={(val) => {
                                            setClassId(val)
                                            setSubClassId('')
                                        }}
                                        options={classOptions}
                                        placeholder="Chọn class"
                                        renderOption={renderClassOption}
                                    />
                                </div>
                            </div>

                            {/* Subclass & Faction with CustomSelect */}
                            <div className="op-form-row">
                                <div className="op-form-group">
                                    <label className="op-form-label technical-text" title="SUBCLASS (PHÂN NHÁNH)">SUBCLASS (NHÁNH):</label>
                                    <CustomSelect
                                        id="operator-subclass-select"
                                        value={subClassId}
                                        onChange={(val) => setSubClassId(val)}
                                        options={subclassOptions}
                                        placeholder="-- Chọn Subclass --"
                                        renderOption={renderSubclassOption}
                                    />
                                </div>
                                <div className="op-form-group">
                                    <label className="op-form-label technical-text" title="PHE PHÁI (FACTION)">PHE PHÁI (FACTION):</label>
                                    <CustomSelect
                                        id="operator-faction-select"
                                        value={selectedFactions[0] || 'rhodes_island'}
                                        onChange={(val) => setSelectedFactions([val || 'rhodes_island'])}
                                        options={factionOptions}
                                        placeholder="Chọn phe phái"
                                        renderOption={renderFactionOption}
                                    />
                                </div>
                            </div>

                            {/* Skins Selector & Management */}
                            <div className="operator-skin-selector" style={{ marginTop: '0.5rem', borderTop: '2px solid var(--border-color, #181818)', paddingTop: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                    <span className="op-form-label technical-text" style={{ fontSize: '0.72rem' }}>
                                        DANH SÁCH SKINS [{skins.length}]
                                    </span>
                                    <button
                                        className="brutalist-btn secondary technical-text"
                                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}
                                        onClick={() => handleOpenSkinModal()}
                                    >
                                        <Plus size={12} />
                                        <span>THÊM SKIN</span>
                                    </button>
                                </div>

                                <div className="operator-skin-list">
                                    {skins.map(s => (
                                        <div
                                            key={s.skin_id}
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
                                        >
                                            <button
                                                type="button"
                                                className={`operator-skin-thumb ${selectedSkinId === s.skin_id ? 'active' : ''}`}
                                                onClick={() => setSelectedSkinId(s.skin_id)}
                                                title={`${s.name} ${s.is_default ? '(Mặc định)' : ''}`}
                                                style={{ border: selectedSkinId === s.skin_id ? '2px solid var(--color-terracotta, #B2653B)' : '2px solid #181818' }}
                                            >
                                                {s.avatar_url ? (
                                                    <img src={s.avatar_url} alt={s.name} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', color: '#fff' }}>
                                                        <ImageIcon size={16} />
                                                    </div>
                                                )}
                                            </button>
                                            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.35rem' }}>
                                                <button
                                                    onClick={() => handleOpenSkinModal(s)}
                                                    className="brutalist-icon-btn"
                                                    style={{ width: '22px', height: '22px', border: '1px solid #181818' }}
                                                    title="Sửa skin"
                                                >
                                                    <Edit2 size={10} />
                                                </button>
                                                {!s.is_default && (
                                                    <button
                                                        onClick={() => handleDeleteSkin(s.skin_id)}
                                                        className="brutalist-icon-btn danger"
                                                        style={{ width: '22px', height: '22px', border: '1px solid #181818' }}
                                                        title="Xoá skin"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── RIGHT COLUMN: Tabs (Skill, Profile, Dialogue, Record) ── */}
                    <div className="operator-right-col">
                        {/* Tab buttons */}
                        <div className="op-editor-tabs">
                            <button
                                className={`op-editor-tab-btn ${activeTab === 'skill' ? 'active' : ''}`}
                                onClick={() => setActiveTab('skill')}
                            >
                                <span>KĨ NĂNG</span>
                            </button>
                            <button
                                className={`op-editor-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveTab('profile')}
                            >
                                <span>HỒ SƠ</span>
                            </button>
                            <button
                                className={`op-editor-tab-btn ${activeTab === 'dialogue' ? 'active' : ''}`}
                                onClick={() => setActiveTab('dialogue')}
                            >
                                <span>LỜI THOẠI</span>
                            </button>
                            <button
                                className={`op-editor-tab-btn ${activeTab === 'record' ? 'active' : ''}`}
                                onClick={() => setActiveTab('record')}
                            >
                                <span>KÍ SỰ</span>
                                <span className="tab-count-badge">[{records.length}]</span>
                            </button>
                        </div>

                        {/* Tab 1: Kĩ Năng & Chiến Đấu */}
                        {activeTab === 'skill' && (
                            <div className="op-tab-content-wrapper">
                                {/* Talents section */}
                                <div className="op-content-card">
                                    <div className="op-content-card-header">
                                        <h3 className="op-content-card-title">
                                            <span>Tài Năng ({talents.length})</span>
                                        </h3>
                                        <button className="brutalist-btn secondary" onClick={handleAddTalent}>
                                            <Plus size={13} />
                                            <span>Thêm Tài Năng</span>
                                        </button>
                                    </div>

                                    <div className="op-content-card-body">
                                        {talents.length === 0 ? (
                                            <div className="op-empty-state-card">
                                                <Zap size={28} color="rgba(24, 24, 24, 0.3)" />
                                                <span className="op-empty-state-text">CHƯA CÓ DỮ LIỆU TÀI NĂNG</span>
                                            </div>
                                        ) : (
                                            talents.map((talent, idx) => (
                                                <div key={idx} className="op-sub-card">
                                                    <div className="op-sub-card-header">
                                                        <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                            <span className="technical-text" style={{ color: 'var(--color-terracotta, #B2653B)', fontWeight: 800, fontSize: '0.75rem' }}>
                                                                TALENT_{idx + 1}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                className="op-form-input"
                                                                style={{ flex: 1, height: '30px' }}
                                                                value={talent.name}
                                                                onChange={(e) => handleUpdateTalent(idx, 'name', e.target.value)}
                                                                placeholder="Tên tài năng"
                                                            />
                                                        </div>
                                                        <button
                                                            className="brutalist-icon-btn"
                                                            style={{ marginLeft: '0.5rem' }}
                                                            onClick={() => handleDeleteTalent(idx)}
                                                            title="Xoá tài năng"
                                                        >
                                                            <Trash2 size={13} color="var(--color-crimson, #802520)" />
                                                        </button>
                                                    </div>
                                                    <div className="op-sub-card-body">
                                                        <textarea
                                                            className="op-form-textarea"
                                                            placeholder="Mô tả hiệu ứng tài năng..."
                                                            value={talent.description}
                                                            onChange={(e) => handleUpdateTalent(idx, 'description', e.target.value)}
                                                            rows={2}
                                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Skills section */}
                                <div className="op-content-card">
                                    <div className="op-content-card-header">
                                        <h3 className="op-content-card-title">
                                            <Swords size={16} color="var(--color-terracotta, #B2653B)" />
                                            <span>Kỹ Năng Chiến Đấu ({skills.length})</span>
                                        </h3>
                                        <button className="brutalist-btn secondary" onClick={handleAddSkill}>
                                            <Plus size={13} />
                                            <span>Thêm Kỹ Năng</span>
                                        </button>
                                    </div>

                                    <div className="op-content-card-body">
                                        {skills.length === 0 ? (
                                            <div className="op-empty-state-card">
                                                <span className="op-empty-state-text">CHƯA CÓ KỸ NĂNG CHIẾN ĐẤU</span>
                                            </div>
                                        ) : (
                                            skills.map((skill, idx) => (
                                                <div key={idx} className="op-sub-card">
                                                    <div className="op-sub-card-header">
                                                        <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                            <span className="technical-text" style={{ color: 'var(--color-terracotta, #B2653B)', fontWeight: 800, fontSize: '0.75rem' }}>
                                                                SKILL_{idx + 1}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                className="op-form-input"
                                                                style={{ flex: 1, height: '30px', fontWeight: 600 }}
                                                                value={skill.name}
                                                                onChange={(e) => handleUpdateSkill(idx, 'name', e.target.value)}
                                                                placeholder="Tên kĩ năng"
                                                            />
                                                        </div>
                                                        <button
                                                            className="brutalist-icon-btn"
                                                            style={{ marginLeft: '0.5rem' }}
                                                            onClick={() => handleDeleteSkill(idx)}
                                                            title="Xoá kĩ năng"
                                                        >
                                                            <Trash2 size={13} color="var(--color-crimson, #802520)" />
                                                        </button>
                                                    </div>

                                                    <div className="op-sub-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        {/* Skill Icon */}
                                                        <ImageUploadField
                                                            label="Icon kĩ năng:"
                                                            folderPath="images/operators_images/skills"
                                                            value={skill.icon}
                                                            onChange={(url) => handleUpdateSkill(idx, 'icon', url)}
                                                            placeholder="URL icon kĩ năng hoặc tải lên..."
                                                        />

                                                        {/* SP and Type config */}
                                                        <div className="op-form-row">
                                                            <div className="op-form-group">
                                                                <label className="op-form-label technical-text">SP Ban Đầu:</label>
                                                                <input
                                                                    type="number"
                                                                    className="op-form-input"
                                                                    value={skill.initialSp ?? 0}
                                                                    onChange={(e) => handleUpdateSkill(idx, 'initialSp', Number(e.target.value))}
                                                                />
                                                            </div>
                                                            <div className="op-form-group">
                                                                <label className="op-form-label technical-text">SP Yêu Cầu:</label>
                                                                <input
                                                                    type="number"
                                                                    className="op-form-input"
                                                                    value={skill.spCost ?? 30}
                                                                    onChange={(e) => handleUpdateSkill(idx, 'spCost', Number(e.target.value))}
                                                                />
                                                            </div>
                                                            <div className="op-form-group">
                                                                <label className="op-form-label technical-text">Kích Hoạt:</label>
                                                                <select
                                                                    className="op-form-select"
                                                                    value={skill.activationType || 'auto'}
                                                                    onChange={(e) => handleUpdateSkill(idx, 'activationType', e.target.value)}
                                                                >
                                                                    <option value="auto">Auto (Tự động)</option>
                                                                    <option value="manual">Manual (Thủ công)</option>
                                                                    <option value="passive">Passive (Bị động)</option>
                                                                </select>
                                                            </div>
                                                            <div className="op-form-group">
                                                                <label className="op-form-label technical-text">Hồi SP:</label>
                                                                <select
                                                                    className="op-form-select"
                                                                    value={skill.spRecoveryType || 'auto'}
                                                                    onChange={(e) => handleUpdateSkill(idx, 'spRecoveryType', e.target.value)}
                                                                >
                                                                    <option value="auto">Auto Recovery</option>
                                                                    <option value="offensive">Offensive Recovery</option>
                                                                    <option value="defensive">Defensive Recovery</option>
                                                                    <option value="passive">Passive</option>
                                                                </select>
                                                            </div>
                                                            <div className="op-form-group">
                                                                <label className="op-form-label technical-text">Thời Lượng:</label>
                                                                <input
                                                                    type="text"
                                                                    className="op-form-input"
                                                                    value={skill.duration || '-'}
                                                                    onChange={(e) => handleUpdateSkill(idx, 'duration', e.target.value)}
                                                                    placeholder="20s, Instant, ∞"
                                                                />
                                                            </div>
                                                        </div>

                                                        <textarea
                                                            className="op-form-textarea"
                                                            placeholder="Mô tả chi tiết kỹ năng..."
                                                            value={skill.description}
                                                            onChange={(e) => handleUpdateSkill(idx, 'description', e.target.value)}
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Modules Section */}
                                <div className="op-content-card">
                                    <div className="op-content-card-header">
                                        <h3 className="op-content-card-title">
                                            <span>Module ({modules.length})</span>
                                        </h3>
                                        <button className="brutalist-btn secondary" onClick={handleAddModule}>
                                            <Plus size={13} />
                                            <span>Thêm Module</span>
                                        </button>
                                    </div>

                                    <div className="op-content-card-body">
                                        {modules.length === 0 ? (
                                            <div className="op-empty-state-card">
                                                <Package size={28} color="rgba(24, 24, 24, 0.3)" />
                                                <span className="op-empty-state-text">CHƯA CÓ MODULE NÀO</span>
                                            </div>
                                        ) : (
                                            modules.map((mod, idx) => (
                                                <div key={idx} className="op-sub-card">
                                                    <div className="op-sub-card-header">
                                                        <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                            <span className="technical-text" style={{ color: 'var(--color-terracotta, #B2653B)', fontWeight: 800, fontSize: '0.75rem' }}>
                                                                MOD_{idx + 1}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                className="op-form-input"
                                                                style={{ flex: 1, height: '30px', fontWeight: 600 }}
                                                                value={mod.name}
                                                                onChange={(e) => handleUpdateModule(idx, 'name', e.target.value)}
                                                                placeholder="Tên module..."
                                                            />
                                                        </div>
                                                        <button
                                                            className="brutalist-icon-btn"
                                                            style={{ marginLeft: '0.5rem' }}
                                                            onClick={() => handleDeleteModule(idx)}
                                                            title="Xoá module"
                                                        >
                                                            <Trash2 size={13} color="var(--color-crimson, #802520)" />
                                                        </button>
                                                    </div>

                                                    <div className="op-sub-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        <ImageUploadField
                                                            label="Ảnh banner module:"
                                                            folderPath="images/operators_images/modules"
                                                            value={mod.imageUrl}
                                                            onChange={(url) => handleUpdateModule(idx, 'imageUrl', url)}
                                                            placeholder="URL banner module..."
                                                        />

                                                        <div className="op-form-group">
                                                            <label className="op-form-label technical-text">MÔ TẢ:</label>
                                                            <textarea
                                                                className="op-form-textarea"
                                                                value={mod.lore || ''}
                                                                onChange={(e) => handleUpdateModule(idx, 'lore', e.target.value)}
                                                                placeholder="Mô tả chi tiết..."
                                                                rows={3}
                                                            />
                                                        </div>

                                                        <div className="op-form-group">
                                                            <label className="op-form-label technical-text">MÔ TẢ MODULE:</label>
                                                            <textarea
                                                                className="op-form-textarea"
                                                                value={mod.description || ''}
                                                                onChange={(e) => handleUpdateModule(idx, 'description', e.target.value)}
                                                                rows={2}
                                                            />
                                                        </div>

                                                        <div className="op-form-group">
                                                            <label className="op-form-label technical-text">NÂNG CẤP TÀI NĂNG (TALENT ENHANCEMENT):</label>
                                                            <input
                                                                type="text"
                                                                className="op-form-input"
                                                                value={mod.skillDescription || ''}
                                                                onChange={(e) => handleUpdateModule(idx, 'skillDescription', e.target.value)}
                                                                placeholder="Hiệu ứng tăng cường tài năng..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Base Skills Section */}
                                <div className="op-content-card">
                                    <div className="op-content-card-header">
                                        <h3 className="op-content-card-title">
                                            <span>Kỹ Năng Hậu Cần ({baseSkills.length})</span>
                                        </h3>
                                        <button className="brutalist-btn secondary" onClick={handleAddBaseSkill}>
                                            <Plus size={13} />
                                            <span>Thêm Kỹ Năng Hậu Cần</span>
                                        </button>
                                    </div>

                                    <div className="op-content-card-body">
                                        {baseSkills.length === 0 ? (
                                            <div className="op-empty-state-card">
                                                <Home size={28} color="rgba(24, 24, 24, 0.3)" />
                                                <span className="op-empty-state-text">CHƯA CÓ KỸ NĂNG HẬU CẦN</span>
                                            </div>
                                        ) : (
                                            baseSkills.map((bs, idx) => (
                                                <div key={idx} className="op-sub-card">
                                                    <div className="op-sub-card-header">
                                                        <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                            <span className="technical-text" style={{ color: 'var(--color-terracotta, #B2653B)', fontWeight: 800, fontSize: '0.75rem' }}>
                                                                BASE_{idx + 1}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                className="op-form-input"
                                                                style={{ flex: 1, height: '30px', fontWeight: 600 }}
                                                                value={bs.name}
                                                                onChange={(e) => handleUpdateBaseSkill(idx, 'name', e.target.value)}
                                                                placeholder="Tên kĩ năng..."
                                                            />
                                                        </div>
                                                        <button
                                                            className="brutalist-icon-btn"
                                                            style={{ marginLeft: '0.5rem' }}
                                                            onClick={() => handleDeleteBaseSkill(idx)}
                                                            title="Xoá kĩ năng hậu cần"
                                                        >
                                                            <Trash2 size={13} color="var(--color-crimson, #802520)" />
                                                        </button>
                                                    </div>
                                                    <div className="op-sub-card-body">
                                                        <ImageUploadField
                                                            label="Icon kĩ năng hậu cần:"
                                                            folderPath="images/operators_images/base_skills"
                                                            value={bs.icon || ''}
                                                            onChange={(url) => handleUpdateBaseSkill(idx, 'icon', url)}
                                                            placeholder="URL icon kĩ năng hậu cần hoặc tải lên..."
                                                        />
                                                        <div className="op-form-group">
                                                            <label className="op-form-label technical-text">MÔ TẢ HIỆU ỨNG CĂN CỨ:</label>
                                                            <textarea
                                                                className="op-form-textarea"
                                                                value={bs.description}
                                                                onChange={(e) => handleUpdateBaseSkill(idx, 'description', e.target.value)}
                                                                placeholder="Mô tả hiệu ứng trong căn cứ (Trạm giao thương, Xưởng sản xuất, Ký túc xá...)..."
                                                                rows={2}
                                                                style={{ width: '100%', boxSizing: 'border-box' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Token Section */}
                                <div className="op-content-card">
                                    <div className="op-content-card-header">
                                        <h3 className="op-content-card-title">
                                            <span>Tín Vật (Token)</span>
                                        </h3>
                                    </div>

                                    <div className="op-content-card-body">
                                        <ImageUploadField
                                            label="Ảnh tín vật:"
                                            folderPath="images/operators_images/tokens"
                                            value={token.imageUrl}
                                            onChange={(url) => setToken({ ...token, imageUrl: url })}
                                            placeholder="URL tín vật..."
                                        />
                                        <div className="op-form-row">
                                            <div className="op-form-group">
                                                <label className="op-form-label technical-text">TÊN TÍN VẬT:</label>
                                                <input
                                                    type="text"
                                                    className="op-form-input"
                                                    value={token.name}
                                                    onChange={(e) => setToken({ ...token, name: e.target.value })}
                                                    placeholder="Ví dụ: Dấu ấn gia tộc..."
                                                />
                                            </div>
                                            <div className="op-form-group">
                                                <label className="op-form-label technical-text">MÔ TẢ TÍN VẬT:</label>
                                                <input
                                                    type="text"
                                                    className="op-form-input"
                                                    value={token.description}
                                                    onChange={(e) => setToken({ ...token, description: e.target.value })}
                                                    placeholder="Mô tả ý nghĩa của tín vật..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Hồ Sơ Lưu Trữ */}
                        {activeTab === 'profile' && (
                            <div className="op-tab-content-wrapper">
                                <div className="op-content-card">
                                    <div className="op-content-card-header">
                                        <h3 className="op-content-card-title">
                                            <BookOpen size={16} color="var(--color-terracotta, #B2653B)" />
                                            <span>Hồ Sơ Cán Viên ({profiles.length})</span>
                                        </h3>
                                        <button className="brutalist-btn secondary" onClick={handleAddProfile}>
                                            <Plus size={13} />
                                            <span>Thêm Tập Hồ Sơ</span>
                                        </button>
                                    </div>

                                    <div className="op-content-card-body">
                                        {profiles.length === 0 ? (
                                            <div className="op-empty-state-card">
                                                <BookOpen size={28} color="rgba(24, 24, 24, 0.3)" />
                                                <span className="op-empty-state-text">CHƯA CÓ HỒ SƠ LƯU TRỮ NÀO</span>
                                            </div>
                                        ) : (
                                            profiles.map((prof, idx) => (
                                                <div key={idx} className="op-sub-card">
                                                    <div className="op-sub-card-header">
                                                        <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                            <span className="technical-text" style={{ color: 'var(--color-terracotta, #B2653B)', fontWeight: 800, fontSize: '0.75rem' }}>
                                                                FILE_{String(idx + 1).padStart(2, '0')}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                className="op-form-input"
                                                                style={{ flex: 1, height: '30px', fontWeight: 600 }}
                                                                value={prof.title}
                                                                onChange={(e) => handleUpdateProfile(idx, 'title', e.target.value)}
                                                                placeholder="Tiêu đề hồ sơ..."
                                                            />
                                                        </div>

                                                        <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.5rem', alignItems: 'center' }}>
                                                            <button
                                                                className="brutalist-icon-btn"
                                                                title="Di chuyển lên"
                                                                onClick={() => handleMoveProfile(idx, -1)}
                                                                disabled={idx === 0}
                                                            >
                                                                <MoveUp size={12} />
                                                            </button>
                                                            <button
                                                                className="brutalist-icon-btn"
                                                                title="Di chuyển xuống"
                                                                onClick={() => handleMoveProfile(idx, 1)}
                                                                disabled={idx === profiles.length - 1}
                                                            >
                                                                <MoveDown size={12} />
                                                            </button>
                                                            <button
                                                                className="brutalist-icon-btn"
                                                                title="Xoá hồ sơ"
                                                                onClick={() => handleDeleteProfile(idx)}
                                                            >
                                                                <Trash2 size={13} color="var(--color-crimson, #802520)" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="op-sub-card-body">
                                                        <textarea
                                                            className="op-form-textarea"
                                                            value={prof.content}
                                                            onChange={(e) => handleUpdateProfile(idx, 'content', e.target.value)}
                                                            placeholder="Nội dung hồ sơ..."
                                                            rows={6}
                                                            style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6' }}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Lời Thoại Lồng Tiếng */}
                        {activeTab === 'dialogue' && (
                            <div className="op-tab-content-wrapper">
                                <div className="op-content-card">
                                    <div className="op-content-card-header">
                                        <h3 className="op-content-card-title">
                                            <Volume2 size={16} color="var(--color-terracotta, #B2653B)" />
                                            <span>Lời Thoại Cán Viên ({dialogues.length})</span>
                                        </h3>
                                        <button className="brutalist-btn secondary" onClick={() => handleOpenDialogueModal()}>
                                            <Plus size={13} />
                                            <span>Thêm Lời Thoại</span>
                                        </button>
                                    </div>

                                    <div className="op-content-card-body">
                                        {dialogues.length === 0 ? (
                                            <div className="op-empty-state-card">
                                                <Volume2 size={28} color="rgba(24, 24, 24, 0.3)" />
                                                <span className="op-empty-state-text">CHƯA CÓ DỮ LIỆU LỜI THOẠI</span>
                                            </div>
                                        ) : (
                                            dialogues.map((dlg, idx) => (
                                                <div key={dlg.dialogue_id || idx} className="op-sub-card">
                                                    <div className="op-sub-card-header">
                                                        <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                            <span className="technical-text" style={{ color: 'var(--color-terracotta, #B2653B)', fontWeight: 800, fontSize: '0.75rem' }}>
                                                                LINE_{String(idx + 1).padStart(2, '0')}
                                                            </span>
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{dlg.title}</span>
                                                            {dlg.skin_id && (
                                                                <span className="tab-count-badge">SKIN VARIANT</span>
                                                            )}
                                                        </div>

                                                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                                            {dlg.audio_url_jp && (
                                                                <button
                                                                    className="brutalist-icon-btn"
                                                                    title="Nghe audio JP"
                                                                    onClick={() => {
                                                                        new Audio(dlg.audio_url_jp).play().catch(() => showToast('Không thể phát audio.', 'error'))
                                                                    }}
                                                                >
                                                                    <Volume2 size={12} />
                                                                </button>
                                                            )}
                                                            <button
                                                                className="brutalist-icon-btn"
                                                                title="Sửa dòng thoại"
                                                                onClick={() => handleOpenDialogueModal(dlg)}
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button
                                                                className="brutalist-icon-btn"
                                                                title="Xoá dòng thoại"
                                                                onClick={() => handleDeleteDialogue(dlg.dialogue_id)}
                                                            >
                                                                <Trash2 size={12} color="var(--color-crimson, #802520)" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="op-sub-card-body">
                                                        <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--color-charcoal, #181818)', fontSize: '0.85rem' }}>
                                                            "{dlg.text_content}"
                                                        </p>
                                                        {(dlg.audio_url_jp || dlg.audio_url_en || dlg.audio_url_cn) && (
                                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', fontSize: '0.72rem', color: '#666', fontFamily: 'var(--font-mono, monospace)' }}>
                                                                {dlg.audio_url_jp && <span>JP: Audio ✓</span>}
                                                                {dlg.audio_url_en && <span>EN: Audio ✓</span>}
                                                                {dlg.audio_url_cn && <span>CN: Audio ✓</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 4: Kí Sự Cán Viên (Records) */}
                        {activeTab === 'record' && (
                            <div className="op-tab-content-wrapper">
                                <div className="op-content-card">
                                    <div className="op-content-card-header">
                                        <h3 className="op-content-card-title">
                                            <Sparkles size={16} color="var(--color-terracotta, #B2653B)" />
                                            <span>Danh Sách Kí Sự Cán Viên ({records.length})</span>
                                        </h3>
                                        <button className="brutalist-btn secondary" onClick={handleOpenRecordModal}>
                                            <Plus size={13} />
                                            <span>Thêm Kí Sự Mới</span>
                                        </button>
                                    </div>

                                    <div className="op-content-card-body">
                                        {records.length === 0 ? (
                                            <div className="op-empty-state-card">
                                                <BookOpen size={36} color="var(--color-ochre, #BA8530)" />
                                                <span className="op-empty-state-text">
                                                    CHƯA CÓ KÍ SỰ NÀO ĐƯỢC TẠO
                                                </span>
                                                <button
                                                    className="brutalist-btn primary"
                                                    style={{ marginTop: '0.5rem' }}
                                                    onClick={handleOpenRecordModal}
                                                >
                                                    <Plus size={14} />
                                                    <span>Tạo Kí Sự Đầu Tiên</span>
                                                </button>
                                            </div>
                                        ) : (
                                            records.map((rec, idx) => (
                                                <div
                                                    key={rec.record_id}
                                                    className="op-sub-card"
                                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', gap: '1rem' }}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        <div className="technical-text" style={{ fontSize: '0.72rem', color: 'var(--color-terracotta, #B2653B)', fontWeight: 800 }}>
                                                            REC.{String(idx + 1).padStart(2, '0')} // {rec.record_id}
                                                        </div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', margin: '0.2rem 0', color: 'var(--color-charcoal, #181818)' }}>
                                                            {rec.name || rec.title}
                                                        </div>
                                                        <div style={{ fontSize: '0.82rem', color: '#666' }}>
                                                            {rec.description || 'Chưa có mô tả tóm tắt.'}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        {/* Direct jump to VN Script Editor */}
                                                        <button
                                                            className="brutalist-btn primary"
                                                            onClick={() => navigate(`/editor/operator/records/${rec.record_id}`)}
                                                            title="Mở trình soạn thảo kịch bản kịch tính VN"
                                                        >
                                                            <BookOpen size={13} />
                                                            <span>Soạn Kịch Bản VN</span>
                                                        </button>

                                                        <button
                                                            className="brutalist-icon-btn"
                                                            onClick={() => handleDeleteRecord(rec.record_id)}
                                                            title="Xoá kí sự"
                                                        >
                                                            <Trash2 size={13} color="var(--color-crimson, #802520)" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ─── MODAL: Skin Editor ─────────────────────────────────────── */}
            {skinModalOpen && (
                <div className="op-modal-backdrop" onClick={() => setSkinModalOpen(false)}>
                    <div className="op-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="op-modal-header">
                            <h3 className="op-modal-title">
                                {editingSkin ? 'CHỈNH SỬA SKIN CÁN VIÊN' : 'THÊM SKIN MỚI'}
                            </h3>
                            <button className="op-modal-close" onClick={() => setSkinModalOpen(false)}>
                                &times;
                            </button>
                        </div>

                        <div className="op-modal-body">
                            <div className="op-form-group">
                                <label className="op-form-label technical-text">TÊN SKIN:</label>
                                <input
                                    type="text"
                                    className="op-form-input"
                                    value={skinForm.name}
                                    onChange={(e) => setSkinForm({ ...skinForm, name: e.target.value })}
                                    placeholder="Ví dụ: Mặc định, Epoque - Shining Steps..."
                                />
                            </div>

                            {/* Avatar Upload */}
                            <ImageUploadField
                                label="ẢNH AVATAR (AVATAR_URL):"
                                folderPath="images/operators_images/avatars"
                                value={skinForm.avatar_url}
                                onChange={(url) => setSkinForm({ ...skinForm, avatar_url: url })}
                                hint="Được tải lên thư mục: images/operators_images/avatars"
                            />

                            {/* Full Skin Upload */}
                            <ImageUploadField
                                label="ẢNH CHÂN DUNG TOÀN THÂN (FULL_URL):"
                                folderPath="images/operators_images/full"
                                value={skinForm.full_url}
                                onChange={(url) => setSkinForm({ ...skinForm, full_url: url })}
                                hint="Được tải lên thư mục: images/operators_images/full"
                            />

                            <div className="op-form-group">
                                <label className="op-form-label technical-text">MÔ TẢ TRANG PHỤC:</label>
                                <textarea
                                    className="op-form-textarea"
                                    value={skinForm.description}
                                    onChange={(e) => setSkinForm({ ...skinForm, description: e.target.value })}
                                    placeholder="Giới thiệu về bộ trang phục..."
                                    rows={3}
                                />
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                <input
                                    type="checkbox"
                                    checked={skinForm.is_default}
                                    onChange={(e) => setSkinForm({ ...skinForm, is_default: e.target.checked })}
                                />
                                <span>Đặt làm trang phục mặc định (Default Skin)</span>
                            </label>
                        </div>

                        <div className="op-modal-footer">
                            <button className="brutalist-btn secondary" onClick={() => setSkinModalOpen(false)}>
                                Huỷ
                            </button>
                            <button className="brutalist-btn primary" onClick={handleSaveSkin}>
                                Lưu Skin
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: Dialogue Editor ─────────────────────────────────── */}
            {dialogueModalOpen && (
                <div className="op-modal-backdrop" onClick={() => setDialogueModalOpen(false)}>
                    <div className="op-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="op-modal-header">
                            <h3 className="op-modal-title">
                                {editingDialogue ? 'CHỈNH SỬA DÒNG THOẠI' : 'THÊM DÒNG THOẠI MỚI'}
                            </h3>
                            <button className="op-modal-close" onClick={() => setDialogueModalOpen(false)}>
                                &times;
                            </button>
                        </div>

                        <div className="op-modal-body">
                            <div className="op-form-group">
                                <label className="op-form-label technical-text">TIÊU ĐỀ THOẠI:</label>
                                <input
                                    type="text"
                                    className="op-form-input"
                                    value={dialogueForm.title}
                                    onChange={(e) => setDialogueForm({ ...dialogueForm, title: e.target.value })}
                                    placeholder="Ví dụ: Bổ nhiệm làm Trợ lý, Trận chiến 1..."
                                />
                            </div>

                            <div className="op-form-group">
                                <label className="op-form-label technical-text">NỘI DUNG LỜI THOẠI:</label>
                                <textarea
                                    className="op-form-textarea"
                                    value={dialogueForm.text_content}
                                    onChange={(e) => setDialogueForm({ ...dialogueForm, text_content: e.target.value })}
                                    placeholder="Lời thoại của cán viên..."
                                    rows={4}
                                />
                            </div>

                            <div className="op-form-group">
                                <label className="op-form-label technical-text">SKIN LIÊN KẾT (NẾU LÀ BIẾN THỂ CỦA SKIN):</label>
                                <select
                                    className="op-form-select"
                                    value={dialogueForm.skin_id}
                                    onChange={(e) => setDialogueForm({ ...dialogueForm, skin_id: e.target.value })}
                                >
                                    <option value="">Áp dụng cho tất cả / Mặc định</option>
                                    {skins.map(s => (
                                        <option key={s.skin_id} value={s.skin_id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Audio Upload JP */}
                            <AudioUploadField
                                label="TỆP LỒNG TIẾNG NHẬT BẢN (AUDIO JP):"
                                folderPath="audio/operators_voices/jp"
                                value={dialogueForm.audio_url_jp}
                                onChange={(url) => setDialogueForm({ ...dialogueForm, audio_url_jp: url })}
                                placeholder="URL audio JP hoặc tải tệp lên (.mp3, .wav, .ogg)..."
                                hint="Được tải lên thư mục GitHub: audio/operators_voices/jp"
                            />

                            {/* Audio Upload EN */}
                            <AudioUploadField
                                label="TỆP LỒNG TIẾNG ANH (AUDIO EN):"
                                folderPath="audio/operators_voices/en"
                                value={dialogueForm.audio_url_en}
                                onChange={(url) => setDialogueForm({ ...dialogueForm, audio_url_en: url })}
                                placeholder="URL audio EN hoặc tải tệp lên (.mp3, .wav, .ogg)..."
                                hint="Được tải lên thư mục GitHub: audio/operators_voices/en"
                            />

                            {/* Audio Upload CN */}
                            <AudioUploadField
                                label="TỆP LỒNG TIẾNG TRUNG (AUDIO CN):"
                                folderPath="audio/operators_voices/cn"
                                value={dialogueForm.audio_url_cn}
                                onChange={(url) => setDialogueForm({ ...dialogueForm, audio_url_cn: url })}
                                placeholder="URL audio CN hoặc tải tệp lên (.mp3, .wav, .ogg)..."
                                hint="Được tải lên thư mục GitHub: audio/operators_voices/cn"
                            />
                        </div>

                        <div className="op-modal-footer">
                            <button className="brutalist-btn secondary" onClick={() => setDialogueModalOpen(false)}>
                                Huỷ
                            </button>
                            <button className="brutalist-btn primary" onClick={handleSaveDialogue}>
                                Lưu Dòng Thoại
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: New Record ──────────────────────────────────────── */}
            {recordModalOpen && (
                <div className="op-modal-backdrop" onClick={() => setRecordModalOpen(false)}>
                    <div className="op-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="op-modal-header">
                            <h3 className="op-modal-title">TẠO KÍ SỰ CÁN VIÊN MỚI</h3>
                            <button className="op-modal-close" onClick={() => setRecordModalOpen(false)}>
                                &times;
                            </button>
                        </div>

                        <div className="op-modal-body">
                            <div className="op-form-group">
                                <label className="op-form-label technical-text">MÃ KÍ SỰ (RECORD_ID):</label>
                                <input
                                    type="text"
                                    className="op-form-input"
                                    value={recordForm.record_id}
                                    onChange={(e) => setRecordForm({ ...recordForm, record_id: e.target.value })}
                                    placeholder="rec_silverash_1"
                                />
                            </div>

                            <div className="op-form-group">
                                <label className="op-form-label technical-text">TÊN KÍ SỰ:</label>
                                <input
                                    type="text"
                                    className="op-form-input"
                                    value={recordForm.name}
                                    onChange={(e) => setRecordForm({ ...recordForm, name: e.target.value })}
                                    placeholder="Ví dụ: Kí sự 1 - Gió Lạnh Núi Cao..."
                                />
                            </div>

                            <div className="op-form-group">
                                <label className="op-form-label technical-text">MÔ TẢ TÓM TẮT:</label>
                                <textarea
                                    className="op-form-textarea"
                                    value={recordForm.description}
                                    onChange={(e) => setRecordForm({ ...recordForm, description: e.target.value })}
                                    placeholder="Tóm tắt phân cảnh kí sự..."
                                    rows={3}
                                />
                            </div>

                            <div className="op-form-group">
                                <label className="op-form-label technical-text">THỨ TỰ HIỂN THỊ:</label>
                                <input
                                    type="number"
                                    className="op-form-input"
                                    value={recordForm.display_order}
                                    onChange={(e) => setRecordForm({ ...recordForm, display_order: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="op-modal-footer">
                            <button className="brutalist-btn secondary" onClick={() => setRecordModalOpen(false)}>
                                Huỷ
                            </button>
                            <button className="brutalist-btn primary" onClick={handleCreateRecord}>
                                Tạo Kí Sự
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
