import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './AddItemModal.module.css';

/**
 * Modal dialog for creating a new Asset.
 * Props:
 *   isOpen — boolean
 *   onClose() — close modal
 *   onSubmit({ type, category, assetId, name, file }) — submit form
 */

const ASSET_TYPES = [
    { value: 'character', label: 'Character' },
    { value: 'image', label: 'Image / Thumbnail' },
    { value: 'background', label: 'Background Image' },
    { value: 'video', label: 'Video' },
    { value: 'bgm', label: 'BGM (audio)' },
    { value: 'sfx', label: 'SFX (audio)' },
];

export default function AddAssetModal({ isOpen, onClose, onSubmit }) {
    const [assetType, setAssetType] = useState('');
    const [assetId, setAssetId] = useState('');
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);

    if (!isOpen) return null;

    const isCharacter = assetType === 'character';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!assetType || !assetId.trim()) return;

        onSubmit({
            type: assetType,
            assetId: assetId.trim(),
            name: name.trim(),
            file,
        });

        setAssetType('');
        setAssetId('');
        setName('');
        setFile(null);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Create Asset</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label>Type <span className={styles.required}>*</span></label>
                        <select
                            value={assetType}
                            onChange={(e) => setAssetType(e.target.value)}
                            required
                        >
                            <option value="">Select type</option>
                            {ASSET_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Asset ID <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            value={assetId}
                            onChange={(e) => setAssetId(e.target.value)}
                            placeholder="e.g. char-new, sfx-step"
                            required
                        />
                        <small>Must be unique.</small>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Human-friendly name"
                        />
                    </div>

                    {!isCharacter && assetType && (
                        <div className={styles.formGroup}>
                            <label>Media File <span className={styles.required}>*</span></label>
                            <input
                                type="file"
                                accept="image/*,audio/*,video/*"
                                onChange={(e) => setFile(e.target.files[0] || null)}
                            />
                        </div>
                    )}

                    <div className={styles.formActions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            Create Asset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
