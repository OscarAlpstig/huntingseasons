// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JakttiderPage from './JakttiderPage';
import { COUNTIES } from '../data/lan';

afterEach(cleanup);

describe('JakttiderPage med strukturerad geografi', () => {
  it('visar de korrigerade soltiderna för Katrineholm', () => {
    render(
      <JakttiderPage selectedDate={new Date(2026, 7, 16)} selectedLan="SE-D" setSelectedLan={vi.fn()} lat={58.9959442} lon={16.2058242} setLat={vi.fn()} setLon={vi.fn()} allLans={COUNTIES.map((county) => county.id)} />,
    );

    const phases = [...screen.getByLabelText('Sol- och måntider för vald dag').querySelectorAll('.solar-phases .astro-copy')]
      .map((phase) => ({time: phase.querySelector('b')?.textContent, label: phase.querySelector('small')?.textContent}));

    expect(phases).toEqual([
      {time: '04:27', label: 'Borgerlig gryning'},
      {time: '05:16', label: 'Soluppgång'},
      {time: '20:41', label: 'Solnedgång'},
      {time: '21:29', label: 'Borgerlig skymning'},
    ]);
  });

  it('visar solfaserna kronologiskt och månen med beräknad fas', () => {
    render(
      <JakttiderPage selectedDate={new Date(2026, 7, 25)} selectedLan="SE-AB" setSelectedLan={vi.fn()} lat={59.3293} lon={18.0686} setLat={vi.fn()} setLon={vi.fn()} allLans={COUNTIES.map((county) => county.id)} />,
    );
    const panel = screen.getByLabelText('Sol- och måntider för vald dag');
    const labels = [...panel.querySelectorAll('.solar-phases small')].map((element) => element.textContent);
    expect(labels).toEqual(['Borgerlig gryning', 'Soluppgång', 'Solnedgång', 'Borgerlig skymning']);
    expect([...panel.querySelectorAll('.solar-phases .solar-icon')].map((icon) => icon.getAttribute('src'))).toEqual([
      expect.stringContaining('solar-dawn.png'),
      expect.stringContaining('solar-sunrise.png'),
      expect.stringContaining('solar-sunset.png'),
      expect.stringContaining('solar-dusk.png'),
    ]);
    expect(panel.querySelectorAll('.solar-phases .astro-item')).toHaveLength(4);
    expect(panel.querySelectorAll('.moon-row .astro-item')).toHaveLength(3);
    expect(panel.querySelectorAll('.astro-icon-slot')).toHaveLength(7);
    expect(panel.querySelector('.moon-phase')).toHaveAttribute('role', 'img');
    expect(screen.getByRole('button', { name: /visa mindre/i })).toHaveAttribute('aria-expanded', 'true');
  });

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
    expect(foxCards[0]?.querySelector('details')).not.toBeInTheDocument();
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
    expect(duck).toHaveTextContent('Regler');
    expect(screen.queryByText('Geografiskt område')).not.toBeInTheDocument();
  });
});
