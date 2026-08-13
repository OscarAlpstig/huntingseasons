import React from 'react';
import { ALL_COUNTIES, findNearestLan, getCountyDisplayName, getLanCoordinates, normalizeLanName } from '../../data/lan';

interface LocationSelectorProps {
  selectedLan: string;
  setSelectedLan: (lan: string) => void;
  lat: number;
  lon: number;
  setLat: (lat: number) => void;
  setLon: (lon: number) => void;
  allLans: string[];
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLan,
  setSelectedLan,
  lat,
  lon,
  setLat,
  setLon,
  allLans,
}) => {
  const getUserLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Din webbläsare stödjer inte geolokalisering.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const handleUseLocation = async () => {
    try {
      const position = await getUserLocation();
      const { latitude, longitude } = position.coords;
      setLat(latitude);
      setLon(longitude);
      setSelectedLan(findNearestLan(latitude, longitude));
    } catch (error) {
      console.error('Geolocation error:', error);
      alert('Kunde inte hämta din plats. Kontrollera att du gett tillåtelse.');
    }
  };

  const handleLanChange = (value: string) => {
    const canonicalName = normalizeLanName(value);
    if (!canonicalName) return;

    setSelectedLan(canonicalName);
    if (canonicalName !== ALL_COUNTIES) {
      const coordinates = getLanCoordinates(canonicalName);
      if (coordinates) {
        setLat(coordinates.lat);
        setLon(coordinates.lon);
      }
    }
  };

  return (
    <div className="location-selector">
      <span className="location-heading">Plats</span>
      <label className="visually-hidden" htmlFor="county-select">Välj län</label>
      <div className="location-controls">
        <select
          id="county-select"
          value={selectedLan}
          onChange={(e) => handleLanChange(e.target.value)}
        >
          <option value={ALL_COUNTIES}>Alla län</option>
          {allLans.map(lan => (
            <option key={lan} value={lan}>{getCountyDisplayName(lan)}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleUseLocation}
          title="Använd min plats"
          aria-label="Använd min plats"
        >
          <span aria-hidden="true">⌖</span> Använd min plats
        </button>
      </div>
      <div className="coordinates">
        <span>Lat: {lat.toFixed(4)}, Lon: {lon.toFixed(4)}</span>
      </div>
    </div>
  );
};

export default LocationSelector;
