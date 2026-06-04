import React from 'react'

export default function Tabs({ tabs = [], activeTabId, onChange, className = '' }) {
    return (
        <div className={`tabs-container ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTabId === tab.id
                return (
                    <button
                        key={tab.id}
                        className={`tab-btn technical-text ${isActive ? 'active' : ''}`}
                        onClick={() => onChange && onChange(tab.id)}
                        type="button"
                    >
                        {tab.label || tab.id}
                    </button>
                )
            })}
        </div>
    )
}
