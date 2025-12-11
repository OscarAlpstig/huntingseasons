import React from 'react';
import LocationSelector from '../components/LocationSelector';
import Soltider from '../Soltider';

interface SoltiderPageProps {
  selectedDate: Date;
  selectedLan: string;
  setSelectedLan: (lan: string) => void;
  lat: number;
  lon: number;
  setLat: (lat: number) => void;
  setLon: (lon: number) => void;
  allLans: string[];
}

const SoltiderPage: React.FC<SoltiderPageProps> = ({
  selectedDate,
  selectedLan,
  setSelectedLan,
  lat,
  lon,
  setLat,
  setLon,
  allLans
}) => (
  <>
    <LocationSelector
      selectedLan={selectedLan}
      setSelectedLan={setSelectedLan}
      lat={lat}
      lon={lon}
      setLat={setLat}
      setLon={setLon}
      allLans={allLans}
    />
    <Soltider date={selectedDate} lat={lat} lon={lon} />
  </>
);

export default SoltiderPage;

