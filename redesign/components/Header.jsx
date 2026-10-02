import React, { useState, useEffect } from 'react'
import { ChevronsLeft, ChevronsRight, Settings, Users, BookOpen, BookmarkCheck } from 'lucide-react'
import { getAssetUrl } from '../../src/utils/assetUtils'
import { getLastRead } from '../../src/utils/readingHistory'
import SettingsModal from './SettingsModal'

export default function Header({ sidebarOpen, setSidebarOpen, BASE_URL = '/' }) {
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [lastRead, setLastRead] = useState(() => getLastRead())

    useEffect(() => {
        const updateLastRead = () => {
            setLastRead(getLastRead())
        }
        window.addEventListener('cedReadingProgressUpdate', updateLastRead)
        window.addEventListener('storage', updateLastRead)
        return () => {
            window.removeEventListener('cedReadingProgressUpdate', updateLastRead)
            window.removeEventListener('storage', updateLastRead)
        }
    }, [])

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
                {lastRead && lastRead.storyId && (
                    <>
                        <a
                            href={`#/story/${lastRead.storyId}`}
                            className="header-nav-item resume-reading-nav"
                            title={`Tiếp tục đọc: ${lastRead.eventName ? `${lastRead.eventName} // ` : ''}${lastRead.storyName} (${lastRead.scrollPercent || 0}%)`}
                        >
                            <BookmarkCheck size={16} className="header-nav-icon" style={{ color: 'var(--color-cream)' }} />
                            <span className="header-nav-text" style={{ color: 'var(--color-cream)' }}>
                                TIẾP TỤC ĐỌC
                            </span>
                        </a>
                        <div className="header-nav-separator"></div>
                    </>
                )}

                <a href="#/operator" className="header-nav-item" title="Operator">
                    <Users size={16} className="header-nav-icon" />
                    <span className="header-nav-text">OPERATOR</span>
                </a>
                {/* <div className="header-nav-separator"></div>
                <a href="#/is-story" className="header-nav-item" title="IS Story">
                    <BookOpen size={16} className="header-nav-icon" />
                    <span className="header-nav-text">IS STORY</span>
                </a> */}
                <div className="header-nav-separator"></div>

                <button
                    onClick={() => setSettingsOpen(true)}
                    className="header-nav-item settings-trigger-btn"
                    title="Cài đặt hệ thống"
                >
                    <Settings size={15} className="header-nav-icon" />
                    <span className="header-nav-text">SETTING</span>
                </button>
            </nav>

            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </header>
    )
}
