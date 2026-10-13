// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGeolocation } from './useGeolocation';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('positionering', () => {
  it('hämtar plats endast efter användarinteraktion och rapporterar koordinater', () => {
    const getCurrentPosition = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    const onLocate = vi.fn();
    const { result } = renderHook(() => useGeolocation(onLocate));
    expect(getCurrentPosition).not.toHaveBeenCalled();
    act(() => result.current.locate());
    expect(result.current.loading).toBe(true);
    expect(getCurrentPosition.mock.calls[0][2]).toEqual({ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    act(() => getCurrentPosition.mock.calls[0][0]({ coords: { latitude: 59, longitude: 16 } }));
    expect(onLocate).toHaveBeenCalledWith(59, 16);
    expect(result.current.loading).toBe(false);
  });

  it('hanterar webbläsare utan platsstöd', () => {
    vi.stubGlobal('navigator', {});
    const { result } = renderHook(() => useGeolocation(vi.fn()));
    act(() => result.current.locate());
    expect(result.current.error).toContain('stöder inte');
    expect(result.current.loading).toBe(false);
  });

  it.each([[1, 'nekades'], [2, 'kunde inte hämtas'], [3, 'för lång tid']])('hanterar platsfel %s och tillåter nytt försök', (code, message) => {
    const getCurrentPosition = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    const onLocate = vi.fn();
    const { result } = renderHook(() => useGeolocation(onLocate));
    act(() => result.current.locate());
    act(() => getCurrentPosition.mock.calls[0][1]({ code }));
    expect(result.current.error).toContain(message);
    expect(result.current.loading).toBe(false);
    expect(onLocate).not.toHaveBeenCalled();
    act(() => result.current.locate());
    expect(result.current.error).toBe('');
  });

  it('ignorerar platsresultat efter att kartan lämnas', () => {
    const getCurrentPosition = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    const onLocate = vi.fn();
    const { result, unmount } = renderHook(() => useGeolocation(onLocate));
    act(() => result.current.locate());
    unmount();
    act(() => getCurrentPosition.mock.calls[0][0]({ coords: { latitude: 59, longitude: 16 } }));
    expect(onLocate).not.toHaveBeenCalled();
  });
});
