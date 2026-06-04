import React from 'react'

export default function Footer() {
    return (
        <footer className="app-footer">
            <div className="redesign-container footer-grid">
                {/* Brand / Logo Section */}
                <div className="footer-brand-section">
                    <div className="footer-logo-block">
                        <span className="footer-logo-title technical-text">CIVILIGHT_ETERNA</span>
                        <span className="footer-logo-subtitle">DATABASE REDESIGN // V2.0</span>
                    </div>
                    <p className="footer-brand-desc">
                        Dự án phi lợi nhuận biên dịch cốt truyện Arknights sang Tiếng Việt. Giao diện được thiết kế theo phong cách Swiss Grid kết hợp Retro Futuristic.
                    </p>
                </div>

                {/* Links & Contact Section */}
                <div className="footer-links-section">
                    <div className="footer-link-group">
                        <span className="technical-text">[TRANSLATION_GROUP]</span>
                        <p className="group-name">Cơ Sở Dữ Liệu Civilight Eterna</p>
                    </div>
                    
                    <div className="footer-contact-grid">
                        <a href="mailto:civilighteterna2771@gmail.com" className="footer-contact-link">
                            <span className="link-label">EMAIL:</span>
                            <span className="link-val">civilighteterna2771@gmail.com</span>
                        </a>
                        <a href="https://www.facebook.com/profile.php?id=61559583986412" target="_blank" rel="noopener noreferrer" className="footer-contact-link">
                            <span className="link-label">FACEBOOK:</span>
                            <span className="link-val">Cơ Sở Dữ Liệu Civilight Eterna</span>
                        </a>
                    </div>
                </div>
            </div>

            <div className="redesign-container footer-bottom">
                <span className="copyright-text">&copy; ARKNIGHTS FAN PROJECT. ALL ASSETS BELONG TO HYPERGRYPH/YOSTAR.</span>
                <span className="status-tag technical-text">SYS_STATUS: ONLINE_NODE_V2.0</span>
            </div>
        </footer>
    )
}
