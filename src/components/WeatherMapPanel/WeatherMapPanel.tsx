import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchSmhiForecast, type WeatherForecast } from '../../services/smhiForecast';
import { compassDirection, downwindDirection, weatherSymbol } from './wind';
import WeatherIcon from './WeatherIcon';
import TerrainMap from '../TerrainMap/TerrainMap';
import { createScentLayer } from '../TerrainMap/scentLayer';
import type { MapOverlay } from '../TerrainMap/overlays';
import type { LatLngBoundsExpression } from 'leaflet';

interface Props {
  lat: number;
  lon: number;
  onLocationChange: (lat: number, lon: number) => void;
}

const formatTime = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Stockholm',
});
const formatHour = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Stockholm' });

export default function WeatherMapPanel({ lat, lon, onLocationChange }: Props) {
  const framedDistance = useRef<number | null>(null);
  const [focusBounds, setFocusBounds] = useState<LatLngBoundsExpression>();
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [displayDistance, setDisplayDistance] = useState(500);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

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

  const overlays = useMemo<MapOverlay[]>(() => selectedForecast ? [{
    id: 'scent', label: 'Vittring',
    create: () => createScentLayer(lat, lon, selectedForecast.data, displayDistance),
  }] : [], [lat, lon, selectedForecast, displayDistance]);

  useEffect(() => {
    if (!selectedForecast || framedDistance.current === displayDistance) return;
    const layer = createScentLayer(lat, lon, selectedForecast.data, displayDistance);
    setFocusBounds(layer.getBounds());
    framedDistance.current = displayDistance;
  }, [lat, lon, selectedForecast, displayDistance]);

  return (
    <section className="weather-map-panel" aria-labelledby="weather-map-heading">
      <div className="weather-map-copy">
        <span className="eyebrow">VIND &amp; VITTRING</span>
        <h2 id="weather-map-heading">Vindprognos för vald plats</h2>
        <p>Klicka på kartan, dra markören eller använd positionsknappen i kartan.</p>
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
                const precipitation = point.data.precipitation_amount_mean;
                const probability = point.data.probability_of_precipitation;
                return <button type="button" key={point.time} className={isSelected ? 'forecast-hour selected' : 'forecast-hour'} aria-current={isSelected ? 'time' : undefined} onClick={() => setSelectedTime(point.time)}>
                  <time dateTime={point.time}>{formatHour.format(new Date(point.time))}</time>
                  <WeatherIcon kind={weatherSymbol(point.data.symbol_code, precipitation, point.data.precipitation_frozen_part)} />
                  <strong title="Vindstyrka och riktning">{point.data.wind_speed.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m/s · {compassDirection(point.data.wind_from_direction)}</strong>
                  <span className="forecast-detail forecast-precipitation" title="Sannolikhet för nederbörd och prognostiserad mängd" aria-label={`Nederbördssannolikhet: ${probability === undefined ? 'uppgift saknas' : `${Math.round(probability)} procent`}. Nederbördsmängd: ${precipitation === undefined ? 'uppgift saknas' : `${precipitation.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} millimeter`}`}>
                    {probability === undefined ? '– %' : `${Math.round(probability)} %`} · {precipitation === undefined ? '– mm' : `${precipitation.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm`}
                  </span>
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
        <TerrainMap lat={lat} lon={lon} onLocationChange={onLocationChange} overlays={overlays} focusBounds={focusBounds} />
      </div>
      <footer>Väderdata: SMHI, bearbetad · Kartans källor och licenser visas i kartan.</footer>
    </section>
  );
}
