import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { SupabaseAPI } from '../../../src/services/supabaseApi'
import { getAssetUrl } from '../../../src/utils/assetUtils'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import SidebarRegionDropdown from '../../components/SidebarRegionDropdown'
import Footer from '../../components/Footer'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import Tabs from '../../components/Tabs'
import { ArrowLeft, ArrowRight, ExternalLink, Sparkles, BookmarkCheck } from 'lucide-react'
import { getLastRead } from '../../../src/utils/readingHistory'
import { getSetting } from '../../utils/settings'
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

// Helper to cleanly stop and release an audio element
const stopAndDestroyAudio = (audio) => {
    if (!audio) return
    try {
        audio.pause()
        audio.currentTime = 0
        audio.removeAttribute('src')
        audio.load()
    } catch (e) {
        console.warn('Error stopping BGM:', e)
    }
}

export default function RedesignEventPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    // Page States
    const [event, setEvent] = useState(null)
    const [stories, setStories] = useState([])
    const [characters, setCharacters] = useState([])
    const [gallery, setGallery] = useState([])
    const [suggestedEvents, setSuggestedEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastRead, setLastRead] = useState(() => getLastRead())

    // Listen for real-time reading progress updates
    useEffect(() => {
        const handleProgressUpdate = () => {
            setLastRead(getLastRead())
        }
        window.addEventListener('cedReadingProgressUpdate', handleProgressUpdate)
        window.addEventListener('storage', handleProgressUpdate)
        return () => {
            window.removeEventListener('cedReadingProgressUpdate', handleProgressUpdate)
            window.removeEventListener('storage', handleProgressUpdate)
        }
    }, [])
    const [error, setError] = useState(null)

    // Sidebar & Region States
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarEvents, setSidebarEvents] = useState([])
    const [loadingSidebar, setLoadingSidebar] = useState(true)
    const [allRegions, setAllRegions] = useState([])
    const [activeRegionId, setActiveRegionId] = useState(null)
    const [arc, setArc] = useState(null)
    const [region, setRegion] = useState(null)

    // Event BGM Audio Refs & Session State
    const bgmAudioRef = useRef(null)
    const currentBgmSessionRef = useRef(0)
    const interactionCleanupRef = useRef(null)

    // Tab State
    const [activeTab, setActiveTab] = useState('stories')

    // Modal States
    const [selectedCharacter, setSelectedCharacter] = useState(null)
    const [selectedGalleryImage, setSelectedGalleryImage] = useState(null)

    // Base URL for linking back to original app
    const BASE_URL = import.meta.env.BASE_URL || '/'

    // 1. Fetch Event Specific Content
    useEffect(() => {
        // Immediately stop and destroy previous event's BGM when id changes
        currentBgmSessionRef.current++
        if (bgmAudioRef.current) {
            stopAndDestroyAudio(bgmAudioRef.current)
            bgmAudioRef.current = null
        }
        if (interactionCleanupRef.current) {
            interactionCleanupRef.current()
            interactionCleanupRef.current = null
        }

        async function loadEventData() {
            if (!id) return

            // --- Cache hit: restore ngay, không fetch lại ---
            if (eventCache.has(id)) {
                const cached = eventCache.get(id)
                setEvent(cached.event)
                setStories(cached.stories)
                setCharacters(cached.characters)
                setGallery(cached.gallery)
                setSuggestedEvents(cached.suggestedEvents || [])
                document.title = `${cached.event.name} // Civilight Eterna Database`

                // Restore arc & region từ cache nếu có
                if (cached.event.arc_id) {
                    let cachedArc = arcCache.get(cached.event.arc_id)
                    if (!cachedArc) {
                        try {
                            cachedArc = await SupabaseAPI.getArc(cached.event.arc_id)
                            if (cachedArc) arcCache.set(cached.event.arc_id, cachedArc)
                        } catch (e) {
                            console.warn('Failed to load arc from cache hit:', e)
                        }
                    }
                    if (cachedArc) {
                        setArc(cachedArc)
                        let cachedRegion = regionCache.get(cachedArc.region_id)
                        if (!cachedRegion) {
                            try {
                                cachedRegion = await SupabaseAPI.getRegion(cachedArc.region_id)
                                if (cachedRegion) regionCache.set(cachedArc.region_id, cachedRegion)
                            } catch (e) {
                                console.warn('Failed to load region from cache hit:', e)
                            }
                        }
                        if (cachedRegion) setRegion(cachedRegion)
                        setActiveRegionId(cachedArc.region_id)
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

                // Fetch Suggestions specifically for this event in its Arc
                let resolvedSuggs = []
                if (ev.arc_id) {
                    try {
                        const [rawSuggs, arcEvents] = await Promise.all([
                            SupabaseAPI.getSuggestionsByArc(ev.arc_id),
                            SupabaseAPI.getEventsByArc(ev.arc_id)
                        ])

                        if (rawSuggs && rawSuggs.length > 0 && arcEvents && arcEvents.length > 0) {
                            // Sort arcEvents by display_order to find 0-based index of current event
                            const sortedArcEvs = [...arcEvents].sort((x, y) => (x.display_order ?? 0) - (y.display_order ?? 0))
                            const evIndex = sortedArcEvs.findIndex(e => e.event_id === ev.event_id)

                            if (evIndex !== -1) {
                                // position is 1-based index in arc (e.g. position 6 means after the 6th event)
                                const event1BasedPos = evIndex + 1
                                const matchedRaw = rawSuggs.filter(s => s.position === event1BasedPos)
                                if (matchedRaw.length > 0) {
                                    const allEvtsMap = await SupabaseAPI.getEvents().then(evts =>
                                        Object.fromEntries((evts || []).map(e => [e.event_id, e]))
                                    ).catch(() => ({}))

                                     const candidateSuggs = matchedRaw.map(s => {
                                        const target = allEvtsMap[s.target_event_id]
                                        return target ? { ...target, suggestionId: s.id, suggestionPosition: s.position, suggestionType: s.type || 'next' } : null
                                    }).filter(Boolean)

                                    if (candidateSuggs.length > 0) {
                                        const verifiedSuggs = await Promise.all(
                                            candidateSuggs.map(async (cs) => {
                                                try {
                                                    const targetStories = await SupabaseAPI.getStoriesByEvent(cs.event_id, { includeDrafts: false })
                                                    return (targetStories && targetStories.length > 0) ? cs : null
                                                } catch {
                                                    return null
                                                }
                                            })
                                        )
                                        resolvedSuggs = verifiedSuggs.filter(Boolean)
                                    }
                                }
                            }
                        }
                    } catch (suggErr) {
                        console.warn('Could not load suggestions for event arc:', suggErr)
                    }
                }

                // Lưu vào cache
                eventCache.set(id, { event: ev, stories: st, characters: mappedCharacters, gallery: mappedGallery, suggestedEvents: resolvedSuggs })

                setEvent(ev)
                document.title = `${ev.name} // Civilight Eterna Database`
                setStories(st)
                setCharacters(mappedCharacters)
                setGallery(mappedGallery)
                setSuggestedEvents(resolvedSuggs)

                // Fetch Arc & Region (có cache riêng)
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
                        setActiveRegionId(arcData.region_id)
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

    // 2. Load all available regions for the Sidebar Region Switcher
    useEffect(() => {
        SupabaseAPI.getRegions().then(regs => {
            if (regs && regs.length > 0) setAllRegions(regs)
        }).catch(err => console.error('Failed to load all regions:', err))
    }, [])

    // 3. Fetch Region Events & Suggestions for Sidebar
    const loadRegionEvents = useCallback(async (targetRegionId) => {
        if (!targetRegionId) return

        try {
            setLoadingSidebar(true)
            const arcs = await SupabaseAPI.getArcsByRegion(targetRegionId)
            const allEvents = await SupabaseAPI.getEvents()
            const allEventsMap = Object.fromEntries(allEvents.map(e => [e.event_id, e]))

            // Fetch suggestions for all arcs in region
            const suggestionsLists = await Promise.all(
                arcs.map(a => SupabaseAPI.getSuggestionsByArc(a.arc_id).catch(() => []))
            )

            const finalSidebarItems = []
            const sortedArcs = [...arcs].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

            sortedArcs.forEach((a) => {
                const originalArcIdx = arcs.findIndex(orig => orig.arc_id === a.arc_id)
                const arcEvents = allEvents.filter(e => e.arc_id === a.arc_id)
                    .sort((x, y) => (x.display_order ?? 0) - (y.display_order ?? 0))

                const suggs = suggestionsLists[originalArcIdx] || []
                const suggsByPos = new Map()
                suggs.forEach(s => {
                    const target = allEventsMap[s.target_event_id]
                    if (target) {
                        if (!suggsByPos.has(s.position)) suggsByPos.set(s.position, [])
                        suggsByPos.get(s.position).push({
                            ...target,
                            arc_name: a.name,
                            isSuggestion: true,
                            suggestionPosition: s.position,
                            suggestionType: s.type || 'next'
                        })
                    }
                })

                const insertedPositions = new Set()
                arcEvents.forEach((evt, evtIdx) => {
                    const currentPos = evtIdx + 1
                    const suggsForCurrent = suggsByPos.get(currentPos) || []

                    // 1. Chèn gợi ý "Đọc trước" (prev) PHÍA TRƯỚC event này
                    const prevSuggs = suggsForCurrent.filter(s => s.suggestionType === 'prev')
                    finalSidebarItems.push(...prevSuggs)

                    // 2. Chèn chính event này
                    finalSidebarItems.push({
                        ...evt,
                        arc_name: a.name
                    })

                    // 3. Chèn gợi ý "Tiếp theo" (next) PHÍA SAU event này
                    const nextSuggs = suggsForCurrent.filter(s => (s.suggestionType || 'next') === 'next')
                    finalSidebarItems.push(...nextSuggs)

                    insertedPositions.add(currentPos)
                })

                // 4. Các gợi ý còn lại (nếu có vị trí vượt quá số lượng event)
                suggsByPos.forEach((sList, pos) => {
                    if (!insertedPositions.has(pos)) {
                        finalSidebarItems.push(...sList)
                        insertedPositions.add(pos)
                    }
                })
            })

            setSidebarEvents(finalSidebarItems)
        } catch (err) {
            console.error('Error loading sidebar events:', err)
        } finally {
            setLoadingSidebar(false)
        }
    }, [])

    // Synchronize sidebar events whenever activeRegionId changes
    useEffect(() => {
        if (activeRegionId) {
            loadRegionEvents(activeRegionId)
        }
    }, [activeRegionId, loadRegionEvents])

    // 4. Event BGM Player (Plays ONLY if event has BGM, syncs with Header settings)
    const getEffectiveVolume = useCallback(() => {
        try {
            const isMuted = !!getSetting('soundMuted')
            if (isMuted) return 0
            const master = Number(getSetting('soundVolume') ?? 50)
            const bgm = Number(getSetting('bgmVolume') ?? 80)
            const vol = (master / 100) * (bgm / 100)
            return Math.max(0, Math.min(1, isNaN(vol) ? 0.4 : vol))
        } catch {
            return 0.4
        }
    }, [])

    useEffect(() => {
        const sessionId = ++currentBgmSessionRef.current
        let isCancelled = false

        // Clean up any pending interaction listener
        if (interactionCleanupRef.current) {
            interactionCleanupRef.current()
            interactionCleanupRef.current = null
        }

        const rawBgm = event?.bgm_url || event?.bgm || event?.bgm_id
        if (!rawBgm) {
            if (bgmAudioRef.current) {
                stopAndDestroyAudio(bgmAudioRef.current)
                bgmAudioRef.current = null
            }
            return
        }

        async function initAudio() {
            let finalSrc = String(rawBgm).trim()

            // Resolve asset_id if it doesn't contain a file extension or slash
            if (!finalSrc.includes('.') && !finalSrc.includes('/') && !finalSrc.startsWith('http')) {
                try {
                    const asset = await SupabaseAPI.getAsset(finalSrc)
                    if (asset?.url) {
                        finalSrc = asset.url
                    }
                } catch (err) {
                    console.warn('Failed to resolve BGM asset ID:', err)
                }
            }

            if (!finalSrc.startsWith('http') && !finalSrc.startsWith('/') && !finalSrc.startsWith('data:')) {
                finalSrc = '/assets/audio/bgm/' + finalSrc
            }
            const resolvedUrl = getAssetUrl(finalSrc, 'audio')

            // If session changed, effect unmounted, or route changed during async fetch, ABORT!
            if (isCancelled || sessionId !== currentBgmSessionRef.current) return

            const effectiveVol = getEffectiveVolume()
            const isMuted = !!getSetting('soundMuted')

            // If audio already exists with this exact source, just update volume & play state
            if (bgmAudioRef.current && bgmAudioRef.current._src === resolvedUrl) {
                bgmAudioRef.current.volume = effectiveVol
                if (isMuted || effectiveVol === 0) {
                    if (!bgmAudioRef.current.paused) bgmAudioRef.current.pause()
                } else if (bgmAudioRef.current.paused) {
                    bgmAudioRef.current.play().catch(() => {})
                }
                return
            }

            // Stop any existing audio before starting a new track
            if (bgmAudioRef.current) {
                stopAndDestroyAudio(bgmAudioRef.current)
                bgmAudioRef.current = null
            }

            // Create new Audio element
            const audio = new Audio()
            // CRITICAL: Set volume BEFORE setting src to prevent initial loud volume burst!
            audio.volume = effectiveVol
            audio.loop = true
            audio._src = resolvedUrl
            audio._sessionId = sessionId
            audio.src = resolvedUrl
            bgmAudioRef.current = audio

            if (!isMuted && effectiveVol > 0) {
                const playPromise = audio.play()
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // Autoplay blocked by browser policy
                        if (isCancelled || sessionId !== currentBgmSessionRef.current) return

                        const onUserInteract = () => {
                            if (bgmAudioRef.current && bgmAudioRef.current._sessionId === sessionId) {
                                bgmAudioRef.current.play().catch(() => {})
                            }
                            cleanupInteraction()
                        }

                        const cleanupInteraction = () => {
                            document.removeEventListener('click', onUserInteract)
                            document.removeEventListener('keydown', onUserInteract)
                            if (interactionCleanupRef.current === cleanupInteraction) {
                                interactionCleanupRef.current = null
                            }
                        }

                        interactionCleanupRef.current = cleanupInteraction
                        document.addEventListener('click', onUserInteract, { once: true })
                        document.addEventListener('keydown', onUserInteract, { once: true })
                    })
                }
            }
        }

        initAudio()

        return () => {
            isCancelled = true
            if (interactionCleanupRef.current) {
                interactionCleanupRef.current()
                interactionCleanupRef.current = null
            }
        }
    }, [event, getEffectiveVolume])

    // Synchronize BGM Volume / Mute with Header Settings
    useEffect(() => {
        const handleVolumeSync = () => {
            if (!bgmAudioRef.current) return
            const effectiveVol = getEffectiveVolume()
            const isMuted = !!getSetting('soundMuted')

            bgmAudioRef.current.volume = effectiveVol

            if (isMuted || effectiveVol === 0) {
                if (!bgmAudioRef.current.paused) {
                    bgmAudioRef.current.pause()
                }
            } else {
                if (bgmAudioRef.current.paused) {
                    bgmAudioRef.current.play().catch(() => {})
                }
            }
        }

        window.addEventListener('cedVolumeChange', handleVolumeSync)
        window.addEventListener('cedMasterVolumeChange', handleVolumeSync)
        window.addEventListener('cedBgmVolumeChange', handleVolumeSync)
        window.addEventListener('cedMuteChange', handleVolumeSync)
        window.addEventListener('ced_app_settings', handleVolumeSync)
        window.addEventListener('storage', handleVolumeSync)

        return () => {
            window.removeEventListener('cedVolumeChange', handleVolumeSync)
            window.removeEventListener('cedMasterVolumeChange', handleVolumeSync)
            window.removeEventListener('cedBgmVolumeChange', handleVolumeSync)
            window.removeEventListener('cedMuteChange', handleVolumeSync)
            window.removeEventListener('ced_app_settings', handleVolumeSync)
            window.removeEventListener('storage', handleVolumeSync)
        }
    }, [getEffectiveVolume])

    // Cleanup audio on component unmount
    useEffect(() => {
        return () => {
            currentBgmSessionRef.current++
            if (bgmAudioRef.current) {
                stopAndDestroyAudio(bgmAudioRef.current)
                bgmAudioRef.current = null
            }
            if (interactionCleanupRef.current) {
                interactionCleanupRef.current()
                interactionCleanupRef.current = null
            }
        }
    }, [])

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

    // Compute navigation indexes (filtering only actual non-suggestion events for next/prev)
    const normalSidebarEvents = sidebarEvents.filter(e => !e.isSuggestion)
    const currentIndex = normalSidebarEvents.findIndex(e => e.event_id === id)
    const prevEvent = currentIndex > 0 ? normalSidebarEvents[currentIndex - 1] : null
    const nextEvent = currentIndex >= 0 && currentIndex < normalSidebarEvents.length - 1 ? normalSidebarEvents[currentIndex + 1] : null

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
                    onItemSelect={(evt) => {
                        navigate(`/event/${evt.event_id}`, { state: { regionId: activeRegionId || arc?.region_id } })
                        if (window.innerWidth <= 900) {
                            setSidebarOpen(false)
                        }
                    }}
                    loading={loadingSidebar}
                    itemKey="event_id"
                    headerComponent={
                        allRegions.length > 0 ? (
                            <SidebarRegionDropdown
                                regions={allRegions}
                                activeRegionId={activeRegionId || arc?.region_id}
                                onSelectRegion={(newRegId) => setActiveRegionId(newRegId)}
                            />
                        ) : null
                    }
                    renderItem={(evt) => {
                        const isPrev = evt.isSuggestion && evt.suggestionType === 'prev';
                        return (
                            <div className={`sidebar-event-item-content ${evt.isSuggestion ? 'is-suggestion' : ''}`}>
                                <span className="technical-text" style={{ fontSize: '0.72rem', opacity: evt.isSuggestion ? 0.9 : 0.6, color: evt.isSuggestion ? (isPrev ? '#2196F3' : 'var(--color-terracotta)') : 'inherit', fontWeight: evt.isSuggestion ? 700 : 400 }}>
                                    {evt.isSuggestion ? (isPrev ? 'SYS.PREV_RECOMMEND' : 'SYS.NEXT_RECOMMEND') : evt.arc_name}
                                </span>
                                <span style={{ fontWeight: 500 }}>{evt.isSuggestion ? `[${isPrev ? 'Gợi Ý Đọc Trước' : 'Gợi Ý Tiếp Theo'}] ${evt.name}` : evt.name}</span>
                            </div>
                        );
                    }}
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
                                <div className="event-page-wallpaper" aria-hidden="true">
                                    <img
                                        src={getAssetUrl(event.wallpaper_url || event.banner_url)}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                                    />
                                </div>
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
                                            title={`Chương trước: ${prevEvent.name}`}
                                        >
                                            <ArrowLeft size={20} />
                                        </Link>
                                    )}
                                    {nextEvent && (
                                        <Link
                                            to={`/event/${nextEvent.event_id}`}
                                            state={{ regionId: arc?.region_id }}
                                            className="event-float-nav next"
                                            title={`Chương sau: ${nextEvent.name}`}
                                        >
                                            <ArrowRight size={20} />
                                        </Link>
                                    )}

                                    {/* Prerequisite (Đọc trước) Suggestion Banner - Hiển thị phía trước Event */}
                                    {suggestedEvents.filter(s => s.suggestionType === 'prev').length > 0 && (
                                        <div className="event-suggestion-banner-container top-banner">
                                            <div className="event-suggestion-banner prev-recommendation">
                                                <div className="sugg-banner-header">
                                                    <span className="sugg-banner-tag technical-text prev-tag">
                                                        GỢI Ý NÊN ĐỌC TRƯỚC
                                                    </span>
                                                </div>
                                                <div className="sugg-cards-grid">
                                                    {suggestedEvents.filter(s => s.suggestionType === 'prev').map(sugg => (
                                                        <Link
                                                            key={sugg.suggestionId || sugg.event_id}
                                                            to={`/event/${sugg.event_id}`}
                                                            state={{ regionId: arc?.region_id }}
                                                            className="sugg-banner-btn prev-btn"
                                                            title={`Nên đọc trước: ${sugg.name}`}
                                                        >
                                                            <span className="sugg-btn-type-badge prev">ĐỌC TRƯỚC</span>
                                                            <span className="sugg-btn-text">{sugg.name}</span>
                                                            <ArrowRight size={16} />
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Main Hero Body */}
                                    <div className={`event-hero-body ${suggestedEvents.filter(s => (s.suggestionType || 'next') === 'next').length > 0 ? 'has-suggestion' : ''}`}>
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

                                    {/* Next Suggestion (Tiếp theo) Banner - Hiển thị phía sau Event */}
                                    {suggestedEvents.filter(s => (s.suggestionType || 'next') === 'next').length > 0 && (
                                        <div className="event-suggestion-banner-container bottom-banner">
                                            <div className="event-suggestion-banner next-recommendation">
                                                <div className="sugg-banner-header">
                                                    <span className="sugg-banner-tag technical-text next-tag">
                                                        GỢI Ý SỰ KIỆN TIẾP THEO
                                                    </span>
                                                </div>
                                                <div className="sugg-cards-grid">
                                                    {suggestedEvents.filter(s => (s.suggestionType || 'next') === 'next').map(sugg => (
                                                        <Link
                                                            key={sugg.suggestionId || sugg.event_id}
                                                            to={`/event/${sugg.event_id}`}
                                                            state={{ regionId: arc?.region_id }}
                                                            className="sugg-banner-btn next-btn"
                                                            title={`Chuyển tới sự kiện gợi ý: ${sugg.name}`}
                                                        >
                                                            <span className="sugg-btn-type-badge next">TIẾP THEO</span>
                                                            <span className="sugg-btn-text">{sugg.name}</span>
                                                            <ArrowRight size={16} />
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
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
                                                    {stories.map((story, index) => {
                                                        const isCurrentLastRead = lastRead?.storyId === story.story_id
                                                        return (
                                                            <Link
                                                                key={story.story_id}
                                                                to={`/story/${story.story_id}`}
                                                                className={`chapter-card ${isCurrentLastRead ? 'is-last-read' : ''}`}
                                                                title="Mở trình đọc truyện"
                                                            >
                                                                {isCurrentLastRead && (
                                                                    <div className="chapter-reading-badge">
                                                                        <BookmarkCheck size={11} />
                                                                        <span>ĐANG ĐỌC ({lastRead.scrollPercent || 0}%)</span>
                                                                    </div>
                                                                )}
                                                                <div className="chapter-meta technical-text">
                                                                    STORY_NODE // 0{index + 1}
                                                                </div>
                                                                <div className="chapter-title">
                                                                    {story.name}
                                                                </div>
                                                                <div
                                                                    className="technical-text"
                                                                    style={{
                                                                        fontSize: '0.75rem',
                                                                        opacity: isCurrentLastRead ? 0.95 : 0.5,
                                                                        marginTop: 'auto',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.25rem',
                                                                        color: isCurrentLastRead ? 'var(--color-ochre, #BA8530)' : 'inherit',
                                                                        fontWeight: isCurrentLastRead ? 700 : 'normal'
                                                                    }}
                                                                >
                                                                    {isCurrentLastRead ? 'TIẾP TỤC ĐỌC' : 'READ_STORY'}{' '}
                                                                    {isCurrentLastRead ? <ArrowRight size={12} /> : <ExternalLink size={12} />}
                                                                </div>
                                                            </Link>
                                                        )
                                                    })}
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
