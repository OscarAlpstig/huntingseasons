import faglarJson from './data/faglar.json';
import daggdjurJson from './data/daggdjur.json';
import { getSeasonDate } from './dateUtils';

export function getFaglarList() {
  return faglarJson.map((row) => ({
    ...row,
    typ: 'fågel',
    start: getSeasonDate(row.start.month, row.start.day, row.start.nextYear),
    end: getSeasonDate(row.end.month, row.end.day, row.end.nextYear),
  }));
}

export function getDaggdjurList() {
  return daggdjurJson.map((row) => ({
    ...row,
    typ: 'däggdjur',
    start: getSeasonDate(row.start.month, row.start.day, row.start.nextYear),
    end: getSeasonDate(row.end.month, row.end.day, row.end.nextYear),
  }));
}
