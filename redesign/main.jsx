import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import RedesignHomePage from './pages/home/home.jsx'
import TestPage from './pages/test/test.jsx'
import RedesignEventPage from './pages/event/event.jsx'
import RedesignStoryPage from './pages/story/story.jsx'
import OperatorListPage from './pages/operator/operatorList.jsx'
import OperatorDetailPage from './pages/operator/operatorDetail.jsx'
import RedesignLoginPage from './pages/login/login.jsx'
import EditorHubPage from './pages/editor/editorHub.jsx'
import RedesignStoryEditorPage from './pages/editor/storyEditor.jsx'
import RedesignOperatorEditorPage from './pages/editor/operatorEditor.jsx'

import { AuthProvider, useAuth } from '../src/contexts/AuthContext.jsx'
import { NotificationProvider } from './components/Notification'
import { initializeSettings } from './utils/settings'
import { setupAssetFallback } from '../src/utils/assetFallback.js'
import './redesign.css'

// Initialize the global asset fallback error handler
setupAssetFallback()

// Initialize app settings (wallpaper visibility, sound volume, etc.)
initializeSettings()

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null; // Wait for session load

  if (!user && !import.meta.env.DEV) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

ReactDOM.createRoot(document.getElementById('redesign-root')).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<RedesignHomePage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/event/:id" element={<RedesignEventPage />} />
            <Route path="/story/:id" element={<RedesignStoryPage />} />
            <Route path="/operator-record/:id" element={<RedesignStoryPage isRecord={true} />} />
            <Route path="/operator" element={<OperatorListPage />} />
            <Route path="/operator/:id" element={<OperatorDetailPage />} />
            <Route path="/login" element={<RedesignLoginPage />} />
            
            {/* Protected Editor Routes */}
            <Route 
              path="/editor" 
              element={
                <ProtectedRoute>
                  <EditorHubPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/editor/story/:storyId?" 
              element={
                <ProtectedRoute>
                  <RedesignStoryEditorPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/editor/operator/:operatorId?" 
              element={
                <ProtectedRoute>
                  <RedesignOperatorEditorPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </HashRouter>
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>
)
