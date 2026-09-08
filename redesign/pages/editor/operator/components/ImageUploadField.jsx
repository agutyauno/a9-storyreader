import React, { useState, useRef } from 'react'
import { Upload, X, Check, Image as ImageIcon, Loader2 } from 'lucide-react'
import { uploadFileToGithub } from '../../../../../src/services/githubService'

/**
 * ImageUploadField
 * @param {string} value - Current image URL
 * @param {function} onChange - Callback with new URL string
 * @param {string} folderPath - Target GitHub folder, e.g. 'images/operators_images/avatars'
 * @param {string} label - Field label
 * @param {string} placeholder - URL input placeholder
 * @param {string} hint - Helper text
 */
export default function ImageUploadField({
    value = '',
    onChange,
    folderPath = 'images/operators_images/avatars',
    label = 'Hình ảnh',
    placeholder = 'https://... hoặc tải tệp lên',
    hint = ''
}) {
    const fileInputRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState(null)

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setUploadError(null)

        try {
            const res = await uploadFileToGithub(file, folderPath)
            if (res && res.url) {
                onChange(res.url)
            } else {
                throw new Error('Không nhận được URL từ máy chủ upload.')
            }
        } catch (err) {
            console.error('Image upload failed:', err)
            setUploadError(err.message || 'Tải ảnh lên thất bại.')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

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
                    accept="image/*"
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
                        title="Xoá ảnh"
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

            {value && (
                <div className="img-upload-preview">
                    <img
                        src={value}
                        alt="Preview"
                        onError={(e) => {
                            e.target.style.display = 'none'
                        }}
                        onLoad={(e) => {
                            e.target.style.display = 'block'
                        }}
                    />
                    <div className="img-upload-preview-meta technical-text">
                        <Check size={12} color="var(--color-accent-gold, #cf9d46)" />
                        <span>PREVIEW // READY</span>
                    </div>
                </div>
            )}
        </div>
    )
}
