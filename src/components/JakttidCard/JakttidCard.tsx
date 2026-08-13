import './JakttidCard.scss';
import { AnimalIcon } from '../AnimalIcon/AnimalIcon';
import { SolarIcon } from '../SolarIcon/SolarIcon';
import { CalendarIcon } from '../CalendarIcon/CalendarIcon';

interface JakttidCardProps {
  art: string;
  category: string;
  info: string;
  rules: string;
  times: string;
  localArea: string;
  solarRule: string;
  solarLimited: boolean;
  localException: boolean;
}

const JakttidCard = ({ art, category, info, rules, times, localArea, solarRule, solarLimited, localException }: JakttidCardProps) => (
  <article className="jakttid-card">
    <div className="animal-icon"><AnimalIcon species={art} /></div>
    <div className="species-cell">
      <h2>{art}</h2>
      <span>{category}</span>
    </div>
    <div className="fact-cell time-cell"><span>Jakttid</span><strong><CalendarIcon />{times}</strong></div>
    <div className="fact-cell solar-cell"><span>Solbegränsning</span><strong>{solarLimited && <SolarIcon phase="sunrise" decorative />}{solarRule}</strong></div>
    <div className="fact-cell rule-cell">
      <span>Regler</span>
      {localException && <strong className="warning-badge">▲ Lokalt område: {localArea}. Kontrollera att jaktplatsen omfattas.</strong>}
      <p>{[info, rules].filter(Boolean).join(' · ') || 'Inga särskilda regler.'}</p>
    </div>
  </article>
);

export default JakttidCard;
