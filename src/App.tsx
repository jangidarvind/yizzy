import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SiteHeader } from './components/SiteHeader';
import { LandingPage } from './pages/LandingPage';
import { MapPage } from './pages/MapPage';
import { ScrollToTop } from './components/ScrollToTop';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="shell">
        <SiteHeader />
        <div className="shell__main">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/infra-map" element={<MapPage />} />
            {/* Unknown paths fall back to the pitch, not a dead end. */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
