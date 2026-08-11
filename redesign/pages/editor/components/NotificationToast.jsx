import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './editorComponents.css';

export default function NotificationToast({ message, type = 'success', onClose, duration = 3000 }) {
    useEffect(() => {
        if (!message) return;
        
        const timer = setTimeout(() => {
            onClose?.();
        }, duration);
        
        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    const Icon = type === 'success' ? CheckCircle : 
                 type === 'error' ? AlertCircle : Info;

    return (
        <div className="redesign-toast-wrapper">
            <div className={`redesign-toast ${type}`}>
                <Icon size={18} />
                <div style={{ flex: 1 }}>{message}</div>
                <button 
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.7 }}
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
