import React from 'react';
import { X, User, Image as ImageIcon, Loader } from 'lucide-react';
import styles from './AssetPreviewModal.module.css';

/**
 * AssetPreviewModal
 * A read-only Lightbox for viewing assets/characters.
 * 
 * @param {boolean} isOpen 
 * @param {object} asset The asset or character object to preview
 * @param {string} kind 'asset' or 'character'
 * @param {function} onClose 
 */
export default function AssetPreviewModal({ isOpen, asset, kind = 'asset', onClose }) {
    if (!isOpen || !asset) return null;

    const isCharacter = kind === 'character';
    
    // For characters, prioritize the first available full body art.
    // For assets, use the url.
    let previewUrl = asset.url || asset.full_url || asset.image_url;
    let title = asset.name || asset.title || 'Untitled Asset';
    let subtitle = isCharacter ? 'Character Preview' : 'Gallery Artwork';

    if (isCharacter && !previewUrl && asset.avatar_url) {
        previewUrl = asset.avatar_url;
    }

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <div className={styles.title}>{title}</div>
                        <div className={styles.subtitle}>{subtitle}</div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} title="Đóng">
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.imageContainer}>
                    {previewUrl ? (
                        <img src={previewUrl} alt={title} />
                    ) : (
                        <div className={styles.placeholder}>
                            {isCharacter ? <User size={120} /> : <ImageIcon size={120} />}
                            <p>Không có ảnh hiển thị</p>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    Nhấn phím Esc hoặc click bên ngoài để đóng
                </div>
            </div>
        </div>
    );
}
