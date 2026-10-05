import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { getAssetUrl } from '../../src/utils/assetUtils'
import './sidebarRegionDropdown.css'

const DEFAULT_FALLBACK_ICON = '/assets/images/icon/rhodes_island.png'

export default function SidebarRegionDropdown({
    regions = [],
    activeRegionId,
    onSelectRegion,
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Current active region
    const activeRegion = useMemo(() => {
        if (!regions || regions.length === 0) return null
        return regions.find(r => r.region_id === activeRegionId) || regions[0]
    }, [regions, activeRegionId])

    // Close on click outside & Escape key
    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen])

    if (!regions || regions.length === 0) return null

    const handleSelect = (regId) => {
        if (onSelectRegion) {
            onSelectRegion(regId)
        }
        setIsOpen(false)
    }

    return (
        <div className={`sidebar-region-dropdown-wrap ${className}`} ref={dropdownRef}>
            <div className="srd-container">
                {/* Custom Interactive Trigger Button */}
                <button
                    type="button"
                    className={`srd-trigger ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(prev => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    title={`Khu vực hiện tại: ${activeRegion?.name || 'Chưa chọn'}`}
                >
                    <div className="srd-trigger-left">
                        <div className="srd-trigger-icon-box">
                            <img
                                src={getAssetUrl(activeRegion?.icon_url || DEFAULT_FALLBACK_ICON)}
                                alt=""
                                className="srd-trigger-icon"
                                onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = getAssetUrl(DEFAULT_FALLBACK_ICON)
                                }}
                            />
                        </div>
                        <div className="srd-trigger-text">
                            <span className="srd-trigger-name">
                                {activeRegion?.name || 'CHỌN KHU VỰC'}
                            </span>
                            <span className="srd-trigger-id">
                                SEC // {activeRegion?.region_id ? activeRegion.region_id.toUpperCase() : 'UNKNOWN'}
                            </span>
                        </div>
                    </div>

                    <div className="srd-trigger-right">
                        <ChevronDown size={15} className={`srd-chevron-icon ${isOpen ? 'open' : ''}`} />
                    </div>
                </button>

                {/* Dropdown Menu Popup (Flush against trigger) */}
                {isOpen && (
                    <div className="srd-menu" role="listbox">
                        <div className="srd-menu-stripe" />

                        {/* Region Options List */}
                        <ul className="srd-options-list">
                            {regions.map((reg) => {
                                const isSelected = reg.region_id === (activeRegion?.region_id || activeRegionId)
                                return (
                                    <li
                                        key={reg.region_id}
                                        className={`srd-option-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleSelect(reg.region_id)}
                                        role="option"
                                        aria-selected={isSelected}
                                    >
                                        <div className="srd-option-left">
                                            <div className="srd-option-icon-box">
                                                <img
                                                    src={getAssetUrl(reg.icon_url || DEFAULT_FALLBACK_ICON)}
                                                    alt=""
                                                    className="srd-option-icon"
                                                    onError={(e) => {
                                                        e.target.onerror = null
                                                        e.target.src = getAssetUrl(DEFAULT_FALLBACK_ICON)
                                                    }}
                                                />
                                            </div>
                                            <div className="srd-option-text">
                                                <span className="srd-option-name">{reg.name}</span>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="srd-option-right">
                                                <Check size={14} className="srd-check-icon" />
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
