import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SupabaseAPI } from '../services/supabaseApi';
import styles from '../styles/HomePage.module.css'; // Will be created or mapped to old style

function cx(classNames) {
  if (!classNames) return '';
  return String(classNames).split(' ').filter(Boolean).map(c => `${c} ${styles[c] || ''}`.trim()).join(' ').trim();
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('regions-tab');
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRegions() {
      try {
        const data = await SupabaseAPI.getRegions();
        setRegions(data);
      } catch (err) {
        console.error('Error loading regions:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    }
    loadRegions();
  }, []);

  return (
    <main>
      <div className={cx("container")}>
        <div id="info">
          <h2 className={cx("info-title")}>Chào mừng đến với Arknights Story Reader</h2>
          <p className={cx("info-description")}>
            Trang web này được tạo ra nhằm mục đích giúp người chơi Arknights có thể dễ dàng tiếp cận với cốt truyện của trò chơi. Trang cung cấp cho người chơi các đoạn hội thoại, cốt truyện và các thông tin liên quan đến các nhân vật
          </p>
        </div>
        
        {/* Tab buttons */}
        <div className={cx("tab-buttons")}>
          <button 
            className={cx(`tab-button ${activeTab === 'regions-tab' ? 'active' : ''}`)}
            onClick={() => setActiveTab('regions-tab')}
          >
            Cốt Truyện Khu Vực
          </button>
          <button 
            className={cx(`tab-button ${activeTab === 'operators-tab' ? 'active' : ''}`)}
            onClick={() => setActiveTab('operators-tab')}
          >
            Câu Truyện Operator
          </button>
        </div>

        {/* Regions Tab */}
        {activeTab === 'regions-tab' && (
          <div id="regions-tab" className={cx("tab-content active")}>
            <div id="region_selection-panel">
              <div className={cx("selection-list container")} id="regions-list">
                {loading && <div className={cx("loading-placeholder")}>Đang tải...</div>}
                {error && <p className={cx("error-message")}>{error}</p>}
                {!loading && !error && regions.length === 0 && (
                  <p className={cx("no-data")}>Chưa có dữ liệu khu vực.</p>
                )}
                {!loading && !error && regions.length > 0 && regions.map(region => (
                  <Link 
                    key={region.region_id} 
                    className={cx("selection-panel-item")} 
                    to={`/region/${region.region_id}`}
                  >
                    <img 
                      src={region.icon_url || '/assets/images/icon/default.png'} 
                      alt={region.name} 
                    />
                    <div className={cx("selection-content")}>
                      <p className={cx("region_name name")}>{region.name}</p>
                      <p className={cx("region_description description")}>{region.description || ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Operators Tab */}
        {activeTab === 'operators-tab' && (
          <div id="operators-tab" className={cx("tab-content active")}>
            <div id="operator_story_selection-panel">
              <div className={cx("selection-list")}>
                <p>Sẽ được cập nhật trong tương lai.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
