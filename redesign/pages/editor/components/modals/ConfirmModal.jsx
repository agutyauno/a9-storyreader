import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import '../editorComponents.css';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Xác nhận', danger = true }) {
    if (!isOpen) return null;

    return (
        <div className="redesign-modal-overlay" onClick={onCancel}>
            <div className="redesign-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="redesign-modal-header">
                    <div className="redesign-modal-title">
                        <AlertCircle size={20} className={danger ? 'text-crimson' : 'text-terracotta'} />
                        <span>{title || 'XÁC NHẬN'}</span>
                    </div>
                    <button className="redesign-modal-close" onClick={onCancel}>
                        <X size={18} />
                    </button>
                </div>

                <div className="redesign-modal-body">
                    <p style={{ margin: 0, lineHeight: 1.6 }}>{message}</p>
                </div>

                <div className="redesign-modal-footer">
                    <button className="redesign-btn" onClick={onCancel}>Hủy</button>
                    <button className={`redesign-btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
