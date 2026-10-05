import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Square, Save, Trash2, FolderPlus, Loader } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import { getAssetUrl } from '../../../../../src/utils/assetUtils';
import '../editorComponents.css';

export default function EventBgmManager({ eventId, showNotification, onPickAsset }) {
    const [bgmUrl, setBgmUrl] = useState('');
    const [originalBgmUrl, setOriginalBgmUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (eventId) {
            fetchEventBgm();
        }
        return () => {
            stopPreview();
        };
    }, [eventId]);

    const fetchEventBgm = async () => {
        setLoading(true);
        stopPreview();
        try {
            const ev = await SupabaseAPI.getEvent(eventId);
            const currentBgm = ev?.bgm_url || '';
            setBgmUrl(currentBgm);
            setOriginalBgmUrl(currentBgm);
        } catch (err) {
            console.error('Failed to fetch event BGM:', err);
            showNotification?.('Không thể tải thông tin BGM của sự kiện', 'error');
        } finally {
            setLoading(false);
        }
    };

    const stopPreview = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsPlaying(false);
    };

    const togglePreview = async () => {
        if (isPlaying) {
            stopPreview();
            return;
        }

        const srcToPlay = bgmUrl.trim();
        if (!srcToPlay) {
            showNotification?.('Chưa có đường dẫn hoặc Asset ID BGM để nghe thử', 'warning');
            return;
        }

        try {
            stopPreview();
            let finalSrc = srcToPlay;

            // Resolve asset_id if it doesn't have an extension or slash
            if (!finalSrc.includes('.') && !finalSrc.includes('/') && !finalSrc.startsWith('http')) {
                try {
                    const asset = await SupabaseAPI.getAsset(finalSrc);
                    if (asset?.url) finalSrc = asset.url;
                } catch (e) {
                    console.warn('Failed to resolve BGM asset in preview:', e);
                }
            }

            if (!finalSrc.startsWith('http') && !finalSrc.startsWith('/') && !finalSrc.startsWith('data:')) {
                finalSrc = '/assets/audio/bgm/' + finalSrc;
            }
            const resolvedUrl = getAssetUrl(finalSrc, 'audio');
            const audio = new Audio(resolvedUrl);
            audioRef.current = audio;
            audio.volume = 0.8;
            audio.loop = true;

            audio.addEventListener('error', (e) => {
                console.error('BGM preview error:', e);
                showNotification?.('Không thể phát file âm thanh này', 'error');
                stopPreview();
            });

            audio.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.warn('Playback blocked or failed:', err);
                showNotification?.('Không thể phát âm thanh: ' + err.message, 'error');
                stopPreview();
            });
        } catch (err) {
            console.error('Preview error:', err);
            stopPreview();
        }
    };

    const handlePickAsset = () => {
        onPickAsset?.((assets) => {
            const selected = Array.isArray(assets) ? assets[0] : assets;
            if (selected) {
                const picked = selected.asset_id || selected.url || '';
                setBgmUrl(picked);
                showNotification?.(`Đã chọn BGM: ${picked}`, 'info');
            }
        }, 'audio');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const val = bgmUrl.trim();
            await SupabaseAPI.updateEvent(eventId, { bgm_url: val });
            setOriginalBgmUrl(val);
            showNotification?.('Đã lưu cấu hình BGM sự kiện thành công', 'success');
        } catch (err) {
            console.error('Failed to save event BGM:', err);
            showNotification?.('Lưu BGM thất bại: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        stopPreview();
        setBgmUrl('');
    };

    const isDirty = bgmUrl.trim() !== originalBgmUrl.trim();

    if (loading) {
        return (
            <div style={{ padding: '1rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                <Loader className="spinning" size={16} /> Đang tải thông tin BGM sự kiện...
            </div>
        );
    }

    return (
        <div style={{ marginTop: '1.5rem', backgroundColor: '#141414', border: '1px solid rgba(245,237,220,0.15)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Music size={16} style={{ color: 'var(--color-terracotta, #B2653B)' }} />
                    <h4 style={{ margin: 0, fontFamily: 'var(--font-mono)', color: '#F5EDDC', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                        NHẠC NỀN SỰ KIỆN (EVENT BGM)
                    </h4>
                </div>
                {originalBgmUrl ? (
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#81C784', backgroundColor: 'rgba(129, 199, 132, 0.12)', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                        ĐÃ CÓ BGM
                    </span>
                ) : (
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'rgba(245,237,220,0.4)', backgroundColor: 'rgba(245,237,220,0.05)', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                        CHƯA CÀI ĐẶT
                    </span>
                )}
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'rgba(245,237,220,0.7)', fontFamily: 'var(--font-swiss)', lineHeight: 1.5 }}>
                Nhạc nền sẽ tự động phát khi người đọc mở trang sự kiện này (với âm lượng đồng bộ qua Cài Đặt Header). Nếu không có BGM, trang sự kiện sẽ hoàn toàn im lặng.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={bgmUrl}
                        onChange={(e) => setBgmUrl(e.target.value)}
                        placeholder="Nhập ID Asset BGM (e.g. m_avg_theme) hoặc URL file âm thanh..."
                        style={{
                            flex: 1,
                            backgroundColor: '#1C1C1C',
                            border: '1px solid rgba(245,237,220,0.2)',
                            color: '#F5EDDC',
                            padding: '0.55rem 0.75rem',
                            fontSize: '0.85rem',
                            fontFamily: 'var(--font-mono)',
                            borderRadius: '3px',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="button"
                        className="redesign-btn"
                        onClick={handlePickAsset}
                        title="Chọn file BGM từ thư viện Asset"
                        style={{ padding: '0.55rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                    >
                        <FolderPlus size={14} />
                        <span>Chọn Asset</span>
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(245,237,220,0.08)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="button"
                            className={`redesign-btn ${isPlaying ? 'primary' : ''}`}
                            onClick={togglePreview}
                            disabled={!bgmUrl.trim()}
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            {isPlaying ? <Square size={13} /> : <Play size={13} />}
                            <span>{isPlaying ? 'Dừng thử' : 'Nghe thử'}</span>
                        </button>
                        {bgmUrl && (
                            <button
                                type="button"
                                className="redesign-btn danger"
                                onClick={handleClear}
                                title="Xóa bỏ nhạc nền"
                                style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                                <Trash2 size={13} />
                                <span>Gỡ</span>
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        className="redesign-btn primary"
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                        style={{
                            padding: '0.45rem 1rem',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            opacity: isDirty ? 1 : 0.6
                        }}
                    >
                        {saving ? <Loader className="spinning" size={13} /> : <Save size={13} />}
                        <span>{saving ? 'Đang lưu...' : 'Lưu BGM'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
