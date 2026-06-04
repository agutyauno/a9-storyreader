import React from 'react'

export default function PageHero({
    title,
    subtitle,
    code = 'SYS.NODE_ID',
    description,
    className = ''
}) {
    return (
        <div className={`page-hero-component ${className}`}>
            <div className="page-hero-meta technical-text">
                {code}
            </div>
            {subtitle && <span className="page-hero-subtitle technical-text">{subtitle}</span>}
            <h2 className="page-hero-title">{title}</h2>
            {description && <p className="page-hero-desc">{description}</p>}
        </div>
    )
}
