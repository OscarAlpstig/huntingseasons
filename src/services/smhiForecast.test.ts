import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSmhiForecastUrl, clearForecastCache, fetchSmhiForecast } from './smhiForecast';

const responseBody = {
  createdTime: '2026-10-10T18:45:00Z',
  referenceTime: '2026-10-10T18:45:00Z',
  geometry: { type: 'Point', coordinates: [16.011977, 57.996626] },
  timeSeries: [{
    time: '2026-10-10T19:00:00Z',
    data: {
      wind_from_direction: 142,
      wind_speed: 0.7,
      wind_speed_of_gust: 2.3,
      air_temperature: 6.6,
      relative_humidity: 100,
      precipitation_amount_mean: 0.4,
      probability_of_precipitation: 82,
      precipitation_frozen_part: 0,
      symbol_code: 18,
    },
  }],
};

afterEach(() => {
  clearForecastCache();
  vi.unstubAllGlobals();
});

describe('SMHI SNOW1gv1', () => {
  it('bygger punkt-URL med högst sex decimaler', () => {
    expect(buildSmhiForecastUrl(58.9959442, 16.2058242)).toBe(
      'https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/16.205824/lat/58.995944/data.json',
    );
  });

  it('hämtar och typkontrollerar vindprognosen', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => responseBody });
    vi.stubGlobal('fetch', fetchMock);

    const forecast = await fetchSmhiForecast(58, 16);

    expect(forecast.coordinates).toEqual([16.011977, 57.996626]);
    expect(forecast.timeSeries[0]).toEqual(responseBody.timeSeries[0]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/lon/16.000000/lat/58.000000/'), expect.objectContaining({
      headers: { Accept: 'application/json' },
    }));
  });

  it('återanvänder prognosen inom cachetiden', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => responseBody });
    vi.stubGlobal('fetch', fetchMock);

    await fetchSmhiForecast(58, 16);
    await fetchSmhiForecast(58, 16);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('ger ett begripligt fel för plats utanför prognosområdet', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));

    await expect(fetchSmhiForecast(40, 16)).rejects.toThrow('utanför SMHI:s prognosområde');
  });
});
