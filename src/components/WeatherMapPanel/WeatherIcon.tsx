import { weatherSymbol } from './wind';

type WeatherKind = ReturnType<typeof weatherSymbol>;

const labels: Record<WeatherKind, string> = {
  sun: 'Soligt',
  'partly-cloudy': 'Halvklart',
  cloud: 'Molnigt',
  rain: 'Regn',
  snow: 'Snö',
  thunder: 'Åska',
  fog: 'Dimma',
};

export default function WeatherIcon({ kind }: { kind: WeatherKind }) {
  return (
    <span className="weather-icon" >
    <svg className="forecast-symbol" viewBox="0 0 32 32" role="img" aria-label={labels[kind]} focusable="false" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <title>{labels[kind]}</title>
      {(kind === 'sun' || kind === 'partly-cloudy') && <g stroke="#e9b956">
        <circle cx="12" cy="11" r="4" fill="#e9b956" />
        <path d="M12 3v2M12 17v2M4 11h2M18 11h2M6.3 5.3l1.4 1.4M16.3 15.3l1.4 1.4M6.3 16.7l1.4-1.4M16.3 6.7l1.4-1.4" />
      </g>}
      {kind !== 'sun' && <path d="M8 21a5 5 0 0 1-1-9.9A7 7 0 0 1 20.5 10a5.5 5.5 0 1 1 3 11Z" fill="#b9cbd0" stroke="#eadcc0" />}
      {kind === 'rain' && <path d="m10 25-1 3m8-3-1 3m8-3-1 3" stroke="#78bbde" />}
      {kind === 'snow' && <g stroke="#d1e9f2"><path d="M10 25v5m-2-4 4 3m0-3-4 3M22 25v5m-2-4 4 3m0-3-4 3" /></g>}
      {kind === 'thunder' && <path d="m17 22-4 5h4l-2 4 7-6h-5l2-3Z" fill="#e9b956" stroke="#e9b956" />}
      {kind === 'fog' && <path d="M5 25h22M8 29h16" stroke="#b9cbd0" />}
    </svg>
      <span className="weather-icon-label" aria-hidden="true">{labels[kind]}</span>
    </span>
  );
}
