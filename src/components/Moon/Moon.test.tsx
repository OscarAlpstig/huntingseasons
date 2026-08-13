// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import Moon from './index';
import { getIlluminatedPath, getMoonPhaseName } from './moonPhase';

describe('Moon', () => {
  it.each([
    [0, 'Nymåne'],
    [0.25, 'Första kvarteret'],
    [0.5, 'Fullmåne'],
    [0.75, 'Sista kvarteret'],
  ] as const)('namnger fas %s korrekt', (phase, name) => {
    expect(getMoonPhaseName(phase)).toBe(name);
  });

  it('ritar olika belysta sidor för tilltagande och avtagande halvmåne', () => {
    expect(getIlluminatedPath(0.25)).not.toBe(getIlluminatedPath(0.75));
    expect(getIlluminatedPath(0)).not.toBe(getIlluminatedPath(0.5));
  });

  it.each([
    [0, 0],
    [0.25, 0.5],
    [0.5, 1],
    [0.75, 0.5],
  ])('den ritade ytan för fas %s motsvarar belyst andel %s', (phase, fraction) => {
    const coordinates = [...getIlluminatedPath(phase).matchAll(/([\d.-]+),([\d.-]+)/g)]
      .map((match) => [Number(match[1]), Number(match[2])]);
    const area = Math.abs(coordinates.reduce((sum, point, index) => {
      const next = coordinates[(index + 1) % coordinates.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0) / 2);
    expect(area / (Math.PI * 48 * 48)).toBeCloseTo(fraction, 2);
  });

  it('har en tillgänglig beskrivning med fas och belyst andel', () => {
    render(<Moon phase={0.25} fraction={0.5} />);
    expect(screen.getByRole('img', { name: 'Första kvarteret, 50 procent belyst' })).toBeInTheDocument();
  });
});
