import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import { uploadFileToGithub, getFolderPath } from '../../../../../src/services/githubService';
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
    const [category, setCategory] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [error, setError] = useState(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: () => {} });

    useEffect(() => {
        if (!isOpen || !asset) return;
        setName(asset.name || '');
        setCategory(asset.category || asset.type || '');
        setDescription(asset.description || '');
        setExternalUrl(asset.url || '');
        setError(null);
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
        <div className="redesign-modal-overlay" onClick={onClose}>
            <div className="redesign-modal-card large" onClick={(e) => e.stopPropagation()}>
                <div className="redesign-modal-header">
                    <div className="redesign-modal-title">
                        <ImageIcon size={20} />
                        <span>CHI TIẾT: {asset.name || asset.title || asset.asset_id}</span>
                    </div>
                    <button className="redesign-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="redesign-modal-body">
                    {error && (
                        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(244,67,54,0.15)', border: '1px solid #F44336', color: '#FF5252', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}

                    <div className="redesign-form-group">
                        <label className="redesign-label">Tên / Nhãn</label>
                        <input 
                            className="redesign-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập tên..."
                        />
                    </div>

                    {!isCharacter && (
                        <div className="redesign-form-group">
                            <label className="redesign-label">URL Asset</label>
                            <input 
                                className="redesign-input"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                placeholder="URL hoặc đường dẫn file..."
                            />
                        </div>
                    )}

                    <div className="redesign-form-group">
                        <label className="redesign-label">Mô tả</label>
                        <textarea 
                            className="redesign-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Nhập mô tả..."
                        />
                    </div>

                    {isCharacter && (
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <label className="redesign-label" style={{ margin: 0 }}>Danh sách biểu cảm (Expressions)</label>
                                <button className="redesign-btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={handleAddExpression}>
                                    <Plus size={14} /> Thêm biểu cảm
                                </button>
                            </div>

                            {loading ? (
                                <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6 }}>Đang tải biểu cảm...</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                                    {expressions.map(expr => (
                                        <div key={expr.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: '#141414', padding: '0.5rem', border: '1px solid rgba(245,237,220,0.15)' }}>
                                            <input 
                                                className="redesign-input"
                                                style={{ width: '140px' }}
                                                placeholder="Tên biểu cảm"
                                                value={expr.name}
                                                onChange={(e) => handleExprChange(expr.id, 'name', e.target.value)}
                                            />
                                            <input 
                                                className="redesign-input"
                                                style={{ flex: 1 }}
                                                placeholder="Avatar URL"
                                                value={expr.avatar_url || ''}
                                                onChange={(e) => handleExprChange(expr.id, 'avatar_url', e.target.value)}
                                            />
                                            <input 
                                                className="redesign-input"
                                                style={{ flex: 1 }}
                                                placeholder="Full Body URL"
                                                value={expr.full_url || ''}
                                                onChange={(e) => handleExprChange(expr.id, 'full_url', e.target.value)}
                                            />
                                            <button 
                                                className="redesign-btn danger"
                                                style={{ padding: '0.4rem' }}
                                                onClick={() => handleRemoveExpression(expr)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="redesign-modal-footer">
                    <button className="redesign-btn" onClick={onClose} disabled={saving}>Đóng</button>
                    <button className="redesign-btn primary" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader className="spinning" size={16} /> : <Save size={16} />}
                        <span>{saving ? 'Đang lưu...' : 'Lưu cập nhật'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
