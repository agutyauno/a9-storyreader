import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader, Save, Upload, Image as ImageIcon, CheckCircle2, ZoomIn } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import { uploadFileToGithub, getFolderPath, purgeJsDelivrCache } from '../../../../../src/services/githubService';
import ConfirmModal from './ConfirmModal';
import { getAssetUrl } from '../../../../../src/utils/assetUtils';
import '../editorComponents.css';

export default function AssetDetailModal({ isOpen, asset, kind, onClose, onUpdated, onPickAsset, showNotification }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [expressions, setExpressions] = useState([]);
    const [deletedExprNames, setDeletedExprNames] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadingExprFields, setUploadingExprFields] = useState({});
    const [category, setCategory] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [error, setError] = useState(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: () => {} });

    // Lightbox image state for full-screen view
    const [lightboxImage, setLightboxImage] = useState(null);

    useEffect(() => {
        if (!isOpen || !asset) return;
        setName(asset.name || '');
        setCategory(asset.category || asset.type || '');
        setDescription(asset.description || '');
        setExternalUrl(asset.url || '');
        setError(null);
        setLightboxImage(null);
        if (kind === 'character') loadExpressions();
    }, [isOpen, asset, kind]);

    const loadExpressions = async () => {
        if (!asset) return;
        setLoading(true);
        try {
            const charId = asset.character_id || asset.asset_id;
            const data = await SupabaseAPI.getExpressionsByCharacter(charId);
            const dataWithIds = (data || []).map((e, index) => ({
                ...e,
                id: e.id || `db-${index}-${Date.now()}`,
                originalName: e.name
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

    // Replace file for asset from local device
    const handleReplaceFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        setError(null);
        try {
            const folderPath = getFolderPath(asset.type || 'image', asset.category || 'thumbnail');
            const result = await uploadFileToGithub(file, folderPath);
            if (!result.success) throw new Error(result.error || 'Tải file lên GitHub thất bại');

            await purgeJsDelivrCache(result.url);
            setExternalUrl(result.url);
            showNotification?.('Đã tải file mới lên Server', 'success');
        } catch (err) {
            console.error('Replace asset file error:', err);
            setError(`Lỗi thay thế file: ${err.message}`);
        } finally {
            setUploadingFile(false);
        }
    };

    // Upload image for expression avatar/full_body in character detail
    const handleExprFileUpload = async (exprId, field, file) => {
        if (!file) return;
        const fieldKey = `${exprId}-${field}`;
        setUploadingExprFields(prev => ({ ...prev, [fieldKey]: true }));
        try {
            const category = field === 'avatar_url' ? 'char_avatar' : 'character';
            const folderPath = getFolderPath('image', category);
            const result = await uploadFileToGithub(file, folderPath);
            if (!result.success) throw new Error(result.error || 'Tải ảnh thất bại');

            await purgeJsDelivrCache(result.url);
            handleExprChange(exprId, field, result.url);
            showNotification?.('Đã tải ảnh biểu cảm lên Server', 'success');
        } catch (err) {
            console.error('Upload expression file error:', err);
            setError(`Lỗi tải ảnh biểu cảm: ${err.message}`);
        } finally {
            setUploadingExprFields(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const charId = asset.character_id || asset.asset_id;
            if (isCharacter) {
                const hasEmptyName = expressions.some(e => !e.name || !e.name.trim());
                if (hasEmptyName) {
                    setError('Tên biểu cảm không được để trống.');
                    setSaving(false);
                    return;
                }

                await SupabaseAPI.updateCharacter(charId, { 
                    name: name.trim(),
                    description: description.trim() 
                });

                if (deletedExprNames.size > 0) {
                    for (const expName of deletedExprNames) {
                        await SupabaseAPI.deleteExpression(charId, expName);
                    }
                }

                for (const expr of expressions) {
                    const exprData = {
                        character_id: charId,
                        name: expr.name.trim(),
                        avatar_url: expr.avatar_url,
                        full_url: expr.full_url
                    };

                    if (expr.originalName) {
                        await SupabaseAPI.updateExpression(charId, expr.originalName, exprData);
                    } else {
                        await SupabaseAPI.createExpression(exprData);
                    }
                }
            } else {
                if (asset.category === 'gallery') {
                    await SupabaseAPI.updateGallery(asset.asset_id, {
                        title: name.trim(),
                        image_url: externalUrl.trim()
                    });
                } else {
                    await SupabaseAPI.updateAsset(asset.asset_id, {
                        name: name.trim(),
                        description: description.trim(),
                        url: externalUrl.trim()
                    });
                }
            }

            showNotification?.('Cập nhật thành công', 'success');
            onUpdated?.();
            onClose();
        } catch (err) {
            console.error('Save asset failed:', err);
            setError(err.message || 'Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleAddExpression = () => {
        setExpressions(prev => [
            ...prev,
            { id: `new-${Date.now()}`, name: '', avatar_url: '', full_url: '' }
        ]);
    };

    const handleRemoveExpression = (expr) => {
        if (expr.originalName) {
            setDeletedExprNames(prev => new Set(prev).add(expr.originalName));
        }
        setExpressions(prev => prev.filter(e => e.id !== expr.id));
    };

    const handleExprChange = (id, field, value) => {
        setExpressions(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    return (
        <>
            <div className="redesign-modal-overlay" onClick={onClose}>
                <div className="redesign-modal-card wide" onClick={(e) => e.stopPropagation()}>
                    <div className="redesign-modal-header">
                        <div className="redesign-modal-title">
                            <ImageIcon size={18} />
                            <span>CHI TIẾT: {asset.name || asset.title || asset.asset_id}</span>
                        </div>
                        <button className="redesign-modal-close" onClick={onClose} disabled={saving}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="redesign-modal-body">
                        {error && (
                            <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(244,67,54,0.15)', border: '1px solid #F44336', color: '#FF5252', fontSize: '0.8rem', borderRadius: '3px' }}>
                                {error}
                            </div>
                        )}

                        {!isCharacter ? (
                            <div style={{ display: 'grid', gridTemplateColumns: externalUrl ? '1fr 1.2fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="redesign-form-group">
                                        <label className="redesign-label">Tên / Nhãn hiển thị</label>
                                        <input 
                                            className="redesign-input"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nhập tên..."
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="redesign-form-group">
                                        <label className="redesign-label">File Asset trên Server</label>
                                        <div>
                                            <label className="redesign-btn primary" style={{ cursor: 'pointer', padding: '0.55rem 0.95rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'center' }}>
                                                {uploadingFile ? <Loader className="spinning" size={14} /> : <Upload size={14} />}
                                                <span>{uploadingFile ? 'Đang tải file mới lên Server...' : 'Chọn file từ thiết bị để thay thế'}</span>
                                                <input type="file" onChange={handleReplaceFile} style={{ display: 'none' }} disabled={uploadingFile || saving} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="redesign-form-group">
                                        <label className="redesign-label">Mô tả</label>
                                        <textarea 
                                            className="redesign-textarea"
                                            style={{ minHeight: '120px' }}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Nhập mô tả..."
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                {/* Large Preview Section */}
                                {externalUrl && (
                                    <div style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(245,237,220,0.18)', padding: '1rem', textAlign: 'center', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
                                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'rgba(245,237,220,0.6)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>PREVIEW HÌNH ẢNH / MEDIA</span>
                                            <button 
                                                type="button"
                                                onClick={() => setLightboxImage({ url: externalUrl, title: name || asset.asset_id })}
                                                style={{ background: 'none', border: 'none', color: 'var(--color-terracotta)', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontFamily: 'var(--font-mono)' }}
                                            >
                                                <ZoomIn size={13} /> Phóng to
                                            </button>
                                        </div>

                                        {(asset.type === 'video' || asset.category === 'video' || category === 'PV' || externalUrl.match(/\.(mp4|webm|ogg)$/i)) ? (
                                            <video src={getAssetUrl(externalUrl)} controls style={{ maxHeight: '480px', maxWidth: '100%', borderRadius: '4px', border: '1px solid rgba(245,237,220,0.15)' }} />
                                        ) : (
                                            <img 
                                                src={getAssetUrl(externalUrl)} 
                                                alt="" 
                                                onClick={() => setLightboxImage({ url: externalUrl, title: name || asset.asset_id })}
                                                title="Bấm để xem ảnh kích thước gốc"
                                                style={{ maxHeight: '520px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.7)', border: '1px solid rgba(245,237,220,0.15)', cursor: 'zoom-in' }} 
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'start' }}>
                                    <div className="redesign-form-group">
                                        <label className="redesign-label">Tên / Nhãn hiển thị</label>
                                        <input 
                                            className="redesign-input"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nhập tên..."
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="redesign-form-group">
                                        <label className="redesign-label">Mô tả</label>
                                        <textarea 
                                            className="redesign-textarea"
                                            style={{ minHeight: '42px', height: '42px' }}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Nhập mô tả..."
                                            disabled={saving}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(245,237,220,0.15)', paddingTop: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <label className="redesign-label" style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700 }}>
                                            Danh sách biểu cảm (Expressions - {expressions.length})
                                        </label>
                                        <button className="redesign-btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={handleAddExpression} disabled={saving}>
                                            <Plus size={14} /> Thêm biểu cảm
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>Đang tải danh sách biểu cảm...</div>
                                    ) : (
                                        /* Compact Grid Layout for Character Expressions */
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', maxHeight: '460px', overflowY: 'auto' }}>
                                            {expressions.map(expr => (
                                                <div key={expr.id} style={{ backgroundColor: '#121212', padding: '0.75rem', border: '1px solid rgba(245,237,220,0.18)', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <input 
                                                            className="redesign-input"
                                                            style={{ width: '180px', fontSize: '0.8rem', fontWeight: 600 }}
                                                            placeholder="Tên biểu cảm"
                                                            value={expr.name}
                                                            onChange={(e) => handleExprChange(expr.id, 'name', e.target.value)}
                                                            disabled={saving}
                                                        />
                                                        <button 
                                                            className="redesign-btn danger"
                                                            style={{ padding: '0.2rem 0.4rem' }}
                                                            onClick={() => handleRemoveExpression(expr)}
                                                            disabled={saving}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                                        {/* Avatar Upload & Click-to-Zoom */}
                                                        <div style={{ backgroundColor: '#080808', padding: '0.5rem', border: '1px dashed rgba(245,237,220,0.2)', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                                            <span style={{ fontSize: '0.65rem', color: 'rgba(245,237,220,0.6)', width: '100%', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>AVATAR</span>
                                                            {expr.avatar_url ? (
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                                                                    <div 
                                                                        style={{ position: 'relative', cursor: 'zoom-in', width: '100%', height: '120px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(245,237,220,0.25)', backgroundColor: '#050505' }}
                                                                        onClick={() => setLightboxImage({ url: expr.avatar_url, title: `Avatar: ${expr.name || 'Biểu cảm'}` })}
                                                                        title="Bấm để xem ảnh gốc"
                                                                    >
                                                                        <img src={getAssetUrl(expr.avatar_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }} className="zoom-hover">
                                                                            <ZoomIn size={18} />
                                                                        </div>
                                                                    </div>
                                                                    <label style={{ fontSize: '0.65rem', color: 'var(--color-terracotta)', cursor: 'pointer', backgroundColor: '#1A1A1A', padding: '0.2rem 0.4rem', border: '1px solid rgba(245,237,220,0.2)', borderRadius: '2px', width: '100%', textAlign: 'center' }}>
                                                                        Đổi Avatar
                                                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleExprFileUpload(expr.id, 'avatar_url', e.target.files[0])} />
                                                                    </label>
                                                                </div>
                                                            ) : (
                                                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '150px', cursor: 'pointer', backgroundColor: '#141414', fontSize: '0.7rem', color: '#F5EDDC', borderRadius: '3px', border: '1px solid rgba(245,237,220,0.1)', textAlign: 'center' }}>
                                                                    {uploadingExprFields[`${expr.id}-avatar_url`] ? 'Đang tải...' : 'Chọn Avatar'}
                                                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleExprFileUpload(expr.id, 'avatar_url', e.target.files[0])} />
                                                                </label>
                                                            )}
                                                        </div>

                                                        {/* Full Body Upload & Click-to-Zoom */}
                                                        <div style={{ backgroundColor: '#080808', padding: '0.5rem', border: '1px dashed rgba(245,237,220,0.2)', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                                            <span style={{ fontSize: '0.65rem', color: 'rgba(245,237,220,0.6)', width: '100%', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>FULL BODY</span>
                                                            {expr.full_url ? (
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                                                                    <div 
                                                                        style={{ position: 'relative', cursor: 'zoom-in', height: '120px', width: '100%', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(245,237,220,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505' }}
                                                                        onClick={() => setLightboxImage({ url: expr.full_url, title: `Full Body: ${expr.name || 'Biểu cảm'}` })}
                                                                        title="Bấm để xem ảnh gốc"
                                                                    >
                                                                        <img src={getAssetUrl(expr.full_url)} alt="" style={{ height: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }} className="zoom-hover">
                                                                            <ZoomIn size={18} />
                                                                        </div>
                                                                    </div>
                                                                    <label style={{ fontSize: '0.65rem', color: 'var(--color-terracotta)', cursor: 'pointer', backgroundColor: '#1A1A1A', padding: '0.2rem 0.4rem', border: '1px solid rgba(245,237,220,0.2)', borderRadius: '2px', width: '100%', textAlign: 'center' }}>
                                                                        Đổi Full Body
                                                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleExprFileUpload(expr.id, 'full_url', e.target.files[0])} />
                                                                    </label>
                                                                </div>
                                                            ) : (
                                                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '150px', cursor: 'pointer', backgroundColor: '#141414', fontSize: '0.7rem', color: '#F5EDDC', borderRadius: '3px', border: '1px solid rgba(245,237,220,0.1)', textAlign: 'center' }}>
                                                                    {uploadingExprFields[`${expr.id}-full_url`] ? 'Đang tải...' : 'Chọn Full Body'}
                                                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleExprFileUpload(expr.id, 'full_url', e.target.files[0])} />
                                                                </label>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="redesign-modal-footer">
                        <button className="redesign-btn" onClick={onClose} disabled={saving || uploadingFile}>Hủy</button>
                        <button className="redesign-btn primary" onClick={handleSave} disabled={saving || uploadingFile}>
                            {saving ? <Loader className="spinning" size={14} /> : <Save size={14} />}
                            <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal Popup for Full-Size Image Preview */}
            {lightboxImage && (
                <div 
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 5, 5, 0.92)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', animation: 'fadeIn 0.15s ease-out' }}
                    onClick={() => setLightboxImage(null)}
                >
                    <div style={{ position: 'absolute', top: '1.2rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 3001 }}>
                        <a 
                            href={getAssetUrl(lightboxImage.url)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: '#F5EDDC', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', textDecoration: 'none', padding: '0.3rem 0.6rem', backgroundColor: '#1F1F1F', border: '1px solid rgba(245,237,220,0.3)', borderRadius: '3px' }}
                        >
                            Mở liên kết gốc ↗
                        </a>
                        <button 
                            onClick={() => setLightboxImage(null)}
                            style={{ background: '#1F1F1F', border: '1px solid rgba(245,237,220,0.3)', color: '#F5EDDC', width: '36px', height: '36px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ color: '#F5EDDC', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {lightboxImage.title || 'XEM ẢNH NGUYÊN BẢN'}
                    </div>

                    <div style={{ maxWidth: '92vw', maxHeight: '82vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={getAssetUrl(lightboxImage.url)} 
                            alt="" 
                            style={{ maxWidth: '100%', maxHeight: '82vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 16px 48px rgba(0,0,0,0.9)', border: '1px solid rgba(245,237,220,0.2)' }} 
                        />
                    </div>
                </div>
            )}
        </>
    );
}
