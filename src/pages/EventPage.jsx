import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SupabaseAPI } from '../services/supabaseApi';
import styles from '../styles/EventPage.module.css';

function cx(classNames) {
  if (!classNames) return '';
  return String(classNames).split(' ').filter(Boolean).map(c => `${c} ${styles[c] || ''}`.trim()).join(' ').trim();
}

export default function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [arcRegionId, setArcRegionId] = useState(null);
  const [stories, setStories] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for Collapsible Sections
  const [charCollapsed, setCharCollapsed] = useState(false);
  const [galleryCollapsed, setGalleryCollapsed] = useState(false);

  // Sticky header state
  const [isStickyActive, setIsStickyActive] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'character' | 'gallery' | null
  const [modalData, setModalData] = useState({});
  const infoRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const ev = await SupabaseAPI.getEvent(id);
        if (ev) setEvent(ev);

        if (ev && ev.arc_id) {
          const arc = await SupabaseAPI.getArc(ev.arc_id);
          if (arc) setArcRegionId(arc.region_id);
        }

        const [st, ch, ga] = await Promise.all([
          SupabaseAPI.getStoriesByEvent(id),
          SupabaseAPI.getCharactersByEvent(id),
          SupabaseAPI.getGalleryByEvent(id)
        ]);

        const AVATAR_FALLBACK = '/assets/images/character/blank.png';
        const formattedCharacters = ch.map((c, index) => ({
          id: c.character_id || `char-${index}`,
          name: c.name,
          avatar: c.avatar_url || AVATAR_FALLBACK,
          fullImage: c.image_url || AVATAR_FALLBACK,
          description: c.description
        }));

        const formattedGallery = ga.map((g, index) => ({
          id: g.gallery_id || `img-${index}`,
          title: g.title,
          image: g.image_url || '/assets/images/icon/default.png'
        }));

        setStories(st);
        setCharacters(formattedCharacters);
        setGallery(formattedGallery);

        if (ev) document.title = `${ev.name} - Arknights Story Reader VN`;
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

  if (loading) return <main><div className={cx("container")}><div className={cx("loading-placeholder")}>Đang tải...</div></div></main>;
  if (error) return <main><div className={cx("container")}><p className={cx("error-message")}>{error}</p></div></main>;
  if (!event) return <main><div className={cx("container")}><p className={cx("no-data")}>Không tìm thấy sự kiện.</p></div></main>;

  return (
    <>
      <main>
        <div className={cx("container")}>
          {arcRegionId && (
            <Link className={cx("back-to-region-btn")} to={`/region/${arcRegionId}`} aria-label="Quay lại trang region">
              ← Quay lại Region
            </Link>
          )}

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
