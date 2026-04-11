import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOperatorById, getClassById, getSubClassById, getFactionById, getDialoguesBySkin, getSkinsWithDialogues } from '../utils/mockOperatorData';
import { getAssetUrl } from '../utils/assetUtils';
import styles from '../styles/OperatorPage.module.css';

// ─── Accordion Component ──────────────────────────────────────────────────
function Accordion({ icon, title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={styles.accordionItem}>
            <div className={styles.accordionHeader} onClick={() => setOpen(!open)}>
                {icon && <img src={getAssetUrl(icon)} alt="" className={styles.accordionIcon} />}
                <span className={styles.accordionTitle}>{title}</span>
                <span className={`${styles.accordionChevron} ${open ? styles.open : ''}`}>▼</span>
            </div>
            {open && <div className={styles.accordionBody}>{children}</div>}
        </div>
    );
}

// ─── Tab 1: General & Combat ──────────────────────────────────────────────
function TabGeneral({ operator }) {
    const [selectedSkinIdx, setSelectedSkinIdx] = useState(0);
    const selectedSkin = operator.skins?.[selectedSkinIdx];

    const cls = getClassById(operator.class);
    const subCls = getSubClassById(operator.sub_class);
    const factions = operator.factions?.map(f => getFactionById(f)).filter(Boolean) || [];

    const { skills, talents, modules, operator_token } = operator.combat_info || {};

    return (
        <div>
            {/* ── Skin Visualizer ──────────────────────────────────────── */}
            <div className={styles.skinVisualizer}>
                <div className={styles.skinImageWrapper}>
                    <img
                        src={getAssetUrl(selectedSkin?.image_url || operator.avatar_url)}
                        alt={selectedSkin?.name || operator.name}
                        className={styles.skinImage}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getAssetUrl('/assets/images/character/blank.png'); }}
                    />
                    {operator.skins?.length > 1 && (
                        <div className={styles.skinSelector}>
                            {operator.skins.map((skin, idx) => (
                                <button
                                    key={skin.skin_id}
                                    className={`${styles.skinBtn} ${idx === selectedSkinIdx ? styles.active : ''}`}
                                    onClick={() => setSelectedSkinIdx(idx)}
                                >
                                    {skin.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.skinInfoPanel}>
                    {/* Badges */}
                    <div className={styles.detailBadges}>
                        {cls && (
                            <span className={styles.badge}>
                                <img src={getAssetUrl(cls.icon)} alt="" className={styles.badgeIcon} />
                                {cls.name}
                            </span>
                        )}
                        {subCls && (
                            <span className={styles.badge}>
                                <img src={getAssetUrl(subCls.icon)} alt="" className={styles.badgeIcon} />
                                {subCls.name}
                            </span>
                        )}
                        {factions.map(f => (
                            <span key={f.id} className={styles.badge}>
                                <img src={getAssetUrl(f.icon)} alt="" className={styles.badgeIcon} />
                                {f.name}
                            </span>
                        ))}
                    </div>

                    {/* Skin Description */}
                    {selectedSkin?.description && (
                        <p className={styles.skinDescription}>{selectedSkin.description}</p>
                    )}

                    {/* Token */}
                    {operator_token && (
                        <div className={styles.tokenSection}>
                            <p className={styles.tokenLabel}>Operator Token</p>
                            <p className={styles.tokenText}>{operator_token.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Skills ──────────────────────────────────────────────── */}
            {skills?.length > 0 && (
                <div className={styles.accordion}>
                    <h3 className={styles.sectionTitle}>Skills</h3>
                    {skills.map((skill, i) => (
                        <Accordion key={skill.id} icon={skill.icon} title={`Skill ${i + 1}: ${skill.name}`}>
                            {skill.description}
                        </Accordion>
                    ))}
                </div>
            )}

            {/* ── Talents ─────────────────────────────────────────────── */}
            {talents?.length > 0 && (
                <div className={styles.accordion}>
                    <h3 className={styles.sectionTitle}>Talents</h3>
                    {talents.map((talent, i) => (
                        <Accordion key={i} title={talent.name} defaultOpen={true}>
                            {talent.description}
                        </Accordion>
                    ))}
                </div>
            )}

            {/* ── Modules ─────────────────────────────────────────────── */}
            {modules?.length > 0 && (
                <div className={styles.accordion}>
                    <h3 className={styles.sectionTitle}>Modules</h3>
                    {modules.map(mod => (
                        <Accordion key={mod.id} icon={mod.icon} title={mod.name}>
                            <p style={{ marginTop: 0 }}><strong>Effect:</strong> {mod.description}</p>
                            {mod.story && (
                                <>
                                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--spacing-base) 0' }} />
                                    <p style={{ marginBottom: 0 }}>{mod.story}</p>
                                </>
                            )}
                        </Accordion>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Tab 2: Profiles ──────────────────────────────────────────────────────
function TabProfiles({ operator }) {
    const profiles = operator.lore_info?.profiles || [];

    if (profiles.length === 0) {
        return <div className={styles.emptyState}>Chưa có thông tin hồ sơ.</div>;
    }

    return (
        <div className={styles.accordion}>
            <h3 className={styles.sectionTitle}>Hồ sơ Operator</h3>
            {profiles.map((profile, i) => (
                <Accordion key={i} title={profile.title} defaultOpen={i === 0}>
                    {profile.content}
                </Accordion>
            ))}
        </div>
    );
}

// ─── Tab 3: Dialogues ─────────────────────────────────────────────────────
function TabDialogues({ operator }) {
    const skinsWithDlg = useMemo(() => getSkinsWithDialogues(operator), [operator]);
    const [selectedSkinId, setSelectedSkinId] = useState(null); // null = default
    const [selectedLang, setSelectedLang] = useState('jp');
    const [expandedId, setExpandedId] = useState(null);
    const audioRef = useRef(null);
    const [playingId, setPlayingId] = useState(null);

    const dialogues = useMemo(
        () => getDialoguesBySkin(operator, selectedSkinId),
        [operator, selectedSkinId]
    );

    const handlePlay = (dlg) => {
        const urlKey = `audio_url_${selectedLang}`;
        const url = dlg[urlKey];

        if (!url) return;

        if (playingId === dlg.dialogue_id) {
            // Toggle pause/play
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
                setPlayingId(null);
            } else {
                audioRef.current?.play();
                setPlayingId(dlg.dialogue_id);
            }
            return;
        }

        // Play new audio
        if (audioRef.current) {
            audioRef.current.pause();
        }
        const audio = new Audio(getAssetUrl(url));
        audioRef.current = audio;
        audio.play().catch(() => {});
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => setPlayingId(null);
        setPlayingId(dlg.dialogue_id);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    if (dialogues.length === 0) {
        return <div className={styles.emptyState}>Chưa có dữ liệu thoại.</div>;
    }

    return (
        <div>
            <h3 className={styles.sectionTitle}>Voice Lines</h3>

            {/* ── Controls ────────────────────────────────────────────── */}
            <div className={styles.dialogueControls}>
                {skinsWithDlg.length > 1 && (
                    <>
                        <span className={styles.dialogueControlLabel}>Skin:</span>
                        {skinsWithDlg.map(s => (
                            <button
                                key={s.skin_id || 'default'}
                                className={`${styles.skinBtn} ${selectedSkinId === s.skin_id ? styles.active : ''}`}
                                onClick={() => setSelectedSkinId(s.skin_id)}
                            >
                                {s.name}
                            </button>
                        ))}
                        <span style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 4px' }} />
                    </>
                )}
                <span className={styles.dialogueControlLabel}>Audio:</span>
                {['jp', 'en', 'cn'].map(lang => (
                    <button
                        key={lang}
                        className={`${styles.skinBtn} ${selectedLang === lang ? styles.active : ''}`}
                        onClick={() => {
                            setSelectedLang(lang);
                            if (audioRef.current) { audioRef.current.pause(); setPlayingId(null); }
                        }}
                    >
                        {lang.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* ── Dialogue Items ───────────────────────────────────────── */}
            <div className={styles.dialogueList}>
                {dialogues.map(dlg => {
                    const isExpanded = expandedId === dlg.dialogue_id;
                    const isPlaying = playingId === dlg.dialogue_id;
                    return (
                        <div key={dlg.dialogue_id} className={styles.dialogueItem}>
                            <div className={styles.dialogueHeader} onClick={() => setExpandedId(isExpanded ? null : dlg.dialogue_id)}>
                                <button
                                    className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
                                    onClick={(e) => { e.stopPropagation(); handlePlay(dlg); }}
                                    title="Play"
                                >
                                    {isPlaying ? '■' : '▶'}
                                </button>
                                <span className={styles.dialogueTitle}>{dlg.title}</span>
                                <span className={`${styles.accordionChevron} ${isExpanded ? styles.open : ''}`}>▼</span>
                            </div>
                            {isExpanded && (
                                <div className={styles.dialogueText}>
                                    {dlg.text_content}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Tab 4: Operator Records ──────────────────────────────────────────────
function TabRecords({ operator }) {
    const records = operator.records || [];

    if (records.length === 0) {
        return <div className={styles.emptyState}>Chưa có ngoại truyện.</div>;
    }

    return (
        <div>
            <h3 className={styles.sectionTitle}>Operator Records</h3>
            <div className={styles.recordList}>
                {records.map(record => (
                    <Link
                        key={record.story_id}
                        to={`/story/${record.story_id}`}
                        className={styles.recordCard}
                    >
                        <p className={styles.recordTitle}>{record.name}</p>
                        <p className={styles.recordDesc}>{record.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════

const TABS = [
    { key: 'general', label: 'Thông tin' },
    { key: 'profiles', label: 'Hồ Sơ' },
    { key: 'dialogues', label: 'Thoại' },
    { key: 'records', label: 'Ngoại Truyện' },
];

export default function OperatorDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');

    const operator = getOperatorById(id);

    useEffect(() => {
        if (operator) {
            document.title = `${operator.name} - Civilight Eterna Database`;
        } else {
            document.title = 'Operator Not Found - Civilight Eterna Database';
        }
    }, [operator]);

    if (!operator) {
        return (
            <div className={styles.detailPage}>
                <div className={styles.emptyState}>
                    <p>Không tìm thấy Operator.</p>
                    <button className={styles.backLink} onClick={() => navigate('/', { state: { tab: 'operators-tab' } })}>
                        ← Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const cls = getClassById(operator.class);
    const factions = operator.factions?.map(f => getFactionById(f)).filter(Boolean) || [];

    return (
        <div className={styles.detailPage}>
            {/* ── Back link ────────────────────────────────────────────── */}
            <button className={styles.backLink} onClick={() => navigate('/', { state: { tab: 'operators-tab' } })}>
                ← Quay lại danh sách Operator
            </button>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className={styles.detailHeader}>
                <img
                    src={getAssetUrl(operator.avatar_url)}
                    alt={operator.name}
                    className={styles.detailAvatar}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getAssetUrl('/assets/images/character/blank.png'); }}
                />
                <div className={styles.detailHeaderInfo}>
                    <h1 className={styles.detailName}>{operator.name}</h1>
                    <div className={styles.detailBadges}>
                        {cls && (
                            <span className={styles.badge}>
                                <img src={getAssetUrl(cls.icon)} alt="" className={styles.badgeIcon} />
                                {cls.name}
                            </span>
                        )}
                        {factions.map(f => (
                            <span key={f.id} className={styles.badge}>
                                <img src={getAssetUrl(f.icon)} alt="" className={styles.badgeIcon} />
                                {f.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Tab Bar ──────────────────────────────────────────────── */}
            <div className={styles.tabBar}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`${styles.tabBtn} ${activeTab === tab.key ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ──────────────────────────────────────────── */}
            <div className={styles.tabContent}>
                {activeTab === 'general' && <TabGeneral operator={operator} />}
                {activeTab === 'profiles' && <TabProfiles operator={operator} />}
                {activeTab === 'dialogues' && <TabDialogues operator={operator} />}
                {activeTab === 'records' && <TabRecords operator={operator} />}
            </div>
        </div>
    );
}
