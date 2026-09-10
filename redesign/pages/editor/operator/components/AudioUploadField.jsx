import React, { useState, useRef, useEffect } from 'react'
import { Upload, X, Play, Square, Loader2, Volume2 } from 'lucide-react'
import { uploadFileToGithub } from '../../../../../src/services/githubService'

/**
 * AudioUploadField
 * Allows uploading audio files (voice lines, bgm, sfx) directly to GitHub,
 * or entering an external audio URL, with a live brutalist audio preview player.
 *
 * @param {string} value - Current audio URL
 * @param {function} onChange - Callback with new URL string
 * @param {string} folderPath - Target GitHub folder, e.g. 'audio/operators_voices/jp'
 * @param {string} label - Field label
 * @param {string} placeholder - URL input placeholder
 * @param {string} hint - Helper text
 * @param {string} customFileName - Optional custom filename without extension
 */
export default function AudioUploadField({
    value = '',
    onChange,
    folderPath = 'audio/operators_voices',
    label = 'Tệp âm thanh',
    placeholder = 'https://... hoặc tải tệp âm thanh (.mp3, .wav, .ogg)',
    hint = '',
    customFileName = null,
    onNotify = null
}) {
    const fileInputRef = useRef(null)
    const audioRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)

    // Cleanup audio instance when component unmounts
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    // Stop playback if value changes or is cleared
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
            setIsPlaying(false)
        }
    }, [value])

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setUploadError(null)

        try {
            const res = await uploadFileToGithub(file, folderPath, customFileName)
            if (res && res.url) {
                onChange(res.url)
                onNotify?.('Đã tải tệp âm thanh lên Server thành công!', 'success')
            } else {
                throw new Error(res?.error || 'Không nhận được URL từ máy chủ upload.')
            }
        } catch (err) {
            console.error('Audio upload failed:', err)
            const errMsg = err.message || 'Tải tệp âm thanh lên thất bại.'
            setUploadError(errMsg)
            onNotify?.(errMsg, 'error')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const togglePlay = () => {
        if (!value) return

        if (isPlaying) {
            audioRef.current?.pause()
            setIsPlaying(false)
        } else {
            if (!audioRef.current || audioRef.current.src !== value) {
                audioRef.current = new Audio(value)
                audioRef.current.onended = () => setIsPlaying(false)
                audioRef.current.onerror = () => {
                    setIsPlaying(false)
                    setUploadError('Không thể phát file âm thanh từ URL này.')
                }
            }
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch((err) => {
                    console.error('Audio playback error:', err)
                    setIsPlaying(false)
                    setUploadError('Lỗi phát âm thanh. Vui lòng kiểm tra định dạng hoặc quyền truy cập.')
                })
        }
    }

    // Extract filename from URL for display
    const displayFileName = value ? (value.split('/').pop()?.split('?')[0] || value) : ''

    return (
        <div className="img-upload-field">
            {label && <label className="img-upload-label technical-text">{label}</label>}

            <div className="img-upload-controls">
                <input
                    type="text"
                    className="img-upload-url-input"
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
                    onChange={handleFileChange}
                />

                <button
                    type="button"
                    className="img-upload-btn brutalist-btn"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    title={`Upload to GitHub: ${folderPath}`}
                >
                    {uploading ? <Loader2 size={14} className="spin-animate" /> : <Upload size={14} />}
                    <span>{uploading ? 'Đang tải...' : 'Tải lên'}</span>
                </button>

                {value && (
                    <button
                        type="button"
                        className="img-upload-clear-btn"
                        onClick={() => onChange('')}
                        title="Xoá âm thanh"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {uploadError && (
                <div className="img-upload-error technical-text">
                    LỖI: {uploadError}
                </div>
            )}

            {hint && <div className="img-upload-hint technical-text">{hint}</div>}

            {/* Brutalist Audio Preview Player Strip */}
            {value && (
                <div className="audio-upload-preview">
                    <button
                        type="button"
                        className="brutalist-icon-btn"
                        onClick={togglePlay}
                        title={isPlaying ? 'Dừng phát' : 'Nghe thử âm thanh'}
                    >
                        {isPlaying ? (
                            <Square size={12} fill="var(--color-charcoal, #181818)" color="var(--color-charcoal, #181818)" />
                        ) : (
                            <Play size={12} fill="var(--color-charcoal, #181818)" color="var(--color-charcoal, #181818)" />
                        )}
                    </button>

                    <div className="audio-upload-preview-name" title={value}>
                        <Volume2 size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                        <span>{displayFileName}</span>
                    </div>

                    <div className="audio-upload-preview-tag technical-text">
                        {isPlaying ? 'PLAYING...' : 'AUDIO // READY'}
                    </div>
                </div>
            )}
        </div>
    )
}
