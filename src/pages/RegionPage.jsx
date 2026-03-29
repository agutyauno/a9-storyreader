import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SupabaseAPI } from '../services/supabaseApi';
import { getAssetUrl } from '../utils/assetUtils';
import styles from '../styles/RegionPage.module.css';

function cx(classNames) {
  if (!classNames) return '';
  return String(classNames).split(' ').filter(Boolean).map(c => `${c} ${styles[c] || ''}`.trim()).join(' ').trim();
}

export default function RegionPage() {
  const { id } = useParams();
  const [region, setRegion] = useState(null);
  const [arcsWithEvents, setArcsWithEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStickyActive, setIsStickyActive] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const reg = await SupabaseAPI.getRegion(id);
        if (reg) {
          setRegion(reg);
          document.title = `${reg.name} - A9 StoryReader`;
        }

        const arcs = await SupabaseAPI.getArcsByRegion(id);

        // Fetch all events once for name lookup in suggestions
        const allEvents = await SupabaseAPI.getEvents();
        const eventLookup = Object.fromEntries(allEvents.map(e => [e.event_id, e]));

        const arcsData = await Promise.all(arcs.map(async (arc) => {
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
            console.error(e);
          }

          // Format suggestions into a map for easier rendering
          const suggestionsByPos = new Map();
          suggestions.forEach(s => {
            if (!suggestionsByPos.has(s.position)) suggestionsByPos.set(s.position, []);
            suggestionsByPos.get(s.position).push({
              ...s,
              targetEvent: eventLookup[s.target_event_id] || null
            });
          });

          return { ...arc, events, suggestionsByPos };
        }));

        setArcsWithEvents(arcsData);
      } catch (err) {
        console.error('Error loading region:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  useEffect(() => {
    if (!region) return;

    const updateStickyState = () => {
      const infoSection = document.getElementById('info');
      if (!infoSection) return;
      const globalHeader = document.querySelector('header');
      const headerHeight = globalHeader ? globalHeader.offsetHeight : 0;
      const infoBottom = infoSection.offsetTop + infoSection.offsetHeight;
      const shouldShow = window.scrollY >= (infoBottom - headerHeight);
      setIsStickyActive(shouldShow);

      window.dispatchEvent(new CustomEvent('headerStickyChange', {
        detail: { title: region.name, isActive: shouldShow }
      }));
    };

    window.addEventListener('scroll', updateStickyState);
    window.addEventListener('resize', updateStickyState);
    // Run once after render
    requestAnimationFrame(updateStickyState);

    return () => {
      window.removeEventListener('scroll', updateStickyState);
      window.removeEventListener('resize', updateStickyState);
      window.dispatchEvent(new CustomEvent('headerStickyChange', {
        detail: { title: '', isActive: false }
      }));
    };
  }, [region]);

  const renderEventsWithSuggestions = (arc) => {
    if (!arc.events || arc.events.length === 0) {
      return <p className={cx("no-data")}>Chưa có sự kiện.</p>;
    }

    const elements = [];
    const insertedPositions = new Set();
    const regionParam = id ? `?region=${id}` : '';

    arc.events.forEach((event, index) => {
      // Insert suggestions before or at this position
      arc.suggestionsByPos.forEach((suggs, pos) => {
        if (!insertedPositions.has(pos) && pos <= index) {
          suggs.forEach((s, idx) => {
            elements.push(
              <div key={`sug_before_${pos}_${idx}`} className={cx("arc-suggestion")}>
                <Link to={`/event/${s.target_event_id}${regionParam}`} className={cx("suggestion-text")}>
                  {s.targetEvent ? `Gợi ý: ${s.targetEvent.name}` : 'Sự kiện liên quan'}
                </Link>
              </div>
            );
          });
          insertedPositions.add(pos);
        }
      });

      // Insert the actual event
      elements.push(
        <Link key={event.event_id} className={cx("selection-panel-item")} to={`/event/${event.event_id}${regionParam}`}>
          <img src={getAssetUrl(event.image_url || '/assets/images/icon/default.png')} alt={event.name} />
          <div className={cx("selection-content")}>
            <p className={cx("event_name name")}>{event.name}</p>
            <p className={cx("event_description description")}>{event.description || ''}</p>
          </div>
        </Link>
      );
    });

    // Insert remaining suggestions at the end
    arc.suggestionsByPos.forEach((suggs, pos) => {
      if (!insertedPositions.has(pos)) {
        suggs.forEach((s, idx) => {
          elements.push(
            <div key={`sug_end_${pos}_${idx}`} className={cx("arc-suggestion")}>
              <Link to={`/event/${s.target_event_id}${regionParam}`} className={cx("suggestion-text")}>
                {s.targetEvent ? `Gợi ý: ${s.targetEvent.name}` : 'Sự kiện liên quan'}
              </Link>
            </div>
          );
        });
        insertedPositions.add(pos);
      }
    });

    return elements;
  };

  if (loading) return <main><div className={cx("container")}><div className={cx("loading-placeholder")}>Đang tải...</div></div></main>;
  if (error) return <main><div className={cx("container")}><p className={cx("error-message")}>{error}</p></div></main>;
  if (!region) return <main><div className={cx("container")}><p className={cx("no-data")}>Không tìm thấy khu vực.</p></div></main>;

  return (
    <>
      <main>
        <div className={cx("container")}>
          <div id="info">
            <h2 className={cx("info-title")}>{region.name}</h2>
            <p className={cx("info-description")}>{region.description}</p>
          </div>

          <div id="event_selection-panel" className={cx("arc-sections-container")}>
            {arcsWithEvents.length === 0 ? (
              <p className={cx("no-data")}>Chưa có dữ liệu cho khu vực này.</p>
            ) : (
              arcsWithEvents.map(arc => (
                <article key={arc.arc_id} className={cx("arc-section")}>
                  <div className={cx("arc-header")}>
                    <div className={cx("arc-info")}>
                      <h3 className={cx("arc-name")}>{arc.name || ''}</h3>
                    </div>
                    <p className={cx("arc-description")}>{arc.description || ''}</p>
                  </div>
                  <div className={cx("arc-items")}>
                    {renderEventsWithSuggestions(arc)}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
