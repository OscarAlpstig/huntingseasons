// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JakttiderPage from './JakttiderPage';
import { COUNTIES } from '../data/lan';

afterEach(cleanup);

describe('JakttiderPage med strukturerad geografi', () => {
  it('visar kommunalt undantag konservativt när bara län är valt', () => {
    render(
      <JakttiderPage
        selectedDate={new Date(2026, 3, 10)}
        selectedLan="SE-W"
        setSelectedLan={vi.fn()}
        lat={61.0914}
        lon={14.6664}
        setLat={vi.fn()}
        setLon={vi.fn()}
        allLans={COUNTIES.map((county) => county.id)}
      />,
    );

    const foxCards = screen.getAllByText('Rödräv').map((heading) => heading.closest('.jakttid-card'));
    expect(foxCards).toHaveLength(1);
    expect(foxCards[0]).toHaveTextContent('Lokalt område: Älvdalen');
    expect(foxCards[0]).toHaveTextContent('Kontrollera att jaktplatsen omfattas');
  });

  it('visar rikstäckande period men inte fel länsgrupp', () => {
    render(
      <JakttiderPage
        selectedDate={new Date(2026, 4, 12)}
        selectedLan="SE-AB"
        setSelectedLan={vi.fn()}
        lat={59.3293}
        lon={18.0686}
        setLat={vi.fn()}
        setLon={vi.fn()}
        allLans={COUNTIES.map((county) => county.id)}
      />,
    );

    expect(screen.getByText('Rådjur')).toBeInTheDocument();
    expect(screen.queryByText('Bäver')).not.toBeInTheDocument();
  });

  it('visar verifierade fågelperioder för valt län och datum', () => {
    render(
      <JakttiderPage
        selectedDate={new Date(2026, 7, 25)}
        selectedLan="SE-AB"
        setSelectedLan={vi.fn()}
        lat={59.3293}
        lon={18.0686}
        setLat={vi.fn()}
        setLon={vi.fn()}
        allLans={COUNTIES.map((county) => county.id)}
      />,
    );

    const duck = screen.getByText('Gräsand').closest('.jakttid-card');
    expect(duck).toBeInTheDocument();
    expect(duck).toHaveTextContent('60 minuter före soluppgång till 60 minuter efter solnedgång');
  });
});
