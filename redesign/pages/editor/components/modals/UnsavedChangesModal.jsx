import React from 'react';
import ReactDOM from 'react-dom';
import { AlertCircle, Save, X } from 'lucide-react';
import '../editorComponents.css';

const UnsavedChangesModal = ({ isOpen, onConfirm, onCancel, onSaveAndConfirm, saving = false }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="redesign-modal-overlay" onClick={onCancel}>
            <div className="redesign-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="redesign-modal-header">
                    <div className="redesign-modal-title">
                        <AlertCircle size={20} className="text-terracotta" />
                        <span>CÓ CHỈNH SỬA CHƯA LƯU</span>
                    </div>
                    <button className="redesign-modal-close" onClick={onCancel}>
                        <X size={18} />
                    </button>
                </div>
                
                <div className="redesign-modal-body">
                    <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(245, 237, 220, 0.9)' }}>
                        Bạn đang rời khỏi trang khi có chỉnh sửa chưa được lưu. Các thay đổi của bạn sẽ bị mất nếu không lưu ngay bây giờ.
                    </p>
                </div>

                <div className="redesign-modal-footer">
                    <button className="redesign-btn" onClick={onCancel} disabled={saving}>
                        Quay lại
                    </button>
                    <button className="redesign-btn danger" onClick={onConfirm} disabled={saving}>
                        Rời trang không lưu
                    </button>
                    <button className="redesign-btn primary" onClick={onSaveAndConfirm} disabled={saving}>
                        <Save size={15} />
                        {saving ? 'Đang lưu...' : 'Lưu & Xác nhận'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UnsavedChangesModal;
