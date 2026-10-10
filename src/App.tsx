import { lazy, Suspense, useState, useEffect } from 'react';
import './App.scss'
import Menu from './Menu'
import 'react-datepicker/dist/react-datepicker.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ALL_COUNTIES, COUNTIES, normalizeLanName } from './data/lan';

const JakttiderPage = lazy(() => import('./pages/JakttiderPage'));
const JaktplaneringPage = lazy(() => import('./pages/JaktplaneringPage'));

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLan, setSelectedLan] = useState<string>(() => {
    return normalizeLanName(localStorage.getItem('selectedLan') || ALL_COUNTIES) || ALL_COUNTIES;
  });
  const [lat, setLat] = useState(59.3293); // Default Stockholm
  const [lon, setLon] = useState(18.0686);

  useEffect(() => {
    localStorage.setItem('selectedLan', selectedLan);
  }, [selectedLan]);

  const allLans = COUNTIES.map((county) => county.id);

  return (
    <BrowserRouter basename="/huntingseasons">
      <Menu />
      <main>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  );
}

export default App
