import React, { useState, useEffect } from 'react';
import { Plus, X, GripVertical, Loader, Search } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import styles from './SuggestionsManager.module.css';

/**
 * Manages the "Next Event Suggestions" for a specific Arc.
 * These are events that the game suggests after the arc is completed.
 */
export default function SuggestionsManager({ arcId, showNotification }) {
    const [suggestions, setSuggestions] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSelector, setShowSelector] = useState(false);

    useEffect(() => {
        if (arcId) fetchData();
    }, [arcId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [suggested, events] = await Promise.all([
                SupabaseAPI.getSuggestedEvents(arcId),
                SupabaseAPI.getEvents()
            ]);
            setSuggestions(suggested);
            setAllEvents(events);
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
            showNotification?.('Failed to load suggestions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (event) => {
        if (suggestions.find(s => s.event_id === event.event_id)) {
            showNotification?.('Event already in suggestions', 'warning');
            return;
        }

        setSaving(true);
        try {
            const nextPos = suggestions.length + 1;
            await SupabaseAPI.createSuggestion({
                arc_id: arcId,
                target_event_id: event.event_id,
                position: nextPos
            });
            await fetchData();
            showNotification?.('Added suggestion');
            setShowSelector(false);
        } catch (err) {
            console.error('Add suggestion failed:', err);
            showNotification?.('Failed to add suggestion', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (suggestionId) => {
        try {
            await SupabaseAPI.deleteSuggestion(suggestionId);
            setSuggestions(prev => prev.filter(s => s.suggestion_id !== suggestionId));
            showNotification?.('Removed suggestion');
        } catch (err) {
            console.error('Delete suggestion failed:', err);
            showNotification?.('Failed to remove suggestion', 'error');
        }
    };

    const filteredEvents = allEvents.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !suggestions.find(s => s.event_id === e.event_id)
    );

    if (loading) return <div className={styles.loading}><Loader className={styles.spinner} /> Loading suggestions...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Next Event Suggestions</h3>
                <button className={styles.addBtn} onClick={() => setShowSelector(true)}>
                    <Plus size={14} /> Add Event
                </button>
            </div>

            <p className={styles.helpText}>
                These events will be suggested to players after finishing this Arc.
            </p>

            <div className={styles.list}>
                {suggestions.length === 0 ? (
                    <div className={styles.empty}>No suggestions added yet.</div>
                ) : (
                    suggestions.map((s, idx) => (
                        <div key={s.suggestion_id || idx} className={styles.item}>
                            <GripVertical size={14} className={styles.grip} />
                            <span className={styles.pos}>{s.suggestion_position}.</span>
                            <span className={styles.name}>{s.name}</span>
                            <button className={styles.removeBtn} onClick={() => handleDelete(s.suggestion_id)}>
                                <X size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {showSelector && (
                <div className={styles.modalOverlay} onClick={() => setShowSelector(false)}>
                    <div className={styles.selectorModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h4>Select Event</h4>
                            <button onClick={() => setShowSelector(false)}><X size={18} /></button>
                        </div>
                        <div className={styles.searchBox}>
                            <Search size={16} />
                            <input 
                                type="text" 
                                placeholder="Search events..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className={styles.eventList}>
                            {filteredEvents.length === 0 ? (
                                <div className={styles.modalEmpty}>No events found</div>
                            ) : (
                                filteredEvents.map(e => (
                                    <div key={e.event_id} className={styles.eventPickerItem} onClick={() => handleAdd(e)}>
                                        <div className={styles.eventName}>{e.name}</div>
                                        <div className={styles.eventInfo}>{e.arc_id}</div>
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
