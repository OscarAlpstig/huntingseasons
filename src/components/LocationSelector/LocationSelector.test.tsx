// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LocationSelector from './LocationSelector';
import { ALL_COUNTIES, LAN_DATA } from '../../data/lan';

const allLans = LAN_DATA.map((county) => county.id);

function renderSelector(selectedLan = 'SE-AB') {
  const props = {
    selectedLan,
    setSelectedLan: vi.fn(),
    lat: 59.3293,
    lon: 18.0686,
    setLat: vi.fn(),
    setLon: vi.fn(),
    allLans,
  };
  const view = render(<LocationSelector {...props} />);
  return { ...view, props };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('LocationSelector', () => {
  it('uppdaterar län och länscentrum från dropdownen', () => {
    const { props } = renderSelector();

    fireEvent.change(screen.getByRole('combobox', { name: /välj län/i }), {
      target: { value: 'SE-M' },
    });

    expect(props.setSelectedLan).toHaveBeenCalledWith('SE-M');
    expect(props.setLat).toHaveBeenCalledWith(55.9903);
    expect(props.setLon).toHaveBeenCalledWith(13.5958);
  });

  it('ändrar Alla län utan att skriva koordinater', () => {
    const { props } = renderSelector();

    fireEvent.change(screen.getByRole('combobox', { name: /välj län/i }), {
      target: { value: ALL_COUNTIES },
    });

    expect(props.setSelectedLan).toHaveBeenCalledWith(ALL_COUNTIES);
    expect(props.setLat).not.toHaveBeenCalled();
    expect(props.setLon).not.toHaveBeenCalled();
  });

  it('behåller exakt geolocation och väljer ett giltigt kanoniskt län', async () => {
    const { props, rerender } = renderSelector();
    const latitude = 59.41;
    const longitude = 18.21;
    const getCurrentPosition = vi.fn((success: PositionCallback) => success({
      coords: { latitude, longitude },
    } as GeolocationPosition));
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: { getCurrentPosition },
    });

    fireEvent.click(screen.getByRole('button', { name: /använd min plats/i }));

    await waitFor(() => expect(props.setSelectedLan).toHaveBeenCalledWith('SE-AB'));
    expect(props.setLat).toHaveBeenCalledTimes(1);
    expect(props.setLat).toHaveBeenCalledWith(latitude);
    expect(props.setLon).toHaveBeenCalledTimes(1);
    expect(props.setLon).toHaveBeenCalledWith(longitude);

    rerender(<LocationSelector {...props} selectedLan="SE-AB" lat={latitude} lon={longitude} />);
    expect(screen.getByRole('combobox', { name: /välj län/i })).toHaveValue('SE-AB');
    expect(props.setLat).toHaveBeenCalledTimes(1);
    expect(props.setLon).toHaveBeenCalledTimes(1);
  });

  it('lämnar state orörd och visar fel när geolocation misslyckas', async () => {
    const { props } = renderSelector();
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
          error({ message: 'denied' } as GeolocationPositionError);
        },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /använd min plats/i }));

    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(props.setSelectedLan).not.toHaveBeenCalled();
    expect(props.setLat).not.toHaveBeenCalled();
    expect(props.setLon).not.toHaveBeenCalled();
  });
});
