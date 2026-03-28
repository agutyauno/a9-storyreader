import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import styles from './NotificationToast.module.css';

/**
 * A notification toast component that displays a message with an icon.
 * Props:
 *   message — string
 *   type — 'success' | 'error' | 'info'
 *   onClose() — callback to clear the notification
 *   duration — ms to stay visible (default 3000)
 */
export default function NotificationToast({ message, type = 'success', onClose, duration = 3000 }) {
    useEffect(() => {
        if (!message) return;
        
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        
        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    const Icon = type === 'success' ? CheckCircle : 
                 type === 'error' ? AlertCircle : Info;

    return (
        <div className={styles.toastContainer}>
            <div className={`${styles.toast} ${styles[type]}`}>
                <div className={styles.icon}>
                    <Icon size={18} />
                </div>
                <div className={styles.content}>
                    <div className={styles.message}>{message}</div>
                </div>
            </div>
        </div>
    );
}
