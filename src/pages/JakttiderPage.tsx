import { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import JakttidCard from '../components/JakttidCard/JakttidCard';
import LocationSelector from '../components/LocationSelector/LocationSelector';
import { getFaglarList, getDaggdjurList } from '../data/jaktTiderLoader';
import { describeAreas, formatMonthDay, isDateInHuntingPeriod, matchArea } from '../data/huntingData';
import { ALL_COUNTIES, getCountyDisplayName } from '../data/lan';
import Moon from '../components/Moon';
import { getMoonPhaseName } from '../components/Moon/moonPhase';
import { SolarIcon } from '../components/SolarIcon/SolarIcon';
// @ts-expect-error Legacy module without type declarations.
import { GetMoonIllumination, GetMoonTimes } from '../../lib/Suncalc/suncalc';
import { getDateAtTimeInZone, GetTimeOfDay } from '../../lib/utils';
import { calculateSolarTimes } from '../../lib/solarTimes';

interface Props {
  selectedDate: Date;
  setSelectedDate?: (date: Date) => void;
  selectedLan: string;
  setSelectedLan: (lan: string) => void;
  lat: number;
  lon: number;
  setLat: (lat: number) => void;
  setLon: (lon: number) => void;
  allLans: string[];
}

const JakttiderPage = ({ selectedDate, setSelectedDate, selectedLan, setSelectedLan, lat, lon, setLat, setLon, allLans }: Props) => {
  const [birds, setBirds] = useState(true);
  const [mammals, setMammals] = useState(true);
  const [astronomyExpanded, setAstronomyExpanded] = useState(true);

  const visible = useMemo(() => [
    ...(birds ? getFaglarList() : []),
    ...(mammals ? getDaggdjurList() : []),
  ].flatMap((row) => {
    if (!isDateInHuntingPeriod(selectedDate, row.period.start, row.period.end)) return [];
    const areaMatch = selectedLan === ALL_COUNTIES ? 'direkt' : matchArea(row.period.omraden, selectedLan);
    return areaMatch === 'ingen' ? [] : [{ ...row, areaMatch }];
  }), [birds, mammals, selectedDate, selectedLan]);

  const { calculationDate, timeZone, times: sun } = calculateSolarTimes(selectedDate, lat, lon);
  const moon = GetMoonIllumination(calculationDate);
  const moonTimes = GetMoonTimes(getDateAtTimeInZone(selectedDate, timeZone, 0), lat, lon);
  const moonRise = moonTimes.alwaysUp ? 'Alltid uppe' : moonTimes.alwaysDown ? 'Alltid nere' : GetTimeOfDay(moonTimes.rise, timeZone);
  const moonSet = moonTimes.alwaysUp ? 'Alltid uppe' : moonTimes.alwaysDown ? 'Alltid nere' : GetTimeOfDay(moonTimes.set, timeZone);
  const uniqueSpecies = new Set(visible.map(({ art }) => art)).size;
  const updateDate = setSelectedDate ?? (() => undefined);

  return (
    <div className="hunting-page">
      <section className="hunting-hero">
        <div><h1 aria-label="Jakttider">JAKTTIDER</h1><p>Se när du får jaga olika arter där du befinner dig.</p><strong>Säker jakt. Stark natur.</strong></div>
        <div className="sun-today astronomy-panel" aria-label="Sol- och måntider för vald dag">
          <span>SOLEN &amp; MÅNEN VALD DAG</span>
          <div className="solar-phases">
            <div className="astro-item"><span className="astro-icon-slot"><SolarIcon phase="dawn" decorative /></span><span className="astro-copy"><b>{GetTimeOfDay(sun.dawn, timeZone)}</b><small>Borgerlig gryning</small></span></div>
            <div className="astro-item"><span className="astro-icon-slot"><SolarIcon phase="sunrise" decorative /></span><span className="astro-copy"><b>{GetTimeOfDay(sun.sunrise, timeZone)}</b><small>Soluppgång</small></span></div>
            <div className="astro-item"><span className="astro-icon-slot"><SolarIcon phase="sunset" decorative /></span><span className="astro-copy"><b>{GetTimeOfDay(sun.sunset, timeZone)}</b><small>Solnedgång</small></span></div>
            <div className="astro-item"><span className="astro-icon-slot"><SolarIcon phase="dusk" decorative /></span><span className="astro-copy"><b>{GetTimeOfDay(sun.dusk, timeZone)}</b><small>Borgerlig skymning</small></span></div>
          </div>
          {astronomyExpanded && <div className="moon-row">
            <div className="astro-item"><span className="astro-icon-slot"><Moon phase={moon.phase} fraction={moon.fraction} size={40} /></span><span className="astro-copy"><b>{moonRise}</b><small>Månuppgång</small></span></div>
            <div className="astro-item"><span className="astro-icon-slot"><Moon phase={moon.phase} fraction={moon.fraction} size={40} /></span><span className="astro-copy"><b>{moonSet}</b><small>Månnedgång</small></span></div>
            <div className="astro-item moon-visual"><span className="astro-icon-slot"><Moon phase={moon.phase} fraction={moon.fraction} size={48} /></span><span className="astro-copy"><b>{Math.round(moon.fraction * 100)}%</b><small>{getMoonPhaseName(moon.phase)}</small></span></div>
          </div>}
          <button type="button" className="astronomy-toggle" aria-expanded={astronomyExpanded} onClick={() => setAstronomyExpanded(value => !value)}>{astronomyExpanded ? 'Visa mindre' : 'Visa sol & måne'} <span aria-hidden="true">{astronomyExpanded ? '⌃' : '⌄'}</span></button>
        </div>
      </section>

      <div className="hunting-layout">
        <aside className="filter-panel" aria-label="Filtrera jakttider">
          <div className="filter-group"><label htmlFor="hunting-date">Datum</label><DatePicker id="hunting-date" selected={selectedDate} onChange={date => updateDate(date || new Date())} dateFormat="yyyy-MM-dd" /><button type="button" className="today-button" onClick={() => updateDate(new Date())}>Idag</button></div>
          <LocationSelector selectedLan={selectedLan} setSelectedLan={setSelectedLan} lat={lat} lon={lon} setLat={setLat} setLon={setLon} allLans={allLans} />
          <fieldset className="category-filter"><legend>Kategori</legend><label><input type="checkbox" checked={birds} onChange={event => setBirds(event.target.checked)} /> Fåglar</label><label><input type="checkbox" checked={mammals} onChange={event => setMammals(event.target.checked)} /> Däggdjur</label></fieldset>
          <p className="filter-note">ⓘ Tiderna gäller jakt enligt gällande lagstiftning och lokala föreskrifter.</p>
        </aside>

        <section className="results-section">
          <div className="results-header"><h2>{uniqueSpecies} arter får jagas</h2><span>{selectedLan === ALL_COUNTIES ? 'Alla län' : getCountyDisplayName(selectedLan)}</span></div>
          <div className="results-list">
            {visible.map((row, index) => {
              const localException = row.areaMatch === 'lokaltUndantag' || Boolean(row.period.lokaltBeslut);
              const localArea = describeAreas(row.period.omraden);
              const solar = row.period.tidPaDygnet?.typ === 'sol'
                ? `${row.period.tidPaDygnet.foreSoluppgangMinuter} minuter före soluppgång till ${row.period.tidPaDygnet.efterSolnedgangMinuter} minuter efter solnedgång`
                : row.period.tidPaDygnet?.typ === 'dygnetRunt' ? 'Dygnet runt' : 'Ingen särskild solregel';
              const structuredRules = [
                row.period.djur?.length ? `Gäller: ${row.period.djur.join(', ')}` : '',
                row.period.jaktformer?.length ? `Jaktform: ${row.period.jaktformer.join(' eller ')}` : '',
                row.period.lokaltBeslut ? 'Kontrollera aktuellt beslut från länsstyrelsen.' : '',
                row.regler,
              ].filter(Boolean).join(' · ');
              return <JakttidCard key={`${row.art}-${index}`} art={row.art} category={row.typ === 'fågel' ? 'Fågel' : 'Däggdjur'} info={row.info} rules={structuredRules} times={`${formatMonthDay(row.period.start)} – ${formatMonthDay(row.period.end)}`} localArea={localArea} solarRule={solar} solarLimited={row.period.tidPaDygnet?.typ === 'sol'} localException={localException} />;
            })}
            {!visible.length && <div className="empty-state"><h2>Inga jakttider matchar</h2><p>Prova ett annat datum, län eller kategori.</p></div>}
          </div>
        </section>
      </div>
      <footer className="source-footer"><strong>KÄLLA</strong><span>Svenska Jägareförbundet – verifierade jakttider</span><span>ⓘ Kontrollera alltid lokala föreskrifter innan jakt.</span></footer>
    </div>
  );
};

export default JakttiderPage;
