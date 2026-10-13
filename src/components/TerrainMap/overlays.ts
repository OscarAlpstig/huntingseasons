import type L from 'leaflet';

// Factories own their data/layers. The map only adds/removes them and presents controls.
// Memoize definitions in the caller so unrelated React updates don't rebuild layers.
export interface MapOverlay {
  id: string;
  label: string;
  create: (map: L.Map) => L.Layer;
}
