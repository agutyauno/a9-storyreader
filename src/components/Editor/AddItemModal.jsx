import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import styles from './AddItemModal.module.css';
import { uploadFileToGithub, getFolderPath } from '../../services/githubService';
import { getAssetUrl } from '../../utils/assetUtils';

/**
 * Modal dialog for creating a new Region, Arc, Event, or Story.
 * Props:
 *   isOpen — boolean
 *   type — 'region' | 'arc' | 'event' | 'story'
 *   onClose() — close modal
 *   onSubmit({ type, name, id, description, displayOrder }) — submit form
 */
export default function AddItemModal({ isOpen, type, onClose, onSubmit, onPickAsset, initialDisplayOrder, initialData }) {
    const [name, setName] = useState('');
    const [itemId, setItemId] = useState('');
    const [description, setDescription] = useState('');
    const [displayOrder, setDisplayOrder] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [wallpaperUrl, setWallpaperUrl] = useState('');

    // Tracking upload status for image fields
    const [uploadingFields, setUploadingFields] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const isEditMode = !!initialData;

    // Initial value for displayOrder when modal opens
    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            // Edit Mode
            setName(initialData.name || '');
            setItemId(String(initialData.id || ''));
            setDescription(initialData.description || '');
            setDisplayOrder(initialData.display_order || '');
            setImageUrl(initialData.icon_url || initialData.image_url || '');
            setBannerUrl(initialData.banner_url || '');
            setWallpaperUrl(initialData.wallpaper_url || '');
        } else {
            // Add Mode
            setName('');
            setItemId('');
            setDescription('');
            setDisplayOrder(initialDisplayOrder || '');
            setImageUrl('');
            setBannerUrl('');
            setWallpaperUrl('');
        }
        setError(null);
    }, [isOpen, initialDisplayOrder, initialData]);

    if (!isOpen) return null;

    const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Item';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !itemId.trim()) {
            setError('Please fill in Name and ID');
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
                displayOrder: displayOrder ? parseInt(displayOrder) : 0,
                imageUrl: imageUrl.trim() || null,
                bannerUrl: bannerUrl.trim() || null,
                wallpaperUrl: wallpaperUrl.trim() || null,
            }, isEditMode);

            // Reset
            setName('');
            setItemId('');
            setDescription('');
            setDisplayOrder('');
            setImageUrl('');
            setBannerUrl('');
            setWallpaperUrl('');
            onClose();
        } catch (err) {
            console.error('Submit item failed:', err);
            setError(err.message || 'Failed to create item');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (index, field, file) => {
        if (!file) return;

        const fieldKey = 'imageUrl';
        setUploadingFields(prev => ({ ...prev, [fieldKey]: true }));

        try {
            const folderPath = getFolderPath('image', 'misc');
            const result = await uploadFileToGithub(file, folderPath);

            if (result.success) {
                setImageUrl(result.url);
            }
        } catch (err) {
            console.error('File upload failed:', err);
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploadingFields(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{isEditMode ? 'Edit' : 'Add New'} {typeLabel}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label>Name <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter name"
                            required
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>ID <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            value={itemId}
                            onChange={(e) => setItemId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder={`Unique ${typeLabel} ID`}
                            disabled={isSubmitting || isEditMode}
                            required
                        />
                    </div>


                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="3"
                            placeholder="Enter description (optional)"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Display Order</label>
                        <input
                            type="number"
                            min="0"
                            value={displayOrder}
                            onChange={(e) => setDisplayOrder(e.target.value)}
                            placeholder="Auto (next available)"
                        />
                    </div>

                    {(type === 'region' || type === 'event') && (
                        <div className={styles.formGroup}>
                            <label>{type === 'region' ? 'Icon' : 'Thumbnail (16:9 / 1:1)'}</label>
                            <div className={styles.imageInputRow}>
                                <button
                                    type="button"
                                    className={`${styles.browseBtn} ${imageUrl ? styles.hasImage : ''}`}
                                    title="Chọn ảnh từ Asset"
                                    onClick={() => onPickAsset?.((asset) => setImageUrl(asset.url), 'thumbnail')}
                                >
                                    <ImageIcon size={18} />
                                    {imageUrl ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                                </button>
                            </div>
                            {imageUrl && (
                                <div className={styles.imagePreview}>
                                    <img src={getAssetUrl(imageUrl)} alt="Preview" />
                                </div>
                            )}
                        </div>
                    )}

                    {type === 'event' && (
                        <div className={styles.formGroup}>
                            <label>Banner (16:9)</label>
                            <div className={styles.imageInputRow}>
                                <button
                                    type="button"
                                    className={`${styles.browseBtn} ${bannerUrl ? styles.hasImage : ''}`}
                                    title="Chọn ảnh banner"
                                    onClick={() => onPickAsset?.((asset) => setBannerUrl(asset.url), 'banner')}
                                >
                                    <ImageIcon size={18} />
                                    {bannerUrl ? 'Thay đổi banner' : 'Chọn banner'}
                                </button>
                            </div>
                            {bannerUrl && (
                                <div className={styles.imagePreview}>
                                    <img src={getAssetUrl(bannerUrl)} alt="Banner Preview" style={{ aspectRatio: '16/9', objectFit: 'cover' }} />
                                </div>
                            )}
                        </div>
                    )}

                    {type === 'event' && (
                        <div className={styles.formGroup}>
                            <label>Wallpaper (Background)</label>
                            <div className={styles.imageInputRow}>
                                <button
                                    type="button"
                                    className={`${styles.browseBtn} ${wallpaperUrl ? styles.hasImage : ''}`}
                                    title="Chọn ảnh wallpaper"
                                    onClick={() => onPickAsset?.((asset) => setWallpaperUrl(asset.url), 'wallpaper')}
                                >
                                    <ImageIcon size={18} />
                                    {wallpaperUrl ? 'Thay đổi wallpaper' : 'Chọn wallpaper'}
                                </button>
                            </div>
                            {wallpaperUrl && (
                                <div className={styles.imagePreview}>
                                    <img src={getAssetUrl(wallpaperUrl)} alt="Wallpaper Preview" style={{ aspectRatio: '16/9', objectFit: 'cover', filter: 'brightness(0.7)' }} />
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

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className={styles.spinner} style={{ marginRight: '8px' }} />
                                    Creating...
                                </>
                            ) : (isEditMode ? `Save ${typeLabel}` : `Add ${typeLabel}`)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
