import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Loader, Trash2, Copy, Edit2, Music, Image, Video, Film, UserSquare2, LayoutDashboard } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import AssetDetailModal from './AssetDetailModal';
import ConfirmModal from './ConfirmModal';
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
function CharacterCard({ character, onDetail, onDelete, avatarUrl }) {
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
                <button className={`${styles.cardBtn} ${styles.danger}`} title="Xoá" onClick={(e) => { e.stopPropagation(); onDelete(character); }}>
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function AssetPanel({ onAddAsset, onPickAsset, showNotification }) {
    const [assets, setAssets] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [avatarMap, setAvatarMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');

    // Detail modal
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailTarget, setDetailTarget] = useState(null);
    const [detailKind, setDetailKind] = useState('asset');

    // Confirm modal
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: () => {} });

    const loadAll = async () => {
        setLoading(true);
        try {
            const [assetData, charData, galleryData] = await Promise.all([
                SupabaseAPI.getAssets(),
                SupabaseAPI.getCharacters(),
                SupabaseAPI.getAllGallery(),
            ]);
            setAssets(assetData);
            setCharacters(charData);
            setGallery(galleryData);

        } catch (err) {
            console.error('Failed to load assets/characters:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    const handleDelete = async (item) => {
        const isChar = !!item.character_id;
        const id = isChar ? item.character_id : item.asset_id;
        const name = item.name || id;

        setConfirmData({
            title: `Xoá ${isChar ? 'nhân vật' : 'asset'}`,
            message: `Bạn có chắc chắn muốn xoá ${isChar ? 'nhân vật' : 'asset'} "${name}"? Hành động này không thể hoàn tác.`,
            onConfirm: async () => {
                try {
                    if (isChar) await SupabaseAPI.deleteCharacter(id);
                    else if (activeCategory === 'gallery') await SupabaseAPI.deleteGallery(item.asset_id);
                    else await SupabaseAPI.deleteAsset(id);
                    
                    showNotification(`Đã xoá ${isChar ? 'nhân vật' : 'asset'} thành công`, 'success');
                    loadAll(); 
                } catch (err) {
                    console.error('Delete failed:', err);
                    showNotification(`${isChar ? 'Xoá nhân vật' : 'Xoá asset'} thất bại: ${err.message}`, 'error');
                }
            }
        });
        setConfirmOpen(true);
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
        if (activeCategory === 'thumbnail') return a.type === 'image' && a.category === 'thumbnail';
        if (activeCategory === 'video') return a.type === 'video';
        if (activeCategory === 'bgm') return a.type === 'audio' && a.category === 'bgm';
        if (activeCategory === 'sfx') return a.type === 'audio' && a.category === 'sfx';
        return false;
    });

    const filteredGallery = gallery.filter(g => {
        const q = search.toLowerCase();
        return !q || g.title?.toLowerCase().includes(q) || g.gallery_id.toLowerCase().includes(q);
    }).map(g => ({
        asset_id: g.gallery_id,
        name: g.title,
        url: g.image_url,
        type: 'image',
        category: 'gallery'
    }));

    const filteredChars = characters.filter(c => {
        const q = search.toLowerCase();
        return !q || c.name?.toLowerCase().includes(q) || c.character_id?.toLowerCase().includes(q);
    });

    const allItems = activeCategory === 'all'
        ? [
            ...filteredAssets.map(a => ({ ...a, gridKind: 'asset' })),
            ...filteredChars.map(c => ({ ...c, gridKind: 'character' })),
            ...filteredGallery.map(g => ({ ...g, gridKind: 'asset' }))
        ]
        : isCharacterView
            ? filteredChars.map(c => ({ ...c, gridKind: 'character' }))
            : activeCategory === 'gallery'
                ? filteredGallery.map(g => ({ ...g, gridKind: 'asset' }))
                : filteredAssets.map(a => ({ ...a, gridKind: 'asset' }));

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
                ) : (
                    allItems.length === 0 ? (
                        <div className={styles.centerState}>
                            <p>Không tìm thấy mục nào.</p>
                        </div>
                    ) : (
                        allItems.map((item, idx) => (
                            item.gridKind === 'character' ? (
                                <CharacterCard 
                                    key={`char-${item.character_id || idx}`} 
                                    character={item} 
                                    onDetail={openCharacterDetail} 
                                    onDelete={handleDelete}
                                    avatarUrl={item.avatar_url || item.full_url} 
                                />
                            ) : (
                                <AssetCard 
                                    key={`asset-${item.category || 'misc'}-${item.asset_id || idx}`} 
                                    asset={item} 
                                    onDelete={handleDelete} 
                                    onDetail={openAssetDetail} 
                                />
                            )
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
                showNotification={showNotification}
            />

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmOpen}
                title={confirmData.title}
                message={confirmData.message}
                onConfirm={confirmData.onConfirm}
                onClose={() => setConfirmOpen(false)}
            />
        </div>
    );
}
