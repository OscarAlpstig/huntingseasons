import React, { useState } from 'react';
import JakttidCard from '../components/JakttidCard/JakttidCard';
import LocationSelector from '../components/LocationSelector/LocationSelector';
import { getFaglarList, getDaggdjurList } from '../data/jaktTiderLoader';

interface JakttiderPageProps {
  selectedDate: Date;
  selectedLan: string;
  setSelectedLan: (lan: string) => void;
  lat: number;
  lon: number;
  setLat: (lat: number) => void;
  setLon: (lon: number) => void;
  allLans: string[];
}

const JakttiderPage: React.FC<JakttiderPageProps> = ({
  selectedDate,
  selectedLan,
  setSelectedLan,
  lat,
  lon,
  setLat,
  setLon,
  allLans
}) => {
  const [faglar, setFaglar] = useState(true);
  const [daggdjur, setDaggdjur] = useState(true);

  const jaktTider = [
    ...(faglar ? getFaglarList() : []),
    ...(daggdjur ? getDaggdjurList() : []),
  ];

  return (
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
        <LocationSelector
          selectedLan={selectedLan}
          setSelectedLan={setSelectedLan}
          lat={lat}
          lon={lon}
          setLat={setLat}
          setLon={setLon}
          allLans={allLans}
        />
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
  );
};

export default JakttiderPage;
