import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Loader, Trash2, Copy, Edit2, Music, Image, Video, Film, UserSquare2, LayoutDashboard } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import AssetDetailModal from './AssetDetailModal';
import styles from './AssetPanel.module.css';

// ─── Category config (matches legacy) ─────────────────────────────────────────
const CATEGORIES = [
    { key: 'all', label: 'Tất cả', Icon: LayoutDashboard },
    { key: 'character', label: 'Characters', Icon: UserSquare2 },
    { key: 'background', label: 'Background', Icon: Image },
    { key: 'gallery', label: 'Gallery', Icon: Film },
    { key: 'thumbnail', label: 'Thumnails', Icon: Image },
    { key: 'video', label: 'Video', Icon: Video },
    { key: 'bgm', label: 'BGM', Icon: Music },
    { key: 'sfx', label: 'SFX', Icon: Music },
];

// ─── Asset Card ───────────────────────────────────────────────────────────────
function AssetCard({ asset, onDelete, onDetail }) {
    const [copied, setCopied] = useState(false);
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);

    const copyId = (e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(asset.asset_id).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const toggleAudio = (e) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); setPlaying(false); }
        else { audioRef.current.play(); setPlaying(true); }
    };

    const isImage = asset.type === 'image';
    const isAudio = asset.type === 'audio';
    const isVideo = asset.type === 'video';

    return (
        <div className={styles.card} onClick={() => onDetail?.(asset)}>
            {/* Preview area */}
            <div className={styles.cardPreview} onClick={isAudio ? toggleAudio : undefined}>
                {isImage && <img src={asset.url} alt={asset.name} loading="lazy" />}
                {isVideo && (
                    <div className={styles.videoThumb}>
                        <Video size={24} />
                    </div>
                )}
                {isAudio && (
                    <div className={`${styles.audioThumb} ${playing ? styles.playing : ''}`}>
                        <Music size={20} />
                        {playing && <span className={styles.playingDot} />}
                        <audio ref={audioRef} src={asset.url} loop={false} onEnded={() => setPlaying(false)} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className={styles.cardInfo}>
                <span className={styles.cardName} title={asset.name}>{asset.name || asset.asset_id}</span>
                <span className={styles.cardId}>{asset.asset_id}</span>
            </div>

            {/* Actions */}
            <div className={styles.cardActions}>
                <button className={styles.cardBtn} title="Copy ID" onClick={copyId}>
                    {copied ? '✓' : <Copy size={12} />}
                </button>
                <button className={`${styles.cardBtn} ${styles.danger}`} title="Xoá" onClick={(e) => { e.stopPropagation(); onDelete(asset); }}>
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}

// ─── Character Card (for character category) ─────────────────────────────────
function CharacterCard({ character, onDetail, avatarUrl }) {
    const [copied, setCopied] = useState(false);

    const copyId = (e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(character.character_id).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className={styles.card} onClick={() => onDetail?.(character)}>
            <div className={styles.cardPreview}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={character.name} loading="lazy" />
                ) : (
                    <UserSquare2 size={24} />
                )}
            </div>
            <div className={styles.cardInfo}>
                <span className={styles.cardName} title={character.name}>{character.name}</span>
                <span className={styles.cardId}>{character.character_id}</span>
            </div>
            <div className={styles.cardActions}>
                <button className={styles.cardBtn} title="Copy ID" onClick={copyId}>
                    {copied ? '✓' : <Copy size={12} />}
                </button>
            </div>
        </div>
    );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function AssetPanel({ onAddAsset, onPickAsset }) {
    const [assets, setAssets] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [avatarMap, setAvatarMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');

    // Detail modal
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailTarget, setDetailTarget] = useState(null);
    const [detailKind, setDetailKind] = useState('asset');

    const loadAll = async () => {
        setLoading(true);
        try {
            const [assetData, charData] = await Promise.all([
                SupabaseAPI.getAssets(),
                SupabaseAPI.getCharacters(),
            ]);
            setAssets(assetData);
            setCharacters(charData);

            // Batch load expressions for characters to get avatar previews
            try {
                const charIds = (charData || []).map(c => c.character_id).filter(Boolean);
                if (charIds.length) {
                    const exprMap = await SupabaseAPI.getExpressionsByCharacters(charIds);
                    const map = {};
                    for (const id of Object.keys(exprMap)) {
                        const arr = exprMap[id] || [];
                        if (arr.length) map[id] = arr[0].avatar_url || arr[0].full_url || null;
                    }
                    setAvatarMap(map);
                }
            } catch (err) {
                console.warn('Batch expressions load failed:', err);
            }
        } catch (err) {
            console.error('Failed to load assets/characters:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    const handleDelete = async (asset) => {
        if (!window.confirm(`Xoá asset "${asset.name || asset.asset_id}"?`)) return;
        try {
            await SupabaseAPI.deleteAsset(asset.asset_id);
            setAssets(prev => prev.filter(a => a.asset_id !== asset.asset_id));
        } catch (err) {
            alert(`Xoá thất bại: ${err.message}`);
        }
    };

    const openAssetDetail = (asset) => {
        setDetailTarget(asset);
        setDetailKind('asset');
        setDetailOpen(true);
    };

    const openCharacterDetail = (character) => {
        setDetailTarget(character);
        setDetailKind('character');
        setDetailOpen(true);
    };

    // ─── Filtering ─────────────────────────────────────────────────────────────
    const isCharacterView = activeCategory === 'character';

    const filteredAssets = assets.filter(a => {
        const q = search.toLowerCase();
        const matchSearch = !q || a.name?.toLowerCase().includes(q) || a.asset_id.toLowerCase().includes(q);
        if (!matchSearch) return false;

        if (activeCategory === 'all') return true;
        if (activeCategory === 'background') return a.type === 'image' && a.category === 'background';
        if (activeCategory === 'gallery') return a.type === 'image' && a.category === 'gallery';
        if (activeCategory === 'thumbnail') return a.type === 'image' && a.category === 'thumbnail';
        if (activeCategory === 'video') return a.type === 'video';
        if (activeCategory === 'bgm') return a.type === 'audio' && a.category === 'bgm';
        if (activeCategory === 'sfx') return a.type === 'audio' && a.category === 'sfx';
        return false;
    });

    const filteredChars = characters.filter(c => {
        const q = search.toLowerCase();
        return !q || c.name?.toLowerCase().includes(q) || c.character_id?.toLowerCase().includes(q);
    });

    return (
        <div className={styles.panel}>
            {/* Search bar + add button */}
            <div className={styles.searchRow}>
                <div className={styles.searchBox}>
                    <Search size={13} className={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        placeholder="Tìm asset..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button className={styles.addBtn} onClick={() => onAddAsset?.(activeCategory === 'all' ? 'image' : activeCategory, () => loadAll())} title="Thêm asset mới">
                    <Plus size={14} />
                </button>
            </div>

            {/* Category tabs */}
            <div className={styles.categoryTabs}>
                {CATEGORIES.map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        className={`${styles.catBtn} ${activeCategory === key ? styles.active : ''}`}
                        onClick={() => setActiveCategory(key)}
                    >
                        <Icon size={12} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Asset grid */}
            <div className={styles.grid}>
                {loading ? (
                    <div className={styles.centerState}>
                        <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent)' }} />
                    </div>
                ) : isCharacterView ? (
                    filteredChars.length === 0 ? (
                        <div className={styles.centerState}>
                            <p>Không tìm thấy character nào.</p>
                        </div>
                    ) : (
                        filteredChars.map(char => (
                            <CharacterCard key={char.character_id} character={char} onDetail={openCharacterDetail} avatarUrl={avatarMap[char.character_id]} />
                        ))
                    )
                ) : (
                    filteredAssets.length === 0 ? (
                        <div className={styles.centerState}>
                            <p>Không tìm thấy asset nào.</p>
                        </div>
                    ) : (
                        filteredAssets.map(asset => (
                            <AssetCard key={asset.asset_id} asset={asset} onDelete={handleDelete} onDetail={openAssetDetail} />
                        ))
                    )
                )}
            </div>

            {/* Detail Modal */}
            <AssetDetailModal
                isOpen={detailOpen}
                asset={detailTarget}
                kind={detailKind}
                onClose={() => setDetailOpen(false)}
                onUpdated={() => { loadAll(); setDetailOpen(false); }}
                onPickAsset={onPickAsset}
            />
        </div>
    );
}
