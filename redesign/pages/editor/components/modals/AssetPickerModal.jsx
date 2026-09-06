import React, { useState, useEffect } from 'react';
import { X, Search, Loader, Image as ImageIcon, Plus } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import { getAssetUrl } from '../../../../../src/utils/assetUtils';
import AddAssetModal from './AddAssetModal';
import '../editorComponents.css';

const CATEGORIES = [
    { key: 'all', label: 'Tất cả' },
    { key: 'background', label: 'Background' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'thumbnail', label: 'Thumnails' },
    { key: 'banner', label: 'Banner' },
    { key: 'wallpaper', label: 'Wallpaper' },
    { key: 'video', label: 'Video' },
    { key: 'bgm', label: 'BGM' },
    { key: 'sfx', label: 'SFX' },
];

export default function AssetPickerModal({ isOpen, onClose, onSelect, filterType, multiSelect = false }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCat, setActiveCat] = useState('all');
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedAssets, setSelectedAssets] = useState(new Map());

    useEffect(() => {
        if (filterType) setActiveCat(filterType);
        else setActiveCat('all');
    }, [filterType, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedAssets(new Map());
            return;
        }
        loadAssets();
    }, [isOpen]);

    const loadAssets = async () => {
        setLoading(true);
        try {
            if (filterType === 'character') {
                const charData = await SupabaseAPI.getCharacters();
                const mappedChars = (charData || []).map(c => ({
                    asset_id: c.character_id,
                    name: c.name,
                    url: c.avatar_url,
                    type: 'character',
                    category: 'character'
                }));
                setAssets(mappedChars);
            } else {
                const [assetData, galleryData] = await Promise.all([
                    SupabaseAPI.getAssets(),
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
            }
        } catch (err) {
            console.error('AssetPicker load failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAssetSubmit = async (newAssetData) => {
        try {
            if (newAssetData.type === 'character') {
                await SupabaseAPI.createCharacter({
                    id: newAssetData.asset_id,
                    name: newAssetData.name,
                    description: newAssetData.description || ''
                });
            } else if (newAssetData.category === 'gallery') {
                await SupabaseAPI.createGallery({
                    gallery_id: newAssetData.asset_id,
                    title: newAssetData.name,
                    image_url: newAssetData.url || ''
                });
            } else {
                await SupabaseAPI.createAsset({
                    asset_id: newAssetData.asset_id,
                    name: newAssetData.name,
                    description: newAssetData.description || '',
                    type: newAssetData.type,
                    category: newAssetData.category,
                    url: newAssetData.url || ''
                });
            }
            await loadAssets();
            setShowAddModal(false);
        } catch (err) {
            console.error('Create asset failed:', err);
        }
    };

    if (!isOpen) return null;

    const filtered = assets.filter(item => {
        const matchesCat = activeCat === 'all' || item.category === activeCat || item.type === activeCat;
        const matchesSearch = !search || 
            (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
            (item.asset_id && item.asset_id.toLowerCase().includes(search.toLowerCase()));
        return matchesCat && matchesSearch;
    });

    const toggleSelect = (item) => {
        if (multiSelect) {
            const nextMap = new Map(selectedAssets);
            if (nextMap.has(item.asset_id)) nextMap.delete(item.asset_id);
            else nextMap.set(item.asset_id, item);
            setSelectedAssets(nextMap);
        } else {
            onSelect(item);
        }
    };

    const handleConfirmMulti = () => {
        onSelect(Array.from(selectedAssets.values()));
    };

    return (
        <>
            <div className="redesign-modal-overlay" onClick={onClose}>
                <div className="redesign-modal-card wide" onClick={(e) => e.stopPropagation()}>
                    <div className="redesign-modal-header">
                        <div className="redesign-modal-title">
                            <ImageIcon size={20} />
                            <span>CHỌN ASSET {multiSelect ? '(CHỌN NHIỀU)' : ''}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button className="redesign-btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setShowAddModal(true)}>
                                <Plus size={14} /> Thêm mới
                            </button>
                            <button className="redesign-modal-close" onClick={onClose}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: '0.75rem 1.5rem', backgroundColor: '#141414', borderBottom: '1px solid rgba(245,237,220,0.15)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1A1A1A', border: '1px solid rgba(245,237,220,0.2)', padding: '0.4rem 0.75rem', flex: 1, minWidth: '200px' }}>
                            <Search size={14} style={{ color: 'rgba(245,237,220,0.5)', marginRight: '0.5rem' }} />
                            <input 
                                className="redesign-input" 
                                style={{ border: 'none', padding: 0, background: 'transparent', width: '100%' }}
                                placeholder="Tìm theo tên hoặc ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.key}
                                    className={`redesign-tool-btn ${activeCat === cat.key ? 'active' : ''}`}
                                    onClick={() => setActiveCat(cat.key)}
                                    style={activeCat === cat.key ? { backgroundColor: '#D84315', borderColor: '#D84315' } : {}}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="redesign-modal-body">
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.6 }}>
                                <Loader className="spinning" size={24} /> Đang tải danh sách asset...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
                                NO_MATCHING_ASSETS
                            </div>
                        ) : (
                            <div className="redesign-asset-grid">
                                {filtered.map(item => {
                                    const isSelected = selectedAssets.has(item.asset_id);
                                    return (
                                        <div 
                                            key={item.asset_id}
                                            className="redesign-asset-card"
                                            style={isSelected ? { borderColor: '#D84315', backgroundColor: 'rgba(216,67,21,0.15)' } : {}}
                                            onClick={() => toggleSelect(item)}
                                        >
                                            <div className="redesign-asset-thumb">
                                                {item.url ? (
                                                    <img src={getAssetUrl(item.url)} alt={item.name} loading="lazy" />
                                                ) : (
                                                    <ImageIcon size={32} style={{ opacity: 0.3 }} />
                                                )}
                                            </div>
                                            <div className="redesign-asset-info">
                                                <span className="redesign-asset-name">{item.name}</span>
                                                <span className="redesign-asset-id">{item.asset_id}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="redesign-modal-footer">
                        <button className="redesign-btn" onClick={onClose}>Hủy</button>
                        {multiSelect && (
                            <button 
                                className="redesign-btn primary"
                                disabled={selectedAssets.size === 0}
                                onClick={handleConfirmMulti}
                            >
                                Chọn {selectedAssets.size} asset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <AddAssetModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddAssetSubmit}
                initialCategory={activeCat}
            />
        </>
    );
}
