import { useId } from 'react';
import { getIlluminatedPath, getMoonPhaseName } from './moonPhase';

interface MoonProps {
  phase: number;
  fraction: number;
  size?: number;
}

const Moon = ({ phase, fraction, size = 64 }: MoonProps) => {
  const clipId = useId().replace(/:/g, '');
  const safePhase = Number.isFinite(phase) ? phase : 0;
  const safeFraction = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  const name = getMoonPhaseName(safePhase);

  return (
    <svg className="moon-phase" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${name}, ${Math.round(safeFraction * 100)} procent belyst`}>
      <defs><clipPath id={clipId}><circle cx="50" cy="50" r="48" /></clipPath></defs>
      <circle cx="50" cy="50" r="48" fill="#071512" stroke="#9fb18b" strokeWidth="2" />
      <path d={getIlluminatedPath(safePhase)} fill="#eadcc0" clipPath={`url(#${clipId})`} />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#eadcc0" strokeOpacity=".45" />
    </svg>
  );
};

export default Moon;
