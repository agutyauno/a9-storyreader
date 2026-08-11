import React, { useState, useEffect } from 'react';
import { Plus, X, Loader, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import { getAssetUrl } from '../../../../../src/utils/assetUtils';
import '../editorComponents.css';

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
            setLinkedCharacters(linked || []);
        } catch (err) {
            console.error('Failed to fetch event characters:', err);
            showNotification?.('Tải danh sách nhân vật thất bại', 'error');
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
                const currentMaxOrder = linkedCharacters.length > 0
                    ? Math.max(...linkedCharacters.map(c => c.display_order || 0))
                    : -1;

                let addCount = 0;
                let order = currentMaxOrder;
                for (const char of assetList) {
                    if (!linkedCharacters.find(c => c.character_id === char.asset_id)) {
                        order++;
                        await SupabaseAPI.addCharacterToEvent(eventId, char.asset_id, order);
                        addCount++;
                    }
                }
                
                if (addCount > 0) {
                    await fetchData();
                    showNotification?.(`Đã thêm ${addCount} nhân vật vào sự kiện`, 'success');
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

    const handleMove = async (index, direction) => {
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= linkedCharacters.length) return;

        const newLinked = [...linkedCharacters];
        const temp = newLinked[index];
        newLinked[index] = newLinked[targetIndex];
        newLinked[targetIndex] = temp;

        setLinkedCharacters(newLinked);

        try {
            await Promise.all(
                newLinked.map((char, idx) =>
                    SupabaseAPI.updateEventCharacter(eventId, char.character_id, {
                        display_order: idx
                    })
                )
            );
            showNotification?.('Đã cập nhật thứ tự', 'success');
        } catch (err) {
            console.error('Failed to update character order:', err);
            showNotification?.('Cập nhật thứ tự thất bại', 'error');
            fetchData();
        }
    };

    const handleRemove = async (characterId) => {
        try {
            await SupabaseAPI.removeCharacterFromEvent(eventId, characterId);
            setLinkedCharacters(prev => prev.filter(c => c.character_id !== characterId));
            showNotification?.('Đã xóa nhân vật khỏi sự kiện', 'success');
        } catch (err) {
            console.error('Remove character failed:', err);
            showNotification?.('Xóa nhân vật thất bại', 'error');
        }
    };

    if (loading) {
        return <div style={{ padding: '1rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Loader className="spinning" size={16} /> Đang tải nhân vật...</div>;
    }

    return (
        <div style={{ marginTop: '1.5rem', backgroundColor: '#141414', border: '1px solid rgba(245,237,220,0.15)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontFamily: 'Share Tech Mono', color: '#F5EDDC', textTransform: 'uppercase' }}>NHÂN VẬT XUẤT HIỆN TRONG SỰ KIỆN ({linkedCharacters.length})</h4>
                <button className="redesign-btn primary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }} onClick={handleAdd}>
                    <Plus size={14} /> Thêm nhân vật
                </button>
            </div>

            {linkedCharacters.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(245,237,220,0.4)', fontFamily: 'Share Tech Mono', fontSize: '0.85rem' }}>
                    CHƯA CÓ NHÂN VẬT NÀO ĐƯỢC THÊM
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    {linkedCharacters.map((char, index) => (
                        <div key={char.character_id} style={{ backgroundColor: '#1C1C1C', border: '1px solid rgba(245,237,220,0.15)', padding: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#0A0A0A', overflow: 'hidden', cursor: 'pointer', marginBottom: '0.5rem' }} onClick={() => onPreview?.(char, 'character')}>
                                {char.avatar_url ? (
                                    <img src={getAssetUrl(char.avatar_url)} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={32} style={{ margin: '16px', opacity: 0.4 }} />
                                )}
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{char.name}</span>
                            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                                <button className="redesign-btn" style={{ padding: '2px 4px' }} disabled={index === 0} onClick={() => handleMove(index, 'left')}><ChevronLeft size={12} /></button>
                                <button className="redesign-btn danger" style={{ padding: '2px 4px' }} onClick={() => handleRemove(char.character_id)}><X size={12} /></button>
                                <button className="redesign-btn" style={{ padding: '2px 4px' }} disabled={index === linkedCharacters.length - 1} onClick={() => handleMove(index, 'right')}><ChevronRight size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
