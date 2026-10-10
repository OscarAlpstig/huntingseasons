import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchSmhiForecast, type WeatherForecast } from '../../services/smhiForecast';
import { compassDirection, destinationPoint, downwindDirection, weatherSymbol } from './wind';
import WeatherIcon from './WeatherIcon';

interface Props {
  lat: number;
  lon: number;
  onLocationChange: (lat: number, lon: number) => void;
}

const formatTime = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Stockholm',
});
const formatHour = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Stockholm' });

const markerIcon = L.divIcon({
  className: 'selected-location-marker',
  html: '<span aria-hidden="true"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function WeatherMapPanel({ lat, lon, onLocationChange }: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const initialPosition = useRef<[number, number]>([lat, lon]);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const plume = useRef<L.LayerGroup | null>(null);
  const plumeLine = useRef<L.Polyline | null>(null);
  const framedDistance = useRef<number | null>(null);
  const callback = useRef(onLocationChange);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [displayDistance, setDisplayDistance] = useState(500);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [locationError, setLocationError] = useState('');

  callback.current = onLocationChange;

  useEffect(() => {
    if (!mapElement.current || map.current) return;
    const [initialLat, initialLon] = initialPosition.current;
    const instance = L.map(mapElement.current, { zoomControl: true }).setView([initialLat, initialLon], 12);
    L.control.scale({ imperial: false }).addTo(instance);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(instance);
    const selectedMarker = L.marker([initialLat, initialLon], { icon: markerIcon, draggable: true }).addTo(instance);
    instance.on('click', (event: L.LeafletMouseEvent) => callback.current(event.latlng.lat, event.latlng.lng));
    selectedMarker.on('dragend', () => {
      const position = selectedMarker.getLatLng();
      callback.current(position.lat, position.lng);
    });
    map.current = instance;
    marker.current = selectedMarker;
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, []); // Map lifecycle is intentionally independent of coordinate updates.

  useEffect(() => {
    marker.current?.setLatLng([lat, lon]);
    map.current?.panTo([lat, lon]);
  }, [lat, lon]);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError('');
    const timer = window.setTimeout(() => {
      fetchSmhiForecast(lat, lon, controller.signal)
        .then((nextForecast) => {
          setForecast(nextForecast);
          const now = Date.now();
          const closestFuture = nextForecast.timeSeries.find((point) => new Date(point.time).getTime() >= now);
          setSelectedTime((closestFuture ?? nextForecast.timeSeries[0]).time);
          setStatus('ready');
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          setForecast(null);
          setError(reason instanceof Error ? reason.message : 'Väderprognosen kunde inte hämtas.');
          setStatus('error');
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [lat, lon]);

  const selectedForecast = useMemo(
    () => forecast?.timeSeries.find((point) => point.time === selectedTime) ?? null,
    [forecast, selectedTime],
  );
  const nearbyForecast = useMemo(() => {
    const selectedTimestamp = new Date(selectedTime).getTime();
    if (!forecast || !Number.isFinite(selectedTimestamp)) return [];
    const threeHours = 3 * 60 * 60 * 1000;
    return forecast.timeSeries.filter((point) => Math.abs(new Date(point.time).getTime() - selectedTimestamp) <= threeHours);
  }, [forecast, selectedTime]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Din webbläsare stöder inte platspositionering.');
      return;
    }

    setLocationStatus('loading');
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        callback.current(coords.latitude, coords.longitude);
        map.current?.setView([coords.latitude, coords.longitude], Math.max(map.current.getZoom(), 12));
        setLocationStatus('idle');
      },
      (positionError) => {
        setLocationStatus('error');
        setLocationError(positionError.code === positionError.PERMISSION_DENIED
          ? 'Platsåtkomst nekades. Tillåt platsåtkomst i webbläsaren och försök igen.'
          : 'Din position kunde inte hämtas. Försök igen.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    plume.current?.remove();
    plumeLine.current?.remove();
    plume.current = null;
    plumeLine.current = null;
    if (!map.current || !selectedForecast) return;

    const { wind_from_direction: from, wind_speed: speed, wind_speed_of_gust: gust } = selectedForecast.data;
    const direction = downwindDirection(from);
    const length = displayDistance;
    const spreadAngle = Math.max(10, 32 - speed * 2 + Math.max(0, gust - speed));
    const left = destinationPoint(lat, lon, direction - spreadAngle, length);
    const end = destinationPoint(lat, lon, direction, length);
    const right = destinationPoint(lat, lon, direction + spreadAngle, length);
    const layers: L.Layer[] = [L.polygon([[lat, lon], left, end, right], {
      color: '#f2b66d', fillColor: '#e9893d', fillOpacity: 0.025, opacity: 0.55, weight: 1.5,
      dashArray: '5 9', className: 'scent-plume-boundary',
    })];

    const bandCount = 12;
    let previousLeft: [number, number] = [lat, lon];
    let previousRight: [number, number] = [lat, lon];
    for (let index = 0; index < bandCount; index += 1) {
      const progress = (index + 1) / bandCount;
      const center = destinationPoint(lat, lon, direction, length * progress);
      const halfWidth = Math.tan(spreadAngle * Math.PI / 180) * length * progress;
      const bandLeft = destinationPoint(center[0], center[1], direction - 90, halfWidth);
      const bandRight = destinationPoint(center[0], center[1], direction + 90, halfWidth);
      layers.push(L.polygon([previousLeft, bandLeft, bandRight, previousRight], {
        stroke: false,
        fillColor: index < 3 ? '#f0a157' : '#e9893d',
        fillOpacity: 0.5 * Math.pow(1 - index / bandCount, 1.45) + 0.025,
        className: `scent-band scent-band-${index + 1}`,
      }));
      previousLeft = bandLeft;
      previousRight = bandRight;
    }
    plume.current = L.layerGroup(layers).addTo(map.current);
    plumeLine.current = L.polyline([[lat, lon], end], {
      color: '#eadcc0', opacity: 0.65, weight: 1.5, dashArray: '4 10', className: 'scent-direction-line',
    }).addTo(map.current);
    if (framedDistance.current !== displayDistance) {
      map.current.fitBounds(L.latLngBounds([[lat, lon], previousLeft, previousRight, end]), {
        padding: [48, 48], maxZoom: 17,
      });
      framedDistance.current = displayDistance;
    }
  }, [lat, lon, selectedForecast, displayDistance]);

  return (
    <section className="weather-map-panel" aria-labelledby="weather-map-heading">
      <div className="weather-map-copy">
        <span className="eyebrow">VIND &amp; VITTRING</span>
        <h2 id="weather-map-heading">Vindprognos för vald plats</h2>
        <p>Klicka på kartan, dra markören eller använd positionsknappen i kartan.</p>
        {locationError && <p role="alert" className="location-error">{locationError}</p>}
        {status === 'loading' && <p role="status" className="weather-status">Hämtar prognos från SMHI…</p>}
        {status === 'error' && <p role="alert" className="weather-error">{error}</p>}
        {forecast && selectedForecast && <>
          <label htmlFor="forecast-time">Prognostid</label>
          <select id="forecast-time" value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)}>
            {forecast.timeSeries.map((point) => <option key={point.time} value={point.time}>{formatTime.format(new Date(point.time))}</option>)}
          </select>
          <div className="wind-summary">
            <div><span>Medelvind</span><strong>{selectedForecast.data.wind_speed.toFixed(1)} m/s</strong></div>
            <div><span>Byvind</span><strong>{selectedForecast.data.wind_speed_of_gust.toFixed(1)} m/s</strong></div>
            <div><span>Vind från</span><strong>{compassDirection(selectedForecast.data.wind_from_direction)} {Math.round(selectedForecast.data.wind_from_direction)}°</strong></div>
            <div><span>Vittring mot</span><strong>{compassDirection(downwindDirection(selectedForecast.data.wind_from_direction))} {Math.round(downwindDirection(selectedForecast.data.wind_from_direction))}°</strong></div>
          </div>
          <div className="nearby-forecast" aria-label="Väderprognos tre timmar före och efter vald tid">
            <div className="nearby-forecast-heading"><strong>Vädret omkring vald tid</strong><span>± 3 timmar</span></div>
            <div className="forecast-strip">
              {nearbyForecast.map((point) => {
                const isSelected = point.time === selectedTime;
                const precipitation = point.data.precipitation_amount_mean ?? 0;
                const probability = point.data.probability_of_precipitation ?? 0;
                return <button type="button" key={point.time} className={isSelected ? 'forecast-hour selected' : 'forecast-hour'} aria-current={isSelected ? 'time' : undefined} onClick={() => setSelectedTime(point.time)}>
                  <time dateTime={point.time}>{formatHour.format(new Date(point.time))}</time>
                  <WeatherIcon kind={weatherSymbol(point.data.symbol_code, precipitation, point.data.precipitation_frozen_part)} />
                  <strong>{point.data.wind_speed.toFixed(1)} m/s</strong>
                  <span>{compassDirection(point.data.wind_from_direction)} · {probability > 0 ? `${Math.round(probability)}%` : `${precipitation.toFixed(1)} mm`}</span>
                </button>;
              })}
            </div>
          </div>
          <label htmlFor="scent-distance">Visningsavstånd</label>
          <select id="scent-distance" value={displayDistance} aria-describedby="scent-distance-note" onChange={(event) => setDisplayDistance(Number(event.target.value))}>
            {[100, 250, 500, 1000].map((distance) => <option key={distance} value={distance}>{distance.toLocaleString('sv-SE')} meter</option>)}
          </select>
          <p id="scent-distance-note" className="weather-disclaimer">Konen illustrerar spridningsriktningen över valt avstånd. Färgtoningen visar inte beräknad doftkoncentration och konens slut är ingen gräns för vad djur kan känna. Terräng och lokala luftströmmar kan ändra spridningen.</p>
        </>}
      </div>
      <div className="weather-map-wrap">
        <div ref={mapElement} className="weather-map" role="region" aria-label="Karta för val av prognosplats" />
        <button
          type="button"
          className="map-location-button"
          onClick={useCurrentLocation}
          disabled={locationStatus === 'loading'}
          aria-label={locationStatus === 'loading' ? 'Hämtar din position' : 'Använd min plats'}
          title="Använd min plats"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
        <span className="map-coordinates">{lat.toFixed(5)}, {lon.toFixed(5)}</span>
      </div>
      <footer>Väderdata: SMHI, bearbetad · Karta: © OpenStreetMap contributors</footer>
    </section>
  );
}
