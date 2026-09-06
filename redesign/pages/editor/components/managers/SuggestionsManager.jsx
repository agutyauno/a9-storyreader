import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Loader } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import '../editorComponents.css';

export default function SuggestionsManager({ arcId, showNotification }) {
    const [suggestions, setSuggestions] = useState([]);
    const [arcEvents, setArcEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSelector, setShowSelector] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPosition, setSelectedPosition] = useState(1);
    const [selectedType, setSelectedType] = useState('next');

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
            setSuggestions(suggs || []);
            setArcEvents(arcEvs || []);
            setAllEvents(allEvs || []);
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
            showNotification?.('Tải gợi ý thất bại', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (targetEvent) => {
        const typeStr = selectedType || 'next';
        if (suggestions.find(s => s.target_event_id === targetEvent.event_id && s.position === selectedPosition && (s.type || 'next') === typeStr)) {
            showNotification?.('Sự kiện này đã được gợi ý cùng loại tại vị trí này', 'warning');
            return;
        }
        try {
            await SupabaseAPI.createSuggestion({
                arc_id: arcId,
                target_event_id: targetEvent.event_id,
                position: selectedPosition,
                type: typeStr
            });
            await fetchData();
            showNotification?.('Đã thêm gợi ý thành công', 'success');
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
            showNotification?.('Đã xóa gợi ý', 'success');
        } catch (err) {
            console.error('Delete suggestion failed:', err);
            showNotification?.('Xóa gợi ý thất bại', 'error');
        }
    };

    const filteredTargets = allEvents.filter(e =>
        (e.name && e.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.event_id && e.event_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return <div style={{ padding: '1rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Loader className="spinning" size={16} /> Đang tải gợi ý...</div>;
    }

    return (
        <div style={{ marginTop: '1.5rem', backgroundColor: '#141414', border: '1px solid rgba(245,237,220,0.15)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontFamily: 'var(--font-mono)', color: '#F5EDDC', textTransform: 'uppercase' }}>GỢI Ý SỰ KIỆN (EVENT RECOMMENDATIONS)</h4>
                <button className="redesign-btn primary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setShowSelector(true)}>
                    <Plus size={14} /> Thêm gợi ý
                </button>
            </div>

            {suggestions.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(245,237,220,0.4)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    CHƯA CÓ GỢI Ý NÀO CHO ARC NÀY
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {suggestions.map(s => {
                        const isPrev = s.type === 'prev';
                        return (
                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1C1C1C', padding: '0.6rem 0.8rem', border: '1px solid rgba(245,237,220,0.1)' }}>
                                <div>
                                    <span style={{ fontFamily: 'var(--font-mono)', color: '#D84315', fontSize: '0.75rem', marginRight: '0.5rem' }}>POS #{s.position}</span>
                                    <span style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.7rem',
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '2px',
                                        marginRight: '0.75rem',
                                        backgroundColor: isPrev ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                                        color: isPrev ? '#64B5F6' : '#FFB74D',
                                        border: `1px solid ${isPrev ? 'rgba(33, 150, 243, 0.4)' : 'rgba(255, 152, 0, 0.4)'}`
                                    }}>
                                        {isPrev ? 'ĐỌC TRƯỚC' : 'TIẾP THEO'}
                                    </span>
                                    <span style={{ fontWeight: 600 }}>{s.target_event_name || s.target_event_id}</span>
                                </div>
                                <button className="redesign-btn danger" style={{ padding: '0.25rem 0.4rem' }} onClick={() => handleDelete(s.id)}>
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {showSelector && (
                <div className="redesign-modal-overlay" onClick={() => setShowSelector(false)}>
                    <div className="redesign-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="redesign-modal-header">
                            <div className="redesign-modal-title">CHỌN SỰ KIỆN GỢI Ý</div>
                            <button className="redesign-modal-close" onClick={() => setShowSelector(false)}><X size={18} /></button>
                        </div>
                        <div className="redesign-modal-body">
                            <div className="redesign-form-group">
                                <label className="redesign-label">Loại gợi ý</label>
                                <select className="redesign-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                                    <option value="next">Gợi ý tiếp theo (Next Event)</option>
                                    <option value="prev">Gợi ý đọc trước (Previous Prerequisite)</option>
                                </select>
                            </div>
                            <div className="redesign-form-group">
                                <label className="redesign-label">Vị trí hiển thị (Gợi ý gắn vào event thứ)</label>
                                <select className="redesign-select" value={selectedPosition} onChange={e => setSelectedPosition(parseInt(e.target.value))}>
                                    {arcEvents.map((ev, idx) => (
                                        <option key={ev.event_id} value={idx + 1}>Vị trí #{idx + 1}: {ev.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="redesign-form-group">
                                <label className="redesign-label">Tìm kiếm sự kiện mục tiêu</label>
                                <input className="redesign-input" placeholder="Tìm theo tên hoặc ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {filteredTargets.map(ev => (
                                    <div key={ev.event_id} style={{ padding: '0.5rem 0.75rem', backgroundColor: '#121212', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} onClick={() => handleAdd(ev)}>
                                        <span>{ev.name}</span>
                                        <span style={{ opacity: 0.5, fontFamily: 'var(--font-mono)' }}>{ev.event_id}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
