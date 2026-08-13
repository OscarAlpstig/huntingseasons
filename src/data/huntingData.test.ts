import { describe, expect, it } from 'vitest';
import { COUNTIES } from './lan';
import {
  isDateInHuntingPeriod,
  matchArea,
  validateHuntingData,
  type HuntingArea,
  type HuntingDataFile,
} from './huntingData';
import { getDaggdjurData, getFaglarData } from './jaktTiderLoader';

const data = getDaggdjurData();
const birdData = getFaglarData();

describe('jakttidsdata', () => {
  it('har källmetadata och passerar full datavalidering', () => {
    expect(data.version).toBe(2);
    expect(data.source.url).toBe('https://jagareforbundet.se/jakt/jakttider/');
    expect(data.source.verifiedDate).toBe('2026-08-13');
    expect(validateHuntingData(data)).toEqual([]);
  });

  it('använder endast kända län-ID:n och inga fria länsnamn', () => {
    const json = JSON.stringify(data);
    expect(json).not.toContain('nextYear');
    expect(data.arter.flatMap((species) => species.perioder)
      .some((period) => Object.hasOwn(period, 'lan'))).toBe(false);
    for (const county of COUNTIES) expect(json).not.toContain(`"${county.officialName}"`);
  });

  it('innehåller de däggdjur som hade gällande rader i samtliga länsfilter', () => {
    expect(data.arter.map((species) => species.art)).toEqual([
      'Björn', 'Bäver', 'Dovhjort', 'Fälthare', 'Grävling', 'Iller', 'Kronhjort',
      'Mink', 'Mård', 'Rådjur', 'Rödräv', 'Skogshare', 'Vessla', 'Vildkanin',
      'Vildsvin', 'Älg',
    ]);
  });

  it('modellerar representativa verifierade regler', () => {
    const species = (name: string) => data.arter.find((entry) => entry.art === name)!;
    expect(species('Bäver').perioder).toHaveLength(2);
    expect(species('Dovhjort').perioder).toHaveLength(5);
    expect(species('Rådjur').perioder).toHaveLength(4);
    expect(species('Vildsvin').perioder[1].djur).toEqual(['arsunge']);
    expect(species('Rödräv').perioder.some((period) => period.omraden.some((area) => area.typ === 'kommun'))).toBe(true);
    expect(species('Kronhjort').perioder.some((period) => period.omraden.some((area) => area.typ === 'kronhjortsskotselomrade'))).toBe(true);
  });
});

describe('fågeldata', () => {
  it('har verifierad källmetadata och passerar full datavalidering', () => {
    expect(birdData.source).toEqual({
      name: 'Svenska Jägareförbundet',
      url: 'https://jagareforbundet.se/jakt/jakttider/',
      verifiedDate: '2026-08-13',
    });
    expect(validateHuntingData(birdData)).toEqual([]);
  });

  it('innehåller samtliga 36 fåglar från källans artfilter', () => {
    expect(birdData.arter).toHaveLength(36);
    expect(birdData.arter.map(({ art }) => art)).toContain('Gräsand');
    expect(birdData.arter.map(({ art }) => art)).toContain('Tjäder');
    expect(birdData.arter.map(({ art }) => art)).toContain('Vitkindad gås');
  });

  it('använder län-ID:n och saknar den gamla nextYear-markören', () => {
    const json = JSON.stringify(birdData);
    expect(json).not.toContain('nextYear');
    expect(birdData.arter.flatMap(({ perioder }) => perioder)
      .some((period) => Object.hasOwn(period, 'lan'))).toBe(false);
  });

  it('modellerar soltid, tuppregler och lokala undantag strukturerat', () => {
    const species = (name: string) => birdData.arter.find(({ art }) => art === name)!;
    expect(species('Gräsand').perioder.some(({ tidPaDygnet }) => tidPaDygnet?.typ === 'sol')).toBe(true);
    expect(species('Tjäder').perioder.some(({ djur }) => djur?.includes('tupp'))).toBe(true);
    expect(species('Dalripa').perioder.some(({ omraden }) => omraden.some(({ typ }) => typ === 'kommun'))).toBe(true);
    expect(species('Vigg').perioder.some(({ omraden }) => omraden.some(({ typ }) => typ === 'delAvLan'))).toBe(true);
  });

  it('har rätt länsvariationer för representativa arter', () => {
    const species = (name: string) => birdData.arter.find(({ art }) => art === name)!;
    expect(species('Ringduva').perioder).toHaveLength(2);
    expect(species('Kricka').perioder).toHaveLength(4);
    expect(species('Råka').perioder[0].omraden).toEqual([{ typ: 'lan', ids: ['SE-N', 'SE-M'] }]);
  });
});

describe('perioder över årsskifte', () => {
  const start = { month: 10, day: 1 };
  const end = { month: 5, day: 10 };

  it.each([
    [new Date(2025, 8, 30), false],
    [new Date(2025, 9, 1), true],
    [new Date(2026, 0, 15), true],
    [new Date(2026, 4, 10), true],
    [new Date(2026, 4, 11), false],
  ])('bedömer %s korrekt', (date, expected) => {
    expect(isDateInHuntingPeriod(date, start, end)).toBe(expected);
  });
});

describe('geografimatchning', () => {
  it.each<[HuntingArea[], string, string]>([
    [[{ typ: 'helaLandet' }], 'SE-AB', 'direkt'],
    [[{ typ: 'lan', ids: ['SE-AB', 'SE-C'] }], 'SE-C', 'direkt'],
    [[{ typ: 'lan', ids: ['SE-AB'] }], 'SE-M', 'ingen'],
    [[{ typ: 'kommun', lanId: 'SE-W', kommuner: ['Älvdalen'] }], 'SE-W', 'lokaltUndantag'],
    [[{ typ: 'delAvLan', lanId: 'SE-W', beskrivning: 'del av Mora kommun' }], 'SE-W', 'lokaltUndantag'],
    [[{ typ: 'kronhjortsskotselomrade', lanIds: ['SE-AB'] }], 'SE-AB', 'lokaltUndantag'],
  ])('matchar %j för %s', (areas, countyId, expected) => {
    expect(matchArea(areas, countyId)).toBe(expected);
  });
});

it('valideraren hittar okända län och dubbletter', () => {
  const invalid = structuredClone(data) as HuntingDataFile;
  invalid.arter[0].perioder[0].omraden = [{ typ: 'lan', ids: ['SE-XX'] }];
  invalid.arter[0].perioder.push(structuredClone(invalid.arter[0].perioder[0]));
  expect(validateHuntingData(invalid).join('\n')).toMatch(/okänt län-ID SE-XX/);
  expect(validateHuntingData(invalid).join('\n')).toMatch(/identisk dubblett/);
});
