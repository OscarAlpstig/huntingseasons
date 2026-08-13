// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { AnimalIcon, BrandMark } from './AnimalIcon';
import { getAnimalIconKind } from './animalIconKind';

describe('AnimalIcon', () => {
  it.each([
    ['Gräsand', 'duck'],
    ['Tjäder', 'grouse'],
    ['Rådjur', 'deer'],
    ['Älg', 'moose'],
    ['Rödräv', 'fox'],
    ['Bäver', 'beaver'],
    ['Vildsvin', 'boar'],
  ] as const)('väljer %s-silhuetten för %s', (species, kind) => {
    expect(getAnimalIconKind(species)).toBe(kind);
  });

  it('ger artikonen ett tillgängligt namn', () => {
    render(<AnimalIcon species="Gräsand" />);
    expect(screen.getByRole('img', { name: 'Gräsand, silhuett' })).toBeInTheDocument();
  });

  it('renderar den lokala hornloggan som png', () => {
    render(<BrandMark />);
    const logo = screen.getByRole('presentation');
    expect(logo).toHaveAttribute('src', expect.stringContaining('brand-antlers.png'));
  });
});
