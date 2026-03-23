import React, { useState } from 'react';
import { X, Upload, Check, Loader2, AlertCircle, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import styles from './AddItemModal.module.css';
import { uploadFileToGithub, getFolderPath } from '../../services/githubService';

/**
 * Modal dialog for creating a new Asset.
 * Now supports direct upload to GitHub repo via Supabase Edge Function.
 * Includes character expression management.
 */

const ASSET_TYPES = [
    { value: 'background', label: 'Background Image', type: 'image', category: 'background' },
    { value: 'thumbnail', label: 'Thumbnail Image', type: 'image', category: 'thumbnail' },
    { value: 'character', label: 'Character', type: 'character', category: 'character' },
    { value: 'gallery', label: 'Gallery / Story Art', type: 'image', category: 'gallery' },
    { value: 'video', label: 'Video (PV)', type: 'video', category: 'video' },
    { value: 'bgm', label: 'BGM (audio)', type: 'audio', category: 'bgm' },
    { value: 'sfx', label: 'SFX (audio)', type: 'audio', category: 'sfx' },
];

export default function AddAssetModal({ isOpen, onClose, onSubmit }) {
    const [assetValue, setAssetValue] = useState('');
    const [assetId, setAssetId] = useState('');
    const [name, setName] = useState('');

    // Main file (for non-character assets)
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // Character expressions
    const [expressions, setExpressions] = useState([
        { name: 'default', avatarUrl: '', fullUrl: '' }
    ]);
    const [uploadingFields, setUploadingFields] = useState({}); // { '0-avatar': true }

    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const selectedType = ASSET_TYPES.find(t => t.value === assetValue);
    const isCharacter = assetValue === 'character';

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setFile(f);
        setError(null);

        // Create preview for images
        if (f.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(f));
        } else {
            setPreviewUrl('');
        }
    };

    const addExpression = () => {
        setExpressions([...expressions, { name: '', avatarUrl: '', fullUrl: '' }]);
    };

    const removeExpression = (index) => {
        setExpressions(expressions.filter((_, i) => i !== index));
    };

    const updateExpression = (index, field, value) => {
        const newExprs = [...expressions];
        newExprs[index][field] = value;
        setExpressions(newExprs);
    };

    const handleExprFileUpload = async (index, field, file) => {
        if (!file) return;
        const fieldKey = `${index}-${field}`;
        setUploadingFields(prev => ({ ...prev, [fieldKey]: true }));
        try {
            const category = field === 'avatarUrl' ? 'char_avatar' : 'character';
            const folderPath = getFolderPath('image', category);
            const result = await uploadFileToGithub(file, folderPath);
            if (result.success) {
                updateExpression(index, field, result.url);
            }
        } catch (err) {
            console.error('Expr upload failed:', err);
            setError(`Upload expressions failed: ${err.message}`);
        } finally {
            setUploadingFields(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!assetValue || !assetId.trim()) {
            setError('Missing required fields');
            return;
        }

        // For non-character assets, file is required
        if (!isCharacter && !file) {
            setError('Please select a file to upload');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            if (isCharacter) {
                // Submit character with expressions
                onSubmit({
                    type: 'character',
                    category: 'character',
                    asset_id: assetId.trim(),
                    name: name.trim(),
                    expressions: expressions.filter(e => e.name.trim()).map(e => ({
                        name: e.name.trim(),
                        avatar_url: e.avatarUrl,
                        full_url: e.fullUrl
                    })),
                });
            } else {
                // Submit regular asset
                const folderPath = getFolderPath(selectedType.type, selectedType.category);
                const uploadResult = await uploadFileToGithub(file, folderPath);

                if (uploadResult.success) {
                    onSubmit({
                        type: selectedType.type,
                        category: selectedType.category,
                        asset_id: assetId.trim(),
                        name: name.trim(),
                        url: uploadResult.url,
                    });
                }
            }

            // Reset
            setAssetValue('');
            setAssetId('');
            setName('');
            setFile(null);
            setPreviewUrl('');
            setExpressions([{ name: 'default', avatarUrl: '', fullUrl: '' }]);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to upload/create');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Create New Asset</h3>
                    <button className={styles.closeBtn} onClick={onClose} disabled={isUploading}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label>Asset Purpose <span className={styles.required}>*</span></label>
                        <select
                            value={assetValue}
                            onChange={(e) => setAssetValue(e.target.value)}
                            required
                            disabled={isUploading}
                        >
                            <option value="">Select purpose...</option>
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
                            placeholder={isCharacter ? "e.g. char_amiya" : "e.g. bg_lungmen_sunset"}
                            required
                            disabled={isUploading}
                        />
                        <small>{isCharacter ? "Character identifier." : "Internal ID used in scripts."}</small>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={isCharacter ? "e.g. Amiya" : "e.g. Lungmen Sunset"}
                            disabled={isUploading}
                        />
                    </div>

                    {!isCharacter && assetValue && (
                        <div className={styles.formGroup}>
                            <label>File Upload <span className={styles.required}>*</span></label>
                            <div
                                className={styles.fileDropZone}
                                style={{
                                    border: '2px dashed var(--color-border)',
                                    borderRadius: '8px',
                                    padding: '24px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: file ? 'rgba(184, 169, 255, 0.05)' : 'transparent',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                                onClick={() => document.getElementById('asset-file-input').click()}
                            >
                                <input
                                    id="asset-file-input"
                                    type="file"
                                    accept={selectedType ? (
                                        selectedType.type === 'image' ? 'image/*' :
                                            selectedType.type === 'audio' ? 'audio/*' :
                                                selectedType.type === 'video' ? 'video/*' : '*'
                                    ) : '*'}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />

                                {file ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <Check size={32} color="var(--color-accent-light)" />
                                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{file.name}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                                            {(file.size / 1024).toFixed(1)} KB — Click to change
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--color-text-tertiary)' }}>
                                        <Upload size={32} />
                                        <span style={{ fontSize: '14px' }}>Click to select or drag & drop</span>
                                        <span style={{ fontSize: '12px' }}>Supported: Images, Audio, Video</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!isCharacter && previewUrl && (
                        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                            <img
                                src={previewUrl}
                                alt="preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '180px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        </div>
                    )}

                    {isCharacter && (
                        <div className={styles.expressionsSection}>
                            <div className={styles.sectionHeader}>
                                <label>Expressions</label>
                                <button type="button" className={styles.addExprBtn} onClick={addExpression}>
                                    <Plus size={14} /> Add Expression
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
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className={styles.exprUploads}>
                                            {/* Avatar Upload */}
                                            <div className={styles.miniUploadGroup}>
                                                <div
                                                    className={`${styles.miniDropZone} ${uploadingFields[`${index}-avatarUrl`] ? styles.uploading : ''}`}
                                                    onClick={() => !uploadingFields[`${index}-avatarUrl`] && document.getElementById(`avatar-file-${index}`).click()}
                                                    title="Upload Avatar (Square)"
                                                >
                                                    <input
                                                        id={`avatar-file-${index}`}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleExprFileUpload(index, 'avatarUrl', e.target.files[0])}
                                                        style={{ display: 'none' }}
                                                    />
                                                    {uploadingFields[`${index}-avatarUrl`] ? (
                                                        <Loader2 size={14} className={styles.spinner} />
                                                    ) : expr.avatarUrl ? (
                                                        <Check size={14} color="var(--color-accent-light)" />
                                                    ) : (
                                                        <ImageIcon size={14} />
                                                    )}
                                                </div>
                                                <span className={styles.exprUrlText}>
                                                    {expr.avatarUrl ? 'Avatar uploaded' : 'Avatar *'}
                                                </span>
                                            </div>

                                            {/* Full Body Upload */}
                                            <div className={styles.miniUploadGroup}>
                                                <div
                                                    className={`${styles.miniDropZone} ${uploadingFields[`${index}-fullUrl`] ? styles.uploading : ''}`}
                                                    onClick={() => !uploadingFields[`${index}-fullUrl`] && document.getElementById(`full-file-${index}`).click()}
                                                    title="Upload Full Body"
                                                >
                                                    <input
                                                        id={`full-file-${index}`}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleExprFileUpload(index, 'fullUrl', e.target.files[0])}
                                                        style={{ display: 'none' }}
                                                    />
                                                    {uploadingFields[`${index}-fullUrl`] ? (
                                                        <Loader2 size={14} className={styles.spinner} />
                                                    ) : expr.fullUrl ? (
                                                        <Check size={14} color="var(--color-accent-light)" />
                                                    ) : (
                                                        <Upload size={14} />
                                                    )}
                                                </div>
                                                <span className={styles.exprUrlText}>
                                                    {expr.fullUrl ? 'Full body uploaded' : 'Full body image *'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'rgba(255, 107, 107, 0.1)',
                            color: '#ff6b6b',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
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
                            disabled={isUploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isUploading || (!isCharacter && !file) || !assetId || !assetValue}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={16} className={styles.spinner} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                                    Creating...
                                </>
                            ) : (isCharacter ? 'Create Character' : 'Create Asset')}
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
