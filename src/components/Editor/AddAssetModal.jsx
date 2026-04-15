import React, { useState } from 'react';
import { X, Upload, Check, Loader2, AlertCircle, Plus, Trash2, Image as ImageIcon, CheckCircle2, XCircle } from 'lucide-react';
import styles from './AddItemModal.module.css';
import { uploadFileToGithub, uploadFilesToGithub, getFolderPath } from '../../services/githubService';

/**
 * Modal dialog for creating Assets.
 * Supports single asset creation AND bulk multi-file upload.
 * Character type is always single-file (due to expressions complexity).
 */

const ASSET_TYPES = [
    { value: 'background', label: 'Background Image', type: 'image', category: 'background' },
    { value: 'thumbnail', label: 'Thumbnail Image', type: 'image', category: 'thumbnail' },
    { value: 'banner', label: 'Banner Image', type: 'image', category: 'banner' },
    { value: 'character', label: 'Character', type: 'character', category: 'character' },
    { value: 'gallery', label: 'Gallery / Story Art', type: 'image', category: 'gallery' },
    { value: 'video', label: 'Video (PV)', type: 'video', category: 'PV' },
    { value: 'bgm', label: 'BGM (audio)', type: 'audio', category: 'bgm' },
    { value: 'sfx', label: 'SFX (audio)', type: 'audio', category: 'sfx' },
];

/** Extract a clean asset ID from a file name (strip extension, sanitize) */
const fileNameToAssetId = (fileName) => {
    const base = fileName.replace(/\.[^.]+$/, ''); // remove extension
    return base.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
};

export default function AddAssetModal({ isOpen, onClose, onSubmit, initialCategory }) {
    const [assetValue, setAssetValue] = useState('');
    // Single-mode fields
    const [assetId, setAssetId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [externalUrl, setExternalUrl] = useState(''); // NEW: For video/external links

    // Multi-mode fields
    const [bulkFiles, setBulkFiles] = useState([]); // Array of { file, assetId, name, status: 'pending'|'uploading'|'done'|'error', error? }

    // Character expressions (single mode only)
    const [expressions, setExpressions] = useState([
        { name: 'default', avatarUrl: '', fullUrl: '' }
    ]);
    const [uploadingFields, setUploadingFields] = useState({});

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState(null);

    // Update assetValue when initialCategory or isOpen changes
    React.useEffect(() => {
        if (isOpen && initialCategory && initialCategory !== 'all') {
            const isValid = ASSET_TYPES.some(t => t.value === initialCategory);
            if (isValid) setAssetValue(initialCategory);
            else setAssetValue('');
        }
    }, [isOpen, initialCategory]);

    if (!isOpen) return null;

    const selectedType = ASSET_TYPES.find(t => t.value === assetValue);
    const isCharacter = assetValue === 'character';
    const isVideo = assetValue === 'video';
    const isBulkMode = bulkFiles.length > 1;
    const isSingleWithFile = bulkFiles.length === 1 || file || (isVideo && externalUrl);

    // ── File Handling ─────────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setError(null);

        if (isCharacter || files.length === 1) {
            // Single file mode
            const f = files[0];
            setFile(f);
            setBulkFiles([]);
            setAssetId(fileNameToAssetId(f.name));
            setName('');
            if (f.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(f));
            } else {
                setPreviewUrl('');
            }
        } else {
            // Bulk mode
            setFile(null);
            setPreviewUrl('');
            setAssetId('');
            const items = files.map(f => ({
                file: f,
                assetId: fileNameToAssetId(f.name),
                name: '',
                status: 'pending',
                error: null,
                previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
            }));
            setBulkFiles(items);
        }
    };

    const removeBulkFile = (index) => {
        const newFiles = bulkFiles.filter((_, i) => i !== index);
        if (newFiles.length <= 1 && newFiles.length > 0) {
            // Switch back to single mode
            const item = newFiles[0];
            setFile(item.file);
            setAssetId(item.assetId);
            setName(item.name);
            if (item.file.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(item.file));
            }
            setBulkFiles([]);
        } else {
            setBulkFiles(newFiles);
        }
    };

    const updateBulkFile = (index, field, value) => {
        setBulkFiles(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // ── Character Expressions ─────────────────────────────────────────────────
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

    // ── Reset ─────────────────────────────────────────────────────────────────
    const resetForm = () => {
        setAssetValue('');
        setAssetId('');
        setName('');
        setDescription('');
        setFile(null);
        setPreviewUrl('');
        setExternalUrl('');
        setBulkFiles([]);
        setExpressions([{ name: 'default', avatarUrl: '', fullUrl: '' }]);
        setUploadProgress({ current: 0, total: 0 });
        setError(null);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isBulkMode) {
            await handleBulkSubmit();
        } else {
            await handleSingleSubmit();
        }
    };

    const handleSingleSubmit = async () => {
        if (!assetValue || !assetId) {
            setError('Missing required fields');
            return;
        }

        if (!isCharacter && !isVideo && !file) {
            setError('Please select a file to upload');
            return;
        }

        if (isVideo && !externalUrl.trim()) {
            setError('Please enter a valid video URL');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            if (isCharacter) {
                const filteredExprs = expressions.filter(e => e.name.trim());
                if (filteredExprs.length === 0) {
                    setError('Character must have at least one named expression');
                    setIsUploading(false);
                    return;
                }

                for (const expr of filteredExprs) {
                    if (!expr.avatarUrl || !expr.fullUrl) {
                        setError(`Expression "${expr.name}" is missing images. Please ensure both avatar and full body are uploaded.`);
                        setIsUploading(false);
                        return;
                    }
                }

                await onSubmit({
                    type: selectedType.type,
                    category: selectedType.category,
                    name: name.trim(),
                    description: description.trim(),
                    asset_id: assetId.trim(),
                    id: assetId.trim(),
                    expressions: filteredExprs.map(e => ({
                        name: e.name.trim(),
                        avatar_url: e.avatarUrl,
                        full_url: e.fullUrl
                    })),
                });
            } else if (isVideo) {
                 // For videos, bypass upload and save the external URL directly
                 const finalName = name.trim() || assetId.trim();
                 await onSubmit({
                     type: selectedType.type,
                     category: selectedType.category,
                     name: finalName,
                     description: description.trim(),
                     asset_id: assetId.trim(),
                     id: assetId.trim(),
                     url: externalUrl.trim(),
                 });
            } else {
                const folderPath = getFolderPath(selectedType.type, selectedType.category);
                const uploadResult = await uploadFileToGithub(file, folderPath, assetId.trim());

                if (!uploadResult.success) {
                    throw new Error(uploadResult.error || 'GitHub upload failed');
                }

                const finalName = name.trim() || assetId.trim();
                await onSubmit({
                    type: selectedType.type,
                    category: selectedType.category,
                    name: finalName,
                    description: description.trim(),
                    asset_id: assetId.trim(),
                    id: assetId.trim(),
                    url: uploadResult.url,
                });
            }

            resetForm();
            onClose();
        } catch (err) {
            console.error('Final submission failed:', err);
            setError(err.message || 'Failed to upload or create record');
        } finally {
            setIsUploading(false);
        }
    };

    const handleBulkSubmit = async () => {
        // Validate all IDs are filled
        const emptyIds = bulkFiles.filter(f => !f.assetId.trim());
        if (emptyIds.length > 0) {
            setError(`${emptyIds.length} file(s) are missing Asset ID`);
            return;
        }

        // Check for duplicate IDs
        const ids = bulkFiles.map(f => f.assetId.trim());
        const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
        if (duplicates.length > 0) {
            setError(`Duplicate Asset IDs found: ${[...new Set(duplicates)].join(', ')}`);
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadProgress({ current: 0, total: bulkFiles.length });

        // Mark all as uploading
        setBulkFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

        try {
            // 1. Upload ALL files to GitHub in one go
            const fileItems = bulkFiles.map(item => ({
                file: item.file,
                folderPath: getFolderPath(selectedType.type, selectedType.category),
                customFileName: item.assetId.trim()
            }));

            const uploadResult = await uploadFilesToGithub(fileItems);

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Bulk GitHub upload failed');
            }

            // 2. Perform DB insertions for each successful upload
            const total = bulkFiles.length;
            let successCount = 0;

            for (let i = 0; i < total; i++) {
                const item = bulkFiles[i];
                const uploadedFile = uploadResult.files[i];

                try {
                    const finalName = item.name.trim() || item.assetId.trim();
                    await onSubmit({
                        type: selectedType.type,
                        category: selectedType.category,
                        name: finalName,
                        description: '',
                        asset_id: item.assetId.trim(),
                        id: item.assetId.trim(),
                        url: uploadedFile.url,
                        _skipClose: true,
                    });

                    setBulkFiles(prev => {
                        const updated = [...prev];
                        updated[i] = { ...updated[i], status: 'done' };
                        return updated;
                    });
                    successCount++;
                    setUploadProgress(prev => ({ ...prev, current: i + 1 }));
                } catch (dbErr) {
                    console.error(`DB Insert failed for ${item.assetId}:`, dbErr);
                    setBulkFiles(prev => {
                        const updated = [...prev];
                        updated[i] = { ...updated[i], status: 'error', error: dbErr.message };
                        return updated;
                    });
                }
            }

            if (successCount === total) {
                resetForm();
                onClose();
            } else {
                setError(`GitHub upload succeeded, but ${total - successCount} database records failed. Please check IDs and retry.`);
            }

        } catch (err) {
            console.error('Bulk upload process failed:', err);
            setError(err.message || 'Bulk upload failed');
            setBulkFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'error', error: err.message } : f));
        } finally {
            setIsUploading(false);
        }
    };

    // ── Accept types for file input ───────────────────────────────────────────
    const getAcceptType = () => {
        if (!selectedType) return '*';
        if (selectedType.type === 'image') return 'image/*';
        if (selectedType.type === 'audio') return 'audio/*';
        if (selectedType.type === 'video') return 'video/*';
        return '*';
    };

    // ── Check if submit should be disabled ────────────────────────────────────
    const isSubmitDisabled = () => {
        if (isUploading) return true;
        if (!assetValue) return true;
        if (isBulkMode) return bulkFiles.some(f => !f.assetId.trim());
        if (isCharacter) return false; // character has its own validation
        if (isVideo) return !externalUrl.trim(); // video uses external URL
        return !file;
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.modal} ${isBulkMode ? styles.modalWide : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{isBulkMode ? `Bulk Create Assets (${bulkFiles.length} files)` : 'Create New Asset'}</h3>
                    <button className={styles.closeBtn} onClick={onClose} disabled={isUploading}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    {/* Asset Purpose Selector */}
                    <div className={styles.formGroup}>
                        <label>Asset Purpose <span className={styles.required}>*</span></label>
                        <select
                            value={assetValue}
                            onChange={(e) => {
                                setAssetValue(e.target.value);
                                setError(null);
                                setFile(null);
                                setPreviewUrl('');
                                setExternalUrl('');
                                setBulkFiles([]);
                                setExpressions([{ name: 'default', avatarUrl: '', fullUrl: '' }]);
                            }}
                            required
                            disabled={isUploading}
                        >
                            <option value="">Select purpose...</option>
                            {ASSET_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* ── Single Mode: ID & Name ────────────────────────────── */}
                    {assetValue && !isBulkMode && (
                        <div className={styles.formGroup}>
                            <label>{isCharacter ? 'Character ID' : 'Asset ID'} <span className={styles.required}>*</span></label>
                            <input
                                type="text"
                                value={assetId}
                                onChange={(e) => setAssetId(e.target.value)}
                                placeholder={isCharacter ? "e.g. char_amiya" : "e.g. bg_forest"}
                                disabled={isUploading}
                                required
                            />
                        </div>
                    )}

                    {assetValue && !isBulkMode && (isCharacter || assetValue === 'gallery') && (
                        <div className={styles.formGroup}>
                            <label>{isCharacter ? 'Display Name' : 'Title'} <span className={styles.required}>*</span></label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={isCharacter ? "e.g. Amiya" : "e.g. Illustration Title"}
                                disabled={isUploading}
                                required
                            />
                        </div>
                    )}

                    {assetValue && !isBulkMode && isCharacter && (
                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Character description (optional)"
                                rows="2"
                                disabled={isUploading}
                            />
                        </div>
                    )}

                    {/* ── File Upload Zone (non-character, non-video) ─────────────────── */}
                    {!isCharacter && !isVideo && assetValue && !isBulkMode && (
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
                                    accept={getAcceptType()}
                                    multiple={!isCharacter}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />

                                {file ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <Check size={32} color="var(--color-accent-light)" />
                                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{file.name}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                                            {(file.size / 1024).toFixed(1)} KB — Click to change or select multiple files
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--color-text-tertiary)' }}>
                                        <Upload size={32} />
                                        <span style={{ fontSize: '14px' }}>Click to select files</span>
                                        <span style={{ fontSize: '12px' }}>Select multiple files for bulk upload</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── External URL Input (Video only) ─────────────────── */}
                    {isVideo && !isBulkMode && (
                        <div className={styles.formGroup}>
                            <label>Video URL (YouTube, G-Drive, v.v...) <span className={styles.required}>*</span></label>
                            <input
                                type="url"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                disabled={isUploading}
                                required
                            />
                        </div>
                    )}

                    {/* Single file image preview */}
                    {!isCharacter && !isBulkMode && previewUrl && (
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

                    {/* ── Bulk Mode: File List ─────────────────────────────── */}
                    {isBulkMode && (
                        <div className={styles.bulkSection}>
                            <div className={styles.bulkHeader}>
                                <label>{bulkFiles.length} files selected</label>
                                <button
                                    type="button"
                                    className={styles.addExprBtn}
                                    onClick={() => document.getElementById('asset-file-input-bulk').click()}
                                    disabled={isUploading}
                                >
                                    <Plus size={14} /> Add More
                                </button>
                                <input
                                    id="asset-file-input-bulk"
                                    type="file"
                                    accept={getAcceptType()}
                                    multiple
                                    onChange={(e) => {
                                        const newFiles = Array.from(e.target.files).map(f => ({
                                            file: f,
                                            assetId: fileNameToAssetId(f.name),
                                            name: '',
                                            status: 'pending',
                                            error: null,
                                            previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
                                        }));
                                        setBulkFiles(prev => [...prev, ...newFiles]);
                                        e.target.value = '';
                                    }}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <div className={styles.bulkList}>
                                {bulkFiles.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`${styles.bulkItem} ${item.status === 'done' ? styles.bulkItemDone :
                                                item.status === 'error' ? styles.bulkItemError :
                                                    item.status === 'uploading' ? styles.bulkItemUploading : ''
                                            }`}
                                    >
                                        {/* Thumbnail */}
                                        <div className={styles.bulkThumb}>
                                            {item.previewUrl ? (
                                                <img src={item.previewUrl} alt="" />
                                            ) : (
                                                <ImageIcon size={16} />
                                            )}
                                        </div>

                                        {/* Info columns */}
                                        <div className={styles.bulkInfo}>
                                            <div className={styles.bulkFileName}>{item.file.name}</div>
                                            <input
                                                type="text"
                                                value={item.assetId}
                                                onChange={(e) => updateBulkFile(index, 'assetId', e.target.value)}
                                                placeholder="Asset ID *"
                                                disabled={isUploading || item.status === 'done'}
                                                className={styles.bulkInput}
                                            />
                                        </div>

                                        {/* Status */}
                                        <div className={styles.bulkStatus}>
                                            {item.status === 'pending' && (
                                                <button
                                                    type="button"
                                                    className={styles.removeExprBtn}
                                                    onClick={() => removeBulkFile(index)}
                                                    disabled={isUploading}
                                                    title="Remove"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            {item.status === 'uploading' && (
                                                <Loader2 size={16} className={styles.spinner} style={{ color: 'var(--color-accent-light)' }} />
                                            )}
                                            {item.status === 'done' && (
                                                <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
                                            )}
                                            {item.status === 'error' && (
                                                <XCircle size={16} style={{ color: '#ff6b6b' }} title={item.error} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Character Expressions ───────────────────────────── */}
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
                                        <div className={styles.miniUploadGrid}>
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
                                                        <img src={expr.avatarUrl} alt="avatar" className={styles.miniPreview} />
                                                    ) : (
                                                        <ImageIcon size={14} />
                                                    )}
                                                </div>
                                                <span className={styles.miniLabel}>
                                                    {expr.avatarUrl ? 'Avatar' : 'Avatar *'}
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
                                                        <img src={expr.fullUrl} alt="full" className={styles.miniPreview} />
                                                    ) : (
                                                        <Upload size={14} />
                                                    )}
                                                </div>
                                                <span className={styles.miniLabel}>
                                                    {expr.fullUrl ? 'Full body' : 'Full body image *'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Error Display ────────────────────────────────────── */}
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

                    {/* ── Upload Progress Bar ──────────────────────────────── */}
                    {isUploading && isBulkMode && (
                        <div className={styles.progressSection}>
                            <div className={styles.progressInfo}>
                                <Loader2 size={14} className={styles.spinner} />
                                <span>Uploading {uploadProgress.current}/{uploadProgress.total}...</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Actions ──────────────────────────────────────────── */}
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={() => { resetForm(); onClose(); }}
                            disabled={isUploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isSubmitDisabled()}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={16} className={styles.spinner} style={{ marginRight: '8px' }} />
                                    {isBulkMode ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...` : 'Creating...'}
                                </>
                            ) : (
                                isBulkMode ? `Upload ${bulkFiles.length} Assets` :
                                    isCharacter ? 'Create Character' : 'Create Asset'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
