import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Search, Loader, Trash2, Copy, Music, Image, Video, Film, UserSquare2, LayoutDashboard, Play, Pause, Eye, X, ChevronDown, Filter, RotateCw } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import { EditorCache } from '../../../../../src/services/editorCache';
import AssetDetailModal from '../modals/AssetDetailModal';
import ConfirmModal from '../modals/ConfirmModal';
import { getAssetUrl } from '../../../../../src/utils/assetUtils';
import '../editorComponents.css';

const CATEGORIES = [
    { key: 'all', label: 'Tất cả', Icon: LayoutDashboard },
    { key: 'character', label: 'Characters', Icon: UserSquare2 },
    { key: 'background', label: 'Background', Icon: Image },
    { key: 'gallery', label: 'Gallery', Icon: Film },
    { key: 'thumbnail', label: 'Thumbnails', Icon: Image },
    { key: 'banner', label: 'Banner', Icon: Image },
    { key: 'wallpaper', label: 'Wallpaper', Icon: Image },
    { key: 'video', label: 'Video', Icon: Video },
    { key: 'bgm', label: 'BGM', Icon: Music },
    { key: 'sfx', label: 'SFX', Icon: Music },
];

const AssetCard = React.memo(function AssetCard({ asset, onDelete, onDetail, isPlaying, onTogglePlay }) {
    const [copied, setCopied] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (!isPlaying || !audioRef.current) return;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
    }, [isPlaying]);

    const copyId = (e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(asset.asset_id).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const isImage = asset.type === 'image';
    const isAudio = asset.type === 'audio';
    const isVideo = asset.type === 'video';

    const getBadgeClass = (cat) => {
        if (cat === 'character') return 'badge-character';
        if (cat === 'bgm') return 'badge-bgm';
        if (cat === 'sfx') return 'badge-sfx';
        if (cat === 'video') return 'badge-video';
        if (cat === 'gallery') return 'badge-gallery';
        if (cat === 'background') return 'badge-background';
        return '';
    };

    return (
        <div className="redesign-asset-card" onClick={() => onDetail?.(asset)}>
            <div className="redesign-asset-thumb">
                {asset.category && (
                    <span className={`redesign-asset-badge ${getBadgeClass(asset.category)}`}>
                        {asset.category}
                    </span>
                )}

                {isImage && <img src={getAssetUrl(asset.url)} alt={asset.name} loading="lazy" />}
                
                {isVideo && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', color: '#E1BEE7' }}>
                        <Video size={22} />
                        <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)' }}>VIDEO</span>
                    </div>
                )}
                
                {isAudio && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                        {isPlaying && (
                            <audio
                                ref={audioRef}
                                autoPlay
                                src={getAssetUrl(asset.url)}
                                onEnded={() => onTogglePlay(null)}
                            />
                        )}
                        <button
                            className="redesign-audio-preview-btn"
                            title={isPlaying ? "Tạm dừng" : "Nghe thử"}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTogglePlay(asset.asset_id);
                            }}
                        >
                            {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: '1px' }} />}
                        </button>
                        {isPlaying ? (
                            <div className="redesign-equalizer">
                                <div className="redesign-equalizer-bar" />
                                <div className="redesign-equalizer-bar" />
                                <div className="redesign-equalizer-bar" />
                            </div>
                        ) : (
                            <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
                                {asset.category?.toUpperCase() || 'AUDIO'}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="redesign-asset-info">
                <span className="redesign-asset-name" title={asset.name}>{asset.name || asset.asset_id}</span>
                <span className="redesign-asset-id" title={asset.asset_id}>{asset.asset_id}</span>
            </div>

            <div style={{ padding: '0.25rem 0.35rem', borderTop: '1px solid rgba(245,237,220,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#101010' }}>
                <button
                    className="redesign-tree-btn"
                    style={{ fontSize: '0.62rem', padding: '1px 4px', display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                    title="Sao chép ID"
                    onClick={copyId}
                >
                    {copied ? <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓</span> : <><Copy size={10} /> <span>Copy</span></>}
                </button>
                <div style={{ display: 'flex', gap: '0.15rem' }}>
                    <button
                        className="redesign-tree-btn"
                        style={{ padding: '1px 3px' }}
                        title="Xem chi tiết"
                        onClick={(e) => { e.stopPropagation(); onDetail?.(asset); }}
                    >
                        <Eye size={10} />
                    </button>
                    <button
                        className="redesign-tree-btn danger"
                        style={{ padding: '1px 3px' }}
                        title="Xoá asset"
                        onClick={(e) => { e.stopPropagation(); onDelete(asset); }}
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
});

const CharacterCard = React.memo(function CharacterCard({ character, onDetail, onDelete }) {
    const [copied, setCopied] = useState(false);

    const copyId = (e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(character.character_id).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="redesign-asset-card" onClick={() => onDetail?.(character)}>
            <div className="redesign-asset-thumb">
                <span className="redesign-asset-badge badge-character">CHAR</span>
                {character.avatar_url ? (
                    <img src={getAssetUrl(character.avatar_url)} alt={character.name} loading="lazy" />
                ) : (
                    <UserSquare2 size={30} style={{ opacity: 0.4 }} />
                )}
            </div>

            <div className="redesign-asset-info">
                <span className="redesign-asset-name" title={character.name}>{character.name}</span>
                <span className="redesign-asset-id" title={character.character_id}>{character.character_id}</span>
            </div>

            <div style={{ padding: '0.25rem 0.35rem', borderTop: '1px solid rgba(245,237,220,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#101010' }}>
                <button
                    className="redesign-tree-btn"
                    style={{ fontSize: '0.62rem', padding: '1px 4px', display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                    title="Sao chép ID"
                    onClick={copyId}
                >
                    {copied ? <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓</span> : <><Copy size={10} /> <span>Copy</span></>}
                </button>
                <div style={{ display: 'flex', gap: '0.15rem' }}>
                    <button
                        className="redesign-tree-btn"
                        style={{ padding: '1px 3px' }}
                        title="Xem chi tiết"
                        onClick={(e) => { e.stopPropagation(); onDetail?.(character); }}
                    >
                        <Eye size={10} />
                    </button>
                    <button
                        className="redesign-tree-btn danger"
                        style={{ padding: '1px 3px' }}
                        title="Xoá nhân vật"
                        onClick={(e) => { e.stopPropagation(); onDelete(character); }}
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
});

const INITIAL_RENDER_LIMIT = 48;
const RENDER_BATCH_SIZE = 48;

const AssetPanel = React.memo(function AssetPanel({ onAddAsset, showNotification, reloadRef, isActive }) {
    const [activeCat, setActiveCat] = useState('all');
    const [catOpen, setCatOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [assets, setAssets] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playingAudioId, setPlayingAudioId] = useState(null);

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailAsset, setDetailAsset] = useState(null);
    const [detailKind, setDetailKind] = useState('asset');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: () => {} });

    const catDropdownRef = useRef(null);

    // Auto close category dropdown on outside click
    useEffect(() => {
        if (!catOpen) return;
        const handleClickOutside = (e) => {
            if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
                setCatOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [catOpen]);

    const showNotificationRef = useRef(showNotification);
    useEffect(() => {
        showNotificationRef.current = showNotification;
    }, [showNotification]);

    const [isReloading, setIsReloading] = useState(false);

    const loadData = useCallback(async (force = false) => {
        if (force) setIsReloading(true);
        else setLoading(true);

        try {
            const bundle = await EditorCache.getAssetsBundle({ force });
            setAssets(bundle.assets || []);
            setCharacters(bundle.characters || []);
            if (force) {
                showNotificationRef.current?.('Đã làm mới dữ liệu asset từ máy chủ', 'success');
            }
        } catch (err) {
            console.error('Failed to load asset panel data:', err);
            showNotificationRef.current?.('Tải danh sách asset thất bại', 'error');
        } finally {
            setLoading(false);
            setIsReloading(false);
        }
    }, []);

    useEffect(() => {
        loadData(false);
    }, [loadData]);

    // Reactive cache updates from other components/modals
    useEffect(() => {
        const handleCacheUpdate = (e) => {
            if (e.detail?.type === 'assets' || e.detail?.type === 'all') {
                loadData(false);
            }
        };
        window.addEventListener('cedEditorCacheUpdated', handleCacheUpdate);
        return () => {
            window.removeEventListener('cedEditorCacheUpdated', handleCacheUpdate);
        };
    }, [loadData]);

    useEffect(() => {
        if (reloadRef) reloadRef.current = () => loadData(true);
    }, [reloadRef, loadData]);

    const handleDeleteAsset = useCallback((asset) => {
        setConfirmData({
            title: 'XOÁ ASSET',
            message: `Bạn có chắc chắn muốn xoá asset "${asset.name || asset.asset_id}" không?`,
            onConfirm: async () => {
                setConfirmOpen(false);
                setLoading(true);
                try {
                    if (asset.category === 'gallery') await SupabaseAPI.deleteGallery(asset.asset_id);
                    else await SupabaseAPI.deleteAsset(asset.asset_id);

                    EditorCache.invalidateAssets();
                    showNotification?.('Đã xoá asset', 'success');
                    await loadData(false);
                } catch (err) {
                    console.error('Delete asset error:', err);
                    showNotification?.(`Xoá thất bại: ${err.message}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
        setConfirmOpen(true);
    }, [loadData, showNotification]);

    const handleDeleteChar = useCallback((char) => {
        setConfirmData({
            title: 'XOÁ NHÂN VẬT',
            message: `Bạn có chắc chắn muốn xoá nhân vật "${char.name}" không?`,
            onConfirm: async () => {
                setConfirmOpen(false);
                setLoading(true);
                try {
                    await SupabaseAPI.deleteCharacter(char.character_id);
                    EditorCache.invalidateAssets();
                    showNotification?.('Đã xoá nhân vật', 'success');
                    await loadData(false);
                } catch (err) {
                    console.error('Delete char error:', err);
                    showNotification?.(`Xoá thất bại: ${err.message}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
        setConfirmOpen(true);
    }, [loadData, showNotification]);

    const handleTogglePlay = useCallback((id) => {
        setPlayingAudioId(prev => prev === id ? null : id);
    }, []);

    const handleDetailAsset = useCallback((asset) => {
        setDetailAsset(asset);
        setDetailKind('asset');
        setDetailOpen(true);
    }, []);

    const handleDetailChar = useCallback((char) => {
        setDetailAsset(char);
        setDetailKind('character');
        setDetailOpen(true);
    }, []);

    const matchesCategory = useCallback((asset, catKey) => {
        if (catKey === 'all') return true;
        const cat = (asset.category || '').toLowerCase();
        const type = (asset.type || '').toLowerCase();
        const target = catKey.toLowerCase();

        if (target === 'video') {
            return cat === 'video' || cat === 'pv' || type === 'video';
        }
        if (target === 'bgm') {
            return cat === 'bgm' || (type === 'audio' && cat !== 'sfx');
        }
        if (target === 'sfx') {
            return cat === 'sfx';
        }
        return cat === target || type === target;
    }, []);

    // Memoize category counts to prevent repeated filtering on every render
    const categoryCounts = useMemo(() => {
        const counts = {
            all: assets.length + characters.length,
            character: characters.length
        };
        for (const a of assets) {
            for (const cat of CATEGORIES) {
                if (cat.key === 'all' || cat.key === 'character') continue;
                if (matchesCategory(a, cat.key)) {
                    counts[cat.key] = (counts[cat.key] || 0) + 1;
                }
            }
        }
        return counts;
    }, [assets, characters, matchesCategory]);

    const activeCatObj = CATEGORIES.find(c => c.key === activeCat) || CATEGORIES[0];
    const ActiveCatIcon = activeCatObj.Icon;
    const isCharCat = activeCat === 'character';

    const filteredAssets = useMemo(() => {
        const q = search.trim().toLowerCase();
        return assets.filter(a => {
            const matchesCat = matchesCategory(a, activeCat);
            const matchesSearch = !q || 
                (a.name && a.name.toLowerCase().includes(q)) ||
                (a.asset_id && a.asset_id.toLowerCase().includes(q));
            return matchesCat && matchesSearch;
        });
    }, [assets, activeCat, search, matchesCategory]);

    const filteredChars = useMemo(() => {
        const q = search.trim().toLowerCase();
        return characters.filter(c =>
            !q ||
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.character_id && c.character_id.toLowerCase().includes(q))
        );
    }, [characters, search]);

    const totalDisplayCount = isCharCat ? filteredChars.length : (activeCat === 'all' ? (filteredAssets.length + filteredChars.length) : filteredAssets.length);

    const [renderLimit, setRenderLimit] = useState(INITIAL_RENDER_LIMIT);

    // Reset render limit when category or search changes
    useEffect(() => {
        setRenderLimit(INITIAL_RENDER_LIMIT);
    }, [activeCat, search]);

    const scrollContainerRef = useRef(null);
    const lastScrollTopRef = useRef(0);

    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        lastScrollTopRef.current = scrollTop;
        if (scrollHeight - scrollTop - clientHeight < 350) {
            setRenderLimit(prev => Math.min(prev + RENDER_BATCH_SIZE, totalDisplayCount));
        }
    }, [totalDisplayCount]);

    // Restore scroll position when tab becomes active
    useEffect(() => {
        if (isActive && scrollContainerRef.current && lastScrollTopRef.current > 0) {
            scrollContainerRef.current.scrollTop = lastScrollTopRef.current;
        }
    }, [isActive]);

    // Slice visible characters and assets based on renderLimit
    const visibleChars = useMemo(() => {
        if (!isCharCat && activeCat !== 'all') return [];
        return filteredChars.slice(0, renderLimit);
    }, [filteredChars, renderLimit, isCharCat, activeCat]);

    const visibleAssets = useMemo(() => {
        if (isCharCat) return [];
        if (activeCat === 'all') {
            const charCount = filteredChars.length;
            if (renderLimit <= charCount) return [];
            return filteredAssets.slice(0, renderLimit - charCount);
        }
        return filteredAssets.slice(0, renderLimit);
    }, [filteredAssets, filteredChars.length, renderLimit, isCharCat, activeCat]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top Toolbar */}
            <div className="editor-panel-toolbar">
                <div className="editor-toolbar-header">
                    <span className="editor-toolbar-title">QUẢN LÝ ASSET</span>
                    <span className="editor-toolbar-badge">
                        {totalDisplayCount}
                    </span>
                </div>
                <div className="editor-toolbar-actions">
                    <button
                        className="editor-toolbar-btn"
                        onClick={() => loadData(true)}
                        disabled={isReloading}
                        title="Làm mới danh sách asset từ máy chủ"
                    >
                        <RotateCw size={12} className={isReloading ? 'spinning' : ''} />
                        <span>Làm mới</span>
                    </button>
                    <button
                        className="editor-toolbar-btn primary"
                        onClick={() => onAddAsset(activeCat)}
                    >
                        <Plus size={12} />
                        <span>Thêm Asset</span>
                    </button>
                </div>
            </div>

            {/* Search & Category Filter Dropdown */}
            <div className="redesign-asset-filter-bar">
                {/* Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1A1A1A', border: '1px solid rgba(245,237,220,0.18)', padding: '0.35rem 0.6rem', borderRadius: '3px' }}>
                    <Search size={13} style={{ color: 'rgba(245,237,220,0.4)', marginRight: '0.4rem' }} />
                    <input 
                        className="redesign-input" 
                        style={{ border: 'none', padding: 0, background: 'transparent', width: '100%', fontSize: '0.8rem' }}
                        placeholder="Tìm theo tên hoặc ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button style={{ border: 'none', background: 'transparent', color: 'rgba(245,237,220,0.5)', cursor: 'pointer', display: 'flex', padding: 0 }} onClick={() => setSearch('')}>
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Collapsible Category Filter Trigger & Menu */}
                <div style={{ position: 'relative' }} ref={catDropdownRef}>
                    <button
                        type="button"
                        className="redesign-cat-dropdown-trigger"
                        onClick={() => setCatOpen(prev => !prev)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Filter size={12} style={{ color: 'var(--color-terracotta)' }} />
                            <ActiveCatIcon size={13} />
                            <span>{activeCatObj.label}</span>
                            <span style={{ opacity: 0.6, fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                                ({categoryCounts[activeCat] || 0})
                            </span>
                        </div>
                        <ChevronDown size={14} className={`cat-chevron ${catOpen ? 'open' : ''}`} />
                    </button>

                    {catOpen && (
                        <div className="redesign-cat-dropdown-menu">
                            {CATEGORIES.map(cat => {
                                const Icon = cat.Icon;
                                const count = categoryCounts[cat.key] || 0;
                                const isActive = activeCat === cat.key;
                                return (
                                    <button
                                        key={cat.key}
                                        type="button"
                                        className={`redesign-cat-dropdown-item ${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveCat(cat.key);
                                            setCatOpen(false);
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Icon size={12} />
                                            <span>{cat.label}</span>
                                        </div>
                                        <span style={{ opacity: 0.7, fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Content Area */}
            <div ref={scrollContainerRef} className="redesign-asset-scroll-area" onScroll={handleScroll}>
                {loading ? (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        <Loader className="spinning" size={18} /> Đang tải dữ liệu asset...
                    </div>
                ) : totalDisplayCount === 0 ? (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'rgba(245,237,220,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <Search size={32} style={{ opacity: 0.3 }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                            {search ? `Không tìm thấy asset phù hợp với "${search}"` : 'Không có asset nào trong danh mục này'}
                        </span>
                        {search && (
                            <button className="redesign-btn secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }} onClick={() => setSearch('')}>
                                Xoá bộ lọc tìm kiếm
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="redesign-asset-grid">
                        {visibleChars.map((char, idx) => (
                            <CharacterCard
                                key={`char-${char.character_id || idx}-${idx}`}
                                character={char}
                                onDetail={handleDetailChar}
                                onDelete={handleDeleteChar}
                            />
                        ))}
                        {visibleAssets.map((asset, idx) => (
                            <AssetCard
                                key={`asset-${asset.category || 'misc'}-${asset.asset_id || idx}-${idx}`}
                                asset={asset}
                                isPlaying={playingAudioId === asset.asset_id}
                                onTogglePlay={handleTogglePlay}
                                onDetail={handleDetailAsset}
                                onDelete={handleDeleteAsset}
                            />
                        ))}
                        {renderLimit < totalDisplayCount && (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: '0.75rem 0.5rem',
                                color: 'rgba(245,237,220,0.4)',
                                fontSize: '0.68rem',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                Đang hiển thị {Math.min(renderLimit, totalDisplayCount)} / {totalDisplayCount} mục • Cuộn xuống để xem thêm
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AssetDetailModal
                isOpen={detailOpen}
                asset={detailAsset}
                kind={detailKind}
                onClose={() => setDetailOpen(false)}
                onUpdated={loadData}
                showNotification={showNotification}
            />

            <ConfirmModal
                isOpen={confirmOpen}
                title={confirmData.title}
                message={confirmData.message}
                onConfirm={confirmData.onConfirm}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
});

export default AssetPanel;
