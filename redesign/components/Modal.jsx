import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({
    isOpen = false,
    onClose,
    title = 'SYSTEM_PROMPT',
    children,
    footer,
    className = ''
}) {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className={`modal-container ${className}`} 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header panel-stripes">
                    <span className="modal-title technical-text">{title}</span>
                    {onClose && (
                        <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="modal-body">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
