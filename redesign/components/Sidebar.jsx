import React from 'react'

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
            className={`retro-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="sidebar-title-block retro-stripes">
                <span className="sidebar-title technical-text">{title}</span>
            </div>

            {loading ? (
                <div className="retro-loading">
                    <div className="loading-bar-container">
                        <div className="loading-bar"></div>
                    </div>
                    <span className="technical-text">POLLING_DATA...</span>
                </div>
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
