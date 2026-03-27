import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isExpired = queryParams.get('expired') === 'true';

  // Redirect to the page they were trying to access, or to /editor
  const from = location.state?.from?.pathname || '/editor';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.logoIcon}>
            <LogIn size={32} />
          </div>
          <h1>Editor Login</h1>
          <p>Truy cập vào trang quản lý nội dung</p>
        </div>

        {isExpired && (
          <div className={styles.errorAlert} style={{ background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b' }}>
            <AlertCircle size={20} />
            <span>Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.</span>
          </div>
        )}

        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={20} />
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Mật khẩu</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={20} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={styles.loginButton} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className={styles.spinner} size={20} />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <p>Đây là khu vực hạn chế. Vui lòng liên hệ quản trị viên nếu bạn không có quyền truy cập.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
