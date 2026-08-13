import faglarJson from './faglar.json';
import daggdjurJson from './daggdjur.json';
import { getSeasonDate } from '../dateUtils';
import { normalizeLanName } from './lan';

interface Period {
  info: string;
  regler: string;
  start: { month: number; day: number; nextYear: boolean };
  end: { month: number; day: number; nextYear: boolean };
  lan: string[];
}

interface Species {
  art: string;
  perioder: Period[];
}

const normalizePeriodCounties = (counties: string[]) => counties.map((county) => {
  const normalized = normalizeLanName(county);
  if (!normalized) throw new Error(`Okänt län i jaktdata: ${county}`);
  return normalized;
});

export function getFaglarList() {
  return (faglarJson as Species[]).flatMap((fagel) =>
    fagel.perioder.map((period) => ({
      art: fagel.art,
      typ: 'fågel',
      info: period.info,
      regler: period.regler,
      start: getSeasonDate(period.start.month, period.start.day, period.start.nextYear),
      end: getSeasonDate(period.end.month, period.end.day, period.end.nextYear),
      lan: normalizePeriodCounties(period.lan),
    }))
  );
}

export function getDaggdjurList() {
  return (daggdjurJson as Species[]).flatMap((djur) =>
    djur.perioder.map((period) => ({
      art: djur.art,
      typ: 'däggdjur',
      info: period.info,
      regler: period.regler,
      start: getSeasonDate(period.start.month, period.start.day, period.start.nextYear),
      end: getSeasonDate(period.end.month, period.end.day, period.end.nextYear),
      lan: normalizePeriodCounties(period.lan),
    }))
  );
}
