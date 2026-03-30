import React from 'react';
import ReactDOM from 'react-dom';
import { AlertCircle, Save, X, LogOut } from 'lucide-react';
import styles from './UnsavedChangesModal.module.css';

const UnsavedChangesModal = ({ isOpen, onConfirm, onCancel, onSaveAndConfirm, saving = false }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <AlertCircle size={28} className={styles.warningIcon} />
                    </div>
                    <h2 className={styles.title}>Có chỉnh sửa chưa lưu</h2>
                    <button className={styles.closeBtn} onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className={styles.body}>
                    <p>Bạn đang rời khỏi trang khi có chỉnh sửa chưa được lưu. Các thay đổi của bạn sẽ bị mất nếu không lưu ngay bây giờ.</p>
                </div>

                <div className={styles.footer}>
                    <button className={styles.btnCancel} onClick={onCancel} disabled={saving}>
                        Quay lại
                    </button>
                    <div className={styles.rightButtons}>
                        <button className={styles.btnDiscard} onClick={onConfirm} disabled={saving}>
                            Xác nhận rời trang
                        </button>
                        <button className={styles.btnSave} onClick={onSaveAndConfirm} disabled={saving}>
                            {saving ? (
                                <span className={styles.spinner}></span>
                            ) : (
                                <Save size={18} />
                            )}
                            Lưu và xác nhận
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UnsavedChangesModal;
