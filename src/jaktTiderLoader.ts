import jaktTiderJson from './data/jaktTider.json';
import { getSeasonDate } from './dateUtils';

export function getJaktTiderList() {
  return jaktTiderJson.map((row) => ({
    ...row,
    start: getSeasonDate(row.start.month, row.start.day, row.start.nextYear),
    end: getSeasonDate(row.end.month, row.end.day, row.end.nextYear),
  }));
}

