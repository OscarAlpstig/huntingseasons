import type { TileLayerOptions } from 'leaflet';

const osmAttribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const BASE_LAYERS = {
  terrain: {
    label: 'Terräng',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      subdomains: 'abc', maxNativeZoom: 17, maxZoom: 19,
      attribution: `${osmAttribution}, SRTM | © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)`,
    } satisfies TileLayerOptions,
  },
  standard: {
    label: 'Standardkarta',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { maxNativeZoom: 19, maxZoom: 19, attribution: osmAttribution } satisfies TileLayerOptions,
  },
};

export type BaseLayerId = keyof typeof BASE_LAYERS;
export const DEFAULT_BASE_LAYER: BaseLayerId = 'terrain';
