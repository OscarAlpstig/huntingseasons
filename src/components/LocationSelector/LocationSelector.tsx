import React from 'react';

// Hårdkodade koordinater (ungefärligt centrum) för Sveriges 21 län
const LAN_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Blekinge län':          { lat: 56.1677, lon: 14.8563 },
  'Dalarnas län':          { lat: 61.0914, lon: 14.6664 },
  'Gotlands län':          { lat: 57.4684, lon: 18.4867 },
  'Gävleborgs län':        { lat: 60.6749, lon: 16.1463 },
  'Hallands län':          { lat: 56.6745, lon: 12.8578 },
  'Jämtlands län':         { lat: 63.1792, lon: 14.6357 },
  'Jönköpings län':        { lat: 57.7826, lon: 14.1618 },
  'Kalmar län':            { lat: 56.6616, lon: 16.3616 },
  'Kronobergs län':        { lat: 56.8809, lon: 14.8059 },
  'Norrbottens län':       { lat: 67.8558, lon: 20.2253 },
  'Skåne län':             { lat: 55.9903, lon: 13.5958 },
  'Stockholms län':        { lat: 59.3293, lon: 18.0686 },
  'Södermanlands län':     { lat: 59.0000, lon: 16.5000 },
  'Uppsala län':           { lat: 59.8586, lon: 17.6389 },
  'Värmlands län':         { lat: 59.3793, lon: 13.5036 },
  'Västerbottens län':     { lat: 64.7507, lon: 20.9528 },
  'Västernorrlands län':   { lat: 62.3908, lon: 17.3069 },
  'Västmanlands län':      { lat: 59.6162, lon: 16.5528 },
  'Västra Götalands län':  { lat: 58.2528, lon: 13.0596 },
  'Örebro län':            { lat: 59.2741, lon: 15.2066 },
  'Östergötlands län':     { lat: 58.4108, lon: 15.6214 },
};

/** Beräknar ungefärligt avstånd (grader²) mellan två koordinater. */
function distanceSq(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return (lat1 - lat2) ** 2 + (lon1 - lon2) ** 2;
}

/** Hittar närmaste län baserat på koordinater. */
function nearestLan(latitude: number, longitude: number): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const [lan, coords] of Object.entries(LAN_COORDINATES)) {
    const d = distanceSq(latitude, longitude, coords.lat, coords.lon);
    if (d < bestDist) {
      bestDist = d;
      best = lan;
    }
  }
  return best;
}

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
      const matched = nearestLan(latitude, longitude);
      if (matched && allLans.includes(matched)) {
        setSelectedLan(matched);
      } else if (matched) {
        setSelectedLan(matched);
      } else {
        alert('Kunde inte hitta närmaste län för din plats.');
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      alert('Kunde inte hämta din plats. Kontrollera att du gett tillåtelse.');
    }
  };

  React.useEffect(() => {
    if (selectedLan !== 'Alla län') {
      const coords = LAN_COORDINATES[selectedLan];
      if (coords) {
        setLat(coords.lat);
        setLon(coords.lon);
      }
    }
    // eslint-disable-next-line
  }, [selectedLan]);

  return (
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
      <div style={{ fontSize: '0.9em', color: 'gray', marginTop: 4 }}>
        <span>Lat: {lat.toFixed(4)}, Lon: {lon.toFixed(4)}</span>
      </div>
    </div>
  );
};

export default LocationSelector;
