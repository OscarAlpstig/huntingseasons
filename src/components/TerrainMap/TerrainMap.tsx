import { useEffect, useId, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BASE_LAYERS, DEFAULT_BASE_LAYER, type BaseLayerId } from './baseLayers';
import { createSelectedMarker } from './markers';
import { useGeolocation } from './useGeolocation';
import type { MapOverlay } from './overlays';
import OfflineMaps from '../../offline/OfflineMaps';
import { listMapPackages, type MapPackage } from '../../offline/mapPackages';
import { readPreference, writePreference } from '../../offline/preferences';
import { useConnection } from '../../offline/connection';

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
  const [savedMap, setSavedMap] = useState<MapPackage | null>(null);
  const [showSavedMap, setShowSavedMap] = useState(false);
  const [outside, setOutside] = useState(false);
  const online = useConnection();
  const id = useId();
  const { locate, loading, error } = useGeolocation((latitude, longitude) => {
    callback.current(latitude, longitude);
    map?.setView([latitude, longitude], Math.max(map.getZoom(), 14));
  });

  useEffect(() => {
    let active = true;
    void listMapPackages().then((packs) => {
      const pack = packs.find((item) => item.id === readPreference('map-id', ''));
      if (active && pack) { setSavedMap(pack); setShowSavedMap(true); }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

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
    let stopped = false;
    let tiles: L.Layer | undefined;
    setTileError(false);
    if (showSavedMap && savedMap) {
      void import('../../offline/vectorMapLayer').then(({ offlineMapLayer }) => {
        if (stopped) return;
        const savedTiles = offlineMapLayer(savedMap);
        tiles = savedTiles;
        savedTiles.on('tileerror', () => setTileError(true));
        savedTiles.addTo(map);
      }).catch(() => { if (!stopped) setTileError(true); });
      return () => { stopped = true; tiles?.remove(); tiles?.off(); };
    }
    const configuration = BASE_LAYERS[baseLayer];
    // Online-only services are never prefetched or cached by our service worker.
    if (!online) return;
    const onlineTiles = L.tileLayer(configuration.url, configuration.options);
    let failed = false;
    onlineTiles.on('loading', () => { failed = false; });
    onlineTiles.on('tileerror', () => { failed = true; setTileError(true); });
    onlineTiles.on('load', () => setTileError(failed));
    onlineTiles.addTo(map);
    return () => { onlineTiles.remove(); onlineTiles.off(); };
  }, [map, baseLayer, savedMap, showSavedMap, online]);

  useEffect(() => {
    if (!map) return;
    const update = () => {
      if (!showSavedMap || !savedMap) { setOutside(false); return; }
      const [west, south, east, north] = savedMap.bounds;
      setOutside(!L.latLngBounds([[south, west], [north, east]]).contains(map.getBounds()) || map.getZoom() < savedMap.minZoom);
    };
    update(); map.on('moveend zoomend', update);
    return () => { map.off('moveend zoomend', update); };
  }, [map, showSavedMap, savedMap]);

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
        <select id={`${id}-base`} value={showSavedMap ? 'saved' : baseLayer} onChange={(event) => {
          const saved = event.target.value === 'saved'; setShowSavedMap(saved);
          writePreference('map-id', saved ? savedMap?.id ?? '' : '');
          if (!saved) setBaseLayer(event.target.value as BaseLayerId);
        }}>
          {Object.entries(BASE_LAYERS).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
          {savedMap && <option value="saved">Sparad karta</option>}
        </select>
        {overlays.length > 0 && <fieldset><legend>Egna lager</legend>
          {overlays.map(({ id: overlayId, label }) => <label key={overlayId}>
            <input type="checkbox" checked={!hiddenOverlays.includes(overlayId)} onChange={(event) => setHiddenOverlays((hidden) => event.target.checked ? hidden.filter((value) => value !== overlayId) : [...hidden, overlayId])} /> {label}
          </label>)}
        </fieldset>}
        <OfflineMaps selectedId={showSavedMap ? savedMap?.id : undefined} onPreview={(bounds) => map?.fitBounds([[bounds[1], bounds[0]], [bounds[3], bounds[2]]], { padding: [32, 32] })} onSelect={(pack) => {
          setSavedMap(pack); setShowSavedMap(Boolean(pack)); writePreference('map-id', pack?.id ?? '');
          if (pack && map) {
            const bounds = L.latLngBounds([[pack.bounds[1], pack.bounds[0]], [pack.bounds[3], pack.bounds[2]]]);
            map.setView(bounds.getCenter(), Math.min(19, map.getBoundsZoom(bounds, true)));
          }
        }} />
      </details>
      <button type="button" className="map-locate" onClick={locate} disabled={loading} aria-label={loading ? 'Hämtar din position' : 'Använd min plats'} title="Använd min plats">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
      </button>
    </div>
    {(error || tileError || loading || outside || (!online && !showSavedMap)) && <div className="map-notice" role={error ? 'alert' : 'status'}>
      {error || (loading ? 'Hämtar din position…' : outside ? 'Vyn går utanför det sparade kartområdet eller detaljnivån. Zooma in eller välj ett annat sparat område.' : !online && !showSavedMap ? 'Den här baskartan kräver internet. Välj Sparad karta eller importera ett kartpaket under Kartlager.' : 'Delar av kartan kunde inte laddas. Byt kartlager eller försök igen senare.')}
    </div>}
    <span className="map-position">{lat.toFixed(5)}, {lon.toFixed(5)}</span>
  </div>;
}
