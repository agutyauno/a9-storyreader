import React, { useState, useEffect } from 'react'
import {
    ArrowRight,
    Info,
    ExternalLink
} from 'lucide-react'
import { SupabaseAPI } from '../../../src/services/supabaseApi'
import { getAssetUrl } from '../../../src/utils/assetUtils'
import './home.css'

export default function RedesignHomePage() {
    const [regions, setRegions] = useState([])
    const [selectedRegion, setSelectedRegion] = useState(null)
    const [events, setEvents] = useState([])

    const [loadingRegions, setLoadingRegions] = useState(true)
    const [loadingEvents, setLoadingEvents] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [error, setError] = useState(null)

    // Vite base path for redirecting to original app page
    const BASE_URL = import.meta.env.BASE_URL || '/'

    // Load all regions on mount
    useEffect(() => {
        document.title = 'Civilight Eterna Database - Retro Redesign'

        async function loadRegions() {
            try {
                setLoadingRegions(true)
                const data = await SupabaseAPI.getRegions()
                setRegions(data)
                if (data && data.length > 0) {
                    // Set first region as selected by default
                    setSelectedRegion(data[0])
                }
            } catch (err) {
                console.error('Error loading regions:', err)
                setError('Đã xảy ra lỗi khi kết nối cơ sở dữ liệu vùng.')
            } finally {
                setLoadingRegions(false)
            }
        }
        loadRegions()
    }, [])

    // Load arcs and events when selectedRegion changes
    useEffect(() => {
        if (!selectedRegion) return

        document.title = `${selectedRegion.name} // Civilight Eterna Database`

        async function loadEventsForRegion() {
            try {
                setLoadingEvents(true)
                setError(null)

                // Fetch arcs for this region
                const arcs = await SupabaseAPI.getArcsByRegion(selectedRegion.region_id)

                if (arcs && arcs.length > 0) {
                    // Fetch events for all arcs in parallel
                    const eventsPromises = arcs.map(arc => SupabaseAPI.getEventsByArc(arc.arc_id))
                    const eventsLists = await Promise.all(eventsPromises)

                    // Flatten and match events with their parent arc name
                    const compiledEvents = []
                    eventsLists.forEach((list, idx) => {
                        const arc = arcs[idx]
                        list.forEach(evt => {
                            compiledEvents.push({
                                ...evt,
                                arcName: arc.name
                            })
                        })
                    })

                    setEvents(compiledEvents)
                } else {
                    setEvents([])
                }
            } catch (err) {
                console.error('Error loading events:', err)
                setError('Không thể tải chuỗi dữ liệu sự kiện cho khu vực này.')
            } finally {
                setLoadingEvents(false)
            }
        }

        loadEventsForRegion()
    }, [selectedRegion])

    return (
        <div className="app-wrapper">
            {/* Swiss Retro Header */}
            <header className="retro-header">
                <div className="header-left">
                    <button
                        className="sidebar-toggle-btn"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? '[ HIDE_SIDEBAR ]' : '[ SHOW_SIDEBAR ]'}
                    </button>

                    <div className="header-logo">
                        <img
                            src={getAssetUrl('/assets/images/icon/rhodes_island.png')}
                            alt="Rhodes Island Logo"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                            }}
                        />
                        <span className="technical-text">CIVILIGHT_ETERNA_DATABASE</span>
                    </div>
                </div>

                <nav className="header-nav">
                    <a href="#/operator" className="header-nav-item">OPERATOR</a>
                    <a href="#/is-story" className="header-nav-item">IS STORY</a>
                    <a href={`${BASE_URL}#`} className="header-nav-item">MAIN_APP</a>
                </nav>
            </header>

            {/* Main Layout: Sidebar + Content */}
            <div className="main-layout">
                {/* Sidebar */}
                <aside className={`retro-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-title-block retro-stripes">
                        <span className="sidebar-title technical-text">SYS.REGIONS_DIRECTORY</span>
                    </div>

                    {loadingRegions ? (
                        <div className="retro-loading">
                            <div className="loading-bar-container">
                                <div className="loading-bar"></div>
                            </div>
                            <span className="technical-text">POLLING_REGIONS...</span>
                        </div>
                    ) : (
                        <ul className="region-list">
                            {regions.map(region => (
                                <li key={region.region_id} className="region-list-item">
                                    <button
                                        className={`region-btn ${selectedRegion?.region_id === region.region_id ? 'active' : ''}`}
                                        onClick={() => setSelectedRegion(region)}
                                    >
                                        <img
                                            src={getAssetUrl(region.icon_url || '/assets/images/icon/rhodes_island.png')}
                                            alt={region.name}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = getAssetUrl('/assets/images/icon/rhodes_island.png');
                                            }}
                                        />
                                        <span>{region.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>

                {/* Content Area */}
                <div className={`content-area ${sidebarOpen ? '' : 'expanded'}`}>
                    {selectedRegion ? (
                        <>
                            {/* Region Hero */}
                            <div className="region-hero">
                                <div className="region-hero-meta technical-text">
                                    SEC.REGION_NODE // ID: {selectedRegion.region_id}
                                </div>
                                <h2 className="region-hero-title">{selectedRegion.name}</h2>
                                <p className="region-hero-desc">
                                    {selectedRegion.description || 'Không tìm thấy dữ liệu mô tả cụ thể cho khu vực này trong hệ thống lưu trữ.'}
                                </p>
                            </div>

                            {/* Event Chain Body */}
                            {loadingEvents ? (
                                <div className="retro-loading">
                                    <div className="loading-bar-container">
                                        <div className="loading-bar"></div>
                                    </div>
                                    <span className="technical-text">RESOLVING_DATA_CHAIN_SEQUENCE...</span>
                                </div>
                            ) : error ? (
                                <div className="retro-error">
                                    <p className="technical-text">SYS_ERROR: {error}</p>
                                </div>
                            ) : events.length === 0 ? (
                                <div className="retro-error" style={{ borderColor: 'var(--color-ochre)', color: 'var(--color-ochre)' }}>
                                    <p className="technical-text">STATUS_NO_DATA: Khu vực này chưa có bản ghi sự kiện nào.</p>
                                </div>
                            ) : (
                                <div className="event-chain-container">
                                    {events.map((event, index) => (
                                        <div key={event.event_id} className="event-chain-item">
                                            {/* Timeline Dot Node */}
                                            <div className="event-chain-node"></div>

                                            {/* Event Card */}
                                            <div className="event-card">
                                                <div className="event-card-img-container">
                                                    <img
                                                        className="event-card-img"
                                                        src={getAssetUrl(event.image_url || '/assets/images/icon/rhodes_island.png')}
                                                        alt={event.name}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = getAssetUrl('/assets/images/icon/rhodes_island.png');
                                                        }}
                                                    />
                                                </div>

                                                <div className="event-card-body">
                                                    <div>
                                                        <div className="event-card-header">
                                                            <h3 className="event-card-title">{event.name}</h3>
                                                            <span className="event-card-index">EVT.{index < 9 ? `0${index + 1}` : index + 1}</span>
                                                        </div>
                                                        <p className="event-card-desc">{event.description || 'Không có mô tả chi tiết cho sự kiện này.'}</p>
                                                    </div>

                                                    <div className="event-card-footer">
                                                        <span className="event-card-tag technical-text">
                                                            [ARC_GROUP: {event.arcName || 'N/A'}]
                                                        </span>
                                                        <a
                                                            href={`${BASE_URL}#/event/${event.event_id}`}
                                                            className="retro-link"
                                                        >
                                                            READ STORY <ArrowRight size={14} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="retro-loading">
                            <span className="technical-text">AWAITING_REGION_SELECTION...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="retro-footer">
                <div className="redesign-container footer-grid">
                    <div className="footer-section">
                        <h4 className="technical-text">[TRANSLATION_GROUP]</h4>
                        <p>Cơ Sở Dữ Liệu Civilight Eterna</p>
                        <p>Email: <a href="mailto:civilighteterna2771@gmail.com">civilighteterna2771@gmail.com</a></p>
                        <p>Facebook: <a href="https://www.facebook.com/profile.php?id=61559583986412" target="_blank" rel="noopener noreferrer">Cơ Sở Dữ Liệu Civilight Eterna</a></p>
                    </div>

                    <div className="footer-section">
                        <h4 className="technical-text">[WEBSITE_INFO]</h4>
                        <p>Dự án phi lợi nhuận biên dịch cốt truyện Arknights sang Tiếng Việt.</p>
                        <p>Mã nguồn hệ thống được phát triển bởi Agutyauno.</p>
                        <p>Giao diện thiết kế theo hệ thống lưới Swiss kết hợp Retro Futuristic.</p>
                    </div>
                </div>

                <div className="redesign-container footer-bottom">
                    <span>&copy; ARKNIGHTS FAN PROJECT. ALL ASSETS BELONG TO HYPERGRYPH/YOSTAR.</span>
                    <span>SYS_STATUS: ONLINE_NODE_V2.0</span>
                </div>
            </footer>
        </div>
    )
}