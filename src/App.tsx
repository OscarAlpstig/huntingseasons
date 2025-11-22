import { useState, useEffect } from 'react';
import './App.scss'
import Menu from './Menu'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import JakttidCard from './components/JakttidCard/JakttidCard'
import Soltider from './Soltider'
import { getFaglarList, getDaggdjurList } from './jaktTiderLoader';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [faglar, setFaglar] = useState(true);
  const [daggdjur, setDaggdjur] = useState(true);
  const [activeMenu, setActiveMenu] = useState('jakttider');
  const [selectedLan, setSelectedLan] = useState<string>(() => {
    return localStorage.getItem('selectedLan') || 'Alla län';
  });

  useEffect(() => {
    localStorage.setItem('selectedLan', selectedLan);
  }, [selectedLan]);

  const jaktTider = [
    ...(faglar ? getFaglarList() : []),
    ...(daggdjur ? getDaggdjurList() : []),
  ];

  // Extract unique counties from the data
  const allLans = Array.from(new Set(jaktTider.flatMap(row => row.lan)))
    .filter(lan => lan !== 'Alla län')
    .sort();

  const getUserLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Din webbläsare stödjer inte geolokalisering.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const fetchCountyFromCoordinates = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
      return data.address.county || data.address.state || data.address.region || null;
    } catch (error) {
      console.error('Error fetching location:', error);
      return null;
    }
  };

  const matchCountyWithList = (county: string): string | null => {
    return allLans.find(lan =>
      county.toLowerCase().includes(lan.toLowerCase().replace(' län', '')) ||
      lan.toLowerCase().includes(county.toLowerCase().replace(' län', ''))
    ) || null;
  };

  const handleUseLocation = async () => {
    try {
      const position = await getUserLocation();
      const { latitude, longitude } = position.coords;
      const county = await fetchCountyFromCoordinates(latitude, longitude);

      if (county) {
        const matchedLan = matchCountyWithList(county);
        if (matchedLan) {
          setSelectedLan(matchedLan);
        } else {
          alert(`Kunde inte matcha din plats (${county}) med något län i listan.`);
        }
      } else {
        alert('Kunde inte hitta län för din plats.');
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      alert('Kunde inte hämta din plats. Kontrollera att du gett tillåtelse.');
    }
  };

  return (
    <>
      <Menu activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
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

        {activeMenu === 'jakttider' && (
          <>
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <label style={{ marginRight: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={faglar}
                    onChange={e => setFaglar(e.target.checked)}
                  /> Fåglar
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={daggdjur}
                    onChange={e => setDaggdjur(e.target.checked)}
                  /> Däggdjur
                </label>
              </div>

              <div>
                <label style={{ marginRight: '0.5rem' }}>Välj län:</label>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select
                    value={selectedLan}
                    onChange={(e) => setSelectedLan(e.target.value)}
                    style={{ padding: '0.3rem' }}
                  >
                    <option value="Alla län">Alla län</option>
                    {allLans.map(lan => (
                      <option key={lan} value={lan}>{lan}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem' }}
                    title="Använd min plats"
                  >
                    📍
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3>Jakttider</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jaktTider
                  .filter(row => selectedDate >= row.start && selectedDate <= row.end)
                  .filter(row => selectedLan === 'Alla län' || row.lan.includes('Alla län') || row.lan.includes(selectedLan))
                  .map((row, idx) => (
                    <JakttidCard
                      key={idx}
                      art={row.art}
                      info={row.info}
                      regler={row.regler}
                      tider={`${row.start.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })} - ${row.end.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}`}
                    />
                  ))}
              </div>
            </div>
          </>
        )}
        {activeMenu === 'soltider' && (
          <Soltider date={selectedDate} lat={59.3293} lon={18.0686} />
        )}
      </div>
    </>
  );
}

export default App
