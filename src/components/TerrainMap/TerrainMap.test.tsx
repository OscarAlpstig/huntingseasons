// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import L from 'leaflet';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TerrainMap from './TerrainMap';
import { BASE_LAYERS } from './baseLayers';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('terrängkartan', () => {
  it('renderar kartan och byter bakgrund utan att återskapa kartinstansen', () => {
    const mapSpy = vi.spyOn(L, 'map');
    const tileSpy = vi.spyOn(L, 'tileLayer');
    const onLocationChange = vi.fn();
    const { rerender } = render(<TerrainMap lat={59} lon={16} onLocationChange={onLocationChange} />);
    expect(screen.getByRole('region', { name: 'Terrängkarta för val av jaktplats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Använd min plats' })).toBeEnabled();
    expect(screen.getByLabelText('Baskarta')).toHaveValue('terrain');
    expect(tileSpy).toHaveBeenCalledWith(BASE_LAYERS.terrain.url, BASE_LAYERS.terrain.options);
    fireEvent.change(screen.getByLabelText('Baskarta'), { target: { value: 'standard' } });
    expect(tileSpy).toHaveBeenLastCalledWith(BASE_LAYERS.standard.url, BASE_LAYERS.standard.options);
    rerender(<TerrainMap lat={58} lon={15} onLocationChange={onLocationChange} />);
    expect(mapSpy).toHaveBeenCalledTimes(1);
    expect(tileSpy).toHaveBeenCalledTimes(2);
  });

  it('visar ett begripligt tile-fel och låter användaren byta karta', () => {
    const tileSpy = vi.spyOn(L, 'tileLayer');
    render(<TerrainMap lat={59} lon={16} onLocationChange={vi.fn()} />);
    act(() => tileSpy.mock.results[0].value.fire('tileerror'));
    expect(screen.getByRole('status')).toHaveTextContent('Prova Standardkarta');
    expect(screen.getByRole('button', { name: 'Använd min plats' })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Baskarta'), { target: { value: 'standard' } });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('lägger till och tar bort egna lager utan att ladda om baskartan', () => {
    const tiles = vi.spyOn(L, 'tileLayer');
    const create = vi.fn(() => L.layerGroup());
    render(<TerrainMap lat={59} lon={16} onLocationChange={vi.fn()} overlays={[{ id: 'passes', label: 'Pass', create }]} />);
    const layer = create.mock.results[0].value;
    const remove = vi.spyOn(layer, 'remove');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pass' }));
    expect(remove).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pass' }));
    expect(create).toHaveBeenCalledTimes(2);
    expect(tiles).toHaveBeenCalledTimes(1);
  });
});
