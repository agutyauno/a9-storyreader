import React from 'react';
import { X, User, Image as ImageIcon } from 'lucide-react';
import { getAssetUrl } from '../../../../../src/utils/assetUtils';
import '../editorComponents.css';

export default function AssetPreviewModal({ isOpen, asset, kind = 'asset', onClose }) {
    if (!isOpen || !asset) return null;

    const isCharacter = kind === 'character';
    let previewUrl = asset.url || asset.full_url || asset.image_url;
    let title = asset.name || asset.title || 'Untitled Asset';
    let subtitle = isCharacter ? 'Character Preview' : 'Gallery Artwork';

    if (isCharacter && !previewUrl && asset.avatar_url) {
        previewUrl = asset.avatar_url;
    }

    return (
        <div className="redesign-modal-overlay" onClick={onClose}>
            <div className="redesign-modal-card large" onClick={(e) => e.stopPropagation()}>
                <div className="redesign-modal-header">
                    <div className="redesign-modal-title">
                        {isCharacter ? <User size={20} /> : <ImageIcon size={20} />}
                        <span>{title}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 400 }}>// {subtitle}</span>
                    </div>
                    <button className="redesign-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="redesign-modal-body" style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0B' }}>
                    {previewUrl ? (
                        <img 
                            src={getAssetUrl(previewUrl)} 
                            alt={title} 
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', border: '1px solid rgba(245,237,220,0.15)' }} 
                        />
                    ) : (
                        <div style={{ textAlign: 'center', color: 'rgba(245,237,220,0.4)' }}>
                            {isCharacter ? <User size={80} /> : <ImageIcon size={80} />}
                            <p style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)' }}>NO_IMAGE_AVAILABLE</p>
                        </div>
                    )}
                </div>

                <div className="redesign-modal-footer" style={{ justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(245,237,220,0.5)' }}>
                        PRESS ESC OR CLICK OUTSIDE TO CLOSE
                    </span>
                </div>
            </div>
        </div>
    );
}
