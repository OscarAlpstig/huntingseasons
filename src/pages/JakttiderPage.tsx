import React, { useState } from 'react';
import JakttidCard from '../components/JakttidCard/JakttidCard';
import LocationSelector from '../components/LocationSelector/LocationSelector';
import { getFaglarList, getDaggdjurList } from '../data/jaktTiderLoader';
import { describeAreas, formatMonthDay, isDateInHuntingPeriod, matchArea } from '../data/huntingData';
import { ALL_COUNTIES } from '../data/lan';

interface JakttiderPageProps {
  selectedDate: Date;
  selectedLan: string;
  setSelectedLan: (lan: string) => void;
  lat: number;
  lon: number;
  setLat: (lat: number) => void;
  setLon: (lon: number) => void;
  allLans: string[];
}

const JakttiderPage: React.FC<JakttiderPageProps> = ({
  selectedDate,
  selectedLan,
  setSelectedLan,
  lat,
  lon,
  setLat,
  setLon,
  allLans
}) => {
  const [faglar, setFaglar] = useState(true);
  const [daggdjur, setDaggdjur] = useState(true);

  const jaktTider = [
    ...(faglar ? getFaglarList() : []),
    ...(daggdjur ? getDaggdjurList() : []),
  ];

  const visibleHuntingTimes = jaktTider.flatMap((row) => {
    if (!isDateInHuntingPeriod(selectedDate, row.period.start, row.period.end)) return [];
    const areaMatch = selectedLan === ALL_COUNTIES ? 'direkt' : matchArea(row.period.omraden, selectedLan);
    return areaMatch === 'ingen' ? [] : [{ ...row, areaMatch }];
  });

  const describeStructuredRules = (row: typeof visibleHuntingTimes[number]) => {
    const details: string[] = [];
    if (row.period.djur?.length) details.push(`Gäller: ${row.period.djur.join(', ')}`);
    if (row.period.jaktformer?.length) details.push(`Jaktform: ${row.period.jaktformer.join(' eller ')}`);
    if (row.period.tidPaDygnet?.typ === 'dygnetRunt') details.push('Tid: dygnet runt');
    if (row.period.tidPaDygnet?.typ === 'sol') {
      const { foreSoluppgangMinuter, efterSolnedgangMinuter } = row.period.tidPaDygnet;
      const end = efterSolnedgangMinuter >= 0
        ? `${efterSolnedgangMinuter} minuter efter solnedgång`
        : `${Math.abs(efterSolnedgangMinuter)} minuter före solnedgång`;
      details.push(`Tid: ${foreSoluppgangMinuter} minuter före soluppgång till ${end}`);
    }
    if (row.areaMatch === 'lokaltUndantag') {
      details.push(`Lokalt område: ${describeAreas(row.period.omraden)}. Kontrollera att jaktplatsen omfattas.`);
    }
    if (row.period.lokaltBeslut) details.push('Kontrollera aktuellt beslut från länsstyrelsen.');
    if (row.regler) details.push(row.regler);
    return details.join(' · ');
  };

  return (
    <>
      <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: '1rem' }}>
            <input
              type="checkbox"
              checked={faglar}
              onChange={e => setFaglar(e.target.checked)}
            /> Fåglar
          </label>
          <label>
            <input
              type="checkbox"
              checked={daggdjur}
              onChange={e => setDaggdjur(e.target.checked)}
            /> Däggdjur
          </label>
        </div>
        <LocationSelector
          selectedLan={selectedLan}
          setSelectedLan={setSelectedLan}
          lat={lat}
          lon={lon}
          setLat={setLat}
          setLon={setLon}
          allLans={allLans}
        />
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h3>Jakttider</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visibleHuntingTimes.map((row, idx) => (
              <JakttidCard
                key={`${row.art}-${row.period.start.month}-${row.period.start.day}-${idx}`}
                art={row.art}
                info={row.info}
                regler={describeStructuredRules(row)}
                tider={`${formatMonthDay(row.period.start)} – ${formatMonthDay(row.period.end)}`}
              />
            ))}
        </div>
      </div>
    </>
  );
};

export default JakttiderPage;
