import React from 'react'

export default function Panel({
    title,
    subtitle,
    stripes = false,
    actions,
    children,
    className = ''
}) {
    return (
        <div className={`panel-component ${className}`}>
            {(title || subtitle || actions) && (
                <div className={`panel-header ${stripes ? 'panel-stripes' : ''}`}>
                    <div className="panel-header-title-wrapper">
                        {title && <h4 className="panel-title technical-text">{title}</h4>}
                        {subtitle && <span className="panel-subtitle technical-text">{subtitle}</span>}
                    </div>
                    {actions && <div className="panel-header-actions">{actions}</div>}
                </div>
            )}
            <div className="panel-body">
                {children}
            </div>
        </div>
    )
}
