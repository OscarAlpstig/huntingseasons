import { useEffect, useRef, useState } from 'react';

export function useGeolocation(onLocate: (lat: number, lon: number) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const callback = useRef(onLocate);
  const requestId = useRef(0);
  callback.current = onLocate;

  useEffect(() => () => { requestId.current += 1; }, []);

  const locate = () => {
    const id = ++requestId.current;
    setError('');
    if (!navigator.geolocation) {
      setError('Din webbläsare stöder inte platspositionering. Välj en plats på kartan.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (id !== requestId.current) return;
        setLoading(false);
        callback.current(coords.latitude, coords.longitude);
      },
      ({ code }) => {
        if (id !== requestId.current) return;
        setLoading(false);
        setError(code === 1
          ? 'Platsåtkomst nekades. Tillåt platsåtkomst i webbläsaren eller välj en plats på kartan.'
          : code === 3
            ? 'Det tog för lång tid att hitta din position. Försök igen eller välj en plats på kartan.'
            : 'Din position kunde inte hämtas. Försök igen eller välj en plats på kartan.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return { locate, loading, error };
}
