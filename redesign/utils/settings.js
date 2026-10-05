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
    label: 'ÂM LƯỢNG CHUNG',
    description: 'Điều chỉnh âm lượng tổng cho toàn bộ hệ thống.',
    type: 'slider',
    min: 0,
    max: 100,
    defaultValue: 50,
    onChange: (value) => {
      window.dispatchEvent(new CustomEvent('cedVolumeChange', { detail: { volume: value } }))
      window.dispatchEvent(new CustomEvent('cedMasterVolumeChange', { detail: { volume: value } }))
    }
  },
  {
    id: 'bgmVolume',
    label: 'ÂM LƯỢNG NHẠC NỀN',
    description: 'Điều chỉnh âm lượng nhạc nền (BGM) của câu chuyện và sự kiện.',
    type: 'slider',
    min: 0,
    max: 100,
    defaultValue: 80,
    onChange: (value) => {
      window.dispatchEvent(new CustomEvent('cedBgmVolumeChange', { detail: { volume: value } }))
    }
  },
  {
    id: 'sfxVolume',
    label: 'ÂM LƯỢNG HIỆU ỨNG',
    description: 'Điều chỉnh âm lượng hiệu ứng âm thanh (SFX) khi đọc.',
    type: 'slider',
    min: 0,
    max: 100,
    defaultValue: 80,
    onChange: (value) => {
      window.dispatchEvent(new CustomEvent('cedSfxVolumeChange', { detail: { volume: value } }))
    }
  },
  {
    id: 'soundMuted',
    label: 'TẮT TOÀN BỘ ÂM THANH',
    description: 'Tắt tiếng tất cả nhạc nền và hiệu ứng âm thanh.',
    type: 'toggle',
    defaultValue: false,
    onChange: (value) => {
      window.dispatchEvent(new CustomEvent('cedMuteChange', { detail: { muted: value } }))
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
    let value = currentSettings[item.id] !== undefined ? currentSettings[item.id] : item.defaultValue
    if (item.id === 'soundVolume' && currentSettings.soundVolume === undefined && currentSettings.masterVolume !== undefined) {
      value = currentSettings.masterVolume
    }
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
      if (id === 'soundVolume' && parsed.masterVolume !== undefined) return parsed.masterVolume
      if (id === 'masterVolume' && parsed.soundVolume !== undefined) return parsed.soundVolume
    }
  } catch (e) { }

  const item = SETTINGS_SCHEMA.find(i => i.id === id)
  return item ? item.defaultValue : null
}

// Save single setting
export function saveSetting(id, value) {
  const saved = localStorage.getItem('ced_app_settings')
  let currentSettings = {}
  try {
    if (saved) currentSettings = JSON.parse(saved)
  } catch (e) { }

  currentSettings[id] = value

  // Keep soundVolume and masterVolume aliases synchronized
  if (id === 'soundVolume') {
    currentSettings['masterVolume'] = value
    try {
      localStorage.setItem('audio_volume', (value / 100).toString())
    } catch (e) {}
  } else if (id === 'masterVolume') {
    currentSettings['soundVolume'] = value
    try {
      localStorage.setItem('audio_volume', (value / 100).toString())
    } catch (e) {}
  } else if (id === 'soundMuted') {
    try {
      localStorage.setItem('audio_enabled', (!value).toString())
    } catch (e) {}
  }

  localStorage.setItem('ced_app_settings', JSON.stringify(currentSettings))

  const item = SETTINGS_SCHEMA.find(i => i.id === id)
  if (item && item.onChange) {
    item.onChange(value)
  }

  // Broadcast settings change event to all active windows/components
  window.dispatchEvent(new CustomEvent('ced_app_settings', { detail: currentSettings }))
}

// Custom hook to use settings in React components
export function useSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ced_app_settings')
    let parsed = {}
    try {
      if (saved) parsed = JSON.parse(saved)
    } catch (e) { }

    // Fill defaults
    const result = {}
    SETTINGS_SCHEMA.forEach(item => {
      let val = parsed[item.id] !== undefined ? parsed[item.id] : item.defaultValue
      if (item.id === 'soundVolume' && parsed.soundVolume === undefined && parsed.masterVolume !== undefined) {
        val = parsed.masterVolume
      }
      result[item.id] = val
    })
    return result
  })

  // Synchronize when settings change from external dispatches or other components
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('ced_app_settings')
      let parsed = {}
      try {
        if (saved) parsed = JSON.parse(saved)
      } catch (e) { }

      setSettings(prev => {
        let changed = false
        const next = { ...prev }
        SETTINGS_SCHEMA.forEach(item => {
          let val = parsed[item.id] !== undefined ? parsed[item.id] : item.defaultValue
          if (item.id === 'soundVolume' && parsed.soundVolume === undefined && parsed.masterVolume !== undefined) {
            val = parsed.masterVolume
          }
          if (next[item.id] !== val) {
            next[item.id] = val
            changed = true
          }
        })
        return changed ? next : prev
      })
    }

    window.addEventListener('ced_app_settings', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('ced_app_settings', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const updateSetting = (id, value) => {
    saveSetting(id, value)
    setSettings(prev => {
      const next = { ...prev, [id]: value }
      if (id === 'soundVolume') next['masterVolume'] = value
      return next
    })
  }

  return [settings, updateSetting]
}
