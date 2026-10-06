import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { CLASSES_MAP, SUBCLASSES_MAP, FACTIONS_MAP } from './operatorMapping'
import { SupabaseAPI } from '../../../src/services/supabaseApi'
import { getAssetUrl } from '../../../src/utils/assetUtils'
import { useNotification } from '../../components/Notification'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Loading from '../../components/Loading'
import {
    ArrowLeft, Star, ChevronDown, Play,
    Heart, Swords, Shield, Sparkles,
    Timer, Coins, Square, Zap,
    Home, Package,
    Crosshair, Flame, PlusCircle, Flag, Target, Activity, HelpCircle, Clock,
    BookOpen, ArrowRight, Eye, Edit3
} from 'lucide-react'
import './operator.css'

// ─── Collapsible Component ─────────────────────────────────────────────────────
function Collapsible({ icon, title, children, defaultOpen = false, variant = 'default', headerContent = null }) {
    const [expanded, setExpanded] = useState(defaultOpen)

    return (
        <div className={`collapsible-item variant-${variant} ${expanded ? 'expanded' : ''}`}>
            <div className="collapsible-header" onClick={() => setExpanded(!expanded)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded) } }}>
                {icon && (
                    <div className="collapsible-icon">
                        {typeof icon === 'string' ? <img src={icon} alt="" /> : icon}
                    </div>
                )}
                <div className="collapsible-title-group">
                    <span className="collapsible-title">{title}</span>
                    {headerContent}
                </div>
                <ChevronDown size={16} className="collapsible-chevron" />
            </div>
            <div className="collapsible-body">
                <div className="collapsible-content">
                    {children}
                </div>
            </div>
        </div>
    )
}

// ─── Class & Subclass Icon Helpers ──────────────────────────────────────────────
const getClassIconUrl = (classId) => {
    const clazz = CLASSES_MAP[classId];
    return clazz ? getAssetUrl(clazz.icon) : '';
}

const getSubclassIconUrl = (subclassId, classId) => {
    const subclass = SUBCLASSES_MAP[subclassId];
    if (subclass) return getAssetUrl(subclass.icon);
    const clazz = CLASSES_MAP[classId];
    return clazz ? getAssetUrl(clazz.icon) : '';
}

// ─── SP Recovery Helpers ───────────────────────────────────────────────────────
const getSpRecoveryLabel = (val) => {
    if (!val || val === '-') return ''
    const s = String(val).trim().toLowerCase()
    if (s === 'auto' || s === 'tự sạc' || s === 'tu sac' || s.includes('auto')) return 'Tự Sạc'
    if (s === 'offensive' || s === 'công sạc' || s === 'cong sac' || s.includes('offensive')) return 'Công Sạc'
    if (s === 'defensive' || s === 'thủ sạc' || s === 'thu sac' || s.includes('defensive')) return 'Thủ Sạc'
    if (s === 'passive' || s === 'bị động' || s === 'bi dong' || s.includes('passive')) return 'Bị Động'
    return val
}

const getSpRecoveryClass = (val) => {
    if (!val) return 'auto'
    const s = String(val).trim().toLowerCase()
    if (s === 'auto' || s === 'tự sạc' || s === 'tu sac' || s.includes('auto')) return 'auto'
    if (s === 'offensive' || s === 'công sạc' || s === 'cong sac' || s.includes('offensive')) return 'offensive'
    if (s === 'defensive' || s === 'thủ sạc' || s === 'thu sac' || s.includes('defensive')) return 'defensive'
    if (s === 'passive' || s === 'bị động' || s === 'bi dong' || s.includes('passive')) return 'passive'
    return 'auto'
}

// ─── Activation Type Helpers ───────────────────────────────────────────────────
const getActivationLabel = (val) => {
    if (!val) return ''
    const s = String(val).trim().toLowerCase()
    if (s === 'auto' || s === 'tự động' || s === 'tu dong' || s.includes('auto')) return 'Tự Động'
    if (s === 'manual' || s === 'thủ công' || s === 'thu cong' || s.includes('manual')) return 'Thủ Công'
    if (s === 'passive' || s === 'bị động' || s === 'bi dong' || s.includes('passive')) return 'Bị Động'
    return val
}

const getActivationClass = (val) => {
    if (!val) return 'auto'
    const s = String(val).trim().toLowerCase()
    if (s === 'auto' || s === 'tự động' || s === 'tu dong' || s.includes('auto')) return 'auto'
    if (s === 'manual' || s === 'thủ công' || s === 'thu cong' || s.includes('manual')) return 'manual'
    if (s === 'passive' || s === 'bị động' || s === 'bi dong' || s.includes('passive')) return 'passive'
    return s
}

// ─── Skill Tab Content ─────────────────────────────────────────────────────────
function SkillTab({ operator }) {
    const classIconUrl = getClassIconUrl(operator.class)
    const subclassIconUrl = getSubclassIconUrl(operator.subclass, operator.class)

    return (
        <>
            {/* Class / Subclass Info */}
            <div className="operator-class-info">
                <div className="operator-class-block">
                    <span className="operator-class-label">Class</span>
                    <div className="operator-class-value-with-icon">
                        {classIconUrl && (
                            <img
                                src={classIconUrl}
                                alt={CLASSES_MAP[operator.class]?.name}
                                className="operator-class-icon-inline-img"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}
                        <span className="operator-class-name">{CLASSES_MAP[operator.class]?.name}</span>
                    </div>
                </div>
                <div className="operator-class-block">
                    <span className="operator-class-label">Subclass</span>
                    <div className="operator-class-value-with-icon">
                        {subclassIconUrl && (
                            <img
                                src={subclassIconUrl}
                                alt={SUBCLASSES_MAP[operator.subclass]?.name}
                                className="operator-class-icon-inline-img"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}
                        <span className="operator-class-name">{SUBCLASSES_MAP[operator.subclass]?.name}</span>
                    </div>
                    {SUBCLASSES_MAP[operator.subclass]?.description && (
                        <span className="operator-subclass-desc">{SUBCLASSES_MAP[operator.subclass].description}</span>
                    )}
                </div>
            </div>

            {/* Talents */}
            {operator.talents.length > 0 && (
                <div className="operator-section">
                    <div className="operator-section-title">Thiên Phú</div>
                    {operator.talents.map((talent, idx) => (
                        <Collapsible
                            key={idx}
                            icon={null}
                            title={talent.name}
                            subtitle={`Talent ${idx + 1}`}
                            defaultOpen={idx === 0}
                            variant="talent"
                        >
                            <p className="skill-description">{talent.description}</p>
                        </Collapsible>
                    ))}
                </div>
            )}

            {/* Skills */}
            {operator.skills.length > 0 && (
                <div className="operator-section">
                    <div className="operator-section-title">Kỹ Năng ({operator.skills.length})</div>
                    {operator.skills.map((skill, idx) => {
                        const hasInitSp = skill.initialSp !== undefined && skill.initialSp !== null && skill.initialSp !== '-' && skill.initialSp !== 0;
                        const hasSpCost = skill.spCost !== undefined && skill.spCost !== null && skill.spCost !== '-' && skill.spCost !== 0;

                        return (
                            <Collapsible
                                key={idx}
                                icon={
                                    <div className="skill-icon-inner">
                                        {skill.icon ? (
                                            <img
                                                src={getAssetUrl(skill.icon)}
                                                alt=""
                                                className="skill-icon-img"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <Zap className="skill-icon-placeholder" />
                                        )}
                                        {(hasInitSp || hasSpCost) && (
                                            <div className="skill-icon-sp-wrapper">
                                                {hasInitSp && (
                                                    <span className="skill-icon-badge init-sp-badge">
                                                        <Play size={10} className="badge-icon init-sp-icon" fill="currentColor" strokeWidth={0} />
                                                        {skill.initialSp}
                                                    </span>
                                                )}
                                                {hasSpCost && (
                                                    <span className="skill-icon-badge sp-cost-badge">
                                                        <Zap size={10} className="badge-icon sp-cost-icon" fill="currentColor" strokeWidth={0} />
                                                        {skill.spCost}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                }
                                title={skill.name}
                                defaultOpen={idx === 0}
                                variant="skill"
                                headerContent={
                                    <div className="skill-meta-row">
                                        <div className="skill-meta-group primary-group">
                                            {skill.activationType && (
                                                <span className={`skill-meta-tag activation-tag type-${getActivationClass(skill.activationType)}`}>
                                                    {getActivationLabel(skill.activationType)}
                                                </span>
                                            )}
                                            {skill.spRecoveryType && skill.spRecoveryType !== '-' && getActivationClass(skill.activationType) !== 'passive' && (
                                                <span className={`skill-meta-tag recovery-tag type-${getSpRecoveryClass(skill.spRecoveryType)}`}>
                                                    {getSpRecoveryLabel(skill.spRecoveryType)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="skill-meta-group secondary-group">
                                            <span className="skill-meta-tag duration-tag">
                                                <Clock size={12} className="meta-icon" />
                                                {(!skill.duration ||
                                                    skill.duration.toString().toLowerCase() === 'instant' ||
                                                    skill.duration === '∞') ? '-' : skill.duration}
                                            </span>
                                        </div>
                                    </div>
                                }
                            >
                                <p className="skill-description">{skill.description}</p>
                            </Collapsible>
                        )
                    })}
                </div>
            )}

            {/* Modules */}
            {operator.modules.length > 0 && (
                <div className="operator-section">
                    <div className="operator-section-title">Modules ({operator.modules.length})</div>
                    {operator.modules.map((mod, idx) => (
                        <Collapsible
                            key={idx}
                            icon={mod.icon ? (
                                <img
                                    src={getAssetUrl(mod.icon)}
                                    alt={mod.name}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ) : null}
                            title={mod.name}
                            subtitle={`Module ${idx + 1}`}
                            variant="module"
                        >
                            <div className="module-collapsible-content">
                                {mod.imageUrl && (
                                    <div className="module-banner-container">
                                        <img
                                            src={getAssetUrl(mod.imageUrl)}
                                            alt={mod.name}
                                            className="module-banner-image"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                )}
                                <div className="module-text-container">
                                    {mod.lore && (
                                        <p className="module-lore-text">
                                            <em>"{mod.lore}"</em>
                                        </p>
                                    )}
                                    <p className="skill-description">{mod.description}</p>
                                    {mod.skillDescription && (
                                        <p className="skill-description" style={{ marginTop: '0.5rem' }}>
                                            <strong>cải thiện thiên phú</strong> {mod.skillDescription}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Collapsible>
                    ))}
                </div>
            )}

            {/* Base Skills */}
            {operator.baseSkills.length > 0 && (
                <div className="operator-section">
                    <div className="operator-section-title">Kỹ năng hậu cần</div>
                    {operator.baseSkills.map((bs, idx) => (
                        <div key={idx} className="base-skill-item">
                            <div className="base-skill-icon">
                                {bs.icon ? (
                                    <img
                                        src={getAssetUrl(bs.icon)}
                                        alt={bs.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <Home size={16} />
                                )}
                            </div>
                            <div className="base-skill-info">
                                <span className="base-skill-name">{bs.name}</span>
                                <span className="base-skill-desc">{bs.description}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Token */}
            {operator.token && (
                <div className="operator-section">
                    <div className="operator-section-title">Tín vật</div>
                    <div className="operator-token-card">
                        {operator.token.imageUrl ? (
                            <img
                                className="operator-token-img"
                                src={getAssetUrl(operator.token.imageUrl)}
                                alt={operator.token.name || 'Token'}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div></div>
                        )}
                        <div className="operator-token-info">
                            {operator.token.name && (
                                <span className="operator-token-name">{operator.token.name}</span>
                            )}
                            <span className="operator-token-desc">{operator.token.description}</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// ─── Profile Tab Content ───────────────────────────────────────────────────────
function ProfileTab({ operator }) {
    return (
        <div className="operator-section">
            <div className="operator-section-title">Hồ Sơ Cán Viên</div>
            {operator.profiles.map((profile, idx) => (
                <Collapsible
                    key={idx}
                    title={profile.title}
                    subtitle={`File ${String(idx + 1).padStart(2, '0')}`}
                    defaultOpen={idx === 0}
                    variant="profile"
                >
                    <div className="skill-description" style={{ whiteSpace: 'pre-wrap' }}>
                        {profile.content}
                    </div>
                </Collapsible>
            ))}
        </div>
    )
}

// ─── Dialogue Tab Content ──────────────────────────────────────────────────────
function DialogueTab({ operator, selectedSkinId }) {
    const [voiceLang, setVoiceLang] = useState('JP')
    const { showNotification } = useNotification()

    const handlePlayVoice = (dialogue) => {
        const rawUrl = dialogue.voiceLines?.[voiceLang]
        const voiceUrl = rawUrl ? getAssetUrl(rawUrl) : ''
        if (voiceUrl) {
            const audio = new Audio(voiceUrl)
            audio.play().catch(() => {
                showNotification('warning', 'Playback Error', 'Không thể phát âm thanh từ tệp này.')
            })
        } else {
            showNotification('info', 'Audio Unavailable', `Voice line (${voiceLang}) chưa có trong cơ sở dữ liệu.`)
        }
    }

    // Check if current skin has any dialogue variants
    const hasSkinVariants = selectedSkinId && selectedSkinId !== 'default' &&
        operator.dialogues.some(d => d.skinVariants?.[selectedSkinId])

    return (
        <>
            {/* Language Selector */}
            <div className="dialogue-lang-selector">
                <span className="dialogue-lang-label">Ngôn ngữ lồng tiếng:</span>
                {['JP', 'CN', 'EN'].map(lang => (
                    <button
                        key={lang}
                        className={`dialogue-lang-btn ${voiceLang === lang ? 'active' : ''}`}
                        onClick={() => setVoiceLang(lang)}
                    >
                        {lang}
                    </button>
                ))}
            </div>

            {/* Skin variant notice */}
            {hasSkinVariants && (
                <div className="dialogue-skin-notice">
                    <Sparkles size={14} />
                    <span>Một số lời thoại đã thay đổi theo skin đang chọn.</span>
                </div>
            )}

            <div className="operator-section">
                <div className="operator-section-title">Lời thoại</div>
                {operator.dialogues.map((dialogue, idx) => {
                    // Use skin-specific content if available
                    const displayContent = (selectedSkinId && dialogue.skinVariants?.[selectedSkinId])
                        ? dialogue.skinVariants[selectedSkinId]
                        : dialogue.content

                    const isSkinVariant = selectedSkinId && dialogue.skinVariants?.[selectedSkinId]

                    return (
                        <Collapsible
                            key={idx}
                            icon={
                                <button
                                    className="dialogue-play-btn"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handlePlayVoice(dialogue)
                                    }}
                                    title={`Play ${voiceLang} voice`}
                                >
                                    <Play size={12} />
                                </button>
                            }
                            title={dialogue.title}
                            subtitle={isSkinVariant ? '✦ SKIN' : undefined}
                            variant="dialogue"
                        >
                            <p className="skill-description">
                                {displayContent}
                            </p>
                        </Collapsible>
                    )
                })}
            </div>
        </>
    )
}

// ─── Record Tab Content ────────────────────────────────────────────────────────
function RecordTab({ operator }) {
    if (!operator.records || operator.records.length === 0) {
        return (
            <div className="operator-section">
                <div className="operator-section-title">Ký sự</div>
                <div className="operator-empty-state" style={{ margin: 0, border: 'var(--border-thin)' }}>
                    <span className="operator-empty-text technical-text">
                        NO_RECORDS_AVAILABLE // DATA_NOT_FOUND
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="operator-section">
            <div className="operator-section-title">ký sự ({operator.records.length})</div>
            <div className="operator-records-list">
                {operator.records.map((record, idx) => (
                    <Link
                        key={record.id || idx}
                        to={`/operator-record/${record.id}`}
                        className="record-item record-link-card"
                        title={`Đọc kịch bản: ${record.title}`}
                    >
                        <div className="record-item-top">
                            <span className="record-item-meta technical-text">REC.{String(idx + 1).padStart(2, '0')} // {record.id}</span>
                            <BookOpen size={14} className="record-item-icon" />
                        </div>
                        <span className="record-item-title">{record.title}</span>
                        {record.description && <span className="record-item-desc">{record.description}</span>}
                        <div className="record-item-action technical-text">
                            <span>ĐỌC Ký SỰ</span>
                            <ArrowRight size={12} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function OperatorDetailPage({ isPreview: isPreviewProp = false }) {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search])
    const isPreview = isPreviewProp || queryParams.get('preview') === '1' || queryParams.get('preview') === 'true' || id === 'preview'

    const [operator, setOperator] = useState(null)
    const [isDraft, setIsDraft] = useState(false)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('skill')
    const [selectedSkinId, setSelectedSkinId] = useState('default')
    const [isPortraitModalOpen, setIsPortraitModalOpen] = useState(false)

    const BASE_URL = import.meta.env.BASE_URL || '/'

    useEffect(() => {
        async function fetchOperatorDetail() {
            try {
                setLoading(true)
                let data = null
                let records = []

                // 1. If in preview mode, try reading from sessionStorage first
                if (isPreview) {
                    const raw = sessionStorage.getItem('preview_operator')
                    if (raw) {
                        try {
                            const parsed = JSON.parse(raw)
                            // If previewing generic 'preview' or ID matches
                            if (!id || id === 'preview' || parsed.operator_id === id || parsed.id === id) {
                                data = parsed
                                records = parsed.records || []
                            }
                        } catch (e) {
                            console.warn('Error reading preview_operator from sessionStorage:', e)
                        }
                    }
                }

                // 2. If not found in session or not a session preview, fetch from Supabase by ID
                if (!data && id && id !== 'preview') {
                    data = await SupabaseAPI.getOperator(id)
                    if (data) {
                        const recs = await SupabaseAPI.getOperatorRecords(id)
                        records = recs || []
                    }
                }

                if (data) {
                    // Check draft status: ONLY block when NOT in preview mode!
                    if (data.status === 'draft' && !isPreview) {
                        setIsDraft(true)
                        setOperator(null)
                        document.title = `HỒ SƠ SOẠN THẢO // Civilight Eterna Database`
                        return
                    }

                    setIsDraft(false)

                    // Normalize skins
                    const rawSkins = Array.isArray(data.skins) ? data.skins : []
                    const skins = rawSkins.map((s, idx) => ({
                        ...s,
                        id: s.skin_id || s.id || `skin_${idx}`,
                        name: s.name || 'Mặc định',
                        avatar_url: s.avatar_url ? getAssetUrl(s.avatar_url) : '',
                        full_url: s.full_url ? getAssetUrl(s.full_url) : '',
                        portraitUrl: getAssetUrl(s.full_url || s.avatar_url || ''),
                        avatarUrl: s.avatar_url ? getAssetUrl(s.avatar_url) : '',
                        description: s.description || '',
                        is_default: !!s.is_default,
                        display_order: Number(s.display_order ?? idx)
                    })).sort((a, b) => {
                        const diff = (Number(a.display_order) || 0) - (Number(b.display_order) || 0)
                        if (diff !== 0) return diff
                        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
                        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
                        return timeA - timeB
                    })
                    const defaultSkin = skins.find(s => s.is_default) || skins[0]

                    // Normalize dialogues
                    const rawDialogues = Array.isArray(data.dialogues) ? data.dialogues : []
                    const dialogues = rawDialogues.map((d, idx) => ({
                        ...d,
                        id: d.dialogue_id || d.id || `dlg_${idx}`,
                        title: d.title || `Thoại ${idx + 1}`,
                        content: d.text_content || d.content || '',
                        display_order: Number(d.display_order ?? (idx + 1)),
                        voiceLines: d.voiceLines || {
                            JP: d.audio_url_jp ? getAssetUrl(d.audio_url_jp, 'audio') : '',
                            EN: d.audio_url_en ? getAssetUrl(d.audio_url_en, 'audio') : '',
                            CN: d.audio_url_cn ? getAssetUrl(d.audio_url_cn, 'audio') : ''
                        }
                    })).sort((a, b) => {
                        const diff = (Number(a.display_order) || 0) - (Number(b.display_order) || 0)
                        if (diff !== 0) return diff
                        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
                        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
                        return timeA - timeB
                    })

                    // Normalize combat info
                    const talents = Array.isArray(data.talents) ? data.talents : (Array.isArray(data.combat_info?.talents) ? data.combat_info.talents : [])
                    const rawSkills = Array.isArray(data.skills) ? data.skills : (Array.isArray(data.combat_info?.skills) ? data.combat_info.skills : [])
                    const skillsList = rawSkills.map(sk => ({
                        ...sk,
                        icon: sk.icon ? getAssetUrl(sk.icon) : ''
                    }))
                    const rawModules = Array.isArray(data.modules) ? data.modules : (Array.isArray(data.combat_info?.modules) ? data.combat_info.modules : [])
                    const modulesList = rawModules.map(m => ({
                        ...m,
                        icon: m.icon ? getAssetUrl(m.icon) : '',
                        imageUrl: m.imageUrl ? getAssetUrl(m.imageUrl) : ''
                    }))
                    const rawBaseSkills = Array.isArray(data.baseSkills) ? data.baseSkills : (Array.isArray(data.combat_info?.base_skills || data.combat_info?.baseSkills) ? (data.combat_info.base_skills || data.combat_info.baseSkills) : [])
                    const baseSkillsList = rawBaseSkills.map(bs => ({
                        ...bs,
                        icon: bs.icon ? getAssetUrl(bs.icon) : ''
                    }))
                    const tokenData = data.token || (data.combat_info?.token ? {
                        ...data.combat_info.token,
                        imageUrl: data.combat_info.token.imageUrl ? getAssetUrl(data.combat_info.token.imageUrl) : ''
                    } : null)

                    // Normalize lore profiles
                    const profiles = Array.isArray(data.profiles) ? data.profiles : (Array.isArray(data.lore_info?.profiles) ? data.lore_info.profiles : [])

                    // Normalize records
                    const recordsList = (records || []).map((r, idx) => ({
                        ...r,
                        id: r.record_id || r.id || `rec_${idx}`,
                        title: r.name || r.title || `ký sự ${idx + 1}`,
                        description: r.description || ''
                    }))

                    const formattedOperator = {
                        ...data,
                        id: data.operator_id || data.id,
                        operator_id: data.operator_id || data.id,
                        name: data.name || 'CÁN VIÊN',
                        appellation: data.appellation || '',
                        rarity: Number(data.rarity) || 5,
                        class: data.class_id || data.class || '',
                        subclass: data.sub_class_id || data.subclass || '',
                        faction: (Array.isArray(data.factions) && data.factions.length > 0) ? data.factions[0] : (data.faction || null),
                        portraitUrl: defaultSkin?.portraitUrl || data.portraitUrl || '',
                        avatarUrl: defaultSkin?.avatarUrl || data.avatarUrl || '',
                        skins,
                        dialogues,
                        talents,
                        skills: skillsList,
                        modules: modulesList,
                        baseSkills: baseSkillsList,
                        token: tokenData,
                        profiles,
                        records: recordsList
                    }

                    setOperator(formattedOperator)
                    setSelectedSkinId(defaultSkin?.id || 'default')
                    document.title = `${isPreview ? '[XEM TRƯỚC] ' : ''}${formattedOperator.name} // Civilight Eterna Database`
                } else {
                    setIsDraft(false)
                    setOperator(null)
                }
            } catch (err) {
                console.error("Failed to load operator from Supabase/Session:", err)
                setOperator(null)
            } finally {
                setLoading(false)
            }
        }

        fetchOperatorDetail()
        setActiveTab('skill')
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [id, isPreview, location.search])

    // Get current portrait based on selected skin
    const activeSkin = operator?.skins?.find(s => s.id === selectedSkinId) || operator?.skins?.[0]
    const currentPortrait = getAssetUrl(activeSkin?.full_url || activeSkin?.portraitUrl || operator?.portraitUrl || '')

    const renderStars = (rarity) => {
        return Array.from({ length: rarity }, (_, i) => (
            <Star key={i} size={18} fill="currentColor" strokeWidth={0} className="operator-star" />
        ))
    }

    const TABS = [
        { id: 'skill', label: 'kỹ năng' },
        { id: 'profile', label: 'Hồ Sơ' },
        { id: 'dialogue', label: 'Lời Thoại' },
        { id: 'record', label: 'ký sự' },
    ]

    if (loading) {
        return (
            <div className="app-wrapper">
                <Header BASE_URL={BASE_URL} />
                <main className="main-layout" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loading text="RESOLVING_OPERATOR_DATA_STREAM..." />
                </main>
                <Footer />
            </div>
        )
    }

    if (isDraft) {
        return (
            <div className="app-wrapper">
                <Header BASE_URL={BASE_URL} />
                <main className="main-layout">
                    <div className="content-area expanded">
                        <div className="redesign-container" style={{ padding: '4rem 2.5rem' }}>
                            <div className="error-container" style={{ borderLeftColor: 'var(--color-ochre, #BA8530)' }}>
                                <p className="technical-text" style={{ color: 'var(--color-ochre, #BA8530)' }}>
                                    RESTRICTED_ACCESS // DRAFT_IN_PROGRESS
                                </p>
                                <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: '0.5rem', marginBottom: '1rem' }}>
                                    HỒ SƠ ĐANG TRONG GIAI ĐOẠN BIÊN TẬP
                                </h2>
                                <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem', color: 'rgba(24, 24, 24, 0.7)', fontSize: '0.9rem' }}>
                                    Hồ sơ dữ liệu của cán viên này hiện đang được soạn thảo và chưa được phát hành công khai.
                                </p>
                                <Link to="/operator" className="btn-link" style={{ display: 'inline-flex' }}>
                                    QUAY LẠI DANH SÁCH
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    if (!operator) {
        return (
            <div className="app-wrapper">
                <Header BASE_URL={BASE_URL} />
                <main className="main-layout">
                    <div className="content-area expanded">
                        <div className="redesign-container" style={{ padding: '4rem 2.5rem' }}>
                            <div className="error-container">
                                <p className="technical-text">
                                    {isPreview
                                        ? "SYS_PREVIEW_EMPTY // KHÔNG TÌM THẤY DỮ LIỆU XEM TRƯỚC"
                                        : `SYS_ERROR: OPERATOR_NOT_FOUND // ID: ${id}`}
                                </p>
                                <p style={{ maxWidth: '480px', margin: '0.75rem auto 1.5rem', color: 'rgba(24, 24, 24, 0.7)', fontSize: '0.9rem' }}>
                                    {isPreview
                                        ? "Chưa có dữ liệu bản nháp nào được gửi sang từ Trình biên tập Cán viên (Operator Editor), hoặc dữ liệu xem trước đã hết hạn."
                                        : "Không tìm thấy hồ sơ cán viên tương ứng trong hệ thống cơ sở dữ liệu."}
                                </p>
                                <Link to={isPreview ? "/editor/operator" : "/operator"} className="btn-link" style={{ marginTop: '0.5rem', display: 'inline-flex' }}>
                                    {isPreview ? "ĐẾN TRÌNH BIÊN TẬP CÁN VIÊN" : "QUAY LẠI DANH SÁCH"}
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    const classIconUrl = getClassIconUrl(operator.class)
    const subclassIconUrl = getSubclassIconUrl(operator.subclass, operator.class)

    return (
        <div className="app-wrapper">
            <Header BASE_URL={BASE_URL} />

            {/* PREVIEW MODE BANNER */}
            {isPreview && (
                <aside className="operator-preview-banner" aria-label="Chế độ xem trước">
                    <div className="operator-preview-banner-left">
                        <span className="operator-preview-badge">
                            <Eye size={14} />
                            CHẾ ĐỘ XEM TRƯỚC
                        </span>
                        <span className={`operator-preview-status-pill ${operator.status === 'draft' ? 'draft' : 'published'}`}>
                            {operator.status === 'draft' ? 'BẢN NHÁP (DRAFT)' : 'ĐÃ XUẤT BẢN'}
                        </span>
                        <span className="operator-preview-text technical-text">
                            Hồ sơ đang hiển thị ở chế độ xem trước (bỏ qua giới hạn bản nháp).
                        </span>
                    </div>

                    <div className="operator-preview-banner-right">
                        {(operator.operator_id || operator.id) && (operator.operator_id !== 'preview' && operator.id !== 'preview') && (
                            <Link
                                to={`/editor/operator/${operator.operator_id || operator.id}`}
                                className="operator-preview-btn primary"
                            >
                                <Edit3 size={13} />
                                <span>VỀ TRÌNH BIÊN TẬP</span>
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                if (window.opener) {
                                    window.close()
                                } else {
                                    navigate(operator.operator_id && operator.operator_id !== 'preview' ? `/editor/operator/${operator.operator_id}` : '/editor/operator')
                                }
                            }}
                            className="operator-preview-btn"
                            title="Đóng chế độ xem trước"
                        >
                            <span>ĐÓNG XEM TRƯỚC</span>
                        </button>
                    </div>
                </aside>
            )}

            <div className="main-layout">
                <div className="content-area operator-page-wrapper operator-detail-page expanded page-fade-in">
                    {/* Back link */}
                    <Link to="/operator" className="operator-back-link">
                        <ArrowLeft size={14} />
                        QUAY LẠI DANH SÁCH OPERATOR
                    </Link>

                    {/* Two-column layout */}
                    <div className="operator-detail-layout">
                        {/* ─── Left Column: Portrait & Info ─────────────────────────────── */}
                        <div className="operator-left-col">
                            {/* Portrait */}
                            <div className="operator-portrait-wrap">
                                <img
                                    className="operator-portrait-img"
                                    src={getAssetUrl(currentPortrait)}
                                    alt={operator.name}
                                    loading="eager"
                                    decoding="sync"
                                    onClick={() => setIsPortraitModalOpen(true)}
                                    onError={(e) => {
                                        e.target.onerror = null
                                        e.target.src = getAssetUrl('/assets/images/character/blank.png')
                                        e.target.style.opacity = '0.3'
                                    }}
                                />
                                <div className="operator-rarity-stars">
                                    {renderStars(operator.rarity)}
                                </div>

                                {/* Hidden in-memory preload elements to keep skin bitmaps warmed up */}
                                {operator.skins && operator.skins.length > 1 && (
                                    <div style={{ display: 'none' }} aria-hidden="true">
                                        {operator.skins.map((s, idx) => {
                                            const pSrc = getAssetUrl(s.full_url || s.portraitUrl || '')
                                            return pSrc ? <img key={s.id || idx} src={pSrc} alt="" loading="eager" decoding="async" /> : null
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="operator-left-info">
                                <div className="operator-name-block">
                                    <h1 className="operator-detail-name">{operator.name}</h1>
                                    <span className="operator-detail-appellation">
                                        {classIconUrl && (
                                            <img
                                                src={classIconUrl}
                                                alt={CLASSES_MAP[operator.class]?.name}
                                                className="operator-appellation-icon-img"
                                                title={CLASSES_MAP[operator.class]?.name}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                        <span className="operator-detail-separator">//</span>
                                        {subclassIconUrl && (
                                            <img
                                                src={subclassIconUrl}
                                                alt={SUBCLASSES_MAP[operator.subclass]?.name}
                                                className="operator-appellation-icon-img"
                                                title={SUBCLASSES_MAP[operator.subclass]?.name}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                    </span>
                                </div>

                                {/* Faction */}
                                <div className="operator-faction-row">
                                    {FACTIONS_MAP[operator.faction]?.icon && (
                                        <img
                                            src={getAssetUrl(FACTIONS_MAP[operator.faction].icon)}
                                            alt={FACTIONS_MAP[operator.faction].name}
                                            className="operator-faction-icon-img"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    <span className="operator-faction-name">{FACTIONS_MAP[operator.faction]?.name}</span>
                                </div>

                                {/* Skin Selector & Description */}
                                {operator.skins && operator.skins.length > 0 && (
                                    <div className="operator-skin-selector">
                                        <div className="operator-skin-header">
                                            <span className="operator-skin-label">TRANG PHỤC</span>
                                            <span className="operator-skin-current-name technical-text">
                                                {activeSkin?.name || 'Mặc định'}
                                            </span>
                                        </div>

                                        {operator.skins.length > 1 && (
                                            <div className="operator-skin-list">
                                                {operator.skins.map(skin => (
                                                    <button
                                                        key={skin.id}
                                                        className={`operator-skin-thumb ${selectedSkinId === skin.id ? 'active' : ''}`}
                                                        onClick={() => setSelectedSkinId(skin.id)}
                                                        title={skin.name}
                                                    >
                                                        <img
                                                            src={getAssetUrl(skin.avatar_url || skin.avatarUrl || skin.portraitUrl || skin.full_url || '/assets/images/character/blank.png')}
                                                            alt={skin.name}
                                                            onError={(e) => {
                                                                e.target.onerror = null
                                                                e.target.src = getAssetUrl('/assets/images/character/blank.png')
                                                            }}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {activeSkin?.description && (
                                            <div className="operator-skin-desc-card">
                                                <div className="operator-skin-desc-header technical-text">
                                                    <span>MÔ TẢ TRANG PHỤC</span>
                                                </div>
                                                <p className="operator-skin-desc-text">
                                                    {activeSkin.description}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── Right Column: Tabs ─────────────────────────────────────── */}
                        <div className="operator-right-col">
                            {/* Tab Bar */}
                            <div className="operator-tabs">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        className={`operator-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="operator-tab-content">
                                {activeTab === 'skill' && <SkillTab operator={operator} />}
                                {activeTab === 'profile' && <ProfileTab operator={operator} />}
                                {activeTab === 'dialogue' && (
                                    <DialogueTab operator={operator} selectedSkinId={selectedSkinId} />
                                )}
                                {activeTab === 'record' && <RecordTab operator={operator} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Portrait Preview Modal */}
            {isPortraitModalOpen && (
                <div className="operator-portrait-modal" onClick={() => setIsPortraitModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setIsPortraitModalOpen(false)}>
                            &times;
                        </button>
                        <img src={getAssetUrl(currentPortrait)} alt={operator.name} className="modal-portrait-img" />
                        <div className="modal-caption technical-text">
                            {operator.name} // {activeSkin?.name || 'Default'}
                        </div>
                        {activeSkin?.description && (
                            <div className="modal-skin-desc">
                                {activeSkin.description}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    )
}
