import L from 'leaflet';
import type { SmhiWeatherData } from '../../services/smhiForecast';
import { destinationPoint, downwindDirection } from '../WeatherMapPanel/wind';

export function createScentLayer(lat: number, lon: number, data: SmhiWeatherData, distance: number) {
    const { wind_from_direction: from, wind_speed: speed, wind_speed_of_gust: gust } = data;
    const direction = downwindDirection(from);
    const length = distance;
    const spreadAngle = Math.max(10, 32 - speed * 2 + Math.max(0, gust - speed));
    const end = destinationPoint(lat, lon, direction, length);
    const halfWidthAtEnd = Math.tan(spreadAngle * Math.PI / 180) * length;
    const left = destinationPoint(end[0], end[1], direction - 90, halfWidthAtEnd);
    const right = destinationPoint(end[0], end[1], direction + 90, halfWidthAtEnd);
    const renderer = L.svg();
    const layers: L.Layer[] = [L.polygon([[lat, lon], left, end, right], {
      color: '#f2b66d', fillColor: '#e9893d', fillOpacity: 0.025, opacity: 0.55, weight: 1.5,
      dashArray: '5 9', className: 'scent-plume-boundary', renderer, interactive: false,
    })];

    const bandCount = 12;
    let previousLeft: [number, number] = [lat, lon];
    let previousRight: [number, number] = [lat, lon];
    for (let index = 0; index < bandCount; index += 1) {
      const progress = (index + 1) / bandCount;
      const center = destinationPoint(lat, lon, direction, length * progress);
      const halfWidth = Math.tan(spreadAngle * Math.PI / 180) * length * progress;
      const bandLeft = destinationPoint(center[0], center[1], direction - 90, halfWidth);
      const bandRight = destinationPoint(center[0], center[1], direction + 90, halfWidth);
      layers.push(L.polygon([previousLeft, bandLeft, bandRight, previousRight], {
        stroke: false, renderer, interactive: false,
        fillColor: index < 3 ? '#f0a157' : '#e9893d',
        fillOpacity: 0.5 * Math.pow(1 - index / bandCount, 1.45) + 0.025,
        className: `scent-band scent-band-${index + 1}`,
      }));
      previousLeft = bandLeft;
      previousRight = bandRight;
    }
    const line = L.polyline([[lat, lon], end], {
      color: '#eadcc0', opacity: 0.65, weight: 1.5, dashArray: '4 10', className: 'scent-direction-line', renderer, interactive: false,
    });

    const group = L.featureGroup([...layers, line]);
    group.on('remove', () => renderer.remove());
    return group;
}

