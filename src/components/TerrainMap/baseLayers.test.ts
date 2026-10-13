import { describe, expect, it } from 'vitest';
import { BASE_LAYERS, DEFAULT_BASE_LAYER } from './baseLayers';

describe('baskartor', () => {
  it('använder nyckelfri OpenTopoMap med korrekt attribution och zoomgräns', () => {
    expect(DEFAULT_BASE_LAYER).toBe('terrain');
    expect(BASE_LAYERS.terrain.url).toBe('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');
    expect(BASE_LAYERS.terrain.options.maxNativeZoom).toBe(17);
    expect(BASE_LAYERS.terrain.options.attribution).toContain('https://www.openstreetmap.org/copyright');
    expect(BASE_LAYERS.terrain.options.attribution).toContain('SRTM');
    expect(BASE_LAYERS.terrain.options.attribution).toContain('https://opentopomap.org');
    expect(BASE_LAYERS.terrain.options.attribution).toContain('https://creativecommons.org/licenses/by-sa/3.0/');
  });

  it('erbjuder OSM:s standardlager över HTTPS utan API-nyckel', () => {
    expect(BASE_LAYERS.standard.url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(BASE_LAYERS.standard.options.attribution).toContain('https://www.openstreetmap.org/copyright');
  });
});
