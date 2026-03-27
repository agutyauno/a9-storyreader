import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader, Save, Upload, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import { uploadFileToGithub, getFolderPath } from '../../services/githubService';
import styles from './AssetDetailModal.module.css';

/**
 * Detail modal for viewing/editing an asset or character.
 * For characters: shows expression list with CRUD.
 * Props:
 *   isOpen      — boolean
 *   asset       — asset or character object
 *   kind        — 'asset' | 'character'
 *   onClose()
 *   onUpdated() — callback after updates
 */
export default function AssetDetailModal({ isOpen, asset, kind, onClose, onUpdated, onPickAsset, showNotification }) {
    const [name, setName] = useState('');
    const [expressions, setExpressions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadingFields, setUploadingFields] = useState({}); // { 'exprId-avatarUrl': true }
    const [deletedExprIds, setDeletedExprIds] = useState(new Set());
    const [category, setCategory] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !asset) return;
        setName(asset.name || '');
        setCategory(asset.category || asset.type || '');
        setError(null);
        if (kind === 'character') loadExpressions();
    }, [isOpen, asset, kind]);

    const loadExpressions = async () => {
        if (!asset) return;
        setLoading(true);
        try {
            const charId = asset.character_id || asset.asset_id;
            const data = await SupabaseAPI.getExpressionsByCharacter(charId);
            setExpressions(data);
        } catch (err) {
            console.error('Load expressions failed:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !asset) return null;

    const isCharacter = kind === 'character';

    // ─── Save metadata ─────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            const charId = asset.character_id || asset.asset_id;
            if (isCharacter) {
                // 1. Update character name
                await SupabaseAPI.updateCharacter(charId, { name: name.trim() });
                
                // 2. Sync expressions: Upsert current list
                for (const expr of expressions) {
                    const exprData = {
                        name: expr.name,
                        avatar_url: expr.avatar_url,
                        full_url: expr.full_url
                    };
                    if (expr.id && !expr.isNew) {
                        await SupabaseAPI.updateExpression(expr.id, exprData);
                    } else {
                        await SupabaseAPI.createExpression({
                            character_id: charId,
                            ...exprData
                        });
                    }
                }

                // 3. Delete removed ones
                for (const id of deletedExprIds) {
                    await SupabaseAPI.deleteExpression(id);
                }
                setDeletedExprIds(new Set());
            } else {
                // Update name and category (if changed)
                const payload = { name: name.trim() };
                if (category && category !== asset.category) payload.category = category;
                await SupabaseAPI.updateAsset(asset.asset_id, payload);
            }
            onUpdated?.();
            showNotification('Đã lưu thay đổi!', 'success');
        } catch (err) {
            console.error('Save failed:', err);
            setError(err.message || 'Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    // Upload replacement file for asset (image/video/audio)
    const handleFileChange = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setFile(f);
    };

    const handleUploadAndReplace = async () => {
        if (!file) {
            setError('Chưa chọn file để upload');
            return;
        }
        setUploading(true);
        try {
            // Choose folder path based on type/category
            const folder = getFolderPath(asset.type || (category === 'background' ? 'image' : 'image'), category);
            const res = await uploadFileToGithub(file, folder);
            if (res?.success) {
                await SupabaseAPI.updateAsset(asset.asset_id, { url: res.url });
                onUpdated?.();
                showNotification('Upload và thay thế thành công!', 'success');
            }
        } catch (err) {
            setError(`Upload thất bại: ${err.message}`);
        } finally {
            setUploading(false);
            setFile(null);
        }
    };

    const handleDeleteAsset = async () => {
        if (!window.confirm(`Xoá asset "${asset.name || asset.asset_id}"?`)) return;
        try {
            await SupabaseAPI.deleteAsset(asset.asset_id);
            showNotification('Đã xoá asset!', 'success');
            onUpdated?.();
            onClose?.();
        } catch (err) {
            setError(`Xoá thất bại: ${err.message}`);
        }
    };

    const handleDeleteCharacter = async () => {
        const charId = asset.character_id || asset.asset_id;
        if (!window.confirm(`Xoá nhân vật "${asset.name}"?`)) return;
        try {
            await SupabaseAPI.deleteCharacter(charId);
            showNotification('Đã xoá nhân vật!', 'success');
            onUpdated?.();
            onClose?.();
        } catch (err) {
            setError(`Xoá thất bại: ${err.message}`);
        }
    };

    // ─── Expression CRUD ────────────────────────────────────────────────────────
    const handleExpressionChange = (exprId, field, value) => {
        setExpressions(prev => prev.map(e =>
            e.id === exprId ? { ...e, [field]: value } : e
        ));
    };

    const handleExprFileUpload = async (exprId, field, file) => {
        if (!file) return;
        const fieldKey = `${exprId}-${field}`;
        setUploadingFields(prev => ({ ...prev, [fieldKey]: true }));
        try {
            const category = field === 'avatar_url' ? 'char_avatar' : 'character';
            const folderPath = getFolderPath('image', category);
            const result = await uploadFileToGithub(file, folderPath);
            if (result.success) {
                handleExpressionChange(exprId, field, result.url);
            }
        } catch (err) {
            console.error('Expr upload failed:', err);
            setError(`Upload failed: ${err.message}`);
        } finally {
            setUploadingFields(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    const handleAddExpression = () => {
        // Just add a local item with a temporary ID
        const tempId = `temp-${Date.now()}`;
        setExpressions([...expressions, {
            id: tempId,
            isNew: true,
            name: 'New Expression',
            avatar_url: '',
            full_url: ''
        }]);
    };

    const handleDeleteExpression = (expr) => {
        if (!window.confirm(`Xoá expression "${expr.name}"?`)) return;
        setExpressions(prev => prev.filter(e => e.id !== expr.id));
        if (!expr.isNew) {
            setDeletedExprIds(prev => new Set(prev).add(expr.id));
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h3>{isCharacter ? 'Character Detail' : 'Asset Detail'}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
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
                    {/* Basic info */}
                    <div className={styles.section}>
                        <h4>Thông tin</h4>
                        <div className={styles.grid}>
                            <div className={styles.formGroup}>
                                <label>ID</label>
                                <input value={isCharacter ? (asset.character_id || '') : (asset.asset_id || '')} readOnly />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{isCharacter ? 'Type' : 'Category'}</label>
                                <input value={category} readOnly />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Display Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter name"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? <Loader size={14} className={styles.spinner} /> : <Save size={14} />}
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            {isCharacter ? (
                                <button className={styles.deleteBtn} onClick={handleDeleteCharacter} title="Xoá nhân vật">
                                    <Trash2 size={14} /> Xoá nhân vật
                                </button>
                            ) : (
                                <button className={styles.deleteBtn} onClick={handleDeleteAsset} title="Xoá asset">
                                    <Trash2 size={14} /> Xoá asset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Preview (for non-character assets) */}
                    {!isCharacter && asset.url && (
                        <div className={styles.section}>
                            <h4>Preview</h4>
                            <div className={styles.previewContainer}>
                                {asset.type === 'image' && <img src={asset.url} alt={asset.name} />}
                                {asset.type === 'video' && <video src={asset.url} controls />}
                                {asset.type === 'audio' && <audio src={asset.url} controls style={{ width: '100%' }} />}
                            </div>
                            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input 
                                    id="replace-file-input" 
                                    type="file" 
                                    style={{ display: 'none' }} 
                                    onChange={handleFileChange} 
                                    accept={asset.type === 'image' ? 'image/*' : 
                                            asset.type === 'audio' ? 'audio/*' : 
                                            asset.type === 'video' ? 'video/*' : '*'}
                                />
                                <label htmlFor="replace-file-input" className={styles.saveBtn} style={{ cursor: 'pointer', backgroundColor: file ? 'rgba(184, 169, 255, 0.1)' : '' }}>
                                    <Upload size={14} /> {file ? 'Đổi file' : 'Chọn file'}
                                </label>
                                
                                <button 
                                    className={styles.saveBtn} 
                                    style={{ cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid var(--color-border)' }}
                                    onClick={() => onPickAsset?.(async (url) => {
                                        await SupabaseAPI.updateAsset(asset.asset_id, { url });
                                        onUpdated?.();
                                    })}
                                >
                                    <ImageIcon size={14} /> Duyệt asset
                                </button>
                                
                                {file && (
                                    <button className={styles.actionBtn} onClick={handleUploadAndReplace} disabled={uploading}>
                                        {uploading ? <Loader size={14} className={styles.spinner} /> : <Check size={14} />}
                                        {uploading ? 'Đang upload...' : 'Upload & Thay thế'}
                                    </button>
                                )}
                                {file && !uploading && <span className={styles.fileName}>{file.name}</span>}
                            </div>
                        </div>
                    )}

                    {/* Expression list (characters only) */}
                    {isCharacter && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h4>Expressions</h4>
                                <button className={styles.addBtn} onClick={handleAddExpression}>
                                    <Plus size={12} /> Thêm
                                </button>
                            </div>

                            {loading ? (
                                <Loader size={20} className={styles.spinner} />
                            ) : expressions.length === 0 ? (
                                <p className={styles.empty}>Chưa có expression nào.</p>
                            ) : (
                                <div className={styles.expressionList}>
                                    {expressions.map(expr => (
                                        <div key={expr.id} className={styles.expressionCard}>
                                            <div className={styles.expHeader}>
                                                <input
                                                    className={styles.expNameInput}
                                                    value={expr.name}
                                                    onChange={e => handleExpressionChange(expr.id, 'name', e.target.value)}
                                                    placeholder="Expression Name"
                                                />
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDeleteExpression(expr)}
                                                    title="Xoá"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            
                                            <div className={styles.miniUploadGrid}>
                                                {/* Avatar Upload */}
                                                <div className={styles.miniUploadGroup}>
                                                    <div
                                                        className={`${styles.miniDropZone} ${uploadingFields[`${expr.id}-avatar_url`] ? styles.uploading : ''}`}
                                                        onClick={() => !uploadingFields[`${expr.id}-avatar_url`] && document.getElementById(`avatar-file-${expr.id}`).click()}
                                                    >
                                                        <input
                                                            id={`avatar-file-${expr.id}`}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleExprFileUpload(expr.id, 'avatar_url', e.target.files[0])}
                                                            style={{ display: 'none' }}
                                                        />
                                                        {uploadingFields[`${expr.id}-avatar_url`] ? (
                                                            <Loader size={12} className={styles.spinner} />
                                                        ) : expr.avatar_url ? (
                                                            <img src={expr.avatar_url} alt="avatar" className={styles.miniPreview} />
                                                        ) : (
                                                            <ImageIcon size={14} />
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <span className={styles.miniLabel}>{expr.avatar_url ? 'Avatar' : 'Add Avatar'}</span>
                                                        <button 
                                                            className={styles.miniBrowseBtn} 
                                                            onClick={() => onPickAsset?.((url) => handleExpressionChange(expr.id, 'avatar_url', url))}
                                                            title="Duyệt asset"
                                                        >
                                                            <ImageIcon size={10} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Full Body Upload */}
                                                <div className={styles.miniUploadGroup}>
                                                    <div
                                                        className={`${styles.miniDropZone} ${uploadingFields[`${expr.id}-full_url`] ? styles.uploading : ''}`}
                                                        onClick={() => !uploadingFields[`${expr.id}-full_url`] && document.getElementById(`full-file-${expr.id}`).click()}
                                                    >
                                                        <input
                                                            id={`full-file-${expr.id}`}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleExprFileUpload(expr.id, 'full_url', e.target.files[0])}
                                                            style={{ display: 'none' }}
                                                        />
                                                        {uploadingFields[`${expr.id}-full_url`] ? (
                                                            <Loader size={12} className={styles.spinner} />
                                                        ) : expr.full_url ? (
                                                            <img src={expr.full_url} alt="full" className={styles.miniPreview} />
                                                        ) : (
                                                            <Upload size={14} />
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <span className={styles.miniLabel}>{expr.full_url ? 'Full Body' : 'Add Full Body'}</span>
                                                        <button 
                                                            className={styles.miniBrowseBtn} 
                                                            onClick={() => onPickAsset?.((url) => handleExpressionChange(expr.id, 'full_url', url))}
                                                            title="Duyệt asset"
                                                        >
                                                            <ImageIcon size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
