import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isForecastExpired, loadForecast } from './forecastStore';
import { storage } from './storage';
import { buildSmhiForecastUrl } from '../services/smhiForecast';

const payload = {
  geometry: { coordinates: [16, 59] },
  timeSeries: [{ time: '2030-01-01T00:00:00Z', data: { wind_from_direction: 90, wind_speed: 2, wind_speed_of_gust: 4 } }],
};
beforeEach(() => vi.stubGlobal('indexedDB', new IDBFactory()));
afterEach(() => vi.unstubAllGlobals());

describe('beständiga prognoser', () => {
  it('sparar prognosen och läser rätt plats efter nätverksfel', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal('fetch', fetcher);
    const fresh = await loadForecast(59, 16);
    expect(fresh.saved).toBe(false);
    expect(fresh.persisted).toBe(true);
    fetcher.mockRejectedValue(new TypeError('offline'));
    const cached = await loadForecast(59, 16);
    expect(cached.saved).toBe(true);
    expect(cached.fetchedAt).toBe(fresh.fetchedAt);
    expect(cached.forecast).toEqual(fresh.forecast);
    await expect(loadForecast(58, 15)).rejects.toThrow('ingen sparad prognos');
  });

  it('försöker faktiskt uppdatera även om minnescachen är färsk', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal('fetch', fetcher);
    await loadForecast(59, 16); await loadForecast(59, 16);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('kan visa onlineväder även om lagringen är blockerad', async () => {
    vi.stubGlobal('indexedDB', undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    expect((await loadForecast(59, 16)).persisted).toBe(false);
  });

  it('returnerar inte cachat väder efter en avbruten platsförfrågan', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    const first = await loadForecast(59, 16);
    expect(await storage.get(`forecast:${buildSmhiForecastUrl(59, 16)}`)).toBeDefined();
    const controller = new AbortController(); controller.abort();
    await expect(loadForecast(59, 16, controller.signal)).rejects.toHaveProperty('name', 'AbortError');
    expect(first.saved).toBe(false);
  });

  it('avgör när samtliga prognostider har löpt ut', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    const { forecast } = await loadForecast(59, 16);
    expect(isForecastExpired(forecast, Date.parse('2029-12-31T23:00:00Z'))).toBe(false);
    expect(isForecastExpired(forecast, Date.parse('2030-01-01T01:00:00Z'))).toBe(true);
  });
});
