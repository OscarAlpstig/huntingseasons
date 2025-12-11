import React from 'react';

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
  // Flytta in logik för att hämta plats och län
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
      setLat(latitude);
      setLon(longitude);
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

  React.useEffect(() => {
    // När selectedLan ändras via dropdown, hämta lat/lon från Nominatim om det inte är "Alla län"
    const fetchLatLonForLan = async (lan: string) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?country=Sweden&county=${encodeURIComponent(lan)}&format=json&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setLat(parseFloat(data[0].lat));
          setLon(parseFloat(data[0].lon));
        }
      } catch (error) {
        // Om det blir fel, gör inget
        console.error('Kunde inte hämta lat/lon för län:', lan, error);
      }
    };

    if (selectedLan !== "Alla län") {
      fetchLatLonForLan(selectedLan);
    }
    // Om "Alla län" väljs, gör inget (eller sätt default om så önskas)
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
