import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { SupabaseAPI } from '../../../src/services/supabaseApi'
import { getAssetUrl } from '../../../src/utils/assetUtils'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import Footer from '../../components/Footer'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import Tabs from '../../components/Tabs'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import './event.css'

const EVENT_TABS = [
    { id: 'stories', label: '[01] HỒ SƠ TRUYỆN' },
    { id: 'characters', label: '[02] NHÂN VẬT' },
    { id: 'gallery', label: '[03] THƯ VIỆN' },
]

// ─── Cache ───
const eventCache = new Map()  // event_id → { event, stories, characters, gallery }
const arcCache = new Map()  // arc_id   → arcData
const regionCache = new Map()  // region_id → regionData

export default function RedesignEventPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    // Page States
    const [event, setEvent] = useState(null)
    const [stories, setStories] = useState([])
    const [characters, setCharacters] = useState([])
    const [gallery, setGallery] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Sidebar & Region States
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarEvents, setSidebarEvents] = useState([])
    const [loadingSidebar, setLoadingSidebar] = useState(true)
    const [loadedRegionId, setLoadedRegionId] = useState(null)
    const [arc, setArc] = useState(null)
    const [region, setRegion] = useState(null)

    // Tab State
    const [activeTab, setActiveTab] = useState('stories')

    // Modal States
    const [selectedCharacter, setSelectedCharacter] = useState(null)
    const [selectedGalleryImage, setSelectedGalleryImage] = useState(null)

    // Base URL for linking back to original app
    const BASE_URL = import.meta.env.BASE_URL || '/'

    // 1. Fetch Event Specific Content
    useEffect(() => {
        async function loadEventData() {
            if (!id) return

            // --- Cache hit: restore ngay, không fetch lại ---
            if (eventCache.has(id)) {
                const cached = eventCache.get(id)
                setEvent(cached.event)
                setStories(cached.stories)
                setCharacters(cached.characters)
                setGallery(cached.gallery)
                document.title = `${cached.event.name} // Civilight Eterna Database`

                // Restore arc & region từ cache nếu có
                if (cached.event.arc_id) {
                    const cachedArc = arcCache.get(cached.event.arc_id)
                    if (cachedArc) {
                        setArc(cachedArc)
                        const cachedRegion = regionCache.get(cachedArc.region_id)
                        if (cachedRegion) setRegion(cachedRegion)
                    }
                }

                setLoading(false)
                setError(null)
                return
            }

            // --- Cache miss: fetch từ Supabase ---
            setLoading(true)
            setError(null)

            try {
                const [ev, st, ch, ga] = await Promise.all([
                    SupabaseAPI.getEvent(id),
                    SupabaseAPI.getStoriesByEvent(id),
                    SupabaseAPI.getCharactersByEvent(id),
                    SupabaseAPI.getGalleryByEvent(id)
                ])

                if (!ev) {
                    setError('Không tìm thấy bản ghi sự kiện.')
                    setLoading(false)
                    return
                }

                const AVATAR_FALLBACK = '/assets/images/character/blank.png'
                const mappedCharacters = ch.map((c, idx) => ({
                    id: c.character_id || `char-${idx}`,
                    name: c.name,
                    avatar: getAssetUrl(c.avatar_url || AVATAR_FALLBACK),
                    fullImage: getAssetUrl(c.image_url || AVATAR_FALLBACK),
                    description: c.description
                }))
                const mappedGallery = ga.map((g, idx) => ({
                    id: g.gallery_id || `img-${idx}`,
                    title: g.title,
                    image: getAssetUrl(g.image_url || '/assets/images/icon/default.png')
                }))

                // Lưu vào cache
                eventCache.set(id, { event: ev, stories: st, characters: mappedCharacters, gallery: mappedGallery })

                setEvent(ev)
                document.title = `${ev.name} // Civilight Eterna Database`
                setStories(st)
                setCharacters(mappedCharacters)
                setGallery(mappedGallery)

                // Fetch Arc & Region (có cache ringêng)
                if (ev.arc_id) {
                    let arcData = arcCache.get(ev.arc_id)
                    if (!arcData) {
                        arcData = await SupabaseAPI.getArc(ev.arc_id)
                        if (arcData) arcCache.set(ev.arc_id, arcData)
                    }
                    if (arcData) {
                        setArc(arcData)
                        let regionData = regionCache.get(arcData.region_id)
                        if (!regionData) {
                            regionData = await SupabaseAPI.getRegion(arcData.region_id)
                            if (regionData) regionCache.set(arcData.region_id, regionData)
                        }
                        if (regionData) setRegion(regionData)
                    }
                }
            } catch (err) {
                console.error('Error loading event details:', err)
                setError('Lỗi kết nối cơ sở dữ liệu sự kiện.')
            } finally {
                setLoading(false)
            }
        }
        loadEventData()
    }, [id])

    // 2. Fetch Region Events for Sidebar (runs only when region_id changes)
    useEffect(() => {
        async function loadRegionEvents() {
            if (!arc || arc.region_id === loadedRegionId) return

            try {
                setLoadingSidebar(true)
                const arcs = await SupabaseAPI.getArcsByRegion(arc.region_id)
                const allEvents = await SupabaseAPI.getEvents()

                // Filter events that belong to arcs in the current region
                const arcIdsInRegion = arcs.map(a => a.arc_id)
                const regionEvents = allEvents.filter(e => arcIdsInRegion.includes(e.arc_id))

                // Map arc names + arc display_order for visual grouping in sidebar
                const arcMap = Object.fromEntries(arcs.map(a => [a.arc_id, { name: a.name, order: a.display_order ?? 0 }]))
                const enrichedEvents = regionEvents.map(e => ({
                    ...e,
                    arc_name: arcMap[e.arc_id]?.name || 'SYS.ARC',
                    _arc_order: arcMap[e.arc_id]?.order ?? 0,
                }))

                // Sort: arc thứ tự → event thứ tự trong arc
                enrichedEvents.sort((a, b) => {
                    if (a._arc_order !== b._arc_order) return a._arc_order - b._arc_order
                    return (a.display_order ?? 0) - (b.display_order ?? 0)
                })

                setSidebarEvents(enrichedEvents)
                setLoadedRegionId(arc.region_id)
            } catch (err) {
                console.error('Error loading sidebar events:', err)
            } finally {
                setLoadingSidebar(false)
            }
        }
        loadRegionEvents()
    }, [arc, loadedRegionId])

    // 3. Close sidebar on click outside
    useEffect(() => {
        if (!sidebarOpen) return
        const handleClickOutside = () => setSidebarOpen(false)
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [sidebarOpen])

    // Reset tab when navigating to a new event
    useEffect(() => {
        setActiveTab('stories')
    }, [id])

    // Lưu lại region của event hiện tại khi nó được load xong
    useEffect(() => {
        if (region && region.region_id) {
            localStorage.setItem('lastActiveRegionId', region.region_id)
        }
    }, [region])

    // Compute navigation indexes
    const currentIndex = sidebarEvents.findIndex(e => e.event_id === id)
    const prevEvent = currentIndex > 0 ? sidebarEvents[currentIndex - 1] : null
    const nextEvent = currentIndex >= 0 && currentIndex < sidebarEvents.length - 1 ? sidebarEvents[currentIndex + 1] : null

    return (
        <div className="app-wrapper">
            {/* Header */}
            <Header
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                BASE_URL={BASE_URL}
            />

            {/* Main Page Layout */}
            <div className="main-layout">
                {/* Sidebar Directory */}
                <Sidebar
                    title="SYS.REGION_EVENTS"
                    sidebarOpen={sidebarOpen}
                    items={sidebarEvents}
                    selectedItemId={id}
                    onItemSelect={(evt) => navigate(`/event/${evt.event_id}`, { state: { regionId: arc?.region_id } })}
                    loading={loadingSidebar}
                    itemKey="event_id"
                    renderItem={(evt) => (
                        <div className="sidebar-event-item-content">
                            <span className="technical-text" style={{ fontSize: '0.72rem', opacity: 0.6 }}>
                                {evt.arc_name}
                            </span>
                            <span style={{ fontWeight: 500 }}>{evt.name}</span>
                        </div>
                    )}
                />

                {/* Content Area */}
                <div className={`content-area event-page-layout ${sidebarOpen ? 'sidebar-active' : 'expanded'}`}>
                    {loading ? (
                        <Loading text="RESOLVING_EVENT_NODE_DATA..." />
                    ) : error ? (
                        <div className="error-container">
                            <p className="technical-text">SYS_ERROR: {error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Backdrop Wallpaper */}
                            {(event.wallpaper_url || event.banner_url) && (
                                <div
                                    className="event-page-wallpaper"
                                    style={{ backgroundImage: `url(${getAssetUrl(event.wallpaper_url || event.banner_url)})` }}
                                    aria-hidden="true"
                                />
                            )}

                            <div key={id} className="event-container page-fade-in">
                                {/* ── HERO SECTION ── */}
                                <div className="event-hero-panel">
                                    {/* Floating PREV/NEXT arrow buttons */}
                                    {prevEvent && (
                                        <Link
                                            to={`/event/${prevEvent.event_id}`}
                                            state={{ regionId: arc?.region_id }}
                                            className="event-float-nav prev"
                                            title={prevEvent.name}
                                        >
                                            <ArrowLeft size={20} />
                                        </Link>
                                    )}
                                    {nextEvent && (
                                        <Link
                                            to={`/event/${nextEvent.event_id}`}
                                            state={{ regionId: arc?.region_id }}
                                            className="event-float-nav next"
                                            title={nextEvent.name}
                                        >
                                            <ArrowRight size={20} />
                                        </Link>
                                    )}

                                    {/* Info Column */}
                                    <div className="event-hero-info">
                                        <div className="event-hero-breadcrumb technical-text">
                                            {arc && (
                                                <Link
                                                    to="/"
                                                    state={{ regionId: arc.region_id }}
                                                    className="event-breadcrumb-link"
                                                >
                                                    ← VỀ {region?.name || 'KHU VỰC'}
                                                </Link>
                                            )}
                                        </div>
                                        <div className="event-hero-meta technical-text">
                                            SYS.EVENT_RECORD // {event.event_id}
                                        </div>
                                        <h2 className="event-hero-title">{event.name}</h2>
                                        <p className="event-hero-desc">{event.description}</p>

                                        {/* Quick stats row */}
                                        <div className="event-hero-stats">
                                            <div className="event-stat-item">
                                                <span className="event-stat-value technical-text">{stories.length}</span>
                                                <span className="event-stat-label technical-text">STORIES</span>
                                            </div>
                                            <div className="event-stat-divider" />
                                            <div className="event-stat-item">
                                                <span className="event-stat-value technical-text">{characters.length}</span>
                                                <span className="event-stat-label technical-text">CHARS</span>
                                            </div>
                                            <div className="event-stat-divider" />
                                            <div className="event-stat-item">
                                                <span className="event-stat-value technical-text">{gallery.length}</span>
                                                <span className="event-stat-label technical-text">MEDIA</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Banner Image Column */}
                                    {event.banner_url && (
                                        <div
                                            className="event-hero-image-wrap"
                                            onClick={() => setSelectedGalleryImage({
                                                image: getAssetUrl(event.banner_url),
                                                title: event.name
                                            })}
                                            title="Xem ảnh đầy đủ"
                                        >
                                            <img
                                                className="event-hero-image"
                                                src={getAssetUrl(event.banner_url)}
                                                alt={event.name}
                                                onError={(e) => {
                                                    e.target.onerror = null
                                                    e.target.style.display = 'none'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* ── TAB BAR ── */}
                                <div className="event-tab-bar-wrap">
                                    <Tabs
                                        tabs={EVENT_TABS}
                                        activeTabId={activeTab}
                                        onChange={setActiveTab}
                                        className="event-tabs"
                                    />
                                </div>

                                {/* ── TAB CONTENT PANEL ── */}
                                <div className="event-tab-content">

                                    {/* TAB: Stories */}
                                    {activeTab === 'stories' && (
                                        <div className="tab-panel" key="stories">
                                            {stories.length === 0 ? (
                                                <p className="tab-empty-msg">Không tìm thấy ghi chép cốt truyện cho sự kiện này.</p>
                                            ) : (
                                                <div className="chapters-grid">
                                                    {stories.map((story, index) => (
                                                        <a
                                                            key={story.story_id}
                                                            href={`${BASE_URL}#/story/${story.story_id}`}
                                                            className="chapter-card"
                                                            title="Mở trình đọc truyện (Original App)"
                                                        >
                                                            <div className="chapter-meta technical-text">
                                                                STORY_NODE // 0{index + 1}
                                                            </div>
                                                            <div className="chapter-title">
                                                                {story.name}
                                                            </div>
                                                            <div className="technical-text" style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                READ_STORY <ExternalLink size={12} />
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB: Characters */}
                                    {activeTab === 'characters' && (
                                        <div className="tab-panel" key="characters">
                                            {characters.length === 0 ? (
                                                <p className="tab-empty-msg">Không tìm thấy ghi chép nhân vật liên quan.</p>
                                            ) : (
                                                <div className="operatives-grid">
                                                    {characters.map(char => (
                                                        <div
                                                            key={char.id}
                                                            className="operative-card"
                                                            onClick={() => setSelectedCharacter(char)}
                                                        >
                                                            <div className="operative-avatar-wrap">
                                                                <img
                                                                    className="operative-avatar"
                                                                    src={char.avatar}
                                                                    alt={char.name}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null
                                                                        e.target.src = '/assets/images/character/blank.png'
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="operative-name">
                                                                {char.name}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB: Gallery */}
                                    {activeTab === 'gallery' && (
                                        <div className="tab-panel" key="gallery">
                                            {gallery.length === 0 ? (
                                                <p className="tab-empty-msg">Không tìm thấy ghi chép hình ảnh thư viện.</p>
                                            ) : (
                                                <div className="media-grid">
                                                    {gallery.map(item => (
                                                        <div
                                                            key={item.id}
                                                            className="media-card"
                                                            onClick={() => setSelectedGalleryImage(item)}
                                                        >
                                                            <div className="media-img-wrap">
                                                                <img
                                                                    className="media-img"
                                                                    src={item.image}
                                                                    alt={item.title}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null
                                                                        e.target.src = '/assets/images/icon/default.png'
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="media-title">
                                                                {item.title || 'RECORDED_MEDIA'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                                {/* ── END TAB CONTENT ── */}

                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <Footer />

            {/* Modals */}
            {/* Character Info Modal */}
            <Modal
                isOpen={!!selectedCharacter}
                onClose={() => setSelectedCharacter(null)}
                title="SEC.OPERATIVE_DOSSIER // LÝ LỊCH NHÂN VẬT"
                className="char-modal-large"
            >
                <div className="modal-character-body">
                    <div className="modal-char-image-wrap">
                        <img
                            className="modal-char-image"
                            src={selectedCharacter?.fullImage || selectedCharacter?.avatar}
                            alt={selectedCharacter?.name}
                            onError={(e) => {
                                e.target.onerror = null
                                e.target.src = '/assets/images/character/blank.png'
                            }}
                        />
                    </div>
                    <div className="modal-char-info">
                        <div className="modal-char-id technical-text">
                            SYS.NODE_ID // {selectedCharacter?.id}
                        </div>
                        <h3 className="modal-char-name">{selectedCharacter?.name}</h3>
                        <p className="modal-char-desc">
                            {selectedCharacter?.description || 'Hồ sơ lý lịch trống.'}
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Gallery Image Zoom Modal */}
            <Modal
                isOpen={!!selectedGalleryImage}
                onClose={() => setSelectedGalleryImage(null)}
                title="SEC.MEDIA_LOG_VIEWER // XEM HÌNH ẢNH"
                className="gallery-modal-large"
            >
                <div className="modal-gallery-body">
                    <div className="modal-gallery-image-wrap">
                        <img
                            className="modal-gallery-image"
                            src={selectedGalleryImage?.image}
                            alt={selectedGalleryImage?.title}
                        />
                    </div>
                    <div className="modal-gallery-title technical-text">
                        TAG: {selectedGalleryImage?.title || 'RECORDED_MEDIA'}
                    </div>
                </div>
            </Modal>
        </div>
    )
}
