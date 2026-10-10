import { describe, expect, it } from 'vitest';
import { compassDirection, destinationPoint, downwindDirection, weatherSymbol } from './wind';

describe('vind och vittring', () => {
  it.each([
    [0, 180],
    [90, 270],
    [180, 0],
    [270, 90],
    [350, 170],
  ])('sprider vittringen motsatt vind från %s°', (windFrom, expected) => {
    expect(downwindDirection(windFrom)).toBe(expected);
  });

  it('översätter grader till svenska väderstreck', () => {
    expect(compassDirection(0)).toBe('N');
    expect(compassDirection(45)).toBe('NÖ');
    expect(compassDirection(225)).toBe('SV');
    expect(compassDirection(359)).toBe('N');
  });

  it('beräknar en punkt i rätt riktning och ungefärligt avstånd', () => {
    const [lat, lon] = destinationPoint(59, 16, 180, 1000);

    expect(lat).toBeLessThan(59);
    expect(lat).toBeCloseTo(58.991, 3);
    expect(lon).toBeCloseTo(16, 5);
  });

  it('visar nederbörd tydligare än den generella vädersymbolen', () => {
    expect(weatherSymbol(18, 0.4, 0)).toBe('🌧️');
    expect(weatherSymbol(21, 0.4, 0.8)).toBe('🌨️');
    expect(weatherSymbol(18, 0, 0)).toBe('🌧️');
    expect(weatherSymbol(1, 0, 0)).toBe('☀️');
  });
});
