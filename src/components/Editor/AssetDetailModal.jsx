import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader, Save } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
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
export default function AssetDetailModal({ isOpen, asset, kind, onClose, onUpdated }) {
    const [name, setName] = useState('');
    const [expressions, setExpressions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen || !asset) return;
        setName(asset.name || '');
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
            if (isCharacter) {
                const charId = asset.character_id || asset.asset_id;
                await SupabaseAPI.updateCharacter(charId, { name: name.trim() });
            } else {
                await SupabaseAPI.updateAsset(asset.asset_id, { name: name.trim() });
            }
            onUpdated?.();
        } catch (err) {
            alert(`Lưu thất bại: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ─── Expression CRUD ────────────────────────────────────────────────────────
    const handleAddExpression = async () => {
        const exprName = prompt('Tên expression mới (e.g. happy, angry):');
        if (!exprName?.trim()) return;
        try {
            const charId = asset.character_id || asset.asset_id;
            await SupabaseAPI.createExpression({
                character_id: charId,
                name: exprName.trim(),
                avatar_url: '',
                full_url: '',
            });
            loadExpressions();
        } catch (err) {
            alert(`Tạo expression thất bại: ${err.message}`);
        }
    };

    const handleDeleteExpression = async (expr) => {
        if (!window.confirm(`Xoá expression "${expr.name}"?`)) return;
        try {
            await SupabaseAPI.deleteExpression(expr.id);
            setExpressions(prev => prev.filter(e => e.id !== expr.id));
        } catch (err) {
            alert(`Xoá thất bại: ${err.message}`);
        }
    };

    const handleExpressionChange = (exprId, field, value) => {
        setExpressions(prev => prev.map(e =>
            e.id === exprId ? { ...e, [field]: value } : e
        ));
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
                                <input value={isCharacter ? 'character' : (asset.category || asset.type || '')} readOnly />
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
                        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                            {saving ? <Loader size={14} className={styles.spinner} /> : <Save size={14} />}
                            {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
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
                                                <span className={styles.expName}>{expr.name}</span>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDeleteExpression(expr)}
                                                    title="Xoá"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className={styles.expGrid}>
                                                <div className={styles.expInputGroup}>
                                                    <label>Avatar URL</label>
                                                    <input
                                                        value={expr.avatar_url || ''}
                                                        onChange={e => handleExpressionChange(expr.id, 'avatar_url', e.target.value)}
                                                        placeholder="Avatar URL"
                                                    />
                                                </div>
                                                <div className={styles.expInputGroup}>
                                                    <label>Full Image URL</label>
                                                    <input
                                                        value={expr.full_url || ''}
                                                        onChange={e => handleExpressionChange(expr.id, 'full_url', e.target.value)}
                                                        placeholder="Full image URL"
                                                    />
                                                </div>
                                            </div>
                                            {(expr.avatar_url || expr.full_url) && (
                                                <div className={styles.expPreview}>
                                                    {expr.avatar_url && <img className={styles.miniAvatar} src={expr.avatar_url} alt="avatar" />}
                                                    {expr.full_url && <img className={styles.miniFull} src={expr.full_url} alt="full" />}
                                                </div>
                                            )}
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
