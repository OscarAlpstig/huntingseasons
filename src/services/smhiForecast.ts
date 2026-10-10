export interface SmhiWeatherData {
  wind_from_direction: number;
  wind_speed: number;
  wind_speed_of_gust: number;
  air_temperature?: number;
  relative_humidity?: number;
  precipitation_amount_mean?: number;
  probability_of_precipitation?: number;
  precipitation_frozen_part?: number;
  symbol_code?: number;
}

export interface ForecastPoint {
  time: string;
  data: SmhiWeatherData;
}

export interface WeatherForecast {
  createdTime: string;
  referenceTime: string;
  coordinates: [number, number];
  timeSeries: ForecastPoint[];
}

interface SmhiResponse {
  createdTime?: unknown;
  referenceTime?: unknown;
  geometry?: { coordinates?: unknown };
  timeSeries?: unknown;
}

const API_BASE = 'https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point';
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { expires: number; forecast: WeatherForecast }>();

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseForecast(payload: SmhiResponse): WeatherForecast {
  const coordinates = payload.geometry?.coordinates;
  if (!Array.isArray(coordinates) || !isFiniteNumber(coordinates[0]) || !isFiniteNumber(coordinates[1])) {
    throw new Error('SMHI returnerade ogiltiga koordinater.');
  }

  if (!Array.isArray(payload.timeSeries)) throw new Error('SMHI returnerade ingen prognosserie.');
  const timeSeries = payload.timeSeries.flatMap((entry): ForecastPoint[] => {
    if (!entry || typeof entry !== 'object') return [];
    const candidate = entry as { time?: unknown; data?: Record<string, unknown> };
    const data = candidate.data;
    if (
      typeof candidate.time !== 'string' || !data ||
      !isFiniteNumber(data.wind_from_direction) ||
      !isFiniteNumber(data.wind_speed) ||
      !isFiniteNumber(data.wind_speed_of_gust)
    ) return [];

    return [{
      time: candidate.time,
      data: {
        wind_from_direction: data.wind_from_direction,
        wind_speed: data.wind_speed,
        wind_speed_of_gust: data.wind_speed_of_gust,
        air_temperature: isFiniteNumber(data.air_temperature) ? data.air_temperature : undefined,
        relative_humidity: isFiniteNumber(data.relative_humidity) ? data.relative_humidity : undefined,
        precipitation_amount_mean: isFiniteNumber(data.precipitation_amount_mean) ? data.precipitation_amount_mean : undefined,
        probability_of_precipitation: isFiniteNumber(data.probability_of_precipitation) ? data.probability_of_precipitation : undefined,
        precipitation_frozen_part: isFiniteNumber(data.precipitation_frozen_part) ? data.precipitation_frozen_part : undefined,
        symbol_code: isFiniteNumber(data.symbol_code) ? data.symbol_code : undefined,
      },
    }];
  });

  if (!timeSeries.length) throw new Error('SMHI-prognosen saknar användbara vinddata.');
  return {
    createdTime: typeof payload.createdTime === 'string' ? payload.createdTime : '',
    referenceTime: typeof payload.referenceTime === 'string' ? payload.referenceTime : '',
    coordinates: [coordinates[0], coordinates[1]],
    timeSeries,
  };
}

export function buildSmhiForecastUrl(lat: number, lon: number) {
  if (!isFiniteNumber(lat) || lat < -90 || lat > 90 || !isFiniteNumber(lon) || lon < -180 || lon > 180) {
    throw new RangeError('Ogiltiga koordinater.');
  }
  return `${API_BASE}/lon/${lon.toFixed(6)}/lat/${lat.toFixed(6)}/data.json`;
}

export async function fetchSmhiForecast(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherForecast> {
  const url = buildSmhiForecastUrl(lat, lon);
  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) return cached.forecast;

  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) {
    if (response.status === 400 || response.status === 404) throw new Error('Platsen ligger utanför SMHI:s prognosområde.');
    throw new Error(`Väderprognosen kunde inte hämtas (${response.status}).`);
  }

  const forecast = parseForecast(await response.json() as SmhiResponse);
  cache.set(url, { expires: Date.now() + CACHE_TTL_MS, forecast });
  return forecast;
}

export function clearForecastCache() {
  cache.clear();
}
