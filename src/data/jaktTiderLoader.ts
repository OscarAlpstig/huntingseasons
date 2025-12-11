import faglarJson from './faglar.json';
import daggdjurJson from './daggdjur.json';
import { getSeasonDate } from '../dateUtils';

export function getFaglarList() {
  return (faglarJson as Array<{ art: string; perioder: any[] }>).flatMap((fagel) =>
    fagel.perioder.map((period) => ({
      art: fagel.art,
      typ: 'fågel',
      info: period.info,
      regler: period.regler,
      start: getSeasonDate(period.start.month, period.start.day, period.start.nextYear),
      end: getSeasonDate(period.end.month, period.end.day, period.end.nextYear),
      lan: period.lan,
    }))
  );
}

export function getDaggdjurList() {
  return (daggdjurJson as Array<{ art: string; perioder: any[] }>).flatMap((djur) =>
    djur.perioder.map((period) => ({
      art: djur.art,
      typ: 'däggdjur',
      info: period.info,
      regler: period.regler,
      start: getSeasonDate(period.start.month, period.start.day, period.start.nextYear),
      end: getSeasonDate(period.end.month, period.end.day, period.end.nextYear),
      lan: period.lan,
    }))
  );
}
