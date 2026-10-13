import { useEffect, useId, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BASE_LAYERS, DEFAULT_BASE_LAYER, type BaseLayerId } from './baseLayers';
import { createSelectedMarker } from './markers';
import { useGeolocation } from './useGeolocation';
import type { MapOverlay } from './overlays';

const NO_OVERLAYS: MapOverlay[] = [];
interface Props {
  lat: number;
  lon: number;
  onLocationChange: (lat: number, lon: number) => void;
  overlays?: MapOverlay[];
  focusBounds?: L.LatLngBoundsExpression;
}

export default function TerrainMap({ lat, lon, onLocationChange, overlays = NO_OVERLAYS, focusBounds }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const initialPosition = useRef<[number, number]>([lat, lon]);
  const callback = useRef(onLocationChange);
  callback.current = onLocationChange;
  const marker = useRef<L.Marker | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [baseLayer, setBaseLayer] = useState<BaseLayerId>(DEFAULT_BASE_LAYER);
  const [hiddenOverlays, setHiddenOverlays] = useState<string[]>([]);
  const [tileError, setTileError] = useState(false);
  const id = useId();
  const { locate, loading, error } = useGeolocation((latitude, longitude) => {
    callback.current(latitude, longitude);
    map?.setView([latitude, longitude], Math.max(map.getZoom(), 14));
  });

  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, { preferCanvas: true, maxZoom: 19 }).setView(initialPosition.current, 14);
    L.control.scale({ imperial: false }).addTo(instance);
    marker.current = createSelectedMarker(initialPosition.current, (latitude, longitude) => callback.current(latitude, longitude)).addTo(instance);
    instance.on('click', (event: L.LeafletMouseEvent) => callback.current(event.latlng.lat, event.latlng.lng));
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => instance.invalidateSize({ pan: false }));
    observer?.observe(container.current);
    setMap(instance);
    return () => {
      observer?.disconnect();
      instance.remove();
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    const configuration = BASE_LAYERS[baseLayer];
    const tiles = L.tileLayer(configuration.url, configuration.options);
    setTileError(false);
    let failed = false;
    tiles.on('loading', () => { failed = false; });
    tiles.on('tileerror', () => { failed = true; setTileError(true); });
    tiles.on('load', () => setTileError(failed));
    tiles.addTo(map);
    return () => { tiles.remove(); tiles.off(); };
  }, [map, baseLayer]);

  useEffect(() => {
    marker.current?.setLatLng([lat, lon]);
    map?.panTo([lat, lon]);
  }, [map, lat, lon]);

  useEffect(() => {
    if (!map) return;
    const layers = overlays.filter(({ id: overlayId }) => !hiddenOverlays.includes(overlayId)).map(({ create }) => create(map).addTo(map));
    return () => { layers.forEach((layer) => layer.remove()); };
  }, [map, overlays, hiddenOverlays]);

  useEffect(() => {
    if (map && focusBounds) map.fitBounds(focusBounds, { padding: [56, 56], maxZoom: 17 });
  }, [map, focusBounds]);

  return <div className="terrain-map">
    <div ref={container} className="terrain-map-canvas" role="region" aria-label="Terrängkarta för val av jaktplats" />
    <div className="map-tools">
      <details className="map-layer-control">
        <summary>Kartlager</summary>
        <label htmlFor={`${id}-base`}>Baskarta</label>
        <select id={`${id}-base`} value={baseLayer} onChange={(event) => setBaseLayer(event.target.value as BaseLayerId)}>
          {Object.entries(BASE_LAYERS).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
        </select>
        {overlays.length > 0 && <fieldset><legend>Egna lager</legend>
          {overlays.map(({ id: overlayId, label }) => <label key={overlayId}>
            <input type="checkbox" checked={!hiddenOverlays.includes(overlayId)} onChange={(event) => setHiddenOverlays((hidden) => event.target.checked ? hidden.filter((value) => value !== overlayId) : [...hidden, overlayId])} /> {label}
          </label>)}
        </fieldset>}
      </details>
      <button type="button" className="map-locate" onClick={locate} disabled={loading} aria-label={loading ? 'Hämtar din position' : 'Använd min plats'} title="Använd min plats">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
      </button>
    </div>
    {(error || tileError || loading) && <div className="map-notice" role={error ? 'alert' : 'status'}>
      {error || (loading ? 'Hämtar din position…' : 'Delar av kartan kunde inte laddas. Prova Standardkarta under Kartlager eller försök igen senare.')}
    </div>}
    <span className="map-position">{lat.toFixed(5)}, {lon.toFixed(5)}</span>
  </div>;
}
