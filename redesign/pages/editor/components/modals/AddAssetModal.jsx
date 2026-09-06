import React, { useState, useEffect } from 'react';
import { X, Upload, Loader, Image as ImageIcon, Plus, Trash2, CheckCircle2, Video, Music, UserSquare2 } from 'lucide-react';
import { uploadFileToGithub, getFolderPath, purgeJsDelivrCache } from '../../../../../src/services/githubService';
import { getAssetUrl } from '../../../../../src/utils/assetUtils';
import '../editorComponents.css';

const ASSET_TYPES = [
    { value: 'background', label: 'Background Image', type: 'image', category: 'background' },
    { value: 'thumbnail', label: 'Thumbnail Image', type: 'image', category: 'thumbnail' },
    { value: 'banner', label: 'Banner Image', type: 'image', category: 'banner' },
    { value: 'character', label: 'Character', type: 'character', category: 'character' },
    { value: 'gallery', label: 'Gallery / Story Art', type: 'image', category: 'gallery' },
    { value: 'wallpaper', label: 'Wallpaper Image', type: 'image', category: 'wallpaper' },
    { value: 'video', label: 'Video (PV)', type: 'video', category: 'PV' },
    { value: 'bgm', label: 'BGM (audio)', type: 'audio', category: 'bgm' },
    { value: 'sfx', label: 'SFX (audio)', type: 'audio', category: 'sfx' },
];

const fileNameToAssetId = (fileName) => {
    const base = fileName.replace(/\.[^.]+$/, '');
    return base.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
};

export default function AddAssetModal({ isOpen, onClose, onSubmit, initialCategory }) {
    const [assetValue, setAssetValue] = useState('background');
    
    // Single mode fields
    const [assetId, setAssetId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [externalUrl, setExternalUrl] = useState('');

    // Bulk mode fields
    const [bulkFiles, setBulkFiles] = useState([]);

    // Character expressions fields
    const [expressions, setExpressions] = useState([
        { name: 'default', avatarUrl: '', fullUrl: '' }
    ]);
    const [uploadingFields, setUploadingFields] = useState({});

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            resetForm();
            if (initialCategory && initialCategory !== 'all') {
                const isValid = ASSET_TYPES.some(t => t.value === initialCategory);
                if (isValid) setAssetValue(initialCategory);
            }
        }
    }, [isOpen, initialCategory]);

    if (!isOpen) return null;

    const selectedType = ASSET_TYPES.find(t => t.value === assetValue) || ASSET_TYPES[0];
    const isCharacter = assetValue === 'character';
    const isVideo = assetValue === 'video';
    const isBulkMode = bulkFiles.length > 1;

    const resetForm = () => {
        setAssetValue('background');
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
        setIsUploading(false);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setError(null);

        if (isCharacter || files.length === 1) {
            const f = files[0];
            setFile(f);
            setBulkFiles([]);
            setAssetId(fileNameToAssetId(f.name));
            setName(f.name.replace(/\.[^.]+$/, ''));
            if (f.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(f));
            } else {
                setPreviewUrl('');
            }
        } else {
            setFile(null);
            setPreviewUrl('');
            setAssetId('');
            const items = files.map(f => ({
                file: f,
                assetId: fileNameToAssetId(f.name),
                name: f.name.replace(/\.[^.]+$/, ''),
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

    // Character expressions handlers
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

    const handleExprFileUpload = async (index, field, selectedFile) => {
        if (!selectedFile) return;
        const fieldKey = `${index}-${field}`;
        setUploadingFields(prev => ({ ...prev, [fieldKey]: true }));
        try {
            const category = field === 'avatarUrl' ? 'char_avatar' : 'character';
            const folderPath = getFolderPath('image', category);
            const result = await uploadFileToGithub(selectedFile, folderPath);
            if (!result.success) {
                throw new Error(result.error || 'Tải file lên Server thất bại');
            }
            updateExpression(index, field, result.url);
            await purgeJsDelivrCache(result.url);
        } catch (err) {
            console.error('Upload expression image failed:', err);
            setError(`Tải ảnh biểu cảm thất bại: ${err.message}`);
        } finally {
            setUploadingFields(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    // Submit logic
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isBulkMode) {
            await handleBulkSubmit();
        } else {
            await handleSingleSubmit();
        }
    };

    const handleSingleSubmit = async () => {
        if (!assetValue || !assetId.trim()) {
            setError('Vui lòng nhập Asset ID');
            return;
        }

        if (!isCharacter && !isVideo && !file) {
            setError('Vui lòng chọn file từ thiết bị để tải lên');
            return;
        }

        if (isVideo && !externalUrl.trim()) {
            setError('Vui lòng nhập URL cho Video');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            if (isCharacter) {
                const filteredExprs = expressions.filter(e => e.name.trim());
                if (filteredExprs.length === 0) {
                    setError('Nhân vật cần ít nhất một biểu cảm');
                    setIsUploading(false);
                    return;
                }

                for (const expr of filteredExprs) {
                    if (!expr.avatarUrl || !expr.fullUrl) {
                        setError(`Biểu cảm "${expr.name}" chưa chọn đủ ảnh Avatar và Full Body.`);
                        setIsUploading(false);
                        return;
                    }
                }

                await onSubmit({
                    type: selectedType.type,
                    category: selectedType.category,
                    name: name.trim() || assetId.trim(),
                    description: description.trim(),
                    asset_id: assetId.trim(),
                    expressions: filteredExprs.map(e => ({
                        name: e.name.trim(),
                        avatar_url: e.avatarUrl,
                        full_url: e.fullUrl
                    })),
                });
            } else if (isVideo) {
                await onSubmit({
                    type: selectedType.type,
                    category: selectedType.category,
                    name: name.trim() || assetId.trim(),
                    description: description.trim(),
                    asset_id: assetId.trim(),
                    url: externalUrl.trim(),
                });
            } else {
                // Upload file to GitHub
                const folderPath = getFolderPath(selectedType.type, selectedType.category);
                const result = await uploadFileToGithub(file, folderPath);
                if (!result.success) throw new Error(result.error || 'Upload file thất bại');
                
                await purgeJsDelivrCache(result.url);

                await onSubmit({
                    type: selectedType.type,
                    category: selectedType.category,
                    name: name.trim() || assetId.trim(),
                    description: description.trim(),
                    asset_id: assetId.trim(),
                    url: result.url,
                });
            }
            onClose();
        } catch (err) {
            console.error('Submit single asset failed:', err);
            setError(err.message || 'Thêm asset thất bại');
        } finally {
            setIsUploading(false);
        }
    };

    const handleBulkSubmit = async () => {
        const pending = bulkFiles.filter(f => f.status !== 'done');
        if (!pending.length) return;

        setIsUploading(true);
        setError(null);
        setUploadProgress({ current: 0, total: pending.length });

        const folderPath = getFolderPath(selectedType.type, selectedType.category);
        let currentCount = 0;

        for (let i = 0; i < bulkFiles.length; i++) {
            const item = bulkFiles[i];
            if (item.status === 'done') continue;

            updateBulkFile(i, 'status', 'uploading');
            try {
                const result = await uploadFileToGithub(item.file, folderPath);
                if (!result.success) throw new Error(result.error || 'Upload error');

                await purgeJsDelivrCache(result.url);

                await onSubmit({
                    type: selectedType.type,
                    category: selectedType.category,
                    name: item.name.trim() || item.assetId.trim(),
                    description: '',
                    asset_id: item.assetId.trim(),
                    url: result.url,
                });

                updateBulkFile(i, 'status', 'done');
            } catch (err) {
                console.error(`Bulk upload item error (${item.assetId}):`, err);
                updateBulkFile(i, 'status', 'error');
                updateBulkFile(i, 'error', err.message);
            }

            currentCount++;
            setUploadProgress({ current: currentCount, total: pending.length });
        }

        setIsUploading(false);
        const hasErrors = bulkFiles.some(f => f.status === 'error');
        if (!hasErrors) {
            onClose();
        }
    };

    return (
        <div className="redesign-modal-overlay" onClick={onClose}>
            <div className={`redesign-modal-card ${isCharacter || isBulkMode ? 'large' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="redesign-modal-header">
                    <div className="redesign-modal-title">
                        <ImageIcon size={18} />
                        <span>THÊM ASSET MỚI</span>
                    </div>
                    <button className="redesign-modal-close" onClick={onClose} disabled={isUploading}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="redesign-modal-body">
                        {error && (
                            <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(244,67,54,0.15)', border: '1px solid #F44336', color: '#FF5252', fontSize: '0.8rem', borderRadius: '3px' }}>
                                {error}
                            </div>
                        )}

                        {/* Select Asset Type */}
                        <div className="redesign-form-group">
                            <label className="redesign-label">Loại Asset *</label>
                            <select 
                                className="redesign-select"
                                value={assetValue}
                                onChange={(e) => setAssetValue(e.target.value)}
                                disabled={isUploading}
                            >
                                {ASSET_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Single vs Bulk File Selection Box */}
                        {!isVideo && !isCharacter && (
                            <div className="redesign-form-group">
                                <label className="redesign-label">Chọn File từ thiết bị * (Có thể chọn nhiều file)</label>
                                <div style={{ border: '2px dashed rgba(245,237,220,0.25)', padding: '1.25rem', textAlign: 'center', backgroundColor: '#121212', borderRadius: '4px', position: 'relative' }}>
                                    <input 
                                        type="file"
                                        multiple
                                        accept={selectedType.type === 'image' ? 'image/*' : selectedType.type === 'audio' ? 'audio/*' : '*/*'}
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    />
                                    <Upload size={28} style={{ color: 'var(--color-terracotta)', marginBottom: '0.4rem' }} />
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F5EDDC' }}>
                                        Kéo thả hoặc click để chọn file từ máy tính
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(245,237,220,0.5)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                                        Chấp nhận các định dạng {selectedType.type === 'image' ? 'PNG, JPG, WEBP, GIF' : 'MP3, WAV, OGG'}
                                    </div>
                                </div>
                                {previewUrl && !isBulkMode && (
                                    <div style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(245,237,220,0.18)', padding: '0.75rem', textAlign: 'center', borderRadius: '4px', marginTop: '0.6rem' }}>
                                        <span style={{ fontSize: '0.68rem', color: 'rgba(245,237,220,0.6)', display: 'block', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>PREVIEW XEM TRƯỚC FILE CHỌN</span>
                                        <img src={previewUrl} alt="" style={{ maxHeight: '340px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', border: '1px solid rgba(245,237,220,0.15)' }} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Video External URL Field */}
                        {isVideo && (
                            <div className="redesign-form-group">
                                <label className="redesign-label">URL Video (YouTube / Direct Link) *</label>
                                <input 
                                    className="redesign-input"
                                    placeholder="https://..."
                                    value={externalUrl}
                                    onChange={(e) => setExternalUrl(e.target.value)}
                                    disabled={isUploading}
                                />
                            </div>
                        )}

                        {/* Bulk Upload Files List */}
                        {isBulkMode && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <label className="redesign-label">Danh sách file đã chọn ({bulkFiles.length} files)</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                                    {bulkFiles.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: '#141414', padding: '0.4rem 0.6rem', border: '1px solid rgba(245,237,220,0.15)' }}>
                                            {item.previewUrl ? (
                                                <img src={item.previewUrl} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                                            ) : (
                                                <ImageIcon size={24} style={{ opacity: 0.5 }} />
                                            )}
                                            <input 
                                                className="redesign-input"
                                                style={{ flex: 1, fontSize: '0.75rem' }}
                                                value={item.assetId}
                                                onChange={(e) => updateBulkFile(idx, 'assetId', e.target.value)}
                                                placeholder="Asset ID"
                                                disabled={isUploading}
                                            />
                                            <span style={{ fontSize: '0.7rem', color: 'rgba(245,237,220,0.5)', fontFamily: 'var(--font-mono)' }}>
                                                {item.status}
                                            </span>
                                            <button type="button" className="redesign-btn danger" style={{ padding: '0.2rem 0.4rem' }} onClick={() => removeBulkFile(idx)} disabled={isUploading}>
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Single Mode Asset ID & Name */}
                        {!isBulkMode && (
                            <>
                                <div className="redesign-form-group">
                                    <label className="redesign-label">Asset ID *</label>
                                    <input 
                                        className="redesign-input"
                                        placeholder="Ví dụ: bg_ruin_city_01"
                                        value={assetId}
                                        onChange={(e) => setAssetId(e.target.value)}
                                        disabled={isUploading}
                                    />
                                </div>

                                <div className="redesign-form-group">
                                    <label className="redesign-label">Tên hiển thị</label>
                                    <input 
                                        className="redesign-input"
                                        placeholder="Nhập tên bối cảnh / asset..."
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isUploading}
                                    />
                                </div>

                                <div className="redesign-form-group">
                                    <label className="redesign-label">Mô tả</label>
                                    <textarea 
                                        className="redesign-textarea"
                                        placeholder="Nhập mô tả asset (không bắt buộc)..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={isUploading}
                                    />
                                </div>
                            </>
                        )}

                        {/* Character Expressions Upload Section */}
                        {isCharacter && (
                            <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(245,237,220,0.15)', paddingTop: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label className="redesign-label" style={{ margin: 0 }}>Danh sách biểu cảm nhân vật *</label>
                                    <button type="button" className="redesign-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }} onClick={addExpression} disabled={isUploading}>
                                        <Plus size={12} /> Thêm biểu cảm
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {expressions.map((expr, index) => (
                                        <div key={index} style={{ backgroundColor: '#141414', border: '1px solid rgba(245,237,220,0.15)', padding: '0.68rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <input 
                                                    className="redesign-input"
                                                    style={{ width: '180px', fontSize: '0.78rem' }}
                                                    placeholder="Tên biểu cảm (ví dụ: default, angry)"
                                                    value={expr.name}
                                                    onChange={(e) => updateExpression(index, 'name', e.target.value)}
                                                    disabled={isUploading}
                                                />
                                                {expressions.length > 1 && (
                                                    <button type="button" className="redesign-btn danger" style={{ padding: '0.2rem 0.4rem' }} onClick={() => removeExpression(index)} disabled={isUploading}>
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                                {/* Avatar Upload */}
                                                <div style={{ backgroundColor: '#0D0D0D', padding: '0.5rem', border: '1px dashed rgba(245,237,220,0.15)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{ fontSize: '0.68rem', color: 'rgba(245,237,220,0.6)', width: '100%' }}>Avatar Image</span>
                                                    {expr.avatarUrl ? (
                                                        <img src={getAssetUrl(expr.avatarUrl)} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(245,237,220,0.2)' }} />
                                                    ) : (
                                                        <label style={{ display: 'block', width: '100%', padding: '0.8rem 0.4rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#1A1A1A', fontSize: '0.7rem', color: '#F5EDDC' }}>
                                                            {uploadingFields[`${index}-avatarUrl`] ? 'Đang tải...' : 'Chọn ảnh Avatar'}
                                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleExprFileUpload(index, 'avatarUrl', e.target.files[0])} />
                                                        </label>
                                                    )}
                                                </div>

                                                {/* Full Body Upload */}
                                                <div style={{ backgroundColor: '#0D0D0D', padding: '0.5rem', border: '1px dashed rgba(245,237,220,0.15)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{ fontSize: '0.68rem', color: 'rgba(245,237,220,0.6)', width: '100%' }}>Full Body Image</span>
                                                    {expr.fullUrl ? (
                                                        <img src={getAssetUrl(expr.fullUrl)} alt="" style={{ height: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', border: '1px solid rgba(245,237,220,0.2)' }} />
                                                    ) : (
                                                        <label style={{ display: 'block', width: '100%', padding: '0.8rem 0.4rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#1A1A1A', fontSize: '0.7rem', color: '#F5EDDC' }}>
                                                            {uploadingFields[`${index}-fullUrl`] ? 'Đang tải...' : 'Chọn ảnh Full Body'}
                                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleExprFileUpload(index, 'fullUrl', e.target.files[0])} />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="redesign-modal-footer">
                        <button type="button" className="redesign-btn" onClick={onClose} disabled={isUploading}>
                            Hủy
                        </button>
                        <button type="submit" className="redesign-btn primary" disabled={isUploading}>
                            {isUploading ? <Loader className="spinning" size={14} /> : <Upload size={14} />}
                            <span>{isUploading ? `Đang tải lên Server (${uploadProgress.current}/${uploadProgress.total || 1})...` : 'Tải lên & Lưu Asset'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
