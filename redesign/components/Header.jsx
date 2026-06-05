import React, { useState } from 'react'
import { ChevronsLeft, ChevronsRight, Settings } from 'lucide-react'
import { getAssetUrl } from '../../src/utils/assetUtils'
import SettingsModal from './SettingsModal'

export default function Header({ sidebarOpen, setSidebarOpen, BASE_URL = '/' }) {
    const [settingsOpen, setSettingsOpen] = useState(false)

    return (
        <header className="app-header">
            <div className="header-left">
                {setSidebarOpen && (
                    <button
                        className="sidebar-toggle-btn"
                        onClick={(e) => {
                            e.stopPropagation()
                            setSidebarOpen(!sidebarOpen)
                        }}
                        title={sidebarOpen ? 'Đóng thanh bên' : 'Mở thanh bên'}
                        aria-label="Toggle Sidebar"
                    >
                        {sidebarOpen ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />}
                    </button>
                )}

                <a href="#/" className="header-logo" title="Về trang chủ">
                    <img
                        src={getAssetUrl('/assets/images/logo/ced_white.png')}
                        alt="Rhodes Island Logo"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                        }}
                    />
                    <span className="technical-text">CIVILIGHT_ETERNA_DATABASE</span>
                </a>
            </div>

            <nav className="header-nav">
                <a href="#/operator" className="header-nav-item">OPERATOR</a>
                <div className="header-nav-separator"></div>
                <a href="#/is-story" className="header-nav-item">IS STORY</a>
                <div className="header-nav-separator"></div>
                <a href={`${BASE_URL}#`} className="header-nav-item">MAIN_APP</a>
                <div className="header-nav-separator"></div>
                <button 
                    onClick={() => setSettingsOpen(true)} 
                    className="header-nav-item settings-trigger-btn"
                    title="Cài đặt hệ thống"
                >
                    <Settings size={15} />
                    <span>SETTING</span>
                </button>
            </nav>

            <SettingsModal 
                isOpen={settingsOpen} 
                onClose={() => setSettingsOpen(false)} 
            />
        </header>
    )
}
