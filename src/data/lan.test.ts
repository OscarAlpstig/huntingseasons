import { describe, expect, it } from 'vitest';
import faglarJson from './faglar.json';
import daggdjurJson from './daggdjur.json';
import { ALL_COUNTIES, findNearestLan, getLanCoordinates, LAN_DATA, normalizeLanName } from './lan';
import { getDaggdjurList, getFaglarList } from './jaktTiderLoader';

describe('länsnormalisering', () => {
  it.each([
    ['Stockholm', 'Stockholm'],
    ['Stockholms län', 'Stockholm'],
    ['Västra götaland', 'Västra Götaland'],
    ['Västragötaland', 'Västra Götaland'],
    ['Alla län', ALL_COUNTIES],
  ])('normaliserar %s till %s', (input, expected) => {
    expect(normalizeLanName(input)).toBe(expected);
  });

  it('kan normalisera samtliga län i jaktdata', () => {
    const countyNames = [...faglarJson, ...daggdjurJson]
      .flatMap((species) => species.perioder)
      .flatMap((period) => period.lan);

    expect(countyNames).not.toHaveLength(0);
    expect(countyNames.filter((name) => normalizeLanName(name) === null)).toEqual([]);
  });

  it('returnerar enbart kanoniska län från jaktdata-loadern', () => {
    const validNames = new Set([ALL_COUNTIES, ...LAN_DATA.map((county) => county.id)]);
    const loadedNames = [...getFaglarList(), ...getDaggdjurList()].flatMap((period) => period.lan);

    expect(loadedNames.every((name) => validNames.has(name))).toBe(true);
    expect(loadedNames).toContain('Västra Götaland');
    expect(loadedNames).not.toContain('Västragötaland');
    expect(loadedNames).not.toContain('Västra götaland');
  });

  it('har giltiga koordinater för samtliga kanoniska län', () => {
    expect(LAN_DATA).toHaveLength(21);
    for (const county of LAN_DATA) {
      expect(getLanCoordinates(county.id)).toEqual({ lat: county.lat, lon: county.lon });
      expect(county.lat).toBeGreaterThanOrEqual(-90);
      expect(county.lat).toBeLessThanOrEqual(90);
      expect(county.lon).toBeGreaterThanOrEqual(-180);
      expect(county.lon).toBeLessThanOrEqual(180);
    }
  });

  it('hittar Stockholm från Stockholmskoordinater', () => {
    expect(findNearestLan(59.3293, 18.0686)).toBe('Stockholm');
  });
});
