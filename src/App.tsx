import { lazy, Suspense, useState, useEffect } from 'react';
import './App.scss'
import Menu from './Menu'
import 'react-datepicker/dist/react-datepicker.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ALL_COUNTIES, COUNTIES, normalizeLanName } from './data/lan';
import { readPosition, writePreference } from './offline/preferences';
import OfflineSupport from './offline/OfflineSupport';
import PageErrorBoundary from './components/PageErrorBoundary';

const JakttiderPage = lazy(() => import('./pages/JakttiderPage'));
const JaktplaneringPage = lazy(() => import('./pages/JaktplaneringPage'));
const InstallationPage = lazy(() => import('./pages/InstallationPage'));

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLan, setSelectedLan] = useState<string>(() => {
    try { return normalizeLanName(localStorage.getItem('selectedLan') || ALL_COUNTIES) || ALL_COUNTIES; }
    catch { return ALL_COUNTIES; }
  });
  const [initialPosition] = useState(readPosition);
  const [lat, setLat] = useState(initialPosition[0]);
  const [lon, setLon] = useState(initialPosition[1]);

  useEffect(() => { writePreference('position', [lat, lon]); }, [lat, lon]);

  useEffect(() => {
    try { localStorage.setItem('selectedLan', selectedLan); } catch { /* Filters remain usable if storage is restricted. */ }
  }, [selectedLan]);

  const allLans = COUNTIES.map((county) => county.id);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <OfflineSupport>
      <Menu />
      <main>
        <PageErrorBoundary>
        <Suspense fallback={<p role="status">Laddar sidan…</p>}>
          <Routes>
            <Route path="/" element={
              <JakttiderPage
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedLan={selectedLan}
                setSelectedLan={setSelectedLan}
                lat={lat}
                lon={lon}
                setLat={setLat}
                setLon={setLon}
                allLans={allLans}
              />
            } />
            <Route path="/jaktplanering" element={
              <JaktplaneringPage
                lat={lat}
                lon={lon}
                setLat={setLat}
                setLon={setLon}
                setSelectedLan={setSelectedLan}
              />
            } />
            <Route path="/installera" element={<InstallationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </PageErrorBoundary>
      </main>
      </OfflineSupport>
    </BrowserRouter>
  );
}

export default App
