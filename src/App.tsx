import { useState, useEffect } from 'react';
import './App.scss'
import Menu from './Menu'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import JakttiderPage from './pages/JakttiderPage';
import SoltiderPage from './pages/SoltiderPage';
import { getFaglarList, getDaggdjurList } from './data/jaktTiderLoader';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLan, setSelectedLan] = useState<string>(() => {
    return localStorage.getItem('selectedLan') || 'Alla län';
  });
  const [lat, setLat] = useState(59.3293); // Default Stockholm
  const [lon, setLon] = useState(18.0686);

  useEffect(() => {
    localStorage.setItem('selectedLan', selectedLan);
  }, [selectedLan]);

  const allLans = Array.from(new Set([
    ...getFaglarList(),
    ...getDaggdjurList()
  ].flatMap(row => row.lan)))
    .filter(lan => lan !== 'Alla län')
    .sort();

  return (
    <BrowserRouter basename="/huntingseasons">
      <Menu />
      <div style={{ padding: '1rem' }}>
        <DatePicker
          selected={selectedDate}
          onChange={date => setSelectedDate(date || new Date())}
          dateFormat="yyyy-MM-dd"
        />
        <button
          type="button"
          style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem' }}
          onClick={() => setSelectedDate(new Date())}
        >
          Idag
        </button>
        <Routes>
          <Route path="/jakttider" element={
            <JakttiderPage
              selectedDate={selectedDate}
              selectedLan={selectedLan}
              setSelectedLan={setSelectedLan}
              lat={lat}
              lon={lon}
              setLat={setLat}
              setLon={setLon}
              allLans={allLans}
            />
          } />
          <Route path="/soltider" element={
            <SoltiderPage
              selectedDate={selectedDate}
              selectedLan={selectedLan}
              setSelectedLan={setSelectedLan}
              lat={lat}
              lon={lon}
              setLat={setLat}
              setLon={setLon}
              allLans={allLans}
            />
          } />
          <Route path="*" element={<Navigate to="/jakttider" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App
