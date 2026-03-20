import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [dynamicTitle, setDynamicTitle] = useState('');
  const location = useLocation();

  // Reset dynamic title when route changes
  useEffect(() => {
    setDynamicTitle('');
    setIsScrolled(false);
  }, [location.pathname]);

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
        <Link to="/" className="logo">
          <h1 id="web_name">
            {isScrolled && dynamicTitle ? dynamicTitle : 'Arknights Story Reader VN'}
          </h1>
        </Link>
        {!isScrolled && (
          <p className="subtitle">Khám phá cốt truyện Arknights</p>
        )}
      </div>
    </header>
  );
}
