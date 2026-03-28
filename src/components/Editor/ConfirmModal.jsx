import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import styles from './ConfirmModal.module.css';

/**
 * A beautiful, reusable confirmation modal.
 * @param {boolean} isOpen
 * @param {string} title
 * @param {string} message
 * @param {string} confirmText
 * @param {string} cancelText
 * @param {string} type - 'danger' | 'info'
 * @param {function} onConfirm
 * @param {function} onClose
 */
export default function ConfirmModal({ 
    isOpen, 
    title, 
    message, 
    confirmText = 'Xác nhận', 
    cancelText = 'Huỷ', 
    type = 'danger', 
    onConfirm, 
    onClose 
}) {
    if (!isOpen) return null;

    const isDanger = type === 'danger';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header Decoration */}
                <div className={`${styles.headerDecor} ${isDanger ? styles.dangerDecor : styles.infoDecor}`}>
                    {isDanger ? <AlertTriangle size={32} /> : <Trash2 size={32} />}
                </div>

                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={18} />
                </button>

                <div className={styles.content}>
                    <h3 className={styles.title}>{title}</h3>
                    <p className={styles.message}>{message}</p>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        {cancelText}
                    </button>
                    <button 
                        className={`${styles.confirmBtn} ${isDanger ? styles.dangerBtn : styles.infoBtn}`} 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
