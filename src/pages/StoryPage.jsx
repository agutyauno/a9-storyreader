import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { SupabaseAPI } from '../services/supabaseApi';
import { StoryRenderer } from '../utils/storyRenderer';
import { BGMManager, SFXManager } from '../utils/audioManager';
import { mockStoryData } from '../utils/mockStoryData';
import styles from '../styles/StoryPage.module.css';

export default function StoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [story, setStory] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [allStories, setAllStories] = useState([]);
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Sidebar
  const [sidebarActive, setSidebarActive] = useState(false);
  const [modalData, setModalData] = useState(null); // { type: 'character'|'background', src: '' }

  // Audio State
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioVolume, setAudioVolume] = useState(100);
  const contentRef = useRef(null);

  useEffect(() => {
    async function fetchStoryData() {
      // Handle preview mode
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.get('preview')) {
        const raw = sessionStorage.getItem('preview_story');
        if (raw) {
          const previewStory = JSON.parse(raw);
          setStory(previewStory);
          setHtmlContent(StoryRenderer.render(previewStory.story_content, styles));
          setLoading(false);
          return;
        }
      }

      if (!id) return;

      try {
        // OVERRIDE FOR TESTING MOCK DATA
        // const fetchedStory = await SupabaseAPI.getStory(id);
        const fetchedStory = mockStoryData;

        if (!fetchedStory) {
          setError('Không tìm thấy truyện.');
          setLoading(false);
          return;
        }

        setStory(fetchedStory);
        document.title = `${fetchedStory.name} - Arknights Story Reader`;

        if (fetchedStory.event_id) {
          const ev = await SupabaseAPI.getEvent(fetchedStory.event_id);
          setEventData(ev);
          const stories = await SupabaseAPI.getStoriesByEvent(fetchedStory.event_id);
          setAllStories(stories);
        }

        setHtmlContent(StoryRenderer.render(fetchedStory.story_content, styles));
      } catch (err) {
        console.error(err);
        setError('Đã xảy ra lỗi khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    }

    fetchStoryData();

    // Cleanup audio on unmount
    return () => {
      if (window.bgmManager) window.bgmManager.stop();
    };
  }, [id, location.search]);

  // Audio Sync setup
  useEffect(() => {
    const handleAudioEvent = (e) => {
      setAudioEnabled(e.detail.isEnabled);
      setAudioVolume(e.detail.volume * 100);
    };
    window.addEventListener('audioStateChange', handleAudioEvent);
    return () => window.removeEventListener('audioStateChange', handleAudioEvent);
  }, []);

  const toggleAudio = () => {
    if (window.bgmManager) window.bgmManager.toggleEnabled();
  };

  const changeVolume = (e) => {
    const val = parseInt(e.target.value, 10);
    if (window.bgmManager) window.bgmManager.setVolume(val / 100);
  };

  // Re-run DOM manipulator effects when HTML content updates
  useEffect(() => {
    if (!htmlContent || !contentRef.current) return;

    const contentDiv = contentRef.current;

    // 1. Nickname substitution
    const docInput = document.getElementById('dr-nickname-input');
    const updateNickname = () => {
      const nickname = docInput?.value.trim() || '';
      localStorage.setItem('doctor_nickname', nickname);
      // We manually traverse text nodes inside contentRef like the legacy script:
      const walker = document.createTreeWalker(contentDiv, NodeFilter.SHOW_TEXT, null);
      let node;
      const nodesToUpdate = [];
      while (node = walker.nextNode()) {
        if (node.textContent.includes('Dr.@nickname') || node.originalText) {
          if (!node.originalText) node.originalText = node.textContent;
          nodesToUpdate.push(node);
        }
      }
      nodesToUpdate.forEach(n => {
        n.textContent = nickname ? n.originalText.replace(/Dr\.@nickname/g, `Dr. ${nickname}`) : n.originalText;
      });
    };
    if (docInput) {
      const saved = localStorage.getItem('doctor_nickname');
      if (saved) {
        docInput.value = saved;
        updateNickname();
      }
      docInput.addEventListener('input', updateNickname);
    }

    // 2. Decision Choices
    const decisionGroups = contentDiv.querySelectorAll(`.${styles['decision-group'] || 'decision-group'}`);
    decisionGroups.forEach(group => {
      const groupId = group.getAttribute('data-choice-group');
      const decisions = group.querySelectorAll(`.${styles['decision'] || 'decision'}`);
      const responses = contentDiv.querySelectorAll(`.${styles['choice-response'] || 'choice-response'}[data-choice-group="${groupId}"]`);
      decisions.forEach(decision => {
        decision.addEventListener('click', () => {
          const choiceValue = decision.getAttribute('data-choice-value');
          decisions.forEach(d => d.classList.remove(styles['selected'] || 'selected'));
          decision.classList.add(styles['selected'] || 'selected');
          responses.forEach(r => {
            if (r.getAttribute('data-choice-response') === choiceValue) r.classList.add(styles['active'] || 'active');
            else r.classList.remove(styles['active'] || 'active');
          });
        });
      });
      if (decisions[0]) decisions[0].click();
    });

    // 3. Modals for Character Avatar and Background Exapnds
    const avatars = contentDiv.querySelectorAll(`.${styles['character_avt'] || 'character_avt'}`);
    avatars.forEach(av => {
      av.addEventListener('click', () => {
        let src = av.getAttribute('src');
        if (!src || src.includes('blank.png')) return;
        let fullSrc = av.getAttribute('data-full-image') || src.replace('_avatar.webp', '.png').replace('_avatar.png', '.png');
        setModalData({ type: 'character', src: fullSrc });
      });
    });

    const expIcons = contentDiv.querySelectorAll(`.${styles['background-wrapper'] || 'background-wrapper'} .${styles['expand-icon'] || 'expand-icon'}`);
    expIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        const bgImg = icon.closest(`.${styles['background-wrapper'] || 'background-wrapper'}`).querySelector(`.${styles['background-image'] || 'background-image'}`);
        if (bgImg) {
          setModalData({ type: 'background', src: bgImg.getAttribute('src') });
        }
      });
    });

    // 4. BGM & SFX scroll triggers
    if (window.bgmManager) {
      window.bgmManager.setupScrollTriggers({ selector: '[data-bgm-id]', threshold: 0, rootMargin: '0px 0px -20% 0px' });
    }
    if (window.sfxManager) {
      window.sfxManager.init();
    }

    // 5. Header title changing dynamically based on scroll
    const updateHeaderTitle = () => {
      const infoSection = document.getElementById('info');
      const headerName = document.querySelector(`.${styles['header-name'] || 'header-name'}`);
      const globalHeader = document.querySelector('header');

      if (!infoSection || !headerName) return;

      const originalTitle = eventData ? eventData.name : (story ? story.name : '');
      const storyTitle = story ? story.name : '';

      const headerHeight = globalHeader ? globalHeader.offsetHeight : 0;
      const infoBottom = infoSection.offsetTop + infoSection.offsetHeight;
      const shouldShowStoryTitle = window.scrollY >= (infoBottom - headerHeight);

      headerName.textContent = shouldShowStoryTitle ? storyTitle : originalTitle;
    };
    window.addEventListener('scroll', updateHeaderTitle);

    return () => {
      window.removeEventListener('scroll', updateHeaderTitle);
    };

  }, [htmlContent, story, eventData]);

  // Parallax Effect
  useEffect(() => {
    let ticking = false;
    const updateBackgroundPosition = () => {
      if (!contentRef.current) return;
      const dialogueSections = contentRef.current.querySelectorAll(`.${styles['dialogue-section'] || 'dialogue-section'}`);
      dialogueSections.forEach(section => {
        const wrapper = section.querySelector(`.${styles['background-wrapper'] || 'background-wrapper'}`);
        if (!wrapper) return;
        const rect = section.getBoundingClientRect();
        const wrapperHeight = wrapper.offsetHeight;
        const viewportHeight = window.innerHeight;
        const maxTop = Math.max(0, (viewportHeight - wrapperHeight) / 2);
        const scrollThreshold = wrapperHeight / 20;
        const progress = Math.min(1, Math.max(0, -rect.top / scrollThreshold));
        const topValue = progress * maxTop + 50;
        wrapper.style.top = `${topValue}px`;
      });
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          updateBackgroundPosition();
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    updateBackgroundPosition();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [htmlContent]);

  // Back To Top
  const [showBackTop, setShowBackTop] = useState(false);
  useEffect(() => {
    const handleScrollTop = () => setShowBackTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScrollTop);
    return () => window.removeEventListener('scroll', handleScrollTop);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Render navigation buttons
  const currentIndex = allStories.findIndex(s => s.story_id === id);
  const prevStory = currentIndex > 0 ? allStories[currentIndex - 1] : null;
  const nextStory = currentIndex >= 0 && currentIndex < allStories.length - 1 ? allStories[currentIndex + 1] : null;

  if (loading) return <main><div className={styles['container']}><div className={styles['loading-placeholder']}>Đang tải...</div></div></main>;
  if (error) return <main><div className={styles['container']}><div className={styles['error-message']}>{error}</div></div></main>;
  if (!story) return null;

  return (
    <>
      <header>
        <div id="story_page-header" className={styles['story_page-header']}>
          <Link to="/">
            <img className={styles['header-logo']} src="/assets/images/icon/dreambind castle.png" alt="Home" />
          </Link>
          <Link id="header-event-link" to={story.event_id ? `/event/${story.event_id}` : '#'} className={styles['header-name-link']}>
            <h1 className={styles['header-name']}>{eventData?.name || story.name}</h1>
          </Link>

          <div className={styles['header-right-controls']}>
            <div id="audio-controls" className={styles['audio-controls']}>
              <button id="audio-toggle" className={`${styles['audio-btn']} ${!audioEnabled ? styles['muted'] : ''}`} onClick={toggleAudio}>
                <span id="audio-icon" className={styles['audio-icon']}>{audioEnabled ? '🔊' : '🔇'}</span>
              </button>
              <div className={styles['volume-slider-container']}>
                <input
                  type="range"
                  id="volume-slider"
                  className={styles['volume-slider']}
                  min="0"
                  max="100"
                  value={audioVolume}
                  onChange={changeVolume}
                />
              </div>
            </div>

            <button id="sidebar-toggle" className={styles['sidebar-toggle-btn']} onClick={() => setSidebarActive(true)}>
              <img src="/assets/images/web icon/list.png" alt="List" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div id="chapter-sidebar" className={`${styles['chapter-sidebar']} ${sidebarActive ? styles['active'] : ''}`}>
        <div className={styles['sidebar-header']}>
          <h2>Danh sách chương</h2>
        </div>
        <div className={styles['sidebar-content']}>
          <ul className={styles['chapter-list']}>
            {allStories.map(s => (
              <li key={s.story_id}>
                <Link to={`/story/${s.story_id}`} className={`${styles['chapter-item']} ${s.story_id === id ? styles['active'] : ''}`}>
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        id="sidebar-overlay"
        className={`${styles['sidebar-overlay']} ${sidebarActive ? styles['active'] : ''}`}
        onClick={() => setSidebarActive(false)}
      />

      {/* Modals */}
      {modalData && (
        <div id={`${modalData.type}-modal`} className={`${styles['image-modal']} ${styles['active']}`} onClick={() => setModalData(null)}>
          <div className={styles['modal-content']} onClick={e => e.stopPropagation()}>
            <img className={styles['modal-image']} src={modalData.src} alt={modalData.type} />
            <button style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }} onClick={() => setModalData(null)}>x</button>
          </div>
        </div>
      )}

      <main>
        <div className={styles['container']}>
          <div id="info" className={styles['info']}>
            <div className={styles['info-header']}>
              <p id="dr-name" className={styles['dr-name']}>Dr. <input type="text" id="dr-nickname-input" placeholder="@nickname" /></p>
              <h2 className={styles['info-title']}>{story.name}</h2>
            </div>
            <p className={styles['info-description']}>{story.description}</p>
          </div>

          <div id="story-content" ref={contentRef} dangerouslySetInnerHTML={{ __html: htmlContent }} />

          <div className={styles['switch-chapter-button']}>
            <button className={styles['prevous']} disabled={!prevStory} onClick={() => prevStory && navigate(`/story/${prevStory.story_id}`)}>Chương trước</button>
            <button className={styles['next']} disabled={!nextStory} onClick={() => nextStory && navigate(`/story/${nextStory.story_id}`)}>Chương sau</button>
          </div>
        </div>
      </main>

      <button
        id="back-to-top"
        className={`${styles['back-to-top']} ${showBackTop ? styles['visible'] : ''}`}
        onClick={scrollToTop}
      >
        <span style={{ fontSize: '24px', color: '#fff' }}>&#8593;</span>
      </button>
    </>
  );
}
