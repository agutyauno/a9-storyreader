import React, { useState, useEffect } from 'react';
import { Plus, X, Loader, Image as ImageIcon } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import { getAssetUrl } from '../../utils/assetUtils';
import styles from './EventGalleryManager.module.css';

/**
 * Manages the art gallery images for a specific Event.
 */
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
            setGallery(data);
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
                // Determine next display order
                let currentMaxOrder = gallery.length > 0 
                    ? Math.max(...gallery.map(g => g.display_order || 0)) 
                    : -1;
                
                for (const asset of assetList) {
                    const url = asset.url;
                    currentMaxOrder++;
                    
                    // Get filename as default title
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
                showNotification?.(`Đã thêm ${assetList.length} ảnh vào bộ sưu tập`);
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
            showNotification?.('Đã xóa ảnh');
        } catch (err) {
            console.error('Delete gallery image failed:', err);
            showNotification?.('Xóa ảnh thất bại', 'error');
        }
    };

    if (loading) return <div className={styles.loading}><Loader className={styles.spinner} /> Đang tải...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Artwork Gallery</h3>
                <button className={styles.addBtn} onClick={handleAdd}>
                    <Plus size={14} /> Thêm ảnh
                </button>
            </div>

            <p className={styles.helpText}>
                Ảnh ở đây sẽ được hiển thị trong mục "Art Gallery" của trang Event.
            </p>

            <div className={styles.grid}>
                {gallery.length === 0 ? (
                    <div className={styles.empty}>Chưa có ảnh nào.</div>
                ) : (
                    gallery.map(img => (
                        <div key={img.gallery_id} className={styles.card}>
                            <div className={styles.imageWrap} onClick={() => onPreview?.(img, 'asset')}>
                                <img src={getAssetUrl(img.image_url)} alt={img.title} />
                                <button className={styles.deleteBtn} onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(img.gallery_id);
                                }}>
                                    <X size={14} />
                                </button>
                            </div>
                            <div className={styles.cardInfo}>
                                <input 
                                    className={styles.titleInput}
                                    defaultValue={img.title}
                                    onBlur={(e) => handleUpdateTitle(img.gallery_id, e.target.value)}
                                    placeholder="Tiêu đề ảnh..."
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
