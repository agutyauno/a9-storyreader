import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader, Save, Upload, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import { uploadFileToGithub, getFolderPath } from '../../services/githubService';
import ConfirmModal from './ConfirmModal';
import { getAssetUrl } from '../../utils/assetUtils';
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
    const [deletedExprNames, setDeletedExprNames] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadingFields, setUploadingFields] = useState({}); // { 'exprId-avatarUrl': true }
    const [deletedExprIds, setDeletedExprIds] = useState(new Set());
    const [category, setCategory] = useState('');
    const [error, setError] = useState(null);
    const [previewImage, setPreviewImage] = useState(null); // URL of image to show in lightbox

    // Confirm Modal
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: () => {} });

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
            // Ensure every expression has a unique ID for UI state management.
            // If the DB doesn't provide an 'id', we generate one.
            const dataWithIds = data.map((e, index) => ({
                ...e,
                id: e.id || `db-${index}-${Date.now()}`
            }));
            setExpressions(dataWithIds);
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

                // 2. Delete removed ones
                if (deletedExprNames.size > 0) {
                    for (const name of deletedExprNames) {
                        await SupabaseAPI.deleteExpression(charId, name);
                    }
                }

                // 3. Add/Update expressions
                for (const expr of expressions) {
                    const exprData = {
                        character_id: charId,
                        name: expr.name,
                        avatar_url: expr.avatar_url,
                        full_url: expr.full_url
                    };

                    if (expr.isNew) {
                        await SupabaseAPI.createExpression(exprData);
                    } else {
                        await SupabaseAPI.updateExpression(charId, expr.name, exprData);
                    }
                }
                setDeletedExprNames(new Set());
            } else if (asset.category === 'gallery') {
                // Gallery items have a 'title' column in the gallery table
                const payload = { title: name.trim() };
                await SupabaseAPI.updateGallery(asset.asset_id, payload);
            } else {
                // Table 'assets' only has: asset_id, type, category, url. 'name' is NOT a column.
                const payload = {};
                if (category && category !== asset.category) payload.category = category;
                
                if (Object.keys(payload).length > 0) {
                    await SupabaseAPI.updateAsset(asset.asset_id, payload);
                }
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
            // Use asset_id as the filename to ensure overwrite/update on GitHub
            const targetFileName = asset.asset_id;
            const res = await uploadFileToGithub(file, folder, targetFileName);
            if (res?.success) {
                if (asset.category === 'gallery') {
                    await SupabaseAPI.updateGallery(asset.asset_id, { image_url: res.url });
                } else {
                    await SupabaseAPI.updateAsset(asset.asset_id, { url: res.url });
                }
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
        setConfirmData({
            title: `Xoá asset`,
            message: `Bạn có chắc chắn muốn xoá asset "${asset.name || asset.asset_id}"? Hành động này không thể hoàn tác.`,
            onConfirm: async () => {
                try {
                    await SupabaseAPI.deleteAsset(asset.asset_id);
                    showNotification('Đã xoá asset!', 'success');
                    onUpdated?.();
                    onClose?.();
                } catch (err) {
                    setError(`Xoá thất bại: ${err.message}`);
                }
            }
        });
        setConfirmOpen(true);
    };

    const handleDeleteCharacter = async () => {
        const charId = asset.character_id || asset.asset_id;
        setConfirmData({
            title: `Xoá nhân vật`,
            message: `Bạn có chắc chắn muốn xoá nhân vật "${asset.name}"? Hành động này không thể hoàn tác.`,
            onConfirm: async () => {
                try {
                    await SupabaseAPI.deleteCharacter(charId);
                    showNotification('Đã xoá nhân vật!', 'success');
                    onUpdated?.();
                    onClose?.();
                } catch (err) {
                    setError(`Xoá thất bại: ${err.message}`);
                }
            }
        });
        setConfirmOpen(true);
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
            
            // Use character_id + exprId + field as identifier for overwrite
            const charId = asset.character_id || asset.asset_id;
            const customName = `${charId}_${exprId}_${field === 'avatar_url' ? 'avatar' : 'full'}`;
            
            const result = await uploadFileToGithub(file, folderPath, customName);
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
        // Just add a local item with a temporary ID that is very unlikely to collide
        const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        setExpressions([...expressions, {
            id: tempId,
            isNew: true,
            name: 'New Expression',
            avatar_url: '',
            full_url: ''
        }]);
    };

    const handleDeleteExpression = (expr) => {
        setConfirmData({
            title: `Xoá biểu cảm`,
            message: `Bạn có chắc chắn muốn xoá biểu cảm "${expr.name}"?`,
            onConfirm: () => {
                setExpressions(expressions.filter(e => e !== expr));
                if (!expr.isNew) {
                    setDeletedExprNames(prev => new Set(prev).add(expr.name));
                }
            }
        });
        setConfirmOpen(true);
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
                        {(isCharacter || asset.category === 'gallery') && (
                            <div className={styles.formGroup}>
                                <label>{isCharacter ? 'Display Name' : 'Title'}</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Enter name"
                                />
                            </div>
                        )}
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
                                {asset.type === 'image' && <img src={getAssetUrl(asset.url)} alt={asset.name} />}
                                {asset.type === 'video' && <video src={getAssetUrl(asset.url)} controls />}
                                {asset.type === 'audio' && <audio src={getAssetUrl(asset.url)} controls style={{ width: '100%' }} />}
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

                    {/* Character Full Body Preview */}
                    {isCharacter && (
                        <div className={styles.section}>
                            <h4>Character Preview</h4>
                            <div className={styles.previewContainer} style={{ background: 'rgba(0,0,0,0.2)', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {loading ? (
                                    <Loader size={24} className={styles.spinner} />
                                ) : expressions.length > 0 && expressions.find(e => e.full_url) ? (
                                    <img 
                                        src={getAssetUrl((expressions.find(e => e.name?.toLowerCase() === 'default' && e.full_url) || expressions.find(e => e.full_url))?.full_url)} 
                                        alt="Featured Preview" 
                                        style={{ maxHeight: '500px', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div style={{ color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                                        <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: 10 }} />
                                        <p>Chưa có ảnh Full Body nào được upload.</p>
                                    </div>
                                )}
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
                                    {expressions.map((expr, idx) => (
                                        <div key={`expr-${expr.id || idx}`} className={styles.expressionCard}>
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
                                                        ) : (
                                                            <img
                                                                src={getAssetUrl(expr.avatar_url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')}
                                                                alt="avatar"
                                                                className={styles.miniPreview}
                                                                onClick={(e) => { 
                                                                    if (expr.avatar_url) {
                                                                        e.stopPropagation(); 
                                                                        setPreviewImage(getAssetUrl(expr.avatar_url)); 
                                                                    }
                                                                }}
                                                                style={{ opacity: expr.avatar_url ? 1 : 0.2 }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <span className={styles.miniLabel}>{expr.avatar_url ? 'Avatar' : 'Chưa có Avatar'}</span>
                                                    </div>
                                                    <button 
                                                        className={styles.miniUploadBtn}
                                                        onClick={(e) => { e.stopPropagation(); document.getElementById(`avatar-file-${expr.id}`).click(); }}
                                                        disabled={uploadingFields[`${expr.id}-avatar_url`]}
                                                        title="Chọn ảnh mới"
                                                    >
                                                        <Upload size={14} /> {expr.avatar_url ? 'Đổi ảnh' : 'Tải lên'}
                                                    </button>
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
                                                        ) : (
                                                            <img
                                                                src={getAssetUrl(expr.full_url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')}
                                                                alt="full"
                                                                className={styles.miniPreview}
                                                                onClick={(e) => { 
                                                                    if (expr.full_url) {
                                                                        e.stopPropagation(); 
                                                                        setPreviewImage(getAssetUrl(expr.full_url)); 
                                                                    }
                                                                }}
                                                                style={{ opacity: expr.full_url ? 1 : 0.2 }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <span className={styles.miniLabel}>{expr.full_url ? 'Full Body' : 'Chưa có Full Body'}</span>
                                                    </div>
                                                    <button 
                                                        className={styles.miniUploadBtn}
                                                        onClick={(e) => { e.stopPropagation(); document.getElementById(`full-file-${expr.id}`).click(); }}
                                                        disabled={uploadingFields[`${expr.id}-full_url`]}
                                                        title="Chọn ảnh mới"
                                                    >
                                                        <Upload size={14} /> {expr.full_url ? 'Đổi ảnh' : 'Tải lên'}
                                                    </button>
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

            {/* Lightbox for Expression Images */}
            {previewImage && (
                <div className={styles.lightbox} onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}>
                    <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.lightboxClose} onClick={() => setPreviewImage(null)}>
                            <X size={24} />
                        </button>
                        <img src={previewImage} alt="Preview" className={styles.lightboxImage} />
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmOpen}
                title={confirmData.title}
                message={confirmData.message}
                onConfirm={confirmData.onConfirm}
                onClose={() => setConfirmOpen(false)}
            />
        </div>
    );
}
