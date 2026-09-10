import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, Save, X } from 'lucide-react';
import '../editorComponents.css';

const UnsavedChangesModal = ({ 
    isOpen, 
    onConfirm, 
    onCancel, 
    onSaveAndConfirm, 
    saving = false,
    title = 'CÓ THAY ĐỔI CHƯA LƯU',
    message = 'Bạn có thay đổi chưa lưu. Các thay đổi của bạn sẽ bị mất nếu không lưu ngay bây giờ.',
    confirmText = 'Xác nhận rời trang',
    saveText = 'Lưu và xác nhận',
    cancelText = 'Quay lại'
}) => {
    React.useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !saving) {
                e.preventDefault();
                onCancel?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel, saving]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="redesign-modal-overlay" onClick={onCancel}>
            <div className="redesign-modal-card unsaved-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="redesign-modal-header unsaved-modal-header">
                    <div className="redesign-modal-title">
                        <div className="unsaved-title-icon-badge">
                            <AlertTriangle size={17} className="text-terracotta" />
                        </div>
                        <span>{title}</span>
                    </div>
                    <button className="redesign-modal-close" onClick={onCancel} title="Đóng (Escape)">
                        <X size={16} />
                    </button>
                </div>
                
                <div className="redesign-modal-body unsaved-modal-body">
                    <div className="unsaved-simple-message-wrap">
                        <AlertTriangle size={20} className="text-terracotta" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p className="unsaved-simple-message">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="redesign-modal-footer unsaved-modal-footer">
                    <button className="redesign-btn" onClick={onCancel} disabled={saving}>
                        {cancelText}
                    </button>
                    <div className="unsaved-footer-actions">
                        <button className="redesign-btn danger" onClick={onConfirm} disabled={saving}>
                            {confirmText}
                        </button>
                        <button className="redesign-btn primary" onClick={onSaveAndConfirm} disabled={saving}>
                            <Save size={15} />
                            {saving ? 'Đang lưu...' : saveText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UnsavedChangesModal;
