import React, { useState, useEffect } from 'react';
import { Save, Loader, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import styles from './MetadataForm.module.css';

/**
 * Metadata editor form for Region, Arc, Event entities.
 * Props:
 *   entity    — the selected tree node object
 *   onSaved() — callback after successful save (to reload tree)
 *   onPickAsset(callback) — opens AssetPickerModal, calls callback(url) on select
 */
export default function MetadataForm({ entity, onSaved, onPickAsset, showNotification }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [displayOrder, setDisplayOrder] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Sync form when entity changes
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
    const imageLabel = entity.type === 'region' ? 'Icon' : 'Banner Image';

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
            onSaved?.();
            // showNotification provided by parent
            if (typeof window !== 'undefined') {
                // If we have access to context or props
            }
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
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>{name || typeLabel}</h2>
                <span className={styles.typeBadge}>{typeLabel}</span>
            </div>

            <div className={styles.form}>
                {/* Name + Display Order row */}
                <div className={styles.grid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Name *</label>
                        <input
                            className={styles.input}
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter name"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Display Order</label>
                        <input
                            className={styles.input}
                            type="number"
                            min="0"
                            value={displayOrder}
                            onChange={e => setDisplayOrder(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Description</label>
                    <textarea
                        className={styles.textarea}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Enter description (optional)"
                    />
                </div>

                {/* Image URL (Region icon / Event banner) */}
                {showImage && (
                    <div className={styles.formGroup}>
                        <label className={styles.label}>{imageLabel}</label>
                        <div className={styles.imageInputRow}>
                            <button
                                type="button"
                                className={`${styles.browseBtn} ${imageUrl ? styles.hasImage : ''}`}
                                title="Chọn ảnh từ Asset"
                                onClick={() => onPickAsset?.((asset) => setImageUrl(asset.url), 'image')}
                            >
                                <ImageIcon size={18} />
                                {imageUrl ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                            </button>
                        </div>
                        {imageUrl && (
                            <div className={styles.imagePreview}>
                                <img src={imageUrl} alt="Preview" />
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: 'rgba(255, 107, 107, 0.1)',
                        color: '#ff6b6b',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '16px',
                        border: '1px solid rgba(255, 107, 107, 0.2)'
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Save */}
                <div className={styles.actions}>
                    <button
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                    >
                        {saving
                            ? <Loader size={16} className={styles.spinner} />
                            : <Save size={16} />}
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
}
