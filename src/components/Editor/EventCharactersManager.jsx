import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Loader, User } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import { getAssetUrl } from '../../utils/assetUtils';
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
        onPickAsset?.(async (assets) => {
            const assetList = Array.isArray(assets) ? assets : [assets];
            if (assetList.length === 0) return;

            setLoading(true);
            try {
                let addCount = 0;
                for (const char of assetList) {
                    // Check if already linked
                    if (!linkedCharacters.find(c => c.character_id === char.asset_id)) {
                        await SupabaseAPI.addCharacterToEvent(eventId, char.asset_id);
                        addCount++;
                    }
                }
                
                if (addCount > 0) {
                    await fetchData();
                    showNotification?.(`Đã thêm ${addCount} nhân vật vào sự kiện`);
                } else {
                    showNotification?.('Các nhân vật đã chọn đều đã có trong sự kiện', 'warning');
                }
            } catch (err) {
                console.error('Add characters failed:', err);
                showNotification?.('Thêm nhân vật thất bại', 'error');
            } finally {
                setLoading(false);
            }
        }, { filter: 'character', multi: true });
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
                                    <img src={getAssetUrl(c.avatar_url)} alt={c.name} className={styles.avatar} />
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
