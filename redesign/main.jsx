import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import RedesignHomePage from './pages/home/home.jsx'
import TestPage from './pages/test/test.jsx'
import RedesignEventPage from './pages/event/event.jsx'
import { NotificationProvider } from './components/Notification'
import './redesign.css'

ReactDOM.createRoot(document.getElementById('redesign-root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<RedesignHomePage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/event/:id" element={<RedesignEventPage />} />
        </Routes>
      </HashRouter>
    </NotificationProvider>
  </React.StrictMode>
)
