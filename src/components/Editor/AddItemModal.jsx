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
    
    const [expressions, setExpressions] = useState([
        { name: 'default', avatar_url: '', full_url: '' }
    ]);

    // Tracking upload status for expression fields: { '0-avatar': true, '1-full': false }
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
            expressions: type === 'character' ? expressions.filter(e => e.name.trim()) : null,
        });

        // Reset
        setName('');
        setItemId('');
        setDescription('');
        setDisplayOrder('');
        setImageUrl('');
        setExpressions([{ name: 'default', avatar_url: '', full_url: '' }]);
    };

    const addExpression = () => {
        setExpressions([...expressions, { name: '', avatar_url: '', full_url: '' }]);
    };

    const removeExpression = (index) => {
        setExpressions(expressions.filter((_, i) => i !== index));
    };

    const updateExpression = (index, field, value) => {
        const newExprs = [...expressions];
        newExprs[index][field] = value;
        setExpressions(newExprs);
    };

    const handleFileUpload = async (index, field, file) => {
        if (!file) return;
        
        const fieldKey = index === 'gallery' ? 'gallery' : `${index}-${field}`;
        setUploadingFields(prev => ({ ...prev, [fieldKey]: true }));
        
        try {
            let category = '';
            let typeStr = 'image';
            
            if (index === 'gallery') {
                category = 'gallery';
            } else {
                category = field === 'avatar_url' ? 'char_avatar' : 'character';
            }
            
            const folderPath = getFolderPath(typeStr, category);
            const result = await uploadFileToGithub(file, folderPath);
            
            if (result.success) {
                if (index === 'gallery') {
                    setImageUrl(result.url);
                } else {
                    updateExpression(index, field, result.url);
                }
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

                    {(type === 'region' || type === 'event' || type === 'gallery') && (
                        <div className={styles.formGroup}>
                            <label>{type === 'region' ? 'Icon URL' : (type === 'gallery' ? 'Image Upload' : 'Image URL')}</label>
                            
                            {type === 'gallery' ? (
                                <div className={styles.imageUploadArea}>
                                    <div className={styles.miniUploadRow}>
                                        <div 
                                            className={`${styles.miniDropZone} ${uploadingFields['gallery'] ? styles.uploading : ''}`}
                                            onClick={() => !uploadingFields['gallery'] && document.getElementById('gallery-file-input').click()}
                                        >
                                            <input 
                                                id="gallery-file-input"
                                                type="file" 
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload('gallery', 'imageUrl', e.target.files[0])}
                                                style={{ display: 'none' }}
                                            />
                                            {uploadingFields['gallery'] ? (
                                                <Loader2 size={16} className={styles.spinner} />
                                            ) : imageUrl ? (
                                                <Check size={16} color="var(--color-accent-light)" />
                                            ) : (
                                                <Upload size={16} />
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="URL or Upload image"
                                            className={styles.urlInput}
                                        />
                                    </div>
                                    {imageUrl && (
                                        <div className={styles.imagePreviewMini}>
                                            <img src={imageUrl} alt="preview" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="Enter asset URL (optional)"
                                />
                            )}
                        </div>
                    )}

                    {type === 'character' && (
                        <div className={styles.expressionsSection}>
                            <div className={styles.sectionHeader}>
                                <label>Expressions</label>
                                <button type="button" className={styles.addExprBtn} onClick={addExpression}>
                                    + Add Expression
                                </button>
                            </div>
                            
                            <div className={styles.expressionsList}>
                                {expressions.map((expr, index) => (
                                    <div key={index} className={styles.expressionItem}>
                                        <div className={styles.exprRow}>
                                            <input 
                                                type="text" 
                                                placeholder="Name (e.g. smile)" 
                                                value={expr.name}
                                                onChange={(e) => updateExpression(index, 'name', e.target.value)}
                                                className={styles.exprNameInput}
                                            />
                                            {expressions.length > 1 && (
                                                <button type="button" className={styles.removeExprBtn} onClick={() => removeExpression(index)}>
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className={styles.exprUploads}>
                                            {/* Avatar Upload */}
                                            <div className={styles.miniUploadGroup}>
                                                <div 
                                                    className={`${styles.miniDropZone} ${uploadingFields[`${index}-avatar_url`] ? styles.uploading : ''}`}
                                                    onClick={() => !uploadingFields[`${index}-avatar_url`] && document.getElementById(`avatar-file-${index}`).click()}
                                                    title="Upload Avatar"
                                                >
                                                    <input 
                                                        id={`avatar-file-${index}`}
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(index, 'avatar_url', e.target.files[0])}
                                                        style={{ display: 'none' }}
                                                    />
                                                    {uploadingFields[`${index}-avatar_url`] ? (
                                                        <Loader2 size={14} className={styles.spinner} />
                                                    ) : expr.avatar_url ? (
                                                        <Check size={14} color="var(--color-accent-light)" />
                                                    ) : (
                                                        <ImageIcon size={14} />
                                                    )}
                                                </div>
                                                <span className={styles.exprUrlText}>
                                                    {expr.avatar_url ? 'Avatar uploaded' : 'Avatar (Square) *'}
                                                </span>
                                            </div>

                                            {/* Full Body Upload */}
                                            <div className={styles.miniUploadGroup}>
                                                <div 
                                                    className={`${styles.miniDropZone} ${uploadingFields[`${index}-full_url`] ? styles.uploading : ''}`}
                                                    onClick={() => !uploadingFields[`${index}-full_url`] && document.getElementById(`full-file-${index}`).click()}
                                                    title="Upload Full Body"
                                                >
                                                    <input 
                                                        id={`full-file-${index}`}
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(index, 'full_url', e.target.files[0])}
                                                        style={{ display: 'none' }}
                                                    />
                                                    {uploadingFields[`${index}-full_url`] ? (
                                                        <Loader2 size={14} className={styles.spinner} />
                                                    ) : expr.full_url ? (
                                                        <Check size={14} color="var(--color-accent-light)" />
                                                    ) : (
                                                        <Upload size={14} />
                                                    )}
                                                </div>
                                                <span className={styles.exprUrlText}>
                                                    {expr.full_url ? 'Full body uploaded' : 'Full body image *'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
