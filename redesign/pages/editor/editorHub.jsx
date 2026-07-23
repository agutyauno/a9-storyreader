import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../src/contexts/AuthContext'
import { getAssetUrl } from '../../../src/utils/assetUtils'
import { BookOpen, Users, Lock, LogOut } from 'lucide-react'
import './editorHub.css'

export default function EditorHubPage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/login')
        } catch (err) {
            console.error('Logout failed:', err)
        }
    }

    return (
        <div className="hub-container">
            <div className="login-grid-overlay" />

            <div className="hub-content page-fade-in">
                {/* Header Section */}
                <header className="hub-header">
                    <div className="hub-logo">
                        <img
                            src={getAssetUrl('/assets/images/logo/ced_white.png')}
                            alt="Logo"
                            className="hub-logo-img"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <div className="hub-logo-text">
                            <span className="technical-text logo-title">CIVILIGHT ETERNA DATABASE</span>
                            <span className="technical-text logo-subtitle">SYSTEM.ADMIN_HUB</span>
                        </div>
                    </div>

                    <div className="hub-user-panel">
                        <span className="hub-user-email technical-text">
                            Tài khoản: {user?.email || 'UNKNOWN'}
                        </span>
                        <button onClick={handleLogout} className="hub-logout-btn" title="Đăng xuất">
                            <LogOut size={16} />
                            <span className="technical-text">Đăng xuất</span>
                        </button>
                    </div>
                </header>

                {/* Subtitle / Status */}
                <div className="hub-status-bar">
                    <span className="technical-text">STATUS: ACTIVE // CONNECTION_SECURE</span>
                    <span className="technical-text">SYS.TIME // {new Date().toISOString().slice(0, 10)}</span>
                </div>

                {/* Main Cards Grid */}
                <div className="hub-cards-grid">
                    {/* Story Editor Card */}
                    <div className="hub-card" onClick={() => navigate('/editor/story')}>
                        <div className="hub-card-icon-wrap">
                            <BookOpen size={36} />
                        </div>
                        <div className="hub-card-body">
                            <div className="hub-card-meta technical-text">MODULE_01 // SEC.STORY</div>
                            <h2 className="hub-card-title">Cốt Truyện Sự Kiện</h2>
                            <p className="hub-card-desc">
                                Biên soạn kịch bản phân cảnh, căn chỉnh hội thoại, cấu hình âm nhạc (BGM/SFX) và hình nền minh họa cho các chương cốt truyện.
                            </p>
                        </div>
                    </div>

                    {/* Operator Editor Card */}
                    <div className="hub-card" onClick={() => navigate('/editor/operator')}>
                        <div className="hub-card-icon-wrap">
                            <Users size={36} />
                        </div>
                        <div className="hub-card-body">
                            <div className="hub-card-meta technical-text">MODULE_02 // SEC.OPERATOR</div>
                            <h2 className="hub-card-title">Hồ Sơ Cán Viên</h2>
                            <p className="hub-card-desc">
                                Thiết lập lý lịch chi tiết, lưu trữ biểu cảm skin, đồng bộ tệp thoại lồng tiếng đa ngôn ngữ và biên soạn kịch bản kí sự cán viên.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="hub-footer">
                    <a href="#/" className="hub-back-btn technical-text">
                        &lt; Quay về trang chủ
                    </a>
                </div>
            </div>
        </div>
    )
}
