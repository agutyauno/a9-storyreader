import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { SupabaseAPI } from '../../../src/services/supabaseApi'
import { StoryRenderer } from '../../../src/utils/storyRenderer'
import { BGMManager, SFXManager } from '../../../src/utils/audioManager'
import { StoryScriptParser } from '../../../src/utils/storyParser'
import { getAssetUrl } from '../../../src/utils/assetUtils'
import { getSetting, saveSetting } from '../../utils/settings'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import Footer from '../../components/Footer'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import { Volume2, VolumeX, ArrowLeft, ArrowRight, ChevronUp } from 'lucide-react'
import './story.css'

export default function RedesignStoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [story, setStory] = useState(null)
  const [eventData, setEventData] = useState(null)
  const [allStories, setAllStories] = useState([])
  const [htmlContent, setHtmlContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Layout & Navigation States
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalData, setModalData] = useState(null) // { type: 'character'|'background', src: '' }
  const [activeNote, setActiveNote] = useState(null) // { word: string, content: string }
  const [showBackTop, setShowBackTop] = useState(false)

  // Audio settings state
  const [isMuted, setIsMuted] = useState(() => !!getSetting('soundMuted'))

  const contentRef = useRef(null)
  const BASE_URL = import.meta.env.BASE_URL || '/'

  // Auto-close sidebar and scroll top when story ID changes
  useEffect(() => {
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])

  // 1. Fetch Story & Event Details
  useEffect(() => {
    async function fetchStoryData() {
      const queryParams = new URLSearchParams(location.search)
      if (queryParams.get('preview')) {
        const raw = sessionStorage.getItem('preview_story')
        if (raw) {
          try {
            const previewStory = JSON.parse(raw)
            setStory(previewStory)
            let contentToRender = previewStory.story_content
            if (contentToRender && contentToRender.type === 'vns') {
              contentToRender = await StoryScriptParser.parseWithDB(contentToRender.script)
            }
            setHtmlContent(StoryRenderer.render(contentToRender))
            setLoading(false)
          } catch (e) {
            console.error('Error parsing preview story', e)
            setError('Lỗi phân tích dữ liệu xem trước.')
            setLoading(false)
          }
          return
        }
      }

      if (!id) return

      try {
        setLoading(true)
        setError(null)
        const fetchedStory = await SupabaseAPI.getStory(id)

        if (!fetchedStory) {
          setError('Không tìm thấy cốt truyện này.')
          setLoading(false)
          return
        }

        setStory(fetchedStory)
        document.title = `${fetchedStory.name} // Civilight Eterna Database`

        if (fetchedStory.event_id) {
          const [ev, stories] = await Promise.all([
            SupabaseAPI.getEvent(fetchedStory.event_id),
            SupabaseAPI.getStoriesByEvent(fetchedStory.event_id)
          ])
          setEventData(ev)
          setAllStories(stories || [])
        }

        let contentToRender = fetchedStory.story_content
        if (contentToRender && contentToRender.type === 'vns') {
          contentToRender = await StoryScriptParser.parseWithDB(contentToRender.script)
        }

        setHtmlContent(StoryRenderer.render(contentToRender))
      } catch (err) {
        console.error('Error fetching story data:', err)
        setError('Đã xảy ra lỗi khi tải hồ sơ cốt truyện.')
      } finally {
        setLoading(false)
      }
    }

    fetchStoryData()

    return () => {
      if (window.bgmManager) window.bgmManager.stop()
      if (window.sfxManager) window.sfxManager.destroy()
    }
  }, [id, location.search])

  // 2. Audio Synchronizer & Global Settings Sync
  const applyAudioSettings = () => {
    if (!window.bgmManager || !window.sfxManager) return
    const masterVol = getSetting('soundVolume') ?? 50
    const bgmVol = getSetting('bgmVolume') ?? 80
    const sfxVol = getSetting('sfxVolume') ?? 80
    const muted = !!getSetting('soundMuted')

    setIsMuted(muted)

    const finalBgm = muted ? 0 : (masterVol / 100) * (bgmVol / 100)
    const finalSfx = muted ? 0 : (masterVol / 100) * (sfxVol / 100)

    // Apply to BGM
    window.bgmManager.volume = finalBgm
    window.bgmManager.introAudio.volume = finalBgm
    window.bgmManager.loopAudio.volume = finalBgm
    window.bgmManager.isEnabled = !muted

    // Apply to SFX
    window.sfxManager.volume = finalSfx
    if (window.sfxManager.currentAudio) {
      window.sfxManager.currentAudio.volume = finalSfx
    }
    window.sfxManager.setEnabled(!muted)

    if (muted) {
      window.bgmManager.pause()
    } else {
      if (window.bgmManager.currentTrack && !window.bgmManager.isPlaying) {
        window.bgmManager.play()
      }
    }
  }

  useEffect(() => {
    applyAudioSettings()

    const handleVolumeChange = () => applyAudioSettings()

    window.addEventListener('cedVolumeChange', handleVolumeChange)
    window.addEventListener('cedBgmVolumeChange', handleVolumeChange)
    window.addEventListener('cedSfxVolumeChange', handleVolumeChange)
    window.addEventListener('cedMuteChange', handleVolumeChange)

    return () => {
      window.removeEventListener('cedVolumeChange', handleVolumeChange)
      window.removeEventListener('cedBgmVolumeChange', handleVolumeChange)
      window.removeEventListener('cedSfxVolumeChange', handleVolumeChange)
      window.removeEventListener('cedMuteChange', handleVolumeChange)
    }
  }, [htmlContent])

  const toggleMute = () => {
    const nextMuted = !isMuted
    saveSetting('soundMuted', nextMuted)
    setIsMuted(nextMuted)
    applyAudioSettings()
  }

  // 3. Bind DOM events for Decisions, Avatar Expand, notes popup & Audio scroll triggers
  useEffect(() => {
    if (!htmlContent || !contentRef.current) return

    const contentDiv = contentRef.current

    // Bind Visual Novel decision selections
    const decisionGroups = contentDiv.querySelectorAll('.decision-group')
    decisionGroups.forEach(group => {
      const groupId = group.getAttribute('data-choice-group')
      const decisions = group.querySelectorAll('.decision')
      const responses = contentDiv.querySelectorAll(`.choice-response[data-choice-group="${groupId}"]`)

      decisions.forEach(decision => {
        const handleClick = () => {
          const choiceValue = decision.getAttribute('data-choice-value')
          decisions.forEach(d => d.classList.remove('selected'))
          decision.classList.add('selected')
          
          responses.forEach(r => {
            if (r.getAttribute('data-choice-response') === choiceValue) {
              r.classList.add('active')
            } else {
              r.classList.remove('active')
            }
          })
        }
        decision.removeEventListener('click', decision._clickFn)
        decision._clickFn = handleClick
        decision.addEventListener('click', handleClick)
      })

      // Select first decision by default
      if (decisions[0]) decisions[0].click()
    })

    // Bind character avatar zoom modal
    const avatars = contentDiv.querySelectorAll('.character_avt')
    avatars.forEach(av => {
      const handleAvClick = () => {
        const fullSrc = av.getAttribute('data-full-image')
        if (fullSrc) {
          setModalData({ type: 'character', src: fullSrc })
        }
      }
      av.removeEventListener('click', av._clickFn)
      av._clickFn = handleAvClick
      av.addEventListener('click', handleAvClick)
    })

    // Bind background image zoom expand-icon
    const expandIcons = contentDiv.querySelectorAll('.background-wrapper .expand-icon')
    expandIcons.forEach(icon => {
      const handleIconClick = () => {
        const bgImg = icon.closest('.background-wrapper')?.querySelector('.background-image')
        if (bgImg) {
          setModalData({ type: 'background', src: bgImg.getAttribute('src') })
        }
      }
      icon.removeEventListener('click', icon._clickFn)
      icon._clickFn = handleIconClick
      icon.addEventListener('click', handleIconClick)
    })

    // Bind translator footnotes
    const notes = contentDiv.querySelectorAll('.translator-note')
    notes.forEach(note => {
      const handleNoteClick = (e) => {
        e.stopPropagation()
        setActiveNote({
          word: note.childNodes[0].textContent.trim(),
          content: note.getAttribute('data-note-content') || ''
        })
      }
      note.removeEventListener('click', note._clickFn)
      note._clickFn = handleNoteClick
      note.addEventListener('click', handleNoteClick)
    })

    // Scroll Triggers: BGM and SFX Playback triggers on viewport enter
    if (window.bgmManager) {
      window.bgmManager.setupScrollTriggers({ selector: '[data-bgm-id]', threshold: 0, rootMargin: '0px 0px -20% 0px' })
    }
    if (window.sfxManager) {
      window.sfxManager.init()
    }

    // Header dynamic title update on scroll past information card
    const handleScrollTitle = () => {
      const infoSection = document.getElementById('info')
      const headerName = document.querySelector('.header-dynamic-title')
      if (!infoSection || !headerName) return

      const storyTitle = story ? story.name : ''
      const eventTitle = eventData ? eventData.name : storyTitle
      const infoBottom = infoSection.offsetTop + infoSection.offsetHeight
      
      const shouldShowStoryTitle = window.scrollY >= (infoBottom - 64)
      headerName.textContent = shouldShowStoryTitle ? storyTitle : eventTitle
    }

    window.addEventListener('scroll', handleScrollTitle)
    return () => {
      window.removeEventListener('scroll', handleScrollTitle)
    }

  }, [htmlContent, story, eventData])

  // 4. Parallax Background Positioning effect
  useEffect(() => {
    let ticking = false
    const updateBackgroundPosition = () => {
      if (!contentRef.current) return
      const backgrounds = contentRef.current.querySelectorAll('.dialogue-background')
      backgrounds.forEach(bgElement => {
        const wrapper = bgElement.querySelector('.background-wrapper')
        if (!wrapper) return
        const rect = bgElement.getBoundingClientRect()
        const wrapperHeight = wrapper.offsetHeight
        const viewportHeight = window.innerHeight
        const maxTop = Math.max(0, (viewportHeight - wrapperHeight) / 2)
        const scrollThreshold = wrapperHeight / 20
        const progress = Math.min(1, Math.max(0, -rect.top / scrollThreshold))
        const topValue = progress * maxTop + 50
        wrapper.style.top = `${topValue}px`
      })
    }

    const handleScrollParallax = () => {
      if (!ticking) {
        ticking = true
        window.requestAnimationFrame(() => {
          updateBackgroundPosition()
          ticking = false
        })
      }
    }

    window.addEventListener('scroll', handleScrollParallax)
    window.addEventListener('resize', handleScrollParallax)
    updateBackgroundPosition()

    return () => {
      window.removeEventListener('scroll', handleScrollParallax)
      window.removeEventListener('resize', handleScrollParallax)
    }
  }, [htmlContent])

  // 5. Back to Top visibility controller
  useEffect(() => {
    const handleScrollBtn = () => setShowBackTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScrollBtn)
    return () => window.removeEventListener('scroll', handleScrollBtn)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  // Compute navigation indexes for Prev/Next
  const currentIndex = allStories.findIndex(s => s.story_id === id)
  const prevStory = currentIndex > 0 ? allStories[currentIndex - 1] : null
  const nextStory = currentIndex >= 0 && currentIndex < allStories.length - 1 ? allStories[currentIndex + 1] : null

  if (loading) {
    return (
      <div className="app-wrapper">
        <Header BASE_URL={BASE_URL} />
        <main className="main-layout text-center" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loading text="RESOLVING_STORY_RECORD_STREAM..." />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="app-wrapper">
        <Header BASE_URL={BASE_URL} />
        <main className="main-layout">
          <div className="redesign-container" style={{ padding: '4rem 2.5rem' }}>
            <div className="error-container">
              <p className="technical-text">SYS_ERROR: {error || 'Không tìm thấy dữ liệu truyện.'}</p>
              <Link to="/" className="btn-link" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                QUAY LẠI TRANG CHỦ
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app-wrapper">
      {/* Header with sidebar toggler */}
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        BASE_URL={BASE_URL}
      />

      {/* Main Layout containing Sidebar and Reader */}
      <div className="main-layout" onClick={() => setSidebarOpen(false)}>
        {/* Sidebar Chapter List */}
        <Sidebar
          title="SYS.STORY_CHAPTERS"
          sidebarOpen={sidebarOpen}
          items={allStories}
          selectedItemId={id}
          onItemSelect={(s) => navigate(`/story/${s.story_id}`)}
          itemKey="story_id"
          renderItem={(s) => (
            <div className="sidebar-chapter-item">
              <span className="technical-text" style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block' }}>
                CHAP // {s.display_order ?? '00'}
              </span>
              <span style={{ fontWeight: 500 }}>{s.name}</span>
            </div>
          )}
        />

        {/* Content Area */}
        <div className={`content-area story-page-wrapper ${sidebarOpen ? 'sidebar-active' : 'expanded'}`}>
          <div className="redesign-container story-reader-container page-fade-in">
            
            {/* Top Navigation / Breadcrumb */}
            <div className="story-breadcrumb technical-text">
              {eventData ? (
                <Link to={`/event/${eventData.event_id}`} className="story-back-link">
                  ← QUAY LẠI HỒ SƠ SỰ KIỆN: {eventData.name}
                </Link>
              ) : (
                <Link to="/" className="story-back-link">
                  ← VỀ TRANG CHỦ
                </Link>
              )}
            </div>

            {/* Dynamic header details overlay */}
            <div className="header-meta-bar panel-stripes">
              <span className="technical-text header-dynamic-title">
                {eventData?.name || story.name}
              </span>
            </div>

            {/* Story Information Intro Card */}
            <div id="info" className="story-intro-panel">
              <div className="story-intro-header">
                <div className="story-intro-meta technical-text">
                  SEC.STORY_NODE // ID: {story.story_id}
                </div>
                <h2 className="story-intro-title">{story.name}</h2>
              </div>
              {story.description && (
                <p className="story-intro-desc">{story.description}</p>
              )}
            </div>

            {/* Top Chapter Nav Buttons */}
            <div className="chapter-nav-buttons top-nav">
              <button 
                className="btn-chapter-nav" 
                disabled={!prevStory} 
                onClick={() => prevStory && navigate(`/story/${prevStory.story_id}`)}
              >
                ← CHƯƠNG TRƯỚC
              </button>
              <button 
                className="btn-chapter-nav" 
                disabled={!nextStory} 
                onClick={() => nextStory && navigate(`/story/${nextStory.story_id}`)}
              >
                CHƯƠNG SAU →
              </button>
            </div>

            {/* Core Story Dialogue Scroller */}
            <div id="story-content" ref={contentRef} dangerouslySetInnerHTML={{ __html: htmlContent }} />

            {/* Bottom Chapter Nav Buttons */}
            <div className="chapter-nav-buttons bottom-nav">
              <button 
                className="btn-chapter-nav" 
                disabled={!prevStory} 
                onClick={() => prevStory && navigate(`/story/${prevStory.story_id}`)}
              >
                ← CHƯƠNG TRƯỚC
              </button>
              <button 
                className="btn-chapter-nav" 
                disabled={!nextStory} 
                onClick={() => nextStory && navigate(`/story/${nextStory.story_id}`)}
              >
                CHƯƠNG SAU →
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Floating Action Buttons */}
      <div className="floating-controls-stack">
        {/* Quick Mute Action Button */}
        <button
          className={`floating-control-btn audio-toggle-btn ${isMuted ? 'is-muted' : ''}`}
          onClick={toggleMute}
          title={isMuted ? "Bật âm thanh (BGM & SFX)" : "Tắt toàn bộ âm thanh"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Back to top button */}
        <button
          className={`floating-control-btn back-to-top-btn ${showBackTop ? 'visible' : ''}`}
          onClick={scrollToTop}
          title="Cuộn lên đầu trang"
        >
          <ChevronUp size={20} />
        </button>
      </div>

      {/* Image Zoom Expand Modals */}
      {modalData && (
        <div className="image-zoom-overlay" onClick={() => setModalData(null)}>
          <div className="image-zoom-container" onClick={e => e.stopPropagation()}>
            <img className="image-zoom-src" src={modalData.src} alt={modalData.type} />
            <button className="image-zoom-close-btn" onClick={() => setModalData(null)}>×</button>
          </div>
        </div>
      )}

      {/* Footnote Translator Note Modal (Brutalist Drawer / Console Design) */}
      <Modal
        isOpen={!!activeNote}
        onClose={() => setActiveNote(null)}
        title="SEC.TRANSLATION_NOTE // CHÚ THÍCH DỊCH THUẬT"
        className="brutalist-note-modal"
      >
        <div className="brutalist-note-body">
          <div className="note-word-badge technical-text">{activeNote?.word}</div>
          <p className="note-explanation-content">{activeNote?.content}</p>
        </div>
      </Modal>
    </div>
  )
}
