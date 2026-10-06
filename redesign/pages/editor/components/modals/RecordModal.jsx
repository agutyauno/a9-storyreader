import React, { useState, useEffect } from 'react';
import { X, Loader, Plus, Save } from 'lucide-react';
import '../editorComponents.css';

export default function RecordModal({
    isOpen,
    isEditMode = false,
    targetOp,
    initialData,
    onClose,
    onSubmit
}) {
    const [recordId, setRecordId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [displayOrder, setDisplayOrder] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            setRecordId(initialData.record_id || '');
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setDisplayOrder(initialData.display_order ?? '');
        } else {
            setRecordId(targetOp ? `${targetOp.operator_id}_rec_${(targetOp.records?.length || 0) + 1}` : '');
            setName('');
            setDescription('');
            setDisplayOrder(targetOp ? (targetOp.records?.length || 0) + 1 : 1);
        }
        setError(null);
    }, [isOpen, initialData, targetOp]);

    if (!isOpen) return null;

    const opName = targetOp?.name || 'CÁN VIÊN';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !recordId.trim()) {
            setError('Vui lòng nhập Tên và Mã Ký Sự (ID)');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit({
                record_id: recordId.trim(),
                name: name.trim(),
                description: description.trim(),
                display_order: displayOrder !== '' ? parseInt(displayOrder) : 1
            });
            onClose();
        } catch (err) {
            console.error('Submit record failed:', err);
            setError(err.message || 'Thao tác thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="redesign-modal-overlay" onClick={!isSubmitting ? onClose : undefined}>
            <div className="redesign-modal-card small" onClick={(e) => e.stopPropagation()}>
                <div className="redesign-modal-header">
                    <div className="redesign-modal-title">
                        <span>{isEditMode ? 'CHỈNH SỬA' : 'TẠO MỚI'} KÝ SỰ // {opName}</span>
                    </div>
                    <button className="redesign-modal-close" onClick={onClose} disabled={isSubmitting}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="redesign-modal-body">
                        {error && (
                            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(244,67,54,0.15)', border: '1px solid #F44336', color: '#FF5252', fontSize: '0.85rem' }}>
                                {error}
                            </div>
                        )}

                        <div className="redesign-form-group">
                            <label className="redesign-label">MÃ KÝ SỰ (RECORD_ID) *</label>
                            <input
                                className="redesign-input"
                                value={recordId}
                                onChange={(e) => setRecordId(e.target.value)}
                                disabled={isEditMode}
                                placeholder="Nhập mã ký sự (ID)..."
                                required
                            />
                        </div>

                        <div className="redesign-form-group">
                            <label className="redesign-label">TÊN KÝ SỰ *</label>
                            <input
                                className="redesign-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nhập tên ký sự..."
                                required
                            />
                        </div>

                        <div className="redesign-form-group">
                            <label className="redesign-label">THỨ TỰ HIỂN THỊ (DISPLAY ORDER)</label>
                            <input
                                className="redesign-input"
                                type="number"
                                value={displayOrder}
                                onChange={(e) => setDisplayOrder(e.target.value)}
                                placeholder="0"
                            />
                        </div>

                        <div className="redesign-form-group">
                            <label className="redesign-label">MÔ TẢ</label>
                            <textarea
                                className="redesign-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Mô tả tóm tắt nội dung ký sự..."
                            />
                        </div>
                    </div>

                    <div className="redesign-modal-footer">
                        <button type="button" className="redesign-btn" onClick={onClose} disabled={isSubmitting}>
                            HỦY
                        </button>
                        <button type="submit" className="redesign-btn primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader className="spinning" size={16} />
                            ) : isEditMode ? (
                                <Save size={16} />
                            ) : (
                                <Plus size={16} />
                            )}
                            <span>{isSubmitting ? 'ĐANG XỬ LÝ...' : isEditMode ? 'LƯU CẬP NHẬT' : 'TẠO MỚI'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
