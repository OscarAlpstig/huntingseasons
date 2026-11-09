import { weatherSymbol } from './wind';
import { useEffect, useId, useRef, useState } from 'react';

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
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [open]);

  return (
    <span ref={container} className={`weather-icon${open ? ' weather-icon-open' : ''}`}>
    <button type="button" className="weather-icon-button" aria-label={`Visa väderförklaring: ${labels[kind]}`} aria-expanded={open} aria-describedby={open ? tooltipId : undefined} onClick={() => setOpen((value) => !value)} onBlur={() => setOpen(false)}>
    <svg className="forecast-symbol" viewBox="0 0 32 32" role="img" aria-label={labels[kind]} focusable="false" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
    </button>
      <span id={tooltipId} role="tooltip" className="weather-icon-label">{labels[kind]}</span>
    </span>
  );
}
