// Global Styles
import './styles/global.css';

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EventPage from './pages/EventPage';
import StoryPage from './pages/StoryPage';
import RegionPage from './pages/RegionPage';
import EditorPage from './pages/EditorPage';
import Header from './components/Header';
import Footer from './components/Footer';

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
          <Route path="/editor/:storyId?" element={<EditorPage />} />
        </Routes>
      </main>

      {!isEditorPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
