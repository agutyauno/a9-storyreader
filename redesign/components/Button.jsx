import React from 'react'

export default function Button({
    variant = 'primary',
    disabled = false,
    icon,
    children,
    onClick,
    className = '',
    ...props
}) {
    return (
        <button
            className={`btn-component btn-${variant} ${disabled ? 'disabled' : ''} ${className}`}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {icon && <span className="btn-icon">{icon}</span>}
            {children && <span className="btn-text">{children}</span>}
        </button>
    )
}
