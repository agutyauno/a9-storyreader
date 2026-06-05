// Reusable & Extensible Settings Manager for Civilight Eterna Database
import { useEffect, useState } from 'react'

export const SETTINGS_SCHEMA = [
  {
    id: 'showWallpaper',
    label: 'HÌNH NỀN SỰ KIỆN',
    description: 'Bật/tắt ảnh nền lớn mờ phía sau trang sự kiện.',
    type: 'toggle',
    defaultValue: true,
    onChange: (value) => {
      if (value) {
        document.body.classList.remove('settings-hide-wallpaper')
      } else {
        document.body.classList.add('settings-hide-wallpaper')
      }
    }
  },
  {
    id: 'soundVolume',
    label: 'ÂM LƯỢNG HỆ THỐNG',
    description: 'Điều chỉnh âm lượng nhạc nền và hiệu ứng âm thanh.',
    type: 'slider',
    min: 0,
    max: 100,
    defaultValue: 50,
    onChange: (value) => {
      // Dispatch custom event for volume change
      window.dispatchEvent(new CustomEvent('cedVolumeChange', { detail: { volume: value } }))
    }
  }
]

// Load initial settings
export function initializeSettings() {
  const saved = localStorage.getItem('ced_app_settings')
  let currentSettings = {}
  try {
    if (saved) currentSettings = JSON.parse(saved)
  } catch (e) {
    console.error('Error parsing settings:', e)
  }

  // Apply default values and trigger onChange for active settings
  SETTINGS_SCHEMA.forEach(item => {
    const value = currentSettings[item.id] !== undefined ? currentSettings[item.id] : item.defaultValue
    if (item.onChange) {
      item.onChange(value)
    }
  })
}

// Get single setting
export function getSetting(id) {
  const saved = localStorage.getItem('ced_app_settings')
  try {
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed[id] !== undefined) return parsed[id]
    }
  } catch (e) {}
  
  const item = SETTINGS_SCHEMA.find(i => i.id === id)
  return item ? item.defaultValue : null
}

// Save single setting
export function saveSetting(id, value) {
  const saved = localStorage.getItem('ced_app_settings')
  let currentSettings = {}
  try {
    if (saved) currentSettings = JSON.parse(saved)
  } catch (e) {}
  
  currentSettings[id] = value
  localStorage.setItem('ced_app_settings', JSON.stringify(currentSettings))
  
  const item = SETTINGS_SCHEMA.find(i => i.id === id)
  if (item && item.onChange) {
    item.onChange(value)
  }
}

// Custom hook to use settings in React components
export function useSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ced_app_settings')
    let parsed = {}
    try {
      if (saved) parsed = JSON.parse(saved)
    } catch (e) {}
    
    // Fill defaults
    const result = {}
    SETTINGS_SCHEMA.forEach(item => {
      result[item.id] = parsed[item.id] !== undefined ? parsed[item.id] : item.defaultValue
    })
    return result
  })

  const updateSetting = (id, value) => {
    saveSetting(id, value)
    setSettings(prev => ({ ...prev, [id]: value }))
  }

  return [settings, updateSetting]
}
