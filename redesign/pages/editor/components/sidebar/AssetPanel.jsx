import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Loader, Trash2, Copy, Music, Image, Video, Film, UserSquare2, LayoutDashboard } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import AssetDetailModal from '../modals/AssetDetailModal';
import ConfirmModal from '../modals/ConfirmModal';
import { getAssetUrl } from '../../../../../src/utils/assetUtils';
import '../editorComponents.css';

const CATEGORIES = [
    { key: 'all', label: 'Tất cả', Icon: LayoutDashboard },
    { key: 'character', label: 'Characters', Icon: UserSquare2 },
    { key: 'background', label: 'Background', Icon: Image },
    { key: 'gallery', label: 'Gallery', Icon: Film },
    { key: 'thumbnail', label: 'Thumnails', Icon: Image },
    { key: 'banner', label: 'Banner', Icon: Image },
    { key: 'wallpaper', label: 'Wallpaper', Icon: Image },
    { key: 'video', label: 'Video', Icon: Video },
    { key: 'bgm', label: 'BGM', Icon: Music },
    { key: 'sfx', label: 'SFX', Icon: Music },
];

function AssetCard({ asset, onDelete, onDetail, isPlaying, onTogglePlay }) {
    const [copied, setCopied] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) audioRef.current.play().catch(() => {});
        else audioRef.current.pause();
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

    return (
        <div className="redesign-asset-card" onClick={() => onDetail?.(asset)}>
            <div className="redesign-asset-thumb">
                {isImage && <img src={getAssetUrl(asset.url)} alt={asset.name} loading="lazy" />}
                {isVideo && <Video size={28} style={{ opacity: 0.5 }} />}
                {isAudio && <Music size={24} style={{ opacity: 0.6 }} />}
            </div>

            <div className="redesign-asset-info">
                <span className="redesign-asset-name">{asset.name || asset.asset_id}</span>
                <span className="redesign-asset-id">{asset.asset_id}</span>
            </div>

            <div style={{ padding: '0.3rem 0.5rem', borderTop: '1px solid rgba(245,237,220,0.1)', display: 'flex', justifyContent: 'space-between', backgroundColor: '#141414' }}>
                <button className="redesign-tree-btn" style={{ fontSize: '0.7rem' }} title="Copy ID" onClick={copyId}>
                    {copied ? '✓' : <Copy size={11} />}
                </button>
                <button className="redesign-tree-btn danger" title="Xoá" onClick={(e) => { e.stopPropagation(); onDelete(asset); }}>
                    <Trash2 size={11} />
                </button>
            </div>
        </div>
    );
}

function CharacterCard({ character, onDetail, onDelete }) {
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
                {character.avatar_url ? (
                    <img src={getAssetUrl(character.avatar_url)} alt={character.name} loading="lazy" />
                ) : (
                    <UserSquare2 size={36} style={{ opacity: 0.4 }} />
                )}
            </div>

            <div className="redesign-asset-info">
                <span className="redesign-asset-name">{character.name}</span>
                <span className="redesign-asset-id">{character.character_id}</span>
            </div>

            <div style={{ padding: '0.3rem 0.5rem', borderTop: '1px solid rgba(245,237,220,0.1)', display: 'flex', justifyContent: 'space-between', backgroundColor: '#141414' }}>
                <button className="redesign-tree-btn" style={{ fontSize: '0.7rem' }} title="Copy ID" onClick={copyId}>
                    {copied ? '✓' : <Copy size={11} />}
                </button>
                <button className="redesign-tree-btn danger" title="Xoá" onClick={(e) => { e.stopPropagation(); onDelete(character); }}>
                    <Trash2 size={11} />
                </button>
            </div>
        </div>
    );
}

export default function AssetPanel({ onAddAsset, showNotification, reloadRef }) {
    const [activeCat, setActiveCat] = useState('all');
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

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (reloadRef) reloadRef.current = loadData;
    }, [reloadRef]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assetData, charData, galleryData] = await Promise.all([
                SupabaseAPI.getAssets(),
                SupabaseAPI.getCharacters(),
                SupabaseAPI.getAllGallery(),
            ]);

            const mappedGallery = (galleryData || []).map(g => ({
                asset_id: g.gallery_id,
                name: g.title,
                url: g.image_url,
                type: 'image',
                category: 'gallery'
            }));

            setAssets([...(assetData || []), ...mappedGallery]);
            setCharacters(charData || []);
        } catch (err) {
            console.error('Failed to load asset panel data:', err);
            showNotification?.('Tải danh sách asset thất bại', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAsset = (asset) => {
        setConfirmData({
            title: 'XOÁ ASSET',
            message: `Bạn có chắc chắn muốn xoá asset "${asset.name || asset.asset_id}" không?`,
            onConfirm: async () => {
                setConfirmOpen(false);
                setLoading(true);
                try {
                    if (asset.category === 'gallery') await SupabaseAPI.deleteGallery(asset.asset_id);
                    else await SupabaseAPI.deleteAsset(asset.asset_id);

                    showNotification?.('Đã xoá asset', 'success');
                    await loadData();
                } catch (err) {
                    console.error('Delete asset error:', err);
                    showNotification?.(`Xoá thất bại: ${err.message}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
        setConfirmOpen(true);
    };

    const handleDeleteChar = (char) => {
        setConfirmData({
            title: 'XOÁ NHÂN VẬT',
            message: `Bạn có chắc chắn muốn xoá nhân vật "${char.name}" không?`,
            onConfirm: async () => {
                setConfirmOpen(false);
                setLoading(true);
                try {
                    await SupabaseAPI.deleteCharacter(char.character_id);
                    showNotification?.('Đã xoá nhân vật', 'success');
                    await loadData();
                } catch (err) {
                    console.error('Delete char error:', err);
                    showNotification?.(`Xoá thất bại: ${err.message}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
        setConfirmOpen(true);
    };

    const isCharCat = activeCat === 'character';
    const filteredAssets = assets.filter(a => {
        const matchesCat = activeCat === 'all' || a.category === activeCat;
        const matchesSearch = !search || 
            (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
            (a.asset_id && a.asset_id.toLowerCase().includes(search.toLowerCase()));
        return matchesCat && matchesSearch;
    });

    const filteredChars = characters.filter(c =>
        !search ||
        (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
        (c.character_id && c.character_id.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '0.65rem 0.75rem', backgroundColor: '#141414', borderBottom: '1px solid rgba(245,237,220,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(245,237,220,0.6)' }}>QUẢN LÝ ASSET</span>
                <button
                    className="redesign-btn primary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                    onClick={() => onAddAsset(activeCat)}
                >
                    <Plus size={12} /> Thêm Asset
                </button>
            </div>

            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#121212', borderBottom: '1px solid rgba(245,237,220,0.15)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1A1A1A', border: '1px solid rgba(245,237,220,0.2)', padding: '0.35rem 0.6rem' }}>
                    <Search size={13} style={{ color: 'rgba(245,237,220,0.5)', marginRight: '0.4rem' }} />
                    <input 
                        className="redesign-input" 
                        style={{ border: 'none', padding: 0, background: 'transparent', width: '100%', fontSize: '0.8rem' }}
                        placeholder="Tìm asset..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '2px' }}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.key}
                            className={`redesign-tool-btn ${activeCat === cat.key ? 'active' : ''}`}
                            style={activeCat === cat.key ? { backgroundColor: '#D84315', borderColor: '#D84315' } : { fontSize: '0.7rem' }}
                            onClick={() => setActiveCat(cat.key)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}><Loader className="spinning" size={18} /> Đang tải asset...</div>
                ) : isCharCat ? (
                    <div className="redesign-asset-grid">
                        {filteredChars.map(char => (
                            <CharacterCard
                                key={char.character_id}
                                character={char}
                                onDetail={(c) => { setDetailAsset(c); setDetailKind('character'); setDetailOpen(true); }}
                                onDelete={handleDeleteChar}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="redesign-asset-grid">
                        {filteredAssets.map(asset => (
                            <AssetCard
                                key={asset.asset_id}
                                asset={asset}
                                isPlaying={playingAudioId === asset.asset_id}
                                onTogglePlay={(id) => setPlayingAudioId(playingAudioId === id ? null : id)}
                                onDetail={(a) => { setDetailAsset(a); setDetailKind('asset'); setDetailOpen(true); }}
                                onDelete={handleDeleteAsset}
                            />
                        ))}
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
}
