import React, { useState } from 'react';
import { X, Loader, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { getAssetUrl } from '../../../../../src/utils/assetUtils';
import '../editorComponents.css';

const ASSET_TYPES = [
    { value: 'background', label: 'Background Image', type: 'image', category: 'background' },
    { value: 'thumbnail', label: 'Thumbnail Image', type: 'image', category: 'thumbnail' },
    { value: 'banner', label: 'Banner Image', type: 'image', category: 'banner' },
    { value: 'character', label: 'Character', type: 'character', category: 'character' },
    { value: 'gallery', label: 'Gallery / Story Art', type: 'image', category: 'gallery' },
    { value: 'wallpaper', label: 'Wallpaper Image', type: 'image', category: 'wallpaper' },
    { value: 'video', label: 'Video (PV)', type: 'video', category: 'PV' },
    { value: 'bgm', label: 'BGM (audio)', type: 'audio', category: 'bgm' },
    { value: 'sfx', label: 'SFX (audio)', type: 'audio', category: 'sfx' },
];

export default function AddAssetModal({ isOpen, onClose, onSubmit, initialCategory }) {
    const [assetValue, setAssetValue] = useState('background');
    const [assetId, setAssetId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        if (isOpen && initialCategory && initialCategory !== 'all') {
            const isValid = ASSET_TYPES.some(t => t.value === initialCategory);
            if (isValid) setAssetValue(initialCategory);
        }
    }, [isOpen, initialCategory]);

    if (!isOpen) return null;

    const selectedType = ASSET_TYPES.find(t => t.value === assetValue) || ASSET_TYPES[0];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!assetId.trim() || !name.trim()) {
            setError('Vui lòng nhập Asset ID và Tên');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await onSubmit({
                asset_id: assetId.trim(),
                name: name.trim(),
                description: description.trim(),
                type: selectedType.type,
                category: selectedType.category,
                url: url.trim()
            });
            onClose();
        } catch (err) {
            console.error('Submit asset error:', err);
            setError(err.message || 'Thêm asset thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="redesign-modal-overlay" onClick={onClose}>
            <div className="redesign-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="redesign-modal-header">
                    <div className="redesign-modal-title">
                        <ImageIcon size={20} />
                        <span>THÊM ASSET MỚI</span>
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
                            <label className="redesign-label">Loại Asset</label>
                            <select 
                                className="redesign-select"
                                value={assetValue}
                                onChange={(e) => setAssetValue(e.target.value)}
                            >
                                {ASSET_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="redesign-form-group">
                            <label className="redesign-label">Asset ID *</label>
                            <input 
                                className="redesign-input"
                                value={assetId}
                                onChange={(e) => setAssetId(e.target.value)}
                                placeholder="Mã asset duy nhất (vd: bg_rhodes_bridge)"
                                required
                            />
                        </div>

                        <div className="redesign-form-group">
                            <label className="redesign-label">Tên hiển thị *</label>
                            <input 
                                className="redesign-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nhập tên asset..."
                                required
                            />
                        </div>

                        <div className="redesign-form-group">
                            <label className="redesign-label">URL Asset</label>
                            <input 
                                className="redesign-input"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://... hoặc /assets/..."
                            />
                        </div>

                        <div className="redesign-form-group">
                            <label className="redesign-label">Mô tả</label>
                            <textarea 
                                className="redesign-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Nhập mô tả asset (tùy chọn)..."
                            />
                        </div>
                    </div>

                    <div className="redesign-modal-footer">
                        <button type="button" className="redesign-btn" onClick={onClose} disabled={submitting}>Hủy</button>
                        <button type="submit" className="redesign-btn primary" disabled={submitting}>
                            {submitting ? <Loader className="spinning" size={16} /> : <Plus size={16} />}
                            <span>{submitting ? 'Đang lưu...' : 'Thêm Asset'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
