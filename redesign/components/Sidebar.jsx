import React from 'react'
import Loading from './Loading'

export default function Sidebar({
    title = 'SYS.DIRECTORY',
    sidebarOpen,
    items = [],
    selectedItemId,
    onItemSelect,
    loading = false,
    renderItem,
    itemKey = 'id'
}) {
    const defaultRender = (item) => <span>{item.name || item.title || String(item)}</span>
    const customRender = renderItem || defaultRender

    return (
        <aside 
            className={`sidebar-container ${sidebarOpen ? 'open' : 'closed'}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="sidebar-title-block panel-stripes">
                <span className="sidebar-title technical-text">{title}</span>
            </div>

            {loading ? (
                <Loading text="POLLING_DATA..." />
            ) : (
                <ul className="region-list">
                    {items.map(item => {
                        const itemId = item[itemKey]
                        const isActive = selectedItemId === itemId
                        return (
                            <li key={itemId} className="region-list-item">
                                <button
                                    className={`region-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => onItemSelect && onItemSelect(item)}
                                >
                                    {customRender(item)}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}
        </aside>
    )
}
