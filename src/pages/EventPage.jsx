import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { SupabaseAPI } from '../services/supabaseApi';
import { getAssetUrl } from '../utils/assetUtils';
import styles from '../styles/EventPage.module.css';

function cx(classNames) {
  if (!classNames) return '';
  return String(classNames).split(' ').filter(Boolean).map(c => `${c} ${styles[c] || ''}`.trim()).join(' ').trim();
}

export default function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [arcRegionId, setArcRegionId] = useState(null);
  const [regionName, setRegionName] = useState('');
  const [stories, setStories] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation state
  const [prevEvent, setPrevEvent] = useState(null);
  const [nextEvent, setNextEvent] = useState(null);

  // Sidebar state
  const [sidebarActive, setSidebarActive] = useState(false);
  const [sidebarData, setSidebarData] = useState([]); // Array of { arc, events, suggestions }

  // States for Collapsible Sections
  const [charCollapsed, setCharCollapsed] = useState(false);
  const [galleryCollapsed, setGalleryCollapsed] = useState(false);

  // Sticky header state
  const [isStickyActive, setIsStickyActive] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'character' | 'gallery' | null
  const [modalData, setModalData] = useState({});
  const infoRef = useRef(null);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarActive(false);
  }, [id]);

  // Listen for header toggle event
  useEffect(() => {
    const handleToggle = () => setSidebarActive(prev => !prev);
    window.addEventListener('toggleEventSidebar', handleToggle);
    return () => window.removeEventListener('toggleEventSidebar', handleToggle);
  }, []);

  // Cache: track which region's sidebar data we already have
  const sidebarRegionRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      // Only show full loading on first visit (no event data yet)
      if (!event) setLoading(true);

      try {
        // Phase 1: Fetch event + its content in parallel
        const [ev, st, ch, ga] = await Promise.all([
          SupabaseAPI.getEvent(id),
          SupabaseAPI.getStoriesByEvent(id),
          SupabaseAPI.getCharactersByEvent(id),
          SupabaseAPI.getGalleryByEvent(id)
        ]);

        if (ev) {
          setEvent(ev);
          document.title = `${ev.name} - Civilight Eterna Database`;
        }

        const AVATAR_FALLBACK = '/assets/images/character/blank.png';
        setStories(st);
        setCharacters(ch.map((c, index) => ({
          id: c.character_id || `char-${index}`,
          name: c.name,
          avatar: getAssetUrl(c.avatar_url || AVATAR_FALLBACK),
          fullImage: getAssetUrl(c.image_url || AVATAR_FALLBACK),
          description: c.description
        })));
        setGallery(ga.map((g, index) => ({
          id: g.gallery_id || `img-${index}`,
          title: g.title,
          image: getAssetUrl(g.image_url || '/assets/images/icon/default.png')
        })));

        // Phase 2: Arc/Region info + sidebar (only if region changed)
        let currentRegionId = arcRegionId;

        if (ev && ev.arc_id) {
          const arc = await SupabaseAPI.getArc(ev.arc_id);
          if (arc) {
            currentRegionId = arc.region_id;
            setArcRegionId(currentRegionId);

            // Only fetch region name if it changed
            if (currentRegionId !== sidebarRegionRef.current) {
              const region = await SupabaseAPI.getRegion(currentRegionId);
              if (region) setRegionName(region.name);
            }
          }
        }

        // Only rebuild sidebar if region changed (expensive operation)
        if (currentRegionId && currentRegionId !== sidebarRegionRef.current) {
          sidebarRegionRef.current = currentRegionId;

          const allArcs = await SupabaseAPI.getArcsByRegion(currentRegionId);
          const allEvents = await SupabaseAPI.getEvents();
          const eventLookup = Object.fromEntries(allEvents.map(e => [e.event_id, e]));

          const arcsData = await Promise.all(allArcs.map(async (arc) => {
            let events = [];
            let suggestions = [];
            try {
              events = await SupabaseAPI.getEventsByArc(arc.arc_id);
            } catch (e) {
              console.error(e);
            }
            try {
              suggestions = await SupabaseAPI.getSuggestionsByArc(arc.arc_id);
            } catch (e) {
              // Suggestions might not exist, that's okay
            }

            const formattedSuggestions = suggestions.map(s => ({
              ...s,
              targetEvent: eventLookup[s.target_event_id] || null
            }));

            const suggestionsByPos = new Map();
            formattedSuggestions.forEach(s => {
              if (!suggestionsByPos.has(s.position)) suggestionsByPos.set(s.position, []);
              suggestionsByPos.get(s.position).push(s);
            });

            return { ...arc, events, suggestionsByPos };
          }));

          setSidebarData(arcsData);
        }

        // Always recompute prev/next from cached sidebar data
        // Use a callback to access the latest sidebarData
        setSidebarData(prevData => {
          const flatEvents = prevData.flatMap(a => a.events);
          const currentIdx = flatEvents.findIndex(e => e.event_id === id);
          setPrevEvent(currentIdx > 0 ? flatEvents[currentIdx - 1] : null);
          setNextEvent(currentIdx < flatEvents.length - 1 ? flatEvents[currentIdx + 1] : null);
          return prevData; // don't modify the data
        });

      } catch (err) {
        console.error('Error loading event:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  useEffect(() => {
    if (!event) return;

    const updateStickyState = () => {
      const infoSection = infoRef.current;
      if (!infoSection) return;
      const globalHeader = document.querySelector('header');
      const headerHeight = globalHeader ? globalHeader.offsetHeight : 0;
      const infoBottom = infoSection.offsetTop + infoSection.offsetHeight;
      const shouldShow = window.scrollY >= (infoBottom - headerHeight);
      setIsStickyActive(shouldShow);

      window.dispatchEvent(new CustomEvent('headerStickyChange', {
        detail: { title: event.name, isActive: shouldShow }
      }));
    };

    window.addEventListener('scroll', updateStickyState);
    window.addEventListener('resize', updateStickyState);
    requestAnimationFrame(updateStickyState);

    return () => {
      window.removeEventListener('scroll', updateStickyState);
      window.removeEventListener('resize', updateStickyState);
      window.dispatchEvent(new CustomEvent('headerStickyChange', {
        detail: { title: '', isActive: false }
      }));
    };
  }, [event]);

  const openModal = (type, data) => {
    setActiveModal(type);
    setModalData(data);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData({});
    document.body.style.overflow = '';
  };

  const closeSidebar = () => {
    setSidebarActive(false);
  };

  // Build the event link with region query param
  const buildEventLink = (eventId) => {
    return `/event/${eventId}`;
  };

  const renderSidebarItems = (arc) => {
    const elements = [];
    const insertedPositions = new Set();

    arc.events.forEach((ev, index) => {
      // Look for suggestions to insert before or at this position
      arc.suggestionsByPos.forEach((suggs, pos) => {
        if (!insertedPositions.has(pos) && pos <= index) {
          suggs.forEach((s, idx) => {
            elements.push(
              <li key={`sug_side_${arc.arc_id}_${pos}_${idx}`}>
                <Link
                  className={cx("sidebar-event-item sidebar-suggestion")}
                  to={buildEventLink(s.target_event_id)}
                  onClick={closeSidebar}
                >
                  Gợi ý: {s.targetEvent ? s.targetEvent.name : 'Sự kiện liên quan'}
                </Link>
              </li>
            );
          });
          insertedPositions.add(pos);
        }
      });

      // Render the current event
      elements.push(
        <li key={ev.event_id}>
          <Link
            className={cx(`sidebar-event-item ${ev.event_id === id ? 'active' : ''}`)}
            to={buildEventLink(ev.event_id)}
            onClick={closeSidebar}
          >
            {ev.name}
          </Link>
        </li>
      );
    });

    // Render remaining suggestions at the end
    arc.suggestionsByPos.forEach((suggs, pos) => {
      if (!insertedPositions.has(pos)) {
        suggs.forEach((s, idx) => {
          elements.push(
            <li key={`sug_side_end_${arc.arc_id}_${pos}_${idx}`}>
              <Link
                className={cx("sidebar-event-item sidebar-suggestion")}
                to={buildEventLink(s.target_event_id)}
                onClick={closeSidebar}
              >
                Gợi ý: {s.targetEvent ? s.targetEvent.name : 'Sự kiện liên quan'}
              </Link>
            </li>
          );
        });
        insertedPositions.add(pos);
      }
    });

    return elements;
  }

  if (loading) return <main><div className={cx("container")}><div className={cx("loading-placeholder")}>Đang tải...</div></div></main>;
  if (error) return <main><div className={cx("container")}><p className={cx("error-message")}>{error}</p></div></main>;
  if (!event) return <main><div className={cx("container")}><p className={cx("no-data")}>Không tìm thấy sự kiện.</p></div></main>;

  return (
    <>
      <main>
        <div className={cx("container")}>
          {/* Top Navigation Bar */}
          <div className={cx("top-nav")}>
            {prevEvent ? (
              <Link className={cx("nav-btn nav-prev")} to={buildEventLink(prevEvent.event_id)}>
                <span className={cx("nav-arrow")}>←</span>
                <span className={cx("nav-label")}>{prevEvent.name}</span>
              </Link>
            ) : (
              <div className={cx("nav-btn nav-placeholder")} />
            )}

            {arcRegionId ? (
              <Link className={cx("nav-btn nav-center")} to={`/region/${arcRegionId}`}>
                Về {regionName || 'Region'}
              </Link>
            ) : (
              <div className={cx("nav-btn nav-placeholder")} />
            )}

            {nextEvent ? (
              <Link className={cx("nav-btn nav-next")} to={buildEventLink(nextEvent.event_id)}>
                <span className={cx("nav-label")}>{nextEvent.name}</span>
                <span className={cx("nav-arrow")}>→</span>
              </Link>
            ) : (
              <div className={cx("nav-btn nav-placeholder")} />
            )}
          </div>

          <div id="info" ref={infoRef}>
            <h2 className={cx("info-title")}>{event.name}</h2>
            <p className={cx("info-description")}>{event.description}</p>
          </div>

          <div className={cx("story-selection-panel selection-grid")}>
            {stories.length === 0 ? (
              <p className={cx("no-data")}>Chưa có truyện cho sự kiện này.</p>
            ) : (
              stories.map(story => (
                <Link key={story.story_id} to={`/story/${story.story_id}`} className={cx("selection-panel-item")}>
                  {story.name}
                </Link>
              ))
            )}
          </div>

          {/* Characters Section */}
          <section className={cx("collapsible-section character-section")}>
            <div className={cx("collapsible-header")} onClick={() => setCharCollapsed(!charCollapsed)}>
              <h3 className={cx("section-title")}>Nhân Vật</h3>
              <button className={cx("toggle-btn")} aria-expanded={!charCollapsed}>
                <span className={cx("toggle-icon")}>-</span>
              </button>
            </div>
            <div className={cx(`collapsible-content character-list ${charCollapsed ? 'collapsed' : ''}`)}>
              {characters.map(char => (
                <div key={char.id} className={cx("character-card")} onClick={() => openModal('character', char)}>
                  <img src={char.avatar} alt={char.name} className={cx("character-avatar")} />
                  <p className={cx("character-name")}>{char.name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Gallery Section */}
          <section className={cx("collapsible-section gallery-section")}>
            <div className={cx("collapsible-header")} onClick={() => setGalleryCollapsed(!galleryCollapsed)}>
              <h3 className={cx("section-title")}>Thư Viện</h3>
              <button className={cx("toggle-btn")} aria-expanded={!galleryCollapsed}>
                <span className={cx("toggle-icon")}>-</span>
              </button>
            </div>
            <div className={cx(`collapsible-content gallery ${galleryCollapsed ? 'collapsed' : ''}`)}>
              {gallery.map(item => (
                <div key={item.id} className={cx("gallery-item")} onClick={() => openModal('gallery', item)}>
                  <img src={item.image} alt={item.title} className={cx("gallery-image")} />
                  <div className={cx("gallery-label")}>{item.title}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Event Sidebar */}
      <div className={cx(`event-sidebar ${sidebarActive ? 'active' : ''}`)}>
        <div className={cx("sidebar-header")}>
          <h2>Sự Kiện</h2>
          <button className={cx("sidebar-close-btn")} onClick={closeSidebar} aria-label="Đóng">×</button>
        </div>
        <div className={cx("sidebar-content")}>
          {sidebarData.map(arc => (
            <div key={arc.arc_id} className={cx("sidebar-arc-group")}>
              <h4 className={cx("sidebar-arc-title")}>{arc.name}</h4>
              <ul className={cx("sidebar-event-list")}>
                {renderSidebarItems(arc)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Overlay */}
      <div
        className={cx(`sidebar-overlay ${sidebarActive ? 'active' : ''}`)}
        onClick={closeSidebar}
      />

      {/* Character Modal */}
      <div className={cx(`modal character-modal ${activeModal === 'character' ? 'active' : ''}`)} aria-hidden={activeModal !== 'character'} role="dialog">
        <div className={cx("modal-overlay")} onClick={closeModal}></div>
        <div className={cx("modal-container")}>
          <button className={cx("modal-close")} onClick={closeModal} aria-label="Close">x</button>
          <img className={cx("modal-image")} src={modalData.fullImage || ''} alt={modalData.name || ''} />
          <div className={cx("modal-info")}>
            <h3 className={cx("modal-title")}>{modalData.name}</h3>
            <p className={cx("modal-description")}>{modalData.description}</p>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      <div className={cx(`modal gallery-modal ${activeModal === 'gallery' ? 'active' : ''}`)} aria-hidden={activeModal !== 'gallery'} role="dialog">
        <div className={cx("modal-overlay")} onClick={closeModal}></div>
        <div className={cx("modal-container")}>
          <button className={cx("modal-close")} onClick={closeModal} aria-label="Close">x</button>
          <img className={cx("modal-image")} src={modalData.image || ''} alt={modalData.title || ''} />
          <div className={cx("modal-info")}>
            <h3 className={cx("modal-title")}>{modalData.title}</h3>
          </div>
        </div>
      </div>
    </>
  );
}
