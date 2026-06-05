import React from 'react'
import Modal from './Modal'
import { useSettings, SETTINGS_SCHEMA } from '../utils/settings'
import { Settings, Volume2, Image, Sliders } from 'lucide-react'

export default function SettingsModal({ isOpen, onClose }) {
  const [settings, updateSetting] = useSettings()

  const getIcon = (id) => {
    switch (id) {
      case 'showWallpaper':
        return <Image size={18} />
      case 'soundVolume':
        return <Volume2 size={18} />
      default:
        return <Sliders size={18} />
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SYS.CONFIG_PANEL // CÀI ĐẶT HỆ THỐNG"
      className="settings-modal-custom"
    >
      <div className="settings-list">
        {SETTINGS_SCHEMA.map((item) => (
          <div key={item.id} className="settings-item">
            <div className="settings-item-header">
              <div className="settings-item-icon">
                {getIcon(item.id)}
              </div>
              <div className="settings-item-info">
                <div className="settings-item-label technical-text">{item.label}</div>
                <div className="settings-item-desc">{item.description}</div>
              </div>
            </div>

            <div className="settings-item-control">
              {item.type === 'toggle' && (
                <label className="ced-switch">
                  <input
                    type="checkbox"
                    checked={!!settings[item.id]}
                    onChange={(e) => updateSetting(item.id, e.target.checked)}
                  />
                  <span className="ced-slider round"></span>
                </label>
              )}

              {item.type === 'slider' && (
                <div className="ced-slider-container">
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    value={settings[item.id]}
                    onChange={(e) => updateSetting(item.id, parseInt(e.target.value, 10))}
                    className="ced-range"
                  />
                  <span className="ced-range-value technical-text">
                    {settings[item.id]}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
