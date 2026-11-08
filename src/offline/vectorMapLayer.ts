import L from 'leaflet';
import { VectorTile } from '@mapbox/vector-tile';
import { PbfReader } from 'pbf';
import { OFFLINE_ATTRIBUTION, type MapPackage } from './mapPackages';

// Small local canvas renderer; no remote styles, glyphs, sprites or network calls.
// The map is deliberately simpler than OpenTopoMap and has no elevation contours.
export function offlineMapLayer(pack: MapPackage) {
  const OfflineLayer = L.GridLayer.extend({
    createTile(coords: L.Coords, done: L.DoneCallback) {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.height = 256 * ratio;
      const context = canvas.getContext('2d');
      queueMicrotask(() => {
        if (!context) { done(new Error('Kartan kunde inte ritas.'), canvas); return; }
        context.scale(ratio, ratio);
        context.fillStyle = '#ede9d9'; context.fillRect(0, 0, 256, 256);
        const bytes = pack.tiles[`${coords.z}/${coords.x}/${coords.y}`];
        if (!bytes) { done(undefined, canvas); return; }
        try {
          const tile = new VectorTile(new PbfReader(bytes));
          for (const name of ['landcover', 'landuse', 'water', 'waterway', 'building', 'transportation', 'place']) {
            const layer = tile.layers[name];
            if (!layer) continue;
            for (let index = 0; index < layer.length; index += 1) {
              const feature = layer.feature(index);
              const geometry = feature.loadGeometry();
              const scale = 256 / feature.extent;
              if (name === 'place') {
                if (index > 30 || !geometry[0]?.[0]) continue;
                const label = String(feature.properties['name:sv'] ?? feature.properties.name ?? '').slice(0, 60);
                context.font = '11px system-ui'; context.textAlign = 'center';
                context.lineWidth = 3; context.strokeStyle = '#fff'; context.fillStyle = '#24352c';
                const point = geometry[0][0];
                context.strokeText(label, point.x * scale, point.y * scale);
                context.fillText(label, point.x * scale, point.y * scale); continue;
              }
              context.beginPath();
              for (const ring of geometry) {
                ring.forEach((point, i) => i ? context.lineTo(point.x * scale, point.y * scale) : context.moveTo(point.x * scale, point.y * scale));
                if (feature.type === 3) context.closePath();
              }
              const classification = feature.properties.class;
              if (feature.type === 3) {
                context.fillStyle = name === 'water' ? '#9cc8d6' : name === 'building' ? '#b3aaa1' : classification === 'wood' || classification === 'forest' ? '#b5cba5' : classification === 'wetland' ? '#c5d8ca' : '#d6dabe';
                context.fill('evenodd');
              } else {
                context.strokeStyle = name === 'waterway' ? '#85b7cd' : classification === 'path' || classification === 'track' ? '#8d785f' : '#ffffff';
                context.lineWidth = name === 'transportation' ? 2 : 1;
                context.setLineDash(classification === 'path' ? [3, 2] : []);
                context.stroke(); context.setLineDash([]);
              }
            }
          }
          done(undefined, canvas);
        } catch { done(new Error('Kartrutan kunde inte läsas.'), canvas); }
      });
      return canvas;
    },
  }) as { new(options: L.GridLayerOptions): L.GridLayer };
  return new OfflineLayer({
    tileSize: 256, minZoom: pack.minZoom, maxZoom: 19, maxNativeZoom: pack.maxZoom, noWrap: true,
    bounds: [[pack.bounds[1], pack.bounds[0]], [pack.bounds[3], pack.bounds[2]]], attribution: OFFLINE_ATTRIBUTION,
  });
}
