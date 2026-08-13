export type SolarPhase = 'dawn' | 'sunrise' | 'sunset' | 'dusk';

const labels: Record<SolarPhase, string> = {
  dawn: 'Borgerlig gryning',
  sunrise: 'Soluppgång',
  sunset: 'Solnedgång',
  dusk: 'Borgerlig skymning',
};

export const SolarIcon = ({ phase, decorative = false }: { phase: SolarPhase; decorative?: boolean }) => (
  <img
    className="solar-icon"
    src={`${import.meta.env.BASE_URL}icons/solar-${phase}.png`}
    alt={decorative ? '' : labels[phase]}
    width="128"
    height="128"
  />
);
