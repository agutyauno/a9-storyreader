import React, { useState, useRef } from 'react';
import { X, Upload, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import styles from './AddItemModal.module.css';
import { uploadFileToGithub, getFolderPath } from '../../services/githubService';

/**
 * Modal dialog for creating a new Region, Arc, Event, or Story.
 * Props:
 *   isOpen — boolean
 *   type — 'region' | 'arc' | 'event' | 'story'
 *   onClose() — close modal
 *   onSubmit({ type, name, id, description, displayOrder }) — submit form
 */
export default function AddItemModal({ isOpen, type, onClose, onSubmit }) {
    const [name, setName] = useState('');
    const [itemId, setItemId] = useState('');
    const [description, setDescription] = useState('');
    const [displayOrder, setDisplayOrder] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    
    // Tracking upload status for image fields
    const [uploadingFields, setUploadingFields] = useState({});

    if (!isOpen) return null;

    const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Item';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !itemId.trim()) return;

        onSubmit({
            type,
            name: name.trim(),
            id: itemId.trim(),
            description: description.trim(),
            displayOrder: displayOrder ? parseInt(displayOrder) : null,
            imageUrl: imageUrl.trim() || null,
        });

        // Reset
        setName('');
        setItemId('');
        setDescription('');
        setDisplayOrder('');
        setImageUrl('');
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
                    <h3>Add New {typeLabel}</h3>
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
                            onChange={(e) => setItemId(e.target.value)}
                            placeholder={`e.g. ${type}-new`}
                            required
                        />
                        <small>Provide a unique ID ({type}_id). This field is required.</small>
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

                    {(type === 'region' || type === 'event' || type === 'story') && (
                        <div className={styles.formGroup}>
                            <label>{type === 'region' ? 'Icon URL' : 'Image URL'}</label>
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="Enter asset URL (optional)"
                            />
                        </div>
                    )}

                    <div className={styles.formActions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            Add {typeLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
