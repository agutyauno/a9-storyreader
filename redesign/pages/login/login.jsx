import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../src/contexts/AuthContext'
import { KeyRound, Mail, AlertTriangle, ArrowRight } from 'lucide-react'
import { getAssetUrl } from '../../../src/utils/assetUtils'
import './login.css'

export default function RedesignLoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Redirect target after login
    const from = location.state?.from?.pathname || '/editor'

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email.trim() || !password.trim()) {
            setError('Vui lòng điền đầy đủ email và mật khẩu.')
            return
        }

        try {
            setError(null)
            setLoading(true)
            await login(email.trim(), password.trim())
            navigate(from, { replace: true })
        } catch (err) {
            console.error('Login failed:', err)
            setError(err.message || 'Sai tên đăng nhập hoặc mật khẩu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page-container">
            {/* Retro grid background overlay */}
            <div className="login-grid-overlay" />

            <div className="login-card panel-stripes">
                {/* Visual Header bar representing typical technical system logs */}
                <div className="login-card-header technical-text">
                    <span>SYS.AUTH_GATEWAY // PORT_80</span>
                    <span className="live-dot" />
                </div>

                <div className="login-card-body">
                    {/* Brand/Database Logo */}
                    <div className="login-logo-container">
                        <img
                            src={getAssetUrl('/assets/images/logo/ced_white.png')}
                            alt="Civilight Eterna Database Logo"
                            className="login-logo-img"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <h1 className="login-title">CIVILIGHT ETERNA</h1>
                        <span className="login-subtitle technical-text">DATABASE_CREATOR_PLATFORM</span>
                    </div>

                    {error && (
                        <div className="login-error-box">
                            <AlertTriangle size={16} className="error-icon" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="login-input-group">
                            <label className="login-label technical-text" htmlFor="email-input">
                                USER.EMAIL
                            </label>
                            <div className="login-input-wrapper">
                                <Mail size={16} className="input-icon" />
                                <input
                                    id="email-input"
                                    type="email"
                                    placeholder="doctor@rhodesisland.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="login-input"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="login-input-group">
                            <label className="login-label technical-text" htmlFor="password-input">
                                USER.PASSWORD
                            </label>
                            <div className="login-input-wrapper">
                                <KeyRound size={16} className="input-icon" />
                                <input
                                    id="password-input"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="login-input"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="login-submit-btn technical-text"
                            disabled={loading}
                        >
                            <span>{loading ? 'CONNECTING...' : 'INITIATE_CONNECTION'}</span>
                            {!loading && <ArrowRight size={16} className="submit-arrow" />}
                        </button>
                    </form>

                    <div className="login-footer-info technical-text">
                        CONFIDENTIAL // AUTHORIZED ACCESS ONLY
                    </div>
                </div>
            </div>
        </div>
    )
}
