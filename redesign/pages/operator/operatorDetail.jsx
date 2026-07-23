import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOperatorById, CLASSES_MAP, SUBCLASSES_MAP, FACTIONS_MAP } from './mockOperatorData'
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
    Crosshair, Flame, PlusCircle, Flag, Target, Activity, HelpCircle, Clock
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
                    <div className="operator-section-title">Tài Năng</div>
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
                    <div className="operator-section-title">Kĩ Năng ({operator.skills.length})</div>
                    {operator.skills.map((skill, idx) => {
                        const hasInitSp = skill.initialSp !== undefined && skill.initialSp !== null && skill.initialSp !== '-' && skill.initialSp !== 0;
                        const hasSpCost = skill.spCost !== undefined && skill.spCost !== null && skill.spCost !== '-' && skill.spCost !== 0;

                        return (
                            <Collapsible
                                key={idx}
                                icon={
                                    <div className="skill-icon-inner">
                                        {skill.icon ? (
                                            <img src={skill.icon} alt="" className="skill-icon-img" />
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
                                                <span className={`skill-meta-tag activation-tag type-${skill.activationType}`}>
                                                    {skill.activationType === 'auto' ? 'Auto' : 'Manual'}
                                                </span>
                                            )}
                                            {skill.spRecoveryType && skill.spRecoveryType !== '-' && skill.activationType !== 'passive' && (
                                                <span className={`skill-meta-tag recovery-tag type-${skill.spRecoveryType}`}>
                                                    {skill.spRecoveryType === 'auto' ? 'Auto Recovery' :
                                                        skill.spRecoveryType === 'offensive' ? 'Offensive Recovery' : 'Defensive Recovery'}
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
                            icon={<Package size={16} />}
                            title={mod.name}
                            subtitle={`Module ${idx + 1}`}
                            variant="module"
                        >
                            <div className="module-collapsible-content">
                                {mod.imageUrl && (
                                    <div className="module-banner-container">
                                        <img src={mod.imageUrl} alt={mod.name} className="module-banner-image" />
                                    </div>
                                )}
                                <div className="module-text-container">
                                    {mod.lore && (
                                        <p className="module-lore-text">
                                            <em>"{mod.lore}"</em>
                                        </p>
                                    )}
                                    {mod.stats && (
                                        <div className="module-stats-grid">
                                            {Object.entries(mod.stats).map(([key, val]) => (
                                                <span key={key} className="module-stat-badge">
                                                    {key.toUpperCase()} +{val}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="skill-description">{mod.description}</p>
                                    {mod.skillDescription && (
                                        <p className="skill-description" style={{ marginTop: '0.5rem' }}>
                                            <strong>Talent Enhancement:</strong> {mod.skillDescription}
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
                    <div className="operator-section-title">Kĩ năng hậu cần</div>
                    {operator.baseSkills.map((bs, idx) => (
                        <div key={idx} className="base-skill-item">
                            <div className="base-skill-icon">
                                <Home size={16} />
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
                            <img className="operator-token-img" src={operator.token.imageUrl} alt={operator.token.name || 'Token'} />
                        ) : (
                            <div className="operator-token-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={24} color="var(--color-cream)" />
                            </div>
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
        const voiceUrl = dialogue.voiceLines?.[voiceLang]
        if (voiceUrl) {
            const audio = new Audio(voiceUrl)
            audio.play().catch(() => {
                showNotification('warning', 'Playback Error', 'Không thể phát âm thanh.')
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
                <div className="operator-section-title">Kí sự</div>
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
            <div className="operator-section-title">Kí sự ({operator.records.length})</div>
            {operator.records.map((record, idx) => (
                <div key={record.id || idx} className="record-item">
                    <span className="record-item-meta">REC.{String(idx + 1).padStart(2, '0')} // {record.id}</span>
                    <span className="record-item-title">{record.title}</span>
                    <span className="record-item-desc">{record.description}</span>
                </div>
            ))}
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function OperatorDetailPage() {
    const { id } = useParams()
    const [operator, setOperator] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('skill')
    const [selectedSkinId, setSelectedSkinId] = useState('default')
    const [isPortraitModalOpen, setIsPortraitModalOpen] = useState(false)

    const BASE_URL = import.meta.env.BASE_URL || '/'

    useEffect(() => {
        async function fetchOperatorDetail() {
            try {
                setLoading(true)
                const data = await SupabaseAPI.getOperator(id)
                if (data) {
                    setOperator(data)
                    document.title = `${data.name} // Civilight Eterna Database`
                } else {
                    const mockData = getOperatorById(id)
                    setOperator(mockData)
                    if (mockData) {
                        document.title = `${mockData.name} // Civilight Eterna Database`
                    }
                }
            } catch (err) {
                console.error("Failed to load operator from Supabase:", err)
                const mockData = getOperatorById(id)
                setOperator(mockData)
                if (mockData) {
                    document.title = `${mockData.name} // Civilight Eterna Database`
                }
            } finally {
                setLoading(false)
            }
        }
        fetchOperatorDetail()
        setSelectedSkinId('default')
        setActiveTab('skill')
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [id])

    // Get current portrait based on selected skin
    const currentPortrait = operator?.skins?.find(s => s.id === selectedSkinId)?.portraitUrl || operator?.portraitUrl

    const renderStars = (rarity) => {
        return Array.from({ length: rarity }, (_, i) => (
            <Star key={i} size={18} fill="currentColor" strokeWidth={0} className="operator-star" />
        ))
    }

    const TABS = [
        { id: 'skill', label: 'Kĩ năng' },
        { id: 'profile', label: 'Hồ Sơ' },
        { id: 'dialogue', label: 'Lời Thoại' },
        { id: 'record', label: 'Kí sự' },
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

    if (!operator) {
        return (
            <div className="app-wrapper">
                <Header BASE_URL={BASE_URL} />
                <main className="main-layout">
                    <div className="content-area expanded">
                        <div className="redesign-container" style={{ padding: '4rem 2.5rem' }}>
                            <div className="error-container">
                                <p className="technical-text">SYS_ERROR: OPERATOR_NOT_FOUND // ID: {id}</p>
                                <Link to="/operator" className="btn-link" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
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

    const classIconUrl = getClassIconUrl(operator.class)
    const subclassIconUrl = getSubclassIconUrl(operator.subclass, operator.class)

    return (
        <div className="app-wrapper">
            <Header BASE_URL={BASE_URL} />

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
                                    src={currentPortrait}
                                    alt={operator.name}
                                    onClick={() => setIsPortraitModalOpen(true)}
                                    onError={(e) => {
                                        e.target.onerror = null
                                        e.target.style.opacity = '0.3'
                                    }}
                                />
                                <div className="operator-rarity-stars">
                                    {renderStars(operator.rarity)}
                                </div>
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

                                {/* Skin Selector */}
                                {operator.skins && operator.skins.length > 1 && (
                                    <div className="operator-skin-selector">
                                        <span className="operator-skin-label">Skins ({operator.skins.length})</span>
                                        <div className="operator-skin-list">
                                            {operator.skins.map(skin => (
                                                <button
                                                    key={skin.id}
                                                    className={`operator-skin-thumb ${selectedSkinId === skin.id ? 'active' : ''}`}
                                                    onClick={() => setSelectedSkinId(skin.id)}
                                                    title={skin.name}
                                                >
                                                    <img src={skin.portraitUrl} alt={skin.name} />
                                                </button>
                                            ))}
                                        </div>
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
                        <img src={currentPortrait} alt={operator.name} className="modal-portrait-img" />
                        <div className="modal-caption technical-text">
                            {operator.name} // {operator.skins.find(s => s.id === selectedSkinId)?.name || 'Default'}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    )
}
