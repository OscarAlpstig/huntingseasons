import { storage } from './storage';
import { buildSmhiForecastUrl, fetchSmhiForecast, type WeatherForecast } from '../services/smhiForecast';

export interface SavedForecast {
  kind: 'forecast';
  forecast: WeatherForecast;
  fetchedAt: number;
  location: [number, number];
}
export interface ForecastResult extends SavedForecast {
  saved: boolean;
  persisted: boolean;
}

export function isForecastExpired(forecast: WeatherForecast, now = Date.now()) {
  return !forecast.timeSeries.some((point) => new Date(point.time).getTime() >= now);
}

export async function loadForecast(lat: number, lon: number, signal?: AbortSignal): Promise<ForecastResult> {
  const key = `forecast:${buildSmhiForecastUrl(lat, lon)}`;
  // The network response, not navigator.onLine, determines whether data is fresh.
  const timeout = new AbortController();
  const abort = () => timeout.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) timeout.abort();
  const timer = setTimeout(abort, 10000);
  try {
    const forecast = await fetchSmhiForecast(lat, lon, timeout.signal, true);
    if (signal?.aborted) throw new DOMException('Avbruten', 'AbortError');
    const record: SavedForecast = { kind: 'forecast', forecast, fetchedAt: Date.now(), location: [lat, lon] };
    let persisted = true;
    try { await storage.put(key, record); } catch { persisted = false; }
    return { ...record, saved: false, persisted };
  } catch (error) {
    if (signal?.aborted) throw error;
    const saved = await storage.get<SavedForecast>(key).catch(() => undefined);
    if (saved?.kind === 'forecast' && Array.isArray(saved.forecast?.timeSeries) && saved.forecast.timeSeries.length && Number.isFinite(saved.fetchedAt)) return { ...saved, saved: true, persisted: true };
    throw new Error('Prognosen kunde inte uppdateras och ingen sparad prognos finns för den här platsen.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
