// Global Styles
import './styles/global.css';

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EventPage from './pages/EventPage';
import StoryPage from './pages/StoryPage';
import RegionPage from './pages/RegionPage';
import EditorPage from './pages/Editor.jsx';
import Header from './components/Header';
import Footer from './components/Footer';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // Or a loading spinner

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppLayout() {
  const location = useLocation();
  const isEditorPage = location.pathname.startsWith('/editor');

  return (
    <>
      {!isEditorPage && <Header />}

      <main style={isEditorPage ? { minHeight: 'auto' } : undefined}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/event/:id" element={<EventPage />} />
          <Route path="/story/:id" element={<StoryPage />} />
          <Route path="/region/:id" element={<RegionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/editor/:storyId?" 
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      {!isEditorPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
