import faglarJson from './faglar.json';
import daggdjurJson from './daggdjur.json';
import type { HuntingDataFile, HuntingPeriod } from './huntingData';

export interface HuntingTimeRow {
  art: string;
  typ: 'fågel' | 'däggdjur';
  info: string;
  regler: string;
  period: HuntingPeriod;
}

const faglarData = faglarJson as unknown as HuntingDataFile;
const daggdjurData = daggdjurJson as unknown as HuntingDataFile;

function flatten(data: HuntingDataFile, typ: HuntingTimeRow['typ']): HuntingTimeRow[] {
  return data.arter.flatMap((species) => species.perioder.map((period) => ({
    art: species.art,
    typ,
    info: species.info ?? '',
    regler: period.regler ?? '',
    period,
  })));
}

export function getFaglarList(): HuntingTimeRow[] {
  return flatten(faglarData, 'fågel');
}

export function getDaggdjurList(): HuntingTimeRow[] {
  return flatten(daggdjurData, 'däggdjur');
}

export function getDaggdjurData(): HuntingDataFile {
  return daggdjurData;
}

export function getFaglarData(): HuntingDataFile {
  return faglarData;
}
