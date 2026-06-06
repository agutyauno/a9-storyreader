import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import RedesignHomePage from './pages/home/home.jsx'
import TestPage from './pages/test/test.jsx'
import RedesignEventPage from './pages/event/event.jsx'
import RedesignStoryPage from './pages/story/story.jsx'
import { NotificationProvider } from './components/Notification'
import { initializeSettings } from './utils/settings'
import './redesign.css'

// Initialize app settings (wallpaper visibility, sound volume, etc.)
initializeSettings()

ReactDOM.createRoot(document.getElementById('redesign-root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<RedesignHomePage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/event/:id" element={<RedesignEventPage />} />
          <Route path="/story/:id" element={<RedesignStoryPage />} />
        </Routes>
      </HashRouter>
    </NotificationProvider>
  </React.StrictMode>
)
