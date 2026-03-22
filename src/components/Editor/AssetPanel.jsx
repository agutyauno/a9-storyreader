import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Loader, Trash2, Copy, Music, Image, Video, Film, UserSquare2, LayoutDashboard } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import styles from './AssetPanel.module.css';

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
    { key: 'all',        label: 'Tất cả', Icon: LayoutDashboard },
    { key: 'background', label: 'Background', Icon: Image },
    { key: 'gallery',    label: 'Gallery',    Icon: Film },
    { key: 'character',  label: 'Character',  Icon: UserSquare2 },
    { key: 'bgm',        label: 'BGM',        Icon: Music },
    { key: 'sfx',        label: 'SFX',        Icon: Music },
    { key: 'video',      label: 'Video',      Icon: Video },
];

// ─── Asset Card ───────────────────────────────────────────────────────────────
function AssetCard({ asset, onDelete }) {
    const [copied, setCopied] = useState(false);
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);

    const copyId = () => {
        navigator.clipboard?.writeText(asset.asset_id).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); setPlaying(false); }
        else          { audioRef.current.play();  setPlaying(true); }
    };

    const isImage = asset.type === 'image';
    const isAudio = asset.type === 'audio';
    const isVideo = asset.type === 'video';

    return (
        <div className={styles.card}>
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
                <button className={`${styles.cardBtn} ${styles.danger}`} title="Xoá" onClick={() => onDelete(asset)}>
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function AssetPanel({ onAddAsset }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');

    const loadAssets = async () => {
        setLoading(true);
        try {
            const data = await SupabaseAPI.getAssets();
            setAssets(data);
        } catch (err) {
            console.error('Failed to load assets:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAssets(); }, []);

    const handleDelete = async (asset) => {
        if (!window.confirm(`Xoá asset "${asset.name || asset.asset_id}"?`)) return;
        try {
            await SupabaseAPI.deleteAsset(asset.asset_id);
            setAssets(prev => prev.filter(a => a.asset_id !== asset.asset_id));
        } catch (err) {
            alert(`Xoá thất bại: ${err.message}`);
        }
    };

    // ─── Filtering ─────────────────────────────────────────────────────────────
    const filtered = assets.filter(a => {
        const matchCat = activeCategory === 'all' || a.category === activeCategory;
        const q = search.toLowerCase();
        const matchSearch = !q || a.name?.toLowerCase().includes(q) || a.asset_id.toLowerCase().includes(q);
        return matchCat && matchSearch;
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
                <button className={styles.addBtn} onClick={onAddAsset} title="Thêm asset mới">
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
                ) : filtered.length === 0 ? (
                    <div className={styles.centerState}>
                        <p>Không tìm thấy asset nào.</p>
                    </div>
                ) : (
                    filtered.map(asset => (
                        <AssetCard key={asset.asset_id} asset={asset} onDelete={handleDelete} />
                    ))
                )}
            </div>
        </div>
    );
}
