import React, { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import '../editorComponents.css';

export default function MetadataForm({ entity, onSaved, onPickAsset, showNotification }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [displayOrder, setDisplayOrder] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!entity) return;
        setName(entity.name || '');
        setDescription(entity.description || '');
        setDisplayOrder(entity.display_order ?? '');
        if (entity.type === 'region') setImageUrl(entity.icon_url || '');
        else if (entity.type === 'event') setImageUrl(entity.image_url || '');
        else setImageUrl('');
        setError(null);
    }, [entity]);

    if (!entity) return null;

    const typeLabel = entity.type.charAt(0).toUpperCase() + entity.type.slice(1);
    const showImage = entity.type === 'region' || entity.type === 'event';

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const payload = {
                name: name.trim(),
                description: description.trim() || null,
                display_order: displayOrder !== '' ? parseInt(displayOrder) : null,
            };
            if (entity.type === 'region') {
                payload.icon_url = imageUrl.trim() || null;
                await SupabaseAPI.updateRegion(entity.region_id || entity.id, payload);
            } else if (entity.type === 'arc') {
                await SupabaseAPI.updateArc(entity.arc_id || entity.id, payload);
            } else if (entity.type === 'event') {
                payload.image_url = imageUrl.trim() || null;
                await SupabaseAPI.updateEvent(entity.event_id || entity.id, payload);
            }
            showNotification?.(`Đã cập nhật ${typeLabel}`, 'success');
            onSaved?.();
        } catch (err) {
            console.error('Save metadata failed:', err);
            setError(err.message || 'Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleBrowse = () => {
        onPickAsset?.((asset) => {
            setImageUrl(asset.url);
        }, 'thumbnail');
    };

    return (
        <div style={{ padding: '1rem', backgroundColor: '#141414', borderTop: '1px solid rgba(245,237,220,0.15)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontFamily: 'var(--font-mono)', color: '#F5EDDC' }}>THÔNG TIN {typeLabel.toUpperCase()}</h4>
                <button className="redesign-btn primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} disabled={saving} onClick={handleSave}>
                    {saving ? <Loader className="spinning" size={14} /> : <Save size={14} />}
                    <span>{saving ? 'Lưu...' : 'Lưu'}</span>
                </button>
            </div>

            {error && (
                <div style={{ color: '#FF5252', fontSize: '0.8rem', padding: '0.4rem', backgroundColor: 'rgba(244,67,54,0.1)' }}>{error}</div>
            )}

            <div className="redesign-form-group">
                <label className="redesign-label">Tên {typeLabel}</label>
                <input 
                    className="redesign-input" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Nhập tên..."
                />
            </div>

            <div className="redesign-form-group">
                <label className="redesign-label">Thứ tự hiển thị</label>
                <input 
                    className="redesign-input" 
                    type="number" 
                    value={displayOrder} 
                    onChange={e => setDisplayOrder(e.target.value)} 
                />
            </div>

            {showImage && (
                <div className="redesign-form-group">
                    <label className="redesign-label">Image URL</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                            className="redesign-input" 
                            style={{ flex: 1 }} 
                            value={imageUrl} 
                            onChange={e => setImageUrl(e.target.value)} 
                        />
                        <button type="button" className="redesign-btn" onClick={handleBrowse}>Browse</button>
                    </div>
                </div>
            )}

            <div className="redesign-form-group">
                <label className="redesign-label">Mô tả</label>
                <textarea 
                    className="redesign-textarea" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Mô tả..."
                />
            </div>
        </div>
    );
}
