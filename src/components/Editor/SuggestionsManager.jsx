import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Loader, ChevronDown } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import styles from './SuggestionsManager.module.css';

/**
 * Manages "Next Event Suggestions" for a specific Arc.
 * `position` = the event index (1-based) in the arc after which the suggestion is shown.
 * e.g. position=2 means "show this suggestion after the 2nd event of the arc".
 */
export default function SuggestionsManager({ arcId, showNotification }) {
    const [suggestions, setSuggestions] = useState([]);
    const [arcEvents, setArcEvents] = useState([]);     // Events of this arc (for position selector)
    const [allEvents, setAllEvents] = useState([]);     // All events (for suggestion target picker)
    const [loading, setLoading] = useState(true);
    const [showSelector, setShowSelector] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    // When adding a suggestion: which position to place it after
    const [selectedPosition, setSelectedPosition] = useState(1);

    useEffect(() => {
        if (arcId) fetchData();
    }, [arcId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [suggs, arcEvs, allEvs] = await Promise.all([
                SupabaseAPI.getSuggestionsByArc(arcId),
                SupabaseAPI.getEventsByArc(arcId),
                SupabaseAPI.getEvents()
            ]);
            setSuggestions(suggs);
            setArcEvents(arcEvs);
            setAllEvents(allEvs);
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
            showNotification?.('Failed to load suggestions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (targetEvent) => {
        // Check duplicate at same position
        if (suggestions.find(s => s.target_event_id === targetEvent.event_id && s.position === selectedPosition)) {
            showNotification?.('Sự kiện này đã được gợi ý tại vị trí này', 'warning');
            return;
        }
        try {
            await SupabaseAPI.createSuggestion({
                arc_id: arcId,
                target_event_id: targetEvent.event_id,
                position: selectedPosition
            });
            await fetchData();
            showNotification?.('Đã thêm gợi ý');
            setShowSelector(false);
            setSearchQuery('');
        } catch (err) {
            console.error('Add suggestion failed:', err);
            showNotification?.('Thêm gợi ý thất bại', 'error');
        }
    };

    const handleDelete = async (suggestionId) => {
        try {
            await SupabaseAPI.deleteSuggestion(suggestionId);
            setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
            showNotification?.('Đã xoá gợi ý');
        } catch (err) {
            console.error('Delete suggestion failed:', err);
            showNotification?.('Xoá gợi ý thất bại', 'error');
        }
    };

    // Group suggestions by position
    const groupedByPos = {};
    suggestions.forEach(s => {
        if (!groupedByPos[s.position]) groupedByPos[s.position] = [];
        groupedByPos[s.position].push(s);
    });

    // All arc event positions (1..N) for display
    const arcEventPositions = arcEvents.map((ev, idx) => ({ ...ev, posIndex: idx + 1 }));

    const filteredTargets = allEvents.filter(e =>
    (e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.event_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return <div className={styles.loading}><Loader className={styles.spinner} size={16} /> Đang tải gợi ý...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Gợi ý sự kiện (Next Suggestions)</h3>
                <button className={styles.addBtn} onClick={() => setShowSelector(true)}>
                    <Plus size={14} /> Thêm gợi ý
                </button>
            </div>

            <p className={styles.helpText}>
                Gợi ý sẽ hiển thị ngay sau event chỉ định.
            </p>

            {/* Render arc events interleaved with suggestions */}
            <div className={styles.timeline}>
                {arcEventPositions.length === 0 ? (
                    <div className={styles.empty}>Arc này chưa có event nào.</div>
                ) : (
                    arcEventPositions.map(ev => (
                        <React.Fragment key={ev.event_id}>
                            {/* Event node */}
                            <div className={styles.timelineEvent}>
                                <div className={styles.timelineDot} />
                                <div className={styles.timelineContent}>
                                    <span className={styles.eventPos}>#{ev.posIndex}</span>
                                    <span className={styles.eventName}>{ev.name}</span>
                                </div>
                            </div>

                            {/* Suggestions after this event */}
                            {groupedByPos[ev.posIndex]?.map(s => {
                                const target = allEvents.find(e => e.event_id === s.target_event_id);
                                return (
                                    <div key={s.id} className={styles.suggestionRow}>
                                        <div className={styles.suggestionLine} />
                                        <div className={styles.suggestionChip}>
                                            <span className={styles.suggestionLabel}>Gợi ý:</span>
                                            <span className={styles.suggestionTarget}>{target?.name || s.target_event_id}</span>
                                            <button
                                                className={styles.removeBtn}
                                                onClick={() => handleDelete(s.id)}
                                                title="Xoá gợi ý này"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))
                )}

                {/* Suggestions with position beyond arc event count */}
                {Object.entries(groupedByPos)
                    .filter(([pos]) => parseInt(pos) > arcEventPositions.length)
                    .map(([pos, suggs]) => (
                        <div key={`overflow_${pos}`} className={styles.overflowGroup}>
                            <span className={styles.overflowLabel}>Sau event #{pos} (ngoài danh sách hiện tại)</span>
                            {suggs.map(s => {
                                const target = allEvents.find(e => e.event_id === s.target_event_id);
                                return (
                                    <div key={s.id} className={styles.suggestionChip}>
                                        <span className={styles.suggestionLabel}>Gợi ý:</span>
                                        <span className={styles.suggestionTarget}>{target?.name || s.target_event_id}</span>
                                        <button className={styles.removeBtn} onClick={() => handleDelete(s.id)}><X size={12} /></button>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                }
            </div>

            {/* Add Suggestion Modal */}
            {showSelector && (
                <div className={styles.modalOverlay} onClick={() => setShowSelector(false)}>
                    <div className={styles.selectorModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h4>Thêm Gợi ý</h4>
                            <button onClick={() => setShowSelector(false)}><X size={18} /></button>
                        </div>

                        {/* Position Selector */}
                        <div className={styles.positionSelector}>
                            <label>Hiển thị sau event thứ:</label>
                            <div className={styles.posOptions}>
                                {arcEventPositions.length > 0 ? (
                                    arcEventPositions.map(ev => (
                                        <button
                                            key={ev.posIndex}
                                            className={`${styles.posBtn} ${selectedPosition === ev.posIndex ? styles.posBtnActive : ''}`}
                                            onClick={() => setSelectedPosition(ev.posIndex)}
                                            title={ev.name}
                                        >
                                            #{ev.posIndex}
                                        </button>
                                    ))
                                ) : (
                                    <span className={styles.noEventsHint}>Arc chưa có event</span>
                                )}
                            </div>
                            {arcEventPositions.find(e => e.posIndex === selectedPosition) && (
                                <span className={styles.posPreview}>
                                    → Sau "{arcEventPositions.find(e => e.posIndex === selectedPosition)?.name}"
                                </span>
                            )}
                        </div>

                        {/* Target Event Search */}
                        <div className={styles.searchBox}>
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm event mục tiêu..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className={styles.eventList}>
                            {filteredTargets.length === 0 ? (
                                <div className={styles.modalEmpty}>Không tìm thấy event</div>
                            ) : (
                                filteredTargets.map(e => (
                                    <div key={e.event_id} className={styles.eventPickerItem} onClick={() => handleAdd(e)}>
                                        <div className={styles.eventName}>{e.name}</div>
                                        <div className={styles.eventInfo}>{e.event_id}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
