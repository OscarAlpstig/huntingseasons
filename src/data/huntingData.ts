import { COUNTIES } from './lan';

export interface MonthDay {
  month: number;
  day: number;
}

export type HuntingType = 'allmanJakt' | 'licensjakt' | 'skyddsjakt' | 'sarskildJakttid';
export type AnimalCategory = 'alla' | 'hornbarande' | 'hind' | 'kalv' | 'arskalv' | 'kid' | 'arsunge' | 'tupp';
export type HuntingMethod = 'smygjakt' | 'vaktjakt';

export type HuntingArea =
  | { typ: 'helaLandet' }
  | { typ: 'lan'; ids: string[] }
  | { typ: 'kommun'; lanId: string; kommuner: string[] }
  | { typ: 'delAvLan'; lanId: string; beskrivning: string }
  | { typ: 'kronhjortsskotselomrade'; lanIds: string[] }
  | { typ: 'utanforKronhjortsskotselomrade'; lanIds: string[] }
  | { typ: 'kronhjortsomrade'; lanIds: string[] }
  | { typ: 'utanforKronhjortsomrade'; lanIds: string[] };

export type TimeOfDay =
  | { typ: 'dygnetRunt' }
  | { typ: 'sol'; foreSoluppgangMinuter: number; efterSolnedgangMinuter: number };

export interface HuntingPeriod {
  typ: HuntingType;
  djur?: AnimalCategory[];
  start: MonthDay;
  end: MonthDay;
  omraden: HuntingArea[];
  jaktformer?: HuntingMethod[];
  regler?: string;
  tidPaDygnet?: TimeOfDay;
  lokaltBeslut?: boolean;
}

export interface HuntingSpecies {
  art: string;
  info?: string;
  perioder: HuntingPeriod[];
}

export interface HuntingDataFile {
  version: number;
  source: { name: string; url: string; verifiedDate: string };
  arter: HuntingSpecies[];
}

export type AreaMatch = 'direkt' | 'lokaltUndantag' | 'ingen';

const monthDayValue = ({ month, day }: MonthDay) => month * 100 + day;

export function isDateInHuntingPeriod(date: Date, start: MonthDay, end: MonthDay): boolean {
  const selected = (date.getMonth() + 1) * 100 + date.getDate();
  const startValue = monthDayValue(start);
  const endValue = monthDayValue(end);
  return startValue <= endValue
    ? selected >= startValue && selected <= endValue
    : selected >= startValue || selected <= endValue;
}

export function matchArea(areas: HuntingArea[], countyId: string): AreaMatch {
  if (areas.some((area) => area.typ === 'helaLandet')) return 'direkt';
  if (areas.some((area) => area.typ === 'lan' && area.ids.includes(countyId))) return 'direkt';

  const localMatch = areas.some((area) => {
    if (area.typ === 'kommun' || area.typ === 'delAvLan') return area.lanId === countyId;
    if ('lanIds' in area) return area.lanIds.includes(countyId);
    return false;
  });
  return localMatch ? 'lokaltUndantag' : 'ingen';
}

export function formatMonthDay(value: MonthDay): string {
  return new Intl.DateTimeFormat('sv-SE', { month: 'short', day: 'numeric' })
    .format(new Date(2024, value.month - 1, value.day));
}

export function describeAreas(areas: HuntingArea[]): string {
  return areas.flatMap((area) => {
    if (area.typ === 'kommun') return area.kommuner.join(', ');
    if (area.typ === 'delAvLan') return area.beskrivning;
    if (area.typ === 'kronhjortsskotselomrade') return 'inom kronhjortsskötselområde';
    if (area.typ === 'utanforKronhjortsskotselomrade') return 'utanför kronhjortsskötselområde';
    if (area.typ === 'kronhjortsomrade') return 'inom kronhjortsområde';
    if (area.typ === 'utanforKronhjortsomrade') return 'utanför kronhjortsområde';
    return [];
  }).join('; ');
}

const validCountyIds = new Set(COUNTIES.map((county) => county.id));
const validAreaTypes = new Set([
  'helaLandet', 'lan', 'kommun', 'delAvLan', 'kronhjortsskotselomrade',
  'utanforKronhjortsskotselomrade', 'kronhjortsomrade', 'utanforKronhjortsomrade',
]);
const validCategories = new Set<AnimalCategory>(['alla', 'hornbarande', 'hind', 'kalv', 'arskalv', 'kid', 'arsunge', 'tupp']);
const validMethods = new Set<HuntingMethod>(['smygjakt', 'vaktjakt']);

function validMonthDay(value: MonthDay): boolean {
  if (!Number.isInteger(value.month) || !Number.isInteger(value.day)) return false;
  const date = new Date(2024, value.month - 1, value.day);
  return date.getMonth() === value.month - 1 && date.getDate() === value.day;
}

export function validateHuntingData(data: HuntingDataFile): string[] {
  const errors: string[] = [];
  const signatures = new Set<string>();
  for (const species of data.arter) {
    for (const [index, period] of species.perioder.entries()) {
      const path = `${species.art}.perioder[${index}]`;
      if (!validMonthDay(period.start) || !validMonthDay(period.end)) errors.push(`${path}: ogiltigt datum`);
      if (!period.omraden.length) errors.push(`${path}: områden saknas`);
      for (const area of period.omraden) {
        if (!validAreaTypes.has(area.typ)) errors.push(`${path}: okänd områdestyp ${area.typ}`);
        const ids = area.typ === 'lan' ? area.ids : 'lanIds' in area ? area.lanIds : 'lanId' in area ? [area.lanId] : [];
        for (const id of ids) if (!validCountyIds.has(id)) errors.push(`${path}: okänt län-ID ${id}`);
      }
      for (const category of period.djur ?? []) if (!validCategories.has(category)) errors.push(`${path}: okänd djurkategori ${category}`);
      for (const method of period.jaktformer ?? []) if (!validMethods.has(method)) errors.push(`${path}: okänd jaktform ${method}`);
      const signature = `${species.art}:${JSON.stringify(period)}`;
      if (signatures.has(signature)) errors.push(`${path}: identisk dubblett`);
      signatures.add(signature);
    }
  }
  return errors;
}
