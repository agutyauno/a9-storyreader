import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Loader, User } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import styles from './EventCharactersManager.module.css';

/**
 * Manages the characters associated with a specific Event.
 */
export default function EventCharactersManager({ eventId, showNotification, onPickAsset, onPreview }) {
    const [linkedCharacters, setLinkedCharacters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (eventId) fetchData();
    }, [eventId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const linked = await SupabaseAPI.getCharactersByEvent(eventId);
            setLinkedCharacters(linked);
        } catch (err) {
            console.error('Failed to fetch event characters:', err);
            showNotification?.('Failed to load characters', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        onPickAsset?.(async (char) => {
            // Check if already linked
            if (linkedCharacters.find(c => c.character_id === char.asset_id)) {
                showNotification?.('Character already in event', 'warning');
                return;
            }

            try {
                await SupabaseAPI.addCharacterToEvent(eventId, char.asset_id);
                await fetchData();
                showNotification?.('Added character to event');
            } catch (err) {
                console.error('Add character failed:', err);
                showNotification?.('Failed to add character', 'error');
            }
        }, 'character');
    };

    const handleRemove = async (characterId) => {
        try {
            await SupabaseAPI.removeCharacterFromEvent(eventId, characterId);
            setLinkedCharacters(prev => prev.filter(c => c.character_id !== characterId));
            showNotification?.('Removed character from event');
        } catch (err) {
            console.error('Remove character failed:', err);
            showNotification?.('Failed to remove character', 'error');
        }
    };

    if (loading) return <div className={styles.loading}><Loader className={styles.spinner} /> Loading characters...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Characters in this Event</h3>
                <button className={styles.addBtn} onClick={handleAdd}>
                    <Plus size={14} /> Add Character
                </button>
            </div>

            <p className={styles.helpText}>
                Characters linked here will be prioritized in the code editor suggestions for this event's stories.
            </p>

            <div className={styles.grid}>
                {linkedCharacters.length === 0 ? (
                    <div className={styles.empty}>No characters linked yet.</div>
                ) : (
                    linkedCharacters.map(c => (
                        <div key={c.character_id} className={styles.charCard} onClick={() => onPreview?.(c, 'character')}>
                            <div className={styles.avatarWrap}>
                                {c.avatar_url ? (
                                    <img src={c.avatar_url} alt={c.name} className={styles.avatar} />
                                ) : (
                                    <div className={styles.avatarPlaceholder}><User size={20} /></div>
                                )}
                            </div>
                            <div className={styles.charInfo}>
                                <div className={styles.charName}>{c.name}</div>
                                <div className={styles.charId}>{c.character_id}</div>
                            </div>
                            <button className={styles.removeBtn} onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(c.character_id);
                            }}>
                                <X size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
