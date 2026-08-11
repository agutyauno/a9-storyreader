import React, { useState, useEffect } from 'react';
import { Plus, X, Loader, Image as ImageIcon } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import { getAssetUrl } from '../../../../../src/utils/assetUtils';
import '../editorComponents.css';

export default function EventGalleryManager({ eventId, showNotification, onPickAsset, onPreview }) {
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (eventId) fetchData();
    }, [eventId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await SupabaseAPI.getGalleryByEvent(eventId);
            setGallery(data || []);
        } catch (err) {
            console.error('Failed to fetch gallery:', err);
            showNotification?.('Không thể tải bộ sưu tập ảnh', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTitle = async (galleryId, newTitle) => {
        try {
            await SupabaseAPI.updateGallery(galleryId, { title: newTitle });
            setGallery(prev => prev.map(g => g.gallery_id === galleryId ? { ...g, title: newTitle } : g));
        } catch (err) {
            console.error('Update gallery title failed:', err);
            showNotification?.('Cập nhật tiêu đề thất bại', 'error');
        }
    };

    const handleAdd = () => {
        onPickAsset?.(async (assets) => {
            const assetList = Array.isArray(assets) ? assets : [assets];
            if (assetList.length === 0) return;

            setLoading(true);
            try {
                let currentMaxOrder = gallery.length > 0 
                    ? Math.max(...gallery.map(g => g.display_order || 0)) 
                    : -1;
                
                for (const asset of assetList) {
                    const url = asset.url;
                    currentMaxOrder++;
                    
                    const filename = url.split('/').pop().split('.')[0] || 'New Image';
                    const formattedTitle = filename.replace(/_/g, ' ').replace(/-/g, ' ');

                    await SupabaseAPI.createGallery({
                        gallery_id: asset.asset_id,
                        event_id: eventId,
                        image_url: url,
                        title: formattedTitle,
                        display_order: currentMaxOrder
                    });
                }
                
                await fetchData();
                showNotification?.(`Đã thêm ${assetList.length} ảnh vào bộ sưu tập`, 'success');
            } catch (err) {
                console.error('Add gallery images failed:', err);
                showNotification?.('Thêm ảnh thất bại', 'error');
            } finally {
                setLoading(false);
            }
        }, { filter: 'gallery', multi: true });
    };

    const handleDelete = async (galleryId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi bộ sưu tập?')) return;
        
        try {
            await SupabaseAPI.deleteGallery(galleryId);
            setGallery(prev => prev.filter(g => g.gallery_id !== galleryId));
            showNotification?.('Đã xóa ảnh khỏi bộ sưu tập', 'success');
        } catch (err) {
            console.error('Delete gallery image failed:', err);
            showNotification?.('Xóa ảnh thất bại', 'error');
        }
    };

    if (loading) return <div style={{ padding: '1rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Loader className="spinning" size={16} /> Đang tải bộ sưu tập...</div>;

    return (
        <div style={{ marginTop: '1.5rem', backgroundColor: '#141414', border: '1px solid rgba(245,237,220,0.15)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontFamily: 'Share Tech Mono', color: '#F5EDDC', textTransform: 'uppercase' }}>ARTWORK GALLERY ({gallery.length})</h4>
                <button className="redesign-btn primary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }} onClick={handleAdd}>
                    <Plus size={14} /> Thêm Gallery
                </button>
            </div>

            {gallery.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(245,237,220,0.4)', fontFamily: 'Share Tech Mono', fontSize: '0.85rem' }}>
                    CHƯA CÓ ARTWORK GALLERY NÀO
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {gallery.map(item => (
                        <div key={item.gallery_id} style={{ backgroundColor: '#1C1C1C', border: '1px solid rgba(245,237,220,0.15)', overflow: 'hidden' }}>
                            <div style={{ height: '90px', backgroundColor: '#0A0A0A', position: 'relative', cursor: 'pointer' }} onClick={() => onPreview?.(item, 'asset')}>
                                {item.image_url ? (
                                    <img src={getAssetUrl(item.image_url)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <ImageIcon size={32} style={{ margin: '29px auto', opacity: 0.3, display: 'block' }} />
                                )}
                                <button className="redesign-btn danger" style={{ position: 'absolute', top: '4px', right: '4px', padding: '2px 4px' }} onClick={(e) => { e.stopPropagation(); handleDelete(item.gallery_id); }}>
                                    <X size={12} />
                                </button>
                            </div>
                            <div style={{ padding: '0.4rem' }}>
                                <input 
                                    className="redesign-input"
                                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', width: '100%' }}
                                    defaultValue={item.title || ''}
                                    onBlur={(e) => handleUpdateTitle(item.gallery_id, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
