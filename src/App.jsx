import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EventPage from './pages/EventPage';
import StoryPage from './pages/StoryPage';
import RegionPage from './pages/RegionPage';
import EditorPage from './pages/EditorPage';
import Header from './components/Header';
import Footer from './components/Footer';

// Global Styles
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      {/* We will load the common Header here if it exists on all pages */}
      <Header />
      
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/event/:id" element={<EventPage />} />
          <Route path="/story/:id" element={<StoryPage />} />
          <Route path="/region/:id" element={<RegionPage />} />
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
