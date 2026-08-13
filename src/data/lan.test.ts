import { describe, expect, it } from 'vitest';
import { ALL_COUNTIES, COUNTIES, findNearestLan, getLanCoordinates, normalizeLanName } from './lan';

describe('länsdefinitioner', () => {
  it('innehåller exakt 21 län med unika ISO 3166-2-ID:n', () => {
    expect(COUNTIES).toHaveLength(21);
    expect(new Set(COUNTIES.map((county) => county.id)).size).toBe(21);
    expect(COUNTIES.every((county) => /^SE-(?:[A-Z]{1,2})$/.test(county.id))).toBe(true);
  });

  it.each([
    ['Stockholm', 'SE-AB'],
    ['Stockholms län', 'SE-AB'],
    ['SE-AB', 'SE-AB'],
    ['Västra götaland', 'SE-O'],
    ['Västragötaland', 'SE-O'],
    ['Alla län', ALL_COUNTIES],
  ])('normaliserar %s till %s', (input, expected) => {
    expect(normalizeLanName(input)).toBe(expected);
  });

  it('har giltiga koordinater för samtliga län', () => {
    for (const county of COUNTIES) {
      expect(getLanCoordinates(county.id)).toEqual({ lat: county.lat, lon: county.lon });
      expect(county.lat).toBeGreaterThanOrEqual(-90);
      expect(county.lat).toBeLessThanOrEqual(90);
      expect(county.lon).toBeGreaterThanOrEqual(-180);
      expect(county.lon).toBeLessThanOrEqual(180);
    }
  });

  it('hittar Stockholms ISO-ID från Stockholmskoordinater', () => {
    expect(findNearestLan(59.3293, 18.0686)).toBe('SE-AB');
  });
});
