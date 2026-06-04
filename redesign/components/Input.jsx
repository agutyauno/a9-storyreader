import React from 'react'

export default function Input({
    label,
    code,
    error,
    disabled = false,
    className = '',
    id,
    ...props
}) {
    const inputId = id || `input_${Math.random().toString(36).substring(2, 9)}`

    return (
        <div className={`input-wrapper ${disabled ? 'disabled' : ''} ${error ? 'has-error' : ''} ${className}`}>
            {(label || code) && (
                <div className="input-header">
                    {label && <label htmlFor={inputId} className="input-label technical-text">{label}</label>}
                    {code && <span className="input-code technical-text">{code}</span>}
                </div>
            )}
            <input
                id={inputId}
                disabled={disabled}
                className="input-field"
                {...props}
            />
            {error && <span className="input-error-msg technical-text">{error}</span>}
        </div>
    )
}
