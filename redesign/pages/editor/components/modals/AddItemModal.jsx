import React, { useState, useEffect } from 'react';
import { X, Loader, Plus, Save } from 'lucide-react';
import '../editorComponents.css';

export default function AddItemModal({ isOpen, type, onClose, onSubmit, onPickAsset, initialDisplayOrder, initialData }) {
    const [name, setName] = useState('');
    const [itemId, setItemId] = useState('');
    const [description, setDescription] = useState('');
    const [displayOrder, setDisplayOrder] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [wallpaperUrl, setWallpaperUrl] = useState('');
    const [status, setStatus] = useState('published');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const isEditMode = !!initialData;

    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            setName(initialData.name || '');
            setItemId(String(initialData.id || ''));
            setDescription(initialData.description || '');
            setDisplayOrder(initialData.display_order ?? '');
            setImageUrl(initialData.icon_url || initialData.image_url || '');
            setBannerUrl(initialData.banner_url || '');
            setWallpaperUrl(initialData.wallpaper_url || '');
            setStatus(initialData.status || 'published');
        } else {
            setName('');
            setItemId('');
            setDescription('');
            setDisplayOrder(initialDisplayOrder || '');
            setImageUrl('');
            setBannerUrl('');
            setWallpaperUrl('');
            setStatus('published');
        }
        setError(null);
    }, [isOpen, initialDisplayOrder, initialData]);

    if (!isOpen) return null;

    const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Item';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !itemId.trim()) {
            setError('Vui lòng nhập Tên và ID');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit({
                type,
                name: name.trim(),
                id: itemId.trim(),
                description: description.trim(),
                displayOrder: displayOrder !== '' ? parseInt(displayOrder) : 0,
                imageUrl: imageUrl.trim() || null,
                bannerUrl: bannerUrl.trim() || null,
                wallpaperUrl: wallpaperUrl.trim() || null,
                status: type === 'story' ? status : undefined,
            }, isEditMode);

            onClose();
        } catch (err) {
            console.error('Submit item failed:', err);
            setError(err.message || 'Thao tác thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBrowseImage = (field) => {
        onPickAsset?.((asset) => {
            if (field === 'icon') setImageUrl(asset.url);
            else if (field === 'banner') setBannerUrl(asset.url);
            else if (field === 'wallpaper') setWallpaperUrl(asset.url);
        });
    };

    return (
        <div className="redesign-modal-overlay" onClick={onClose}>
            <div className="redesign-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="redesign-modal-header">
                    <div className="redesign-modal-title">
                        <span>{isEditMode ? 'CHỈNH SỬA' : 'TẠO MỚI'} {typeLabel.toUpperCase()}</span>
                    </div>
                    <button className="redesign-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="redesign-modal-body">
                        {error && (
                            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(244,67,54,0.15)', border: '1px solid #F44336', color: '#FF5252', fontSize: '0.85rem' }}>
                                {error}
                            </div>
                        )}

                        <div className="redesign-form-group">
                            <label className="redesign-label">{typeLabel} ID *</label>
                            <input 
                                className="redesign-input"
                                value={itemId}
                                onChange={(e) => setItemId(e.target.value)}
                                disabled={isEditMode}
                                placeholder={`Nhập ${typeLabel} ID...`}
                                required
                            />
                        </div>

                        <div className="redesign-form-group">
                            <label className="redesign-label">Tên {typeLabel} *</label>
                            <input 
                                className="redesign-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nhập tên..."
                                required
                            />
                        </div>

                        <div className="redesign-form-group">
                            <label className="redesign-label">Thứ tự hiển thị (Display Order)</label>
                            <input 
                                className="redesign-input"
                                type="number"
                                value={displayOrder}
                                onChange={(e) => setDisplayOrder(e.target.value)}
                                placeholder="0"
                            />
                        </div>

                        <div className="redesign-form-group">
                            <label className="redesign-label">Mô tả</label>
                            <textarea 
                                className="redesign-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Mô tả..."
                            />
                        </div>

                        {type === 'story' && (
                            <div className="redesign-form-group">
                                <label className="redesign-label">Trạng thái xuất bản</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.35rem' }}>
                                    <button
                                        type="button"
                                        className={`brutalist-btn technical-text ${status === 'published' ? 'primary' : 'secondary'}`}
                                        style={{ padding: '0.45rem', fontSize: '0.75rem', justifyContent: 'center' }}
                                        onClick={() => setStatus('published')}
                                    >
                                        ĐÃ XUẤT BẢN
                                    </button>
                                    <button
                                        type="button"
                                        className={`brutalist-btn technical-text ${status === 'draft' ? 'primary' : 'secondary'}`}
                                        style={{
                                            padding: '0.45rem',
                                            fontSize: '0.75rem',
                                            justifyContent: 'center',
                                            borderColor: status === 'draft' ? '#BA8530' : undefined,
                                            color: status === 'draft' ? '#BA8530' : undefined,
                                            background: status === 'draft' ? 'rgba(186, 133, 48, 0.15)' : undefined
                                        }}
                                        onClick={() => setStatus('draft')}
                                    >
                                        BẢN NHÁP
                                    </button>
                                </div>
                            </div>
                        )}

                        {(type === 'region' || type === 'event') && (
                            <div className="redesign-form-group">
                                <label className="redesign-label">{type === 'region' ? 'Icon URL' : 'Image URL'}</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        className="redesign-input"
                                        style={{ flex: 1 }}
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="URL hình ảnh..."
                                    />
                                    <button type="button" className="redesign-btn" onClick={() => handleBrowseImage('icon')}>Browse</button>
                                </div>
                            </div>
                        )}

                        {type === 'event' && (
                            <>
                                <div className="redesign-form-group">
                                    <label className="redesign-label">Banner URL</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input 
                                            className="redesign-input"
                                            style={{ flex: 1 }}
                                            value={bannerUrl}
                                            onChange={(e) => setBannerUrl(e.target.value)}
                                            placeholder="URL banner..."
                                        />
                                        <button type="button" className="redesign-btn" onClick={() => handleBrowseImage('banner')}>Browse</button>
                                    </div>
                                </div>

                                <div className="redesign-form-group">
                                    <label className="redesign-label">Wallpaper URL</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input 
                                            className="redesign-input"
                                            style={{ flex: 1 }}
                                            value={wallpaperUrl}
                                            onChange={(e) => setWallpaperUrl(e.target.value)}
                                            placeholder="URL wallpaper..."
                                        />
                                        <button type="button" className="redesign-btn" onClick={() => handleBrowseImage('wallpaper')}>Browse</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="redesign-modal-footer">
                        <button type="button" className="redesign-btn" onClick={onClose} disabled={isSubmitting}>Hủy</button>
                        <button type="submit" className="redesign-btn primary" disabled={isSubmitting}>
                            {isSubmitting ? <Loader className="spinning" size={16} /> : isEditMode ? <Save size={16} /> : <Plus size={16} />}
                            <span>{isSubmitting ? 'Đang xử lý...' : isEditMode ? 'Lưu cập nhật' : 'Tạo mới'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
