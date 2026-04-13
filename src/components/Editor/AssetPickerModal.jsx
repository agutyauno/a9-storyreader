import React, { useState, useEffect } from 'react';
import { X, Search, Loader, Image as ImageIcon, Music, Video, Plus } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import { getAssetUrl } from '../../utils/assetUtils';
import styles from './AssetPickerModal.module.css';
import AddAssetModal from './AddAssetModal';

const CATEGORIES = [
    { key: 'all', label: 'Tất cả' },
    { key: 'background', label: 'Background' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'thumbnail', label: 'Thumnails' },
    { key: 'banner', label: 'Banner' },
    { key: 'video', label: 'Video' },
    { key: 'bgm', label: 'BGM' },
    { key: 'sfx', label: 'SFX' },
];

/**
 * Modal to browse and select an asset (returns url to callback).
 * Props:
 *   isOpen        — boolean
 *   onClose()     — close modal
 *   onSelect(url) — called with the selected asset's url
 *   filterType    — optional: e.g. 'image' to only show images
 */
export default function AssetPickerModal({ isOpen, onClose, onSelect, filterType }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCat, setActiveCat] = useState('all');
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (filterType) {
            setActiveCat(filterType);
        } else {
            setActiveCat('all');
        }
    }, [filterType, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
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

    const handleAddAsset = async (newAssetData) => {
        try {
            if (newAssetData.type === 'character') {
                await SupabaseAPI.createCharacter({
                    id: newAssetData.asset_id,
                    name: newAssetData.name,
                    description: newAssetData.description || '',
                    expressions: newAssetData.expressions || []
                });
            } else if (newAssetData.category === 'gallery') {
                await SupabaseAPI.createGallery({
                    gallery_id: newAssetData.asset_id,
                    title: newAssetData.name,
                    image_url: newAssetData.url || '',
                    display_order: 0
                });
            } else {
                await SupabaseAPI.createAsset({
                    asset_id: newAssetData.asset_id,
                    type: newAssetData.type,
                    category: newAssetData.category,
                    url: newAssetData.url || '',
                });
            }
            await loadAssets(); // Refresh list
            setShowAddModal(false);
        } catch (err) {
            console.error('Failed to create asset from picker:', err);
            throw err;
        }
    };

    if (!isOpen) return null;

    const filtered = assets.filter(a => {
        // Category filter
        if (activeCat !== 'all') {
            if (activeCat === 'bgm' && !(a.type === 'audio' && a.category === 'bgm')) return false;
            if (activeCat === 'sfx' && !(a.type === 'audio' && a.category === 'sfx')) return false;
            if (activeCat === 'background' && a.category !== 'background' && a.category !== 'gallery') return false;
            if (activeCat === 'gallery' && a.category !== 'gallery') return false;
            if (activeCat === 'thumbnail' && a.category !== 'thumbnail') return false;
            if (activeCat === 'banner' && a.category !== 'banner') return false;
            if (activeCat === 'image' && a.type !== 'image') return false;
            if (activeCat === 'video' && a.type !== 'video') return false;
        }
        // Type/Category filter override
        if (filterType && a.type !== filterType && a.category !== filterType) return false;
        // Search
        const q = search.toLowerCase();
        if (q && !a.name?.toLowerCase().includes(q) && !a.asset_id?.toLowerCase().includes(q)) return false;
        return true;
    });

    const handleSelect = (asset) => {
        onSelect?.(asset);
        onClose();
    };

    const renderThumb = (asset) => {
        if (asset.type === 'character' || asset.type === 'image') {
            return <img src={getAssetUrl(asset.url)} alt={asset.name} loading="lazy" />;
        }
        if (asset.type === 'video') return <Video size={24} />;
        if (asset.type === 'audio') return <Music size={24} />;
        return <ImageIcon size={24} />;
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3>Chọn Asset</h3>
                        <button
                            className={styles.addBtn}
                            onClick={() => setShowAddModal(true)}
                            title="Thêm Asset mới"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <Search size={14} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Tìm asset..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category tabs */}
                {!filterType && (
                    <div className={styles.categories}>
                        {CATEGORIES.map(c => (
                            <button
                                key={c.key}
                                className={`${styles.catBtn} ${activeCat === c.key ? styles.active : ''}`}
                                onClick={() => setActiveCat(c.key)}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                <div className={styles.grid}>
                    {loading ? (
                        <div className={styles.center}>
                            <Loader size={24} className={styles.spinner} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.center}>
                            <p>Không tìm thấy asset nào.</p>
                        </div>
                    ) : (
                        filtered.map(asset => (
                            <div
                                key={asset.asset_id}
                                className={styles.card}
                                onClick={() => handleSelect(asset)}
                            >
                                <div className={styles.cardPreview}>
                                    {renderThumb(asset)}
                                </div>
                                <div className={styles.cardInfo}>
                                    <div className={styles.cardName}>{asset.name || asset.asset_id}</div>
                                    <div className={styles.cardId}>{asset.asset_id}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <AddAssetModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddAsset}
                initialCategory={activeCat}
            />
        </div>
    );
}
