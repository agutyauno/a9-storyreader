import React from 'react'

export default function Loading({ text = 'RESOLVING_DATA_SEQUENCE...', showBar = true }) {
    return (
        <div className="loading-container">
            {showBar && (
                <div className="loading-bar-container">
                    <div className="loading-bar"></div>
                </div>
            )}
            <span className="technical-text">{text}</span>
        </div>
    )
}
