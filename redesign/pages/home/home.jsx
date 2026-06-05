import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SupabaseAPI } from '../../../src/services/supabaseApi'
import { getAssetUrl } from '../../../src/utils/assetUtils'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import Footer from '../../components/Footer'
import Loading from '../../components/Loading'
import './home.css'

export default function RedesignHomePage() {
    const [regions, setRegions] = useState([])
    const [selectedRegion, setSelectedRegion] = useState(null)
    const [arcsWithEvents, setArcsWithEvents] = useState([])

    const [loadingRegions, setLoadingRegions] = useState(true)
    const [loadingEvents, setLoadingEvents] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [error, setError] = useState(null)

    const timelineRef = useRef(null)
    const location = useLocation()

    // Vite base path for redirecting to original app page
    const BASE_URL = import.meta.env.BASE_URL || '/'

    // Load all regions on mount
    useEffect(() => {
        document.title = 'Civilight Eterna Database'
        document.querySelector('link[rel="icon"]').href = '/assets/images/logo/ced_white.png'

        async function loadRegions() {
            try {
                setLoadingRegions(true)
                const data = await SupabaseAPI.getRegions()
                setRegions(data)
                if (data && data.length > 0) {
                    // Ưu tiên: 1. state từ router, 2. query param, 3. region của event vừa rời đi/chọn cuối cùng
                    const targetRegionId = location.state?.regionId || 
                                           new URLSearchParams(location.search).get('region') ||
                                           localStorage.getItem('lastActiveRegionId') ||
                                           localStorage.getItem('selectedRegionId')
                    const targetRegion = targetRegionId ? data.find(r => r.region_id === targetRegionId) : null
                    setSelectedRegion(targetRegion || data[0])
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

    // Lưu region đang chọn vào localStorage
    useEffect(() => {
        if (selectedRegion) {
            localStorage.setItem('selectedRegionId', selectedRegion.region_id)
            localStorage.setItem('lastActiveRegionId', selectedRegion.region_id)
        }
    }, [selectedRegion])

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

                    // Zip arcs and events
                    const compiledArcs = arcs.map((arc, idx) => ({
                        ...arc,
                        events: eventsLists[idx] || []
                    }))

                    setArcsWithEvents(compiledArcs)
                } else {
                    setArcsWithEvents([])
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

    // Enable horizontal scroll on mouse wheel
    useEffect(() => {
        const container = timelineRef.current
        if (!container) return

        const handleWheel = (e) => {
            if (e.deltaY !== 0) {
                // Only intercept wheel scroll if horizontal scrolling is actually available
                if (container.scrollWidth > container.clientWidth + 1) {
                    e.preventDefault()
                    container.scrollLeft += e.deltaY
                }
            }
        }

        container.addEventListener('wheel', handleWheel, { passive: false })
        return () => {
            container.removeEventListener('wheel', handleWheel)
        }
    }, [arcsWithEvents, loadingEvents])

    // Close sidebar when clicking outside of it
    useEffect(() => {
        if (!sidebarOpen) return

        const handleClickOutside = () => {
            setSidebarOpen(false)
        }

        document.addEventListener('click', handleClickOutside)
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [sidebarOpen])

    return (
        <div className="app-wrapper">
            {/* Swiss Retro Header */}
            <Header
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                BASE_URL={BASE_URL}
            />

            {/* Main Layout: Sidebar + Content */}
            <div className="main-layout">
                {/* Sidebar */}
                <Sidebar
                    title="SYS.REGIONS_DIRECTORY"
                    sidebarOpen={sidebarOpen}
                    items={regions}
                    selectedItemId={selectedRegion?.region_id}
                    onItemSelect={setSelectedRegion}
                    loading={loadingRegions}
                    itemKey="region_id"
                    renderItem={(region) => (
                        <>
                            <img
                                src={getAssetUrl(region.icon_url || '/assets/images/icon/rhodes_island.png')}
                                alt={region.name}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = getAssetUrl('/assets/images/icon/rhodes_island.png');
                                }}
                            />
                            <span>{region.name}</span>
                        </>
                    )}
                />

                {/* Content Area */}
                <div className={`content-area ${sidebarOpen ? 'sidebar-active' : 'expanded'}`}>
                    {selectedRegion ? (
                        <div key={selectedRegion.region_id} className="page-fade-in">
                            {/* Region Hero */}
                            <div className="region-hero">
                                <div className="region-hero-meta technical-text">
                                    SEC.REGION_NODE // ID: {selectedRegion.region_id}
                                </div>
                                <h2 className="region-hero-title">{selectedRegion.name}</h2>
                                <p className="region-hero-desc">
                                    {selectedRegion.description || 'Không tìm thấy dữ liệu mô tả cụ thể cho khu vực này.'}
                                </p>
                            </div>

                            {/* Event Chain Body */}
                             {loadingEvents ? (
                                <Loading text="RESOLVING_DATA_CHAIN_SEQUENCE..." />
                            ) : error ? (
                                <div className="error-container">
                                    <p className="technical-text">SYS_ERROR: {error}</p>
                                </div>
                            ) : (
                                <div className="event-chain-container-horizontal">
                                    <div className="event-chain-horizontal" ref={timelineRef}>
                                        {arcsWithEvents.length === 0 || arcsWithEvents.every(arc => (arc.events || []).length === 0) ? (
                                            <div className="event-card-horizontal-empty">
                                                <div className="event-card-name-horizontal">
                                                    CHƯA CÓ BẢN GHI SỰ KIỆN
                                                </div>
                                            </div>
                                        ) : (
                                            arcsWithEvents.map((arc, arcIdx) => (
                                                <div key={arc.arc_id} className="arc-group-horizontal">
                                                    {/* Arc Metadata Card */}
                                                    <div className="arc-metadata-card">
                                                        <div className="arc-card-header technical-text">
                                                            SYS.ARC_NODE // 0{arcIdx + 1}
                                                        </div>
                                                        <div className="arc-card-body">
                                                            <h3 className="arc-card-title">{arc.name}</h3>
                                                            <p className="arc-card-desc">
                                                                {arc.description || 'Hồ sơ diễn biến sự kiện của chương này. Chọn sự kiện để xem chi tiết.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Arc Events */}
                                                    {(arc.events || []).map((event, index) => (
                                                        <Link
                                                            key={event.event_id}
                                                            to={`/event/${event.event_id}`}
                                                            state={{ regionId: selectedRegion?.region_id }}
                                                            className="event-card-horizontal"
                                                        >
                                                            <div className="event-card-img-wrap-horizontal">
                                                                <img
                                                                    className="event-card-img-horizontal"
                                                                    src={getAssetUrl(event.image_url || '/assets/images/icon/rhodes_island.png')}
                                                                    alt={event.name}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = getAssetUrl('/assets/images/icon/rhodes_island.png');
                                                                    }}
                                                                />
                                                                <div className="event-card-index-tag">
                                                                    EVT.{index < 9 ? `0${index + 1}` : index + 1}
                                                                </div>
                                                            </div>

                                                            <div className="event-card-name-horizontal">
                                                                {event.name}
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Loading text="AWAITING_REGION_SELECTION..." showBar={false} />
                    )}
                </div>
            </div>

            {/* Footer */}
            {/* Footer */}
            <Footer />
        </div>
    )
}