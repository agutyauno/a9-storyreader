import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [dynamicTitle, setDynamicTitle] = useState('');
  const location = useLocation();
  const { user, logout } = useAuth();

  const isEventPage = location.pathname.startsWith('/event/');

  // Reset dynamic title when route changes
  useEffect(() => {
    setDynamicTitle('');
    setIsScrolled(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleToggleEventSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggleEventSidebar'));
  };

  useEffect(() => {
    const handleScroll = () => {
      // Only do basic scroll shrink if no page is controlling the header
      if (!dynamicTitle) {
        setIsScrolled(window.scrollY > 50);
      }
    };

    const handleSticky = (e) => {
      const { title, isActive } = e.detail;
      setDynamicTitle(title || '');
      setIsScrolled(isActive);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('headerStickyChange', handleSticky);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('headerStickyChange', handleSticky);
    };
  }, [dynamicTitle]);

  // Hide header entirely on Story pages (StoryPage has its own header)
  if (location.pathname.startsWith('/story/')) {
    return null;
  }

  return (
    <header className={isScrolled ? 'scrolled' : ''}>
      <div className="header-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Link to="/" className="logo">
            <h1 id="web_name">
              {isScrolled && dynamicTitle ? dynamicTitle : 'Civilight Eterna Database'}
            </h1>
          </Link>

          {/* Event sidebar toggle — always visible on event pages */}
          {isEventPage && (
            <button
              onClick={handleToggleEventSidebar}
              className="header-sidebar-toggle"
              title="Danh sách sự kiện"
              style={{
                position: 'absolute',
                right: '1rem',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-accent)',
                borderRadius: 'var(--radius-base)',
                padding: '4px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 600,
                transition: 'all 0.2s',
                minWidth: '36px',
                height: '32px'
              }}
            >
              ☰
            </button>
          )}

          {user && location.pathname.startsWith('/editor') && (
            <button 
              onClick={handleLogout}
              className="logout-button"
              title="Đăng xuất"
              style={{
                position: 'absolute',
                right: '1rem',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-tertiary)',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
        {!isScrolled && (
          <p className="subtitle">Khám phá cốt truyện Arknights</p>
        )}
      </div>
    </header>
  );
}
